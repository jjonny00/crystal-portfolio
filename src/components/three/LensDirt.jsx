import { forwardRef, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  ShaderMaterial,
  TextureLoader,
  Uniform,
  UnsignedByteType,
  Vector2,
  WebGLRenderTarget
} from 'three';
import { Effect, ShaderPass } from 'postprocessing';
import { postProcessing } from '../../crystalConfig';
import { LENS_DIRT_LANDSCAPE_TEXTURE, LENS_DIRT_PORTRAIT_TEXTURE } from '../../config/assetPaths';

// Lens dirt that flares where bright light reaches it (and can be left faintly
// there at rest with `rest`). A real lens's dirt catches whatever light falls near
// it; the crystal's highlights move across it as the camera orbits.
//
// How it works, per frame, before the composite:
//   1. The frame's bright parts (above `brightThreshold`) are averaged down to
//      1/4 size, then halved five more times. The 1/16 level is the light near a
//      point; the 1/128 level, blurred once more, is the light from further off
//      (`reach` weights it in).
//   2. At 1/32 size that light is followed by two moving averages: a quick one
//      (`fadeTime`) that eases patches in and out, and a slow one (`adaptTime`)
//      of its brightness, the light that has been there a while.
//   3. The composite lights the dirt by the quick light, less `adaptation` × the
//      slow one, through a soft curve (`sensitivity`), on top of a resting level
//      (`rest`). A slow noise (`shimmer`) twinkles both.
// So the dirt answers light that is there, and new light a little more, but
// steady light never makes it vanish. All of it runs on buffers of a few hundred
// pixels or less; the composite adds three texture reads and a little noise to
// the pass the vignette and noise already share.
//
// The dirt map is fixed to the screen. Of the two masks, the one whose shape is
// closer to the viewport's is fitted inside it at its own aspect, and any
// leftover room is opened up across the middle: each half of the mask stays
// against its own edge, so the mask is never stretched, never cropped, and the
// centre only gets clearer. `seamWidth` fades the mask out towards that gap.
//
// The page's text is DOM above the canvas, so none of this reaches it.

const LUMA = 'vec3(0.2126, 0.7152, 0.0722)';

const fullscreenVertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

// Four bilinear taps one input texel out on each diagonal: an exact 4×4 box for
// the first (quarter-size) level, a 4×4 tent for each halving after it, so a
// small highlight is never skipped between samples. The first level also keeps
// only what is above the threshold, per tap.
const downsampleShader = /* glsl */ `
uniform sampler2D inputBuffer;
uniform vec2 texelSize;
uniform float threshold;
varying vec2 vUv;

vec3 bright(vec3 c) {
  if (threshold < 0.0) return c;
  float l = dot(c, ${LUMA});
  return c * (max(l - threshold, 0.0) / max(l, 1e-4));
}

void main() {
  vec3 c = bright(texture2D(inputBuffer, vUv + texelSize * vec2(-1.0, -1.0)).rgb)
    + bright(texture2D(inputBuffer, vUv + texelSize * vec2(1.0, -1.0)).rgb)
    + bright(texture2D(inputBuffer, vUv + texelSize * vec2(-1.0, 1.0)).rgb)
    + bright(texture2D(inputBuffer, vUv + texelSize * vec2(1.0, 1.0)).rgb);
  gl_FragColor = vec4(c * 0.25, 1.0);
}
`;

