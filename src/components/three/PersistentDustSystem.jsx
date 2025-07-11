import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Enhanced Ember System with spiral vortex motion and dynamic fading
 */
const PersistentDustSystem = ({
  count = 80,
  emissionRadius = 1.5,
  emissionHeight = -4.0,
  riseHeight = 23.0,
  baseRiseSpeed = 0.01,
  spiralStrength = 0.8,
  spiralRadius = 1.2,
  spiralSpeed = 1.3,
  driftSpeed = 0.5,
  fadeStart = 0.3,
  fadeEnd = 1.8,
  baseSize = 0.2,
  sizeVariation = 5.0,
  color = '#ff6b35',
  emissiveIntensity = 5.5,
  blending = THREE.AdditiveBlending,
  turbulenceStrength = 0.15,
  turbulenceSpeed = 1.0,
  respawnDelay = 0.5,
  minLifetime = 5.0,
  maxLifetime = 10.0,
}) => {
  const particlesRef = useRef();
  const timeRef = useRef(0);
  
  // Load the particle texture
  const particleTexture = useTexture('/assets/textures/particle-dust01.png');
  
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
    
    // Particle data for animation
    const data = [];
    
    // Create a closure that captures all the parameters we need
    const createParticleData = () => {
      // Random position within emission radius
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * emissionRadius;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = emissionHeight + Math.random() * 0.3;
      
      return {
        basePosition: { x, y, z },
        position: { x, y, z },
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
        }
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
    
    // Create custom shader material
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: particleTexture },
        uTime: { value: 0 },
        uEmissiveIntensity: { value: emissiveIntensity }
      },
      vertexShader: `
        attribute float size;
        attribute float alpha;
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          vColor = color;
          vAlpha = alpha;
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        uniform float uTime;
        uniform float uEmissiveIntensity;
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          vec2 uv = gl_PointCoord;
          vec4 textureColor = texture2D(uTexture, uv);
          
          float distance = length(uv - 0.5);
          float glow = 1.0 - smoothstep(0.0, 0.5, distance);
          
          float flicker = 0.8 + 0.2 * sin(uTime * 10.0 + gl_FragCoord.x * 0.1);
          
          vec3 finalColor = vColor * uEmissiveIntensity * glow * flicker;
          float finalAlpha = vAlpha * glow * textureColor.a;
          
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
    maxLifetime
  ]);

  // Animation loop
  useFrame((state, delta) => {
    timeRef.current += delta;
    
    if (material.uniforms) {
      material.uniforms.uTime.value = timeRef.current;
    }
    
    const positions = geometry.attributes.position.array;
    const colors = geometry.attributes.color.array;
    const alphas = geometry.attributes.alpha.array;
    const sizes = geometry.attributes.size.array;
    
    for (let i = 0; i < count; i++) {
      const particle = particleData[i];
      const i3 = i * 3;
      
      // Update particle lifetime
      particle.age += delta;
      
      if (particle.age >= particle.lifetime) {
        // Respawn particle with new random values
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * emissionRadius;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = emissionHeight + Math.random() * 0.3;
        
        // Reset particle data
        particle.basePosition = { x, y, z };
        particle.position = { x, y, z };
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
      }
      
      if (particle.age > 0) {
        // Update position with spiral motion
        const lifeProgress = particle.age / particle.lifetime;
        const height = lifeProgress * riseHeight * 0.3; // REDUCED: Much slower height progression
        
        // Spiral motion around Y axis  
        const spiralAngle = particle.phase + lifeProgress * Math.PI * 2 * spiralStrength * spiralSpeed; // REDUCED: Less spiral rotation
        const currentSpiralRadius = spiralRadius * (1 - lifeProgress * 0.3);
        
        // Base position with spiral
        const x = particle.basePosition.x + Math.cos(spiralAngle) * currentSpiralRadius;
        const y = particle.basePosition.y + height;
        const z = particle.basePosition.z + Math.sin(spiralAngle) * currentSpiralRadius;
        
        // Add turbulence with speed control
        const turbulentX = x + Math.sin(timeRef.current * 2 * turbulenceSpeed + particle.phase) * particle.turbulence.x;
        const turbulentY = y + Math.sin(timeRef.current * 1.5 * turbulenceSpeed + particle.phase * 1.3) * particle.turbulence.y;
        const turbulentZ = z + Math.cos(timeRef.current * 1.8 * turbulenceSpeed + particle.phase * 0.8) * particle.turbulence.z;
        
        // Update position
        positions[i3] = turbulentX;
        positions[i3 + 1] = turbulentY;
        positions[i3 + 2] = turbulentZ;
        
        // Update color fade (bright to dim)
        const fadeProgress = Math.max(0, Math.min(1, (lifeProgress - fadeStart) / (fadeEnd - fadeStart)));
        const brightness = 1.0 - fadeProgress;
        
        // Ember color transition: bright orange -> dim red -> invisible
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
    
    // Mark attributes for update
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
    geometry.attributes.alpha.needsUpdate = true;
    geometry.attributes.size.needsUpdate = true;
  });

  return <points ref={particlesRef} geometry={geometry} material={material} />;
};

export default PersistentDustSystem;