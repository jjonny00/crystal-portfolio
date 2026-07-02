// src/components/materials/fractureRayMaterial.js
// Gradient shader material for the crack-aligned fracture "rays".
//
// The gradient turns a per-fragment scalar t (0 at the crack/base, 1 at the
// tip) into a color→transparent falloff. The scalar source is switchable so we
// can dial in the mapping live without re-exporting the GLB:
//   uGradientMode 0 = UV.y   (needs a base→tip V unwrap)
//                 1 = UV.x   (needs a base→tip U unwrap)
//                 2 = local-space distance from the model origin (no UVs needed;
//                     natural for rays that fan out from the crystal center)
// uGradientInvert flips which end is the bright base.
// uGradientPower shapes the falloff (1 = linear, >1 = tighter to the base).
// uMaxDist normalizes distance mode (auto-set to the geometry's max radius).
//
// On top of the length falloff, an optional width mask breaks each plane into a
// few thin sub-rays across its width (the UV axis perpendicular to the length
// gradient). Sub-rays are jittered (position/thickness/brightness) by uRayJitter
// for an organic look:
//   uSubRaysEnabled 0/1 · uRayCount · uRayThickness · uRaySoftness · uRayJitter · uRaySeed
//
// Additive blend + depthWrite off (depthTest on) matches FractureRingImage so the
// beams read as emitted light and emerge from the cracks rather than floating on top.

