// src/components/three/FractureRays.jsx
// Crack-aligned energy rays for the hero→overview fracture beat.
//
// Renders a single GLB of fanned planes (hand-aligned to the crystal's cracks)
// with a shared gradient shader material. Every tunable lives in the
// `fracture.rays` config block (see crystalConfig.js); this component just wires
// that config into the material and drives the two time-varying uniforms
// (uOpacity, uGrowth) off the shared useHeroOverviewRuntime clock.
//
// Two modes (rays.mode):
//   • 'explosion' — a short discharge after the split, on the explosion clock
//     (lib/explosionTime, real time from the split): erupts rays.burst.onsetMs
//     after it, grows base→tip over burst.growMs and fades out over
//     burst.durationMs. Once per explosion; nothing outside a run.
//   • 'charge' — the earlier build-up: hard on/off between rays.timing.appearAt
//     and disappearAt (progress of the hero→overview sequence), growing base→tip
//     on its own timer (rays.growth.duration) from the appear moment.

import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { createFractureRayMaterial } from '../materials/fractureRayMaterial';
import { getExplosionLookScale } from '../../lib/explosionLook';
import { getExplosionSplitSeconds } from '../../lib/explosionTime';

const clamp01 = (x) => Math.min(1, Math.max(0, x));

// 'explosion' mode: one burst's opacity and growth `splitSeconds` after the
// split (negative before it). The front reaches `reach` of the rays' length
// (1: their full length) over growMs.
const NO_BURST = { opacity: 0, growth: 1 };
// How much of a burst's brightness is left `u` (0–1) of the way through its
// fade: 'expo' drops fast and then eases into a long faint tail (steepness
// `decay`, normalised to reach 0 at the end); otherwise (1 − u)^decay.
const burstFade = (u, burst) => {
  const decay = burst?.decay ?? 1;
  if (burst?.fade === 'expo') {
    const floor = 2 ** -decay;
    return Math.max((2 ** (-decay * u) - floor) / (1 - floor), 0);
  }
  return (1 - u) ** decay;
};
const burstAt = (splitSeconds, burst) => {
  if (splitSeconds == null || !burst) return NO_BURST;
  const local = splitSeconds * 1000 - (burst.onsetMs ?? 40);
  const duration = Math.max(burst.durationMs ?? 130, 1);
  if (local < 0 || local >= duration) return NO_BURST;
  const growMs = burst.growMs ?? 45;
  return {
    opacity: (burst.peak ?? 1) * burstFade(local / duration, burst),
    growth: (burst.reach ?? 1) * (growMs > 0 ? clamp01(local / growMs) : 1),
  };
};

// The glint as the crystal cracks: short stubs, popping out to `reach` of the
// rays' length over growMs, then growing slowly to reachEnd / peakEnd until the
// burst fires, and fading out with it (on the burst's own fade).
const glintAt = (splitSeconds, glint, burst) => {
  if (splitSeconds == null || !glint) return NO_BURST;
  const ms = splitSeconds * 1000;
  const local = ms - (glint.onsetMs ?? -370);
  if (local < 0) return NO_BURST;
  const burstOnset = burst?.onsetMs ?? 40;
  const x = clamp01(local / Math.max(burstOnset - (glint.onsetMs ?? -370), 1));
  let fade = 1;
  if (ms > burstOnset) {
    const u = (ms - burstOnset) / Math.max(burst?.durationMs ?? 170, 1);
    if (u >= 1) return NO_BURST;
    fade = burstFade(u, burst);
  }
  const pop = (glint.growMs ?? 50) > 0 ? clamp01(local / glint.growMs) : 1;
  const reach = glint.reach ?? 0.2;
  const peak = glint.peak ?? 0.25;
  return {
    opacity: (peak + ((glint.peakEnd ?? peak) - peak) * x) * fade,
    growth: (reach + ((glint.reachEnd ?? reach) - reach) * x) * pop,
  };
};

// After the crystal's transparent cells (renderOrder 0), see the clone below.
const RAYS_RENDER_ORDER = 1;

