import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getWizardSmokeTexture } from '../../loader/preloadFractureAssets';
import { createLogger } from '../../utils/logger';

const logger = createLogger('fracture-smoke-puff');

const smoothstep = (edge0, edge1, x) => {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
};

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

// Fold instance-facing state so we always reuse the same typed arrays across
// explosions rather than allocating fresh objects each trigger.
const makeState = (count) => ({
  velocities: new Float32Array(count * 3), // radial drift (x/z used; y handled by lift)
  upLift: new Float32Array(count),         // peak upward speed, ramped in over life
  lifetimes: new Float32Array(count),
  ages: new Float32Array(count),
  baseScale: new Float32Array(count),
  endScale: new Float32Array(count),
  rollSpeed: new Float32Array(count),
  maxOpacity: new Float32Array(count),
  drag: new Float32Array(count),
});

/**
 * Magical smoke for the crystal fracture: instanced camera-facing billboards
 * (single draw call) that expand while rising, tinted a cool pale blue-violet.
 * Triggered by a changing `trigger` id (fired at the explosion beat). Slower and
 * more contained than the shimmering FractureBurstParticles.
 *
 * All tunables come from crystalConfig `fracture.smoke` (count, size, spread,
 * outwardSpeed, upwardLift, lifetime, color, opacity). Respects reduced motion:
 * with `reducedMotion` the effect renders nothing.
 */
