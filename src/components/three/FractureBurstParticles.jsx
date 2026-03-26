import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const VORTEX_TURBULENCE_STRENGTH = 0.08;
const VORTEX_TURBULENCE_SPEED = 0.45;
const EMITTER_START_LEAD_S = 0.08;
const PRE_RISE_TIME_S = 0.2;
const DEBUG_PARTICLES = true;

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
  crystalMesh = null,
}) => {
  const pointsRef = useRef();
  const startTimeRef = useRef(0);
  const delayRef = useRef(null);
  const activeCountRef = useRef(0);

  const velocitiesRef = useRef(new Float32Array(count * 3));
  const lifetimesRef = useRef(new Float32Array(count));
  const agesRef = useRef(new Float32Array(count));
  const seedsRef = useRef(new Float32Array(count));
  const turbulenceRef = useRef(new Float32Array(count * 3));
  const baseSizesRef = useRef(new Float32Array(count));
  const upwardTargetRef = useRef(new THREE.Vector3(0, 1.2, 0));

  const emitterBounds = useMemo(() => {
    console.log('crystalMesh', crystalMesh);

    if (!crystalMesh) {
      console.warn('Invalid crystal bounds for particle emitter, falling back to fixed emitter size');
      return { width: 0.6, height: 1.0, depth: 0.6 };
    }

    const bounds = new THREE.Box3().setFromObject(crystalMesh);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    bounds.getSize(size);
    bounds.getCenter(center);

    console.log('particle bounds size', size.x, size.y, size.z);
    console.log('particle bounds center', center.x, center.y, center.z);

    if (
      !Number.isFinite(size.x) || !Number.isFinite(size.y) || !Number.isFinite(size.z) ||
      size.x <= 0 || size.y <= 0 || size.z <= 0
    ) {
      console.warn('Invalid crystal bounds for particle emitter, falling back to fixed emitter size');
      return { width: 0.6, height: 1.0, depth: 0.6 };
    }

    return {
      width: size.x * 1.35,
      height: size.y * 1.6,
      depth: size.z * 1.35,
    };
  }, [crystalMesh]);

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
    if (DEBUG_PARTICLES) {
      return new THREE.PointsMaterial({
        size: 0.05,
        color: 0xffffff,
        transparent: true,
        opacity: 1,
        depthWrite: false,
      });
    }

    return new THREE.ShaderMaterial({
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
  }, [color]);

  useEffect(() => {
    console.log('geometry attributes', Object.keys(geometry.attributes));
  }, [geometry]);

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
      activeCountRef.current = 0;
      return;
    }

    console.log('[fracture] trigger fired');

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
      const ages = agesRef.current;
      const seeds = seedsRef.current;
      const turbulence = turbulenceRef.current;
      const baseSizes = baseSizesRef.current;

      console.log('[particles] before spawn activeCount=', activeCountRef.current);
      const particleCount = DEBUG_PARTICLES ? 20 : count;
      console.log('[particles] spawning count=', particleCount);

      if (DEBUG_PARTICLES) {
        for (let i = 0; i < particleCount; i += 1) {
          const i3 = i * 3;
          positions[i3] = (Math.random() - 0.5) * 0.5;
          positions[i3 + 1] = (Math.random() - 0.5) * 0.5;
          positions[i3 + 2] = (Math.random() - 0.5) * 0.5;
          velocities[i3] = 0;
          velocities[i3 + 1] = 0.02;
          velocities[i3 + 2] = 0;
          ages[i] = 0;
          lifetimes[i] = 5;
          baseSizes[i] = 0.05;
          sizes[i] = 0.05;
          alphas[i] = 1;
          flickers[i] = 0;
          brightnesses[i] = 1.3;
          seeds[i] = i;
          turbulence[i3] = turbulence[i3 + 1] = turbulence[i3 + 2] = 0;
        }
      } else {
        for (let i = 0; i < particleCount; i += 1) {
          const i3 = i * 3;
          const direction = new THREE.Vector3().randomDirection();
          direction.y = Math.max(direction.y, -0.15);
          direction.normalize();
          const radius = Math.cbrt(Math.random());

          positions[i3] = direction.x * emitterBounds.width * radius;
          positions[i3 + 1] = direction.y * emitterBounds.height * radius;
          positions[i3 + 2] = direction.z * emitterBounds.depth * radius;

          const burstSpeed = 0.9 + Math.random() * 0.6;
          velocities[i3] = direction.x * burstSpeed;
          velocities[i3 + 1] = direction.y * burstSpeed;
          velocities[i3 + 2] = direction.z * burstSpeed;

          ages[i] = 0;
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
      }

      for (let i = particleCount; i < count; i += 1) {
        const i3 = i * 3;
        positions[i3] = positions[i3 + 1] = positions[i3 + 2] = 0;
        velocities[i3] = velocities[i3 + 1] = velocities[i3 + 2] = 0;
        ages[i] = 0;
        alphas[i] = 0;
        sizes[i] = 0;
        lifetimes[i] = 0;
      }

      activeCountRef.current = particleCount;
      console.log('[particles] after spawn activeCount=', activeCountRef.current);

      for (let i = 0; i < Math.min(5, activeCountRef.current); i += 1) {
        const i3 = i * 3;
        console.log('[particle]', i, {
          position: [positions[i3], positions[i3 + 1], positions[i3 + 2]],
          velocity: [velocities[i3], velocities[i3 + 1], velocities[i3 + 2]],
          life: lifetimes[i],
          age: ages[i],
          size: sizes[i],
          alpha: alphas[i],
        });
      }

      geometry.setDrawRange(0, activeCountRef.current);
      console.log('drawRange', geometry.drawRange);
      console.log('activeCount', activeCountRef.current);

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
  }, [trigger, delay, count, duration, geometry, emitterBounds]);

  useEffect(() => {
    if (pointsRef.current) {
      pointsRef.current.frustumCulled = false;
    }
  });

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
    const ages = agesRef.current;
    const seeds = seedsRef.current;
    const turbulence = turbulenceRef.current;
    const baseSizes = baseSizesRef.current;

    const activeCount = activeCountRef.current;

    for (let i = 0; i < activeCount; i += 1) {
      const i3 = i * 3;
      ages[i] = elapsed;

      if (DEBUG_PARTICLES) {
        positions[i3 + 1] += velocities[i3 + 1] * dt;
        alphas[i] = 1;
        sizes[i] = 0.05;
        continue;
      }

      const life = lifetimes[i] || duration;
      const t = Math.min(elapsed / life, 1);
      if (t >= 1) {
        alphas[i] = 0;
        continue;
      }

      const turbulentX = Math.sin(elapsed * 2 * VORTEX_TURBULENCE_SPEED + seeds[i]) * turbulence[i3];
      const turbulentY = Math.sin(elapsed * 1.6 * VORTEX_TURBULENCE_SPEED + seeds[i] * 1.2) * turbulence[i3 + 1];
      const turbulentZ = Math.cos(elapsed * 1.8 * VORTEX_TURBULENCE_SPEED + seeds[i] * 0.8) * turbulence[i3 + 2];

      const currentVel = new THREE.Vector3(velocities[i3], velocities[i3 + 1], velocities[i3 + 2]);
      currentVel.lerp(upwardTargetRef.current, 0.08);
      velocities[i3] = currentVel.x + turbulentX * 0.15 + (Math.random() - 0.5) * 0.01;
      velocities[i3 + 1] = currentVel.y + turbulentY * 0.15 + 0.002;
      velocities[i3 + 2] = currentVel.z + turbulentZ * 0.15 + (Math.random() - 0.5) * 0.01;

      if (elapsed < PRE_RISE_TIME_S) {
        velocities[i3] *= 0.97;
        velocities[i3 + 1] *= 0.97;
        velocities[i3 + 2] *= 0.97;
      } else {
        velocities[i3] *= 0.93;
        velocities[i3 + 1] *= 0.93;
        velocities[i3 + 2] *= 0.93;
      }

      positions[i3] += velocities[i3] * dt;
      positions[i3 + 1] += velocities[i3 + 1] * dt;
      positions[i3 + 2] += velocities[i3 + 2] * dt;

      sizes[i] = baseSizes[i] * (1 - t * 0.6);
      alphas[i] = smoothstep(0.0, 0.1, t) * (1 - smoothstep(0.6, 1.0, t));
    }

    geometry.setDrawRange(0, activeCount);
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.aAlpha.needsUpdate = true;
    geometry.attributes.aSize.needsUpdate = true;
    if (geometry.attributes.aLife) geometry.attributes.aLife.needsUpdate = true;

    if (!DEBUG_PARTICLES && elapsed > duration * 2.2) {
      activeCountRef.current = 0;
      startTimeRef.current = 0;
    }
  });

  return <points ref={pointsRef} geometry={geometry} material={material} renderOrder={5} />;
};

export default FractureBurstParticles;
