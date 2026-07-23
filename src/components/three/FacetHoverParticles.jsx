import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Sparse shimmer particles that stream from a hovered project facet toward the
// left edge of its DOM label, making the facet -> label connection legible. The
// motion is a directed A->B travel (fast departure, soft deceleration near the
// label) with per-particle turbulence, stagger, occasional overshoot, and an
// early/late fade so the trail disperses just before the text and never reads as
// a dashed line. Points reuse the crystal explosion particles' shimmer shader.
//
// Everything is written in WORLD space into a <points> anchored at the origin, so
// no emitter transform is involved. The label target is resolved by raycasting the
// label's screen-space left edge onto the plane containing the facet emit point
// (mirrors how the old connector lines were placed).

const POOL_SIZE = 64;
const LABEL_GAP_PX = 12; // aim just left of the text so particles fade into the gap
const EMIT_INTERVAL_MIN = 0.09;
const EMIT_INTERVAL_MAX = 0.16;
const COMPANION_SPAWN_CHANCE = 0.12; // occasional second particle for a light cluster
const TRAVEL_MIN = 2.7;
const TRAVEL_MAX = 3.05;
const START_JITTER = 0.8; // world-space spawn spread around the fragment anchor (wide emitter)
const TARGET_JITTER = 0.1; // world-space spread across the label's left edge (narrow end)
const DEFAULT_INTENSITY_SCALE = 1.6; // overall brightness of the additive points
const SIZE_MIN = 0.016; // per-particle base point size (world units, before perspective scaling)
const SIZE_MAX = 0.078;

const _startScratch = new THREE.Vector3();
const _targetScratch = new THREE.Vector3();
const _ndcScratch = new THREE.Vector2();
const _planeNormalScratch = new THREE.Vector3();
const _planeScratch = new THREE.Plane();
const _camRightScratch = new THREE.Vector3();
const _camUpScratch = new THREE.Vector3();
const _raycaster = new THREE.Raycaster();

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const smoothstep = (edge0, edge1, x) => {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
};
const rand = (min, max) => min + Math.random() * (max - min);

