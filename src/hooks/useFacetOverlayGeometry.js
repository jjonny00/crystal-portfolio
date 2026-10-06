import { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { getOverlayImageByFacetKey } from '../data/projects';
import { loadOverlayImage } from '../loader/preloadOverlayImages';

const PROJECT_DISPLAY_SLOT = 'ProjectDisplay';
const EPSILON = 1e-5;

// The artwork is drawn by its own mesh laid over the ProjectDisplay face, not by
// swapping that face's material for it. Swapped in, the transparent artwork
// material left the face see-through while it faded — the inside of the facet
// showed — and the glass popped back once the fade finished. Layered on top, the
// face stays solid underneath and the artwork fades over it.
//
// The overlay mesh shares the facet mesh's geometry. On a multi-material mesh
// every group but ProjectDisplay gets this hidden material, which the renderer
// skips (an empty slot would also be skipped, but compile() and anything else
// walking the array would trip on it).
const HIDDEN_GROUP_MATERIAL = new THREE.MeshBasicMaterial({ visible: false });
const NO_RAYCAST = () => {};

// The artwork fades over a fixed time and lands exactly on 0 or 1. It used to
// close a fraction of the remaining gap each frame, which never reaches 0, so it
// was cut off below 1% — and over dark glass 1% of a bright image is still a
// visible ghost, so the cut read as a pop. The case-study cut-out runs quicker:
// it has to finish in the moment before the case study covers the scene.
const FADE_SECONDS = 0.8;
const CUTOUT_FADE_SECONDS = 0.45;
const easeFade = (t) => t * t * (3 - 2 * t);

const faceMaterialOf = (slot) => {
  const materials = Array.isArray(slot.mesh.material) ? slot.mesh.material : [slot.mesh.material];
  return materials[slot.materialIndex ?? 0];
};

// Hides or restores the face itself, under the artwork. Only the case study
// does this: with the face gone, the faded-out artwork leaves the fragment open.
const setFaceHidden = (slot, hidden) => {
  slot.faceHidden = hidden;
  ensureMaterialAssignment(
    slot.mesh,
    slot.materialIndex,
    hidden ? HIDDEN_GROUP_MATERIAL : slot.originalMaterial
  );
};

const createOverlayMesh = (mesh, materialIndex, overlayMaterial) => {
  let material = overlayMaterial;
  if (materialIndex != null) {
    const count = Math.max(
      materialIndex + 1,
      Array.isArray(mesh.material) ? mesh.material.length : 1
    );
    material = new Array(count).fill(HIDDEN_GROUP_MATERIAL);
    material[materialIndex] = overlayMaterial;
  }

  const overlayMesh = new THREE.Mesh(mesh.geometry, material);
  overlayMesh.name = `${mesh.name || 'facet'}__projectOverlay`;
  overlayMesh.userData.isOverlay = true;
  // Picks belong to the face beneath, which is the same shape.
  overlayMesh.raycast = NO_RAYCAST;
  overlayMesh.frustumCulled = mesh.frustumCulled;
  overlayMesh.castShadow = false;
  overlayMesh.receiveShadow = false;
  overlayMesh.visible = false;
  mesh.add(overlayMesh);
  return overlayMesh;
};

const removeOverlayMesh = (slot) => {
  slot?.overlayMesh?.removeFromParent();
};

// Shows or hides a slot's artwork. The face's own material is never touched.
export const setOverlaySlotShown = (slot, shown) => {
  if (!slot) return;
  slot.isActive = shown;
  if (!slot.overlayMesh) return;
  // Follow the facet's geometry (the flat-normals toggle swaps it).
  if (slot.overlayMesh.geometry !== slot.mesh.geometry) {
    slot.overlayMesh.geometry = slot.mesh.geometry;
  }
  slot.overlayMesh.visible = shown;
};

// For code that re-applies a facet's material: keeps a cut-out face cut out.
export const reassertOverlayFace = (slot) => {
  if (slot?.faceHidden) setFaceHidden(slot, true);
};

// Drops a slot straight back to rest: artwork off, face back.
export const resetOverlaySlot = (slot) => {
  if (!slot) return;
  slot.targetOpacity = 0;
  slot.fadeLevel = 0;
  slot.currentOpacity = 0;
  slot.cutout = false;
  if (slot.overlayMaterial) slot.overlayMaterial.opacity = 0;
  if (slot.faceHidden) setFaceHidden(slot, false);
  setOverlaySlotShown(slot, false);
};

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
            // Usually already loaded: boot starts these (preloadOverlayImages).
            const image = await loadOverlayImage(imagePath);

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
  }, [facetKeys]);

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
        if (candidate || !child.isMesh || child.userData?.isOverlay) return;

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
      const previousLevel = existingSlot?.fadeLevel ?? previousOpacity;
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
          overlayMaterial.dispose();
        }

        overlayMaterial = new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: wasActive ? previousOpacity : 0,
          map: overlayTexture,
        });

        overlayMaterial.depthWrite = false;
        overlayMaterial.depthTest = true;
        // Drawn on the face's own triangles: pull it toward the camera so it
        // never z-fights the face beneath.
        overlayMaterial.polygonOffset = true;
        overlayMaterial.polygonOffsetFactor = -1;
        overlayMaterial.polygonOffsetUnits = -1;
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
        overlayMesh: null,
        overlayTexture,
        bounds,
        targetOpacity: previousTarget,
        // fadeLevel runs linearly 0..1; currentOpacity is it eased (easeFade).
        fadeLevel: previousLevel,
        currentOpacity: previousOpacity,
        isActive: wasActive,
        cutout: existingSlot?.cutout ?? false,
        faceHidden: false,
        keepBaseMapDetached: true,
      };

      // A fresh overlay mesh each registration: cheap (no GPU resources of its
      // own), and it picks up a changed mesh, slot index or material.
      removeOverlayMesh(existingSlot);
      slot.overlayMesh = createOverlayMesh(mesh, materialIndex, overlayMaterial);

      overlaySlotsRef.current.set(facetKey, slot);

      // Ensure project artwork is rendered only by overlayMaterial so it can
      // fade independently from the base tinted facet. Only the map comes off:
      // the facet material's transparency is the crystal's as authored, and
      // forcing it opaque here (or at the end of a fade) switched the face to a
      // different render path — double-sided transparent draws back faces first —
      // which read as a pop.
      if (slot.keepBaseMapDetached && slot.originalMaterial?.map) {
        slot.originalMaterial.map = null;
        slot.originalMaterial.needsUpdate = true;
      }

      // The face keeps its own material, the artwork riding on top — unless a
      // case study had it cut out, which a re-registration mid case study keeps.
      const keepFaceHidden =
        existingSlot?.faceHidden &&
        existingSlot.mesh === mesh &&
        existingSlot.materialIndex === materialIndex;
      setFaceHidden(slot, Boolean(keepFaceHidden));
      slot.overlayMaterial.opacity = slot.currentOpacity;
      setOverlaySlotShown(slot, slot.isActive);

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
      setOverlaySlotShown(slot, true);
    }
  }, []);

  // The case study's project has its face cut out (see setFaceHidden); every
  // other slot is a plain overlay. Called each frame with the current one.
  const setOverlayCutout = useCallback((facetKey) => {
    overlaySlotsRef.current.forEach((slot, key) => {
      slot.cutout = key === facetKey;
    });
  }, []);

  const updateOverlays = useCallback((deltaTime, options = {}) => {
    const forceHide = options?.forceHide === true;

    overlaySlotsRef.current.forEach((slot) => {
      if (!slot.mesh) return;

      if (forceHide) {
        if (slot.isActive || slot.faceHidden || slot.fadeLevel > 0) {
          slot.fadeLevel = 0;
          slot.currentOpacity = 0;
          slot.overlayMaterial.opacity = 0;
          if (slot.faceHidden) setFaceHidden(slot, false);
          setOverlaySlotShown(slot, false);
        }
        return;
      }

      // Where the artwork is headed. A case study cuts the face out: the artwork
      // comes fully up over the face, the face is hidden under it (unseen, the
      // artwork covers it), then the artwork fades away and leaves the fragment
      // open. Leaving runs it backwards — the face returns once the artwork is
      // fully back over it. Leaving the project from its case study (back to the
      // overview, say) brings the face straight back: the case study is still
      // covering the scene then.
      let target = slot.targetOpacity > 0 ? 1 : 0;
      if (slot.cutout) {
        if (!slot.faceHidden && slot.fadeLevel >= 1) setFaceHidden(slot, true);
        target = slot.faceHidden ? 0 : 1;
      } else if (slot.faceHidden && (target === 0 || slot.fadeLevel >= 1)) {
        setFaceHidden(slot, false);
      }
      // A facet material re-application puts the face back; keep it cut out.
      if (slot.faceHidden && faceMaterialOf(slot) !== HIDDEN_GROUP_MATERIAL) {
        setFaceHidden(slot, true);
      }

      if (!slot.isActive && target === 0 && slot.fadeLevel === 0) return;
      // Shown (again) — this also keeps it on the facet's current geometry.
      setOverlaySlotShown(slot, true);

      const seconds = slot.cutout || slot.faceHidden ? CUTOUT_FADE_SECONDS : FADE_SECONDS;
      const step = deltaTime / seconds;
      slot.fadeLevel = target > slot.fadeLevel
        ? Math.min(target, slot.fadeLevel + step)
        : Math.max(target, slot.fadeLevel - step);
      slot.currentOpacity = easeFade(slot.fadeLevel);
      // Opacity is a uniform: no needsUpdate (that re-checks the program).
      slot.overlayMaterial.opacity = slot.currentOpacity;

      // Off only once it has actually reached nothing.
      if (target === 0 && slot.fadeLevel === 0) {
        setOverlaySlotShown(slot, false);
        if (slot.keepBaseMapDetached && slot.originalMaterial.map) {
          slot.originalMaterial.map = null;
          slot.originalMaterial.needsUpdate = true;
        }
      }
    });
  }, []);

  const cleanup = useCallback(() => {
    overlaySlotsRef.current.forEach((slot) => {
      if (slot.faceHidden) setFaceHidden(slot, false);
      removeOverlayMesh(slot);

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
    setOverlayCutout,
    updateOverlays,
    cleanup,
    overlaySlots: overlaySlotsRef.current,
  };
};
