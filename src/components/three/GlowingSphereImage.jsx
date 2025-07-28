// src/components/three/GlowingSphereImage.jsx
// FIXED: Anti-banding improvements added to existing component

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
 * Enhanced Plane-Based Sphere with Anti-Banding Support
 */
const GlowingSphereImage = ({
  // Image path
  imagePath = '/assets/textures/glowing-sphere06-noise.jpg',
  
  // Size settings
  baseSize = 0.5,
  maxScale = 2.0,
  
  // Animation timing
  explosionDuration = 1.6,
  fadeInDuration = 0.8,
  
  // BLENDING MODES
  blendingMode = BLENDING_MODES.ADDITIVE,  // Default to Additive mode
  
  // Advanced blending options (for custom blending)
  blendSrc = THREE.SrcAlphaFactor,
  blendDst = THREE.OneMinusSrcAlphaFactor,
  blendEquation = THREE.AddEquation,
  
  // NEW: Anti-banding options
  enableDithering = true,
  enableAntialiasing = true,
  textureFiltering = 'enhanced', // 'basic', 'enhanced', 'premium'
  
  // Position and visibility
  position = [0, 0, 0],
  visible = false,
  
  // Animation state
  animationData = null,

  // Debug
  debugMode = false,
  simplifiedAnimations = false
}) => {
  const meshRef = useRef();
  const { camera } = useThree();
  
  // Simple state
  const [isExploding, setIsExploding] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const lastCrystalForm = useRef('whole');
  
  // Load texture once with enhanced settings
  const texture = useTexture(imagePath);
  
  // ENHANCED: Configure texture with anti-banding settings
  useEffect(() => {
    if (texture) {
      // Apply different filtering based on quality setting
      switch (textureFiltering) {
        case 'premium':
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.anisotropy = Math.min(16, texture.renderer?.capabilities?.getMaxAnisotropy?.() || 1);
          texture.generateMipmaps = false; // Prevent mipmap banding
          break;
          
        case 'enhanced':
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.anisotropy = Math.min(4, texture.renderer?.capabilities?.getMaxAnisotropy?.() || 1);
          texture.generateMipmaps = false;
          break;
          
        default: // 'basic'
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.anisotropy = 1;
          texture.generateMipmaps = false;
      }
      
      // Force better color space handling
      texture.colorSpace = THREE.SRGBColorSpace;
      
      // Optimize wrapping for sphere textures
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      
      texture.flipY = false;
      texture.needsUpdate = true;
      
      if (debugMode) {
        if (import.meta.env.DEV) console.log('🌟 Enhanced sphere texture loaded:', {
          filtering: textureFiltering,
          anisotropy: texture.anisotropy,
          colorSpace: texture.colorSpace,
          imagePath
        });
      }
    }
  }, [texture, textureFiltering, imagePath, debugMode]);
  
  // Create geometry with higher tessellation for smoother appearance
  const geometry = useMemo(() => {
    // Use more segments for anti-aliasing and smoother curves
    const segments = enableAntialiasing ? 64 : 32;
    return new THREE.PlaneGeometry(1, 1, segments, segments);
  }, [enableAntialiasing]);
  
  // ENHANCED: Create material with anti-banding features
  const material = useMemo(() => {
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0,
      alphaTest: 0.01,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: true,        
      fog: false,
      
      // BLENDING CONFIGURATION
      blending: blendingMode,
      
      // ANTI-BANDING: Enable dithering
      dithering: enableDithering,
      
      // Use higher precision for better gradients
      precision: 'highp'
    });
    
    // If using custom blending, set additional parameters
    if (blendingMode === THREE.CustomBlending) {
      mat.blendSrc = blendSrc;
      mat.blendDst = blendDst;
      mat.blendEquation = blendEquation;
    }
    
    return mat;
  }, [texture, blendingMode, blendSrc, blendDst, blendEquation, enableDithering]);
  
  // Detect explosion start/stop
  useEffect(() => {
    if (!animationData) return;
    
    const currentForm = animationData.crystalForm;
    if (currentForm !== lastCrystalForm.current) {
      
      if (currentForm === 'exploded' && lastCrystalForm.current === 'whole') {
        setIsExploding(true);
        setStartTime(Date.now());
        if (debugMode) if (import.meta.env.DEV) console.log('🌟 Enhanced sphere: Start explosion with anti-banding');
        
      } else if (currentForm === 'whole' && lastCrystalForm.current === 'exploded') {
        setIsExploding(false);
        if (debugMode) if (import.meta.env.DEV) console.log('🌟 Enhanced sphere: Stop explosion');
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
  
  if (!visible || simplifiedAnimations) return null;
  
  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={position}
      scale={[baseSize, baseSize, baseSize]}
      renderOrder={999} // Render after other objects to avoid z-fighting
    />
  );
};

/**
 * PRESET CONFIGURATIONS for different effects with anti-banding
 */
export const BlendingPresets = {
  // For images with black backgrounds - use Screen/Additive with anti-banding
  GLOW_ON_BLACK: {
    blendingMode: BLENDING_MODES.SCREEN,
    enableDithering: true,
    textureFiltering: 'enhanced',
    description: "Perfect for black backgrounds with anti-banding"
  },
  
  // For images with white backgrounds - use Multiply
  SHADOW_ON_WHITE: {
    blendingMode: BLENDING_MODES.MULTIPLY,
    enableDithering: true,
    textureFiltering: 'enhanced',
    description: "Good for white backgrounds with smooth gradients"
  },
  
  // Maximum brightness/glow effect with premium anti-banding
  MAXIMUM_GLOW: {
    blendingMode: BLENDING_MODES.ADDITIVE,
    enableDithering: true,
    enableAntialiasing: true,
    textureFiltering: 'premium',
    description: "Maximum glow with premium anti-banding"
  },
  
  // Standard blending with basic anti-banding
  NORMAL: {
    blendingMode: BLENDING_MODES.NORMAL,
    enableDithering: true,
    textureFiltering: 'basic',
    description: "Standard alpha blending with basic smoothing"
  },
  
  // Custom example: Strong additive with enhanced quality
  CUSTOM_BRIGHT: {
    blendingMode: BLENDING_MODES.CUSTOM,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneFactor,
    blendEquation: THREE.AddEquation,
    enableDithering: true,
    enableAntialiasing: true,
    textureFiltering: 'premium',
    description: "Custom strong additive with maximum quality"
  }
};

/**
 * Smart Blending Sphere - automatically chooses good settings with anti-banding
 */
export const SmartBlendingSphere = ({ 
  imageHasBlackBackground = true,  
  glowIntensity = 'medium',        
  antiAliasingQuality = 'enhanced', // 'basic', 'enhanced', 'premium'
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
  
  // Override texture filtering based on quality setting
  const enhancedPreset = {
    ...preset,
    textureFiltering: antiAliasingQuality,
    enableAntialiasing: antiAliasingQuality !== 'basic'
  };
  
  return <GlowingSphereImage {...enhancedPreset} {...props} />;
};

export default GlowingSphereImage;