// State: rgb = the light, smoothed quickly; a = its brightness, averaged slowly.
// An 8-bit buffer (the iOS 26 path) can't hold the slow average's tiny per-frame
// steps, so there each step is at least one 8-bit level.
const temporalShader = /* glsl */ `
uniform sampler2D inputBuffer;
uniform sampler2D localLight;
uniform sampler2D wideLight;
uniform vec2 wideTexel;
uniform float reach;
uniform float fastBlend;
uniform float slowBlend;
varying vec2 vUv;

void main() {
  vec3 wide = texture2D(wideLight, vUv).rgb * 2.0
    + texture2D(wideLight, vUv + wideTexel * vec2(1.5, 0.0)).rgb
    + texture2D(wideLight, vUv - wideTexel * vec2(1.5, 0.0)).rgb
    + texture2D(wideLight, vUv + wideTexel * vec2(0.0, 1.5)).rgb
    + texture2D(wideLight, vUv - wideTexel * vec2(0.0, 1.5)).rgb;
  vec3 light = texture2D(localLight, vUv).rgb + wide * (reach / 6.0);

  vec4 previous = texture2D(inputBuffer, vUv);
  vec3 fast = mix(previous.rgb, light, fastBlend);
  float target = dot(light, ${LUMA});
  float slow = mix(previous.a, target, slowBlend);
#ifdef LOW_PRECISION
  float gap = target - previous.a;
  if (abs(gap) > 0.5 / 255.0) {
    slow = previous.a + sign(gap) * min(abs(gap), max(abs(slow - previous.a), 1.0 / 255.0));
  }
  fast = clamp(fast, 0.0, 1.0);
  slow = clamp(slow, 0.0, 1.0);
#endif
  gl_FragColor = vec4(fast, slow);
}
`;

// `aspect` is one of the uniforms postprocessing provides to every effect.
const fragmentShader = /* glsl */ `
uniform sampler2D dirtMap;
uniform sampler2D lightState;
uniform vec2 dirtExtent;
uniform float dirtLod;
uniform float softFocus;
uniform float seamWidth;
uniform float intensity;
uniform float rest;
uniform float sensitivity;
uniform float adaptation;
uniform float shimmer;
uniform float shimmerTime;
uniform float tint;
uniform float debugView;

float dirtHash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float dirtNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(dirtHash(i), dirtHash(i + vec2(1.0, 0.0)), f.x),
    mix(dirtHash(i + vec2(0.0, 1.0)), dirtHash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  // The viewport in mask units (the mask is 1×1), and how far past the mask it
  // reaches on each side. Each half of the mask is pinned to its own edge.
  vec2 d = (uv - 0.5) * dirtExtent;
  vec2 slack = (dirtExtent - 1.0) * 0.5;
  vec2 into = abs(d) - slack;
  vec2 seam = mix(vec2(1.0), smoothstep(0.0, seamWidth, into), step(1e-4, slack));
  // Soft focus reads a blurrier mip, counted from the one this screen would
  // pick anyway, so the softening looks the same at any size.
  float dirt = textureLod(dirtMap, 0.5 + sign(d) * max(into, 0.0), dirtLod + softFocus).r * seam.x * seam.y;

  vec4 state = texture2D(lightState, uv);
  float light = dot(state.rgb, ${LUMA});
  float flare = 1.0 - exp(-max(light - state.a * adaptation, 0.0) * sensitivity);
  vec3 hue = state.rgb / max(max(state.r, max(state.g, state.b)), 1e-4);

  // Two layers of patch-sized noise drifting past each other. Mean 1, so it only
  // twinkles the dirt and never dims it overall.
  vec2 p = uv * vec2(aspect, 1.0) * 9.0;
  float n = 0.5 * (dirtNoise(p + shimmerTime * vec2(0.13, 0.07))
    + dirtNoise(p * 1.7 - shimmerTime * vec2(0.09, 0.16)));
  float twinkle = mix(1.0, 2.0 * n, shimmer);

  vec3 glow = dirt * intensity * twinkle * (rest + flare * mix(vec3(1.0), hue, tint));

  outputColor = vec4(inputColor.rgb + glow, inputColor.a);
  if (debugView > 0.5) {
    outputColor.rgb = inputColor.rgb * 0.3 + vec3(flare * 0.8, dirt * 0.6, 0.0) + glow;
  }
}
`;

const LEVELS = 6; // 1/4 … 1/128
const LOCAL_LEVEL = 2; // 1/16
const STATE_LEVEL = 3; // 1/32

