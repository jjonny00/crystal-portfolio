import { useMemo } from 'react';
import { useThree } from '@react-three/fiber';

/**
 * Convert CSS pixels to world units at Z=0 using the current viewport.
 * Works for perspective and orthographic cameras.
 * - px(n): map n CSS px to world units (DPR-aware via size/viewport).
 * - pxDPR(n): map n physical device px to world units (rarely needed).
 */
export function usePxToWorld() {
  const { size, viewport, gl } = useThree();
  const dpr = gl.getPixelRatio();

  // world units per 1 CSS pixel at Z=0
  const worldPerPx = useMemo(
    () => viewport.height / size.height,
    [viewport.height, size.height]
  );

  const px = (n) => n * worldPerPx;            // CSS px → world units
  const pxDPR = (n) => (n / dpr) * worldPerPx; // device px → world units

  return { px, pxDPR, worldPerPx, dpr };
}
