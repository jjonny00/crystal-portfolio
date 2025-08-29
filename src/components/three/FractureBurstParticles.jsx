import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Particle burst that erupts from the crystal center when triggered.
 */
const FractureBurstParticles = ({ trigger, count = 80, duration = 1.2 }) => {
  const pointsRef = useRef();
  const startTimeRef = useRef(0);
  const velocitiesRef = useRef();

  const texture = useTexture('/assets/textures/particle-dust05.png');

  const { geometry, velocities } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = positions[i3 + 1] = positions[i3 + 2] = 0;

      const dir = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      )
        .normalize()
        .multiplyScalar(2 + Math.random());

      velocities[i3] = dir.x;
      velocities[i3 + 1] = dir.y;
      velocities[i3 + 2] = dir.z;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    return { geometry, velocities };
  }, [count]);

  velocitiesRef.current = velocities;

  const material = useMemo(() =>
    new THREE.PointsMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      size: 0.15,
      color: '#ffffff',
      opacity: 0,
    }),
  [texture]);

  useEffect(() => {
    if (!geometry) return;
    // Reset positions and regenerate velocities
    const positions = geometry.attributes.position.array;
    const velocities = velocitiesRef.current;
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = positions[i3 + 1] = positions[i3 + 2] = 0;
      const dir = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      )
        .normalize()
        .multiplyScalar(2 + Math.random());
      velocities[i3] = dir.x;
      velocities[i3 + 1] = dir.y;
      velocities[i3 + 2] = dir.z;
    }
    geometry.attributes.position.needsUpdate = true;
    material.opacity = 1;
    startTimeRef.current = performance.now();
  }, [trigger, geometry, material, count]);

  useFrame((_, dt) => {
    if (!startTimeRef.current) return;
    const elapsed = (performance.now() - startTimeRef.current) / 1000;
    const positions = geometry.attributes.position.array;
    const velocities = velocitiesRef.current;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] += velocities[i3] * dt;
      positions[i3 + 1] += velocities[i3 + 1] * dt;
      positions[i3 + 2] += velocities[i3 + 2] * dt;
    }
    geometry.attributes.position.needsUpdate = true;

    material.opacity = Math.max(1 - elapsed / duration, 0);
    if (elapsed > duration) {
      startTimeRef.current = 0;
    }
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
};

export default FractureBurstParticles;
