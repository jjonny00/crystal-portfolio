import * as THREE from 'three';

let fractureRingTex = null;
let glowSphereTex = null;
let wizardSmokeTex = null;

const FRACTURE_RING_URL = '/assets/textures/fractureRing03.jpg';
const GLOW_SPHERE_URL = '/assets/textures/glowing-sphere06-noise.jpg';
const WIZARD_SMOKE_URL = '/assets/textures/wizard-smoke02.webp';

let preloadPromise = null;

// One load, however many callers. main.jsx starts it at boot; on the case-study
// fast path it is not awaited there (the page is already readable), so App waits
// on the same promise before mounting the scene that samples these textures.
export function preloadFractureAssets() {
  if (!preloadPromise) preloadPromise = loadFractureAssets();
  return preloadPromise;
}

async function loadFractureAssets() {
  const loader = new THREE.TextureLoader();

  const [ring, glow, smoke] = await Promise.all([
    loader.loadAsync(FRACTURE_RING_URL),
    loader.loadAsync(GLOW_SPHERE_URL),
    loader.loadAsync(WIZARD_SMOKE_URL)
  ]);

  [ring, glow].forEach((t) => {
    // Match project texture settings
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.wrapS = THREE.ClampToEdgeWrapping;
    t.wrapT = THREE.ClampToEdgeWrapping;
    t.generateMipmaps = false;
    t.colorSpace = THREE.SRGBColorSpace;
    t.flipY = false;
    t.needsUpdate = true;
  });

  // Smoke sprite is sampled via a plane's default UVs in FractureSmokePuff, so
  // keep the default flipY (upright) rather than the ring/glow's flipY=false.
  smoke.minFilter = THREE.LinearFilter;
  smoke.magFilter = THREE.LinearFilter;
  smoke.wrapS = THREE.ClampToEdgeWrapping;
  smoke.wrapT = THREE.ClampToEdgeWrapping;
  smoke.generateMipmaps = false;
  smoke.colorSpace = THREE.SRGBColorSpace;
  smoke.needsUpdate = true;

  fractureRingTex = ring;
  glowSphereTex = glow;
  wizardSmokeTex = smoke;
}

export function getFractureRingTexture() {
  return fractureRingTex;
}

export function getGlowingSphereTexture() {
  return glowSphereTex;
}

export function getWizardSmokeTexture() {
  return wizardSmokeTex;
}
