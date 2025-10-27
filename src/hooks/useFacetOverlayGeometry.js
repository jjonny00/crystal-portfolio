import { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { getOverlayImageByFacetKey } from '../data/projects';

const MIN_DIMENSION = 1e-5;

const applyCoverTransform = (texture, mesh) => {
  if (!texture?.image || !mesh?.geometry) return;

  const geometry = mesh.geometry;
  if (!geometry.boundingBox) {
    geometry.computeBoundingBox();
  }

  const size = new THREE.Vector3();
  geometry.boundingBox?.getSize(size);

  const worldScale = new THREE.Vector3(1, 1, 1);
  mesh.getWorldScale?.(worldScale);

  const dimensions = [
    size.x * worldScale.x,
    size.y * worldScale.y,
    size.z * worldScale.z
  ].filter((value) => value > MIN_DIMENSION);

  if (dimensions.length === 0) return;

  dimensions.sort((a, b) => b - a);

  const displayWidth = dimensions[0];
  const displayHeight = dimensions[1] ?? dimensions[0];

  const { width: imageWidth = 1, height: imageHeight = 1 } = texture.image;

  if (imageWidth <= 0 || imageHeight <= 0) return;

  const scale = Math.max(displayWidth / imageWidth, displayHeight / imageHeight);
  const scaledWidth = imageWidth * scale;
  const scaledHeight = imageHeight * scale;

  const repeatX = displayWidth / scaledWidth;
  const repeatY = displayHeight / scaledHeight;

  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.offset.set((1 - repeatX) * 0.5, (1 - repeatY) * 0.5);
  texture.center.set(0.5, 0.5);
  texture.needsUpdate = true;
};

export const useFacetOverlayGeometry = (facetKeys) => {
  const [overlayTextures, setOverlayTextures] = useState(new Map());
  const [isReady, setIsReady] = useState(false);
  const overlayMaterialsRef = useRef(new Map());
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

            // Configure texture for project display usage
            texture.wrapS = THREE.ClampToEdgeWrapping;
            texture.wrapT = THREE.ClampToEdgeWrapping;
            texture.offset.set(0, 0);
            texture.repeat.set(1, 1);
            texture.center.set(0.5, 0.5);
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

  // Attach overlay texture to ProjectDisplay material for a facet
  const applyOverlayToFacet = useCallback((facetRef, facetKey) => {
    const texture = overlayTextures.get(facetKey);
    if (!texture || !facetRef?.current) return null;

    let displayMaterial = null;
    let displayMesh = null;

    facetRef.current.traverse((child) => {
      if (child.isMesh && child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material) => {
          if (!displayMaterial && material?.name === 'ProjectDisplay') {
            displayMaterial = material;
            displayMesh = child;
          }
        });
      }
    });

    if (!displayMaterial || !displayMesh) return null;

    displayMaterial.transparent = true;
    displayMaterial.depthWrite = false;
    displayMaterial.depthTest = true;
    displayMaterial.map = texture;
    displayMaterial.opacity = 0;
    displayMaterial.needsUpdate = true;

    applyCoverTransform(texture, displayMesh);

    overlayMaterialsRef.current.set(facetKey, {
      material: displayMaterial,
      mesh: displayMesh,
      texture,
      targetOpacity: 0,
      currentOpacity: 0,
    });

    return displayMaterial;
  }, [overlayTextures]);

  // Set target opacity for a facet overlay
  const setOverlayVisibility = useCallback((facetKey, visible) => {
    const overlayEntry = overlayMaterialsRef.current.get(facetKey);
    if (overlayEntry) {
      overlayEntry.targetOpacity = visible ? 0.6 : 0;
    }
  }, []);

  // Animation update function (call in useFrame)
  const updateOverlays = useCallback((deltaTime) => {
    overlayMaterialsRef.current.forEach((entry) => {
      const { material, targetOpacity, currentOpacity } = entry;

      if (Math.abs(targetOpacity - currentOpacity) > 0.01) {
        const speed = 3.0;
        const newOpacity = THREE.MathUtils.lerp(currentOpacity, targetOpacity, deltaTime * speed);

        entry.currentOpacity = newOpacity;
        if (material) {
          material.opacity = newOpacity;
          material.needsUpdate = true;
          material.visible = newOpacity > 0.01;
        }
      }
    });
  }, []);

  // Cleanup
  const cleanup = useCallback(() => {
    overlayMaterialsRef.current.forEach((entry) => {
      if (entry.material) {
        entry.material.map = null;
        entry.material.opacity = 0;
        entry.material.needsUpdate = true;
      }
    });
    overlayMaterialsRef.current.clear();

    overlayTextures.forEach((texture) => {
      texture.dispose();
    });
  }, [overlayTextures]);

  return {
    isReady,
    createOverlayMesh: applyOverlayToFacet,
    setOverlayVisibility,
    updateOverlays,
    cleanup,
    overlayMeshes: overlayMaterialsRef.current,
  };
};
