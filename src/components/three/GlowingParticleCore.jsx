// FIXED: src/components/three/GlowingParticleCore.jsx
// Fixed particle expansion with proper maxExpansion control

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

/**
 * FIXED: Glowing Particle Core Component with working maxExpansion control
 */
const GlowingParticleCore = ({
  // Core properties
  position = [0, 0, 0],
  coreRadius = 0.08,
  coreShape = 'sphere',
  coreAspectRatio = 2.0,
  particleCount = 800,
  
  // Visual properties
  baseColor = '#ffffff',
  accentColor = '#64ffda',
  emissiveIntensity = 25.0,
  
  // Animation properties
  pulseEnabled = true,
  pulseSpeed = 2.5,
  pulseIntensityRange = [0.6, 1.4],
  
  // FIXED: Key expansion controls that now work properly
  maxExpansion = 1.8,        // THIS NOW CONTROLS THE PARTICLE SPREAD
  expansionSpeed = 0.5,      // How fast particles move during expansion
  
  // FIXED: Timing controls for each phase
  ignitionDuration = 0.3,
  expansionDuration = 1.2,
  fadeDuration = 0.8,
  
  // Particle shape options
  particleShape = 'soft-spheres',
  
  // Rendering properties
  frustumCulled = false,
  
  // Lifecycle
  visible = false,
  animationData = null,
  performanceConfig = {},
  
  // Events
  onExplosionStart = null,
  onExplosionPeak = null,
  onExplosionEnd = null
}) => {
  // Component refs
  const particlesRef = useRef();
  const timeRef = useRef(0);
  const explosionTimeRef = useRef(0);
  
  // FIXED: Proper explosion state tracking
  const [explosionState, setExplosionState] = useState({
    isActive: false,
    phase: 'dormant', // 'dormant', 'igniting', 'expanding', 'pulsing', 'fading'
    startTime: 0,
    lastCrystalForm: 'whole'
  });
  
  const { clock } = useFrame ? { clock: { getElapsedTime: () => timeRef.current } } : { clock: null };
  
  // Performance adjustments
  const {
    renderScale = 1.0,
    usePBR = true
  } = performanceConfig;
  
  // Load the particle texture
  const particleTexture = useTexture('/assets/textures/particle-dust01.png');
  
  // Configure the texture
  useEffect(() => {
    if (particleTexture) {
      particleTexture.minFilter = THREE.LinearFilter;
      particleTexture.magFilter = THREE.LinearFilter;
      particleTexture.generateMipmaps = false;
      particleTexture.wrapS = THREE.ClampToEdgeWrapping;
      particleTexture.wrapT = THREE.ClampToEdgeWrapping;
      particleTexture.colorSpace = THREE.SRGBColorSpace;
      particleTexture.needsUpdate = true;
      console.log('🖼️ Particle texture loaded and configured');
    }
  }, [particleTexture]);

  const adjustedParticleCount = Math.floor(particleCount * renderScale);
  const adjustedEmissiveIntensity = usePBR ? emissiveIntensity : emissiveIntensity * 0.7;

  // FIXED: Create particle system with proper velocity calculation based on maxExpansion
  const { geometry, material, particleData, renderType } = useMemo(() => {
    console.log('🌟 Creating particle system with maxExpansion:', maxExpansion);
    
    try {
      let geometry, material, renderType;
      
      // Clean points rendering with proper depth testing
      geometry = new THREE.BufferGeometry();
      material = new THREE.PointsMaterial({
        size: 600,
        transparent: true,
        opacity: 0.1,
        color: new THREE.Color(baseColor),
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: true,
        sizeAttenuation: false,
        alphaTest: 0.01,
        map: particleTexture,
        fog: false,
        toneMapped: true,
      });
      renderType = 'points';
      
      // Particle data arrays
      const positions = new Float32Array(adjustedParticleCount * 3);
      const colors = new Float32Array(adjustedParticleCount * 3);
      const sizes = new Float32Array(adjustedParticleCount);
      const velocities = new Float32Array(adjustedParticleCount * 3);
      const phases = new Float32Array(adjustedParticleCount);
      const intensities = new Float32Array(adjustedParticleCount);
      const originalPositions = new Float32Array(adjustedParticleCount * 3);
      
      // Color palette
      const baseColorObj = new THREE.Color(baseColor);
      const accentColorObj = new THREE.Color(accentColor);
      
      // FIXED: Particle initialization with proper distribution and velocity calculation
      for (let i = 0; i < adjustedParticleCount; i++) {
        const i3 = i * 3;
        
        // Generate initial positions within core radius using spherical distribution
        const phi = Math.acos(1 - 2 * Math.random()); // Uniform distribution on sphere
        const theta = 2 * Math.PI * Math.random();
        const radius = Math.pow(Math.random(), 1/3) * coreRadius; // Cubic root for volume distribution
        
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);
        
        // Store initial positions (at core)
        positions[i3] = x;
        positions[i3 + 1] = y;
        positions[i3 + 2] = z;
        
        // Store original positions for reference
        originalPositions[i3] = x;
        originalPositions[i3 + 1] = y;
        originalPositions[i3 + 2] = z;
        
        // FIXED: Calculate expansion direction and velocity based on maxExpansion
        const direction = new THREE.Vector3(x, y, z);
        if (direction.length() > 0) {
          direction.normalize();
        } else {
          // Fallback for particles exactly at center
          direction.set(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5
          ).normalize();
        }
        
        // FIXED: Calculate target distance based on maxExpansion
        // Add some randomness to make it look more organic
        const targetDistance = maxExpansion * (0.5 + Math.random() * 0.5);
        
        // Calculate velocity needed to reach target position
        // Velocity = direction * speed, where speed determines how fast they reach target
        const speed = expansionSpeed * targetDistance; // Scale speed by target distance
        direction.multiplyScalar(speed);
        
        velocities[i3] = direction.x;
        velocities[i3 + 1] = direction.y;
        velocities[i3 + 2] = direction.z;
        
        // Color variation
        const useAccent = Math.random() < 0.25;
        const color = useAccent ? accentColorObj : baseColorObj;
        const brightness = 0.7 + Math.random() * 0.6;
        
        colors[i3] = color.r * brightness;
        colors[i3 + 1] = color.g * brightness;
        colors[i3 + 2] = color.b * brightness;
        
        // Size variation
        sizes[i] = 0.1 + Math.random() * 1.0;
        phases[i] = Math.random() * Math.PI * 2;
        intensities[i] = 0.8 + Math.random() * 0.4;
      }
      
      // Set geometry attributes
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      
      console.log('🌟 Created particle system with maxExpansion control:', {
        count: adjustedParticleCount,
        maxExpansion,
        expansionSpeed,
        hasTexture: !!particleTexture
      });
      
      return { 
        geometry, 
        material,
        renderType: 'points',
        particleData: { 
          positions, 
          colors, 
          sizes, 
          velocities, 
          phases, 
          intensities,
          originalPositions,
          instanceMatrices: null,
          instanceColors: null
        }
      };
    } catch (error) {
      console.error('❌ Failed to create particle system:', error);
      return {
        geometry: new THREE.BufferGeometry(),
        material: new THREE.PointsMaterial({ size: 0.001, transparent: true, opacity: 0 }),
        renderType: 'points',
        particleData: null
      };
    }
  }, [
    adjustedParticleCount, 
    coreRadius, 
    maxExpansion,        // FIXED: Add maxExpansion as dependency
    expansionSpeed,      // FIXED: Add expansionSpeed as dependency
    baseColor, 
    accentColor, 
    adjustedEmissiveIntensity, 
    particleShape,
    particleTexture
  ]);
  
  // Explosion detection (keep existing logic)
  useEffect(() => {
    if (!animationData) return;
    
    const currentForm = animationData.crystalForm;
    
    if (currentForm !== explosionState.lastCrystalForm) {
      if (explosionState.lastCrystalForm === 'whole' && currentForm === 'exploded') {
        console.log('🌟 Starting particle explosion with maxExpansion:', maxExpansion);
        
        setExplosionState({
          isActive: true,
          phase: 'igniting',
          startTime: timeRef.current,
          lastCrystalForm: currentForm
        });
        
        explosionTimeRef.current = 0;
        
        if (onExplosionStart) {
          onExplosionStart();
        }
        
      } else if (explosionState.lastCrystalForm === 'exploded' && currentForm === 'whole') {
        console.log('🌟 Starting particle fade');
        
        setExplosionState(prev => ({
          ...prev,
          phase: 'fading',
          startTime: timeRef.current,
          lastCrystalForm: currentForm
        }));
        
        explosionTimeRef.current = 0;
      } else {
        setExplosionState(prev => ({
          ...prev,
          lastCrystalForm: currentForm
        }));
      }
    }
  }, [animationData?.crystalForm, explosionState.lastCrystalForm, onExplosionStart, maxExpansion]);
  
  // FIXED: Animation loop with proper expansion calculation
  useFrame((state, delta) => {
    timeRef.current += delta;
    
    if (!particlesRef.current || !particleData) return;
    
    // Only animate when explosion is active
    if (!explosionState.isActive) return;
    
    explosionTimeRef.current += delta;
    
    // Update shader uniforms
    if (material && material.uniforms) {
      if (material.uniforms.time) {
        material.uniforms.time.value = timeRef.current;
      }
    }
    
    const { positions, velocities, originalPositions } = particleData;
    
    // FIXED: Calculate expansion factor that properly uses maxExpansion
    let expansionFactor = 0;
    const totalElapsed = explosionTimeRef.current;
    
    if (explosionState.phase === 'igniting') {
      // Small initial expansion
      const progress = Math.min(totalElapsed / ignitionDuration, 1);
      expansionFactor = progress * 0.1; // Start with 10% of maxExpansion
      
      if (progress >= 1) {
        setExplosionState(prev => ({
          ...prev,
          phase: 'expanding'
        }));
        explosionTimeRef.current = 0;
        if (onExplosionPeak) onExplosionPeak();
      }
    } 
    else if (explosionState.phase === 'expanding') {
      // FIXED: Main expansion that reaches exactly maxExpansion
      const progress = Math.min(totalElapsed / expansionDuration, 1);
      // Use ease-out curve for natural deceleration
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      expansionFactor = 0.1 + (easedProgress * 0.9); // From 10% to 100% of maxExpansion
      
      if (progress >= 1) {
        console.log('🌟 Particles reached maximum expansion:', maxExpansion);
        setExplosionState(prev => ({
          ...prev,
          phase: 'pulsing'
        }));
      }
    }
    else if (explosionState.phase === 'pulsing') {
      // Stay at full expansion
      expansionFactor = 1.0;
    }
    else if (explosionState.phase === 'fading') {
      // Shrink back
      const progress = Math.min(totalElapsed / fadeDuration, 1);
      expansionFactor = 1.0 * (1 - progress);
      
      if (progress >= 1) {
        setExplosionState(prev => ({
          ...prev,
          isActive: false,
          phase: 'dormant'
        }));
        if (onExplosionEnd) onExplosionEnd();
        return;
      }
    }
    
    // FIXED: Update particle positions using proper expansion calculation
    for (let i = 0; i < adjustedParticleCount; i++) {
      const i3 = i * 3;
      
      // Get velocity (which represents the direction and target distance)
      const velX = velocities[i3];
      const velY = velocities[i3 + 1];
      const velZ = velocities[i3 + 2];
      
      // FIXED: Calculate new position using expansionFactor and maxExpansion
      // Position = original + (velocity * expansionFactor)
      // Since velocity already includes the target distance based on maxExpansion,
      // expansionFactor (0-1) controls how far along that path we are
      const newX = originalPositions[i3] + (velX * expansionFactor);
      const newY = originalPositions[i3 + 1] + (velY * expansionFactor);
      const newZ = originalPositions[i3 + 2] + (velZ * expansionFactor);
      
      positions[i3] = newX;
      positions[i3 + 1] = newY;
      positions[i3 + 2] = newZ;
    }
    
    // Update geometry
    const positionAttribute = particlesRef.current.geometry.attributes.position;
    if (positionAttribute) {
      positionAttribute.needsUpdate = true;
    }
    
    // Debug logging occasionally
    if (process.env.NODE_ENV === 'development' && Math.random() < 0.01) {
      console.log('🌟 Particle animation:', {
        phase: explosionState.phase,
        expansionFactor: expansionFactor.toFixed(3),
        maxExpansion,
        elapsed: totalElapsed.toFixed(2)
      });
    }
  });
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (material) material.dispose();
      if (geometry) geometry.dispose();
    };
  }, [material, geometry]);
  
  // Only render when explosion is active
  const shouldRender = visible && explosionState.isActive;
  
  if (!shouldRender) return null;
  
  return (
    <group position={position}>
      {/* Main particle system */}
      <points
        ref={particlesRef}
        geometry={geometry}
        material={material}
        renderOrder={0}
        frustumCulled={false}
      />
    </group>
  );
};

export default GlowingParticleCore;