// artworkMask.js — an authored grayscale mask over a project's artwork overlay.
//
// The artwork is its own transparent MeshBasicMaterial laid over the facet's
// ProjectDisplay face (see hooks/useFacetOverlayGeometry.js), and the face beneath
// it is always rendered. The mask drives two things there:
//
//   opacity    — where it darkens, the photo's alpha drops a little and the
//                ordinary blend lets the real crystal shading through (the face's
//                own transmission, reflections and glow). No second material,
//                pass or geometry.
//   refraction — the photo is sampled slightly shifted inside the painted planes,
//                as if seen through a different plane of glass, so a straight line
//                in the photo steps where it crosses one. Optional dispersion
//                splits red and blue a fraction along the same shift.
//
// White keeps the photo exactly: the protected centre has neither.
//
// The mask rides in the material's alphaMap slot. three samples that through its
// own transform (alphaMapTransform, left at identity here) on the mesh's raw `uv`,
// while the photo's rotation and cover-crop live in the map's transform. So a mask
// is painted once against the GLB's UV layout and holds for whatever photo is set.
// The refraction is worked out in that mask UV space and only then scaled into the
// photo's (uArtworkMapScale), so the two stay independent.
//
// How the shift is derived. The mask holds opacity, not surface normals, so it
// can't say which way a real plane would bend light. Two stable readings of it
// stand in:
//   - how far the mask is from white (its reveal) sets how far a spot shifts. A
//     plane painted one grey moves as one piece, and the shift steps where the
//     painted planes meet — the "different plane of glass" look, not a ripple.
//   - the mask's broad slope, read from a blurred mip a few percent of the UV
//     square across, sets which way: toward the photo's white centre. It turns
//     slowly, so the direction holds along an edge instead of tracing outlines.
// The size is set in CSS pixels and converted per fragment from screen-space
// derivatives of the mask UV, so the same setting reads the same on every
// fragment, photo and screen.

import * as THREE from 'three';

// Every overlay compiles the same GLSL and differs only in uniform values, so one
// cached program serves them all. Safe to share because each overlay is a fresh
// material: three runs onBeforeCompile (binding that material's own uniforms) the
// first time a material acquires a program.
const PROGRAM_KEY = 'artworkMask-v2';

const MAP_PARS_ANCHOR = '#include <alphamap_pars_fragment>';
const MAP_ANCHOR = '#include <map_fragment>';
const ALPHAMAP_ANCHOR = '#include <alphamap_fragment>';
const MAP_SAMPLE = 'vec4 sampledDiffuseColor = texture2D( map, vMapUv );';

const FRAGMENT_DECLARATIONS = /* glsl */ `
uniform float uArtworkMaskStrength;   // per material: config strength x case-study ramp (transparency)
uniform float uArtworkOpticsStrength; // per material: config strength alone (refraction, dispersion)
uniform vec2 uArtworkMapScale;        // per material: photo UV per mask UV (map.repeat)
uniform float uArtworkOpacityEffect;  // shared: share of the mask's transparency kept
uniform float uArtworkRefractionPx;   // shared: largest photo shift, CSS px
uniform float uArtworkDispersionPx;   // shared: red/blue split, CSS px
uniform float uArtworkPixelRatio;     // shared: device px per CSS px
`;

