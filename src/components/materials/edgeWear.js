// edgeWear.js — beveled-edge wear driven by the Blender `edgeWear` vertex mask.
//
// The crystal GLB ships a COLOR_0 attribute (three exposes it as
// `geometry.attributes.color`) where the large facets are 0 and the thin beveled
// edge faces are 1. This module uses that mask to make the bevels read as slightly
// worn/frosted, by shifting only two PBR inputs on the EXISTING crystal material:
//
//   roughness    += roughnessBoost      * wear   (frosted micro-surface)
//   transmission *= 1 - transmissionRed * wear   (less see-through at the edge)
//   totalEmissiveRadiance += brightnessColor * brightness * wear   (additive glow)
//
// The first two are surface properties and read as physical wear. The third is light
// ADDED to the edge — it will look painted on rather than material, and it feeds the
// bloom pass; `brightness: 0` disables it and is numerically a no-op.
//
// Everything else is untouched: no drawn edge lines, no extra geometry/textures/
// materials/draw calls, no normal-map or env-map changes. Raising roughness also
// blurs the refraction through those bevels,
// because three feeds `material.roughness` into getIBLVolumeRefraction — that
// coupling is the whole point, and is what makes the wear read as physical rather
// than painted on.
//
// Injection, not replacement: this is an onBeforeCompile patch over the existing
// MeshPhysicalMaterial, and it CHAINS to whatever onBeforeCompile is already there
// (the fresnel internalGlow injection), rather than overwriting it.
//
// Reading the mask without tinting the crystal
// --------------------------------------------
// `material.vertexColors` stays FALSE. Setting it would make three multiply the
// mask into diffuseColor (and, for a VEC4 COLOR_0, into alpha), turning the bevels
// white — exactly the "draw white lines on the edges" result we don't want. So the
// vertex shader declares `attribute vec4 color` itself, guarded by the same defines
// three uses, and forwards only the red channel as a float varying.
//
// Soft falloff onto neighbouring facets (aEdgeDist)
// -------------------------------------------------
// The authored mask is binary AND constant per triangle (Blender splits the verts
// at the bevel boundary), so it carries no distance information: smoothstep on it
// is a no-op, and `fwidth()` of it is identically ZERO — GLSL derivatives are taken
// within a single primitive, so they never see the neighbouring triangle's value.
//
// The falloff therefore comes from one precomputed vertex attribute, `aEdgeDist`,
// built once at load by buildEdgeDistanceAttribute(). For a triangle with
// barycentric coords b and per-edge heights h_k = 2*Area/|edge_k|, the perpendicular
// distance from an interior point to edge k is exactly b_k * h_k. Both b_k and h_k
// interpolate linearly, so we store the PRODUCT per vertex and let the rasteriser
// interpolate it — no barycentric attribute and no per-triangle uniforms needed.
//
// Only edges shared with a MASKED BEVEL triangle emit wear; every other edge is
// encoded as "infinitely far", so flat triangulation seams inside a facet never
// light up. The mask stays authoritative for WHERE wear originates — topology only
// supplies HOW FAR.

import * as THREE from 'three';

// Attach state lives here rather than in material.userData because Material.copy()
// JSON-round-trips userData — a clone would inherit dead uniform objects and a
// bogus "already attached" signal. A WeakMap keeps clones genuinely clean.
const attachState = new WeakMap();

let edgeWearCounter = 0;

const toColor = (color) =>
  color instanceof THREE.Color ? color.clone() : new THREE.Color(color);

// Encodes "this edge never generates wear". Any value far larger than the model's
// extent works; it is compared against real object-space distances.
const FAR_EDGE = 1e3;

// ---------------------------------------------------------------------------
// Geometry preprocessing
// ---------------------------------------------------------------------------

