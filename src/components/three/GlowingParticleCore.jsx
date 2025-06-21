// FIXED: src/components/three/GlowingParticleCore.jsx
// Fixed particle expansion - particles now properly expand from origin

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Soft Sphere Shader - Creates radial gradient from center to transparent edges
 */
const createSoftSphereShader = (baseColor, accentColor, emissiveIntensity) => {
  return {
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec2 vUv;
      
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        vUv = uv;
        
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    
    fragmentShader: `
      uniform vec3 baseColor;
      uniform vec3 accentColor;
      uniform float emissiveIntensity;
      uniform float time;
      uniform float glowIntensity;
      
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec2 vUv;
      
      void main() {
        // Calculate distance from center using UV coordinates
        vec2 center = vec2(0.5, 0.5);
        float dist = distance(vUv, center) * 2.0; // 0 at center, 1 at edges
        
        // Create radial alpha gradient (fade to transparent at edges)
        float alpha = 1.0 - smoothstep(0.2, 1.0, dist);
        alpha = pow(alpha, 1.5); // Softer falloff
        
        // Fresnel effect for extra glow at edges (before transparency)
        vec3 viewDir = normalize(vViewPosition);
        float fresnel = 1.0 - abs(dot(vNormal, viewDir));
        fresnel = pow(fresnel, 2.0);
        
        // Mix colors based on distance and fresnel
        vec3 color = mix(baseColor, accentColor, fresnel * 0.3);
        
        // Add emissive glow
        color += color * emissiveIntensity * glowIntensity;
        
        // Pulse effect
        float pulse = sin(time * 3.0) * 0.1 + 0.9;
        alpha *= pulse;
        
        gl_FragColor = vec4(color, alpha);
      }
    `,
    
    uniforms: {
      baseColor: { value: new THREE.Color(baseColor) },
      accentColor: { value: new THREE.Color(accentColor) },
      emissiveIntensity: { value: emissiveIntensity },
      time: { value: 0 },
      glowIntensity: { value: 1.0 }
    }
  };
};

