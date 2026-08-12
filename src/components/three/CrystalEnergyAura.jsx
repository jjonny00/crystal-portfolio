// src/components/three/CrystalEnergyAura.jsx
// Procedural energy aura: vertical streams of plasma rising around the crystal.
//
// Deliberately NOT a particle system. The whole effect is one open-ended
// cylindrical shell (a single draw call, two overlapping layers of overdraw at
// worst) with a custom ShaderMaterial that generates its own hash-based value
// noise — no sprite atlas, no noise texture, no render targets.
//
// How the "streams" are made, in the fragment shader:
//   1. Sample 3D value noise in the shell's LOCAL space (3D sampling is what
//      keeps it seamless around the cylinder — there is no UV seam to hide).
//   2. Divide the vertical axis of the sample domain by `verticalStretch`, which
//      smears round noise blobs into long vertical filaments.
//   3. Slide the domain downward over time so the filaments read as rising.
//   4. Multiply by a slow, low-frequency "presence" mask so parts of the shell
//      thin out — this is what stops it collapsing into a uniform glow. Its
//      cells must stay smaller than the shell or it becomes a global fade.
//   5. Threshold the result (`threshold` / `breakup`) to cut it into broken,
//      hard-edged bands, then apply an INVERSE Fresnel term that fades the
//      silhouette and keeps the energy over the middle of the field.
//
// Fragments below the alpha floor `discard`, which is the main overdraw saving:
// most of the shell is empty most of the time.
//
// Every tunable comes from crystalConfig's `energy` section (tier-resolved by
// `resolveEnergyConfig`). Uniforms are refreshed each frame from the current
// props, so config edits apply live without rebuilding the material.