const FractureSmokePuff = ({
  trigger,
  enabled = true,
  reducedMotion = false,
  position = [0, 0, 0],
  count = 15,
  size = 0.85,
  expand = 3.4,
  spread = 0.35,
  outwardSpeed = 0.6,
  upwardLift = 1.05,
  drag = 0.9,
  lifetimeMin = 0.6,
  lifetimeMax = 1.1,
  opacity = 0.4,
}) => {
  const resolvedCount = Math.max(0, Math.floor(Number.isFinite(count) ? count : 0));
  const meshRef = useRef();
  const activeRef = useRef(false);
  const stateRef = useRef(makeState(resolvedCount));

  const texture = getWizardSmokeTexture();

  // Latest props snapshot read at spawn time so config edits take effect on the
  // next explosion without rebuilding the geometry/material.
  const latestPropsRef = useRef({});
  useEffect(() => {
    latestPropsRef.current = {
      size, expand, spread, outwardSpeed, upwardLift, drag, lifetimeMin, lifetimeMax, opacity,
    };
  }, [size, expand, spread, outwardSpeed, upwardLift, drag, lifetimeMin, lifetimeMax, opacity]);

  const geometry = useMemo(() => {
    const base = new THREE.PlaneGeometry(1, 1);
    const g = new THREE.InstancedBufferGeometry();
    g.index = base.index;
    g.setAttribute('position', base.attributes.position);
    g.setAttribute('uv', base.attributes.uv);
    g.setAttribute('aOffset', new THREE.InstancedBufferAttribute(new Float32Array(resolvedCount * 3), 3));
    g.setAttribute('aScale', new THREE.InstancedBufferAttribute(new Float32Array(resolvedCount), 1));
    g.setAttribute('aRotation', new THREE.InstancedBufferAttribute(new Float32Array(resolvedCount), 1));
    g.setAttribute('aOpacity', new THREE.InstancedBufferAttribute(new Float32Array(resolvedCount), 1));
    g.setAttribute('aDissolve', new THREE.InstancedBufferAttribute(new Float32Array(resolvedCount), 1));
    g.instanceCount = resolvedCount;
    base.dispose();
    return g;
  }, [resolvedCount]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uMap: { value: texture || null },
        },
        vertexShader: `
          attribute vec3 aOffset;
          attribute float aScale;
          attribute float aRotation;
          attribute float aOpacity;
          attribute float aDissolve;
          varying vec2 vUv;
          varying float vOpacity;
          varying float vDissolve;

          void main() {
            vUv = uv;
            vOpacity = aOpacity;
            vDissolve = aDissolve;
            // Camera-facing billboard: place the instance center in view space and
            // add the (rolled, scaled) quad corner on the camera-aligned XY plane.
            float c = cos(aRotation);
            float s = sin(aRotation);
            vec2 p = position.xy * aScale;
            vec2 rp = vec2(p.x * c - p.y * s, p.x * s + p.y * c);
            vec4 mv = modelViewMatrix * vec4(aOffset, 1.0);
            mv.xy += rp;
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: `
          uniform sampler2D uMap;
          varying vec2 vUv;
          varying float vOpacity;
          varying float vDissolve;

          void main() {
            vec4 tex = texture2D(uMap, vUv);
            // Respect the image's own alpha channel as the smoke density.
            float density = tex.a;
            // Uneven dissolve: as the sprite ages, erode the thinnest density first
            // so it dissipates raggedly rather than fading as a flat disc.
            float mask = smoothstep(vDissolve, vDissolve + 0.35, density);
            float alpha = density * mask * vOpacity;
            if (alpha < 0.002) discard;
            // No tint — use the texture's own colors; any color treatment lives in the image.
            gl_FragColor = vec4(tex.rgb, alpha);
          }
        `,
        transparent: true,
        blending: THREE.NormalBlending,
        depthTest: true,
        depthWrite: false,
      }),
    [texture],
  );

  useEffect(() => {
    stateRef.current = makeState(resolvedCount);
  }, [resolvedCount]);

  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  // Spawn a fresh puff whenever the trigger id changes.
  useEffect(() => {
    if (!trigger || reducedMotion || resolvedCount === 0 || !texture) return;

    const st = stateRef.current;
    const p = latestPropsRef.current;
    const offsets = geometry.attributes.aOffset.array;
    const scales = geometry.attributes.aScale.array;
    const rotations = geometry.attributes.aRotation.array;
    const opacities = geometry.attributes.aOpacity.array;
    const dissolves = geometry.attributes.aDissolve.array;

    const rspread = Math.max(0, p.spread ?? spread);
    const rsize = Math.max(0.0001, p.size ?? size);
    const rexpand = Math.max(1, p.expand ?? expand);
    const rout = Math.max(0, p.outwardSpeed ?? outwardSpeed);
    const rlift = Math.max(0, p.upwardLift ?? upwardLift);
    const rdrag = THREE.MathUtils.clamp(p.drag ?? drag, 0, 1);
    const lmin = Math.max(0.05, p.lifetimeMin ?? lifetimeMin);
    const lmax = Math.max(lmin, p.lifetimeMax ?? lifetimeMax);
    const ropacity = THREE.MathUtils.clamp(p.opacity ?? opacity, 0, 1);

    for (let i = 0; i < resolvedCount; i += 1) {
      const i3 = i * 3;
      const angle = Math.random() * Math.PI * 2;
      // Spawn in a ring around the core (inner radius keeps sprites off dead-center)
      // so the mist frames the explosion instead of getting lost in its brightest part.
      const r = rspread * (0.45 + Math.random() * 0.55);
      offsets[i3] = Math.cos(angle) * r;
      offsets[i3 + 1] = (Math.random() - 0.25) * rspread * 0.8; // slight vertical scatter, biased up
      offsets[i3 + 2] = Math.sin(angle) * r;

      const speed = rout * (0.55 + Math.random() * 0.6);
      st.velocities[i3] = Math.cos(angle) * speed;
      st.velocities[i3 + 1] = 0;
      st.velocities[i3 + 2] = Math.sin(angle) * speed;
      st.upLift[i] = rlift * (0.6 + Math.random() * 0.7);
      st.drag[i] = rdrag;

      st.lifetimes[i] = THREE.MathUtils.lerp(lmin, lmax, Math.random());
      st.ages[i] = 0;
      st.baseScale[i] = rsize * (0.6 + Math.random() * 0.6);
      st.endScale[i] = st.baseScale[i] * rexpand * (0.8 + Math.random() * 0.5);
      st.rollSpeed[i] = (Math.random() - 0.5) * 0.7; // slow, contained roll
      st.maxOpacity[i] = ropacity * (0.7 + Math.random() * 0.5);

      scales[i] = st.baseScale[i];
      rotations[i] = Math.random() * Math.PI * 2;
      opacities[i] = 0;
      dissolves[i] = 0;
    }

    geometry.attributes.aOffset.needsUpdate = true;
    geometry.attributes.aScale.needsUpdate = true;
    geometry.attributes.aRotation.needsUpdate = true;
    geometry.attributes.aOpacity.needsUpdate = true;
    geometry.attributes.aDissolve.needsUpdate = true;
    activeRef.current = true;
    logger.debug('[smoke] spawned', resolvedCount, 'sprites');
  }, [trigger]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (meshRef.current) meshRef.current.frustumCulled = false;
  });

  useFrame((_, dtRaw) => {
    if (!activeRef.current) return;
    const dt = Math.min(dtRaw, 1 / 30); // clamp so a stutter can't teleport sprites

    const st = stateRef.current;
    const offsets = geometry.attributes.aOffset.array;
    const scales = geometry.attributes.aScale.array;
    const rotations = geometry.attributes.aRotation.array;
    const opacities = geometry.attributes.aOpacity.array;
    const dissolves = geometry.attributes.aDissolve.array;

    let anyAlive = false;

    for (let i = 0; i < resolvedCount; i += 1) {
      const life = st.lifetimes[i];
      if (life <= 0) continue;

      st.ages[i] += dt;
      const t = st.ages[i] / life;

      if (t >= 1) {
        st.lifetimes[i] = 0;
        opacities[i] = 0;
        scales[i] = 0;
        continue;
      }
      anyAlive = true;

      const i3 = i * 3;
      // Rising mist: lift starts immediately and accelerates over life, so the
      // motion is dominated by upward travel rather than a flat radial burst.
      const riseRamp = 0.35 + 0.65 * t;
      offsets[i3 + 1] += st.upLift[i] * riseRamp * dt;

      // Radial drift, damped so the cloud stays contained.
      offsets[i3] += st.velocities[i3] * dt;
      offsets[i3 + 2] += st.velocities[i3 + 2] * dt;
      const dragF = Math.pow(st.drag[i], dt * 60);
      st.velocities[i3] *= dragF;
      st.velocities[i3 + 2] *= dragF;

      // Expand significantly across the lifetime.
      scales[i] = THREE.MathUtils.lerp(st.baseScale[i], st.endScale[i], easeOutCubic(t));
      rotations[i] += st.rollSpeed[i] * dt;

      // Quick fade-in, then dissolve out over the back ~45% of life.
      const fadeIn = smoothstep(0, 0.12, t);
      const fadeOut = 1 - smoothstep(0.55, 1, t);
      opacities[i] = st.maxOpacity[i] * fadeIn * fadeOut;
      dissolves[i] = t; // drives the uneven shader erosion
    }

    activeRef.current = anyAlive;

    geometry.attributes.aOffset.needsUpdate = true;
    geometry.attributes.aScale.needsUpdate = true;
    geometry.attributes.aRotation.needsUpdate = true;
    geometry.attributes.aOpacity.needsUpdate = true;
    geometry.attributes.aDissolve.needsUpdate = true;
  });

  if (!enabled || reducedMotion || resolvedCount === 0 || !texture) return null;

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={position}
      renderOrder={6}
    />
  );
};

export default FractureSmokePuff;
