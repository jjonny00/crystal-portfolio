import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const EMITTER_START_LEAD_S = 0.08;

const smoothstep = (edge0, edge1, x) => {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
};

/**
 * Fracture glitter dust (debug-verified render path).
 */
const FractureBurstParticles = ({
  trigger,
  delay = 0,
  count = 260,
  color = '#9af8ff',
  emitterPosition = [0, 0, 0],
}) => {
  const pointsRef = useRef();
  const startTimeRef = useRef(0);
  const delayRef = useRef(null);
  const activeCountRef = useRef(0);

  const velocitiesRef = useRef(new Float32Array(count * 3));
  const lifetimesRef = useRef(new Float32Array(count));
  const agesRef = useRef(new Float32Array(count));
  const baseSizesRef = useRef(new Float32Array(count));
  const dragsRef = useRef(new Float32Array(count));
  const buoyanciesRef = useRef(new Float32Array(count));
  const turbulencesRef = useRef(new Float32Array(count));
  const swirlsRef = useRef(new Float32Array(count));
  const phasesRef = useRef(new Float32Array(count));

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute('aAlpha', new THREE.BufferAttribute(new Float32Array(count), 1));
    g.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(count), 1));
    return g;
  }, [count]);

  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.012,
        color,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [color],
  );

  useEffect(() => {
    console.log('geometry attributes', Object.keys(geometry.attributes));
  }, [geometry]);

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
      const velocities = velocitiesRef.current;
      const lifetimes = lifetimesRef.current;
      const ages = agesRef.current;
      const baseSizes = baseSizesRef.current;
      const drags = dragsRef.current;
      const buoyancies = buoyanciesRef.current;
      const turbulences = turbulencesRef.current;
      const swirls = swirlsRef.current;
      const phases = phasesRef.current;

      console.log('[particles] before spawn activeCount=', activeCountRef.current);
      const spawnCount = Math.min(count, 130);
      console.log('[particles] spawning count=', spawnCount);

      for (let i = 0; i < spawnCount; i += 1) {
        const i3 = i * 3;

        const angle = Math.random() * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
        const ringRadius = 0.38 + Math.random() * 0.44;
        const ringThickness = -0.14 + Math.random() * 0.28;
        const yOffset = -0.22 + Math.random() * 0.5;
        const radial = ringRadius + ringThickness;
        const emitterWidth = 1.0;
        const emitterHeight = 0.7;
        const emitterDepth = 1.0;

        positions[i3] = Math.cos(angle) * emitterWidth * radial;
        positions[i3 + 1] = yOffset * emitterHeight;
        positions[i3 + 2] = Math.sin(angle) * emitterDepth * radial;

        const radialDir = new THREE.Vector3(positions[i3], positions[i3 + 1], positions[i3 + 2]).normalize();
        const burstJitter = new THREE.Vector3(
          -0.35 + Math.random() * 0.7,
          -0.12 + Math.random() * 0.4,
          -0.35 + Math.random() * 0.7,
        );
        const velocity = radialDir.add(burstJitter).normalize();
        velocity.multiplyScalar(3.6 + Math.random() * 2.0);
        velocity.y += 0.2 + Math.random() * 0.6;

        velocities[i3] = velocity.x;
        velocities[i3 + 1] = velocity.y;
        velocities[i3 + 2] = velocity.z;

        ages[i] = 0;
        lifetimes[i] = 0.5 + Math.random() * 0.45;
        const isAccent = Math.random() > 0.86;
        const baseSize = isAccent
          ? (0.018 + Math.random() * 0.01)
          : (0.009 + Math.random() * 0.008);
        baseSizes[i] = baseSize;
        sizes[i] = baseSize;
        drags[i] = 0.87 + Math.random() * 0.06;
        buoyancies[i] = 0.004 + Math.random() * 0.006;
        turbulences[i] = 0.004 + Math.random() * 0.008;
        swirls[i] = 0.002 + Math.random() * 0.006;
        phases[i] = Math.random() * Math.PI * 2;
        alphas[i] = 1;
      }

      for (let i = spawnCount; i < count; i += 1) {
        const i3 = i * 3;
        positions[i3] = positions[i3 + 1] = positions[i3 + 2] = 0;
        velocities[i3] = velocities[i3 + 1] = velocities[i3 + 2] = 0;
        ages[i] = 0;
        lifetimes[i] = 0;
        drags[i] = 0;
        buoyancies[i] = 0;
        turbulences[i] = 0;
        swirls[i] = 0;
        phases[i] = 0;
        sizes[i] = 0;
        alphas[i] = 0;
      }

      activeCountRef.current = spawnCount;
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
  }, [trigger, delay, count, geometry]);

  useEffect(() => {
    if (pointsRef.current) {
      pointsRef.current.frustumCulled = false;
    }
  });

  useFrame((_, dt) => {
    if (!startTimeRef.current) return;

    const elapsed = (performance.now() - startTimeRef.current) / 1000;
    const positions = geometry.attributes.position.array;
    const alphas = geometry.attributes.aAlpha.array;
    const sizes = geometry.attributes.aSize.array;
    const velocities = velocitiesRef.current;
    const lifetimes = lifetimesRef.current;
    const ages = agesRef.current;
    const baseSizes = baseSizesRef.current;
    const drags = dragsRef.current;
    const buoyancies = buoyanciesRef.current;
    const turbulences = turbulencesRef.current;
    const swirls = swirlsRef.current;
    const phases = phasesRef.current;

    const activeCount = activeCountRef.current;

    for (let i = 0; i < activeCount; i += 1) {
      const i3 = i * 3;
      const life = lifetimes[i];
      if (!life) continue;

      ages[i] = elapsed;
      const t = Math.min(ages[i] / life, 1);

      if (ages[i] < 0.09) {
        velocities[i3] *= 0.985;
        velocities[i3 + 1] *= 0.985;
        velocities[i3 + 2] *= 0.985;
      } else {
        const swirlX = Math.sin(elapsed * 8.0 + phases[i]) * swirls[i];
        const swirlZ = Math.cos(elapsed * 7.0 + phases[i] * 1.3) * swirls[i];

        const turbX = (Math.random() - 0.5) * turbulences[i];
        const turbY = (Math.random() - 0.5) * turbulences[i] * 0.35;
        const turbZ = (Math.random() - 0.5) * turbulences[i];

        velocities[i3] *= drags[i];
        velocities[i3 + 2] *= drags[i];
        velocities[i3 + 1] *= 0.975;

        velocities[i3] += swirlX + turbX;
        velocities[i3 + 1] += buoyancies[i] + turbY;
        velocities[i3 + 2] += swirlZ + turbZ;
      }

      positions[i3] += velocities[i3] * dt;
      positions[i3 + 1] += velocities[i3 + 1] * dt;
      positions[i3 + 2] += velocities[i3 + 2] * dt;

      sizes[i] = baseSizes[i] * (1.0 - t * 0.45);
      alphas[i] = smoothstep(0.0, 0.03, t) * (1.0 - smoothstep(0.28, 0.72, t));
    }

    geometry.setDrawRange(0, activeCount);
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.aAlpha.needsUpdate = true;
    geometry.attributes.aSize.needsUpdate = true;
  });

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      material={material}
      position={emitterPosition}
      renderOrder={5}
    />
  );
};

export default FractureBurstParticles;