import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const vertexShader = /* glsl */ `
  uniform float uHalfHeight;

  varying vec3 vLocalPos;
  varying vec3 vNormalW;
  varying vec3 vViewDirW;
  varying float vHeight;

  void main() {
    vLocalPos = position;
    // 0 at the base of the shell, 1 at the top — drives the vertical falloff.
    vHeight = clamp((position.y + uHalfHeight) / max(2.0 * uHalfHeight, 1e-4), 0.0, 1.0);

    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewDirW = normalize(cameraPosition - worldPos.xyz);

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

// OCTAVES is injected as a #define so unused octaves are compiled out entirely
// rather than being branched around at runtime. Each octave is ~8 hash calls
// plus a trilinear blend, so cost scales close to linearly with the count.
const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3  uColor;
  uniform vec3  uCoreColor;
  uniform float uIntensity;
  uniform float uOpacity;
  uniform float uSpeed;
  uniform float uScale;
  uniform float uVerticalStretch;
  uniform float uTurbulence;
  uniform float uThreshold;
  uniform float uSoftness;
  uniform float uAsymmetry;
  uniform float uAsymmetryScale;
  uniform float uSwirl;
  uniform float uFresnelStrength;
  uniform float uFresnelPower;
  uniform float uFadeBottom;
  uniform float uFadeTop;
  uniform float uRise;

  varying vec3 vLocalPos;
  varying vec3 vNormalW;
  varying vec3 vViewDirW;
  varying float vHeight;

  // iq's cheap 3D hash — no texture lookup, ~6 ALU.
  float hash31(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  // Trilinear value noise. Cheaper than simplex and plenty for a soft plasma.
  float vnoise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);

    return mix(
      mix(
        mix(hash31(i + vec3(0.0, 0.0, 0.0)), hash31(i + vec3(1.0, 0.0, 0.0)), f.x),
        mix(hash31(i + vec3(0.0, 1.0, 0.0)), hash31(i + vec3(1.0, 1.0, 0.0)), f.x),
        f.y
      ),
      mix(
        mix(hash31(i + vec3(0.0, 0.0, 1.0)), hash31(i + vec3(1.0, 0.0, 1.0)), f.x),
        mix(hash31(i + vec3(0.0, 1.0, 1.0)), hash31(i + vec3(1.0, 1.0, 1.0)), f.x),
        f.y
      ),
      f.z
    );
  }

  void main() {
    // --- Build the sample domain -------------------------------------------
    // Twist the horizontal plane by height so the columns spiral instead of
    // running dead-straight up the shell.
    float twist = vLocalPos.y * uSwirl;
    float cs = cos(twist);
    float sn = sin(twist);
    vec2 swirled = vec2(
      vLocalPos.x * cs - vLocalPos.z * sn,
      vLocalPos.x * sn + vLocalPos.z * cs
    );

    vec3 domain = vec3(swirled.x, vLocalPos.y, swirled.y) * uScale;
    // Compress the vertical axis => tall, thin filaments instead of blobs.
    domain.y /= max(uVerticalStretch, 0.001);
    // Slide the domain DOWN so the pattern appears to rise.
    domain.y -= uTime * uSpeed;

    // fBm. Each extra octave is finer, fainter and drifts faster, adding detail
    // WITHIN the streams rather than more of them. The running norm keeps the
    // mean near 0.5 whatever the octave count, so changing the octave count
    // doesn't shift the effective threshold and force a retune of the field.
    float n = vnoise(domain);
    float norm = 1.0;
    float amp = 1.0;
    vec3 p = domain;

    #if OCTAVES > 1
      amp *= uTurbulence * 0.6;
      p = p * 2.17 + vec3(19.3, 0.0, 7.1);
      p.y -= uTime * uSpeed * 0.85;
      n += vnoise(p) * amp;
      norm += amp;
    #endif
    #if OCTAVES > 2
      amp *= uTurbulence * 0.6;
      p = p * 2.03 + vec3(7.7, 0.0, 23.1);
      p.y -= uTime * uSpeed * 1.4;
      n += vnoise(p) * amp;
      norm += amp;
    #endif
    #if OCTAVES > 3
      amp *= uTurbulence * 0.6;
      p = p * 2.11 + vec3(31.5, 0.0, 5.3);
      p.y -= uTime * uSpeed * 2.2;
      n += vnoise(p) * amp;
      norm += amp;
    #endif

    n /= norm;

    // --- Asymmetry: thin the field on SOME sides, not all of it at once ------
    // Sampled on its own domain (uAsymmetryScale, independent of uScale) so it
    // resolves several cells around the circumference and up the height. The
    // mask must stay genuinely spatial: if its cells are larger than the shell
    // it degenerates into one global brightness fade that switches the whole
    // aura on and off. It drifts upward with the streams rather than animating
    // on a separate time axis, so gaps travel with the flow.
    vec3 maskDomain = vec3(swirled.x, vLocalPos.y * 0.55, swirled.y) * uAsymmetryScale;
    maskDomain.y -= uTime * uSpeed * 0.3;
    float presence = vnoise(maskDomain);
    n *= mix(1.0, smoothstep(0.25, 0.72, presence), uAsymmetry);

    // --- Threshold into broken bands ---------------------------------------
    float streams = smoothstep(uThreshold, uThreshold + uSoftness, n);
    if (streams <= 0.0) discard;

    // --- Vertical shaping ---------------------------------------------------
    float fade = smoothstep(0.0, max(uFadeBottom, 0.001), vHeight)
               * (1.0 - smoothstep(1.0 - max(uFadeTop, 0.001), 1.0, vHeight));
    // Streams dissipate as they climb.
    streams *= mix(1.0, 1.0 - vHeight, uRise);

    // --- INVERSE Fresnel: weight the centre, fade the silhouette -------------
    // Note this is the opposite of a conventional Fresnel rim term. "facing" is
    // 1 where the shell points straight at the camera — which, on a shell
    // wrapping the crystal, is the part of it seen over the crystal's face —
    // and 0 at the silhouette, i.e. the outer left/right extremes of the aura.
    // Raising uFresnelStrength therefore pulls the energy in off the edges and
    // concentrates it over the middle. 0 leaves the field flat.
    float facing = abs(dot(normalize(vNormalW), normalize(vViewDirW)));
    float core = pow(facing, uFresnelPower);
    float weight = mix(1.0, core, uFresnelStrength);

    float alpha = streams * fade * weight * uOpacity;
    if (alpha < 0.003) discard;

    // Hot core only in the densest parts, so the field has a temperature
    // gradient rather than being flat-tinted.
    vec3 col = mix(uColor, uCoreColor, pow(streams, 3.0) * 0.65) * uIntensity * streams;

    gl_FragColor = vec4(col, alpha);
  }
`;

const DEFAULT_FIELD = {
  crystalRadius: 1.0,
  radius: 1.4,
  taper: 1.2,
  height: 3.0,
  xOffset: 0,
  yOffset: 0.15,
  zOffset: 0,
  radialSegments: 48,
};

const DEFAULT_FALLOFF = { bottom: 0.3, top: 0.45, rise: 0.4 };

/**
 * Additive plasma shell around the crystal.
 *
 * @param {object}  energy      tier-resolved crystalConfig `energy` block
 * @param {boolean} visible     hide without unmounting (keeps the shader warm)
 * @param {boolean} reducedMotion  freeze the flow; the field still renders, static
 */
