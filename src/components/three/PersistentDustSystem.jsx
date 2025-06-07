import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * PersistentDustSystem
 * A lightweight particle effect that simulates dust floating in the air.
 * Always active, intended for macro-style scenes.
 */
const PersistentDustSystem = ({
  count = 1200,
  boundary = 0.3,
  speed = 0.002,
  size = 0.01
}) => {
  const velocities = useRef();
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * boundary * 2;
      positions[i3 + 1] = (Math.random() - 0.5) * boundary * 2;
      positions[i3 + 2] = (Math.random() - 0.5) * boundary * 2;

      vel[i3] = (Math.random() - 0.5) * speed;
      vel[i3 + 1] = (Math.random() - 0.5) * speed;
      vel[i3 + 2] = (Math.random() - 0.5) * speed;
    }

    velocities.current = vel;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, [count, boundary, speed]);

  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        size,
        color: '#ffffff',
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
        sizeAttenuation: true,
      }),
    [size]
  );

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
