import * as THREE from 'three';
import {
  FRACTURE_RING_TEXTURE as FRACTURE_RING_URL,
  GLOW_SPHERE_TEXTURE as GLOW_SPHERE_URL,
  WIZARD_SMOKE_TEXTURE as WIZARD_SMOKE_URL,
} from '../config/assetPaths';
import { seedThreeCacheAll } from './threeCache';

let fractureRingTex = null;
let glowSphereTex = null;
let wizardSmokeTex = null;

let preloadPromise = null;

// One load, however many callers. App starts it on mount and waits on it before
// mounting the scene that samples these textures.
export function preloadFractureAssets() {
  if (!preloadPromise) preloadPromise = loadFractureAssets();
  return preloadPromise;
}

async function loadFractureAssets() {
  // The bytes come from the boot downloads (src/loader/sceneAssets.js), so the
  // loader below reads them from THREE.Cache rather than the network.
  await seedThreeCacheAll([FRACTURE_RING_URL, GLOW_SPHERE_URL, WIZARD_SMOKE_URL]);
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
