import * as THREE from "three";

let cachedTexture = null;

export async function loadFacetOverlayTexture() {
  if (cachedTexture) return cachedTexture;
  
  return new Promise((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    loader.load(
      "/assets/textures/checker01.jpg",
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestMipmapNearestFilter;
        texture.anisotropy = 8;
        texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.needsUpdate = true;
        
        cachedTexture = texture;
        resolve(texture);
      },
      undefined,
      reject
    );
  });
}