const makeTarget = () => new WebGLRenderTarget(1, 1, { depthBuffer: false });

class LensDirtEffect extends Effect {
  constructor() {
    super('LensDirtEffect', fragmentShader, {
      uniforms: new Map([
        ['dirtMap', new Uniform(null)],
        ['lightState', new Uniform(null)],
        ['dirtExtent', new Uniform(new Vector2(1, 1))],
        ['dirtLod', new Uniform(0)],
        ['softFocus', new Uniform(0)],
        ['seamWidth', new Uniform(0.12)],
        ['intensity', new Uniform(0)],
        ['rest', new Uniform(0)],
        ['sensitivity', new Uniform(1)],
        ['adaptation', new Uniform(0)],
        ['shimmer', new Uniform(0)],
        ['shimmerTime', new Uniform(0)],
        ['tint', new Uniform(0.5)],
        ['debugView', new Uniform(0)]
      ])
    });

    this.levels = Array.from({ length: LEVELS }, makeTarget);
    this.states = [makeTarget(), makeTarget()];

    this.downsampleMaterial = new ShaderMaterial({
      uniforms: {
        inputBuffer: { value: null },
        texelSize: { value: new Vector2() },
        threshold: { value: 1 }
      },
      vertexShader: fullscreenVertexShader,
      fragmentShader: downsampleShader,
      depthTest: false,
      depthWrite: false,
      toneMapped: false
    });
    this.temporalMaterial = new ShaderMaterial({
      uniforms: {
        inputBuffer: { value: null },
        localLight: { value: this.levels[LOCAL_LEVEL].texture },
        wideLight: { value: this.levels[LEVELS - 1].texture },
        wideTexel: { value: new Vector2() },
        reach: { value: 0 },
        fastBlend: { value: 1 },
        slowBlend: { value: 1 }
      },
      // Matches the buffers' default 8-bit type until initialize() says otherwise.
      defines: { LOW_PRECISION: '1' },
      vertexShader: fullscreenVertexShader,
      fragmentShader: temporalShader,
      depthTest: false,
      depthWrite: false,
      toneMapped: false
    });
    this.downsamplePass = new ShaderPass(this.downsampleMaterial);
    this.temporalPass = new ShaderPass(this.temporalMaterial);

    // Written by the component; read in update().
    this.brightThreshold = 1;
    this.fadeTime = 0.2;
    this.adaptTime = 1.5;
    this.hold = false;

    this.masks = { landscape: null, portrait: null };
    this.size = new Vector2();
    this.needsReset = true;
  }

  setMasks(landscape, portrait) {
    this.masks.landscape = landscape;
    this.masks.portrait = portrait;
    this.fitMask();
  }

  // Picks the mask nearer the viewport's shape and fits it inside the viewport.
  fitMask() {
    const { landscape, portrait } = this.masks;
    const { x: width, y: height } = this.size;
    if (!landscape?.image || !portrait?.image || !width || !height) return;

    const aspectOf = (texture) => texture.image.width / texture.image.height;
    const viewAspect = width / height;
    const mask = viewAspect < Math.sqrt(aspectOf(landscape) * aspectOf(portrait)) ? portrait : landscape;
    const ratio = viewAspect / aspectOf(mask);

    const extent = this.uniforms.get('dirtExtent').value.set(Math.max(ratio, 1), Math.max(1 / ratio, 1));
    this.uniforms.get('dirtMap').value = mask;
    // The mip a plain lookup would choose: mask texels per screen pixel.
    const texelsPerPixel = Math.max(
      (mask.image.width * extent.x) / width,
      (mask.image.height * extent.y) / height
    );
    this.uniforms.get('dirtLod').value = Math.max(Math.log2(texelsPerPixel), 0);
  }

