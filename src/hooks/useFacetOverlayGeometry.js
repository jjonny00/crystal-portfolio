import { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { getOverlayImageByFacetKey } from '../data/projects';

export const useFacetOverlayGeometry = (facetKeys) => {
  const [overlayTextures, setOverlayTextures] = useState(new Map());
  const [isReady, setIsReady] = useState(false);
  const overlayMeshesRef = useRef(new Map());
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

  // Create overlay mesh for a facet
  const createOverlayMesh = useCallback((facetRef, facetKey) => {
    const texture = overlayTextures.get(facetKey);
    if (!texture || !facetRef?.current) return null;

    // Find first mesh inside facet
    let sourceMesh = null;
    facetRef.current.traverse((child) => {
      if (!sourceMesh && child.isMesh) {
        sourceMesh = child;
      }
    });

    if (!sourceMesh) return null;

    // Create overlay material
    const overlayMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0,
      side: THREE.FrontSide,
      depthWrite: false,
      depthTest: true,
      blending: THREE.NormalBlending,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });

    // Create mesh
    const overlayMesh = new THREE.Mesh(sourceMesh.geometry.clone(), overlayMaterial);

    // Align with source mesh and attach to facet group
    overlayMesh.position.copy(sourceMesh.position);
    overlayMesh.rotation.copy(sourceMesh.rotation);
    overlayMesh.scale.copy(sourceMesh.scale);
    overlayMesh.renderOrder = (sourceMesh.renderOrder || 0) + 1;
    overlayMesh.visible = false;
    facetRef.current.add(overlayMesh);

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
        mesh.material.needsUpdate = true;
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
