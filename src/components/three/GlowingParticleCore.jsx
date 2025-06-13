// FIXED: src/components/three/GlowingParticleCore.jsx
// Resolves uniform initialization errors by ensuring all uniforms are properly defined

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * FIXED: Glowing Particle Core Component with proper uniform initialization
 */
const GlowingParticleCore = ({
  // Core properties
  position = [0, 0, 0],
  coreRadius = 0.08,
  coreShape = 'sphere', // NEW: 'sphere', 'pill', 'ellipse'
  coreAspectRatio = 2.0, // NEW: height/width ratio for pill/ellipse shapes
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
  
  // NEW: Timing controls for each phase
  ignitionDuration = 0.3,    // How long ignition takes
  expansionDuration = 1.2,   // How long expansion takes  
  fadeDuration = 0.8,        // How long fade takes
  
  // NEW: Particle shape options
  particleShape = 'points', // 'points', 'spheres', 'cubes', 'diamonds'
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
  
  // FIXED: Create particle system with proper error handling
  const { geometry, material, particleData } = useMemo(() => {
    console.log('🌟 Creating Glowing Particle Core system');
    
    try {
      const geometry = new THREE.BufferGeometry();
      
      // FIXED: Create material with all uniforms properly initialized
      const material = new THREE.PointsMaterial({
        size: 0.15,
        transparent: true,
        opacity: 1.0,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: true, // FIXED: Enable depth test so particles can be occluded by crystal
        sizeAttenuation: true,
        alphaTest: 0.01,
        
        // FIXED: Ensure emissive properties are properly set
        emissive: new THREE.Color(baseColor),
        emissiveIntensity: adjustedEmissiveIntensity,
      });
      
      // FIXED: Validate material was created successfully
      if (!material) {
        throw new Error('Failed to create particle material');
      }
      
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
      
      // FIXED: Safer particle initialization with bounds checking and shape support
      for (let i = 0; i < adjustedParticleCount; i++) {
        const i3 = i * 3;
        
        let x, y, z;
        let attempts = 0;
        
        if (coreShape === 'pill' || coreShape === 'ellipse') {
          // NEW: Pill/elliptical shape distribution
          do {
            x = (Math.random() - 0.5) * 2;
            y = (Math.random() - 0.5) * 2;
            z = (Math.random() - 0.5) * 2;
            
            // Scale Y axis by aspect ratio to create pill/ellipse shape
            const scaledY = y / coreAspectRatio;
            
            attempts++;
            if (attempts > 100) {
              x = y = z = 0;
              break;
            }
          } while (x*x + scaledY*scaledY + z*z > 1);
          
          // Apply aspect ratio to Y coordinate
          y *= coreAspectRatio;
        } else {
          // Original spherical distribution
          do {
            x = (Math.random() - 0.5) * 2;
            y = (Math.random() - 0.5) * 2;
            z = (Math.random() - 0.5) * 2;
            attempts++;
            if (attempts > 100) {
              x = y = z = 0;
              break;
            }
          } while (x*x + y*y + z*z > 1);
        }
        
        // Scale to core radius with density bias toward center
        const distance = Math.pow(Math.random(), 1.5) * coreRadius;
        const magnitude = Math.sqrt(x*x + y*y + z*z);
        
        if (magnitude > 0) {
          x = (x / magnitude) * distance;
          y = (y / magnitude) * distance;
          z = (z / magnitude) * distance;
        }
        
        // Store positions with bounds checking
        positions[i3] = isFinite(x) ? x : 0;
        positions[i3 + 1] = isFinite(y) ? y : 0;
        positions[i3 + 2] = isFinite(z) ? z : 0;
        
        // Store original positions for expansion calculation
        originalPositions[i3] = positions[i3];
        originalPositions[i3 + 1] = positions[i3 + 1];
        originalPositions[i3 + 2] = positions[i3 + 2];
        
        // Random velocities for expansion
        const velocity = new THREE.Vector3(x, y, z).normalize();
        velocity.multiplyScalar(expansionSpeed * (0.5 + Math.random() * 0.5));
        
        velocities[i3] = isFinite(velocity.x) ? velocity.x : 0;
        velocities[i3 + 1] = isFinite(velocity.y) ? velocity.y : 0;
        velocities[i3 + 2] = isFinite(velocity.z) ? velocity.z : 0;
        
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
      
      // FIXED: Set geometry attributes with proper error handling
      try {
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      } catch (error) {
        console.error('Failed to set geometry attributes:', error);
        throw error;
      }
      
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
    } catch (error) {
      console.error('❌ Failed to create particle system:', error);
      
      // Return fallback empty system
      return {
        geometry: new THREE.BufferGeometry(),
        material: new THREE.PointsMaterial({ 
          size: 0.001, 
          transparent: true, 
          opacity: 0,
          visible: false 
        }),
        particleData: null
      };
    }
  }, [
    adjustedParticleCount, 
    coreRadius, 
    baseColor, 
    accentColor, 
    adjustedEmissiveIntensity, 
    expansionSpeed
  ]);
  
  // FIXED: Safer explosion detection with proper state persistence
  useEffect(() => {
    if (!animationData) return;
    
    try {
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
    } catch (error) {
      console.error('❌ Error in explosion detection:', error);
    }
  }, [animationData?.crystalForm, onExplosionStart]);
  
  // FIXED: Main animation loop with extensive error handling
  useFrame((state, delta) => {
    // Safety checks
    if (!particlesRef.current || !visible || !particleData) return;
    
    try {
      timeRef.current += delta;
      
      if (isExploding) {
        explosionTimeRef.current += delta;
      }
      
      const { positions, velocities, originalPositions, phases, intensities } = particleData;
      
      // FIXED: Validate arrays exist before using them
      if (!positions || !originalPositions) {
        console.warn('⚠️ Particle data arrays not available');
        return;
      }
      
      // Phase management and transitions
      let phaseProgress = 0;
      let globalIntensity = 1;
      let expansionFactor = 1;
      
      switch (explosionPhase) {
        case 'igniting':
          phaseProgress = Math.min(explosionTimeRef.current / ignitionDuration, 1); // Use custom ignition duration
          globalIntensity = phaseProgress;
          expansionFactor = 1 + phaseProgress * 0.1; // Slight initial expansion
          
          if (phaseProgress >= 1) {
            setExplosionPhase('expanding');
            explosionTimeRef.current = 0;
            if (onExplosionPeak) onExplosionPeak();
          }
          break;
          
        case 'expanding':
          phaseProgress = Math.min(explosionTimeRef.current / expansionDuration, 1); // Use custom expansion duration
          globalIntensity = 1.2 - phaseProgress * 0.3; // Slight intensity reduction
          expansionFactor = 1 + phaseProgress * (maxExpansion - 1);
          
          if (phaseProgress >= 1) {
            setExplosionPhase('pulsing');
            explosionTimeRef.current = 0;
          }
          break;
          
        case 'pulsing':
          // FIXED: Stay in pulsing phase indefinitely until crystal reforms
          globalIntensity = 0.9;
          expansionFactor = maxExpansion;
          
          // DON'T automatically transition to fading - wait for crystal reform
          // The crystal reform detection will trigger 'fading' phase
          break;
          
        case 'fading':
          phaseProgress = Math.min(explosionTimeRef.current / fadeDuration, 1); // Use custom fade duration
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
      
      // FIXED: Update particle positions with bounds checking
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
            originalPositions[i3] || 0,
            originalPositions[i3 + 1] || 0,
            originalPositions[i3 + 2] || 0
          );
          
          // Expansion with slight random jitter
          const jitterAmount = 0.002 * Math.sin(timeRef.current * 3 + phases[i]);
          const expandedPos = originalPos.clone().multiplyScalar(expansionFactor);
          
          // Add subtle random motion with bounds checking
          const jitterX = Math.sin(timeRef.current * 2 + phases[i]) * jitterAmount;
          const jitterY = Math.cos(timeRef.current * 1.7 + phases[i]) * jitterAmount;
          const jitterZ = Math.sin(timeRef.current * 2.3 + phases[i]) * jitterAmount;
          
          expandedPos.x += isFinite(jitterX) ? jitterX : 0;
          expandedPos.y += isFinite(jitterY) ? jitterY : 0;
          expandedPos.z += isFinite(jitterZ) ? jitterZ : 0;
          
          positions[i3] = isFinite(expandedPos.x) ? expandedPos.x : 0;
          positions[i3 + 1] = isFinite(expandedPos.y) ? expandedPos.y : 0;
          positions[i3 + 2] = isFinite(expandedPos.z) ? expandedPos.z : 0;
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
      
      // FIXED: Update material properties safely
      if (material && material.opacity !== undefined) {
        material.opacity = Math.max(0, Math.min(1, globalIntensity));
        
        // Only update emissiveIntensity if material supports it
        if (material.emissiveIntensity !== undefined) {
          material.emissiveIntensity = adjustedEmissiveIntensity * globalIntensity;
        }
      }
      
      // FIXED: Update geometry safely
      if (particlesRef.current?.geometry?.attributes?.position) {
        particlesRef.current.geometry.attributes.position.needsUpdate = true;
      }
    } catch (error) {
      console.error('❌ Error in particle animation loop:', error);
      // Don't crash the entire scene - just skip this frame
    }
  });
  
  // FIXED: Error handling for cleanup
  useEffect(() => {
    return () => {
      try {
        if (material) {
          material.dispose();
        }
        if (geometry) {
          geometry.dispose();
        }
      } catch (error) {
        console.warn('⚠️ Error during particle cleanup:', error);
      }
    };
  }, [material, geometry]);
  
  // Hide particles when not visible or dormant
  const shouldRender = visible && explosionPhase !== 'dormant' && particleData;
  
  if (!shouldRender) return null;
  
  return (
    <group position={position}>
      // Main particle system - FIXED: Render behind crystal
      <points
        ref={particlesRef}
        geometry={geometry}
        material={material}
        renderOrder={-1000} // FIXED: Negative render order to render BEFORE crystal
      />
      
      {/* Additional glow sphere for enhanced bloom effect - FIXED: Also behind crystal and shape-aware */}
      {isExploding && (
        <mesh renderOrder={-999}> {/* FIXED: Behind main particles but still behind crystal */}
          {coreShape === 'pill' || coreShape === 'ellipse' ? (
            // Elliptical/pill-shaped glow sphere
            <sphereGeometry args={[coreRadius * 0.5, 16, 12]} />
          ) : (
            // Standard spherical glow
            <sphereGeometry args={[coreRadius * 0.5, 16, 12]} />
          )}
          <meshBasicMaterial
            color={baseColor}
            transparent={true}
            opacity={0.1}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={true} // FIXED: Enable depth test so crystal can occlude particles
            side={THREE.DoubleSide}
          />
          {/* Scale the mesh for pill shape */}
          {(coreShape === 'pill' || coreShape === 'ellipse') && (
            <mesh 
              renderOrder={-998}
              scale={[1, coreAspectRatio, 1]} // Apply aspect ratio scaling
            >
              <sphereGeometry args={[coreRadius * 0.3, 16, 12]} />
              <meshBasicMaterial
                color={baseColor}
                transparent={true}
                opacity={0.05}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                depthTest={true}
                side={THREE.DoubleSide}
              />
            </mesh>
          )}
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
    coreShape: 'sphere',
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
    coreShape: 'sphere',
    particleCount: 1000,
    pulseSpeed: 3.0,
    maxExpansion: 2.2
  },
  
  // Purple mystical core - NEW: Pill-shaped for variety
  mystical: {
    baseColor: '#bb86fc',
    accentColor: '#ffffff',
    emissiveIntensity: 28.0,
    coreRadius: 0.09,
    coreShape: 'pill',         // NEW: Pill shape
    coreAspectRatio: 2.5,      // NEW: Taller pill
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
    coreShape: 'sphere',
    particleCount: 400,
    pulseSpeed: 2.0,
    maxExpansion: 1.5
  },
  
  // NEW: Tall pill-shaped core example
  pillCore: {
    baseColor: '#ffffff',
    accentColor: '#64ffda',
    emissiveIntensity: 25.0,
    coreRadius: 0.08,
    coreShape: 'pill',
    coreAspectRatio: 3.0,      // Very tall pill
    particleCount: 800,
    pulseSpeed: 2.5,
    maxExpansion: 2.5          // Wider spread for dramatic effect
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