  resize(width, height) {
    this.size.set(width, height);
    let w = Math.max(1, Math.ceil(width / 4));
    let h = Math.max(1, Math.ceil(height / 4));
    this.levels.forEach((target, i) => {
      if (i > 0) {
        w = Math.max(1, Math.ceil(w / 2));
        h = Math.max(1, Math.ceil(h / 2));
      }
      target.setSize(w, h);
    });
    const stateLevel = this.levels[STATE_LEVEL];
    this.states.forEach((target) => target.setSize(stateLevel.width, stateLevel.height));
    const wide = this.levels[LEVELS - 1];
    this.temporalMaterial.uniforms.wideTexel.value.set(1 / wide.width, 1 / wide.height);
    this.needsReset = true;
    this.fitMask();
  }

  // The composer rebuilds its EffectPass, and calls this again, whenever the
  // canvas re-renders, so only a real change of buffer type may drop the
  // buffers (and with them the light's history).
  initialize(renderer, alpha, frameBufferType) {
    if (frameBufferType === undefined || frameBufferType === this.states[0].texture.type) return;
    for (const target of [...this.levels, ...this.states]) {
      target.texture.type = frameBufferType;
      target.dispose();
    }
    this.needsReset = true;
    if (frameBufferType === UnsignedByteType) {
      this.temporalMaterial.defines.LOW_PRECISION = '1';
    } else {
      delete this.temporalMaterial.defines.LOW_PRECISION;
    }
    this.temporalMaterial.needsUpdate = true;
  }

  update(renderer, inputBuffer, deltaTime = 0) {
    if (inputBuffer.width !== this.size.x || inputBuffer.height !== this.size.y) {
      this.resize(inputBuffer.width, inputBuffer.height);
    }

    const { uniforms } = this.downsampleMaterial;
    let previous = inputBuffer;
    this.levels.forEach((target, i) => {
      uniforms.texelSize.value.set(1 / previous.width, 1 / previous.height);
      uniforms.threshold.value = i === 0 ? this.brightThreshold : -1;
      this.downsamplePass.render(renderer, previous, target);
      previous = target;
    });

    // A frozen canvas can hand over one frame with a huge delta; it just
    // settles both averages, which is what a long gap should do anyway. While
    // held, both follow the light exactly, so nothing counts as new.
    const dt = Math.min(Math.max(deltaTime, 0), 1);
    const settle = this.needsReset || this.hold;
    const temporal = this.temporalMaterial.uniforms;
    temporal.fastBlend.value = settle ? 1 : 1 - Math.exp(-dt / Math.max(this.fadeTime, 1e-3));
    temporal.slowBlend.value = settle ? 1 : 1 - Math.exp(-dt / Math.max(this.adaptTime, 1e-3));
    this.needsReset = false;

    const [read, write] = this.states;
    this.temporalPass.render(renderer, read, write);
    this.states = [write, read];
    this.uniforms.get('lightState').value = write.texture;
  }

  dispose() {
    super.dispose();
    for (const target of [...this.levels, ...this.states]) target.dispose();
    this.downsampleMaterial.dispose();
    this.temporalMaterial.dispose();
    this.downsamplePass.dispose();
    this.temporalPass.dispose();
  }
}

// 0 → 1 → 0 across the hero→overview explosion: up through the impulse, held
// through the bullet time, back down while the overview settles.
const smoothstep = (a, b, x) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};
const transitionEnvelope = (snapshot) => {
  if (!snapshot?.active) return 0;
  const { progress, timing } = snapshot;
  return smoothstep(0, timing.explosionImpulseEnd, progress)
    * (1 - smoothstep(timing.bulletTimeSlowdownEnd, 1, progress));
};

const defaults = postProcessing.lensDirt;

