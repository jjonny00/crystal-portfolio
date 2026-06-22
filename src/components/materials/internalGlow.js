// internalGlow.js - Fresnel-driven internal emissive glow injection
//
// Adds a view-facing fresnel emissive term to an existing crystal material via
// onBeforeCompile, WITHOUT swapping the material. The contribution is additive
// to totalEmissiveRadiance and uses its OWN uniforms (uGlowColor / uGlowIntensity
// / uFresnelPower / uGlowBias), so it stays fully independent of the built-in
// `emissive` + `emissiveIntensity` that UnifiedCrystalScene animates during
// explosion/reform/fade. That separation is what keeps control-panel edits from
// causing the known material-blackout (which comes from zeroing material.emissive).
//
// The glow is strongest toward the center of each face (view-facing, facing≈1)
// and falls off toward grazing edges, reading as an internal core glow while
// edges stay crisp and transmissive.
//
// Works for MeshPhysicalMaterial (high/medium) and MeshPhongMaterial (low) — both
// expose `vViewPosition`, `normal`, and `totalEmissiveRadiance` via the
// <emissivemap_fragment> chunk (three r160).

import * as THREE from 'three';

const PROGRAM_CACHE_KEY = 'internalGlow-v1';

// All facet clones share identical material parameters, so they can share ONE
// program key: each binds its own uniforms but reuses the same compiled program,
// avoiding a GLSL recompile every time facets are re-cloned (focus/navigation).
export const FACET_GLOW_PROGRAM_KEY = 'internalGlow-facet';

// Per-material unique program-key counter. three only runs a material's
// onBeforeCompile (and binds its custom uniforms) the first time that material
// compiles a given program-cache key. A SHARED constant key lets a material reuse
// a cached program entry without ever running its own onBeforeCompile, leaving its
// glow uniforms unbound. A unique key per material guarantees each one compiles
// (and binds) its own glow uniforms.
let glowMaterialCounter = 0;

const GLOW_UNIFORM_DECLARATIONS = /* glsl */`
uniform vec3 uGlowColor;
uniform float uGlowIntensity;
uniform float uFresnelPower;
uniform float uGlowBias;
`;

// Injected right after the emissive chunk, where `normal` and `vViewPosition`
// are both defined. Additive so it coexists with the built-in emissive animation
// and survives the `emissive.set(0,0,0)` fracture resets.
const GLOW_EMISSIVE_INJECTION = /* glsl */`
#include <emissivemap_fragment>
{
  float glowFacing = clamp(dot(normalize(vViewPosition), normal), 0.0, 1.0);
  float coreGlow = pow(clamp(glowFacing + uGlowBias, 0.0, 1.0), uFresnelPower);
  totalEmissiveRadiance += uGlowColor * coreGlow * uGlowIntensity;
}
`;

const toColor = (color) =>
  color instanceof THREE.Color ? color.clone() : new THREE.Color(color);

/**
 * Attach the fresnel internal-glow injection to a material.
 *
 * Installs a FRESH per-material uniform set and an onBeforeCompile that closes
 * over THIS material, so it is safe on a clone (which drops onBeforeCompile while
 * possibly keeping userData). Each material still binds its OWN uniforms via its
 * own onBeforeCompile run.
 *
 * Program key strategy (matters for perf):
 * - Pass a shared `programKey` for a set of materials with identical parameters
 *   (e.g. all facet clones). They reuse ONE cached program (no GLSL recompile per
 *   clone) while each still binds its own uniforms — the cheap, correct path.
 * - Omit `programKey` for a singleton material (e.g. the whole crystal): it reuses
 *   any key already stored on the material, otherwise gets a fresh unique key.
 *   Combined with attach-once (see callers), it compiles exactly one time.
 */
export const attachInternalGlow = (
  material,
  { color = '#6AFFEE', emissiveIntensity = 0, fresnelPower = 2.5, glowBias = 0, programKey } = {}
) => {
  if (!material) return material;

  const glowUniforms = {
    uGlowColor: { value: toColor(color) },
    uGlowIntensity: { value: emissiveIntensity },
    uFresnelPower: { value: fresnelPower },
    uGlowBias: { value: glowBias },
  };

  // Prefer an explicit shared key, then any key already on the material, else mint
  // a new unique one. Reusing keys lets three's global program cache avoid recompiles.
  const resolvedKey =
    programKey ?? material.userData?.__glowProgramKey ?? `${PROGRAM_CACHE_KEY}-${++glowMaterialCounter}`;

  material.userData = {
    ...(material.userData || {}),
    glowUniforms,
    __glowProgramKey: resolvedKey,
  };

  const onBeforeCompile = (shader) => {
    // Re-wire the persistent uniform objects into this (re)compiled program so
    // value mutations continue to take effect after recompiles.
    Object.assign(shader.uniforms, material.userData.glowUniforms);

    shader.fragmentShader =
      GLOW_UNIFORM_DECLARATIONS + shader.fragmentShader;

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      GLOW_EMISSIVE_INJECTION
    );
  };
  // Tag so we can detect whether a material still carries OUR injection (a
  // Material.copy()/clone can drop onBeforeCompile while keeping userData).
  onBeforeCompile.__internalGlow = true;
  material.onBeforeCompile = onBeforeCompile;
  material.customProgramCacheKey = () => material.userData.__glowProgramKey;

  // Trigger compile so onBeforeCompile runs and the injection takes effect.
  material.needsUpdate = true;

  return material;
};

/**
 * True only when `material` still carries OUR live glow injection (uniforms AND
 * the tagged onBeforeCompile). Use this to decide attach-vs-update so a material
 * that lost its onBeforeCompile (e.g. via clone/copy) gets re-attached.
 */
export const hasInternalGlow = (material) =>
  Boolean(material?.userData?.glowUniforms && material?.onBeforeCompile?.__internalGlow);

/**
 * Mutate glow uniform values in place. Never sets needsUpdate and never touches
 * material.emissive — so control-panel / tier updates can't blackout the
 * material or fight the built-in emissive animation.
 */
export const updateInternalGlow = (
  material,
  { emissiveIntensity, fresnelPower, glowBias, color } = {}
) => {
  const glowUniforms = material?.userData?.glowUniforms;
  if (!glowUniforms) return material;

  if (typeof emissiveIntensity === 'number') {
    glowUniforms.uGlowIntensity.value = emissiveIntensity;
  }
  if (typeof fresnelPower === 'number') {
    glowUniforms.uFresnelPower.value = fresnelPower;
  }
  if (typeof glowBias === 'number') {
    glowUniforms.uGlowBias.value = glowBias;
  }
  if (color !== undefined && color !== null) {
    if (color instanceof THREE.Color) {
      glowUniforms.uGlowColor.value.copy(color);
    } else {
      glowUniforms.uGlowColor.value.set(color);
    }
  }

  return material;
};

export const INTERNAL_GLOW_PROGRAM_CACHE_KEY = PROGRAM_CACHE_KEY;