const FacetHoverParticles = ({
  enabled = true,
  hoveredFacetKey = null,
  facetRefs,
  facetKeys,
  domKeyBySceneKey,
  projectColors,
  intensityScale = DEFAULT_INTENSITY_SCALE,
  sizeMin = SIZE_MIN,
  sizeMax = SIZE_MAX,
}) => {
  const { camera, size } = useThree();
  const pointsRef = useRef();
  const spawnColorScratch = useRef(new THREE.Color('#9af8ff')).current;

  // Per-particle CPU state (age drives everything; lifetime<=0 means the slot is free).
  const state = useRef({
    age: new Float32Array(POOL_SIZE),
    life: new Float32Array(POOL_SIZE),
    start: new Float32Array(POOL_SIZE * 3),
    target: new Float32Array(POOL_SIZE * 3),
    reach: new Float32Array(POOL_SIZE), // >1 => overshoot past the label
    f1: new Float32Array(POOL_SIZE),
    f2: new Float32Array(POOL_SIZE),
    ph1: new Float32Array(POOL_SIZE),
    ph2: new Float32Array(POOL_SIZE),
    amp1: new Float32Array(POOL_SIZE),
    amp2: new Float32Array(POOL_SIZE),
    fadeStart: new Float32Array(POOL_SIZE),
    fadeEnd: new Float32Array(POOL_SIZE),
    sizeBase: new Float32Array(POOL_SIZE),
    emitAccum: 0,
    nextInterval: EMIT_INTERVAL_MIN,
    spawnedThisFrame: false,
    wasActive: false,
  }).current;

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(POOL_SIZE * 3), 3));
    g.setAttribute('aAlpha', new THREE.BufferAttribute(new Float32Array(POOL_SIZE), 1));
    g.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(POOL_SIZE), 1));
    g.setAttribute('aShimmerPhase', new THREE.BufferAttribute(new Float32Array(POOL_SIZE), 1));
    g.setAttribute('aShimmerRate', new THREE.BufferAttribute(new Float32Array(POOL_SIZE), 1));
    g.setAttribute('aColor', new THREE.BufferAttribute(new Float32Array(POOL_SIZE * 3), 3));
    g.setDrawRange(0, POOL_SIZE);
    return g;
  }, []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uPixelRatio: {
            value: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1,
          },
          uTime: { value: 0 },
          uShimmerStrength: { value: 0.4 },
          uShimmerSpeed: { value: 9.0 },
        },
        vertexShader: `
          attribute float aSize;
          attribute float aAlpha;
          attribute float aShimmerPhase;
          attribute float aShimmerRate;
          attribute vec3 aColor;
          uniform float uPixelRatio;
          uniform float uTime;
          uniform float uShimmerStrength;
          uniform float uShimmerSpeed;
          varying float vAlpha;
          varying float vShimmer;
          varying vec3 vColor;

          void main() {
            vAlpha = aAlpha;
            vColor = aColor;
            float tw = 0.5 + 0.5 * sin(uTime * uShimmerSpeed * aShimmerRate + aShimmerPhase);
            float flare = pow(max(0.0, sin(uTime * uShimmerSpeed * 0.5 * aShimmerRate + aShimmerPhase * 2.3)), 16.0);
            float bright = (1.0 - 0.6 * uShimmerStrength) + 0.6 * uShimmerStrength * tw + 2.4 * uShimmerStrength * flare;
            vShimmer = max(bright, 0.0);
            float sizePulse = 1.0 + 1.2 * uShimmerStrength * flare;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = aSize * uPixelRatio * (300.0 / -mvPosition.z) * sizePulse;
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying float vAlpha;
          varying float vShimmer;
          varying vec3 vColor;

          void main() {
            vec2 uv = gl_PointCoord - 0.5;
            float d = length(uv);
            float soft = 1.0 - smoothstep(0.25, 0.5, d);
            gl_FragColor = vec4(vColor, vAlpha * soft * vShimmer);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [],
  );

  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  useEffect(() => {
    if (pointsRef.current) pointsRef.current.frustumCulled = false;
  });

  // Resolve the live world position of a facet's fragment anchor.
  const resolveStart = (sceneKey, out) => {
    if (!facetKeys || !facetRefs?.current) return null;
    const index = facetKeys.indexOf(sceneKey);
    if (index === -1) return null;
    const facetObj = facetRefs.current[index]?.current;
    if (!facetObj) return null;
    const anchor = facetObj.getObjectByName(`anchor_${sceneKey}`) || facetObj;
    anchor.getWorldPosition(out);
    return out;
  };

  // Resolve the world point on the facet's plane that sits at the label's left edge.
  const resolveTarget = (sceneKey, startWorld, out) => {
    const domKey = domKeyBySceneKey?.[sceneKey];
    if (!domKey || typeof document === 'undefined') return null;
    const node = document.querySelector(`[data-facet-key="${domKey}"]`);
    if (!node) return null;
    const rect = node.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return null;
    const screenX = rect.left - LABEL_GAP_PX;
    const screenY = rect.top + rect.height * 0.5;
    const width = size.width || 1;
    const height = size.height || 1;
    _ndcScratch.set((screenX / width) * 2 - 1, -(screenY / height) * 2 + 1);
    _raycaster.setFromCamera(_ndcScratch, camera);
    camera.getWorldDirection(_planeNormalScratch);
    _planeScratch.setFromNormalAndCoplanarPoint(_planeNormalScratch, startWorld);
    return _raycaster.ray.intersectPlane(_planeScratch, out);
  };

  const spawnParticle = (startWorld, targetWorld, particleColor) => {
    // Find a free slot.
    let slot = -1;
    for (let i = 0; i < POOL_SIZE; i += 1) {
      if (state.life[i] <= 0) { slot = i; break; }
    }
    if (slot === -1) return;
    state.spawnedThisFrame = true;
    const i3 = slot * 3;

    state.age[slot] = 0;
    state.life[slot] = rand(TRAVEL_MIN, TRAVEL_MAX);

    state.start[i3] = startWorld.x + rand(-START_JITTER, START_JITTER);
    state.start[i3 + 1] = startWorld.y + rand(-START_JITTER, START_JITTER);
    state.start[i3 + 2] = startWorld.z + rand(-START_JITTER, START_JITTER);

    state.target[i3] = targetWorld.x + rand(-TARGET_JITTER, TARGET_JITTER);
    state.target[i3 + 1] = targetWorld.y + rand(-TARGET_JITTER * 1.4, TARGET_JITTER * 1.4);
    state.target[i3 + 2] = targetWorld.z + rand(-TARGET_JITTER, TARGET_JITTER);

    // A few particles overshoot past the label before fading.
    state.reach[slot] = Math.random() < 0.22 ? rand(1.06, 1.16) : 1.0;

    // Per-particle turbulence (two frequencies => irregular, non-linear drift).
    state.f1[slot] = rand(3.5, 6.5);
    state.f2[slot] = rand(2.5, 4.5);
    state.ph1[slot] = Math.random() * Math.PI * 2;
    state.ph2[slot] = Math.random() * Math.PI * 2;
    state.amp1[slot] = rand(0.012, 0.034);
    state.amp2[slot] = rand(0.012, 0.03);

    // Fade window: most disperse just before the text; some fade early.
    if (Math.random() < 0.3) {
      state.fadeStart[slot] = rand(0.4, 0.55);
      state.fadeEnd[slot] = state.fadeStart[slot] + rand(0.14, 0.22);
    } else {
      state.fadeStart[slot] = rand(0.74, 0.84);
      state.fadeEnd[slot] = Math.min(1, state.fadeStart[slot] + rand(0.12, 0.2));
    }

    state.sizeBase[slot] = rand(sizeMin, sizeMax);

    const shimmerPhases = geometry.attributes.aShimmerPhase.array;
    const shimmerRates = geometry.attributes.aShimmerRate.array;
    shimmerPhases[slot] = Math.random() * Math.PI * 2;
    shimmerRates[slot] = 0.6 + Math.random() * 0.9;

    const colors = geometry.attributes.aColor.array;
    colors[i3] = particleColor.r;
    colors[i3 + 1] = particleColor.g;
    colors[i3 + 2] = particleColor.b;
  };

  useFrame((frameState, dtRaw) => {
    material.uniforms.uTime.value = frameState.clock.elapsedTime;
    const dt = Math.min(dtRaw, 0.05);
    state.spawnedThisFrame = false;

    const positions = geometry.attributes.position.array;
    const alphas = geometry.attributes.aAlpha.array;
    const sizes = geometry.attributes.aSize.array;

    // Emit while a facet is hovered and both anchors resolve.
    const active = enabled && hoveredFacetKey;
    if (active) {
      const start = resolveStart(hoveredFacetKey, _startScratch);
      const target = start ? resolveTarget(hoveredFacetKey, start, _targetScratch) : null;
      if (start && target) {
        const colorIdx = facetKeys ? facetKeys.indexOf(hoveredFacetKey) : -1;
        const hoveredColor = colorIdx !== -1 && projectColors?.[colorIdx]
          ? spawnColorScratch.copy(projectColors[colorIdx])
          : spawnColorScratch.set('#9af8ff');
        state.emitAccum += dt;
        while (state.emitAccum >= state.nextInterval) {
          state.emitAccum -= state.nextInterval;
          state.nextInterval = rand(EMIT_INTERVAL_MIN, EMIT_INTERVAL_MAX);
          spawnParticle(start, target, hoveredColor);
          // Occasionally emit a companion for a slightly clustered release.
          if (Math.random() < COMPANION_SPAWN_CHANCE) spawnParticle(start, target, hoveredColor);
        }
      }
    } else {
      state.emitAccum = 0;
    }

    // Screen-aligned drift basis (particles travel roughly in the camera plane).
    _camRightScratch.setFromMatrixColumn(camera.matrixWorld, 0);
    _camUpScratch.setFromMatrixColumn(camera.matrixWorld, 1);

    let activeCount = 0;
    for (let i = 0; i < POOL_SIZE; i += 1) {
      const life = state.life[i];
      if (life <= 0) {
        alphas[i] = 0;
        sizes[i] = 0;
        continue;
      }
      activeCount += 1;

      state.age[i] += dt;
      const age = state.age[i];
      if (age >= life) {
        state.life[i] = 0;
        alphas[i] = 0;
        sizes[i] = 0;
        continue;
      }

      const t = age / life;
      const eased = easeOutCubic(t) * state.reach[i];
      const i3 = i * 3;

      const driftEnv = 1 - smoothstep(0.55, 1.0, t) * 0.35; // settle slightly near the label
      const d1 = Math.sin(age * state.f1[i] + state.ph1[i]) * state.amp1[i] * driftEnv;
      const d2 = Math.sin(age * state.f2[i] + state.ph2[i]) * state.amp2[i] * driftEnv;

      positions[i3] =
        state.start[i3] + (state.target[i3] - state.start[i3]) * eased
        + _camRightScratch.x * d1 + _camUpScratch.x * d2;
      positions[i3 + 1] =
        state.start[i3 + 1] + (state.target[i3 + 1] - state.start[i3 + 1]) * eased
        + _camRightScratch.y * d1 + _camUpScratch.y * d2;
      positions[i3 + 2] =
        state.start[i3 + 2] + (state.target[i3 + 2] - state.start[i3 + 2]) * eased
        + _camRightScratch.z * d1 + _camUpScratch.z * d2;

      const fadeIn = smoothstep(0.0, 0.08, t);
      const fadeOut = 1 - smoothstep(state.fadeStart[i], state.fadeEnd[i], t);
      alphas[i] = fadeIn * fadeOut * intensityScale;
      sizes[i] = state.sizeBase[i];
    }

    // Skip buffer uploads entirely when nothing is (or just was) alive, so the idle
    // (non-hovered) case costs only the loop above — no per-frame GPU churn. The
    // trailing wasActive flush guarantees the final all-zero frame is uploaded once.
    if (activeCount === 0 && !state.spawnedThisFrame && !state.wasActive) {
      return;
    }
    state.wasActive = activeCount > 0;

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.aAlpha.needsUpdate = true;
    geometry.attributes.aSize.needsUpdate = true;
    geometry.attributes.aShimmerPhase.needsUpdate = true;
    geometry.attributes.aShimmerRate.needsUpdate = true;
    geometry.attributes.aColor.needsUpdate = true;
  });

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      material={material}
      position={[0, 0, 0]}
      renderOrder={6}
    />
  );
};

export default FacetHoverParticles;
