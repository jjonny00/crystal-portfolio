import { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { getOverlayTextureByFacetKey } from '../data/projects';

export const useFacetOverlayGeometry = (facetKeys) => {
  const [overlayTextures, setOverlayTextures] = useState(new Map());
  const [isReady, setIsReady] = useState(false);
  const overlayMeshesRef = useRef(new Map());

  // Load all overlay textures
  useEffect(() => {
    const loadTextures = async () => {
      const loader = new THREE.TextureLoader();
      const textureMap = new Map();

      for (const facetKey of facetKeys) {
        const texturePath = getOverlayTextureByFacetKey(facetKey);
        if (texturePath) {
          try {
            const texture = await loader.loadAsync(texturePath);

            // Configure texture
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(2, 2);
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.colorSpace = THREE.SRGBColorSpace;

            textureMap.set(facetKey, texture);
            console.log(`✅ Loaded overlay texture for ${facetKey}`);
          } catch (error) {
            console.warn(`❌ Failed to load overlay texture for ${facetKey}:`, error);
          }
        }
      }

      setOverlayTextures(textureMap);
      setIsReady(true);
    };

    loadTextures();
  }, [facetKeys]);

  // Create overlay mesh for a facet
  const createOverlayMesh = useCallback((facetRef, facetKey) => {
    const texture = overlayTextures.get(facetKey);
    if (!texture || !facetRef?.current) return null;

    // Clone the facet geometry
    let overlayGeometry = null;
    facetRef.current.traverse((child) => {
      if (child.isMesh && child.geometry) {
        overlayGeometry = child.geometry.clone();
      }
    });

    if (!overlayGeometry) return null;

    // Create overlay material
    const overlayMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0,
      side: THREE.FrontSide,
      depthWrite: false,
      depthTest: true,
      blending: THREE.NormalBlending,
    });

    // Create mesh
    const overlayMesh = new THREE.Mesh(overlayGeometry, overlayMaterial);

    // Position slightly above the facet surface
    overlayMesh.position.copy(facetRef.current.position);
    overlayMesh.rotation.copy(facetRef.current.rotation);
    overlayMesh.scale.copy(facetRef.current.scale);

    // Move slightly outward along the facet's normal
    const direction = new THREE.Vector3();
    facetRef.current.getWorldDirection(direction);
    overlayMesh.position.add(direction.multiplyScalar(0.01));

    // Store reference for animation
    overlayMesh.userData = {
      facetKey,
      targetOpacity: 0,
      currentOpacity: 0,
      isOverlay: true,
    };

    overlayMeshesRef.current.set(facetKey, overlayMesh);
    return overlayMesh;
  }, [overlayTextures]);

  // Set target opacity for a facet overlay
  const setOverlayVisibility = useCallback((facetKey, visible) => {
    const mesh = overlayMeshesRef.current.get(facetKey);
    if (mesh) {
      mesh.userData.targetOpacity = visible ? 0.6 : 0;
    }
  }, []);

  // Animation update function (call in useFrame)
  const updateOverlays = useCallback((deltaTime) => {
    overlayMeshesRef.current.forEach((mesh) => {
      const { targetOpacity, currentOpacity } = mesh.userData;

      if (Math.abs(targetOpacity - currentOpacity) > 0.01) {
        const speed = 3.0;
        const newOpacity = THREE.MathUtils.lerp(currentOpacity, targetOpacity, deltaTime * speed);

        mesh.userData.currentOpacity = newOpacity;
        mesh.material.opacity = newOpacity;
        mesh.visible = newOpacity > 0.01;
      }
    });
  }, []);

  // Cleanup
  const cleanup = useCallback(() => {
    overlayMeshesRef.current.forEach((mesh) => {
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) mesh.material.dispose();
    });
    overlayMeshesRef.current.clear();

    overlayTextures.forEach((texture) => {
      texture.dispose();
    });
  }, [overlayTextures]);

  return {
    isReady,
    createOverlayMesh,
    setOverlayVisibility,
    updateOverlays,
    cleanup,
    overlayMeshes: overlayMeshesRef.current,
  };
};
