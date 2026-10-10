// src/config/assetPaths.js
//
// Where the scene's files live, per performance tier. Kept free of three.js (and
// re-exported by crystalConfig.js, which is not) so the boot code in main.jsx can
// start downloading them before the app chunk has arrived.

// === ENVIRONMENT ===
// Single source of truth for the environment map. To swap the HDRI everywhere,
// change HDRI_BASE only — the per-tier suffix (-high/-medium/-low) is appended
// automatically and must match the files in public/assets/environment/.
export const HDRI_BASE = 'prismatic-detailed01';
export const hdriPathForTier = (tier = 'low') =>
  `/assets/environment/${HDRI_BASE}-${tier}.hdr`;

// === MODELS ===

// Whole-crystal mesh, per performance tier. The default carries the Blender
// `edgeWear` vertex mask that materials/edgeWear.js reads; the `-noWear` variant is
// the same crystal exported without it. The low tier renders MeshPhongMaterial,
// which the edge-wear injection skips outright (see materials.crystal.edgeWear), so
// there the mask geometry and its per-triangle aEdgeDist build would be paid for
// and never shown.
//
// Both consumers must agree on this URL: the loader downloads it (see
// src/loader/sceneAssets.js) and UnifiedCrystalScene's useGLTF parses it from the
// same bytes. A mismatch means the loader counts one crystal to 100% and then the
// scene downloads a different one.
export const CRYSTAL_WHOLE_MODELS = {
  default: '/assets/models/CrystalWhole-EdgeWear03.glb',
  low: '/assets/models/CrystalWhole-noWear.glb'
};

export const crystalWholePathForTier = (tier = 'high') =>
  tier === 'low' ? CRYSTAL_WHOLE_MODELS.low : CRYSTAL_WHOLE_MODELS.default;

// The six project facets, same story as the crystal above: the default exports carry
// the `edgeWear` mask, the ones under projects-no-edgewear/ are the same meshes
// without it. Identical filenames, so the tier only chooses a directory.
//
// Low tier renders MeshPhongMaterial, which the edge-wear injection skips, so the
// mask there is dead weight twice over: the COLOR_0 attribute rides along in the
// download, and unshareForEdgeWear would call toNonIndexed on the geometry purely
// to host an aEdgeDist attribute nothing reads. Without a mask neither happens.
const PROJECT_MODEL_FILES = {
  project01: 'Project01.glb',
  project02: 'Project02.glb',
  project03: 'Project03.glb',
  project04: 'Project04.glb',
  project05: 'Project05.glb',
  project06: 'Project06.glb',
};

const PROJECT_MODEL_DIRS = {
  default: '/assets/models',
  low: '/assets/models/projects-no-edgewear',
};

export const PROJECT_MODEL_KEYS = Object.keys(PROJECT_MODEL_FILES);

// Returns null for a key that is not a project facet, so a caller can tell the two
// kinds of model apart without keeping its own list.
export const projectModelPathForTier = (key, tier = 'high') => {
  const file = PROJECT_MODEL_FILES[key];
  if (!file) return null;
  return `${tier === 'low' ? PROJECT_MODEL_DIRS.low : PROJECT_MODEL_DIRS.default}/${file}`;
};

export const FRACTURE_RAYS_MODEL = '/assets/models/FractureRays.glb';

// === TEXTURES ===
export const CRYSTAL_NORMAL_MAP = '/assets/textures/raw-crystal-normal01.png';
export const MIST_TEXTURE = '/assets/textures/mist05.jpg';
export const DUST_TEXTURE = '/assets/textures/particle-dust05.png';

// The hero→overview fracture effects (src/loader/preloadFractureAssets.js).
export const FRACTURE_RING_TEXTURE = '/assets/textures/fractureRing03.jpg';
export const GLOW_SPHERE_TEXTURE = '/assets/textures/glowing-sphere06-noise.jpg';
export const WIZARD_SMOKE_TEXTURE = '/assets/textures/wizard-smoke02.webp';

// Lens dirt masks (components/three/LensDirt.jsx). Not loader assets: the dirt is
// hidden at rest, so they load once the scene is up.
export const LENS_DIRT_LANDSCAPE_TEXTURE = '/assets/textures/lens-dirt-landscape.webp';
export const LENS_DIRT_PORTRAIT_TEXTURE = '/assets/textures/lens-dirt-portrait.webp';