const CrystalEnergyAura = ({
  energy,
  position = [0, 0, 0],
  visible = true,
  reducedMotion = false,
  renderOrder = 1200,
}) => {
  // Seeded away from 0 so the first frame doesn't land on the noise lattice's
  // origin, where the pattern is at its least interesting — the field should be
  // fully formed the instant it mounts, with no ramp-in.
  const timeRef = useRef(37.0);

  // Latest config read per-frame so live tuning doesn't rebuild the material.
  const cfgRef = useRef(energy);
  cfgRef.current = energy;

  const field = { ...DEFAULT_FIELD, ...(energy?.field || {}) };
  const crystalRadius = field.crystalRadius || 1;
  const baseRadius = field.radius * crystalRadius;
  const topRadius = baseRadius * (field.taper ?? 1);
  const height = field.height * crystalRadius;
  const radialSegments = Math.max(8, Math.round(field.radialSegments || 48));
  const octaves = THREE.MathUtils.clamp(Math.round(energy?.octaves ?? 2), 1, 4);

  // Geometry only depends on the shell's shape — not on any of the look knobs.
  const geometry = useMemo(
    () =>
      new THREE.CylinderGeometry(
        topRadius,
        baseRadius,
        height,
        radialSegments,
        1,
        true, // open-ended: no caps to pay for, and caps would read as lids
      ),
    [topRadius, baseRadius, height, radialSegments],
  );

  // Rebuilt only when the octave count changes (it is a compile-time #define).
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        defines: { OCTAVES: octaves },
        uniforms: {
          uTime: { value: 0 },
          uHalfHeight: { value: height * 0.5 },
          uColor: { value: new THREE.Color('#4ebbff') },
          uCoreColor: { value: new THREE.Color('#dff4ff') },
          uIntensity: { value: 1.5 },
          uOpacity: { value: 0.5 },
          uSpeed: { value: 0.3 },
          uScale: { value: 1.45 },
          uVerticalStretch: { value: 4.5 },
          uTurbulence: { value: 0.55 },
          uThreshold: { value: 0.44 },
          uSoftness: { value: 0.2 },
          uAsymmetry: { value: 0.35 },
          uAsymmetryScale: { value: 1.1 },
          uSwirl: { value: 0.35 },
          uFresnelStrength: { value: 0.0 }, // neutral: flat across the shell
          uFresnelPower: { value: 2.2 },
          uFadeBottom: { value: 0.3 },
          uFadeTop: { value: 0.45 },
          uRise: { value: 0.4 },
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide, // front + back layers => the field wraps the crystal
        depthWrite: false,
        depthTest: true, // let the crystal occlude the far side of the shell
      }),
    [octaves], // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame((_, deltaRaw) => {
    if (!visible) return;

    const cfg = cfgRef.current;
    if (!cfg) return;

    if (!reducedMotion) {
      timeRef.current += Math.min(deltaRaw, 1 / 30); // clamp so a stutter can't jump the flow
    }

    const u = material.uniforms;
    const f = { ...DEFAULT_FALLOFF, ...(cfg.falloff || {}) };
    const shell = { ...DEFAULT_FIELD, ...(cfg.field || {}) };

    u.uTime.value = timeRef.current;
    u.uHalfHeight.value = (shell.height * (shell.crystalRadius || 1)) * 0.5;
    u.uColor.value.set(cfg.color ?? '#4ebbff');
    u.uCoreColor.value.set(cfg.coreColor ?? '#dff4ff');
    u.uIntensity.value = cfg.intensity ?? 1.5;
    u.uOpacity.value = cfg.opacity ?? 0.5;
    u.uSpeed.value = cfg.speed ?? 0.3;
    u.uScale.value = cfg.scale ?? 1.45;
    u.uVerticalStretch.value = cfg.verticalStretch ?? 4.5;
    u.uTurbulence.value = cfg.turbulence ?? 0.55;
    u.uThreshold.value = cfg.threshold ?? 0.44;
    // `breakup` is authored as 0 = soft wash → 1 = shredded, which is the
    // inverse of the smoothstep width the shader actually wants.
    u.uSoftness.value = THREE.MathUtils.lerp(0.5, 0.03, THREE.MathUtils.clamp(cfg.breakup ?? 0.65, 0, 1));
    u.uAsymmetry.value = cfg.asymmetry ?? 0.35;
    u.uAsymmetryScale.value = cfg.asymmetryScale ?? 1.1;
    u.uSwirl.value = cfg.swirl ?? 0.35;
    u.uFresnelStrength.value = cfg.fresnelStrength ?? 0.0;
    u.uFresnelPower.value = cfg.fresnelPower ?? 2.2;
    u.uFadeBottom.value = f.bottom;
    u.uFadeTop.value = f.top;
    u.uRise.value = f.rise;
  });

  if (!energy?.enabled) return null;

  return (
    <mesh
      geometry={geometry}
      material={material}
      // Offsets are in crystal radii. Because the noise is sampled in the
      // shell's LOCAL space, sliding the shell carries the pattern with it —
      // nudging it clear of the crystal doesn't make the streams swim.
      position={[
        position[0] + (field.xOffset ?? 0) * crystalRadius,
        position[1] + (field.yOffset ?? 0) * crystalRadius,
        position[2] + (field.zOffset ?? 0) * crystalRadius,
      ]}
      visible={visible}
      frustumCulled={false}
      renderOrder={renderOrder}
    />
  );
};

export default CrystalEnergyAura;
