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

      shader.uniforms.uOverlayTexture = { value: texture };

      if (!shader.fragmentShader.includes('uniform sampler2D uOverlayTexture')) {
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <uv_pars_fragment>',
          '#include <uv_pars_fragment>\nuniform sampler2D uOverlayTexture;\nuniform float uBlend;'
        );
      }

      if (!shader.fragmentShader.includes('// TEXTURE_BLEND_PATCH')) {
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <map_fragment>',
          '#include <map_fragment>\n// TEXTURE_BLEND_PATCH\nvec3 overlayCol = texture2D(uOverlayTexture, vUv).rgb;\ndiffuseColor.rgb = mix(diffuseColor.rgb, overlayCol, uBlend * 0.3);'
        );
      }
    };

    material.needsUpdate = true;
    patchedRef.current = true;

    return () => {
      material.onBeforeCompile = originalOnBeforeCompile;
      delete material.userData._blendUniform;
      material.needsUpdate = true;
      patchedRef.current = false;
    };
  }, [material, texture, initialBlend]);
}

export function setBlend(material, value) {
  const uniform = material?.userData?._blendUniform;
  if (uniform) {
    uniform.value = THREE.MathUtils.clamp(value, 0, 1);
  }
}
