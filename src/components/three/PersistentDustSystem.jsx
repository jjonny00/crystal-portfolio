import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Enhanced Persistent Dust System with Color Cycling
 */
const PersistentDustSystem = ({
  count = 50,
  boundary = 4.0,
  speed = 0.0008,
  baseSize = 0.03,
  sizeVariation = 1.0,
  opacity = 2,
  
  // Simplified to single color only
  color = '#ab9bff',
  blending = THREE.AdditiveBlending,
  alphaTest = 0.01,
  sizeAttenuation = true,
  depthWrite = false,
  fog = true,
  toneMapped = true
}) => {
  const velocities = useRef();
  
  // Load the particle texture
  const particleTexture = useTexture('/assets/textures/particle-dust01.png');
  
  // Configure the texture
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

  // Convert single color to THREE.Color
  const singleColor = useMemo(() => new THREE.Color(color), [color]);

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const particleColorsArray = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Position
      positions[i3] = (Math.random() - 0.5) * boundary * 2;
      positions[i3 + 1] = (Math.random() - 0.5) * boundary * 2;
      positions[i3 + 2] = (Math.random() - 0.5) * boundary * 2;

      // Velocity
      vel[i3] = (Math.random() - 0.5) * speed;
      vel[i3 + 1] = (Math.random() - 0.5) * speed;
      vel[i3 + 2] = (Math.random() - 0.5) * speed;

      // Size
      const sizeMultiplier = 1 + (Math.random() - 0.5) * sizeVariation;
      sizes[i] = baseSize * sizeMultiplier;

      // SIMPLIFIED: Just use the single color for all particles
      const brightness = 0.8 + Math.random() * 0.4;
      
      particleColorsArray[i3] = singleColor.r * brightness;
      particleColorsArray[i3 + 1] = singleColor.g * brightness;
      particleColorsArray[i3 + 2] = singleColor.b * brightness;
    }

    velocities.current = vel;
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('color', new THREE.BufferAttribute(particleColorsArray, 3));
    
    return geometry;
  }, [count, boundary, speed, baseSize, sizeVariation, singleColor]);

  const material = useMemo(() => {
    return new THREE.PointsMaterial({
      size: baseSize,
      sizeAttenuation,
      vertexColors: true, // Use vertex colors from geometry
      
      // Removed emissive properties that weren't working
      
      transparent: true,
      opacity,
      alphaTest,
      blending,
      depthWrite,
      depthTest: true,
      map: particleTexture,
      fog,
      toneMapped,
      side: THREE.DoubleSide,
    });
  }, [baseSize, sizeAttenuation, opacity, alphaTest, 
      blending, depthWrite, fog, toneMapped, particleTexture]);

  // Color interpolation function
  const interpolateColor = (color1, color2, factor) => {
    return {
      r: color1.r + (color2.r - color1.r) * factor,
      g: color1.g + (color2.g - color1.g) * factor,
      b: color1.b + (color2.b - color1.b) * factor
    };
  };

  // Get color for particle based on cycle mode
  const getParticleColor = (particleIndex, time) => {
    const offset = colorOffsets.current[particleIndex];
    const adjustedTime = time * transitionSpeed + offset;
    
    // Ensure we have colors to work with
    if (!colorPalette || colorPalette.length === 0) {
      return new THREE.Color(color);
    }
    
    // Single color case
    if (colorPalette.length === 1) {
      return colorPalette[0];
    }
    
    switch (colorCycleMode) {
      case 'smooth': {
        // Smooth cycling through all colors with proper bounds checking
        const cycle = (adjustedTime * 0.5) % colorPalette.length;
        
        // Ensure we stay within bounds
        const lowerIndex = Math.floor(cycle) % colorPalette.length;
        const upperIndex = (lowerIndex + 1) % colorPalette.length;
        
        // Clamp factor between 0 and 1
        const factor = Math.max(0, Math.min(1, cycle - Math.floor(cycle)));
        
        // Ensure valid indices
        const safeLocalLowerIndex = Math.max(0, Math.min(colorPalette.length - 1, lowerIndex));
        const safeUpperIndex = Math.max(0, Math.min(colorPalette.length - 1, upperIndex));
        
        return interpolateColor(
          colorPalette[safeLocalLowerIndex], 
          colorPalette[safeUpperIndex], 
          factor
        );
      }
      
      case 'discrete': {
        // Discrete color steps with bounds checking
        const cycle = Math.abs(Math.floor((adjustedTime * 0.5))) % colorPalette.length;
        const safeIndex = Math.max(0, Math.min(colorPalette.length - 1, cycle));
        return colorPalette[safeIndex];
      }
      
      case 'random': {
        // Each particle randomly picks from palette with bounds checking
        const normalizedSin = (Math.sin(adjustedTime * 0.1) + 1) * 0.5; // 0 to 1
        const randomIndex = Math.floor(normalizedSin * colorPalette.length);
        const safeIndex = Math.max(0, Math.min(colorPalette.length - 1, randomIndex));
        return colorPalette[safeIndex];
      }
      
      default:
        return colorPalette[0] || new THREE.Color(color);
    }
  };

  useFrame((state, delta) => {
    const pos = geometry.attributes.position.array;
    const vel = velocities.current;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Update positions
      pos[i3] += vel[i3];
      pos[i3 + 1] += vel[i3 + 1];
      pos[i3 + 2] += vel[i3 + 2];

      // Boundary collision
      if (pos[i3] > boundary || pos[i3] < -boundary) vel[i3] = -vel[i3];
      if (pos[i3 + 1] > boundary || pos[i3 + 1] < -boundary) vel[i3 + 1] = -vel[i3 + 1];
      if (pos[i3 + 2] > boundary || pos[i3 + 2] < -boundary) vel[i3 + 2] = -vel[i3 + 2];
    }

    // Only update positions - colors stay static
    geometry.attributes.position.needsUpdate = true;
  });

  return <points geometry={geometry} material={material} />;
};

export default PersistentDustSystem;