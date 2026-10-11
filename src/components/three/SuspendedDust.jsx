// src/components/three/SuspendedDust.jsx
//
// Dust hanging in the air, caught by the light: the motes you see drifting in a
// sunbeam in a game. Each one stays where it is and only wanders a little, on a
// few slow sine waves of its own. What makes them read as dust rather than
// sparks is the light:
//
//   • they glow by how close they are to the light at the crystal (`lightRadius`,
//     `lightGain`) over a dim floor (`ambient`), so the air around the crystal is
//     full of them and the edges of the frame hold only a few;
//   • a mote between the camera and that light is backlit and brightens sharply
//     (`scatter`), the forward scattering that makes a shaft of light visible;
//   • the ones off the camera's focus open into wider discs, dimmer the wider
//     they get, as through a real lens (`aperture`, `maxSize`): a mote close to
//     the camera blurs as fast as it grows, into a large soft disc, while the far
//     ones blur only a little (`backBlur`) and stay specks. Those right at the
//     lens fade out (`nearFade`);
//   • the air right around the crystal holds only a handful, then a thin
//     scattering, then as many as elsewhere (`clearing`).
//
// When the crystal explodes the dust is pushed out from it, and when it re-forms
// the dust draws back in (`expand`): out from the instant the explosion proper
// begins (after the fracture's charge), on the explosion's own clock; in from
// the instant the crystal re-forms, never behind the camera on its way back. The push fades with distance: the motes nearest the crystal move the
// most, the ones out past `expand.far` not at all.
//
// The out-of-focus discs carry a little lens character: the slightly polygonal
// shape of an aperture's blades, the same way up across the frame (`blades`,
// `bladeRoundness`), a faintly brighter rim (`rim`), a thin warm-outside,
// cool-inside colour fringe (`fringe`), and a light grain across the disc
// (`grain`). In-focus motes keep the plain soft dot.
//
// They're drawn like the overview's hover particles (FacetHoverParticles.jsx):
// the same soft disc, which reaches nothing at its edge so a bright one never
// shows its square sprite, and the same twinkle with an occasional flare
// (`shimmer`, `shimmerSpeed`), in brightness only: unlike the hover particles,
// a mote never changes size. The light can only push a mote
// so far (`maxBrightness`), which keeps the brightest close to the hover
// particles' range rather than blowing out under bloom.
//
// All of it runs in the vertex shader from a static buffer, so a frame costs a
// few uniform writes on the CPU however many motes there are.

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { dustMotes as defaults } from '../../crystalConfig';

