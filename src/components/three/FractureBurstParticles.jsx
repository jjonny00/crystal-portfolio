import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Glitter gust that emits from crystal center on fracture.
 */
const FractureBurstParticles = ({
  trigger,
  delay = 0,
  count = 260,
  duration = 0.55,
  color = '#9af8ff',
  spread = 0.08,
}) => {
  const pointsRef = useRef();
  const startTimeRef = useRef(0);
  const delayRef = useRef(null);

  const velocitiesRef = useRef(new Float32Array(count * 3));
  const lifetimesRef = useRef(new Float32Array(count));
  const seedsRef = useRef(new Float32Array(count));

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute('aAlpha', new THREE.BufferAttribute(new Float32Array(count), 1));
    g.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(count), 1));
    return g;
  }, [count]);

  const material = useMemo(() => {
    const shaderMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uColor: { value: new THREE.Color(color) },
      },
      vertexShader: `
        attribute float aAlpha;
        attribute float aSize;
        varying float vAlpha;
        void main() {
          vAlpha = aAlpha;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * (220.0 / max(-mvPosition.z, 0.1));
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vAlpha;
        void main() {
          vec2 uv = gl_PointCoord - vec2(0.5);
          float d = length(uv);
          float sparkle = smoothstep(0.5, 0.0, d);
          gl_FragColor = vec4(uColor, vAlpha * sparkle);
        }
      `,
    });

    return shaderMaterial;
  }, [color]);

  useEffect(() => {
    if (material.uniforms?.uColor) {
      material.uniforms.uColor.value.set(color);
    }
  }, [material, color]);

  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  useEffect(() => {
    if (delayRef.current) {
      clearTimeout(delayRef.current);
      delayRef.current = null;
    }

    if (!trigger) {
      startTimeRef.current = 0;
      return;
    }

    let cancelled = false;

    const reset = () => {
      if (cancelled) return;

      const positions = geometry.attributes.position.array;
      const alphas = geometry.attributes.aAlpha.array;
      const sizes = geometry.attributes.aSize.array;
      const velocities = velocitiesRef.current;
      const lifetimes = lifetimesRef.current;
      const seeds = seedsRef.current;

      for (let i = 0; i < count; i += 1) {
        const i3 = i * 3;

        const angle = Math.random() * Math.PI * 2;
        const radial = Math.random() * spread;
        const burstRadial = 1.1 + Math.random() * 2.4;
        positions[i3] = Math.cos(angle) * radial;
        positions[i3 + 1] = (Math.random() - 0.5) * spread * 0.35;
        positions[i3 + 2] = Math.sin(angle) * radial;

        const lateralSpeed = burstRadial;
        velocities[i3] = Math.cos(angle) * lateralSpeed;
        velocities[i3 + 1] = 5.6 + Math.random() * 4.8;
        velocities[i3 + 2] = Math.sin(angle) * lateralSpeed;

        lifetimes[i] = duration * (0.65 + Math.random() * 0.5);
        seeds[i] = Math.random() * Math.PI * 2;
        alphas[i] = 1;
        sizes[i] = 12 + Math.random() * 18;
      }

      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.aAlpha.needsUpdate = true;
      geometry.attributes.aSize.needsUpdate = true;
      startTimeRef.current = performance.now();
    };

    if (delay > 0) {
      delayRef.current = setTimeout(() => {
        delayRef.current = null;
        reset();
      }, delay * 1000);
    } else {
      reset();
    }

    return () => {
      cancelled = true;
      if (delayRef.current) {
        clearTimeout(delayRef.current);
        delayRef.current = null;
      }
    };
  }, [trigger, delay, count, duration, spread, geometry]);

  useFrame((_, dt) => {
    if (!startTimeRef.current) return;

    const now = performance.now();
    const elapsed = (now - startTimeRef.current) / 1000;
    const positions = geometry.attributes.position.array;
    const alphas = geometry.attributes.aAlpha.array;
    const velocities = velocitiesRef.current;
    const lifetimes = lifetimesRef.current;
    const seeds = seedsRef.current;

    let aliveCount = 0;

    for (let i = 0; i < count; i += 1) {
      const i3 = i * 3;
      const life = lifetimes[i] || duration;
      const t = Math.min(elapsed / life, 1);

      if (t >= 1) {
        alphas[i] = 0;
        continue;
      }

      aliveCount += 1;

      const gust = 4.4 * (1 - t);
      const swirlX = Math.sin(elapsed * 12 + seeds[i]) * gust;
      const swirlZ = Math.cos(elapsed * 10 + seeds[i] * 1.7) * gust;

      velocities[i3] += swirlX * dt;
      velocities[i3 + 2] += swirlZ * dt;
      velocities[i3 + 1] += 8.5 * dt;

      velocities[i3] *= 0.91;
      velocities[i3 + 1] *= 0.97;
      velocities[i3 + 2] *= 0.91;

      positions[i3] += velocities[i3] * dt;
      positions[i3 + 1] += velocities[i3 + 1] * dt;
      positions[i3 + 2] += velocities[i3 + 2] * dt;

      alphas[i] = (1 - t) * (1 - t);
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.aAlpha.needsUpdate = true;

    if (aliveCount === 0) {
      startTimeRef.current = 0;
    }
  });

  return <points ref={pointsRef} geometry={geometry} material={material} renderOrder={-1} />;
};

export default FractureBurstParticles;