/**
 * Build the `aEdgeDist` attribute for one non-indexed geometry.
 *
 * Per vertex k of each triangle, component k holds that vertex's height h_k over
 * the opposite edge (and 0 in the other two components), so the interpolated value
 * is (b0*h0, b1*h1, b2*h2) — the three true perpendicular distances to the edges.
 *
 * Edges NOT adjacent to a bevel triangle are written as FAR_EDGE in all three
 * corners, so that component interpolates to FAR_EDGE across the whole triangle and
 * can never win the min(). Writing FAR_EDGE only at one corner would be wrong: it
 * would interpolate down to 0 along the opposite edge and produce wear there.
 *
 * Returns null when the geometry can't host per-triangle data (indexed, or missing
 * position/color), leaving the caller to fall back to the hard mask.
 */
export const buildEdgeDistanceAttribute = (geometry) => {
  const position = geometry?.attributes?.position;
  const color = geometry?.attributes?.color;
  if (!position || !color || geometry.index) return null;
  if (position.count % 3 !== 0) return null;

  const triCount = position.count / 3;

  // Weld by quantised position: the exported verts are fully split (336 raw verts
  // for 82 unique positions), so adjacency is only recoverable after welding.
  const welded = new Map();
  const weldId = new Int32Array(position.count);
  for (let i = 0; i < position.count; i += 1) {
    const key =
      `${Math.round(position.getX(i) * 1e5)},` +
      `${Math.round(position.getY(i) * 1e5)},` +
      `${Math.round(position.getZ(i) * 1e5)}`;
    let id = welded.get(key);
    if (id === undefined) {
      id = welded.size;
      welded.set(key, id);
    }
    weldId[i] = id;
  }

  // Mask is constant per triangle, so one sample per triangle is enough.
  const triMask = new Uint8Array(triCount);
  for (let t = 0; t < triCount; t += 1) {
    triMask[t] = color.getX(t * 3) > 0.5 ? 1 : 0;
  }

  const edgeKey = (a, b) => (a < b ? a * 1e6 + b : b * 1e6 + a);
  const edgeToTris = new Map();
  for (let t = 0; t < triCount; t += 1) {
    for (let e = 0; e < 3; e += 1) {
      const key = edgeKey(weldId[t * 3 + e], weldId[t * 3 + ((e + 1) % 3)]);
      let list = edgeToTris.get(key);
      if (!list) {
        list = [];
        edgeToTris.set(key, list);
      }
      list.push(t);
    }
  }

  // Edge opposite vertex k, as vertex-index pairs within the triangle.
  const OPPOSITE_EDGE = [[1, 2], [2, 0], [0, 1]];

  const out = new Float32Array(position.count * 3);
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  const cross = new THREE.Vector3();

  let bevelAdjacentEdges = 0;

  for (let t = 0; t < triCount; t += 1) {
    const base = t * 3;

    if (triMask[t] === 1) {
      // Bevel triangles are already fully worn via the mask itself; distance 0 keeps
      // them continuous with the facet ramp that meets them.
      for (let i = 0; i < 9; i += 1) out[base * 3 + i] = 0;
      continue;
    }

    a.fromBufferAttribute(position, base);
    b.fromBufferAttribute(position, base + 1);
    c.fromBufferAttribute(position, base + 2);
    const doubleArea = cross.crossVectors(ab.subVectors(b, a), ac.subVectors(c, a)).length();

    const height = [FAR_EDGE, FAR_EDGE, FAR_EDGE];
    const valid = [false, false, false];

    for (let k = 0; k < 3; k += 1) {
      const [x, y] = OPPOSITE_EDGE[k];
      const neighbours = edgeToTris.get(edgeKey(weldId[base + x], weldId[base + y]));
      if (!neighbours) continue;
      // Only a MASKED BEVEL neighbour makes this edge a wear source.
      const touchesBevel = neighbours.some((n) => n !== t && triMask[n] === 1);
      if (!touchesBevel) continue;

      const p = k === 0 ? b : k === 1 ? c : a;
      const q = k === 0 ? c : k === 1 ? a : b;
      const edgeLength = p.distanceTo(q);
      if (edgeLength <= 0) continue;

      height[k] = doubleArea / edgeLength; // 2*Area / |edge| = height over that edge
      valid[k] = true;
      bevelAdjacentEdges += 1;
    }

    for (let vtx = 0; vtx < 3; vtx += 1) {
      for (let k = 0; k < 3; k += 1) {
        out[(base + vtx) * 3 + k] = valid[k]
          ? (vtx === k ? height[k] : 0)
          : FAR_EDGE;
      }
    }
  }

  const attribute = new THREE.BufferAttribute(out, 3);
  attribute.userData = { bevelAdjacentEdges, triCount };
  return attribute;
};

