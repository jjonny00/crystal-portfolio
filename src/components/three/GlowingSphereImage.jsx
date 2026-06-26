// src/components/three/GlowingSphereImage.jsx
// FIXED: Anti-banding improvements added to existing component

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getGlowingSphereTexture } from '../../loader/preloadFractureAssets';
import { usePxToWorld } from '../../hooks/usePxToWorld';

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
 * Higher-level blend styles for fracture glow tuning.
 */
export const BLEND_STYLES = {
  ADDITIVE: 'additive',
  OVERLAY: 'overlay',
  COLOR_DODGE: 'colorDodge',
  NORMAL: 'normal',
  MULTIPLY: 'multiply',
  CUSTOM: 'custom'
};

/**
 * Enhanced Plane-Based Sphere with Anti-Banding Support
 */
const GlowingSphereImage = ({
  // Size settings
  baseSize = 256,
  maxScale = 512,
  
  // Animation timing
  explosionDuration = 1.6,
  fadeInDuration = 0.8,
  maxOpacity = 1.0,
  
  // BLENDING MODES
  blendingMode = BLENDING_MODES.ADDITIVE,  // Default to Additive mode
  blendStyle = BLEND_STYLES.ADDITIVE,
  
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
  
  // Simple state
  const [isExploding, setIsExploding] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const lastCrystalForm = useRef('whole');

  const texture = getGlowingSphereTexture();
  const { px } = usePxToWorld();
  
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
          colorSpace: texture.colorSpace
        });
      }
    }
  }, [texture, textureFiltering, debugMode]);
  
  // Create geometry with higher tessellation for smoother appearance
  const geometry = useMemo(() => {
    // Use more segments for anti-aliasing and smoother curves
    const segments = enableAntialiasing ? 64 : 32;
    return new THREE.PlaneGeometry(1, 1, segments, segments);
  }, [enableAntialiasing]);
  
  // ENHANCED: Create material with anti-banding features
  const material = useMemo(() => {
    const resolveBlendConfig = () => {
      switch (blendStyle) {
        case BLEND_STYLES.NORMAL:
          return { blending: THREE.NormalBlending };
        case BLEND_STYLES.MULTIPLY:
          return { blending: THREE.MultiplyBlending };
        case BLEND_STYLES.OVERLAY:
          return {
            blending: THREE.CustomBlending,
            blendSrc: THREE.DstColorFactor,
            blendDst: THREE.OneMinusSrcAlphaFactor,
            blendEquation: THREE.AddEquation
          };
        case BLEND_STYLES.COLOR_DODGE:
          return {
            blending: THREE.CustomBlending,
            blendSrc: THREE.OneFactor,
            blendDst: THREE.OneMinusSrcColorFactor,
            blendEquation: THREE.AddEquation
          };
        case BLEND_STYLES.CUSTOM:
          return {
            blending: THREE.CustomBlending,
            blendSrc,
            blendDst,
            blendEquation
          };
        case BLEND_STYLES.ADDITIVE:
        default:
          return { blending: THREE.AdditiveBlending };
      }
    };

    const blendConfig = resolveBlendConfig();

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
      blending: blendConfig.blending ?? blendingMode,
      
      // ANTI-BANDING: Enable dithering
      dithering: enableDithering,
      
      // Use higher precision for better gradients
      precision: 'highp'
    });
    
    if ((blendConfig.blending ?? blendingMode) === THREE.CustomBlending) {
      mat.blendSrc = blendConfig.blendSrc ?? blendSrc;
      mat.blendDst = blendConfig.blendDst ?? blendDst;
      mat.blendEquation = blendConfig.blendEquation ?? blendEquation;
    }
    
    return mat;
  }, [texture, blendingMode, blendStyle, blendSrc, blendDst, blendEquation, enableDithering]);
  
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
  const baseWorldSize = px(baseSize);
  const maxWorldSize = px(maxScale);

  useEffect(() => {
    meshRef.current?.scale.setScalar(baseWorldSize);
  }, [baseWorldSize]);

  useFrame((state, deltaTime) => {
    if (!meshRef.current || !visible) return;

    // Face camera
    meshRef.current.lookAt(state.camera.position);
    
    if (isExploding) {
      const elapsed = (Date.now() - startTime) / 1000;
      const explosionProgress = Math.min(elapsed / explosionDuration, 1);
      const fadeProgress = Math.min(elapsed / fadeInDuration, 1);
      
      const scale = baseWorldSize + (maxWorldSize - baseWorldSize) * explosionProgress;
      const opacity = fadeProgress * maxOpacity;

      meshRef.current.scale.setScalar(scale);
      material.opacity = opacity;
      
    } else {
      const currentOpacity = material.opacity;
      if (currentOpacity > 0) {
        material.opacity = Math.max(0, currentOpacity - 0.05 * deltaTime * 60);
        if (material.opacity <= 0) {
          meshRef.current.scale.setScalar(baseWorldSize);
        }
      }
    }
  });
  
  if (!visible || simplifiedAnimations || !texture) return null;
  
  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={position}
      scale={[baseWorldSize, baseWorldSize, baseWorldSize]}
      renderOrder={999} // Render after other objects to avoid z-fighting
    />
  );
};

export default GlowingSphereImage;
