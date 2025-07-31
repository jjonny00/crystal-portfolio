import { useGLTF, useTexture } from '@react-three/drei';
import { useLoader } from '@react-three/fiber';
import { RGBELoader } from 'three-stdlib';
import { assets } from '../crystalConfig';
import { getHDRIPath } from './deviceProfiles';

export function preloadAssets(hdriQuality = 'low') {
  const promises = [];
  Object.values(assets.models).forEach((url) => {
    const p = useGLTF.preload(url);
    if (p) promises.push(p);
  });
  if (assets.textures?.normalMap) {
    const p = useTexture.preload(assets.textures.normalMap);
    if (p) promises.push(p);
  }
  const hdriPath = getHDRIPath(hdriQuality);
  const hdriPromise = useLoader.preload(RGBELoader, hdriPath);
  if (hdriPromise) promises.push(hdriPromise);
  return Promise.all(promises);
}
