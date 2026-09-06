// src/legibility/BackdropInkProbe.jsx
//
// The one thing backdropInk.js cannot do from outside the canvas: get at the
// frame that was just drawn.
//
// A WebGL drawing buffer is cleared once it has been handed to the compositor,
// so a readback from anywhere else in the page reads an empty buffer. R3F's
// `addAfterEffect` runs at the end of the render loop, still inside the same
// frame and after the effect composer has written the final image, which is the
// only moment the buffer holds what the reader is actually looking at.
//
// This renders nothing and touches nothing in the scene. It only reads.

import { useEffect } from 'react';
import { addAfterEffect, useThree } from '@react-three/fiber';
import { sampleBackdropInk, clearBackdropInk } from './backdropInk';

const BackdropInkProbe = ({ introRevealRef = null }) => {
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    if (!gl) return undefined;

    const unsubscribe = addAfterEffect(() => {
      // The intro fly-in is the one camera move the settle signal cannot see.
      // `settledSection` is 'hero' from the first render, so the grace window
      // opens partway into the intro and every sample after it lands on a camera
      // still in flight. A readback is a hard GPU sync, and on the PBR tiers the
      // queue it has to flush holds the full-resolution transmission pass and the
      // multisampled composer — enough to read as a hitch in a moving frame.
      // Nothing measured there is worth keeping anyway: the reveal ramp means the
      // frame is still darker than the one the copy ends up sitting on.
      if (introRevealRef && introRevealRef.current < 1) return;
      sampleBackdropInk(gl, performance.now());
    });

    return () => {
      unsubscribe();
      // The canvas remounts on a perf-profile change and on Restart. Leaving the
      // last measured inks published would hold a choice made against a scene
      // that is no longer there.
      clearBackdropInk();
    };
  }, [gl, introRevealRef]);

  return null;
};

export default BackdropInkProbe;