// Like EdgeVignette, the effect is built once and only its uniforms change, so
// tuning never recompiles the composer's shader.
const LensDirt = forwardRef(function LensDirt(
  {
    intensity = defaults.intensity,
    rest = defaults.rest,
    overviewRest = defaults.overviewRest,
    softFocus = defaults.softFocus,
    sensitivity = defaults.sensitivity,
    adaptation = defaults.adaptation,
    shimmer = defaults.shimmer,
    adaptTime = defaults.adaptTime,
    fadeTime = defaults.fadeTime,
    brightThreshold = defaults.brightThreshold,
    reach = defaults.reach,
    tint = defaults.tint,
    seamWidth = defaults.seamWidth,
    transitionBoost = defaults.transitionBoost,
    debugView = false,
    runtime = null,
    introRevealRef = null,
    inOverview = false
  },
  ref
) {
  const effect = useMemo(() => new LensDirtEffect(), []);

  useEffect(() => () => effect.dispose(), [effect]);

  // Loaded after the scene is up rather than by the loader: the dirt is unseen
  // at rest, so nothing is lost if it arrives a moment late. The masks are
  // coverage, not colour, so they're read as stored; an sRGB decode would crush
  // their soft blobs.
  useEffect(() => {
    let cancelled = false;
    const loader = new TextureLoader();
    Promise.all([
      loader.loadAsync(LENS_DIRT_LANDSCAPE_TEXTURE),
      loader.loadAsync(LENS_DIRT_PORTRAIT_TEXTURE)
    ])
      .then((textures) => {
        if (cancelled) {
          textures.forEach((texture) => texture.dispose());
          return;
        }
        effect.setMasks(...textures);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      effect.masks.landscape?.dispose();
      effect.masks.portrait?.dispose();
    };
  }, [effect]);

  useLayoutEffect(() => {
    const { uniforms } = effect;
    uniforms.get('softFocus').value = Math.max(softFocus, 0);
    uniforms.get('shimmer').value = shimmer;
    uniforms.get('tint').value = tint;
    uniforms.get('seamWidth').value = Math.max(seamWidth, 1e-4);
    uniforms.get('debugView').value = debugView ? 1 : 0;
    effect.temporalMaterial.uniforms.reach.value = reach;
    effect.brightThreshold = brightThreshold;
    effect.adaptTime = adaptTime;
    effect.fadeTime = fadeTime;
  }, [effect, softFocus, shimmer, tint, seamWidth, debugView, reach, brightThreshold, adaptTime, fadeTime]);

  // The explosion into Work lets the dirt show stronger: more intensity, more
  // sensitivity, and none of the steady light discounted. Eased, so scrolling
  // back to the hero mid-explosion doesn't cut it off.
  //
  // The scene fading up in the intro isn't light arriving, so the dirt's history
  // is held level with the light until the reveal finishes.
  //
  // The overview is bright all over with its ambient glow, so there the dirt
  // rests at `overviewRest` across the whole mask; it eases there on the way in
  // and back to `rest` on the way out.
  const boostRef = useRef(0);
  const restRef = useRef(rest);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 1);
    effect.hold = (introRevealRef?.current ?? 1) < 1;
    const target = transitionEnvelope(runtime?.getSnapshot?.());
    boostRef.current += (target - boostRef.current) * (1 - Math.exp(-dt / 0.2));
    restRef.current += ((inOverview ? overviewRest : rest) - restRef.current) * (1 - Math.exp(-dt / 0.5));
    const b = boostRef.current;
    const { uniforms } = effect;
    uniforms.get('rest').value = restRef.current;
    uniforms.get('intensity').value = intensity * (1 + transitionBoost * b);
    uniforms.get('sensitivity').value = sensitivity * (1 + b);
    uniforms.get('adaptation').value = adaptation * (1 - b);
    // Wrapped long before float precision suffers; the jump lands on a fresh
    // patch of noise, which at this speed reads as one more slow twinkle.
    const shimmerTime = uniforms.get('shimmerTime');
    shimmerTime.value = (shimmerTime.value + dt) % 1000;
  });

  return <primitive ref={ref} object={effect} dispose={null} />;
});

export default LensDirt;