/**
 * Ensure every masked mesh under `root` carries `aEdgeDist`.
 *
 * Cached on the geometry itself, which is what keeps the flat-normal A/B toggle
 * working: applyFlatNormals stores `__originalGeometry` (indexed, as exported) and
 * `__flatGeometry` (non-indexed) on the mesh and swaps between them, so the flat
 * geometry keeps its attribute across any number of toggles.
 *
 * The exported indexed geometry shares vertices between triangles and therefore
 * cannot host per-triangle data. It is skipped rather than silently converted (that
 * would defeat the toggle's purpose). With no attribute the shader reads the default
 * (0,0,0), which its `d > 0.0` guard treats as "no falloff data" — so the effect
 * degrades to exactly the hard-mask behaviour instead of misfiring.
 */
export const ensureEdgeWearGeometry = (root) => {
  if (!root) return;
  root.traverse((child) => {
    if (!child?.isMesh || !child.geometry) return;
    const geometry = child.geometry;
    if (!geometry.attributes.color) return;
    if (geometry.attributes.aEdgeDist) return;

    if (geometry.index) {
      if (import.meta.env.DEV && !geometry.userData.__edgeWearIndexedNotice) {
        geometry.userData.__edgeWearIndexedNotice = true;
        console.warn(
          '[edgeWear] geometry is indexed (shared vertices) — per-triangle edge ' +
          'distances cannot be stored, so the soft falloff is disabled for it and ' +
          'the hard mask is used. This is the __setFlatNormals(false) path.'
        );
      }
      return;
    }

    const attribute = buildEdgeDistanceAttribute(geometry);
    if (!attribute) return;
    geometry.setAttribute('aEdgeDist', attribute);
    if (import.meta.env.DEV) {
      console.log(
        `[edgeWear] built aEdgeDist for "${child.name || 'mesh'}": ` +
        `${attribute.userData.triCount} tris, ` +
        `${attribute.userData.bevelAdjacentEdges} bevel-adjacent facet edges`
      );
    }
  });
};

// ---------------------------------------------------------------------------
// Shader injection
// ---------------------------------------------------------------------------

