import * as THREE from "three";

const loader = new THREE.TextureLoader();

export async function loadFacetOverlayTexture() {
  return new Promise((resolve, reject) => {
    loader.load(
      // public/ maps to root path in Vite
      "/assets/textures/checker01.jpg",
      (tex) => {
        // ensure clear/crisp sampling
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.magFilter = THREE.NearestFilter;
        // choose one of the following depending on your preference:
        // A) crisp with mipmaps near/far (good default):
        tex.minFilter = THREE.NearestMipmapNearestFilter;
        tex.generateMipmaps = true;
        // // B) super crisp, no mipmaps (can shimmer at distance):
        // tex.minFilter = THREE.NearestFilter;
        // tex.generateMipmaps = false;

        tex.anisotropy = 8;
        tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; // or RepeatWrapping if desired
        tex.needsUpdate = true;
        resolve(tex);
      },
      undefined,
      reject
    );
  });
}
