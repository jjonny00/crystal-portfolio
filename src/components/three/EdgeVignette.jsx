import { forwardRef, useEffect, useLayoutEffect, useMemo } from 'react';
import { Color, Uniform, Vector2 } from 'three';
import { Effect } from 'postprocessing';
import { postProcessing } from '../../crystalConfig';

// A vignette that can brighten the frame edges as well as darken them. Stands in
// for postprocessing's Vignette, which only multiplies by <= 1 and so can only
// darken. It merges into the same EffectPass as the other simple effects, so it
// costs a handful of ALU ops per pixel and no extra pass.
//
// strength   signed: < 0 darkens the edges, > 0 brightens them
// radius     distance from the centre where the falloff starts
// softness   width of the falloff past `radius`
// wash       0 multiplies (keeps contrast, darks stay dark); 1 blends toward
//            `tint` (the milky, Eskil-style wash); values between mix the two
// tint       colour the edges brighten toward (darkening always heads to black)
// roundness  0 stretches with the frame, like the stock vignette; 1 is circular,
//            measured against the frame's shorter side
// center     falloff centre, in UV space
//
// `aspect` is one of the uniforms postprocessing provides to every effect.
const fragmentShader = /* glsl */ `
uniform float strength;
uniform float radius;
uniform float softness;
uniform float wash;
uniform vec3 tint;
uniform float roundness;
uniform vec2 center;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 frame = aspect >= 1.0 ? vec2(aspect, 1.0) : vec2(1.0, 1.0 / aspect);
  vec2 p = (uv - center) * mix(vec2(1.0), frame, roundness);
  float mask = smoothstep(radius, radius + max(softness, 1e-4), length(p));
  float amount = strength * mask;
  bool brighten = amount >= 0.0;

  vec3 multiplied = inputColor.rgb * max(vec3(1.0) + amount * (brighten ? tint : vec3(1.0)), 0.0);
  vec3 washed = mix(inputColor.rgb, brighten ? tint : vec3(0.0), clamp(abs(amount), 0.0, 1.0));

  outputColor = vec4(mix(multiplied, washed, wash), inputColor.a);
}
`;

class EdgeVignetteEffect extends Effect {
  constructor() {
    super('EdgeVignetteEffect', fragmentShader, {
      uniforms: new Map([
        ['strength', new Uniform(0)],
        ['radius', new Uniform(0)],
        ['softness', new Uniform(1)],
        ['wash', new Uniform(0)],
        ['tint', new Uniform(new Color('#ffffff'))],
        ['roundness', new Uniform(0)],
        ['center', new Uniform(new Vector2(0.5, 0.5))]
      ])
    });
  }
}

const defaults = postProcessing.vignette;

// The effect is built once and only its uniforms change, so dragging a slider
// never recompiles the composer's shader (the stock wrapEffect components
// rebuild the effect whenever a prop changes).
const EdgeVignette = forwardRef(function EdgeVignette(
  {
    strength = defaults.strength,
    radius = defaults.radius,
    softness = defaults.softness,
    wash = defaults.wash,
    tint = defaults.tint,
    roundness = defaults.roundness,
    center = defaults.center
  },
  ref
) {
  const effect = useMemo(() => new EdgeVignetteEffect(), []);

  useEffect(() => () => effect.dispose(), [effect]);

  useLayoutEffect(() => {
    const { uniforms } = effect;
    uniforms.get('strength').value = strength;
    uniforms.get('radius').value = radius;
    uniforms.get('softness').value = softness;
    uniforms.get('wash').value = wash;
    uniforms.get('tint').value.set(tint);
    uniforms.get('roundness').value = roundness;
    uniforms.get('center').value.set(center[0], center[1]);
  }, [effect, strength, radius, softness, wash, tint, roundness, center]);

  return <primitive ref={ref} object={effect} dispose={null} />;
});

export default EdgeVignette;
