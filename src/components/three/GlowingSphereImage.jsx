// src/components/three/GlowingSphereImage.jsx
// BLENDING MODES: Support for Screen, Additive, Multiply, etc.

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

/**
 * BLENDING MODE OPTIONS for Three.js materials
 */
export const BLENDING_MODES = {
  // Most common for glowing effects
  SCREEN: THREE.AdditiveBlending,       // Similar to Photoshop Screen - brightens
  ADDITIVE: THREE.AdditiveBlending,     // Adds color values - great for glow
  
  // Other useful modes
  NORMAL: THREE.NormalBlending,         // Default blending
  MULTIPLY: THREE.MultiplyBlending,     // Darkens - good for shadows
  SUBTRACT: THREE.SubtractiveBlending,  // Subtracts color values
  
  // Custom blending (advanced)
  CUSTOM: THREE.CustomBlending
};

/**
 * Simple Plane-Based Sphere with Blending Mode Support
 */
const GlowingSphereImage = ({
  // Image path
  imagePath = '/assets/textures/glowing-sphere04.jpg',
  
  // Size settings
  baseSize = 0.5,
  maxScale = 2.0,
  
  // Animation timing
  explosionDuration = 1.6,
  fadeInDuration = 0.8,
  
  // BLENDING MODES
  blendingMode = BLENDING_MODES.SCREEN,  // Default to Screen mode
  
  // Advanced blending options (for custom blending)
  blendSrc = THREE.SrcAlphaFactor,
  blendDst = THREE.OneMinusSrcAlphaFactor,
  blendEquation = THREE.AddEquation,
  
  // Position and visibility
  position = [0, 0, 0],
  visible = false,
  
  // Animation state
  animationData = null,
  
  // Debug
  debugMode = false
}) => {
  const meshRef = useRef();
  const { camera } = useThree();
  
  // Simple state
  const [isExploding, setIsExploding] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const lastCrystalForm = useRef('whole');
  
  // Load texture once
  const texture = useTexture(imagePath);
  
  // Configure texture on load
  useEffect(() => {
    if (texture) {
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      texture.flipY = false;
      texture.needsUpdate = true;
      
      if (debugMode) {
        console.log('🌟 Sphere texture loaded with blending mode:', {
          mode: Object.keys(BLENDING_MODES).find(key => BLENDING_MODES[key] === blendingMode),
          imagePath
        });
      }
    }
  }, [texture, blendingMode, imagePath, debugMode]);
  
  // Create geometry once
  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  
  // Create material with blending mode
  const material = useMemo(() => {
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0,
      alphaTest: 0.01,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: true,        // FIXED: Enable depth testing so facets render in front
      fog: false,
      
      // BLENDING CONFIGURATION
      blending: blendingMode
    });
    
    // If using custom blending, set additional parameters
    if (blendingMode === THREE.CustomBlending) {
      mat.blendSrc = blendSrc;
      mat.blendDst = blendDst;
      mat.blendEquation = blendEquation;
    }
    
    return mat;
  }, [texture, blendingMode, blendSrc, blendDst, blendEquation]);
  
  // Detect explosion start/stop
  useEffect(() => {
    if (!animationData) return;
    
    const currentForm = animationData.crystalForm;
    if (currentForm !== lastCrystalForm.current) {
      
      if (currentForm === 'exploded' && lastCrystalForm.current === 'whole') {
        setIsExploding(true);
        setStartTime(Date.now());
        if (debugMode) console.log('🌟 Sphere: Start explosion with blending');
        
      } else if (currentForm === 'whole' && lastCrystalForm.current === 'exploded') {
        setIsExploding(false);
        if (debugMode) console.log('🌟 Sphere: Stop explosion');
      }
      
      lastCrystalForm.current = currentForm;
    }
  }, [animationData?.crystalForm, debugMode]);
  
  // Animation loop
  useFrame(() => {
    if (!meshRef.current || !visible) return;
    
    // Face camera
    meshRef.current.lookAt(camera.position);
    
    if (isExploding) {
      const elapsed = (Date.now() - startTime) / 1000;
      const explosionProgress = Math.min(elapsed / explosionDuration, 1);
      const fadeProgress = Math.min(elapsed / fadeInDuration, 1);
      
      const scale = baseSize + (maxScale - baseSize) * explosionProgress;
      const opacity = fadeProgress;
      
      meshRef.current.scale.setScalar(scale);
      material.opacity = opacity;
      
    } else {
      const currentOpacity = material.opacity;
      if (currentOpacity > 0) {
        material.opacity = Math.max(0, currentOpacity - 0.05);
        if (material.opacity <= 0) {
          meshRef.current.scale.setScalar(baseSize);
        }
      }
    }
  });
  
  if (!visible) return null;
  
  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={position}
      scale={[baseSize, baseSize, baseSize]}
    />
  );
};

/**
 * PRESET CONFIGURATIONS for different effects
 */
export const BlendingPresets = {
  // For images with black backgrounds - use Screen/Additive
  GLOW_ON_BLACK: {
    blendingMode: BLENDING_MODES.SCREEN,
    description: "Perfect for black backgrounds - brightens and glows"
  },
  
  // For images with white backgrounds - use Multiply
  SHADOW_ON_WHITE: {
    blendingMode: BLENDING_MODES.MULTIPLY,
    description: "Good for white backgrounds - darkens and creates shadows"
  },
  
  // Maximum brightness/glow effect
  MAXIMUM_GLOW: {
    blendingMode: BLENDING_MODES.ADDITIVE,
    description: "Maximum glow effect - adds all color values"
  },
  
  // Standard blending
  NORMAL: {
    blendingMode: BLENDING_MODES.NORMAL,
    description: "Standard alpha blending"
  },
  
  // Custom example: Strong additive with custom factors
  CUSTOM_BRIGHT: {
    blendingMode: BLENDING_MODES.CUSTOM,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneFactor,
    blendEquation: THREE.AddEquation,
    description: "Custom strong additive blending"
  }
};

/**
 * Smart Blending Sphere - automatically chooses good settings
 */
export const SmartBlendingSphere = ({ 
  imageHasBlackBackground = true,  // Tell us about your image
  glowIntensity = 'medium',        // 'subtle', 'medium', 'intense'
  ...props 
}) => {
  // Choose blending mode based on image background
  let preset = BlendingPresets.NORMAL;
  
  if (imageHasBlackBackground) {
    switch (glowIntensity) {
      case 'subtle':
        preset = BlendingPresets.NORMAL;
        break;
      case 'medium':
        preset = BlendingPresets.GLOW_ON_BLACK;
        break;
      case 'intense':
        preset = BlendingPresets.MAXIMUM_GLOW;
        break;
    }
  } else {
    // For white/transparent backgrounds
    preset = BlendingPresets.NORMAL;
  }
  
  return <GlowingSphereImage {...preset} {...props} />;
};

export default GlowingSphereImage;