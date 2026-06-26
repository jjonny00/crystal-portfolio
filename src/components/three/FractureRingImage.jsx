import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BLENDING_MODES } from './GlowingSphereImage';
import { getFractureRingTexture } from '../../loader/preloadFractureAssets';

/**
 * Enhanced Fracture Ring Image with tweakable parameters
 * Expanding ring image used during fracture/explosion.
 * Black in the texture becomes transparent via additive blending.
 */
const FractureRingImage = ({
  // SCALE PARAMETERS - Easy to tweak!
  baseSize = 0.5,        // Starting size of the ring
  maxScale = 24,         // Maximum scale the ring reaches
  scaleEasing = 'linear', // 'linear', 'easeOut', 'easeIn', 'bounce'
  
  // DURATION PARAMETERS - Control timing!
  duration = 0.4,        // Total animation duration in seconds
  fadeInDuration = 0.1,  // How long to fade in (portion of total duration)
  fadeOutDuration = 0.3, // How long to fade out (portion of total duration)
  
  // TRIGGER PARAMETERS - When to start!
  triggerDelay = 0,      // Delay after crystal form change (in seconds)
  triggerOnState = 'exploded', // 'exploded' or 'whole' - which state triggers the animation
  manualTriggerMode = false, // Let parent own the trigger instead of crystalForm changes
  triggerKey = null,
  
  // VISUAL PARAMETERS
  blendingMode = BLENDING_MODES.ADDITIVE,
  opacity = 2.0,         // Maximum opacity during animation
  rotationSpeed = 0,     // Rotation speed (radians per second)
  
  // OTHER PROPS
  position = [0, 0, 0],
  visible = false,
  animationData = null,
  simplifiedAnimations = false,
  debugMode = false
}) => {
  const meshRef = useRef();
  const [isAnimating, setIsAnimating] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [delayTimer, setDelayTimer] = useState(null);
  const lastForm = useRef('whole');

  const texture = getFractureRingTexture();

  const material = useMemo(() => new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
    depthTest: false,
    blending: blendingMode,
    dithering: true
  }), [texture, blendingMode]);

  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1, 32, 32), []);

  // Easing functions
  const easingFunctions = {
    linear: (t) => t,
    easeOut: (t) => 1 - Math.pow(1 - t, 3),
    easeOutExpo: (t) => (t >= 1 ? 1 : 1 - (2 ** (-10 * t))),
    easeIn: (t) => t * t * t,
    bounce: (t) => {
      if (t < 1/2.75) {
        return 7.5625 * t * t;
      } else if (t < 2/2.75) {
        return 7.5625 * (t -= 1.5/2.75) * t + 0.75;
      } else if (t < 2.5/2.75) {
        return 7.5625 * (t -= 2.25/2.75) * t + 0.9375;
      } else {
        return 7.5625 * (t -= 2.625/2.75) * t + 0.984375;
      }
    },
    sinePulse: (t) => Math.sin(Math.max(0, Math.min(1, t)) * Math.PI * 0.5)
  };

  const triggerRingAnimation = useCallback((source = 'manual') => {
    setIsAnimating(true);
    setStartTime(Date.now());
    if (debugMode && import.meta.env.DEV) {
      console.log(`🌀 Fracture ring: Animation started (${source})`);
    }
  }, [debugMode]);

  useEffect(() => {
    if (!manualTriggerMode || triggerKey == null || !visible) return;

    if (delayTimer) {
      clearTimeout(delayTimer);
      setDelayTimer(null);
    }

    triggerRingAnimation('manual triggerKey');
  }, [delayTimer, manualTriggerMode, triggerKey, triggerRingAnimation, visible]);

  // Enhanced trigger logic with delay support
  useEffect(() => {
    if (manualTriggerMode || !animationData) return;
    
    const currentForm = animationData.crystalForm;
    
    if (currentForm !== lastForm.current) {
      // Clear any existing delay timer
      if (delayTimer) {
        clearTimeout(delayTimer);
        setDelayTimer(null);
      }
      
      if (currentForm === triggerOnState && lastForm.current !== triggerOnState) {
        if (debugMode && import.meta.env.DEV) {
          console.log(`🌀 Fracture ring: ${triggerOnState} detected, delay: ${triggerDelay}s`);
        }
        
        if (triggerDelay > 0) {
          // Set up delayed trigger
          const timer = setTimeout(() => {
            triggerRingAnimation('crystalForm delay');
          }, triggerDelay * 1000);
          setDelayTimer(timer);
        } else {
          // Immediate trigger
          triggerRingAnimation('crystalForm immediate');
        }
      } else if (currentForm !== triggerOnState) {
        setIsAnimating(false);
        if (debugMode && import.meta.env.DEV) {
          console.log('🌀 Fracture ring: Animation stopped');
        }
      }
      
      lastForm.current = currentForm;
    }
  }, [animationData?.crystalForm, triggerDelay, triggerOnState, delayTimer, debugMode, manualTriggerMode, triggerRingAnimation]);

  // Enhanced animation loop
  useFrame((state, delta) => {
    if (!meshRef.current || !visible) return;
    
    // Always face the camera
    meshRef.current.lookAt(state.camera.position);
    
    // Apply rotation if specified
    if (rotationSpeed !== 0) {
      meshRef.current.rotation.z += rotationSpeed * delta;
    }

    if (isAnimating) {
      const elapsed = (Date.now() - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      
      // Apply easing to scale
      const easingFunc = easingFunctions[scaleEasing] || easingFunctions.linear;
      const easedProgress = easingFunc(progress);
      
      // Calculate scale
      const scale = baseSize + (maxScale - baseSize) * easedProgress;
      meshRef.current.scale.setScalar(scale);
      
      // Calculate opacity with custom fade timing
      let currentOpacity = 0;
      const fadeInTime = fadeInDuration;
      const fadeOutStart = duration - fadeOutDuration;
      
      if (elapsed <= fadeInTime) {
        // Fade in phase
        currentOpacity = (elapsed / fadeInTime) * opacity;
      } else if (elapsed <= fadeOutStart) {
        // Hold phase
        currentOpacity = opacity;
      } else {
        // Fade out phase
        const fadeOutProgress = (elapsed - fadeOutStart) / fadeOutDuration;
        currentOpacity = opacity * (1 - fadeOutProgress);
      }
      
      material.opacity = Math.max(0, currentOpacity);
      
      // Animation complete
      if (progress >= 1) {
        setIsAnimating(false);
        if (debugMode && import.meta.env.DEV) {
          console.log('🌀 Fracture ring: Animation complete');
        }
      }
    } else if (material.opacity > 0) {
      // Fade out when not animating
      material.opacity = Math.max(0, material.opacity - 0.05 * delta * 60);
    }
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (delayTimer) {
        clearTimeout(delayTimer);
      }
    };
  }, [delayTimer]);

  if (!visible || simplifiedAnimations || !texture) return null;

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