import { useGLTF, useTexture } from '@react-three/drei';
import { assets } from '../crystalConfig';

export function preloadAssets() {
  Object.values(assets.models).forEach((url) => useGLTF.preload(url));
  if (assets.textures?.normalMap) {
    useTexture.preload(assets.textures.normalMap);
  }
}
