// src/components/three/DustParticleSystem.jsx
// Phase 2: Synchronized animation with crystal facet explosion and freeze

import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Phase 2: Animation Synchronization
 * - Sync particle explosion with crystal facet explosion
 * - Match particle spread speed to facet movement
 * - Freeze particles when facets reach final positions
 * - Proper lifecycle management (spawn → spread → freeze)
 */
const DustParticleSystem = ({ 
  animationData,
  performanceConfig = {},
  visible = true 
}) => {
  const particlesRef = useRef();
  const timeRef = useRef(0);
  
  // PHASE 2: Animation state tracking
  const animationStateRef = useRef({
    phase: 'inactive', // 'inactive' | 'exploding' | 'frozen' | 'reforming'
    startTime: 0,
    explosionDuration: 2.0, // UPDATED: 2 seconds for particle explosion
    lastCrystalForm: 'whole',
    hasExploded: false
  });
  
  // Extract performance settings
  const {
    renderScale = 1.0
  } = performanceConfig;

  // PHASE 2: Enhanced particle configuration with timing
  const particleConfig = useMemo(() => {
    const baseCount = 800;
    const count = Math.floor(baseCount * renderScale);
    
    return {
      count,
      size: 0.01,           // UPDATED: Larger particles
      sizeVariation: 0.08,  // UPDATED: Much more size variation
      opacity: 0.25,        // UPDATED: More subtle opacity
      spread: 5.0,          // UPDATED: Wider spread
      explosionSpeed: 1.5, // Speed during explosion phase
      floatSpeed: 0.1, // Gentle motion when frozen
      colors: [
        new THREE.Color('#ffffff'),
        new THREE.Color('#f0f0f0'),
        new THREE.Color('#64ffda'),
        new THREE.Color('#bb86fc'),
        new THREE.Color('#eeeeee'),
        new THREE.Color('#ffffff'),
      ]
    };
  }, [renderScale]);

  // Create particle system with lifecycle tracking
  const { geometry, material, particleData } = useMemo(() => {
    console.log('🌟 Phase 2: Creating synchronized dust particle system');
    
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.PointsMaterial({
      size: particleConfig.size,
      transparent: true,
      opacity: particleConfig.opacity,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
      alphaTest: 0.1,
    });

    // Enhanced particle data for lifecycle management
    const positions = new Float32Array(particleConfig.count * 3);
    const colors = new Float32Array(particleConfig.count * 3);
    const sizes = new Float32Array(particleConfig.count);
    const velocities = new Float32Array(particleConfig.count * 3);
    const targetPositions = new Float32Array(particleConfig.count * 3); // NEW: Final positions
    const phases = new Float32Array(particleConfig.count);
    const lifecycleStates = new Float32Array(particleConfig.count); // NEW: Per-particle state

    // Initialize particles
    for (let i = 0; i < particleConfig.count; i++) {
      const i3 = i * 3;
      
      // Start at center
      positions[i3] = 0;
      positions[i3 + 1] = 0;
      positions[i3 + 2] = 0;
      
      // Colors (same as Phase 1)
      const colorIndex = Math.random() < 0.8 
        ? Math.floor(Math.random() * 3)
        : Math.floor(Math.random() * particleConfig.colors.length);
      
      const color = particleConfig.colors[colorIndex];
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
      
      // Size variation
      sizes[i] = particleConfig.size + (Math.random() - 0.5) * particleConfig.sizeVariation;
      
      // PHASE 2: Calculate target positions (where particles should end up)
      const spherical = new THREE.Spherical(
        particleConfig.spread * (0.3 + Math.random() * 0.7), // Random distance within spread
        Math.random() * Math.PI,
        Math.random() * Math.PI * 2
      );
      const targetPos = new THREE.Vector3().setFromSpherical(spherical);
      
      targetPositions[i3] = targetPos.x;
      targetPositions[i3 + 1] = targetPos.y;
      targetPositions[i3 + 2] = targetPos.z;
      
      // Calculate velocities to reach target positions
      const distance = targetPos.length();
      const velocity = targetPos.clone().normalize().multiplyScalar(particleConfig.explosionSpeed);
      
      velocities[i3] = velocity.x;
      velocities[i3 + 1] = velocity.y;
      velocities[i3 + 2] = velocity.z;
      
      phases[i] = Math.random() * Math.PI * 2;
      lifecycleStates[i] = 0; // 0 = inactive, 1 = exploding, 2 = frozen
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    return { 
      geometry, 
      material, 
      particleData: { 
        positions, 
        colors, 
        sizes, 
        velocities, 
        targetPositions, 
        phases, 
        lifecycleStates 
      }
    };
  }, [particleConfig]);

  // PHASE 2: Detect crystal state changes and manage particle lifecycle
  useEffect(() => {
    const currentForm = animationData?.crystalForm;
    const currentState = animationData?.state;
    const animState = animationStateRef.current;
    
    // Detect transition from whole to exploded (START EXPLOSION)
    if (animState.lastCrystalForm === 'whole' && currentForm === 'exploded') {
      console.log('🌟 Phase 2: Starting particle explosion synchronized with crystal');
      
      animState.phase = 'exploding';
      animState.startTime = timeRef.current;
      animState.hasExploded = true;
      
      // Reset all particles to center for clean explosion
      const { positions, lifecycleStates } = particleData;
      for (let i = 0; i < particleConfig.count; i++) {
        const i3 = i * 3;
        positions[i3] = 0;
        positions[i3 + 1] = 0;
        positions[i3 + 2] = 0;
        lifecycleStates[i] = 1; // Set to exploding state
      }
    }
    
    // Detect transition from exploded to whole (START REFORM)
    if (animState.lastCrystalForm === 'exploded' && currentForm === 'whole') {
      console.log('🌟 Phase 2: Starting particle reform (return to center)');
      
      animState.phase = 'reforming';
      animState.startTime = timeRef.current;
      
      // Set particles to reforming state
      const { lifecycleStates } = particleData;
      for (let i = 0; i < particleConfig.count; i++) {
        lifecycleStates[i] = 3; // 3 = reforming state
      }
    }
    
    // Track state changes
    animState.lastCrystalForm = currentForm;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🌟 Phase 2: Animation state:', {
        phase: animState.phase,
        crystalForm: currentForm,
        animationState: currentState,
        hasExploded: animState.hasExploded
      });
    }
  }, [animationData?.crystalForm, animationData?.state, particleData, particleConfig.count]);

  // PHASE 2: Synchronized animation loop
  useFrame((state, delta) => {
    if (!particlesRef.current || !visible) return;
    
    timeRef.current += delta;
    const animState = animationStateRef.current;
    const { positions, velocities, targetPositions, phases, lifecycleStates } = particleData;
    
    // Calculate animation progress
    const elapsed = timeRef.current - animState.startTime;
    const explosionProgress = Math.min(elapsed / animState.explosionDuration, 1);
    
    for (let i = 0; i < particleConfig.count; i++) {
      const i3 = i * 3;
      const particleState = lifecycleStates[i];
      
      if (particleState === 1) { // EXPLODING
        if (explosionProgress < 1) {
          // Move toward target position during explosion
          const currentPos = new THREE.Vector3(positions[i3], positions[i3 + 1], positions[i3 + 2]);
          const targetPos = new THREE.Vector3(targetPositions[i3], targetPositions[i3 + 1], targetPositions[i3 + 2]);
          
          // Smooth movement toward target (ease-out for natural deceleration)
          const easedProgress = 1 - Math.pow(1 - explosionProgress, 3);
          const newPos = currentPos.lerp(targetPos, easedProgress);
          
          positions[i3] = newPos.x;
          positions[i3 + 1] = newPos.y;
          positions[i3 + 2] = newPos.z;
        } else {
          // FREEZE: Explosion complete after 2 seconds, switch to frozen state
          lifecycleStates[i] = 2;
          
          // Snap to exact target position
          positions[i3] = targetPositions[i3];
          positions[i3 + 1] = targetPositions[i3 + 1];
          positions[i3 + 2] = targetPositions[i3 + 2];
          
          if (i === 0) { // Log once when first particle freezes
            console.log('🌟 Phase 2: Particles frozen after 2-second explosion');
            animState.phase = 'frozen';
          }
        }
      }
      
      else if (particleState === 2) { // FROZEN
        // Gentle floating motion while frozen
        const sparklePhase = timeRef.current * 1.5 + phases[i];
        const floatAmount = Math.sin(sparklePhase) * 0.002;
        
        // Keep base position but add tiny floating motion
        positions[i3 + 1] = targetPositions[i3 + 1] + floatAmount;
      }
      
      else if (particleState === 3) { // REFORMING
        // Move back toward center
        const currentPos = new THREE.Vector3(positions[i3], positions[i3 + 1], positions[i3 + 2]);
        const centerPos = new THREE.Vector3(0, 0, 0);
        
        // Fast return to center
        const returnSpeed = 3.0;
        const direction = centerPos.clone().sub(currentPos);
        const distance = direction.length();
        
        if (distance > 0.01) {
          direction.normalize().multiplyScalar(returnSpeed * delta);
          currentPos.add(direction);
          
          positions[i3] = currentPos.x;
          positions[i3 + 1] = currentPos.y;
          positions[i3 + 2] = currentPos.z;
        } else {
          // Particle has reached center, deactivate
          positions[i3] = 0;
          positions[i3 + 1] = 0;
          positions[i3 + 2] = 0;
          lifecycleStates[i] = 0; // Back to inactive
          
          if (i === 0) {
            console.log('🌟 Phase 2: Particles returned to center');
            animState.phase = 'inactive';
            animState.hasExploded = false;
          }
        }
      }
    }
    
    // Update geometry
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  // Handle visibility
  useEffect(() => {
    if (particlesRef.current) {
      particlesRef.current.visible = visible;
    }
  }, [visible]);

  // Keep particle system mounted even when not visible to prevent flicker
  // Returning null here would remove the geometry and force a costly
  // re-creation on the next render. Instead we toggle the "visible" flag on the
  // existing object so particles persist across transitions.

  if (particleConfig.count === 0) return null;

  return (
    <points
      ref={particlesRef}
      geometry={geometry}
      material={material}
    />
  );
};

export default DustParticleSystem;

// =============================================================================
// PHASE 2 UPDATED INTEGRATION
// =============================================================================

/*
// FIXED: Simplified visibility to prevent ALL flickering
// Update the visibility logic in UnifiedCrystalScene.jsx:

<DustParticleSystem
  animationData={animationData}
  performanceConfig={performanceConfig}
  visible={
    // SIMPLIFIED: Just check if we're NOT in hero or about states
    animationData?.state !== 'hero' && animationData?.state !== 'about'
  }
/>

// This means particles are visible during:
// - overview state (when crystal explodes)
// - project_focused state (all project sections)
// - Any transition states between these
// 
// Particles are hidden only during:
// - hero state (crystal is whole)
// - about state (crystal reforms to whole)
*/

// =============================================================================
// PHASE 2 TESTING CHECKLIST
// =============================================================================

/*
✅ What to test after implementing Phase 2 updates:

1. **2-Second Explosion**: Particles take exactly 2 seconds to reach final positions
2. **No Project Flickering**: Particles stay visible when transitioning between projects
3. **Updated Visuals**: Larger particles (0.01), more size variation (0.08), subtle opacity (0.25), wider spread (5.0)
4. **Freeze Behavior**: Particles stop moving after 2 seconds (gentle floating only)
5. **Reform Sync**: Particles still return to center when crystal reforms
6. **Console Logging**: Check for "2-second explosion" message in console

🎯 Expected behavior changes:
- Explosion animation now takes 2 full seconds
- Particles are larger and more varied in size  
- More subtle, wider spread effect
- No more disappearing during project transitions
- Crystal still explodes faster (1.6s) but particles continue for 2s total

🐛 Fixed issues:
- ✅ Particle flickering between projects
- ✅ 2-second animation duration
- ✅ Updated visual parameters
*/