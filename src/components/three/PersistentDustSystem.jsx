// src/components/three/PersistentDustSystem.jsx
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Enhanced Ember System with iridescent shimmer, spiral vortex motion, and directional rotation
 * FIXED: Ring/donut emission pattern and static iridescence
 * NEW: Particles rotate based on their movement direction
 */
const PersistentDustSystem = ({
  count = 16,
  enabled = true,
  emissionRadius = 5.5,
  emissionInnerRadius = 1.0,  // NEW: Inner radius for ring/donut shape
  emissionHeight = -4.0,
  riseHeight = 23.0,
  baseRiseSpeed = 0.01,
  spiralStrength = 0.5,
  spiralRadius = 1.2,
  spiralSpeed = 0.003,
  driftSpeed = 0.5,
  fadeStart = 0.3,
  fadeEnd = 1.8,
  baseSize = 0.2,
  sizeVariation = 8.0,
  color = '#ff6b35',
  emissiveIntensity = 15.5,
  blending = THREE.AdditiveBlending,
  turbulenceStrength = 0.5,
  turbulenceSpeed = 0.5,
  respawnDelay = 0.5,
  minLifetime = 5.0,
  maxLifetime = 10.0,
  // NEW: Improved iridescence parameters
  iridescenceStrength = 0.8,
  iridescenceVariation = 0.3,  // How much each particle varies
  shimmerIntensity = 1.2,
  // NEW: Rotation parameters
  enableRotation = true,        // Enable directional rotation
  rotationSmoothing = 0.1,      // How quickly particles rotate to face new direction (0.1 = smooth, 1.0 = instant)
  maxRotationAngle = Math.PI / 4, // Maximum rotation angle (45 degrees = Math.PI/4) - both directions
  // NEW: Persistence parameters
  enableFrustumCulling = false, // Keep particles alive even when emitter is off-screen
  maxDistance = 100             // Maximum distance from origin before culling particles
}) => {
  if (!enabled) {
    return null;
  }
  const particlesRef = useRef();
  const timeRef = useRef(0);
  
  // Load the particle texture
  const particleTexture = useTexture('/assets/textures/particle-dust05.png');
  
  // Configure the texture for embers
  React.useEffect(() => {
    if (particleTexture) {
      particleTexture.minFilter = THREE.LinearFilter;
      particleTexture.magFilter = THREE.LinearFilter;
      particleTexture.generateMipmaps = false;
      particleTexture.wrapS = THREE.ClampToEdgeWrapping;
      particleTexture.wrapT = THREE.ClampToEdgeWrapping;
      particleTexture.colorSpace = THREE.SRGBColorSpace;
      particleTexture.needsUpdate = true;
    }
  }, [particleTexture]);

  // Initialize particle system
  const { geometry, material, particleData } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    const alphas = new Float32Array(count);
    const lifetimes = new Float32Array(count);
    const phases = new Float32Array(count);
    const turbulence = new Float32Array(count * 3);
    // NEW: Add rotation attributes
    const rotations = new Float32Array(count);
    // NEW: Add static iridescence data (no time animation)
    const iridescenceHues = new Float32Array(count);
    const shimmerPhases = new Float32Array(count);
    
    // Particle data for animation
    const data = [];
    
    // Create a closure that captures all the parameters we need
    const createParticleData = () => {
      // FIXED: Ring/donut emission pattern
      const angle = Math.random() * Math.PI * 2;
      // Generate radius between inner and outer radius for ring shape
      const radius = emissionInnerRadius + Math.random() * (emissionRadius - emissionInnerRadius);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = emissionHeight + Math.random() * 0.3;
      
      return {
        basePosition: { x, y, z },
        position: { x, y, z },
        lastPosition: { x, y, z }, // NEW: Track previous position for velocity calculation
        velocity: {
          x: (Math.random() - 0.5) * 0.01 * driftSpeed,
          y: baseRiseSpeed * (0.5 + Math.random() * 0.3),
          z: (Math.random() - 0.5) * 0.01 * driftSpeed
        },
        size: baseSize + Math.random() * (baseSize * sizeVariation),
        lifetime: minLifetime + Math.random() * (maxLifetime - minLifetime),
        age: 0,
        phase: Math.random() * Math.PI * 2,
        turbulence: {
          x: (Math.random() - 0.5) * 0.3,
          y: (Math.random() - 0.5) * 0.1,
          z: (Math.random() - 0.5) * 0.3
        },
        // NEW: Rotation properties
        rotation: 0, // Start with no rotation (pointing forward)
        targetRotation: 0, // NEW: Target rotation for smooth lerping
        baseRotation: 0, // NEW: Base rotation for limiting range
        // FIXED: Static iridescence properties (no time-based animation)
        iridescenceHue: Math.random(), // Random hue for each particle (0-1)
        shimmerPhase: Math.random() * Math.PI * 2
      };
    };
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Initialize particle
      const particle = createParticleData();
      data.push(particle);
      
      // Set initial positions
      positions[i3] = particle.position.x;
      positions[i3 + 1] = particle.position.y;
      positions[i3 + 2] = particle.position.z;
      
      // Set initial velocities
      velocities[i3] = particle.velocity.x;
      velocities[i3 + 1] = particle.velocity.y;
      velocities[i3 + 2] = particle.velocity.z;
      
      // Set particle properties
      sizes[i] = particle.size;
      lifetimes[i] = particle.lifetime;
      phases[i] = particle.phase;
      
      // NEW: Set rotation properties
      rotations[i] = particle.rotation;
      
      // NEW: Set static iridescence properties
      iridescenceHues[i] = particle.iridescenceHue;
      shimmerPhases[i] = particle.shimmerPhase;
      
      // Set initial colors
      const emberColor = new THREE.Color(color);
      colors[i3] = emberColor.r;
      colors[i3 + 1] = emberColor.g;
      colors[i3 + 2] = emberColor.b;
      alphas[i] = 1.0;
      
      // Random turbulence direction
      turbulence[i3] = (Math.random() - 0.5) * turbulenceStrength;
      turbulence[i3 + 1] = (Math.random() - 0.5) * turbulenceStrength * 0.3;
      turbulence[i3 + 2] = (Math.random() - 0.5) * turbulenceStrength;
    }
    
    // Create geometry
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    // NEW: Add rotation attributes
    geo.setAttribute('rotation', new THREE.BufferAttribute(rotations, 1));
    // NEW: Add static iridescence attributes
    geo.setAttribute('iridescenceHue', new THREE.BufferAttribute(iridescenceHues, 1));
    geo.setAttribute('shimmerPhase', new THREE.BufferAttribute(shimmerPhases, 1));
    
    // ENHANCED: Custom shader material with iridescence and rotation
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: particleTexture },
        uTime: { value: 0 },
        uEmissiveIntensity: { value: emissiveIntensity },
        // FIXED: Simplified iridescence uniforms
        uIridescenceStrength: { value: iridescenceStrength },
        uIridescenceVariation: { value: iridescenceVariation },
        uShimmerIntensity: { value: shimmerIntensity }
      },
      vertexShader: `
        attribute float size;
        attribute float alpha;
        attribute float rotation;
        attribute float iridescenceHue;
        attribute float shimmerPhase;
        
        varying vec3 vColor;
        varying float vAlpha;
        varying vec2 vUv;
        varying float vRotation;
        varying float vIridescenceHue;
        varying float vShimmerPhase;
        varying vec3 vWorldPosition;
        varying vec3 vViewPosition;
        
        void main() {
          vColor = color;
          vAlpha = alpha;
          vUv = uv;
          vRotation = rotation;
          vIridescenceHue = iridescenceHue;
          vShimmerPhase = shimmerPhase;
          
          // Calculate world position for iridescence calculations
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = mvPosition.xyz;
          
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        uniform float uTime;
        uniform float uEmissiveIntensity;
        uniform float uIridescenceStrength;
        uniform float uIridescenceVariation;
        uniform float uShimmerIntensity;
        
        varying vec3 vColor;
        varying float vAlpha;
        varying float vRotation;
        varying float vIridescenceHue;
        varying float vShimmerPhase;
        varying vec3 vWorldPosition;
        varying vec3 vViewPosition;
        
        // Enhanced HSV to RGB conversion for smooth color transitions
        vec3 hsv2rgb(vec3 c) {
          vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
          vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
          return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
        }
        
        // Simple noise for subtle variation
        float noise(vec3 p) {
          return fract(sin(dot(p, vec3(12.9898, 78.233, 54.531))) * 43758.5453);
        }
        
        void main() {
          // NEW: Apply rotation to UV coordinates
          vec2 uv = gl_PointCoord;
          vec2 center = vec2(0.5);
          uv -= center;
          
          float cosR = cos(vRotation);
          float sinR = sin(vRotation);
          mat2 rotationMatrix = mat2(cosR, -sinR, sinR, cosR);
          uv = rotationMatrix * uv;
          
          uv += center;
          
          // Sample texture with rotated coordinates
          vec4 textureColor = texture2D(uTexture, uv);
          
          // Base glow calculation
          float distance = length(uv - 0.5);
          float glow = 1.0 - smoothstep(0.0, 0.5, distance);
          
          // Enhanced flickering with multiple frequencies
          float baseFlicker = 0.8 + 0.2 * sin(uTime * 10.0 + vShimmerPhase);
          float microFlicker = 0.95 + 0.05 * sin(uTime * 30.0 + vShimmerPhase * 2.0);
          float flicker = baseFlicker * microFlicker;
          
          // FIXED: Static iridescence based on particle's fixed hue
          // Add subtle spatial variation using world position
          vec3 spatialVariation = vWorldPosition * 0.1;
          float spatialNoise = noise(spatialVariation) * uIridescenceVariation;
          
          // Create iridescent color from particle's base hue + spatial variation
          float finalHue = mod(vIridescenceHue + spatialNoise, 1.0);
          
          // Create iridescent color in HSV space
          vec3 iridHSV = vec3(
            finalHue, // Use particle's fixed hue with slight variation
            0.8,      // High saturation for vibrant colors
            1.0       // Full brightness
          );
          
          // Convert to RGB
          vec3 iridColor = hsv2rgb(iridHSV);
          
          // Create shimmer intensity based on viewing angle
          float viewDot = abs(dot(normalize(vViewPosition), vec3(0.0, 0.0, 1.0)));
          float shimmer = mix(0.3, 1.0, pow(viewDot, 0.5)) * uShimmerIntensity;
          
          // Blend base color with iridescent color
          vec3 finalColor = mix(vColor, iridColor, uIridescenceStrength * shimmer * glow);
          
          // Apply all effects
          finalColor *= uEmissiveIntensity * glow * flicker;
          float finalAlpha = vAlpha * glow * textureColor.a;
          
          // Add extra sparkle at particle edges
          float edgeSparkle = pow(glow, 3.0) * shimmer * 0.5;
          finalColor += vec3(edgeSparkle);
          
          gl_FragColor = vec4(finalColor, finalAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: blending,
      vertexColors: true
    });
    
    return { 
      geometry: geo, 
      material: mat, 
      particleData: data
    };
  }, [
    count, 
    emissionRadius, 
    emissionInnerRadius,
    emissionHeight,
    baseRiseSpeed, 
    spiralStrength, 
    baseSize, 
    sizeVariation, 
    driftSpeed, 
    color, 
    emissiveIntensity, 
    blending, 
    particleTexture,
    turbulenceStrength,
    minLifetime,
    maxLifetime,
    iridescenceStrength,
    iridescenceVariation,
    shimmerIntensity,
    enableRotation,
    rotationSmoothing,
    maxRotationAngle,
    enableFrustumCulling,
    maxDistance
  ]);

  // Animation loop
  useFrame((state, deltaTime) => {
    timeRef.current += deltaTime;
    
    if (material.uniforms) {
      material.uniforms.uTime.value = timeRef.current;
    }
    
    const positions = geometry.attributes.position.array;
    const colors = geometry.attributes.color.array;
    const alphas = geometry.attributes.alpha.array;
    const sizes = geometry.attributes.size.array;
    const rotations = geometry.attributes.rotation.array;
    const iridescenceHues = geometry.attributes.iridescenceHue.array;
    const shimmerPhases = geometry.attributes.shimmerPhase.array;
    
    for (let i = 0; i < count; i++) {
      const particle = particleData[i];
      const i3 = i * 3;
      
      // Update particle lifetime
      particle.age += deltaTime;
      
      if (particle.age >= particle.lifetime) {
        // Check if we should cull particles that are too far from origin
        if (!enableFrustumCulling) {
          const distanceFromOrigin = Math.sqrt(
            particle.position.x * particle.position.x + 
            particle.position.y * particle.position.y + 
            particle.position.z * particle.position.z
          );
          
          // Only respawn if particle isn't too far away (prevents infinite expansion)
          if (distanceFromOrigin > maxDistance) {
            // Hide particle instead of respawning
            alphas[i] = 0;
            continue;
          }
        }
        
        // FIXED: Respawn particle with ring/donut emission pattern
        const angle = Math.random() * Math.PI * 2;
        const radius = emissionInnerRadius + Math.random() * (emissionRadius - emissionInnerRadius);
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = emissionHeight + Math.random() * 0.3;
        
        // Reset particle data
        particle.basePosition = { x, y, z };
        particle.position = { x, y, z };
        particle.lastPosition = { x, y, z }; // NEW: Reset last position
        particle.velocity = {
          x: (Math.random() - 0.5) * 0.01 * driftSpeed,
          y: baseRiseSpeed * (0.5 + Math.random() * 0.3),
          z: (Math.random() - 0.5) * 0.01 * driftSpeed
        };
        particle.size = baseSize + Math.random() * (baseSize * sizeVariation);
        particle.lifetime = minLifetime + Math.random() * (maxLifetime - minLifetime);
        particle.age = -Math.random() * respawnDelay;
        particle.phase = Math.random() * Math.PI * 2;
        particle.turbulence = {
          x: (Math.random() - 0.5) * 0.3,
          y: (Math.random() - 0.5) * 0.1,
          z: (Math.random() - 0.5) * 0.3
        };
        // NEW: Reset rotation properties
        particle.rotation = 0;
        particle.targetRotation = 0;
        particle.baseRotation = 0;
        // FIXED: Reset static iridescence properties
        particle.iridescenceHue = Math.random();
        particle.shimmerPhase = Math.random() * Math.PI * 2;
        
        // Update attributes
        iridescenceHues[i] = particle.iridescenceHue;
        shimmerPhases[i] = particle.shimmerPhase;
      }
      
      if (particle.age > 0) {
        // Store previous position for velocity calculation
        particle.lastPosition.x = particle.position.x;
        particle.lastPosition.y = particle.position.y;
        particle.lastPosition.z = particle.position.z;
        
        // Update position with unified vortex motion
        const lifeProgress = particle.age / particle.lifetime;
        const height = lifeProgress * riseHeight * 0.3;
        
        // FIXED: Calculate base angle from particle's starting position for unified vortex
        const baseAngle = Math.atan2(particle.basePosition.z, particle.basePosition.x);
        
        // Create unified spiral motion - all particles rotate together around center
        const spiralAngle = baseAngle + (timeRef.current * spiralSpeed) + (lifeProgress * spiralStrength * Math.PI * 2);
        
        // Radius decreases as particles rise (creates inward spiral)
        const startRadius = Math.sqrt(particle.basePosition.x * particle.basePosition.x + particle.basePosition.z * particle.basePosition.z);
        const currentSpiralRadius = startRadius * (1 - lifeProgress * 0.3);
        
        // Calculate new position in the vortex
        const x = Math.cos(spiralAngle) * currentSpiralRadius;
        const y = particle.basePosition.y + height;
        const z = Math.sin(spiralAngle) * currentSpiralRadius;
        
        // Add turbulence with speed control
        const turbulentX = x + Math.sin(timeRef.current * 2 * turbulenceSpeed + particle.phase) * particle.turbulence.x;
        const turbulentY = y + Math.sin(timeRef.current * 1.5 * turbulenceSpeed + particle.phase * 1.3) * particle.turbulence.y;
        const turbulentZ = z + Math.cos(timeRef.current * 1.8 * turbulenceSpeed + particle.phase * 0.8) * particle.turbulence.z;
        
        // Update position
        particle.position.x = turbulentX;
        particle.position.y = turbulentY;
        particle.position.z = turbulentZ;
        
        positions[i3] = turbulentX;
        positions[i3 + 1] = turbulentY;
        positions[i3 + 2] = turbulentZ;
        
        // NEW: Calculate rotation based on Z-axis position (front-to-back relative to camera)
        if (enableRotation) {
          // Use the particle's Z position (front-to-back axis) to determine rotation
          // Positive Z = closer to camera = lean forward (+45°)
          // Negative Z = further from camera = lean backward (-45°)
          const zPosition = particle.position.z;
          
          // Normalize Z position to get rotation value
          // We'll use the emission radius as our reference for maximum Z values
          const normalizedZ = Math.max(-1, Math.min(1, zPosition / emissionRadius));
          
          // Map normalized Z (-1 to +1) to rotation (-45° to +45°)
          const targetRotation = normalizedZ * maxRotationAngle;
          
          // Smooth rotation toward target direction
          let angleDiff = targetRotation - particle.rotation;

          // Smoothly rotate toward target
          particle.rotation += angleDiff * rotationSmoothing * deltaTime * 60;
          
          // Clamp to ensure we stay within -maxRotationAngle to +maxRotationAngle range
          particle.rotation = Math.max(-maxRotationAngle, Math.min(maxRotationAngle, particle.rotation));
          
          // Update rotation attribute
          rotations[i] = particle.rotation;
        }
        
        // Update color fade (bright to dim)
        const fadeProgress = Math.max(0, Math.min(1, (lifeProgress - fadeStart) / (fadeEnd - fadeStart)));
        const brightness = 1.0 - fadeProgress;
        
        // Base ember color (will be modified by iridescence in shader)
        const emberStart = new THREE.Color(color);
        const emberEnd = new THREE.Color('#330000');
        const currentColor = emberStart.clone().lerp(emberEnd, fadeProgress);
        
        colors[i3] = currentColor.r * brightness;
        colors[i3 + 1] = currentColor.g * brightness;
        colors[i3 + 2] = currentColor.b * brightness;
        
        // Update alpha with fade
        alphas[i] = brightness * (1.0 - lifeProgress * 0.7);
        
        // Update size (embers shrink as they burn out)
        const sizeMultiplier = 1.0 - lifeProgress * 0.6;
        sizes[i] = particle.size * sizeMultiplier;
      } else {
        // Hide particle during respawn delay
        alphas[i] = 0;
      }
    }
    
    // FIXED: Mark attributes for update (including new rotation attribute)
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
    geometry.attributes.alpha.needsUpdate = true;
    geometry.attributes.size.needsUpdate = true;
    geometry.attributes.rotation.needsUpdate = true;
    // Note: iridescence attributes are static so they don't need updating every frame
  });

  return (
    <points 
      ref={particlesRef} 
      geometry={geometry} 
      material={material}
      // Disable frustum culling to keep particles alive when emitter goes off-screen
      frustumCulled={enableFrustumCulling}
    />
  );
};

export default PersistentDustSystem;