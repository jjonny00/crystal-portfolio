import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Simple Emissive Particles - Clean version without debug logging
 */
const PersistentDustSystem = ({
  count = 300,
  boundary = 3.6,
  speed = 0.0005,
  baseSize = 0.04,
  sizeVariation = 1.0,
  opacity = 0.5,
  color = '#00fff6',
  emissive = '#ff0000', // Try bright red
  emissiveIntensity = 100.0, // Try high intensity
  blending = THREE.AdditiveBlending, // Important for emissive
  alphaTest = 0.01,
  sizeAttenuation = true,
  depthWrite = false,
  fog = true,
  toneMapped = false // Important: disable tone mapping for emissive
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

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      positions[i3] = (Math.random() - 0.5) * boundary * 2;
      positions[i3 + 1] = (Math.random() - 0.5) * boundary * 2;
      positions[i3 + 2] = (Math.random() - 0.5) * boundary * 2;

      vel[i3] = (Math.random() - 0.5) * speed;
      vel[i3 + 1] = (Math.random() - 0.5) * speed;
      vel[i3 + 2] = (Math.random() - 0.5) * speed;

      const sizeMultiplier = 1 + (Math.random() - 0.5) * sizeVariation;
      sizes[i] = baseSize * sizeMultiplier;

      const brightness = 0.8 + Math.random() * 0.4;
      const baseColor = new THREE.Color(color);
      colors[i3] = baseColor.r * brightness;
      colors[i3 + 1] = baseColor.g * brightness;
      colors[i3 + 2] = baseColor.b * brightness;
    }

    velocities.current = vel;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geometry;
  }, [count, boundary, speed, baseSize, sizeVariation, color]);

  const material = useMemo(() => {
    return new THREE.PointsMaterial({
      size: baseSize,
      sizeAttenuation,
      color: new THREE.Color(color),
      vertexColors: true,
      
      // EMISSIVE PROPERTIES
      emissive: new THREE.Color(emissive),
      emissiveIntensity: emissiveIntensity,
      
      transparent: true,
      opacity,
      alphaTest,
      blending,
      depthWrite,
      depthTest: true,
      map: particleTexture,
      fog,
      toneMapped, // This is key for emissive visibility
      side: THREE.DoubleSide,
    });
  }, [baseSize, sizeAttenuation, color, emissive, emissiveIntensity, opacity, alphaTest, 
      blending, depthWrite, fog, toneMapped, particleTexture]);

  useFrame(() => {
    const pos = geometry.attributes.position.array;
    const vel = velocities.current;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3] += vel[i3];
      pos[i3 + 1] += vel[i3 + 1];
      pos[i3 + 2] += vel[i3 + 2];

      if (pos[i3] > boundary || pos[i3] < -boundary) vel[i3] = -vel[i3];
      if (pos[i3 + 1] > boundary || pos[i3 + 1] < -boundary) vel[i3 + 1] = -vel[i3 + 1];
      if (pos[i3 + 2] > boundary || pos[i3 + 2] < -boundary) vel[i3 + 2] = -vel[i3 + 2];
    }

    geometry.attributes.position.needsUpdate = true;
  });

  return <points geometry={geometry} material={material} />;
};

export default PersistentDustSystem;