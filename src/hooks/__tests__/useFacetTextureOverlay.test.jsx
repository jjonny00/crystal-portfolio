import React, { useEffect } from 'react';
import * as THREE from 'three';
import { render, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { useFacetTextureOverlay } from '../useFacetTextureOverlay';

function HookComponent({ material, onReady }) {
  const { isReady, patchMaterial, setFacetBlend } = useFacetTextureOverlay();
  useEffect(() => {
    if (isReady) {
      patchMaterial(material, 'test');
      onReady(() => setFacetBlend(material, 0.5));
    }
  }, [isReady, patchMaterial, setFacetBlend, material, onReady]);
  return null;
}

describe('useFacetTextureOverlay', () => {
  it('patches material and updates blend uniform', async () => {
    const material = new THREE.MeshStandardMaterial();
    const original = material.onBeforeCompile;
    let applyBlend = () => {};

    render(<HookComponent material={material} onReady={(fn) => (applyBlend = fn)} />);

    await waitFor(() => {
      expect(material.onBeforeCompile).not.toBe(original);
    });

    const shader = {
      uniforms: {},
      fragmentShader: '#include <map_pars_fragment>\n#include <map_fragment>'
    };
    material.onBeforeCompile(shader);
    applyBlend();

    expect(shader.uniforms.uOverlayBlend.value).toBeCloseTo(0.5);
    expect(shader.uniforms.uOverlayTexture).toBeDefined();
    expect(material.userData._overlayBlend).toBe(shader.uniforms.uOverlayBlend);
    expect(shader.fragmentShader).toContain('uOverlayBlend');
    expect(shader.fragmentShader).toContain('uOverlayTexture');
  });
});
