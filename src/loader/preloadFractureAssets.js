import * as THREE from 'three';

let fractureRingTex = null;
let glowSphereTex = null;

const FRACTURE_RING_URL = '/assets/textures/fractureRing03.jpg';
const GLOW_SPHERE_URL = '/assets/textures/glowing-sphere06-noise.jpg';

export async function preloadFractureAssets() {
  const loader = new THREE.TextureLoader();

  const [ring, glow] = await Promise.all([
    loader.loadAsync(FRACTURE_RING_URL),
    loader.loadAsync(GLOW_SPHERE_URL)
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

  fractureRingTex = ring;
  glowSphereTex = glow;
}

export function getFractureRingTexture() {
  return fractureRingTex;
}

export function getGlowingSphereTexture() {
  return glowSphereTex;
}
