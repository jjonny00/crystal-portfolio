// src/components/three/heroOrbitPress.js
//
// The hero's current press, as the hero drag orbit (UnifiedCameraController) saw
// it. The drag is the only writer; HeroCrystalTap reads it to tell a tap from a
// drag by the drag's own decision, rather than by a second set of thresholds
// that could disagree with it.
//
//   time     : the press's pointerdown timeStamp
//   mouse    : pressed with a mouse (false for touch and pen)
//   moved    : travelled far enough to become a drag, or was handed to the page
//              scroll, or ended any way but a pointerup
//   coasting : the crystal was still turning from a fling when pressed
//   intro    : the camera's intro was running (or held) when pressed

// Below this (rad/s) a fling has settled enough that a press is a fresh tap, not
// a catch. The fling decays as exp(-2.6 t), so a full-speed one passes it in
// about 1.5s.
export const HERO_ORBIT_COASTING_RAD_PER_S = 0.05;

export const heroOrbitPress = { current: null };
