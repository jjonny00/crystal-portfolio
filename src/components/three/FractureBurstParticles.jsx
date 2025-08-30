import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Particle burst that erupts from the crystal center when triggered.
 */
const FractureBurstParticles = ({
  trigger,
  delay = 0,
  count = 200,
  duration = 1.2,
  color = '#66ffcc',
  spread = 0.5
}) => {
  const linesRef = useRef();
  const startTimeRef = useRef(0);
  const velocitiesRef = useRef();
  const delayRef = useRef();

  const { geometry, velocities } = useMemo(() => {
    const positions = new Float32Array(count * 6);
    const velocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i6 = i * 6;
      const i3 = i * 3;

      const dir = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ).normalize();

      const speed = 20 + Math.random() * 10;
      velocities[i3] = dir.x * speed;
      velocities[i3 + 1] = dir.y * speed;
      velocities[i3 + 2] = dir.z * speed;

      const length = 1 + Math.random() * spread;
      positions[i6] = positions[i6 + 1] = positions[i6 + 2] = 0;
      positions[i6 + 3] = dir.x * length;
      positions[i6 + 4] = dir.y * length;
      positions[i6 + 5] = dir.z * length;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    return { geometry, velocities };
  }, [count, spread]);

  velocitiesRef.current = velocities;

  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        color,
        opacity: 0,
      }),
    [color]
  );

  useEffect(() => {
    if (!geometry) return;

    const reset = () => {
      // Reset positions and regenerate velocities
      const positions = geometry.attributes.position.array;
      const velocities = velocitiesRef.current;
      for (let i = 0; i < count; i++) {
        const i6 = i * 6;
        const i3 = i * 3;

        const dir = new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        ).normalize();

        const speed = 20 + Math.random() * 10;
        velocities[i3] = dir.x * speed;
        velocities[i3 + 1] = dir.y * speed;
        velocities[i3 + 2] = dir.z * speed;

        const length = 1 + Math.random() * spread;
        positions[i6] = positions[i6 + 1] = positions[i6 + 2] = 0;
        positions[i6 + 3] = dir.x * length;
        positions[i6 + 4] = dir.y * length;
        positions[i6 + 5] = dir.z * length;
      }
      geometry.attributes.position.needsUpdate = true;
      material.opacity = 1;
      startTimeRef.current = performance.now();
    };

    if (delay > 0) {
      delayRef.current = setTimeout(reset, delay * 1000);
    } else {
      reset();
    }

    return () => {
      if (delayRef.current) {
        clearTimeout(delayRef.current);
        delayRef.current = null;
      }
    };
  }, [trigger, geometry, material, count, delay, spread]);

  useFrame((_, dt) => {
    if (!startTimeRef.current) return;
    const elapsed = (performance.now() - startTimeRef.current) / 1000;
    const positions = geometry.attributes.position.array;
    const velocities = velocitiesRef.current;

    for (let i = 0; i < count; i++) {
      const i6 = i * 6;
      const i3 = i * 3;

      positions[i6] += velocities[i3] * dt;
      positions[i6 + 1] += velocities[i3 + 1] * dt;
      positions[i6 + 2] += velocities[i3 + 2] * dt;
      positions[i6 + 3] += velocities[i3] * dt;
      positions[i6 + 4] += velocities[i3 + 1] * dt;
      positions[i6 + 5] += velocities[i3 + 2] * dt;
    }
    geometry.attributes.position.needsUpdate = true;

    material.opacity = Math.max(1 - elapsed / duration, 0);
    if (elapsed > duration) {
      startTimeRef.current = 0;
    }
  });

  return (
    <lineSegments
      ref={linesRef}
      geometry={geometry}
      material={material}
      renderOrder={-1}
    />
  );
};

export default FractureBurstParticles;
