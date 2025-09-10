import React from 'react';
import * as THREE from 'three';
import { render, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { useBlendTexture, setBlend } from '../useBlendTexture';

function HookComponent({ material, texture }) {
  useBlendTexture(material, texture, { initialBlend: 0.5 });
  return null;
}

describe('useBlendTexture', () => {
  it('patches material and updates blend uniform', async () => {
    const material = new THREE.MeshStandardMaterial();
    const texture = new THREE.Texture();
    const original = material.onBeforeCompile;

    render(<HookComponent material={material} texture={texture} />);

    await waitFor(() => {
      expect(material.onBeforeCompile).not.toBe(original);
    });

    const shader = { uniforms: {}, fragmentShader: '#include <map_fragment>' };
    material.onBeforeCompile(shader);

    expect(shader.uniforms.uBlend.value).toBeCloseTo(0.5);
    expect(material.userData._blendUniform).toBe(shader.uniforms.uBlend);
    expect(material.map).toBe(texture);
    expect(shader.fragmentShader).toContain('TEXTURE_BLEND_PATCH');

    setBlend(material, 0.3);
    expect(shader.uniforms.uBlend.value).toBeCloseTo(0.3);
  });

  it('cleans up on unmount', async () => {
    const material = new THREE.MeshStandardMaterial();
    const texture = new THREE.Texture();
    const original = material.onBeforeCompile;

    const { unmount } = render(
      <HookComponent material={material} texture={texture} />
    );

    await waitFor(() => {
      expect(material.onBeforeCompile).not.toBe(original);
    });

    unmount();

    expect(material.onBeforeCompile).toBe(original);
    expect(material.map).toBeNull();
    expect(material.userData._blendUniform).toBeUndefined();
  });
});

