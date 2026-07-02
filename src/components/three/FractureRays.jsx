// src/components/three/FractureRays.jsx
// Crack-aligned energy rays for the hero→overview fracture beat.
//
// Renders a single GLB of fanned planes (hand-aligned to the crystal's cracks)
// with a shared gradient shader material. Every tunable lives in the
// `fracture.rays` config block (see crystalConfig.js); this component just wires
// that config into the material and drives the two time-varying uniforms
// (uOpacity, uGrowth) off the shared useHeroOverviewRuntime clock.
//
// Two independent timelines:
//   • Visibility — hard on/off between rays.timing.appearAt and disappearAt
//     (progress of the hero→overview sequence).
//   • Growth — the base→tip reveal, on its OWN timer (rays.growth.duration in
//     seconds), starting when the rays appear. Decoupled from how long they show.

import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { createFractureRayMaterial } from '../materials/fractureRayMaterial';

const clamp01 = (x) => Math.min(1, Math.max(0, x));

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

    if (forced) {
      opacity = 1;
      growth = (state.clock.elapsedTime % 1.5) / 1.5;
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

    material.uniforms.uOpacity.value = opacity;
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