const vertexShader = /* glsl */ `
uniform float uTime;
uniform float uDrift;
uniform float uDriftSpeed;
uniform float uSize;
uniform float uProj;
uniform float uFocus;
uniform float uAperture;
uniform float uBackBlur;
uniform float uMaxSize;
uniform vec3 uLightPos;
uniform float uLightRadius;
uniform float uLightGain;
uniform float uAmbient;
uniform float uScatter;
uniform float uShimmer;
uniform float uShimmerSpeed;
uniform float uMaxBrightness;
uniform float uNearFade;
uniform float uReveal;
uniform float uExpand;
uniform float uPush;
uniform float uPushNear;
uniform float uPushFar;
uniform float uPushFalloff;

// x, y, z: drift phases; w: a 0–1 roll (this mote's grain pattern)
attribute vec4 aSeed;
// x: size scale; y: brightness scale; z: shimmer phase; w: shimmer rate
attribute vec4 aParams;
// This mote's star colour (linear), see STAR_COLOURS.
attribute vec3 aStar;

varying vec3 vStar;
varying float vSeed;

varying float vIntensity;
varying float vSoft;

const float MIN_SIZE = 1.5;

void main() {
  // A few slow, incommensurate waves per axis, so no two motes move together
  // and none of them visibly loops.
  float t = uTime * uDriftSpeed;
  vec3 drift = vec3(
    sin(t * 0.37 + aSeed.x) + 0.5 * sin(t * 0.83 + aSeed.y * 1.7),
    sin(t * 0.29 + aSeed.y) + 0.5 * sin(t * 0.71 + aSeed.z * 1.3),
    sin(t * 0.33 + aSeed.z) + 0.5 * sin(t * 0.67 + aSeed.x * 1.9)
  );
  // Pushed out from the crystal as it explodes, by less the further out.
  vec3 fromCrystal = position - uLightPos;
  float crystalDist = max(length(fromCrystal), 1e-3);
  float reach = pow(1.0 - smoothstep(uPushNear, uPushFar, crystalDist), uPushFalloff);
  vec3 push = fromCrystal / crystalDist * uPush * uExpand * reach;

  vec3 p = position + push + drift * uDrift;

  vec4 world = modelMatrix * vec4(p, 1.0);
  vec4 mv = viewMatrix * world;
  float depth = max(-mv.z, 0.01);

  // Size: the mote itself, or its blur circle if that is larger. A wider disc
  // spreads the same light, so it dims as it grows. The blur circle is a thin
  // lens's: the aperture times how far the mote is from the focus in inverse
  // depth, so in front of the focus it grows as fast as the mote does and a
  // close one becomes a large soft disc. Behind the focus it is scaled down, so
  // the far motes stay specks.
  float sharp = uSize * aParams.x * uProj / depth;
  float defocus = 1.0 / depth - 1.0 / uFocus;
  float coc = uAperture * uProj * (defocus > 0.0 ? defocus : -defocus * uBackBlur);
  coc = min(coc, uMaxSize);
  float size = max(max(sharp, coc), MIN_SIZE);
  float spread = max(sharp, MIN_SIZE) / size;
  // Below a pixel and a half a mote is drawn at that size and dimmed instead,
  // so the smallest ones don't shimmer as they cross pixels.
  float subpixel = min(sharp / MIN_SIZE, 1.0);
  vSoft = clamp(1.0 - spread, 0.0, 1.0);

  // Light from the crystal, with forward scattering when backlit.
  vec3 toLight = uLightPos - world.xyz;
  float dist = length(toLight);
  float falloff = 1.0 / (1.0 + (dist * dist) / (uLightRadius * uLightRadius));
  vec3 viewDir = normalize(world.xyz - cameraPosition);
  float forward = max(dot(viewDir, toLight / max(dist, 1e-4)), 0.0);
  float phase = 1.0 + uScatter * pow(forward, 8.0);
  float lit = uAmbient + uLightGain * falloff * phase;
  // Eases towards uMaxBrightness instead of running on, so the brightest stay
  // near the hover particles' range and still rank by how lit they are.
  float bright = uMaxBrightness * (1.0 - exp(-aParams.y * lit / uMaxBrightness));

  // The hover particles' twinkle: a gentle pulse, and now and then a flare that
  // brightens the mote (but, unlike theirs, never swells it).
  float twinkleTime = uTime * uShimmerSpeed * aParams.w;
  float tw = 0.5 + 0.5 * sin(twinkleTime + aParams.z);
  float flare = pow(max(0.0, sin(twinkleTime * 0.5 + aParams.z * 2.3)), 16.0);
  float shimmer = (1.0 - 0.6 * uShimmer) + 0.6 * uShimmer * tw + 2.4 * uShimmer * flare;

  float nearFade = smoothstep(uNearFade, uNearFade * 2.0, depth);

  vIntensity = bright * shimmer * pow(spread, 1.4) * subpixel * subpixel * nearFade * uReveal;

  gl_PointSize = size;
  vStar = aStar;
  vSeed = aSeed.w;
  gl_Position = projectionMatrix * mv;
}
`;

