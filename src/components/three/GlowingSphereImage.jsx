// src/components/three/GlowingSphereImage.jsx
// Simple image-based glowing sphere that scales and fades with crystal explosion

import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Simple Image-Based Glowing Sphere
 * Replaces particle system with a single billboard image that:
 * - Always faces the camera
 * - Scales from center during explosion
 * - Fades in opacity from 0% to 100%
 * - Syncs with crystal explosion timing
 */
const GlowingSphereImage = ({
  // Image properties
  imagePath = '/assets/textures/glowing-sphere02.png', // Your image path
  baseSize = 1.0,              // Base size of the sphere image
  maxScale = 2.0,              // Maximum scale during explosion
  
  // Animation timing to match crystal explosion
  explosionDuration = 1.6,     // Match crystal explosion (1.6s)
  fadeInDuration = 0.8,        // How long the fade-in takes
  
  // Position and visibility
  position = [0, 0, 0],        // Center of exploded crystal
  visible = false,             // Controlled by parent
  
  // Animation state from parent
  animationData = null,
  
  // Debug
  debugMode = false
}) => {
  const meshRef = useRef();
  const materialRef = useRef();
  const { camera } = useThree();
  
  // Animation state
  const [explosionState, setExplosionState] = useState({
    isActive: false,
    startTime: 0,
    lastCrystalForm: 'whole'
  });
  
  const timeRef = useRef(0);
  
  // Load the sphere image texture
  const sphereTexture = useTexture(imagePath);
  
  // Configure texture
  useEffect(() => {
    if (sphereTexture) {
      sphereTexture.minFilter = THREE.LinearFilter;
      sphereTexture.magFilter = THREE.LinearFilter;
      sphereTexture.generateMipmaps = false;
      sphereTexture.wrapS = THREE.ClampToEdgeWrapping;
      sphereTexture.wrapT = THREE.ClampToEdgeWrapping;
      sphereTexture.needsUpdate = true;
      
      if (debugMode) {
        console.log('🌟 Sphere texture loaded:', imagePath);
      }
    }
  }, [sphereTexture, imagePath, debugMode]);
  
  // Create material for the billboard
  const sphereMaterial = React.useMemo(() => {
    return new THREE.SpriteMaterial({
      map: sphereTexture,
      transparent: true,
      opacity: 0,
      alphaTest: 0.001,
      blending: THREE.AdditiveBlending, // For glow effect
      depthWrite: false,
      depthTest: true,
      fog: false
    });
  }, [sphereTexture]);
  
  // Detect crystal explosion start/end
  useEffect(() => {
    if (!animationData) return;
    
    const currentForm = animationData.crystalForm;
    const formChanged = currentForm !== explosionState.lastCrystalForm;
    
    if (formChanged) {
      if (currentForm === 'exploded' && explosionState.lastCrystalForm === 'whole') {
        // START EXPLOSION
        if (debugMode) {
          console.log('🌟 Starting sphere explosion animation');
        }
        
        setExplosionState({
          isActive: true,
          startTime: timeRef.current,
          lastCrystalForm: currentForm
        });
        
      } else if (currentForm === 'whole' && explosionState.lastCrystalForm === 'exploded') {
        // START REFORM (fade out)
        if (debugMode) {
          console.log('🌟 Starting sphere fade out');
        }
        
        setExplosionState(prev => ({
          ...prev,
          isActive: false,
          lastCrystalForm: currentForm
        }));
      } else {
        // Just update form reference
        setExplosionState(prev => ({
          ...prev,
          lastCrystalForm: currentForm
        }));
      }
    }
  }, [animationData?.crystalForm, explosionState.lastCrystalForm, debugMode]);
  
  // Animation loop
  useFrame((state, delta) => {
    timeRef.current += delta;
    
    if (!meshRef.current || !materialRef.current || !visible) return;
    
    // Always face the camera (billboard behavior)
    meshRef.current.lookAt(camera.position);
    
    // Handle explosion animation
    if (explosionState.isActive) {
      const elapsed = timeRef.current - explosionState.startTime;
      const explosionProgress = Math.min(elapsed / explosionDuration, 1);
      const fadeProgress = Math.min(elapsed / fadeInDuration, 1);
      
      // Scale animation (ease-out for natural feel)
      const easedScale = 1 - Math.pow(1 - explosionProgress, 3);
      const currentScale = baseSize + (maxScale - baseSize) * easedScale;
      meshRef.current.scale.setScalar(currentScale);
      
      // Opacity animation (smooth fade-in)
      const opacity = fadeProgress;
      materialRef.current.opacity = opacity;
      
      if (debugMode && Math.random() < 0.02) {
        console.log('🌟 Sphere animation:', {
          elapsed: elapsed.toFixed(2),
          scale: currentScale.toFixed(2),
          opacity: opacity.toFixed(2),
          explosionProgress: explosionProgress.toFixed(2)
        });
      }
      
    } else {
      // Fade out when not active
      const currentOpacity = materialRef.current.opacity;
      const fadeOutSpeed = 3.0; // Fast fade out
      const newOpacity = Math.max(0, currentOpacity - delta * fadeOutSpeed);
      materialRef.current.opacity = newOpacity;
      
      // Reset scale when faded out
      if (newOpacity <= 0) {
        meshRef.current.scale.setScalar(baseSize);
      }
    }
  });
  
  // Don't render if not visible
  if (!visible) return null;
  
  return (
    <sprite
      ref={meshRef}
      material={sphereMaterial}
      position={position}
      scale={[baseSize, baseSize, baseSize]}
    >
      <spriteMaterial
        ref={materialRef}
        attach="material"
        map={sphereTexture}
        transparent={true}
        opacity={0}
        alphaTest={0.001}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        depthTest={true}
        fog={false}
      />
    </sprite>
  );
};

/**
 * Preset configurations for different crystal states
 */
export const SphereImagePresets = {
  // Standard explosion
  standard: {
    baseSize: 0.5,
    maxScale: 2.0,
    explosionDuration: 1.6,
    fadeInDuration: 0.8
  },
  
  // Dramatic explosion
  dramatic: {
    baseSize: 0.3,
    maxScale: 3.0,
    explosionDuration: 2.0,
    fadeInDuration: 1.0
  },
  
  // Quick explosion
  quick: {
    baseSize: 0.4,
    maxScale: 1.5,
    explosionDuration: 1.0,
    fadeInDuration: 0.5
  },
  
  // Subtle effect
  subtle: {
    baseSize: 0.8,
    maxScale: 1.2,
    explosionDuration: 1.6,
    fadeInDuration: 1.2
  }
};

/**
 * Smart preset selector based on animation data
 */
export const SmartGlowingSphereImage = ({ 
  animationData, 
  preset = 'standard',
  imagePath = '/assets/textures/glowing-sphere02.png',
  ...props 
}) => {
  const presetConfig = SphereImagePresets[preset] || SphereImagePresets.standard;
  
  const finalProps = { 
    ...presetConfig, 
    ...props, 
    animationData,
    imagePath
  };
  
  return <GlowingSphereImage {...finalProps} />;
};

export default GlowingSphereImage;