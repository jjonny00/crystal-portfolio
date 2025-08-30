import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { BLENDING_MODES } from './GlowingSphereImage';

/**
 * Expanding ring image used during fracture/explosion.
 * Black in the texture becomes transparent via additive blending.
 */
const FractureRingImage = ({
  imagePath = '/assets/textures/fractureRing02.jpg',
  baseSize = 0.5,
  maxScale = 24,
  duration = 0.2,
  blendingMode = BLENDING_MODES.ADDITIVE,
  position = [0, 0, 0],
  visible = false,
  animationData = null,
  simplifiedAnimations = false,
  debugMode = false
}) => {
  const meshRef = useRef();
  const [isAnimating, setIsAnimating] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const lastForm = useRef('whole');

  const texture = useTexture(imagePath);

  useEffect(() => {
    if (texture) {
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy = Math.min(4, texture.renderer?.capabilities?.getMaxAnisotropy?.() || 1);
      texture.generateMipmaps = false;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.flipY = false;
      texture.needsUpdate = true;
    }
  }, [texture]);

  const material = useMemo(() => new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
    depthTest: false, // ensure on top
    blending: blendingMode,
    dithering: true
  }), [texture, blendingMode]);

  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1, 32, 32), []);

  useEffect(() => {
    if (!animationData) return;
    const currentForm = animationData.crystalForm;
    if (currentForm !== lastForm.current) {
      if (currentForm === 'exploded' && lastForm.current === 'whole') {
        setIsAnimating(true);
        setStartTime(Date.now());
        if (debugMode && import.meta.env.DEV) console.log('🌀 Fracture ring start');
      } else if (currentForm === 'whole' && lastForm.current === 'exploded') {
        setIsAnimating(false);
        if (debugMode && import.meta.env.DEV) console.log('🌀 Fracture ring stop');
      }
      lastForm.current = currentForm;
    }
  }, [animationData?.crystalForm, debugMode]);

  useFrame((state, delta) => {
    if (!meshRef.current || !visible) return;
    meshRef.current.lookAt(state.camera.position);

    if (isAnimating) {
      const elapsed = (Date.now() - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      const scale = baseSize + (maxScale - baseSize) * progress;
      const opacity = progress < 0.5 ? progress * 2 : (1 - progress) * 2;

      meshRef.current.scale.setScalar(scale);
      material.opacity = opacity;

      if (progress >= 1) {
        setIsAnimating(false);
      }
    } else if (material.opacity > 0) {
      material.opacity = Math.max(0, material.opacity - 0.05 * delta * 60);
    }
  });

  if (!visible || simplifiedAnimations) return null;

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={position}
      scale={[baseSize, baseSize, baseSize]}
      renderOrder={1000}
    />
  );
};

export default FractureRingImage;