/**
 * FIXED: Glowing Particle Core Component with working expansion
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
  expansionSpeed = 0.5,
  maxExpansion = 1.8,
  
  // FIXED: Key timing controls for each phase
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
  
  // Load the particle texture (same as PersistentDustSystem)
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

  // Create soft sphere material
  const softSphereMaterial = useMemo(() => {
    if (particleShape === 'soft-spheres') {
      const shader = createSoftSphereShader(baseColor, accentColor, adjustedEmissiveIntensity);
      
      return new THREE.ShaderMaterial({
        ...shader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: true,
        side: THREE.DoubleSide
      });
    }
    return null;
  }, [particleShape, baseColor, accentColor, adjustedEmissiveIntensity]);

  // FIXED: Create particle system with VISIBLE particles
  const { geometry, material, particleData, renderType } = useMemo(() => {
    console.log('🌟 Creating particle system with count:', adjustedParticleCount);
    
    try {
      let geometry, material, renderType;
      
      // Clean points rendering with proper depth testing
      geometry = new THREE.BufferGeometry();
      material = new THREE.PointsMaterial({
        size: 1.0, // Good size for textured particles
        transparent: true,
        opacity: 0.9, // Slightly transparent for better blending
        color: new THREE.Color(baseColor),
        vertexColors: true, // Enable vertex colors for variety
        blending: THREE.AdditiveBlending,
        depthWrite: false, // Don't write to depth buffer (for transparency)
        depthTest: true, // BUT do test depth for proper ordering
        sizeAttenuation: true, // Enable distance-based sizing
        alphaTest: 0.01,
        map: particleTexture, // Textured particles
        fog: false, // Don't let fog affect explosion particles
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
      
      // FIXED: Particle initialization with proper distribution
      for (let i = 0; i < adjustedParticleCount; i++) {
        const i3 = i * 3;
        
        // Generate initial positions within core radius
        let x, y, z;
        do {
          x = (Math.random() - 0.5) * 2;
          y = (Math.random() - 0.5) * 2;
          z = (Math.random() - 0.5) * 2;
        } while (x*x + y*y + z*z > 1);
        
        // Scale to core radius
        const distance = Math.pow(Math.random(), 0.5) * coreRadius;
        const magnitude = Math.sqrt(x*x + y*y + z*z);
        
        if (magnitude > 0) {
          x = (x / magnitude) * distance;
          y = (y / magnitude) * distance;
          z = (z / magnitude) * distance;
        }
        
        // Store initial positions (at core)
        positions[i3] = x;
        positions[i3 + 1] = y;
        positions[i3 + 2] = z;
        
        // Store original positions for reference
        originalPositions[i3] = x;
        originalPositions[i3 + 1] = y;
        originalPositions[i3 + 2] = z;
        
        // FIXED: Calculate expansion velocities (direction * speed)
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
        
        // Scale by expansion parameters - REDUCED speed for testing
        const speed = expansionSpeed * 0.1 * (0.5 + Math.random() * 0.5); // Much slower for debugging
        direction.multiplyScalar(speed);
        
        velocities[i3] = direction.x;
        velocities[i3 + 1] = direction.y;
        velocities[i3 + 2] = direction.z;
        
        // Color variation - more natural colors with texture
        const useAccent = Math.random() < 0.25; // More accent particles
        const color = useAccent ? accentColorObj : baseColorObj;
        const brightness = 0.7 + Math.random() * 0.6; // More brightness variation
        
        colors[i3] = color.r * brightness;
        colors[i3 + 1] = color.g * brightness;
        colors[i3 + 2] = color.b * brightness;
        
        // Size variation for more organic look
        sizes[i] = 0.1 + Math.random() * 1.0; // Size range 6-14
        phases[i] = Math.random() * Math.PI * 2;
        intensities[i] = 0.8 + Math.random() * 0.4; // Good intensity range
      }
      
      // Set geometry attributes for POINTS with texture support
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1)); // Individual sizes
      
      console.log('🌟 Created textured particle system:', {
        count: adjustedParticleCount,
        hasTexture: !!particleTexture,
        renderType: 'points'
      });
      
      return { 
        geometry, 
        material,
        renderType: 'points', // Force points
        particleData: { 
          positions, 
          colors, 
          sizes, 
          velocities, 
          phases, 
          intensities,
          originalPositions,
          instanceMatrices: null, // Not used for points
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
    baseColor, 
    accentColor, 
    adjustedEmissiveIntensity, 
    expansionSpeed,
    particleShape,
    particleTexture // Add texture as dependency
  ]);
  
  // SIMPLIFIED: Explosion detection that properly triggers state changes
  useEffect(() => {
    if (!animationData) return;
    
    const currentForm = animationData.crystalForm;
    
    // Only trigger when form actually changes
    if (currentForm !== explosionState.lastCrystalForm) {
      if (explosionState.lastCrystalForm === 'whole' && currentForm === 'exploded') {
        console.log('🌟 Starting particle explosion');
        
        // Reset and start explosion
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
        // Just update the form reference
        setExplosionState(prev => ({
          ...prev,
          lastCrystalForm: currentForm
        }));
      }
    }
  }, [animationData?.crystalForm, explosionState.lastCrystalForm, onExplosionStart]);
  
  // Simplified animation loop
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
    
    // Calculate expansion factor based on elapsed time
    let expansionFactor = 0;
    const totalElapsed = explosionTimeRef.current;
    
    if (explosionState.phase === 'igniting') {
      // Small initial expansion
      const progress = Math.min(totalElapsed / ignitionDuration, 1);
      expansionFactor = progress * 0.2;
      
      if (progress >= 1) {
        setExplosionState(prev => ({
          ...prev,
          phase: 'expanding'
        }));
        explosionTimeRef.current = 0;
      }
    } 
    else if (explosionState.phase === 'expanding') {
      // Main expansion
      const progress = Math.min(totalElapsed / expansionDuration, 1);
      expansionFactor = 0.2 + (progress * (maxExpansion - 0.2)); // From 0.2 to maxExpansion
      
      if (progress >= 1) {
        setExplosionState(prev => ({
          ...prev,
          phase: 'pulsing'
        }));
      }
    }
    else if (explosionState.phase === 'pulsing') {
      // Stay expanded
      expansionFactor = maxExpansion;
    }
    else if (explosionState.phase === 'fading') {
      // Shrink back
      const progress = Math.min(totalElapsed / fadeDuration, 1);
      expansionFactor = maxExpansion * (1 - progress);
      
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
    
    // Update particle positions
    for (let i = 0; i < adjustedParticleCount; i++) {
      const i3 = i * 3;
      
      // Get velocity direction
      const velX = velocities[i3];
      const velY = velocities[i3 + 1];
      const velZ = velocities[i3 + 2];
      
      // Calculate new position = original + (velocity * expansionFactor)
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
  });
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (material) material.dispose();
      if (geometry) geometry.dispose();
    };
  }, [material, geometry]);
  
  // FIXED: Only render when explosion is active
  const shouldRender = visible && explosionState.isActive;
  
  if (!shouldRender) return null;
  
  return (
    <group position={position}>
      {/* Main particle system */}
      <points
        ref={particlesRef}
        geometry={geometry}
        material={material}
        renderOrder={0} // Normal render order for proper depth sorting
        frustumCulled={false} // Never cull particles
      />
    </group>
  );
};

export default GlowingParticleCore;