const OPTICS_FUNCTIONS = /* glsl */ `
#include <alphamap_pars_fragment>
#if defined( USE_ALPHAMAP ) && defined( USE_MAP )

  // Reveal below this counts as white, so the near-white wash around the painted
  // planes never moves the protected centre.
  #define ARTWORK_REVEAL_FLOOR 0.02
  // Reveal at which a plane takes the full shift. Painted planes mostly sit at
  // 0.1-0.3, so most of a plane moves by the full amount, as one piece.
  #define ARTWORK_REVEAL_FULL 0.15
  // Half-width of the slope reading in mask UV (~25 texels of a 2048 mask), and
  // the slope (mask difference across it) from too little to steer by to sure.
  #define ARTWORK_SLOPE_SPAN 0.012
  #define ARTWORK_SLOPE_MIN 0.004
  #define ARTWORK_SLOPE_SURE 0.03

  // Shift for this fragment in mask UV, at most uArtworkRefractionPx CSS px.
  // textureLod only (explicit level), so it is safe under the early return.
  vec2 artworkRefraction( vec2 maskUv, float reveal, float uvPerDevicePx ) {
    float weight = smoothstep( ARTWORK_REVEAL_FLOOR, ARTWORK_REVEAL_FULL, reveal );
    if ( weight <= 0.0 ) return vec2( 0.0 );

    float lod = log2( ARTWORK_SLOPE_SPAN * float( textureSize( alphaMap, 0 ).x ) );
    vec2 sx = vec2( ARTWORK_SLOPE_SPAN, 0.0 );
    vec2 sy = vec2( 0.0, ARTWORK_SLOPE_SPAN );
    vec2 slope = vec2(
      textureLod( alphaMap, maskUv + sx, lod ).g - textureLod( alphaMap, maskUv - sx, lod ).g,
      textureLod( alphaMap, maskUv + sy, lod ).g - textureLod( alphaMap, maskUv - sy, lod ).g
    );
    float slopeLength = length( slope );
    float sure = smoothstep( ARTWORK_SLOPE_MIN, ARTWORK_SLOPE_SURE, slopeLength );
    vec2 towardCentre = slope / max( slopeLength, 1e-5 );

    float shiftPx = uArtworkRefractionPx * uArtworkPixelRatio * weight * sure;
    return towardCentre * shiftPx * uvPerDevicePx;
  }

#endif
`;

// Replaces the one sampling line of three's own map chunk (the rest of the chunk
// is kept, so it tracks the installed three).
const MAP_SAMPLING = /* glsl */ `
  vec2 artworkMapUv = vMapUv;
  #ifdef USE_ALPHAMAP
    float artworkMask = texture2D( alphaMap, vAlphaMapUv ).g;
    // Derivatives up here, in uniform control flow.
    vec2 artworkUvDx = dFdx( vAlphaMapUv );
    vec2 artworkUvDy = dFdy( vAlphaMapUv );
    float artworkUvPerPx = sqrt( abs( artworkUvDx.x * artworkUvDy.y - artworkUvDx.y * artworkUvDy.x ) );
    vec2 artworkShift = vec2( 0.0 );
    if ( uArtworkRefractionPx > 0.0 && uArtworkOpticsStrength > 0.0 ) {
      artworkShift = artworkRefraction( vAlphaMapUv, 1.0 - artworkMask, artworkUvPerPx ) * uArtworkOpticsStrength;
    }
    artworkMapUv += artworkShift * uArtworkMapScale;
  #endif
  // Mip level from the unshifted UVs, so a step in the shift never blurs the photo.
  vec2 artworkMapDx = dFdx( vMapUv );
  vec2 artworkMapDy = dFdy( vMapUv );
  vec4 sampledDiffuseColor = textureGrad( map, artworkMapUv, artworkMapDx, artworkMapDy );
  #ifdef USE_ALPHAMAP
    if ( uArtworkDispersionPx > 0.0 && uArtworkRefractionPx > 0.0 ) {
      // Red and blue either side of green along the same shift, never split by
      // more than half of it, so the colour edge stays under the refraction.
      float artworkSplit = min( uArtworkDispersionPx, 0.5 * uArtworkRefractionPx ) / uArtworkRefractionPx;
      vec2 artworkChroma = artworkShift * uArtworkMapScale * artworkSplit;
      sampledDiffuseColor.r = textureGrad( map, artworkMapUv + artworkChroma, artworkMapDx, artworkMapDy ).r;
      sampledDiffuseColor.b = textureGrad( map, artworkMapUv - artworkChroma, artworkMapDx, artworkMapDy ).b;
    }
    #ifdef ARTWORK_OPTICS_DEBUG
      // DEV view: red = shift in device px, green = reveal, blue = 1 on the face.
      sampledDiffuseColor = vec4( length( artworkShift ) / max( artworkUvPerPx, 1e-9 ), 1.0 - artworkMask, 1.0, 1.0 );
    #endif
  #endif
`;

