import { useThree } from '@react-three/fiber';

/**
 * Convert CSS pixels to world units at Z=0.
 * - px(n): map n CSS px to world units.
 * - pxDPR(n): map n physical device px to world units (rarely needed).
 *
 * The px→world reference is a FIXED world height, deliberately DECOUPLED from the
 * live camera. It used to freeze `viewport.height` at mount, but `viewport.height`
 * scales with camera distance and the Canvas mounts at the intro camera pose — so
 * every time the intro start was retuned (or zoomed out), the frozen reference moved
 * and every px-sized element (center glow, dust) silently rescaled. Pinning the
 * reference removes that coupling: the elements keep the size they were authored
 * against regardless of the intro framing.
 *
 * The value is the viewport height at the original intro mount distance (~2.26 world
 * units from origin) with the 45° camera — i.e. what these elements were tuned for.
 * `size.height` stays live so a genuine window resize still maps a CSS pixel to a
 * constant on-screen size.
 */
const PX_REFERENCE_DISTANCE = 2.26; // original intro mount distance to origin (world units)
const CAMERA_FOV_DEG = 45;          // config.camera.fov
const PX_REFERENCE_HEIGHT = 2 * Math.tan((CAMERA_FOV_DEG * Math.PI / 180) / 2) * PX_REFERENCE_DISTANCE; // ≈ 1.872

export function usePxToWorld() {
  const { size, gl } = useThree();
  const dpr = gl.getPixelRatio();

  // world units per 1 CSS pixel at Z=0
  const worldPerPx = PX_REFERENCE_HEIGHT / size.height;

  const px = (n) => n * worldPerPx;            // CSS px → world units
  const pxDPR = (n) => n * dpr * worldPerPx;   // device px → world units

  return { px, pxDPR, worldPerPx, dpr };
}