const fragmentShader = /* glsl */ `
uniform vec3 uColor;
uniform float uStarColor;
uniform float uBlades;
uniform float uBladeRoundness;
uniform float uRim;
uniform float uFringe;
uniform float uGrain;

varying vec3 vStar;
varying float vSeed;

varying float vIntensity;
varying float vSoft;

float dustHash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float dustNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(dustHash(i), dustHash(i + vec2(1.0, 0.0)), f.x),
    mix(dustHash(i + vec2(0.0, 1.0)), dustHash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

// Distance from the centre measured against the aperture's outline: a polygon
// with uBlades sides (its corners on the circle), rounded towards the circle by
// uBladeRoundness. Every disc has the same rotation, as through one lens.
float apertureDistance(vec2 p) {
  float r = length(p);
  if (uBlades < 3.0) return r;
  float segment = 6.2831853 / uBlades;
  float angle = atan(p.y, p.x) + 0.35;
  float polygon = r * cos(mod(angle, segment) - segment * 0.5) / cos(segment * 0.5);
  return mix(polygon, r, uBladeRoundness);
}

void main() {
  vec2 p = gl_PointCoord - 0.5;
  float d = length(p);

  // In focus: the hover particles' disc, solid to half its radius, then a soft
  // edge that reaches zero at the circle, so no corner of the sprite ever lights.
  float focused = 1.0 - smoothstep(0.25, 0.5, d);

  // Out of focus: the aperture's shape, each colour's edge at a slightly
  // different size (red widest), a brighter rim and a light grain.
  float m = apertureDistance(p);
  vec3 radii = 0.48 - vec3(0.0, 1.0, 2.0) * uFringe;
  vec3 disc = 1.0 - smoothstep(radii - 0.06, radii, vec3(m));
  float rim = 1.0 + uRim * smoothstep(0.2, 0.46, m);
  float grain = 1.0 + uGrain * (dustNoise(p * 10.0 + vSeed * 97.0) * 2.0 - 1.0);
  vec3 bokeh = disc * rim * grain * 0.75;

  vec3 shape = mix(vec3(focused), bokeh, smoothstep(0.15, 0.6, vSoft));
  if (max(shape.r, max(shape.g, shape.b)) * vIntensity < 0.002) discard;
  // Additive blending multiplies the colour by alpha itself.
  gl_FragColor = vec4(mix(uColor, vStar, uStarColor) * shape, vIntensity);
}
`;

// Star colours, hottest to coolest, and how often each turns up. Roughly the
// classic spectral classes (O/B blue through M orange), pushed a little more
// saturated than the real thing so the tint reads against a lit scene. Most
// motes land near white; the strongly coloured ones are rare, as in a sky.
const STAR_COLOURS = [
  ['#8fa8ff', 0.06], // O/B: blue
  ['#bccfff', 0.16], // A: blue-white
  ['#f4f5ff', 0.26], // F: white
  ['#fff1df', 0.24], // G: yellow-white
  ['#ffcf98', 0.18], // K: pale orange
  ['#ffa76b', 0.1] //  M: orange-red
];
const STAR_TOTAL = STAR_COLOURS.reduce((sum, [, weight]) => sum + weight, 0);
const _star = new THREE.Color();
const pickStarColour = () => {
  let roll = Math.random() * STAR_TOTAL;
  for (const [hex, weight] of STAR_COLOURS) {
    roll -= weight;
    if (roll <= 0) return _star.set(hex);
  }
  return _star.set(STAR_COLOURS[STAR_COLOURS.length - 1][0]);
};

// How likely a mote is to be kept at `dist` from the crystal: never inside
// `core`, rarely (`inner`) in the rest of the clearing, `sparse` at its edge,
// rising to every one by `fadeTo`.
const keepChance = (dist, { core = 0, inner = 0, radius, fadeTo, sparse }) => {
  if (dist < core) return 0;
  if (dist < radius) return inner;
  if (dist >= fadeTo) return 1;
  const t = (dist - radius) / Math.max(fadeTo - radius, 1e-3);
  const eased = t * t * (3 - 2 * t);
  return sparse + (1 - sparse) * eased;
};