// Single source of truth for the wear value, shared with the debug visualiser so
// the two can never drift apart.
//
// The `d > 0.0` test doubles as the missing-attribute guard: with no aEdgeDist the
// attribute reads (0,0,0), d is 0, and the spill term collapses to 0 — leaving the
// original hard mask. Bevel triangles also carry d = 0 but are already 1 via `mask`.
// Noise is sampled in OBJECT space so the nicks stay locked to the surface — world
// space would make them swim as the crystal floats, rotates and explodes.
//
// Cheap value noise (iq-style hash + trilinear smoothstep), two octaves. The whole
// block sits behind a uniform branch, so `noiseAmount: 0` costs nothing beyond the
// compare: uniform control flow is coherent across the wavefront, never divergent.
export const EDGE_WEAR_FUNCTION_GLSL = /* glsl */ `
float edgeWearHash( vec3 p ) {
  p = fract( p * 0.3183099 + vec3( 0.1, 0.2, 0.3 ) );
  p *= 17.0;
  return fract( p.x * p.y * p.z * ( p.x + p.y + p.z ) );
}

float edgeWearValueNoise( vec3 p ) {
  vec3 i = floor( p );
  vec3 f = fract( p );
  f = f * f * ( 3.0 - 2.0 * f );
  float n000 = edgeWearHash( i + vec3( 0.0, 0.0, 0.0 ) );
  float n100 = edgeWearHash( i + vec3( 1.0, 0.0, 0.0 ) );
  float n010 = edgeWearHash( i + vec3( 0.0, 1.0, 0.0 ) );
  float n110 = edgeWearHash( i + vec3( 1.0, 1.0, 0.0 ) );
  float n001 = edgeWearHash( i + vec3( 0.0, 0.0, 1.0 ) );
  float n101 = edgeWearHash( i + vec3( 1.0, 0.0, 1.0 ) );
  float n011 = edgeWearHash( i + vec3( 0.0, 1.0, 1.0 ) );
  float n111 = edgeWearHash( i + vec3( 1.0, 1.0, 1.0 ) );
  return mix(
    mix( mix( n000, n100, f.x ), mix( n010, n110, f.x ), f.y ),
    mix( mix( n001, n101, f.x ), mix( n011, n111, f.x ), f.y ),
    f.z );
}

float edgeWearFbm( vec3 p ) {
  return edgeWearValueNoise( p ) * 0.65 + edgeWearValueNoise( p * 2.7 ) * 0.35;
}

// mask   : authored bevel mask (0 facet / 1 bevel)
// edgeDist: precomputed per-triangle perpendicular distances (see aEdgeDist)
// pos    : object-space position, for noise
//
// noiseAmount does two things at once, which is what makes it read as nicks rather
// than as a dirty texture: it jitters the measured distance (so the falloff contour
// becomes ragged instead of a clean offset curve) AND it knocks holes in the band
// (so the wear breaks up rather than covering evenly).
//
// noiseAmount = 0 is an exact no-op: n resolves to 0.5, the jitter term is 0, and
// the break-up multiplier is 1.
float edgeWearAmount( float mask, vec3 edgeDist, vec3 pos, float falloff,
                      float noiseAmount, float noiseScale ) {
  float d = min( min( edgeDist.x, edgeDist.y ), edgeDist.z );

  float n = 0.5;
  if ( noiseAmount > 0.0 ) n = edgeWearFbm( pos * noiseScale );

  float jittered = d + ( n - 0.5 ) * noiseAmount * falloff * 1.5;

  // The guard tests the UNJITTERED d so the missing-attribute fallback still holds:
  // no aEdgeDist -> d == 0 -> no spill -> original hard mask.
  float spill = ( falloff > 0.0 && d > 0.0 )
    ? ( 1.0 - smoothstep( 0.0, falloff, jittered ) )
    : 0.0;

  float wear = max( mask, spill );
  wear *= 1.0 - noiseAmount * ( 1.0 - n );
  return clamp( wear, 0.0, 1.0 );
}
`;

const VERTEX_DECLARATIONS = /* glsl */ `
// three only declares the color attribute when material.vertexColors is true
// (USE_COLOR / USE_COLOR_ALPHA). It is false here on purpose, so declare it
// ourselves — the guard keeps this correct if vertex colours are ever enabled.
#if !defined( USE_COLOR ) && !defined( USE_COLOR_ALPHA )
  attribute vec4 color;
#endif
attribute vec3 aEdgeDist;
varying float vEdgeWearMask;
varying vec3 vEdgeWearDist;
varying vec3 vEdgeWearPos;
`;

const VERTEX_ASSIGN = /* glsl */ `
#include <begin_vertex>
  vEdgeWearMask = color.r;
  vEdgeWearDist = aEdgeDist;
  vEdgeWearPos = position;
`;

const FRAGMENT_DECLARATIONS = /* glsl */ `
uniform float uEdgeWearRoughnessBoost;
uniform float uEdgeWearTransmissionReduction;
uniform float uEdgeWearFalloff;
uniform float uEdgeWearBrightness;
uniform vec3 uEdgeWearBrightnessColor;
uniform float uEdgeWearNoiseAmount;
uniform float uEdgeWearNoiseScale;
varying float vEdgeWearMask;
varying vec3 vEdgeWearDist;
varying vec3 vEdgeWearPos;
${EDGE_WEAR_FUNCTION_GLSL}
`;

// The wear value (noise included) is now expensive enough that computing it once per
// fragment matters — it feeds three injection sites. This declares it immediately
// after the first chunk inside main(), which every built-in material has and which
// precedes all three consumers. If the anchor is ever missing we fall back to
// inlining the full call at each site, so a three-version change degrades to "a bit
// slower" rather than "fails to compile".
const WEAR_ANCHOR = '#include <clipping_planes_fragment>';
const WEAR_CALL = /* glsl */ `edgeWearAmount( vEdgeWearMask, vEdgeWearDist, vEdgeWearPos,
    uEdgeWearFalloff, uEdgeWearNoiseAmount, uEdgeWearNoiseScale )`;
