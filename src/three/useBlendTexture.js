import * as THREE from "three";
import { useEffect, useRef } from "react";

export function useBlendTexture(material, texture, { initialBlend = 0 } = {}) {
  const patchedRef = useRef(false);

  useEffect(() => {
    if (!material || !texture || patchedRef.current) return;

    const originalOnBeforeCompile = material.onBeforeCompile;

    material.onBeforeCompile = (shader) => {
      if (originalOnBeforeCompile) {
        originalOnBeforeCompile(shader);
      }

      if (!shader.uniforms.uBlend) {
        shader.uniforms.uBlend = { value: initialBlend };
        material.userData._blendUniform = shader.uniforms.uBlend;
      }

      if (!shader.fragmentShader.includes('uniform float uBlend')) {
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <map_pars_fragment>',
          '#include <map_pars_fragment>\nuniform float uBlend;'
        );
      }

      if (!shader.fragmentShader.includes('// TEXTURE_BLEND_PATCH')) {
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <map_fragment>",
          `\n          // TEXTURE_BLEND_PATCH\n          #ifdef USE_MAP\n            vec4 sampledDiffuseColor = texture2D( map, vMapUv );\n            #ifdef DECODE_VIDEO_TEXTURE\n              sampledDiffuseColor = vec4( mix( vec3(0.0), sampledDiffuseColor.rgb, saturate( sampledDiffuseColor.a ) ), 1.0 );\n            #endif\n            sampledDiffuseColor = mapTexelToLinear( sampledDiffuseColor );\n\n            vec3 baseCol = diffuseColor.rgb;\n            vec3 mappedCol = baseCol * sampledDiffuseColor.rgb;\n            diffuseColor.rgb = mix( baseCol, mappedCol, uBlend );\n          #endif\n          `
        );
      }
    };

    material.map = texture;
    material.needsUpdate = true;
    patchedRef.current = true;

    return () => {
      material.onBeforeCompile = originalOnBeforeCompile;
      material.map = null;
      delete material.userData._blendUniform;
      material.needsUpdate = true;
      patchedRef.current = false;
    };
  }, [material, texture, initialBlend]);
}

export function setBlend(material, value) {
  const uniform = material?.userData?._blendUniform;
  if (uniform) {
    uniform.value = Math.max(0, Math.min(1, value));
  }
}
