import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Enhanced Persistent Dust System with Color Cycling
 */
const PersistentDustSystem = ({
  count = 300,
  boundary = 3.6,
  speed = 0.0005,
  baseSize = 0.04,
  sizeVariation = 1.0,
  opacity = 0.5,

  // Single fallback color
  color = '#00fff6',
  // Optional palette for per-particle color variety
  colorPalette,
  blending = THREE.NormalBlending,
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
  // Map palette strings to THREE.Color instances (if provided)
  const paletteColors = useMemo(
    () => colorPalette?.map((c) => new THREE.Color(c)) || [],
    [colorPalette]
  );

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

      // Pick a base color: from palette if provided, otherwise the single color
      const baseColor =
        paletteColors.length > 0
          ? paletteColors[Math.floor(Math.random() * paletteColors.length)]
          : singleColor;

      // Slight brightness variation for subtle differences
      const brightness = 0.8 + Math.random() * 0.4;

      particleColorsArray[i3] = baseColor.r * brightness;
      particleColorsArray[i3 + 1] = baseColor.g * brightness;
      particleColorsArray[i3 + 2] = baseColor.b * brightness;
    }

    velocities.current = vel;
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('color', new THREE.BufferAttribute(particleColorsArray, 3));
    
    return geometry;
  }, [count, boundary, speed, baseSize, sizeVariation, singleColor, paletteColors]);

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