const WEAR_DECLARATION = /* glsl */ `
${WEAR_ANCHOR}
  float edgeWearValue = ${WEAR_CALL};
`;

// Additive emissive glow on the worn edges, weighted by the same wear value (so it
// feathers along the falloff ramp). Added to totalEmissiveRadiance rather than
// touching material.emissive / emissiveIntensity, which the scene animates during
// fracture/reform — the same separation internalGlow uses, and the reason the three
// emissive sources coexist instead of overwriting one another.
//
// This re-emits `#include <emissivemap_fragment>` so it composes in either order
// with the glow injection, which replaces the same anchor. Both are additive, so
// whichever patches first, the result is identical.
const emissiveInjection = (wear) => /* glsl */ `
#include <emissivemap_fragment>
  totalEmissiveRadiance += uEdgeWearBrightnessColor * uEdgeWearBrightness * ${wear};
`;

// roughnessFactor is declared by <roughnessmap_fragment> and consumed downstream by
// <lights_physical_fragment> (which becomes material.roughness, and from there feeds
// both direct lighting and the transmission refraction blur). Adjusting it here is
// the single point that covers all of those consistently.
//
// The wear value is recomputed at each injection site rather than shared through a
// local, so neither injection depends on the other having been applied. It is ~5 ALU
// against a transmission shader doing a full IBL volume refraction.
const roughnessInjection = (wear) => /* glsl */ `
#include <roughnessmap_fragment>
  roughnessFactor = clamp( roughnessFactor + uEdgeWearRoughnessBoost * ${wear}, 0.0, 1.0 );
`;

// The transmission value is assigned inside three's <transmission_fragment> chunk
// and consumed a few lines later by getIBLVolumeRefraction, so there is no seam to
// inject at — the chunk has to be expanded and that one assignment patched. We take
// the chunk from the live THREE.ShaderChunk (so everything except the patched line
// tracks the installed three version) and bail out loudly if the anchor ever moves.
const TRANSMISSION_ANCHOR = 'material.transmission = transmission;';
const transmissionPatch = (wear) => /* glsl */ `float edgeWearTransmissionScale = clamp( 1.0 - uEdgeWearTransmissionReduction * ${wear}, 0.0, 1.0 );
	material.transmission = transmission * edgeWearTransmissionScale;`;

const buildTransmissionChunk = (wear) => {
  const chunk = THREE.ShaderChunk.transmission_fragment;
  if (typeof chunk !== 'string' || !chunk.includes(TRANSMISSION_ANCHOR)) {
    console.error(
      '[edgeWear] THREE.ShaderChunk.transmission_fragment no longer contains ' +
      `"${TRANSMISSION_ANCHOR}" — skipping the transmission half of the effect. ` +
      'Roughness wear still applies. Re-check this against the installed three version.'
    );
    return null;
  }
  return chunk.replace(TRANSMISSION_ANCHOR, transmissionPatch(wear));
};

/**
 * Only MeshPhysicalMaterial has `transmission`/`roughness` and the chunks we patch.
 * The low performance tier renders the crystal with MeshPhongMaterial, which has
 * neither — it is skipped so tier behaviour is preserved exactly.
 */
export const supportsEdgeWear = (material) =>
  Boolean(material?.isMeshPhysicalMaterial);

/** True only when this material carries OUR live injection. */
export const hasEdgeWear = (material) =>
  Boolean(attachState.has(material) && material?.onBeforeCompile?.__edgeWear);

/**
 * Attach the edge-wear injection, chaining to any existing onBeforeCompile.
 *
 * Program cache key: three reuses a cached program when the cache key matches, and
 * would then never re-run onBeforeCompile — so our injection would silently not
 * apply. We compose our own key onto whatever key is already installed (the glow
 * injection sets one) so the shader recompiles with BOTH injections present.
 */