const FractureRays = ({
  modelUrl,
  rays = {},
  heroOverviewRuntime = null,
  simplifiedAnimations = false,
  visible = true,
}) => {
  const groupRef = useRef();
  const gltf = useGLTF(modelUrl);

  // Key on the config's values (not object identity) so the material only
  // rebuilds when a setting actually changes — not every render.
  const raysKey = JSON.stringify(rays);
  const material = useMemo(() => createFractureRayMaterial(rays), [raysKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clone the loaded scene (useGLTF returns a shared cached instance) and apply
  // the shared ray material to every mesh. frustumCulled is disabled so the
  // large fanned planes aren't culled when the camera is close to the crystal.
  const scene = useMemo(() => {
    const root = gltf.scene.clone(true);
    let maxDist = 0;
    root.traverse((child) => {
      if (child.isMesh) {
        child.material = material;
        child.castShadow = false;
        child.receiveShadow = false;
        child.frustumCulled = false;
        // Always drawn after the crystal. Left to three's per-frame transparent
        // sort, each ray plane fell in between the crystal's own transparent,
        // depth-writing cells, and as the camera moved a ray could swap from
        // drawing before a cell to after it, so the depth test hid it behind
        // that cell from one frame to the next.
        child.renderOrder = RAYS_RENDER_ORDER;
        // Track the furthest vertex from the model origin so distance-mode
        // gradients auto-normalize to the ray length.
        const geom = child.geometry;
        if (geom) {
          if (!geom.boundingSphere) geom.computeBoundingSphere();
          const bs = geom.boundingSphere;
          if (bs) maxDist = Math.max(maxDist, bs.center.length() + bs.radius);
        }
      }
    });
    material.uniforms.uMaxDist.value = maxDist > 0 ? maxDist : 1;
    return root;
  }, [gltf.scene, material]);

  useEffect(() => () => material.dispose(), [material]);

  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;

    material.uniforms.uTime.value = state.clock.elapsedTime;

    const timing = rays.timing || {};
    const growthDuration = rays.growth?.duration ?? 0.4;

    let opacity = 0;
    let growth = 1;

    // DEV preview: pin the rays visible and loop the growth reveal so the effect
    // can be inspected without scrolling. In the console:
    //   globalThis.__FORCE_FRACTURE_RAYS__ = true
    const forced = typeof globalThis !== 'undefined' && globalThis.__FORCE_FRACTURE_RAYS__;

    const mode = (import.meta.env.DEV && globalThis.__FRACTURE_RAYS_MODE__) || rays.mode || 'charge';

    if (forced) {
      opacity = 1;
      growth = (state.clock.elapsedTime % 1.5) / 1.5;
    } else if (mode === 'explosion') {
      // Only on the hero → index move: a page that lands on the index (/work)
      // explodes the crystal too, behind the loader, with no runtime running.
      // On the explosion clock: a glint of short rays as the crystal cracks
      // (fractureGlint), held and growing until the discharge after the split
      // (burst), which carries the rays on from the glint's length to their
      // full length; both fade out together.
      const snap = heroOverviewRuntime?.getSnapshot?.();
      if (snap?.active) {
        const t = getExplosionSplitSeconds();
        const glint = glintAt(t, rays.fractureGlint, rays.burst);
        const burst = burstAt(t, rays.burst);
        opacity = Math.max(glint.opacity, burst.opacity);
        growth = burst.opacity > 0 ? Math.max(glint.growth, burst.growth) : glint.growth;
      }
    } else {
      const snap = heroOverviewRuntime?.getSnapshot?.();
      if (snap && snap.active && snap.timing) {
        const { progress } = snap;
        const totalMs = snap.timing.totalDurationMs ?? 1500;
        const appearAt = timing.appearAt ?? snap.timing.fractureChargeEnd;
        const disappearAt = timing.disappearAt ?? snap.timing.fragmentImpulseDecayStart;

        // Visibility: hard on/off across the window.
        opacity = (progress >= appearAt && progress < disappearAt) ? 1 : 0;

        // Growth: base→tip over growthDuration seconds from the appear moment,
        // independent of the visible window length.
        const secondsSinceAppear = ((progress - appearAt) * totalMs) / 1000;
        growth = growthDuration > 0 ? clamp01(secondsSinceAppear / growthDuration) : 1;
      }
    }

    material.uniforms.uOpacity.value = opacity * getExplosionLookScale('rays');
    material.uniforms.uGrowth.value = growth;
    group.visible = opacity > 0.001;
  });

  if (simplifiedAnimations || !visible) return null;

  return (
    <group ref={groupRef} visible={false}>
      <primitive object={scene} />
    </group>
  );
};

export default FractureRays;