import * as THREE from 'three';

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vLocalPos;
  void main() {
    vUv = uv;
    vLocalPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const MAX_RAYS = 16;

const fragmentShader = /* glsl */ `
  #define MAX_RAYS ${MAX_RAYS}
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform int uGradientMode;
  uniform float uGradientInvert;
  uniform float uGradientPower;
  uniform float uMaxDist;
  uniform float uSubRaysEnabled;
  uniform float uRayCount;
  uniform float uRayThickness;
  uniform float uRaySoftness;
  uniform float uRayJitter;
  uniform float uRaySeed;
  uniform float uRayFan;
  uniform float uTime;
  uniform float uGrowth;
  uniform float uGrowthEdge;
  uniform float uEdgeBoost;
  uniform float uShimmerAmount;
  uniform float uShimmerSpeed;
  varying vec2 vUv;
  varying vec3 vLocalPos;

  float hash(float n){ return fract(sin(n) * 43758.5453123); }

  void main() {
    // Length coordinate (base→tip) drives the fade; width coordinate is the
    // perpendicular UV axis and drives the sub-ray banding.
    float lengthT;
    float widthCoord;
    if (uGradientMode == 0) {
      lengthT = vUv.y;
      widthCoord = vUv.x;
    } else if (uGradientMode == 1) {
      lengthT = vUv.x;
      widthCoord = vUv.y;
    } else {
      lengthT = clamp(length(vLocalPos) / max(uMaxDist, 0.0001), 0.0, 1.0);
      widthCoord = vUv.y;
    }
    if (uGradientInvert > 0.5) lengthT = 1.0 - lengthT;

    // 0 at the base (crack) → 1 at the tip.
    float alongFromBase = clamp(lengthT, 0.0, 1.0);

    // Bright at the base (lengthT=0) → transparent at the tip (lengthT=1).
    float grad = pow(clamp(1.0 - lengthT, 0.0, 1.0), max(uGradientPower, 0.0001));

    // Width mask: sum a few jittered narrow bands across the width.
    float widthMask = 1.0;
    if (uSubRaysEnabled > 0.5) {
      float count = max(uRayCount, 1.0);
      // Sub-rays converge at the base and fan out toward the tip, scaled by
      // uRayFan (0 = parallel, 1 = full fan).
      float spread = mix(1.0, alongFromBase, uRayFan);
      // Screen-space width of one pixel in widthCoord units. Clamp every band
      // edge to be at least ~1.5px soft so the thin bright lines can't drop below
      // pixel size and scintillate/flicker as the camera moves.
      float aa = fwidth(widthCoord) * 1.5;
      float mask = 0.0;
      for (int i = 0; i < MAX_RAYS; i++) {
        if (float(i) >= count) break;
        float fi = float(i) + uRaySeed;
        float even = (float(i) + 0.5) / count;
        float pos    = mix(even, hash(fi + 1.0), uRayJitter);
        float thick  = uRayThickness * mix(1.0, 0.4 + hash(fi + 31.0), uRayJitter);
        float bright = mix(1.0, 0.3 + 0.7 * hash(fi + 61.0), uRayJitter);
        // Straight ray line: center converges to 0.5 at the base, spreads to
        // its jittered position at the tip.
        float center = 0.5 + (pos - 0.5) * spread;
        float d = abs(widthCoord - center);
        float edge = max(uRaySoftness, aa);
        mask += (1.0 - smoothstep(thick, thick + edge, d)) * bright;
      }
      widthMask = clamp(mask, 0.0, 1.0);
    }

    // Growth reveal: rays extend from the base out to the growth front (uGrowth),
    // which sweeps 0→1 over the visible window. Soft leading edge.
    float growMask = 1.0 - smoothstep(uGrowth, uGrowth + uGrowthEdge, alongFromBase);
    // Brighten a band right at the growth front — energy racing outward.
    float edgeProx = 1.0 - smoothstep(0.0, uGrowthEdge, abs(alongFromBase - uGrowth));
    float edgeBoost = 1.0 + edgeProx * uEdgeBoost;

    // Shimmer/flicker that ramps toward the tip and the growth front, as if the
    // energy is building up before the explosion.
    float tipWeight = smoothstep(0.3, 1.0, alongFromBase);
    float n = hash(floor(uTime * uShimmerSpeed) * 1.7 + widthCoord * 51.0 + alongFromBase * 27.0 + uRaySeed);
    float flicker = mix(1.0, 0.25 + 0.75 * n, uShimmerAmount * max(tipWeight, edgeProx));

    float intensity = grad * widthMask * growMask * edgeBoost * flicker;
    gl_FragColor = vec4(uColor * intensity, intensity * uOpacity);
  }
`;

const GRADIENT_MODES = { uvY: 0, uvX: 1, dist: 2 };

// Build the material from a `fracture.rays` config object (see crystalConfig.js).
export const createFractureRayMaterial = (cfg = {}) => {
  const gradient = cfg.gradient || {};
  const subRays = cfg.subRays || {};
  const growth = cfg.growth || {};
  const shimmer = cfg.shimmer || {};
  const depth = cfg.depth || {};
  const occlude = depth.occlude ?? true;
  const bias = depth.bias ?? -4;

  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(cfg.color ?? '#ffffff') },
      uOpacity: { value: 0 },
      uGradientMode: { value: GRADIENT_MODES[gradient.mode] ?? 1 },
      uGradientInvert: { value: gradient.invert ? 1 : 0 },
      uGradientPower: { value: gradient.power ?? 1 },
      uMaxDist: { value: 1 },
      uSubRaysEnabled: { value: (subRays.enabled ?? true) ? 1 : 0 },
      uRayCount: { value: subRays.count ?? 5 },
      uRayThickness: { value: subRays.thickness ?? 0.02 },
      uRaySoftness: { value: subRays.softness ?? 0.02 },
      uRayJitter: { value: subRays.jitter ?? 0.6 },
      uRaySeed: { value: subRays.seed ?? 0 },
      uRayFan: { value: subRays.fan ?? 1 },
      uTime: { value: 0 },
      uGrowth: { value: 1 },          // animated 0→1 by the component
      uGrowthEdge: { value: growth.edge ?? 0.12 },
      uEdgeBoost: { value: growth.edgeBoost ?? 1.5 },
      uShimmerAmount: { value: shimmer.amount ?? 0.5 },
      uShimmerSpeed: { value: shimmer.speed ?? 22 },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    // depthWrite off so the additive glow doesn't occlude other effects.
    // depthTest (occlude) lets the crystal hide the ray bases for the emergence
    // look; the polygonOffset bias pulls the rays toward the camera so they don't
    // z-fight the near-coplanar exploding facets (which caused transition flicker).
    depthWrite: false,
    depthTest: occlude,
    polygonOffset: occlude,
    polygonOffsetFactor: bias,
    polygonOffsetUnits: bias,
    side: THREE.DoubleSide,
    toneMapped: false,
    extensions: { derivatives: true }, // fwidth() for the sub-ray anti-aliasing
  });
};

export default createFractureRayMaterial;
