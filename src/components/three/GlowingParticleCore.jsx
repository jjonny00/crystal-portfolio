// src/components/three/GlowingParticleCore.jsx
// High-intensity particle core system triggered by crystal explosion

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Glowing Particle Core Component
 * Creates a tight, highly luminous energy core that reacts to crystal explosions
 */
const GlowingParticleCore = ({
  // Core properties
  position = [0, 0, 0],
  coreRadius = 0.08,
  particleCount = 800,
  
  // Visual properties
  baseColor = '#ffffff',
  accentColor = '#64ffda',
  emissiveIntensity = 25.0,
  
  // Animation properties
  pulseEnabled = true,
  pulseSpeed = 2.5,
  pulseIntensityRange = [0.6, 1.4],
  expansionSpeed = 0.5,
  maxExpansion = 1.8,
  
  // Lifecycle
  visible = false,
  animationData = null,
  performanceConfig = {},
  
  // Events
  onExplosionStart = null,
  onExplosionPeak = null,
  onExplosionEnd = null
}) => {
  const particlesRef = useRef();
  const timeRef = useRef(0);
  const explosionTimeRef = useRef(0);
  
  // State tracking
  const [isExploding, setIsExploding] = useState(false);
  const [explosionPhase, setExplosionPhase] = useState('dormant'); // 'dormant', 'igniting', 'expanding', 'pulsing', 'fading'
  const lastCrystalForm = useRef('whole');
  
  // Performance adjustments
  const {
    renderScale = 1.0,
    usePBR = true
  } = performanceConfig;
  
  const adjustedParticleCount = Math.floor(particleCount * renderScale);
  const adjustedEmissiveIntensity = usePBR ? emissiveIntensity : emissiveIntensity * 0.7;
  
  // Create particle system geometry and material
  const { geometry, material, particleData } = useMemo(() => {
    console.log('🌟 Creating Glowing Particle Core system');
    
    const geometry = new THREE.BufferGeometry();
    
    // Create highly emissive material optimized for bloom
    const material = new THREE.PointsMaterial({
      size: 0.015,
      transparent: true,
      opacity: 1.0,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false, // Render on top for maximum glow
      sizeAttenuation: true,
      alphaTest: 0.01,
      
      // Critical for bloom effect
      emissive: new THREE.Color(baseColor),
      emissiveIntensity: adjustedEmissiveIntensity,
    });
    
    // Particle data arrays
    const positions = new Float32Array(adjustedParticleCount * 3);
    const colors = new Float32Array(adjustedParticleCount * 3);
    const sizes = new Float32Array(adjustedParticleCount);
    const velocities = new Float32Array(adjustedParticleCount * 3);
    const phases = new Float32Array(adjustedParticleCount);
    const intensities = new Float32Array(adjustedParticleCount);
    const originalPositions = new Float32Array(adjustedParticleCount * 3);
    
    // Color palette for variation
    const baseColorObj = new THREE.Color(baseColor);
    const accentColorObj = new THREE.Color(accentColor);
    
    // Initialize particles in tight spherical distribution
    for (let i = 0; i < adjustedParticleCount; i++) {
      const i3 = i * 3;
      
      // Tight spherical distribution using rejection sampling for better uniformity
      let x, y, z;
      do {
        x = (Math.random() - 0.5) * 2;
        y = (Math.random() - 0.5) * 2;
        z = (Math.random() - 0.5) * 2;
      } while (x*x + y*y + z*z > 1);
      
      // Scale to core radius with density bias toward center
      const distance = Math.pow(Math.random(), 1.5) * coreRadius;
      const magnitude = Math.sqrt(x*x + y*y + z*z);
      
      if (magnitude > 0) {
        x = (x / magnitude) * distance;
        y = (y / magnitude) * distance;
        z = (z / magnitude) * distance;
      }
      
      // Store positions
      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;
      
      // Store original positions for expansion calculation
      originalPositions[i3] = x;
      originalPositions[i3 + 1] = y;
      originalPositions[i3 + 2] = z;
      
      // Random velocities for expansion
      const velocity = new THREE.Vector3(x, y, z).normalize();
      velocity.multiplyScalar(expansionSpeed * (0.5 + Math.random() * 0.5));
      
      velocities[i3] = velocity.x;
      velocities[i3 + 1] = velocity.y;
      velocities[i3 + 2] = velocity.z;
      
      // Color variation (mostly white/blue-white with accents)
      const useAccent = Math.random() < 0.15; // 15% accent particles
      const color = useAccent ? accentColorObj : baseColorObj;
      
      // Add brightness variation
      const brightness = 0.8 + Math.random() * 0.4;
      colors[i3] = color.r * brightness;
      colors[i3 + 1] = color.g * brightness;
      colors[i3 + 2] = color.b * brightness;
      
      // Size variation (smaller particles for denser core look)
      sizes[i] = 0.8 + Math.random() * 0.4;
      
      // Random phase for pulsing
      phases[i] = Math.random() * Math.PI * 2;
      
      // Intensity for individual particle brightness
      intensities[i] = 0.7 + Math.random() * 0.6;
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
        phases, 
        intensities,
        originalPositions
      }
    };
  }, [
    adjustedParticleCount, 
    coreRadius, 
    baseColor, 
    accentColor, 
    adjustedEmissiveIntensity, 
    expansionSpeed
  ]);
  
  // Detect crystal explosion events
  useEffect(() => {
    if (!animationData) return;
    
    const currentForm = animationData.crystalForm;
    const formChanged = currentForm !== lastCrystalForm.current;
    
    if (formChanged) {
      if (lastCrystalForm.current === 'whole' && currentForm === 'exploded') {
        // Crystal explosion detected - trigger core ignition
        console.log('🌟 Crystal explosion detected - igniting particle core');
        
        setIsExploding(true);
        setExplosionPhase('igniting');
        explosionTimeRef.current = 0;
        
        if (onExplosionStart) {
          onExplosionStart();
        }
      } else if (lastCrystalForm.current === 'exploded' && currentForm === 'whole') {
        // Crystal reform - fade out core
        console.log('🌟 Crystal reforming - fading particle core');
        
        setExplosionPhase('fading');
        explosionTimeRef.current = 0;
      }
    }
    
    lastCrystalForm.current = currentForm;
  }, [animationData?.crystalForm, onExplosionStart]);
  
  // Main animation loop
  useFrame((state, delta) => {
    if (!particlesRef.current || !visible) return;
    
    timeRef.current += delta;
    
    if (isExploding) {
      explosionTimeRef.current += delta;
    }
    
    const { positions, velocities, originalPositions, phases, intensities } = particleData;
    
    // Phase management and transitions
    let phaseProgress = 0;
    let globalIntensity = 1;
    let expansionFactor = 1;
    
    switch (explosionPhase) {
      case 'igniting':
        phaseProgress = Math.min(explosionTimeRef.current / 0.3, 1); // 0.3s ignition
        globalIntensity = phaseProgress;
        expansionFactor = 1 + phaseProgress * 0.1; // Slight initial expansion
        
        if (phaseProgress >= 1) {
          setExplosionPhase('expanding');
          explosionTimeRef.current = 0;
          if (onExplosionPeak) onExplosionPeak();
        }
        break;
        
      case 'expanding':
        phaseProgress = Math.min(explosionTimeRef.current / 1.2, 1); // 1.2s expansion
        globalIntensity = 1.2 - phaseProgress * 0.3; // Slight intensity reduction
        expansionFactor = 1 + phaseProgress * (maxExpansion - 1);
        
        if (phaseProgress >= 1) {
          setExplosionPhase('pulsing');
          explosionTimeRef.current = 0;
        }
        break;
        
      case 'pulsing':
        phaseProgress = explosionTimeRef.current / 2.0; // 2s pulsing phase
        globalIntensity = 0.9;
        expansionFactor = maxExpansion;
        
        if (phaseProgress >= 1) {
          setExplosionPhase('fading');
          explosionTimeRef.current = 0;
        }
        break;
        
      case 'fading':
        phaseProgress = Math.min(explosionTimeRef.current / 0.8, 1); // 0.8s fade
        globalIntensity = 1 - phaseProgress;
        expansionFactor = maxExpansion * (1 - phaseProgress * 0.3);
        
        if (phaseProgress >= 1) {
          setIsExploding(false);
          setExplosionPhase('dormant');
          if (onExplosionEnd) onExplosionEnd();
        }
        break;
        
      case 'dormant':
      default:
        globalIntensity = 0;
        expansionFactor = 1;
        break;
    }
    
    // Update particle positions and properties
    for (let i = 0; i < adjustedParticleCount; i++) {
      const i3 = i * 3;
      
      if (explosionPhase === 'dormant') {
        // Keep particles at original positions when dormant
        positions[i3] = originalPositions[i3];
        positions[i3 + 1] = originalPositions[i3 + 1];
        positions[i3 + 2] = originalPositions[i3 + 2];
      } else {
        // Calculate expanded position
        const originalPos = new THREE.Vector3(
          originalPositions[i3],
          originalPositions[i3 + 1],
          originalPositions[i3 + 2]
        );
        
        // Expansion with slight random jitter
        const jitterAmount = 0.002 * Math.sin(timeRef.current * 3 + phases[i]);
        const expandedPos = originalPos.clone().multiplyScalar(expansionFactor);
        
        // Add subtle random motion
        expandedPos.x += Math.sin(timeRef.current * 2 + phases[i]) * jitterAmount;
        expandedPos.y += Math.cos(timeRef.current * 1.7 + phases[i]) * jitterAmount;
        expandedPos.z += Math.sin(timeRef.current * 2.3 + phases[i]) * jitterAmount;
        
        positions[i3] = expandedPos.x;
        positions[i3 + 1] = expandedPos.y;
        positions[i3 + 2] = expandedPos.z;
      }
    }
    
    // Global pulsing effect
    if (pulseEnabled && isExploding) {
      const pulsePhase = Math.sin(timeRef.current * pulseSpeed);
      const pulseMultiplier = THREE.MathUtils.lerp(
        pulseIntensityRange[0],
        pulseIntensityRange[1],
        (pulsePhase + 1) * 0.5
      );
      globalIntensity *= pulseMultiplier;
    }
    
    // Update material properties
    material.opacity = globalIntensity;
    material.emissiveIntensity = adjustedEmissiveIntensity * globalIntensity;
    
    // Update geometry
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });
  
  // Hide particles when not visible or dormant
  const shouldRender = visible && explosionPhase !== 'dormant';
  
  if (!shouldRender) return null;
  
  return (
    <group position={position}>
      {/* Main particle system */}
      <points
        ref={particlesRef}
        geometry={geometry}
        material={material}
        renderOrder={1000} // Render after other objects for bloom effect
      />
      
      {/* Additional glow sphere for enhanced bloom effect */}
      {isExploding && (
        <mesh renderOrder={999}>
          <sphereGeometry args={[coreRadius * 0.5, 16, 12]} />
          <meshBasicMaterial
            color={baseColor}
            transparent={true}
            opacity={0.1}
            emissive={baseColor}
            emissiveIntensity={adjustedEmissiveIntensity * 0.3}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
};

/**
 * Preset configurations for different core types
 */
export const ParticleCorePresets = {
  // Standard blue-white energy core
  default: {
    baseColor: '#ffffff',
    accentColor: '#64ffda',
    emissiveIntensity: 25.0,
    coreRadius: 0.08,
    particleCount: 800,
    pulseSpeed: 2.5,
    maxExpansion: 1.8
  },
  
  // Intense cyan core
  cyan: {
    baseColor: '#64ffda',
    accentColor: '#ffffff',
    emissiveIntensity: 30.0,
    coreRadius: 0.06,
    particleCount: 1000,
    pulseSpeed: 3.0,
    maxExpansion: 2.2
  },
  
  // Purple mystical core
  mystical: {
    baseColor: '#bb86fc',
    accentColor: '#ffffff',
    emissiveIntensity: 28.0,
    coreRadius: 0.09,
    particleCount: 600,
    pulseSpeed: 1.8,
    maxExpansion: 2.0
  },
  
  // Performance-optimized core for mobile
  performance: {
    baseColor: '#ffffff',
    accentColor: '#64ffda',
    emissiveIntensity: 20.0,
    coreRadius: 0.07,
    particleCount: 400,
    pulseSpeed: 2.0,
    maxExpansion: 1.5
  }
};

/**
 * Smart Particle Core with automatic preset selection
 */
export const SmartGlowingParticleCore = ({ animationData, performanceConfig, ...props }) => {
  // Select preset based on performance profile
  let preset = ParticleCorePresets.default;
  
  if (performanceConfig) {
    const tier = performanceConfig.renderScale;
    if (tier < 0.7) {
      preset = ParticleCorePresets.performance;
    } else if (performanceConfig.usePBR) {
      preset = ParticleCorePresets.cyan;
    }
  }
  
  // Merge preset with custom props
  const finalProps = { ...preset, ...props, animationData, performanceConfig };
  
  return <GlowingParticleCore {...finalProps} />;
};

export default GlowingParticleCore;