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

const patchOverlayBlend = (material) => {
  if (!material || typeof material !== 'object') {
    return null;
  }

  const existing = material.userData?.overlayBlend;
  if (existing?.uniforms) {
    return existing.uniforms;
  }

  const uniforms = {
    overlayMap: { value: null },
    overlayOpacity: { value: 0 },
  };

  const previousOnBeforeCompile = material.onBeforeCompile;
  const previousCustomProgramCacheKey = material.customProgramCacheKey;

  material.onBeforeCompile = function onBeforeCompile(shader, ...args) {
    if (typeof previousOnBeforeCompile === 'function') {
      previousOnBeforeCompile.call(this, shader, ...args);
    }

    shader.uniforms.overlayMap = uniforms.overlayMap;
    shader.uniforms.overlayOpacity = uniforms.overlayOpacity;

    if (!shader.fragmentShader.includes('overlayOpacity')) {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `#include <common>\nuniform sampler2D overlayMap;\nuniform float overlayOpacity;\n`
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `#include <map_fragment>\n#if defined( USE_UV )\n  if (overlayOpacity > 0.0) {\n    vec2 overlayUv;\n    #ifdef USE_MAP\n      overlayUv = vMapUv;\n    #else\n      overlayUv = vUv;\n    #endif\n    vec4 overlaySample = texture2D(overlayMap, overlayUv);\n    overlaySample = mapTexelToLinear(overlaySample);\n    float overlayAlpha = overlaySample.a * overlayOpacity;\n    diffuseColor.rgb = mix(diffuseColor.rgb, overlaySample.rgb, overlayAlpha);\n  }\n#endif\n`
      );
    }
  };

  material.customProgramCacheKey = function customProgramCacheKey() {
    const baseKey = typeof previousCustomProgramCacheKey === 'function'
      ? previousCustomProgramCacheKey.call(this)
      : typeof previousCustomProgramCacheKey === 'string'
        ? previousCustomProgramCacheKey
        : '';
    return baseKey ? `${baseKey}|overlayBlend` : 'overlayBlend';
  };

  if (!material.userData) {
    material.userData = {};
  }

  material.userData.overlayBlend = { uniforms };
  material.needsUpdate = true;

  return uniforms;
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
          };

          return true;
        });
      });

      if (!candidate) {
        console.warn(`❌ No ProjectDisplay slot found for facet ${facetKey}`);
        return null;
      }

      const { mesh, materialIndex, baseMaterial, bounds } = candidate;

      const overlayUniforms = patchOverlayBlend(baseMaterial);

      if (!overlayUniforms) {
        console.warn(`❌ Unable to patch overlay blend for facet ${facetKey}`);
        return null;
      }

      ensureMaterialAssignment(mesh, materialIndex, baseMaterial);

      const canvas = getOrCreateCanvas(image, bounds.aspect || 1);
      if (!canvas) {
        console.warn(`❌ Unable to prepare overlay canvas for facet ${facetKey}`);
        return null;
      }

      let overlayTexture = existingSlot?.overlayTexture || null;
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

      const previousOpacity = baseMaterialChanged
        ? 0
        : existingSlot?.overlayUniforms?.overlayOpacity?.value ?? 0;
      const previousTarget = baseMaterialChanged ? 0 : existingSlot?.targetOpacity ?? 0;

      overlayUniforms.overlayMap.value = overlayTexture;
      overlayUniforms.overlayOpacity.value = previousOpacity;

      const slot = {
        facetKey,
        mesh,
        materialIndex,
        originalMaterial: baseMaterial,
        overlayTexture,
        overlayUniforms,
        bounds,
        targetOpacity: previousTarget,
        currentOpacity: previousOpacity,
      };

      overlaySlotsRef.current.set(facetKey, slot);

      return slot;
    },
    [getOrCreateCanvas, overlayImages]
  );

  const setOverlayVisibility = useCallback((facetKey, visible) => {
    const slot = overlaySlotsRef.current.get(facetKey);
    if (!slot) return;

    slot.currentOpacity = slot.overlayUniforms.overlayOpacity.value;
    slot.targetOpacity = visible ? 1 : 0;
  }, []);

  const updateOverlays = useCallback((deltaTime) => {
    overlaySlotsRef.current.forEach((slot) => {
      if (!slot.mesh || !slot.overlayUniforms) return;

      const speed = 3.0;
      const lerpAlpha = Math.min(deltaTime * speed, 1);
      const newOpacity = THREE.MathUtils.lerp(slot.currentOpacity, slot.targetOpacity, lerpAlpha);

      slot.currentOpacity = newOpacity;
      slot.overlayUniforms.overlayOpacity.value = newOpacity;
    });
  }, []);

  const cleanup = useCallback(() => {
    overlaySlotsRef.current.forEach((slot) => {
      if (slot.overlayTexture) {
        slot.overlayTexture.dispose();
      }

      if (slot.overlayUniforms) {
        slot.overlayUniforms.overlayOpacity.value = 0;
        slot.overlayUniforms.overlayMap.value = null;
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
