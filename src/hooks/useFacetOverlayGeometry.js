import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { getOverlayImageByFacetKey } from '../data/projects';

const PROJECT_DISPLAY_SLOT = 'ProjectDisplay';
const EPSILON = 1e-5;

const ensureMaterialAssignment = (mesh, materialIndex, material) => {
  if (materialIndex != null) {
    const current = Array.isArray(mesh.material) ? mesh.material.slice() : [mesh.material];
    current[materialIndex] = material;
    mesh.material = current;
    current.forEach((mat) => {
      if (mat && typeof mat === 'object') {
        mat.needsUpdate = true;
      }
    });
  } else {
    mesh.material = material;
    if (material) {
      material.needsUpdate = true;
    }
  }
};

const computeSlotUVBounds = (geometry, materialIndex) => {
  if (!geometry) return null;

  const uvAttr = geometry.getAttribute('uv');
  if (!uvAttr) return null;

  const indexAttr = geometry.index;
  const hasGroups = Array.isArray(geometry.groups) && geometry.groups.length > 0;

  const groups = hasGroups
    ? geometry.groups.filter((group) =>
        materialIndex == null ? true : group.materialIndex === materialIndex
      )
    : [
        {
          start: 0,
          count: indexAttr ? indexAttr.count : uvAttr.count,
        },
      ];

  if (!groups.length) return null;

  let minU = Infinity;
  let minV = Infinity;
  let maxU = -Infinity;
  let maxV = -Infinity;

  const pushVertex = (vertexIndex) => {
    const u = uvAttr.getX(vertexIndex);
    const v = uvAttr.getY(vertexIndex);

    minU = Math.min(minU, u);
    maxU = Math.max(maxU, u);
    minV = Math.min(minV, v);
    maxV = Math.max(maxV, v);
  };

  groups.forEach(({ start, count }) => {
    if (indexAttr) {
      for (let i = start; i < start + count; i += 1) {
        const vertexIndex = indexAttr.array[i];
        pushVertex(vertexIndex);
      }
    } else {
      for (let i = start; i < start + count; i += 1) {
        pushVertex(i);
      }
    }
  });

  if (!isFinite(minU) || !isFinite(minV) || !isFinite(maxU) || !isFinite(maxV)) {
    return null;
  }

  const width = maxU - minU;
  const height = maxV - minV;

  if (width < EPSILON || height < EPSILON) {
    return null;
  }

  return {
    minU,
    minV,
    maxU,
    maxV,
    width,
    height,
    aspect: width / height,
  };
};

const rotateImage90CounterClockwise = (image) => {
  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  canvas.width = image.height;
  canvas.height = image.width;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.translate(0, canvas.height);
  ctx.rotate(-Math.PI / 2);
  ctx.drawImage(image, 0, 0);

  return canvas;
};

const createCoverCanvas = (rotatedCanvas, targetAspect) => {
  if (!rotatedCanvas || typeof document === 'undefined') return null;

  const overlayAspect = rotatedCanvas.width / rotatedCanvas.height;
  const aspect = targetAspect > 0 ? targetAspect : overlayAspect;

  let canvasWidth = rotatedCanvas.width;
  let canvasHeight = rotatedCanvas.height;

  if (overlayAspect > aspect) {
    canvasHeight = rotatedCanvas.height;
    canvasWidth = Math.max(1, Math.round(canvasHeight * aspect));
  } else {
    canvasWidth = rotatedCanvas.width;
    canvasHeight = Math.max(1, Math.round(canvasWidth / aspect));
  }

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const scale = Math.max(canvas.width / rotatedCanvas.width, canvas.height / rotatedCanvas.height);
  const drawWidth = rotatedCanvas.width * scale;
  const drawHeight = rotatedCanvas.height * scale;
  const offsetX = (canvas.width - drawWidth) / 2;
  const offsetY = (canvas.height - drawHeight) / 2;

  ctx.drawImage(rotatedCanvas, offsetX, offsetY, drawWidth, drawHeight);

  return canvas;
};

const configureOverlayTexture = (texture, bounds, referenceMaterial) => {
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.flipY = false;
  texture.colorSpace = THREE.SRGBColorSpace;

  if (referenceMaterial?.map) {
    texture.minFilter = referenceMaterial.map.minFilter;
    texture.magFilter = referenceMaterial.map.magFilter;
    texture.anisotropy = referenceMaterial.map.anisotropy;
  } else {
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
  }

  texture.repeat.set(bounds.width, bounds.height);
  texture.offset.set(bounds.minU, bounds.minV);
  texture.needsUpdate = true;
};

