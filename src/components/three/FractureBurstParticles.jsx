import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const VORTEX_TURBULENCE_STRENGTH = 0.08;
const VORTEX_TURBULENCE_SPEED = 0.45;
const EMITTER_START_LEAD_S = 0.08;
const PRE_RISE_TIME_S = 0.2;

const smoothstep = (edge0, edge1, x) => {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
};

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
  const baseSizesRef = useRef(new Float32Array(count));

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
      depthTest: false,
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
          gl_PointSize = aSize * (120.0 / max(-mvPosition.z, 0.1));
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
          float flicker = 0.7 + 0.3 * sin(uTime * 20.0 + vFlicker);
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
      const baseSizes = baseSizesRef.current;

      for (let i = 0; i < count; i += 1) {
        const i3 = i * 3;

        const emitterScaleX = 0.5;
        const emitterScaleY = 1.2;
        const emitterScaleZ = 0.5;
        const emitterOffsetZ = 0.6;

        const direction = new THREE.Vector3().randomDirection();
        direction.y = Math.abs(direction.y) * 0.7 + 0.3;
        direction.normalize();
        const radius = Math.cbrt(Math.random()) * spread * 0.6;

        positions[i3] = direction.x * radius * emitterScaleX;
        positions[i3 + 1] = direction.y * radius * emitterScaleY;
        positions[i3 + 2] = emitterOffsetZ + direction.z * radius * emitterScaleZ;

        const burstSpeed = 0.8 + Math.random() * 0.6;
        velocities[i3] = direction.x * burstSpeed;
        velocities[i3 + 1] = direction.y * burstSpeed;
        velocities[i3 + 2] = direction.z * burstSpeed;

        lifetimes[i] = duration * (1.0 + Math.random() * 0.8);
        seeds[i] = Math.random() * Math.PI * 2;
        turbulence[i3] = (Math.random() - 0.5) * VORTEX_TURBULENCE_STRENGTH;
        turbulence[i3 + 1] = (Math.random() - 0.5) * VORTEX_TURBULENCE_STRENGTH * 0.2;
        turbulence[i3 + 2] = (Math.random() - 0.5) * VORTEX_TURBULENCE_STRENGTH;
        alphas[i] = 1;
        const baseSize = 0.003 + Math.random() * 0.007;
        baseSizes[i] = baseSize;
        sizes[i] = baseSize;
        flickers[i] = Math.random() * Math.PI * 2;
        brightnesses[i] = 0.85 + Math.random() * 0.35;
      }

      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.aAlpha.needsUpdate = true;
      geometry.attributes.aSize.needsUpdate = true;
      geometry.attributes.aFlicker.needsUpdate = true;
      geometry.attributes.aBrightness.needsUpdate = true;
      startTimeRef.current = performance.now() - EMITTER_START_LEAD_S * 1000;
    };

    const effectiveDelay = Math.max(delay - EMITTER_START_LEAD_S, 0);

    if (effectiveDelay > 0) {
      delayRef.current = setTimeout(() => {
        delayRef.current = null;
        reset();
      }, effectiveDelay * 1000);
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
    const sizes = geometry.attributes.aSize.array;
    const velocities = velocitiesRef.current;
    const lifetimes = lifetimesRef.current;
    const seeds = seedsRef.current;
    const turbulence = turbulenceRef.current;
    const baseSizes = baseSizesRef.current;

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
      const turbulentY = Math.sin(elapsed * 1.6 * VORTEX_TURBULENCE_SPEED + seeds[i] * 1.2) * turbulence[i3 + 1];
      const turbulentZ = Math.cos(elapsed * 1.8 * VORTEX_TURBULENCE_SPEED + seeds[i] * 0.8) * turbulence[i3 + 2];

      const preRise = elapsed <= PRE_RISE_TIME_S;
      if (!preRise) {
        const upwardTarget = new THREE.Vector3(0, 1.25, 0);
        const currentVel = new THREE.Vector3(velocities[i3], velocities[i3 + 1], velocities[i3 + 2]);
        currentVel.lerp(upwardTarget, 0.08);
        velocities[i3] = currentVel.x;
        velocities[i3 + 1] = currentVel.y;
        velocities[i3 + 2] = currentVel.z;
      }

      velocities[i3] += turbulentX + (Math.random() - 0.5) * 0.01;
      velocities[i3 + 1] += turbulentY + 0.002;
      velocities[i3 + 2] += turbulentZ + (Math.random() - 0.5) * 0.01;

      velocities[i3] *= 0.96;
      velocities[i3 + 1] *= 0.96;
      velocities[i3 + 2] *= 0.96;

      if (elapsed > 0.25) {
        velocities[i3] *= 0.92;
        velocities[i3 + 1] *= 0.92;
        velocities[i3 + 2] *= 0.92;
      }

      positions[i3] += velocities[i3] * dt;
      positions[i3 + 1] += velocities[i3 + 1] * dt;
      positions[i3 + 2] += velocities[i3 + 2] * dt;

      sizes[i] = baseSizes[i] * (1 - t * 0.6);
      alphas[i] = smoothstep(0.0, 0.1, t) * (1 - smoothstep(0.6, 1.0, t));
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.aAlpha.needsUpdate = true;
    geometry.attributes.aSize.needsUpdate = true;

    if (aliveCount === 0) {
      startTimeRef.current = 0;
    }
  });

  return <points ref={pointsRef} geometry={geometry} material={material} renderOrder={5} />;
};

export default FractureBurstParticles;