export const attachEdgeWear = (
  material,
  {
    roughnessBoost = 0,
    transmissionReduction = 0,
    falloff = 0,
    brightness = 0,
    brightnessColor = '#ffffff',
    noiseAmount = 0,
    noiseScale = 1,
  } = {}
) => {
  if (!material || !supportsEdgeWear(material)) return material;
  if (hasEdgeWear(material)) {
    return updateEdgeWear(material, {
      roughnessBoost,
      transmissionReduction,
      falloff,
      brightness,
      brightnessColor,
      noiseAmount,
      noiseScale,
    });
  }

  const uniforms = {
    uEdgeWearRoughnessBoost: { value: roughnessBoost },
    uEdgeWearTransmissionReduction: { value: transmissionReduction },
    uEdgeWearFalloff: { value: falloff },
    // Holds brightnessBase * reveal. The authored value lives in state.brightnessBase
    // so the intro ramp can scale it without destroying what the config/live tuning set.
    uEdgeWearBrightness: { value: brightness },
    uEdgeWearBrightnessColor: { value: toColor(brightnessColor) },
    uEdgeWearNoiseAmount: { value: noiseAmount },
    uEdgeWearNoiseScale: { value: noiseScale },
  };

  const previousOnBeforeCompile = material.onBeforeCompile;
  const previousCacheKey = material.customProgramCacheKey;
  const programKey = `edgeWear-${++edgeWearCounter}`;
  const onBeforeCompile = function edgeWearOnBeforeCompile(shader, renderer) {
    // Run the pre-existing injection (internalGlow) FIRST so we patch its output
    // rather than discarding it.
    if (typeof previousOnBeforeCompile === 'function') {
      previousOnBeforeCompile.call(this, shader, renderer);
    }

    // Re-bind the persistent uniform objects into this (re)compiled program so live
    // value edits keep taking effect after any recompile.
    Object.assign(shader.uniforms, uniforms);

    shader.vertexShader = VERTEX_DECLARATIONS + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', VERTEX_ASSIGN);

    let frag = FRAGMENT_DECLARATIONS + shader.fragmentShader;

    // Compute the wear once per fragment when the anchor is available; otherwise
    // inline the call at each site (correct, just evaluated three times).
    const withDeclaration = frag.replace(WEAR_ANCHOR, WEAR_DECLARATION);
    const singleEval = withDeclaration !== frag;
    if (singleEval) frag = withDeclaration;
    else if (import.meta.env.DEV) {
      console.warn(
        `[edgeWear] "${WEAR_ANCHOR}" not found — falling back to per-site evaluation.`
      );
    }
    const wear = singleEval ? 'edgeWearValue' : WEAR_CALL;

    frag = frag.replace('#include <roughnessmap_fragment>', roughnessInjection(wear));
    const transmissionChunk = buildTransmissionChunk(wear);
    if (transmissionChunk) {
      frag = frag.replace('#include <transmission_fragment>', transmissionChunk);
    }
    frag = frag.replace('#include <emissivemap_fragment>', emissiveInjection(wear));

    shader.fragmentShader = frag;
  };

  // Preserve the glow injection's marker so hasInternalGlow() still recognises this
  // material. Without this the glow owner would think its injection was lost and
  // re-attach, overwriting us and nesting the wrappers.
  onBeforeCompile.__edgeWear = true;
  if (previousOnBeforeCompile?.__internalGlow) onBeforeCompile.__internalGlow = true;

  attachState.set(material, {
    uniforms,
    previousOnBeforeCompile,
    previousCacheKey,
    programKey,
    // Authored brightness, kept separate from the uniform so setEdgeWearReveal() can
    // scale it per frame. Starts at 1 so a scene with no intro looks correct even if
    // the per-frame sync never runs.
    brightnessBase: brightness,
    reveal: 1,
  });

  material.onBeforeCompile = onBeforeCompile;
  material.customProgramCacheKey = () => {
    const base = typeof previousCacheKey === 'function' ? previousCacheKey.call(material) : '';
    return `${base}|${programKey}`;
  };
  material.needsUpdate = true;

  return material;
};

