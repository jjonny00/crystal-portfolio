// src/components/three/OrbEnergyParticles.jsx
// Fine, flickering energy motes that swarm the central glowing orb.
// Sizing is screen-space (px-based) so the motes stay "fine" regardless of how
// far the camera is from the orb, matching the orb glow's own px sizing.

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePxToWorld } from '../../hooks/usePxToWorld';

/**
 * A small cloud of fine sparks orbiting the orb. Each spark drifts on a gentle
 * orbital path and flickers at its own high frequency, so the swarm shimmers
 * with energy rather than animating in lockstep. The point sprite is procedural
 * (soft radial falloff in the shader) so no texture is required.
 */
const OrbEnergyParticles = ({
  count = 70,
  enabled = true,
  visible = true,
  position = [0, 0, 0],
  // Spread of the swarm, in CSS px (converted to world units so it tracks the
  // orb's screen-space size). Inner radius keeps motes off the bright core.
  radiusPx = 920,
  innerRadiusPx = 1,
  baseSizePx = 5,
  sizeVariation = 2.5,
  color = '#aee3ff',
  emissiveIntensity = 2.4,
  driftSpeed = 0.05,
  flickerSpeed = 2.0,
  opacity = 0.55,   // barely-perceptible by default
  // When true, keep the points mounted (but invisible) even while `visible` is
  // false so the shader can be GPU-warmed ahead of the first trigger.
  warmup = false,
}) => {
  const pointsRef = useRef();
  const timeRef = useRef(0);
  const { px } = usePxToWorld();

  const { geometry, material, particleData } = useMemo(() => {
    if (!enabled) return { geometry: null, material: null, particleData: [] };

    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const flickerPhases = new Float32Array(count);
    const flickerRates = new Float32Array(count);
    const data = [];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Distribute in a spherical shell around the orb (radii are stored in px
      // and converted to world units each frame so they stay screen-relative).
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radiusFrac = Math.cbrt(Math.random()); // bias outward, fill volume

      const particle = {
        theta,
        phi,
        radiusFrac,
        // Independent slow orbital + bob motion per spark.
        orbitSpeed: (0.4 + Math.random() * 0.8) * (Math.random() < 0.5 ? 1 : -1),
        bobSpeed: 0.6 + Math.random() * 1.4,
        bobPhase: Math.random() * Math.PI * 2,
        bobAmount: 0.05 + Math.random() * 0.12,
      };
      data.push(particle);

      positions[i3] = 0;
      positions[i3 + 1] = 0;
      positions[i3 + 2] = 0;

      sizes[i] = baseSizePx * (1 + Math.random() * sizeVariation);
      flickerPhases[i] = Math.random() * Math.PI * 2;
      flickerRates[i] = 0.6 + Math.random() * 0.9; // detune flicker per spark
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('flickerPhase', new THREE.BufferAttribute(flickerPhases, 1));
    geo.setAttribute('flickerRate', new THREE.BufferAttribute(flickerRates, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPx: { value: 1 },
        uScale: { value: 1 },
        uColor: { value: new THREE.Color(color) },
        uEmissive: { value: emissiveIntensity },
        uFlickerSpeed: { value: flickerSpeed },
        uOpacity: { value: opacity },
      },
      vertexShader: `
        attribute float size;
        attribute float flickerPhase;
        attribute float flickerRate;
        uniform float uTime;
        uniform float uPx;
        uniform float uScale;
        uniform float uFlickerSpeed;
        varying float vFlicker;

        void main() {
          // High-frequency twinkle plus an occasional brighter spark.
          float base = 0.45 + 0.55 * sin(uTime * uFlickerSpeed * flickerRate + flickerPhase);
          float spark = pow(max(0.0, sin(uTime * uFlickerSpeed * 0.35 * flickerRate + flickerPhase * 2.0)), 8.0);
          vFlicker = clamp(base + spark, 0.0, 1.4);

          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * uPx * (uScale / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uEmissive;
        uniform float uOpacity;
        varying float vFlicker;

        void main() {
          // Soft round spark with a hot center.
          float d = length(gl_PointCoord - vec2(0.5));
          float glow = 1.0 - smoothstep(0.0, 0.5, d);
          float core = pow(glow, 3.0);

          vec3 col = uColor * uEmissive * glow * vFlicker;
          col += vec3(core * vFlicker * 0.6); // white-hot center
          float alpha = glow * vFlicker * uOpacity;

          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    return { geometry: geo, material: mat, particleData: data };
  }, [enabled, count, baseSizePx, sizeVariation, color, emissiveIntensity, flickerSpeed, opacity]);

  useFrame((state, deltaTime) => {
    if (!enabled || !visible || !material || !geometry) return;

    timeRef.current += deltaTime;
    const t = timeRef.current;

    material.uniforms.uTime.value = t;
    material.uniforms.uPx.value = px(1);
    material.uniforms.uScale.value = (state.size.height * state.gl.getPixelRatio()) / 2;

    const outer = px(radiusPx);
    const inner = px(innerRadiusPx);
    const positions = geometry.attributes.position.array;

    for (let i = 0; i < count; i++) {
      const p = particleData[i];
      const i3 = i * 3;

      const radius = inner + (outer - inner) * p.radiusFrac;
      const theta = p.theta + t * driftSpeed * p.orbitSpeed;
      const bob = Math.sin(t * p.bobSpeed + p.bobPhase) * p.bobAmount;
      const phi = p.phi + bob;

      const sinPhi = Math.sin(phi);
      positions[i3] = Math.cos(theta) * sinPhi * radius;
      positions[i3 + 1] = Math.cos(phi) * radius;
      positions[i3 + 2] = Math.sin(theta) * sinPhi * radius;
    }

    geometry.attributes.position.needsUpdate = true;
  });

  if (!enabled || (!visible && !warmup) || !geometry || !material) return null;

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      material={material}
      position={position}
      frustumCulled={false}
      renderOrder={1000}
      visible={visible}
    />
  );
};

export default OrbEnergyParticles;