// Positions fill an ellipsoid around the crystal, thicker towards the middle,
// thinned out around the crystal itself (re-rolled, so the count holds); the
// rest is per-mote randomness for the shader.
const buildGeometry = (count, { center, radii, concentration }, clearing, lightPosition) => {
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count * 4);
  const params = new Float32Array(count * 4);
  const stars = new Float32Array(count * 3);
  const tau = Math.PI * 2;

  const [lx, ly, lz] = lightPosition;
  for (let i = 0; i < count; i++) {
    // A random direction, then a radius biased inwards by `concentration`;
    // again if the clearing turns it down.
    let x = 0;
    let y = 0;
    let z = 0;
    for (let tries = 0; tries < 64; tries++) {
      const u = Math.random() * 2 - 1;
      const theta = Math.random() * tau;
      const s = Math.sqrt(1 - u * u);
      const r = Math.pow(Math.random(), concentration);
      x = center[0] + Math.cos(theta) * s * r * radii[0];
      y = center[1] + u * r * radii[1];
      z = center[2] + Math.sin(theta) * s * r * radii[2];
      const dist = Math.hypot(x - lx, y - ly, z - lz);
      if (!clearing || Math.random() < keepChance(dist, clearing)) break;
    }
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    seeds[i * 4] = Math.random() * tau;
    seeds[i * 4 + 1] = Math.random() * tau;
    seeds[i * 4 + 2] = Math.random() * tau;
    seeds[i * 4 + 3] = Math.random();

    // Mostly small, a few larger specks.
    params[i * 4] = 0.5 + Math.pow(Math.random(), 3) * 1.5;
    params[i * 4 + 1] = 0.6 + Math.random() * 0.8;
    params[i * 4 + 2] = Math.random() * tau;
    // The hover particles' twinkle-rate spread.
    params[i * 4 + 3] = 0.6 + Math.random() * 0.9;

    // THREE.Color takes the hex as sRGB and holds it linear, which is what the
    // shader adds into the scene.
    pickStarColour().toArray(stars, i * 3);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
  geometry.setAttribute('aParams', new THREE.BufferAttribute(params, 4));
  geometry.setAttribute('aStar', new THREE.BufferAttribute(stars, 3));
  // The motes drift a little past their buffer positions; keep them all drawn.
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(...center), Math.max(...radii) + 1);
  return geometry;
};

// Quick off the mark, then a long, smooth settle.
const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);
// How long to wait for the explosion's clock before going on a timer instead.
const RUNTIME_WAIT = 0.25;

