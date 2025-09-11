import { useMemo, useCallback, useEffect } from 'react';
import * as THREE from 'three';

// Generates a reusable checkerboard texture and utilities to blend it with facet materials
export function useFacetTextureOverlay() {
  const overlayTexture = useMemo(() => {
    const size = 64;
    const data = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const isWhite = (Math.floor(x / 8) + Math.floor(y / 8)) % 2 === 0;
        const color = isWhite ? 255 : 0;
        const idx = (y * size + x) * 4;
        data[idx] = data[idx + 1] = data[idx + 2] = color;
        data[idx + 3] = 255;
      }
    }
    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.needsUpdate = true;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);

  useEffect(() => () => overlayTexture.dispose(), [overlayTexture]);

  const patchMaterial = useCallback((material) => {
    if (!material || material.userData?.overlayPatched) return;

    const original = material.onBeforeCompile;
    material.onBeforeCompile = (shader) => {
      original?.(shader);
      shader.uniforms.uOverlayTexture = { value: overlayTexture };
      shader.uniforms.uOverlayBlend = { value: 0 };
      material.userData._overlayBlend = shader.uniforms.uOverlayBlend;
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <map_pars_fragment>',
          '#include <map_pars_fragment>\nuniform sampler2D uOverlayTexture;\nuniform float uOverlayBlend;'
        )
        .replace(
          '#include <map_fragment>',
          '#include <map_fragment>\nvec4 overlaySample = texture2D(uOverlayTexture, vMapUv);\n' +
            'diffuseColor.rgb = mix(diffuseColor.rgb, overlaySample.rgb, uOverlayBlend * 0.3);'
        );
    };

    material.userData.overlayPatched = true;
    material.needsUpdate = true;
  }, [overlayTexture]);

  const setFacetBlend = useCallback((material, value) => {
    const uniform = material?.userData?._overlayBlend;
    if (uniform) {
      uniform.value = Math.max(0, Math.min(1, value));
    }
  }, []);

  return { isReady: !!overlayTexture, patchMaterial, setFacetBlend };
}
