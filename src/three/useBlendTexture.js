import * as THREE from "three";
import { useEffect } from "react";

/**
 * Patches MeshStandard/Physical material to blend between base color (no map)
 * and baseColor * map using uBlend (0..1).
 * Usage: useBlendTexture(material, { initialBlend: 0 })
 */
export function useBlendTexture(material, { initialBlend = 0 } = {}) {
  useEffect(() => {
    if (!material) return;

    material.onBeforeCompile = (shader) => {
      const current = material.userData._currentBlend ?? initialBlend;
      shader.uniforms.uBlend = { value: current };
      material.userData._blendUniform = shader.uniforms.uBlend;
      material.userData._currentBlend = current;

      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <clipping_planes_pars_fragment>',
          '#include <clipping_planes_pars_fragment>\nuniform float uBlend;'
        )
        .replace(
          '#include <map_fragment>',
          [
            '#ifdef USE_MAP',
            '  vec4 sampledDiffuseColor = texture2D( map, vMapUv );',
            '#ifdef DECODE_VIDEO_TEXTURE',
            '  // inline sRGB decode until browsers properly support SRGB8_ALPHA8 with video textures',
            '  sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );',
            '#endif',
            '  sampledDiffuseColor = mapTexelToLinear( sampledDiffuseColor );',
            '',
            '  vec3 baseCol = diffuseColor.rgb;',
            '  vec3 mappedCol = baseCol * sampledDiffuseColor.rgb;',
            '',
            '  // 0 = base only, 1 = base*map',
            '  diffuseColor.rgb = mix( baseCol, mappedCol, uBlend );',
            '  diffuseColor.a *= sampledDiffuseColor.a;',
            '#endif'
          ].join('\n')
        );
    };

    material.needsUpdate = true;

  return () => {
    material.onBeforeCompile = null;
    delete material.userData._blendUniform;
    delete material.userData._currentBlend;
    material.needsUpdate = true;
  };
  }, [material, initialBlend]);
}

export function setBlend(material, value) {
  const u = material?.userData?._blendUniform;
  if (u) u.value = value;
  if (material?.userData) material.userData._currentBlend = value;
}
