import { useGLTF, useTexture } from '@react-three/drei';
import { useLoader } from '@react-three/fiber';
import { RGBELoader } from 'three-stdlib';
import { assets } from '../crystalConfig';
import { getHDRIPath } from './deviceProfiles';

export function preloadAssets(hdriQuality = 'low') {
  Object.values(assets.models).forEach((url) => useGLTF.preload(url));
  if (assets.textures?.normalMap) {
    useTexture.preload(assets.textures.normalMap);
  }
  const hdriPath = getHDRIPath(hdriQuality);
  useLoader.preload(RGBELoader, hdriPath);
}