// Alpha: today's 1 - strength * reveal, scaled by the opacity effect. Clamped: a
// strength over 1 pushes mid-grey past 0, and a negative alpha brightens what is
// under it instead of showing it.
const ALPHAMAP_INJECTION = /* glsl */ `
#ifdef USE_ALPHAMAP
  #ifndef USE_MAP
    float artworkMask = texture2D( alphaMap, vAlphaMapUv ).g;
  #endif
  #ifndef ARTWORK_OPTICS_DEBUG
    diffuseColor.a *= clamp( 1.0 - uArtworkMaskStrength * uArtworkOpacityEffect * ( 1.0 - artworkMask ), 0.0, 1.0 );
  #endif
#endif
`;

// Shared by every masked overlay: one write retunes them all.
const sharedUniforms = {
  uArtworkOpacityEffect: { value: 1 },
  uArtworkRefractionPx: { value: 0 },
  uArtworkDispersionPx: { value: 0 },
  uArtworkPixelRatio: { value: 1 },
};

const ONE = new THREE.Vector2(1, 1);
let opticsDebug = false;

// Material -> its own uniforms. A WeakMap rather than userData, which
// Material.copy() JSON-round-trips (see edgeWear.js). The set is for the DEV debug
// toggle, which has to reach every masked material; disposal takes one out.
const attached = new WeakMap();
const live = new Set();

const buildMapChunk = () => {
  const chunk = THREE.ShaderChunk.map_fragment;
  if (typeof chunk !== 'string' || !chunk.includes(MAP_SAMPLE)) return null;
  return chunk.replace(MAP_SAMPLE, MAP_SAMPLING);
};

const attachInjection = (material) => {
  const uniforms = {
    uArtworkMaskStrength: { value: 1 },
    uArtworkOpticsStrength: { value: 1 },
    // Read at upload, so it follows the photo texture this material has now (it is
    // swapped when a slot re-registers). The photo's transform has no rotation
    // (configureOverlayTexture), so its repeat alone maps mask UV to photo UV.
    uArtworkMapScale: { get value() { return material.map ? material.map.repeat : ONE; } },
  };

  material.onBeforeCompile = (shader) => {
    // Re-bound on every compile (the alphaMap on/off switch is a new program), so
    // writes keep reaching whichever program is live.
    Object.assign(shader.uniforms, sharedUniforms, uniforms);
    const mapChunk = buildMapChunk();
    const anchors = [MAP_PARS_ANCHOR, MAP_ANCHOR, ALPHAMAP_ANCHOR];
    if (!mapChunk || anchors.some((anchor) => !shader.fragmentShader.includes(anchor))) {
      console.error(
        '[artworkMask] three\'s map/alphamap chunks changed — the mask falls back to ' +
        'three\'s plain alphaMap. Re-check this against the installed three version.'
      );
      return;
    }
    shader.fragmentShader = FRAGMENT_DECLARATIONS + shader.fragmentShader
      .replace(MAP_PARS_ANCHOR, OPTICS_FUNCTIONS)
      .replace(MAP_ANCHOR, mapChunk)
      .replace(ALPHAMAP_ANCHOR, ALPHAMAP_INJECTION);
  };
  material.customProgramCacheKey = () => PROGRAM_KEY;
  // The pixel ratio is the renderer's, which can change with the performance tier.
  material.onBeforeRender = (renderer) => {
    sharedUniforms.uArtworkPixelRatio.value = renderer.getPixelRatio();
  };
  if (opticsDebug) material.defines = { ...material.defines, ARTWORK_OPTICS_DEBUG: '' };

  attached.set(material, uniforms);
  live.add(material);
  material.addEventListener('dispose', () => live.delete(material));
  return uniforms;
};