/**
 * Remove the injection and restore the exact previous shader wiring, so
 * `edgeWear.enabled = false` reproduces the original crystal material byte-for-byte
 * (same program cache key => three reuses the original compiled program).
 */
export const detachEdgeWear = (material) => {
  const state = attachState.get(material);
  if (!state) return material;

  material.onBeforeCompile = state.previousOnBeforeCompile ?? function () {};
  if (state.previousCacheKey) material.customProgramCacheKey = state.previousCacheKey;
  else delete material.customProgramCacheKey;

  attachState.delete(material);
  material.needsUpdate = true;
  return material;
};

/**
 * Mutate the wear amounts in place. No recompile, no needsUpdate — safe to call
 * from a control-panel slider or a per-frame sync. `falloff` is a uniform precisely
 * so it stays live-tunable without rebuilding the shader.
 */
export const updateEdgeWear = (
  material,
  {
    roughnessBoost,
    transmissionReduction,
    falloff,
    brightness,
    brightnessColor,
    noiseAmount,
    noiseScale,
  } = {}
) => {
  const state = attachState.get(material);
  if (!state) return material;
  if (typeof noiseAmount === 'number') {
    state.uniforms.uEdgeWearNoiseAmount.value = noiseAmount;
  }
  if (typeof noiseScale === 'number') {
    state.uniforms.uEdgeWearNoiseScale.value = noiseScale;
  }
  if (typeof roughnessBoost === 'number') {
    state.uniforms.uEdgeWearRoughnessBoost.value = roughnessBoost;
  }
  if (typeof transmissionReduction === 'number') {
    state.uniforms.uEdgeWearTransmissionReduction.value = transmissionReduction;
  }
  if (typeof falloff === 'number') {
    state.uniforms.uEdgeWearFalloff.value = falloff;
  }
  if (typeof brightness === 'number') {
    // Set the authored level; the live uniform stays scaled by the intro reveal.
    state.brightnessBase = brightness;
    state.uniforms.uEdgeWearBrightness.value = brightness * state.reveal;
  }
  if (brightnessColor !== undefined && brightnessColor !== null) {
    // Mutate in place so the bound uniform object stays the same reference.
    if (brightnessColor instanceof THREE.Color) {
      state.uniforms.uEdgeWearBrightnessColor.value.copy(brightnessColor);
    } else {
      state.uniforms.uEdgeWearBrightnessColor.value.set(brightnessColor);
    }
  }
  return material;
};

/**
 * Scale the edge glow by the shared intro reveal (0 -> 1), so it fades up with the
 * rest of the scene instead of popping in at full strength.
 *
 * Deliberately scales ONLY brightness: the roughness/transmission wear is a surface
 * property that should be there from the first frame, and ramping it would make the
 * crystal look like it was changing material rather than lighting up. Cheap enough
 * to call every frame — one compare, and a single float write when it changes.
 */
export const setEdgeWearReveal = (material, reveal) => {
  const state = attachState.get(material);
  if (!state) return material;
  const next = reveal < 0 ? 0 : reveal > 1 ? 1 : reveal;
  if (state.reveal === next) return material;
  state.reveal = next;
  state.uniforms.uEdgeWearBrightness.value = state.brightnessBase * next;
  return material;
};

/** Current live uniform values — used by the DEV console helper. */
export const readEdgeWear = (material) => {
  const state = attachState.get(material);
  if (!state) return null;
  return {
    roughnessBoost: state.uniforms.uEdgeWearRoughnessBoost.value,
    transmissionReduction: state.uniforms.uEdgeWearTransmissionReduction.value,
    falloff: state.uniforms.uEdgeWearFalloff.value,
    // Authored level, not the reveal-scaled uniform, so tuning reads back what you set.
    brightness: state.brightnessBase,
    brightnessColor: `#${state.uniforms.uEdgeWearBrightnessColor.value.getHexString()}`,
    noiseAmount: state.uniforms.uEdgeWearNoiseAmount.value,
    noiseScale: state.uniforms.uEdgeWearNoiseScale.value,
    introReveal: state.reveal,
  };
};