const SuspendedDust = ({
  count = 400,
  introRevealRef = null,
  /** True while the crystal is exploded (the overview, projects, About). */
  expanded = false,
  /** The explosion's clock (useHeroOverviewRuntime), which runs on every one. */
  explosionRuntime = null,
  settings = defaults
}) => {
  const { volume, clearing, lightPosition } = settings;
  const geometry = useMemo(
    () => buildGeometry(count, volume, clearing, lightPosition),
    // These are config, not state; rebuild only when their numbers change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count, JSON.stringify([volume, clearing, lightPosition])]
  );

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uDrift: { value: 0 },
          uDriftSpeed: { value: 1 },
          uSize: { value: 0.01 },
          uProj: { value: 1 },
          uFocus: { value: 5 },
          uAperture: { value: 0 },
          uBackBlur: { value: 0.25 },
          uMaxSize: { value: 32 },
          uLightPos: { value: new THREE.Vector3() },
          uLightRadius: { value: 2 },
          uLightGain: { value: 1 },
          uAmbient: { value: 0.1 },
          uScatter: { value: 0 },
          uShimmer: { value: 0 },
          uShimmerSpeed: { value: 9 },
          uMaxBrightness: { value: 1.6 },
          uNearFade: { value: 0.3 },
          uReveal: { value: 1 },
          uExpand: { value: 0 },
          uPush: { value: 0 },
          uPushNear: { value: 0 },
          uPushFar: { value: 1 },
          uPushFalloff: { value: 1 },
          uColor: { value: new THREE.Color() },
          uStarColor: { value: 1 },
          uBlades: { value: 0 },
          uBladeRoundness: { value: 1 },
          uRim: { value: 0 },
          uFringe: { value: 0 },
          uGrain: { value: 0 }
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false
      }),
    []
  );

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useEffect(() => {
    const u = material.uniforms;
    u.uDrift.value = settings.drift;
    u.uDriftSpeed.value = settings.driftSpeed;
    u.uSize.value = settings.size;
    u.uAperture.value = settings.aperture;
    u.uBackBlur.value = settings.backBlur;
    u.uBlades.value = settings.blades;
    u.uBladeRoundness.value = settings.bladeRoundness;
    u.uRim.value = settings.rim;
    u.uFringe.value = settings.fringe;
    u.uGrain.value = settings.grain;
    u.uMaxSize.value = settings.maxSize;
    u.uLightPos.value.fromArray(settings.lightPosition);
    u.uLightRadius.value = settings.lightRadius;
    u.uLightGain.value = settings.lightGain;
    u.uAmbient.value = settings.ambient;
    u.uScatter.value = settings.scatter;
    u.uShimmer.value = settings.shimmer;
    u.uShimmerSpeed.value = settings.shimmerSpeed;
    u.uMaxBrightness.value = settings.maxBrightness;
    u.uNearFade.value = settings.nearFade;
    u.uColor.value.set(settings.color);
    u.uStarColor.value = settings.starColor;
    u.uPush.value = settings.expand.push;
    u.uPushNear.value = settings.expand.near;
    u.uPushFar.value = settings.expand.far;
    u.uPushFalloff.value = settings.expand.falloff;
  }, [material, settings]);

  // The expansion's timing:
  //   • out (the crystal explodes): held through the fracture's charge, then
  //     eased out over the rest of the explosion's clock, so the dust leaves with
  //     the blast. Without the clock (it never started), a timer (`outTime`).
  //   • in (the crystal re-forms): from that instant, on its own ease (`inTime`),
  //     and never behind the camera on its way back: whichever of the two is
  //     further along, the camera's share being how much of the way it has come
  //     from where it turned to where it stood in the hero.
  // Each only ever moves one way, so a project's close-up camera can't draw the
  // dust back in. Starts settled on whatever the scene opens on.
  const motionRef = useRef(null);
  if (motionRef.current === null) {
    motionRef.current = {
      value: expanded ? 1 : 0,
      expanded,
      from: 0,
      k: 1,
      elapsed: 0,
      clockSeen: false,
      heroDistance: null,
      turnDistance: null
    };
  }

  useFrame((state, delta) => {
    const u = material.uniforms;
    const { camera, size, gl } = state;
    u.uTime.value = (u.uTime.value + Math.min(delta, 1)) % 10000;
    // Pixels per world unit at a depth of one.
    const fov = THREE.MathUtils.degToRad(camera.fov ?? 45);
    u.uProj.value = (size.height * gl.getPixelRatio()) / (2 * Math.tan(fov / 2));
    // In focus at the crystal, wherever the camera is.
    u.uFocus.value = Math.max(camera.position.distanceTo(u.uLightPos.value), 0.5);
    u.uReveal.value = introRevealRef?.current ?? 1;

    const motion = motionRef.current;
    const { outTime, inTime } = settings.expand;
    const distance = camera.position.distanceTo(u.uLightPos.value);
    const dt = Math.min(delta, 1);
    if (motion.expanded !== expanded) {
      motion.expanded = expanded;
      motion.from = motion.value;
      motion.k = 0;
      motion.elapsed = 0;
      motion.clockSeen = false;
      // Out: the camera is still where the hero holds it. In: where it turns.
      if (expanded) motion.heroDistance = distance;
      else motion.turnDistance = distance;
    }
    motion.elapsed += dt;

    if (motion.expanded) {
      const clock = explosionRuntime?.getSnapshot?.();
      if (clock && (clock.active || clock.phase === 'complete')) motion.clockSeen = true;
      let target;
      if (motion.clockSeen) {
        const blastStart = clock.timing.fractureChargeEnd;
        target = clock.active ? (clock.progress - blastStart) / Math.max(1 - blastStart, 1e-3) : 1;
      } else {
        target = (motion.elapsed - RUNTIME_WAIT) / Math.max(outTime, 1e-3);
      }
      motion.k = Math.min(Math.max(motion.k, target), 1);
      motion.value = motion.from + (1 - motion.from) * easeOutQuart(motion.k);
    } else {
      const timed = easeOutQuart(Math.min(motion.elapsed / Math.max(inTime, 1e-3), 1));
      const span = (motion.turnDistance ?? 0) - (motion.heroDistance ?? Infinity);
      const camera = span > 0.25 ? (motion.turnDistance - distance) / span : 0;
      motion.k = Math.min(Math.max(motion.k, timed, camera), 1);
      motion.value = motion.from * (1 - motion.k);
    }
    u.uExpand.value = motion.value;
  });

  return <points geometry={geometry} material={material} renderOrder={5} />;
};

export default SuspendedDust;