/**
 * A texture for a mask image: data, not colour, laid on the raw UVs as painted.
 * The image is the full 0..1 UV square in the Blender export's orientation, which
 * is glTF's — hence flipY off, like every texture GLTFLoader makes. Mipmapped:
 * the refraction reads its slope from a blurred level.
 */
export const createArtworkMaskTexture = (image) => {
  const texture = new THREE.Texture(image);
  texture.flipY = false;
  texture.colorSpace = THREE.NoColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  // The face is often seen at a slant; three clamps this to what the GPU allows.
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
};

/**
 * Put a mask on (or, with null, take it off) an artwork material. Recompiles only
 * when the mask actually changes, never for strength or the optics settings.
 */
export const applyArtworkMask = (material, texture, strength = 1) => {
  if (!material) return;
  const next = texture ?? null;
  if (next && !attached.has(material)) attachInjection(material);
  if (material.alphaMap !== next) {
    material.alphaMap = next;
    material.needsUpdate = true;
  }
  setArtworkMaskStrength(material, strength);
};

/**
 * Live strength write: uniforms, no recompile. `strength` scales the transparency,
 * which needs the face behind the photo, so the case-study ramp takes it down with
 * the face. `opticsStrength` scales the refraction and dispersion, which only move
 * where the photo is sampled and hold whether the face is there or not — it skips
 * the ramp, so the photo leaves and returns already refracted.
 */
export const setArtworkMaskStrength = (material, strength, opticsStrength = strength) => {
  const uniforms = attached.get(material);
  if (!uniforms) return;
  uniforms.uArtworkMaskStrength.value = strength;
  uniforms.uArtworkOpticsStrength.value = opticsStrength;
};

/**
 * The optics settings (materials.facet.artworkOptics), for every masked overlay at
 * once. Uniforms only, so no recompile. `enabled: false` is the mask as it was
 * before the optics: its full transparency, no shift, no split.
 */
export const setArtworkOptics = ({
  enabled = true,
  opacityEffect = 1,
  refractionStrength = 0,
  dispersionStrength = 0,
} = {}) => {
  const on = enabled !== false;
  sharedUniforms.uArtworkOpacityEffect.value = on ? Math.max(0, opacityEffect) : 1;
  sharedUniforms.uArtworkRefractionPx.value = on ? Math.max(0, refractionStrength) : 0;
  sharedUniforms.uArtworkDispersionPx.value = on ? Math.max(0, dispersionStrength) : 0;
};

/** The live optics values, for the DEV console helper. */
export const readArtworkOptics = () => ({
  opacityEffect: sharedUniforms.uArtworkOpacityEffect.value,
  refractionStrength: sharedUniforms.uArtworkRefractionPx.value,
  dispersionStrength: sharedUniforms.uArtworkDispersionPx.value,
  pixelRatio: sharedUniforms.uArtworkPixelRatio.value,
  debug: opticsDebug,
});

/**
 * DEV: paint the masked faces with the optics instead of the photo — red is the
 * shift in device pixels (1.0 = 1 px), green the reveal. A define, so it
 * recompiles; it is a diagnostic, not a setting. Applies to overlays made later too.
 */
export const setArtworkOpticsDebug = (on) => {
  opticsDebug = Boolean(on);
  live.forEach((material) => {
    const defines = { ...(material.defines || {}) };
    if (opticsDebug) defines.ARTWORK_OPTICS_DEBUG = '';
    else delete defines.ARTWORK_OPTICS_DEBUG;
    material.defines = defines;
    material.needsUpdate = true;
  });
};
