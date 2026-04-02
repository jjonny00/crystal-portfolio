import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { getOverlayImageByFacetKey } from '../data/projects';

const PROJECT_DISPLAY_SLOT = 'ProjectDisplay';
const EPSILON = 1e-5;

const ensureMaterialAssignment = (mesh, materialIndex, material) => {
  if (!mesh) return;

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
    if (material && typeof material === 'object') {
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

const rotateImage90Clockwise = (image) => {
  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  canvas.width = image.height;
  canvas.height = image.width;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.translate(canvas.width, 0);
  ctx.rotate(Math.PI / 2);
  ctx.drawImage(image, 0, 0);

  return canvas;
};

const MAX_OVERLAY_TEXTURE_SIZE = 2048;

const createCoverCanvas = (rotatedCanvas, targetAspect) => {
  if (!rotatedCanvas || typeof document === 'undefined') return null;

  const overlayAspect = rotatedCanvas.width / rotatedCanvas.height;
  const aspect = targetAspect > 0 ? targetAspect : overlayAspect;

  let canvasWidth;
  let canvasHeight;

  if (overlayAspect >= aspect) {
    canvasHeight = rotatedCanvas.height;
    canvasWidth = Math.max(1, Math.round(canvasHeight * aspect));
  } else {
    canvasWidth = rotatedCanvas.width;
    canvasHeight = Math.max(1, Math.round(canvasWidth / aspect));
  }

  const largestDimension = Math.max(canvasWidth, canvasHeight);
  if (largestDimension > MAX_OVERLAY_TEXTURE_SIZE) {
    const scaleDown = MAX_OVERLAY_TEXTURE_SIZE / largestDimension;
    canvasWidth = Math.max(1, Math.round(canvasWidth * scaleDown));
    canvasHeight = Math.max(1, Math.round(canvasHeight * scaleDown));
  }

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const scale = Math.max(
    canvas.width / rotatedCanvas.width,
    canvas.height / rotatedCanvas.height
  );
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

  const repeatU = bounds.width > EPSILON ? 1 / bounds.width : 1;
  const repeatV = bounds.height > EPSILON ? 1 / bounds.height : 1;
  texture.repeat.set(repeatU, repeatV);
  texture.offset.set(-bounds.minU * repeatU, -bounds.minV * repeatV);
  texture.center.set(0, 0);
  texture.rotation = 0;
  texture.needsUpdate = true;
};

const snapshotTextureTransform = (texture) => {
  if (!texture) {
    return null;
  }

  return {
    offset: texture.offset.clone(),
    repeat: texture.repeat.clone(),
    rotation: texture.rotation ?? 0,
    center: texture.center ? texture.center.clone() : new THREE.Vector2(0.5, 0.5),
  };
};

const cloneStoredTransform = (transform) => {
  if (!transform) {
    return null;
  }

  return {
    offset: transform.offset.clone(),
    repeat: transform.repeat.clone(),
    rotation: transform.rotation ?? 0,
    center: transform.center ? transform.center.clone() : new THREE.Vector2(0.5, 0.5),
  };
};

const applyStoredTextureTransform = (texture, transform) => {
  if (!texture || !transform) return;

  texture.offset.copy(transform.offset);
  texture.repeat.copy(transform.repeat);
  texture.rotation = transform.rotation ?? 0;

  if (texture.center && transform.center) {
    texture.center.copy(transform.center);
  }

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

    const rotated = rotateImage90Clockwise(image);
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

      const image = overlayImages.get(facetKey);
      if (!image) return null;

      const existingSlot = overlaySlotsRef.current.get(facetKey) || null;
      let candidate = null;

      facetRef.current.traverse((child) => {
        if (candidate || !child.isMesh) return;

        const isArrayMaterial = Array.isArray(child.material);
        const materials = isArrayMaterial ? child.material : [child.material];
        const originalInfo = child.userData?.__originalMaterialInfo;
        const originalSlots = originalInfo?.slots || [];
        const materialCount = Math.max(originalSlots.length, materials.length);
        const storedProjectMap = originalInfo?.projectDisplayMap || null;
        const storedProjectTransform =
          originalInfo?.projectDisplayMapTransform || null;

        const preferredIndices = originalSlots
          .filter((slot) => (slot.name || slot.slotId) === PROJECT_DISPLAY_SLOT)
          .map((slot) => slot.index);

        const storedProjectDisplayIndex =
          typeof originalInfo?.projectDisplayIndex === 'number'
            ? originalInfo.projectDisplayIndex
            : null;

        if (
          preferredIndices.length === 0 &&
          storedProjectDisplayIndex !== null
        ) {
          preferredIndices.push(storedProjectDisplayIndex);
        }

        const indicesToCheck = preferredIndices.length
          ? preferredIndices
          : materials.map((_, index) => index);

        indicesToCheck.some((index) => {
          if (!isArrayMaterial && index > 0) {
            return false;
          }

          const materialIndex = isArrayMaterial ? index : null;
          const rawMaterial = isArrayMaterial ? materials[index] : materials[0];
          const slotMeta = originalSlots.find((slot) => slot.index === index);
          const fallbackName = rawMaterial?.name || rawMaterial?.userData?.slotId;
          const slotName = slotMeta?.name || slotMeta?.slotId || fallbackName;

          const nameMatches = slotName === PROJECT_DISPLAY_SLOT;
          const indexMatchesStored = storedProjectDisplayIndex === index;

          if (!nameMatches && !indexMatchesStored) {
            return false;
          }

          const previousSlotMatches =
            existingSlot &&
            existingSlot.mesh === child &&
            existingSlot.materialIndex === materialIndex;

          const baseMaterial = previousSlotMatches
            ? existingSlot.originalMaterial
            : rawMaterial;

          if (!baseMaterial) {
            return false;
          }

          if (!baseMaterial.map && storedProjectMap) {
            baseMaterial.map = storedProjectMap;
            if (storedProjectTransform) {
              applyStoredTextureTransform(baseMaterial.map, storedProjectTransform);
            } else {
              baseMaterial.map.needsUpdate = true;
            }
            baseMaterial.needsUpdate = true;
          }

          const bounds = computeSlotUVBounds(
            child.geometry,
            materialCount > 1 ? index : null
          );

          if (!bounds) {
            console.warn(
              `❌ Unable to compute UV bounds for ProjectDisplay slot on facet ${facetKey}`
            );
            return false;
          }

          candidate = {
            mesh: child,
            materialIndex,
            baseMaterial,
            bounds,
            storedProjectMap,
            storedProjectTransform,
          };

          return true;
        });
      });

      if (!candidate) {
        console.warn(`❌ No ProjectDisplay slot found for facet ${facetKey}`);
        return null;
      }

      const {
        mesh,
        materialIndex,
        baseMaterial,
        bounds,
        storedProjectMap,
        storedProjectTransform,
      } = candidate;

      const canvas = getOrCreateCanvas(image, bounds.aspect || 1);
      if (!canvas) {
        console.warn(`❌ Unable to prepare overlay canvas for facet ${facetKey}`);
        return null;
      }

      let overlayTexture = existingSlot?.overlayTexture || null;
      let overlayMaterial = existingSlot?.overlayMaterial || null;
      const previousOpacity = existingSlot?.currentOpacity ?? 0;
      const previousTarget = existingSlot?.targetOpacity ?? 0;
      const wasActive = existingSlot?.isActive ?? false;

      const baseMaterialChanged = baseMaterial !== existingSlot?.originalMaterial;
      const boundsChanged = existingSlot && existingSlot.bounds
        ? Math.abs(existingSlot.bounds.minU - bounds.minU) > EPSILON ||
          Math.abs(existingSlot.bounds.minV - bounds.minV) > EPSILON ||
          Math.abs(existingSlot.bounds.maxU - bounds.maxU) > EPSILON ||
          Math.abs(existingSlot.bounds.maxV - bounds.maxV) > EPSILON
        : false;

      if (!overlayTexture || baseMaterialChanged || boundsChanged) {
        if (overlayTexture) {
          overlayTexture.dispose();
        }
        overlayTexture = new THREE.CanvasTexture(canvas);
      }

      configureOverlayTexture(overlayTexture, bounds, baseMaterial);

      if (!overlayMaterial || baseMaterialChanged || boundsChanged) {
        if (overlayMaterial) {
          if (wasActive) {
            ensureMaterialAssignment(mesh, materialIndex, baseMaterial);
          }
          overlayMaterial.dispose();
        }

        overlayMaterial = new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: wasActive ? previousOpacity : 0,
          map: overlayTexture,
        });

        overlayMaterial.depthWrite = false;
        overlayMaterial.depthTest = true;
        overlayMaterial.toneMapped = false;
        overlayMaterial.side = baseMaterial.side ?? THREE.FrontSide;
      } else {
        overlayMaterial.map = overlayTexture;
      }

      overlayMaterial.alphaMap = null;
      overlayMaterial.opacity = wasActive ? previousOpacity : 0;
      overlayMaterial.needsUpdate = true;

      const fallbackMap = baseMaterial.map || storedProjectMap || null;
      const fallbackTransform = baseMaterial.map
        ? snapshotTextureTransform(baseMaterial.map)
        : storedProjectTransform
        ? cloneStoredTransform(storedProjectTransform)
        : null;

      const slot = {
        facetKey,
        mesh,
        materialIndex,
        originalMaterial: baseMaterial,
        originalOpacity: baseMaterial.opacity ?? 1,
        originalTransparent: baseMaterial.transparent ?? false,
        originalMap: fallbackMap,
        originalMapTransform: fallbackTransform,
        overlayMaterial,
        overlayTexture,
        bounds,
        targetOpacity: previousTarget,
        currentOpacity: previousOpacity,
        isActive: wasActive,
        keepBaseMapDetached: true,
      };

      overlaySlotsRef.current.set(facetKey, slot);

      // Ensure project artwork is rendered only by overlayMaterial so it can
      // fade independently from the base tinted facet.
      if (slot.keepBaseMapDetached && slot.originalMaterial?.map) {
        slot.originalMaterial.map = null;
        slot.originalMaterial.needsUpdate = true;
      }

      if (slot.isActive) {
        slot.overlayMaterial.opacity = slot.currentOpacity;
        ensureMaterialAssignment(slot.mesh, slot.materialIndex, slot.overlayMaterial);
      } else {
        ensureMaterialAssignment(slot.mesh, slot.materialIndex, slot.originalMaterial);
      }

      return slot;
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

  const updateOverlays = useCallback((deltaTime, options = {}) => {
    const forceHide = options?.forceHide === true;
    const forceHiddenFacetKey = options?.forceHiddenFacetKey || null;

    overlaySlotsRef.current.forEach((slot) => {
      if (!slot.mesh) return;

      if (forceHide) {
        slot.currentOpacity = 0;

        if (slot.isActive) {
          // Keep overlay material assigned, just hide it visually
          slot.overlayMaterial.opacity = 0;
          slot.overlayMaterial.needsUpdate = true;
        }

        return;
      }

      if (forceHiddenFacetKey && slot.facetKey === forceHiddenFacetKey) {
        slot.targetOpacity = 0;
      }

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
        if (!slot.keepBaseMapDetached) {
          if (!slot.originalMaterial.map && slot.originalMap) {
            slot.originalMaterial.map = slot.originalMap;
          }

          if (slot.originalMaterial.map && slot.originalMapTransform) {
            applyStoredTextureTransform(
              slot.originalMaterial.map,
              slot.originalMapTransform
            );
          } else if (slot.originalMaterial.map) {
            slot.originalMaterial.map.needsUpdate = true;
          }
        } else if (slot.originalMaterial.map) {
          slot.originalMaterial.map = null;
        }
        slot.originalMaterial.needsUpdate = true;
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

      if (slot.originalMaterial && slot.originalMap) {
        slot.originalMaterial.map = slot.originalMap;
        if (slot.originalMapTransform) {
          applyStoredTextureTransform(slot.originalMaterial.map, slot.originalMapTransform);
        } else {
          slot.originalMaterial.map.needsUpdate = true;
        }
        slot.originalMaterial.needsUpdate = true;
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
