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

      if (!/uniform\s+float\s+uBlend/.test(shader.fragmentShader)) {
        shader.fragmentShader = shader.fragmentShader.replace(
          "void main() {",
          "uniform float uBlend;\nvoid main() {"
        );
      }

      if (!shader.fragmentShader.includes('// TEXTURE_BLEND_PATCH')) {
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <map_fragment>",
          `
          // TEXTURE_BLEND_PATCH
          vec3 baseCol = diffuseColor.rgb;
          #include <map_fragment>
          diffuseColor.rgb = mix( baseCol, sampledDiffuseColor.rgb, uBlend );
          diffuseColor.a *= sampledDiffuseColor.a;
          `
        );
      }
    };

    material.map = texture;
    material.userData.blendCurrent = initialBlend;
    setBlend(material, initialBlend);
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
