import { useRef } from 'react';
import { useThree } from '@react-three/fiber';

/**
 * Convert CSS pixels to world units at Z=0 using the current viewport.
 * Works for perspective and orthographic cameras.
 * - px(n): map n CSS px to world units (DPR-aware via size/viewport).
 * - pxDPR(n): map n physical device px to world units (rarely needed).
 *
 * NOTE: `viewport.height` is camera-distance-dependent and is re-snapshotted by
 * react-three-fiber on every resize using whatever distance the camera is at
 * that instant. If we used it live, a resize (or a mobile address-bar
 * show/hide while scrolling) taken while the camera is far from origin would
 * inflate any px-sized element (e.g. the orb glow and dust particles). We
 * therefore freeze the reference height to its mount-time value and keep
 * `size.height` live, so a genuine resize still maps a CSS pixel to a constant
 * on-screen size without picking up the transient camera distance.
 */
export function usePxToWorld() {
  const { size, viewport, gl } = useThree();
  const dpr = gl.getPixelRatio();

  const refHeightRef = useRef(null);
  if (refHeightRef.current == null && viewport.height > 0) {
    refHeightRef.current = viewport.height;
  }
  const referenceHeight = refHeightRef.current ?? viewport.height;

  // world units per 1 CSS pixel at Z=0
  const worldPerPx = referenceHeight / size.height;

  const px = (n) => n * worldPerPx;            // CSS px → world units
  const pxDPR = (n) => n * dpr * worldPerPx;   // device px → world units

  return { px, pxDPR, worldPerPx, dpr };
}
