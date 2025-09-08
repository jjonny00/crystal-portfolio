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
      shader.uniforms.uBlend = { value: initialBlend };
      material.userData._blendUniform = shader.uniforms.uBlend;

      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <map_fragment>",
        `
        #ifdef USE_MAP
          vec4 sampledDiffuseColor = texture2D( map, vMapUv );
          #ifdef DECODE_VIDEO_TEXTURE
            sampledDiffuseColor = vec4( mix( vec3(0.0), sampledDiffuseColor.rgb, saturate( sampledDiffuseColor.a ) ), 1.0 );
          #endif
          sampledDiffuseColor = mapTexelToLinear( sampledDiffuseColor );

          vec3 baseCol = diffuseColor.rgb;
          vec3 mappedCol = baseCol * sampledDiffuseColor.rgb;

          // 0 = base only, 1 = base*map
          diffuseColor.rgb = mix( baseCol, mappedCol, uBlend );
        #endif
        `
      );
    };

    material.needsUpdate = true;

    return () => {
      material.onBeforeCompile = null;
      delete material.userData._blendUniform;
      material.needsUpdate = true;
    };
  }, [material, initialBlend]);
}

export function setBlend(material, value) {
  const u = material?.userData?._blendUniform;
  if (u) u.value = value;
}
