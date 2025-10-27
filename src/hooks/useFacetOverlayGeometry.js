import { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { getOverlayImageByFacetKey } from '../data/projects';

const PROJECT_DISPLAY_SLOT = 'ProjectDisplay';

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

export const useFacetOverlayGeometry = (facetKeys) => {
  const [overlayTextures, setOverlayTextures] = useState(new Map());
  const [isReady, setIsReady] = useState(false);
  const overlaySlotsRef = useRef(new Map());
  const texturesLoadedRef = useRef(false);

  // Load all overlay images
  useEffect(() => {
    if (texturesLoadedRef.current) return;
    texturesLoadedRef.current = true;

    const loadTextures = async () => {
      const loader = new THREE.TextureLoader();
      const textureMap = new Map();

      for (const facetKey of facetKeys) {
        const imagePath = getOverlayImageByFacetKey(facetKey);
        if (imagePath) {
          try {
            const texture = await loader.loadAsync(imagePath);

            // Configure texture
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(2, 2);
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.needsUpdate = true;

            textureMap.set(facetKey, texture);
            console.log(`✅ Loaded overlay image for ${facetKey}`);
          } catch (error) {
            console.warn(`❌ Failed to load overlay image for ${facetKey}:`, error);
          }
        }
      }

      setOverlayTextures(textureMap);
      setIsReady(true);
    };

    loadTextures();
  }, [facetKeys]);

  // Register the ProjectDisplay material slot for a facet
  const registerOverlaySlot = useCallback((facetRef, facetKey) => {
    if (!facetRef?.current || overlaySlotsRef.current.has(facetKey)) return null;

    const texture = overlayTextures.get(facetKey);
    if (!texture) return null;

    let registeredSlot = null;

    facetRef.current.traverse((child) => {
      if (registeredSlot || !child.isMesh) return;

      const materials = Array.isArray(child.material) ? child.material : [child.material];

      materials.forEach((material, index) => {
        if (registeredSlot || !material) return;

        const slotName = material.name || material.userData?.slotId;
        if (slotName !== PROJECT_DISPLAY_SLOT) return;

        const overlayMaterial = material.clone();
        overlayMaterial.map = texture;
        overlayMaterial.transparent = true;
        overlayMaterial.opacity = 0;
        overlayMaterial.depthWrite = false;
        overlayMaterial.needsUpdate = true;

        registeredSlot = {
          facetKey,
          mesh: child,
          materialIndex: Array.isArray(child.material) ? index : null,
          originalMaterial: material,
          originalOpacity: material.opacity ?? 1,
          originalTransparent: material.transparent ?? false,
          overlayMaterial,
          overlayTexture: texture,
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
  }, [overlayTextures]);

  // Set target opacity for a facet overlay
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

  // Animation update function (call in useFrame)
  const updateOverlays = useCallback((deltaTime) => {
    overlaySlotsRef.current.forEach((slot) => {
      const { targetOpacity, currentOpacity, isActive } = slot;

      if (!slot.mesh) return;

      if (!isActive && targetOpacity <= 0) {
        slot.currentOpacity = 0;
        return;
      }

      if (!slot.isActive && targetOpacity > 0) {
        slot.overlayMaterial.opacity = slot.currentOpacity;
        ensureMaterialAssignment(slot.mesh, slot.materialIndex, slot.overlayMaterial);
        slot.isActive = true;
      }

      const speed = 3.0;
      const lerpAlpha = Math.min(deltaTime * speed, 1);
      const newOpacity = THREE.MathUtils.lerp(currentOpacity, targetOpacity, lerpAlpha);

      slot.currentOpacity = newOpacity;

      if (slot.isActive) {
        slot.overlayMaterial.opacity = newOpacity;
        slot.overlayMaterial.needsUpdate = true;
      }

      if (slot.isActive && targetOpacity === 0 && newOpacity <= 0.01) {
        ensureMaterialAssignment(slot.mesh, slot.materialIndex, slot.originalMaterial);
        slot.overlayMaterial.opacity = 0;
        slot.isActive = false;
        slot.currentOpacity = 0;
        slot.originalMaterial.transparent = slot.originalTransparent;
        slot.originalMaterial.opacity = slot.originalOpacity;
      }
    });
  }, []);

  // Cleanup
  const cleanup = useCallback(() => {
    overlaySlotsRef.current.forEach((slot) => {
      if (slot.isActive) {
        ensureMaterialAssignment(slot.mesh, slot.materialIndex, slot.originalMaterial);
      }

      if (slot.overlayMaterial) {
        slot.overlayMaterial.dispose();
      }
    });

    overlaySlotsRef.current.clear();

    overlayTextures.forEach((texture) => {
      texture.dispose();
    });
  }, [overlayTextures]);

  return {
    isReady,
    registerOverlaySlot,
    setOverlayVisibility,
    updateOverlays,
    cleanup,
    overlaySlots: overlaySlotsRef.current,
  };
};