export const useFacetOverlayGeometry = (facetKeys) => {
  const [overlayImages, setOverlayImages] = useState(new Map());
  const [isReady, setIsReady] = useState(false);
  const overlaySlotsRef = useRef(new Map());
  const canvasCacheRef = useRef(new Map());

  const imageLoader = useMemo(() => {
    const loader = new THREE.ImageLoader();
    if (loader && loader.setCrossOrigin) {
      loader.setCrossOrigin('anonymous');
    }
    return loader;
  }, []);

  useEffect(() => {
    let cancelled = false;

    setIsReady(false);
    setOverlayImages(new Map());
    canvasCacheRef.current.clear();
    overlaySlotsRef.current.clear();

    const loadImages = async () => {
      const entries = await Promise.all(
        facetKeys.map(async (facetKey) => {
          const imagePath = getOverlayImageByFacetKey(facetKey);
          if (!imagePath) return [facetKey, null];

          try {
            const image = await new Promise((resolve, reject) => {
              imageLoader.load(
                imagePath,
                (img) => resolve(img),
                undefined,
                (err) => reject(err)
              );
            });

            if (cancelled) return [facetKey, null];

            return [facetKey, image];
          } catch (error) {
            console.warn(`❌ Failed to load overlay image for ${facetKey}:`, error);
            return [facetKey, null];
          }
        })
      );

      if (cancelled) return;

      const map = new Map();
      entries.forEach(([facetKey, image]) => {
        if (image) {
          map.set(facetKey, image);
          console.log(`✅ Loaded overlay image for ${facetKey}`);
        }
      });

      setOverlayImages(map);
      setIsReady(true);
    };

    loadImages();

    return () => {
      cancelled = true;
    };
  }, [facetKeys, imageLoader]);

  const getOrCreateCanvas = useCallback((image, slotAspect) => {
    const aspect = Number.isFinite(slotAspect) ? slotAspect : 1;
    const cacheKey = `${image.src || image.currentSrc || ''}|${aspect.toFixed(4)}`;
    if (canvasCacheRef.current.has(cacheKey)) {
      return canvasCacheRef.current.get(cacheKey);
    }

    const rotated = rotateImage90CounterClockwise(image);
    if (!rotated) return null;

    const canvas = createCoverCanvas(rotated, aspect);
    if (canvas) {
      canvasCacheRef.current.set(cacheKey, canvas);
    }
    return canvas;
  }, []);

  const registerOverlaySlot = useCallback(
    (facetRef, facetKey) => {
      if (!facetRef?.current) return null;
      if (overlaySlotsRef.current.has(facetKey)) {
        return overlaySlotsRef.current.get(facetKey);
      }

      const image = overlayImages.get(facetKey);
      if (!image) return null;

      let registeredSlot = null;

      facetRef.current.traverse((child) => {
        if (registeredSlot || !child.isMesh) return;

        const isArrayMaterial = Array.isArray(child.material);
        const materials = isArrayMaterial ? child.material : [child.material];
        const originalInfo = child.userData?.__originalMaterialInfo;
        const originalSlots = originalInfo?.slots || [];
        const originalSlotCount = originalSlots.length;
        const materialsCount = materials.length;

        const candidateIndices = originalSlots
          .filter((slot) => (slot.name || slot.slotId) === PROJECT_DISPLAY_SLOT)
          .map((slot) => slot.index);

        const indicesToCheck = candidateIndices.length
          ? candidateIndices
          : materials.map((_, index) => index);

        indicesToCheck.forEach((index) => {
          if (registeredSlot) return;

          if (!isArrayMaterial && index > 0) return;

          const material = isArrayMaterial ? materials[index] : materials[0];
          if (!material) return;

          const slotMeta = originalSlots.find((slot) => slot.index === index);
          const fallbackName = material.name || material.userData?.slotId;
          const slotName = slotMeta?.name || slotMeta?.slotId || fallbackName;
          if (slotName !== PROJECT_DISPLAY_SLOT) return;

          const hasMultipleSlots = (originalSlotCount || materialsCount) > 1;
          const bounds = computeSlotUVBounds(child.geometry, hasMultipleSlots ? index : null);
          if (!bounds) {
            console.warn(`❌ Unable to compute UV bounds for ProjectDisplay slot on facet ${facetKey}`);
            return;
          }

          const canvas = getOrCreateCanvas(image, bounds.aspect || 1);
          if (!canvas) {
            console.warn(`❌ Unable to prepare overlay canvas for facet ${facetKey}`);
            return;
          }
          const overlayTexture = new THREE.CanvasTexture(canvas);
          configureOverlayTexture(overlayTexture, bounds, material);

          const overlayMaterial = material.clone();
          overlayMaterial.map = overlayTexture;
          overlayMaterial.transparent = true;
          overlayMaterial.opacity = 0;
          overlayMaterial.depthWrite = false;
          overlayMaterial.color.set(0xffffff);
          overlayMaterial.emissive.set(0x000000);
          overlayMaterial.emissiveIntensity = 0;
          overlayMaterial.metalness = 0;
          overlayMaterial.roughness = 1;
          overlayMaterial.metalnessMap = null;
          overlayMaterial.roughnessMap = null;
          overlayMaterial.normalMap = null;
          overlayMaterial.aoMap = null;
          overlayMaterial.emissiveMap = null;
          overlayMaterial.needsUpdate = true;

          if (overlayMaterial.alphaMap == null && overlayTexture) {
            overlayMaterial.alphaMap = overlayTexture;
            overlayMaterial.alphaMap.needsUpdate = true;
          }

          registeredSlot = {
            facetKey,
            mesh: child,
            materialIndex: isArrayMaterial ? index : null,
            originalMaterial: material,
            originalOpacity: material.opacity ?? 1,
            originalTransparent: material.transparent ?? false,
            originalMap: material.map || null,
            originalMapTransform:
              material.map
                ? {
                    offset: material.map.offset.clone(),
                    repeat: material.map.repeat.clone(),
                    rotation: material.map.rotation ?? 0,
                    center: material.map.center ? material.map.center.clone() : new THREE.Vector2(0.5, 0.5),
                  }
                : null,
            overlayMaterial,
            overlayTexture,
            bounds,
            targetOpacity: 0,
            currentOpacity: 0,
            isActive: false,
          };

          overlaySlotsRef.current.set(facetKey, registeredSlot);
        });
      });

      if (!registeredSlot) {
        console.warn(`❌ No ProjectDisplay slot found for facet ${facetKey}`);
      }

      return registeredSlot;
    },
    [getOrCreateCanvas, overlayImages]
  );

  const setOverlayVisibility = useCallback((facetKey, visible) => {
    const slot = overlaySlotsRef.current.get(facetKey);
    if (!slot) return;

    slot.targetOpacity = visible ? 1 : 0;

    if (visible && !slot.isActive) {
      slot.overlayMaterial.opacity = slot.currentOpacity;
      ensureMaterialAssignment(slot.mesh, slot.materialIndex, slot.overlayMaterial);
      slot.isActive = true;
    }
  }, []);

  const updateOverlays = useCallback((deltaTime) => {
    overlaySlotsRef.current.forEach((slot) => {
      if (!slot.mesh) return;

      if (!slot.isActive && slot.targetOpacity <= 0) {
        slot.currentOpacity = 0;
        return;
      }

      if (!slot.isActive && slot.targetOpacity > 0) {
        slot.overlayMaterial.opacity = slot.currentOpacity;
        ensureMaterialAssignment(slot.mesh, slot.materialIndex, slot.overlayMaterial);
        slot.isActive = true;
      }

      const speed = 3.0;
      const lerpAlpha = Math.min(deltaTime * speed, 1);
      const newOpacity = THREE.MathUtils.lerp(slot.currentOpacity, slot.targetOpacity, lerpAlpha);

      slot.currentOpacity = newOpacity;

      if (slot.isActive) {
        slot.overlayMaterial.opacity = newOpacity;
        slot.overlayMaterial.needsUpdate = true;
      }

      if (slot.isActive && slot.targetOpacity === 0 && newOpacity <= 0.01) {
        ensureMaterialAssignment(slot.mesh, slot.materialIndex, slot.originalMaterial);
        slot.overlayMaterial.opacity = 0;
        slot.isActive = false;
        slot.currentOpacity = 0;
        slot.originalMaterial.transparent = slot.originalTransparent;
        slot.originalMaterial.opacity = slot.originalOpacity;
        slot.originalMaterial.needsUpdate = true;

        if (slot.originalMaterial.map && slot.originalMapTransform) {
          slot.originalMaterial.map.offset.copy(slot.originalMapTransform.offset);
          slot.originalMaterial.map.repeat.copy(slot.originalMapTransform.repeat);
          slot.originalMaterial.map.rotation = slot.originalMapTransform.rotation;
          if (slot.originalMaterial.map.center && slot.originalMapTransform.center) {
            slot.originalMaterial.map.center.copy(slot.originalMapTransform.center);
          }
          slot.originalMaterial.map.needsUpdate = true;
        }
      }
    });
  }, []);

  const cleanup = useCallback(() => {
    overlaySlotsRef.current.forEach((slot) => {
      if (slot.isActive) {
        ensureMaterialAssignment(slot.mesh, slot.materialIndex, slot.originalMaterial);
      }

      if (slot.overlayMaterial) {
        slot.overlayMaterial.dispose();
      }

      if (slot.overlayTexture) {
        slot.overlayTexture.dispose();
      }
    });

    overlaySlotsRef.current.clear();
    canvasCacheRef.current.clear();
  }, []);

  return {
    isReady,
    registerOverlaySlot,
    setOverlayVisibility,
    updateOverlays,
    cleanup,
    overlaySlots: overlaySlotsRef.current,
  };
};
