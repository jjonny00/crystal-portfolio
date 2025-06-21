// FIXED: src/components/three/GlowingParticleCore.jsx
// Complete implementation with working instanced sphere position updates

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
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
 * Soft Point Shader - For ultra-soft circular particles
 */
const createSoftPointShader = (baseColor, accentColor, emissiveIntensity) => {
  return {
    vertexShader: `
      attribute float size;
      attribute vec3 particleColor;
      attribute float intensity;
      
      uniform float time;
      uniform float globalIntensity;
      
      varying vec3 vColor;
      varying float vIntensity;
      
      void main() {
        vColor = particleColor;
        vIntensity = intensity * globalIntensity;
        
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        
        // Size attenuation with distance
        gl_PointSize = size * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    
    fragmentShader: `
      uniform float time;
      
      varying vec3 vColor;
      varying float vIntensity;
      
      void main() {
        // Create circular gradient from center to edge
        vec2 center = vec2(0.5, 0.5);
        float dist = distance(gl_PointCoord, center);
        
        // Soft circular fade - perfect circles
        float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
        alpha = pow(alpha, 2.0); // Extra soft falloff
        
        // Pulse effect
        float pulse = sin(time * 2.0) * 0.2 + 0.8;
        alpha *= pulse * vIntensity;
        
        // Add some glow
        vec3 finalColor = vColor * (1.0 + vIntensity * 0.5);
        
        gl_FragColor = vec4(finalColor, alpha);
      }
    `,
    
    uniforms: {
      time: { value: 0 },
      globalIntensity: { value: emissiveIntensity }
    }
  };
};

/**
 * FIXED: Glowing Particle Core Component with working instanced sphere updates
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
  
  // Timing controls for each phase
  ignitionDuration = 0.3,
  expansionDuration = 1.2,
  fadeDuration = 0.8,
  
  // Particle shape options
  particleShape = 'soft-spheres', // 'points', 'spheres', 'soft-spheres', 'soft-points', 'cubes', 'diamonds'
  
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
  
  // State tracking
  const [isExploding, setIsExploding] = useState(false);
  const [explosionPhase, setExplosionPhase] = useState('dormant');
  const lastCrystalForm = useRef('whole');
  
  // Performance adjustments
  const {
    renderScale = 1.0,
    usePBR = true
  } = performanceConfig;
  
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

  // FIXED: Create particle system with proper instanced sphere handling
  const { geometry, material, particleData, renderType } = useMemo(() => {
    console.log('🌟 Creating Glowing Particle Core system with shape:', particleShape);
    
    try {
      let geometry, material, renderType;
      
      // Handle different particle shapes
      if (particleShape === 'soft-spheres') {
        // Use instanced spheres with soft shader
        geometry = new THREE.InstancedBufferGeometry().copy(new THREE.SphereGeometry(0.02, 12, 8));
        material = softSphereMaterial;
        renderType = 'instancedMesh';
        
      } else if (particleShape === 'soft-points') {
        // Use points with custom shader for maximum softness
        geometry = new THREE.BufferGeometry();
        
        const pointShader = createSoftPointShader(baseColor, accentColor, adjustedEmissiveIntensity);
        material = new THREE.ShaderMaterial({
          ...pointShader,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          depthTest: true,
          vertexColors: true
        });
        
        renderType = 'points';
        
      } else if (particleShape === 'spheres') {
        // Original hard-edge spheres
        geometry = new THREE.InstancedBufferGeometry().copy(new THREE.SphereGeometry(0.02, 8, 6));
        
        material = new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: 1.0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          depthTest: true,
          color: new THREE.Color(baseColor),
          emissive: new THREE.Color(baseColor),
          emissiveIntensity: adjustedEmissiveIntensity * 0.5,
        });
        
        renderType = 'instancedMesh';
        
      } else if (particleShape === 'cubes') {
        // Instanced cubes
        geometry = new THREE.InstancedBufferGeometry().copy(new THREE.BoxGeometry(0.03, 0.03, 0.03));
        
        material = new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: 1.0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          depthTest: true,
          color: new THREE.Color(baseColor),
          emissive: new THREE.Color(baseColor),
          emissiveIntensity: adjustedEmissiveIntensity * 0.5,
        });
        
        renderType = 'instancedMesh';
        
      } else {
        // Default: points (original behavior)
        geometry = new THREE.BufferGeometry();
        
        material = new THREE.PointsMaterial({
          size: 0.15,
          transparent: true,
          opacity: 1.0,
          vertexColors: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          depthTest: true,
          sizeAttenuation: true,
          alphaTest: 0.01,
        });
        
        renderType = 'points';
      }
      
      // Validate material was created successfully
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
      
      // For instanced rendering, we need additional arrays
      const instanceMatrices = renderType === 'instancedMesh' ? new Float32Array(adjustedParticleCount * 16) : null;
      const instanceColors = renderType === 'instancedMesh' ? new Float32Array(adjustedParticleCount * 3) : null;
      
      // Color palette for variation
      const baseColorObj = new THREE.Color(baseColor);
      const accentColorObj = new THREE.Color(accentColor);
      
      // Particle initialization
      for (let i = 0; i < adjustedParticleCount; i++) {
        const i3 = i * 3;
        
        let x, y, z;
        let attempts = 0;
        
        if (coreShape === 'pill' || coreShape === 'ellipse') {
          // Pill/elliptical shape distribution
          do {
            x = (Math.random() - 0.5) * 2;
            y = (Math.random() - 0.5) * 2;
            z = (Math.random() - 0.5) * 2;
            
            const scaledY = y / coreAspectRatio;
            
            attempts++;
            if (attempts > 100) {
              x = y = z = 0;
              break;
            }
          } while (x*x + scaledY*scaledY + z*z > 1);
          
          y *= coreAspectRatio;
        } else {
          // Spherical distribution
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
        
        // Color variation
        const useAccent = Math.random() < 0.15;
        const color = useAccent ? accentColorObj : baseColorObj;
        
        const brightness = 0.8 + Math.random() * 0.4;
        colors[i3] = color.r * brightness;
        colors[i3 + 1] = color.g * brightness;
        colors[i3 + 2] = color.b * brightness;
        
        // Size variation
        sizes[i] = 0.8 + Math.random() * 0.4;
        
        // Random phase for pulsing
        phases[i] = Math.random() * Math.PI * 2;
        
        // Intensity for individual particle brightness
        intensities[i] = 0.7 + Math.random() * 0.6;
      }
      
      // Set geometry attributes
      try {
        if (renderType === 'points') {
          // Standard points rendering
          geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
          geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
          
          // For soft points, add extra attributes
          if (particleShape === 'soft-points') {
            geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
            geometry.setAttribute('particleColor', new THREE.BufferAttribute(colors, 3));
            geometry.setAttribute('intensity', new THREE.BufferAttribute(intensities, 1));
          }
          
        } else if (renderType === 'instancedMesh') {
          // FIXED: Instanced rendering setup with proper matrix handling
          geometry.instanceCount = adjustedParticleCount;
          
          // Set up instance matrices - start all at original positions
          const matrix = new THREE.Matrix4();
          for (let i = 0; i < adjustedParticleCount; i++) {
            const i3 = i * 3;
            const i16 = i * 16;
            
            // Create transformation matrix for this instance
            matrix.makeScale(1, 1, 1);
            matrix.setPosition(positions[i3], positions[i3 + 1], positions[i3 + 2]);
            matrix.toArray(instanceMatrices, i16);
            
            // Set instance colors
            instanceColors[i3] = colors[i3];
            instanceColors[i3 + 1] = colors[i3 + 1];
            instanceColors[i3 + 2] = colors[i3 + 2];
          }
          
          // CRITICAL: Use InstancedBufferAttribute for proper instancing
          geometry.setAttribute('instanceMatrix', new THREE.InstancedBufferAttribute(instanceMatrices, 16));
          geometry.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(instanceColors, 3));
        }
      } catch (error) {
        console.error('Failed to set geometry attributes:', error);
        throw error;
      }
      
      return { 
        geometry, 
        material,
        renderType,
        particleData: { 
          positions, 
          colors, 
          sizes, 
          velocities, 
          phases, 
          intensities,
          originalPositions,
          instanceMatrices,
          instanceColors
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
    coreShape,
    coreAspectRatio,
    particleShape,
    softSphereMaterial
  ]);
  
  // Explosion detection
  useEffect(() => {
    if (!animationData) return;
    
    try {
      const currentForm = animationData.crystalForm;
      const formChanged = currentForm !== lastCrystalForm.current;
      
      if (formChanged) {
        if (lastCrystalForm.current === 'whole' && currentForm === 'exploded') {
          console.log('🌟 Crystal explosion detected - igniting particle core');
          
          setIsExploding(true);
          setExplosionPhase('igniting');
          explosionTimeRef.current = 0;
          
          if (onExplosionStart) {
            onExplosionStart();
          }
        } else if (lastCrystalForm.current === 'exploded' && currentForm === 'whole') {
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
  
  // FIXED: Main animation loop with proper instanced sphere updates
  useFrame((state, delta) => {
    if (!particlesRef.current || !visible || !particleData) return;
    
    try {
      timeRef.current += delta;
      
      if (isExploding) {
        explosionTimeRef.current += delta;
      }

      // Update shader uniforms for soft particles
      if (material && material.uniforms) {
        if (material.uniforms.time) {
          material.uniforms.time.value = timeRef.current;
        }
        if (material.uniforms.glowIntensity) {
          // Calculate glow intensity based on explosion phase
          let globalIntensity = 1;
          
          switch (explosionPhase) {
            case 'igniting':
              const ignitionProgress = Math.min(explosionTimeRef.current / ignitionDuration, 1);
              globalIntensity = ignitionProgress;
              break;
            case 'expanding':
              const expansionProgress = Math.min(explosionTimeRef.current / expansionDuration, 1);
              globalIntensity = 1.2 - expansionProgress * 0.3;
              break;
            case 'pulsing':
              globalIntensity = 0.9;
              break;
            case 'fading':
              const fadeProgress = Math.min(explosionTimeRef.current / fadeDuration, 1);
              globalIntensity = 1 - fadeProgress;
              break;
            default:
              globalIntensity = 0;
          }
          
          material.uniforms.glowIntensity.value = globalIntensity;
        }
        if (material.uniforms.globalIntensity) {
          material.uniforms.globalIntensity.value = material.uniforms.glowIntensity?.value || 1.0;
        }
      }
      
      const { positions, velocities, originalPositions, phases, intensities } = particleData;
      
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
          phaseProgress = Math.min(explosionTimeRef.current / ignitionDuration, 1);
          globalIntensity = phaseProgress;
          expansionFactor = 1 + phaseProgress * 0.1;
          
          if (phaseProgress >= 1) {
            setExplosionPhase('expanding');
            explosionTimeRef.current = 0;
            if (onExplosionPeak) onExplosionPeak();
          }
          break;
          
        case 'expanding':
          phaseProgress = Math.min(explosionTimeRef.current / expansionDuration, 1);
          globalIntensity = 1.2 - phaseProgress * 0.3;
          expansionFactor = 1 + phaseProgress * (maxExpansion - 1);
          
          if (phaseProgress >= 1) {
            setExplosionPhase('pulsing');
            explosionTimeRef.current = 0;
          }
          break;
          
        case 'pulsing':
          globalIntensity = 0.9;
          expansionFactor = maxExpansion;
          break;
          
        case 'fading':
          phaseProgress = Math.min(explosionTimeRef.current / fadeDuration, 1);
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
      
      // Update particle positions
      for (let i = 0; i < adjustedParticleCount; i++) {
        const i3 = i * 3;
        
        if (explosionPhase === 'dormant') {
          positions[i3] = originalPositions[i3];
          positions[i3 + 1] = originalPositions[i3 + 1];
          positions[i3 + 2] = originalPositions[i3 + 2];
        } else {
          const originalPos = new THREE.Vector3(
            originalPositions[i3] || 0,
            originalPositions[i3 + 1] || 0,
            originalPositions[i3 + 2] || 0
          );
          
          const jitterAmount = 0.002 * Math.sin(timeRef.current * 3 + phases[i]);
          const expandedPos = originalPos.clone().multiplyScalar(expansionFactor);
          
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
      
      // CRITICAL FIX: Update geometry based on render type
      if (renderType === 'instancedMesh' && particleData.instanceMatrices) {
        // FIXED: This is the key part that was broken for instanced spheres!
        const matrix = new THREE.Matrix4();
        for (let i = 0; i < adjustedParticleCount; i++) {
          const i3 = i * 3;
          const i16 = i * 16;
          
          // Apply scale based on expansion (subtle scaling effect)
          const scale = 1 + (expansionFactor - 1) * 0.1;
          
          // FIXED: Create proper transformation matrix with position and scale
          matrix.makeScale(scale, scale, scale);
          matrix.setPosition(positions[i3], positions[i3 + 1], positions[i3 + 2]);
          
          // FIXED: Store matrix in the instance matrices array
          matrix.toArray(particleData.instanceMatrices, i16);
        }
        
        // CRITICAL: Mark the instance matrix attribute for GPU update
        if (particlesRef.current?.geometry?.attributes?.instanceMatrix) {
          particlesRef.current.geometry.attributes.instanceMatrix.needsUpdate = true;
        }
        
        // Debug log occasionally to verify positions are updating
        if (process.env.NODE_ENV === 'development' && Math.random() < 0.005) {
          console.log('🌟 Instanced sphere positions updated:', {
            expansionFactor: expansionFactor.toFixed(2),
            firstParticlePos: [
              positions[0]?.toFixed(3), 
              positions[1]?.toFixed(3), 
              positions[2]?.toFixed(3)
            ],
            phase: explosionPhase,
            renderType: renderType
          });
        }
        
      } else if (renderType === 'points') {
        // For points rendering, just update the position attribute
        if (particlesRef.current?.geometry?.attributes?.position) {
          particlesRef.current.geometry.attributes.position.needsUpdate = true;
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
      if (material && material.opacity !== undefined) {
        material.opacity = Math.max(0, Math.min(1, globalIntensity));
        
        if (material.emissiveIntensity !== undefined) {
          material.emissiveIntensity = adjustedEmissiveIntensity * globalIntensity;
        }
      }
      
    } catch (error) {
      console.error('❌ Error in particle animation loop:', error);
    }
  });
  
  // Cleanup
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
  
  const shouldRender = visible && explosionPhase !== 'dormant' && particleData;
  
  if (!shouldRender) return null;
  
  return (
    <group position={position}>
      {/* Render different particle types based on particleShape */}
      {renderType === 'instancedMesh' ? (
        <instancedMesh
          ref={particlesRef}
          args={[geometry, material, adjustedParticleCount]}
          renderOrder={-1000}
          frustumCulled={frustumCulled}
        />
      ) : (
        <points
          ref={particlesRef}
          geometry={geometry}
          material={material}
          renderOrder={-1000}
          frustumCulled={frustumCulled}
        />
      )}
      
      {/* Additional glow sphere for extra effect */}
      {isExploding && (
        <mesh renderOrder={-999} frustumCulled={frustumCulled}>
          <sphereGeometry args={[coreRadius * 0.5, 16, 12]} />
          <meshBasicMaterial
            color={baseColor}
            transparent={true}
            opacity={0.1}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={true}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
};

/**
 * Updated Preset configurations with soft particle options
 */
export const ParticleCorePresets = {
  // Soft spheres with beautiful fade-to-transparent edges
  softSpheres: {
    baseColor: '#ffffff',
    accentColor: '#64ffda',
    emissiveIntensity: 25.0,
    coreRadius: 0.08,
    coreShape: 'sphere',
    particleCount: 800,
    particleShape: 'soft-spheres',
    pulseSpeed: 2.5,
    maxExpansion: 1.8,
    frustumCulled: false
  },
  
  // Ultra-soft circular points for maximum performance
  softPoints: {
    baseColor: '#ffffff',
    accentColor: '#64ffda',
    emissiveIntensity: 20.0,
    coreRadius: 0.08,
    coreShape: 'sphere',
    particleCount: 1200,
    particleShape: 'soft-points',
    pulseSpeed: 2.0,
    maxExpansion: 2.2,
    frustumCulled: false
  },
  
  // Default hard spheres (original)
  default: {
    baseColor: '#ffffff',
    accentColor: '#64ffda',
    emissiveIntensity: 25.0,
    coreRadius: 0.08,
    coreShape: 'sphere',
    particleCount: 800,
    particleShape: 'spheres',
    pulseSpeed: 2.5,
    maxExpansion: 1.8,
    frustumCulled: false
  },
  
  // Intense cyan soft core
  cyanSoft: {
    baseColor: '#64ffda',
    accentColor: '#ffffff',
    emissiveIntensity: 30.0,
    coreRadius: 0.06,
    coreShape: 'sphere',
    particleCount: 1000,
    particleShape: 'soft-spheres',
    pulseSpeed: 3.0,
    maxExpansion: 2.2,
    frustumCulled: false
  },
  
  // Purple mystical soft core - Pill-shaped
  mysticalSoft: {
    baseColor: '#bb86fc',
    accentColor: '#ffffff',
    emissiveIntensity: 28.0,
    coreRadius: 0.09,
    coreShape: 'pill',
    coreAspectRatio: 2.5,
    particleCount: 600,
    particleShape: 'soft-spheres',
    pulseSpeed: 1.8,
    maxExpansion: 2.0,
    frustumCulled: false
  },
  
  // Performance-optimized soft core for mobile
  performanceSoft: {
    baseColor: '#ffffff',
    accentColor: '#64ffda',
    emissiveIntensity: 18.0,
    coreRadius: 0.07,
    coreShape: 'sphere',
    particleCount: 400,
    particleShape: 'soft-points',
    pulseSpeed: 2.0,
    maxExpansion: 1.5,
    frustumCulled: false
  }
};

/**
 * Smart Particle Core with automatic preset selection and soft edges
 */
export const SmartGlowingParticleCore = ({ animationData, performanceConfig, ...props }) => {
  // Select preset based on performance profile
  let preset = ParticleCorePresets.softSpheres; // Default to soft spheres
  
  if (performanceConfig) {
    const tier = performanceConfig.renderScale;
    if (tier < 0.7) {
      preset = ParticleCorePresets.performanceSoft; // Use soft points for performance
    } else if (performanceConfig.usePBR) {
      preset = ParticleCorePresets.cyanSoft; // High quality soft spheres
    }
  }
  
  // Merge preset with custom props
  const finalProps = { ...preset, ...props, animationData, performanceConfig };
  
  return <GlowingParticleCore {...finalProps} />;
};

export default GlowingParticleCore;