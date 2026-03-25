import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const VORTEX_TURBULENCE_STRENGTH = 0.9;
const VORTEX_TURBULENCE_SPEED = 0.5;

/**
 * Glitter gust that emits from crystal center on fracture.
 */
const FractureBurstParticles = ({
  trigger,
  delay = 0,
  count = 260,
  duration = 1.2,
  color = '#9af8ff',
  spread = 0.5,
}) => {
  const pointsRef = useRef();
  const startTimeRef = useRef(0);
  const delayRef = useRef(null);

  const velocitiesRef = useRef(new Float32Array(count * 3));
  const lifetimesRef = useRef(new Float32Array(count));
  const seedsRef = useRef(new Float32Array(count));
  const turbulenceRef = useRef(new Float32Array(count * 3));

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute('aAlpha', new THREE.BufferAttribute(new Float32Array(count), 1));
    g.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(count), 1));
    g.setAttribute('aFlicker', new THREE.BufferAttribute(new Float32Array(count), 1));
    g.setAttribute('aBrightness', new THREE.BufferAttribute(new Float32Array(count), 1));
    return g;
  }, [count]);

  const material = useMemo(() => {
    const shaderMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uColor: { value: new THREE.Color(color) },
        uTime: { value: 0 },
        uBrightness: { value: 1.0 },
      },
      vertexShader: `
        attribute float aAlpha;
        attribute float aSize;
        attribute float aFlicker;
        attribute float aBrightness;
        varying float vAlpha;
        varying float vFlicker;
        varying float vBrightness;
        void main() {
          vAlpha = aAlpha;
          vFlicker = aFlicker;
          vBrightness = aBrightness;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * (90.0 / max(-mvPosition.z, 0.1));
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uTime;
        uniform float uBrightness;
        varying float vAlpha;
        varying float vFlicker;
        varying float vBrightness;
        void main() {
          vec2 uv = gl_PointCoord - vec2(0.5);
          float d = length(uv);
          float sparkle = smoothstep(0.5, 0.0, d);
          float flicker = 0.55 + 0.45 * sin(uTime * 22.0 + vFlicker);
          vec3 brightColor = uColor * uBrightness * vBrightness;
          gl_FragColor = vec4(brightColor, vAlpha * sparkle * flicker);
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
      const flickers = geometry.attributes.aFlicker.array;
      const brightnesses = geometry.attributes.aBrightness.array;
      const velocities = velocitiesRef.current;
      const lifetimes = lifetimesRef.current;
      const seeds = seedsRef.current;
      const turbulence = turbulenceRef.current;

      for (let i = 0; i < count; i += 1) {
        const i3 = i * 3;

        const angle = Math.random() * Math.PI * 2;
        const radial = Math.random() * spread;
        const burstRadial = 0.05 + Math.random() * 0.9;
        positions[i3] = Math.cos(angle) * radial;
        const emitterHeight = 0.6;
        const emitterDepthOffset = 1.7;
        positions[i3 + 1] = emitterHeight + (Math.random() - 0.5) * spread * 0.2;
        positions[i3 + 2] = emitterDepthOffset + Math.sin(angle) * radial;

        const lateralSpeed = burstRadial;
        velocities[i3] = Math.cos(angle) * lateralSpeed;
        velocities[i3 + 1] = 0.05 + Math.random() * 0.9;
        velocities[i3 + 2] = Math.sin(angle) * lateralSpeed;

        lifetimes[i] = duration * (0.45 + Math.random() * 1.8);
        seeds[i] = Math.random() * Math.PI * 2;
        turbulence[i3] = (Math.random() - 0.5) * VORTEX_TURBULENCE_STRENGTH;
        turbulence[i3 + 1] = (Math.random() - 0.5) * VORTEX_TURBULENCE_STRENGTH * 0.3;
        turbulence[i3 + 2] = (Math.random() - 0.5) * VORTEX_TURBULENCE_STRENGTH;
        alphas[i] = 1;
        sizes[i] = 0.12 + Math.random() * 0.83;
        flickers[i] = Math.random() * Math.PI * 2;
        brightnesses[i] = 0.6 + Math.random() * 1.8;
      }

      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.aAlpha.needsUpdate = true;
      geometry.attributes.aSize.needsUpdate = true;
      geometry.attributes.aFlicker.needsUpdate = true;
      geometry.attributes.aBrightness.needsUpdate = true;
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
    if (material.uniforms?.uTime) material.uniforms.uTime.value = elapsed;
    const positions = geometry.attributes.position.array;
    const alphas = geometry.attributes.aAlpha.array;
    const velocities = velocitiesRef.current;
    const lifetimes = lifetimesRef.current;
    const seeds = seedsRef.current;
    const turbulence = turbulenceRef.current;

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

      const turbulentX = Math.sin(elapsed * 2 * VORTEX_TURBULENCE_SPEED + seeds[i]) * turbulence[i3];
      const turbulentY = Math.sin(elapsed * 1.5 * VORTEX_TURBULENCE_SPEED + seeds[i] * 1.3) * turbulence[i3 + 1];
      const turbulentZ = Math.cos(elapsed * 1.8 * VORTEX_TURBULENCE_SPEED + seeds[i] * 0.8) * turbulence[i3 + 2];

      velocities[i3] += turbulentX * dt;
      velocities[i3 + 1] += (1.4 + turbulentY) * dt;
      velocities[i3 + 2] += turbulentZ * dt;

      velocities[i3] *= 0.78;
      velocities[i3 + 1] *= 0.988;
      velocities[i3 + 2] *= 0.78;

      const vortexOrbitX = Math.cos(elapsed * 0.9 + seeds[i]) * 0.025 * (1 - t);
      const vortexOrbitZ = Math.sin(elapsed * 0.9 + seeds[i]) * 0.025 * (1 - t);

      positions[i3] += velocities[i3] * dt + turbulentX * 0.16 + vortexOrbitX;
      positions[i3 + 1] += velocities[i3 + 1] * dt + turbulentY * 0.2;
      positions[i3 + 2] += velocities[i3 + 2] * dt + turbulentZ * 0.16 + vortexOrbitZ;

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
