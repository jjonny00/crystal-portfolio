// src/lib/introTimeline.js
//
// The camera intro's clock, shared with the DOM so copy can be timed against the
// camera move (see HeroSection). UnifiedCameraController is the only writer:
//
//   pending : the intro has not started; behind the loader its clock is held
//   running : from the intro's first unheld frame; startedAt is that frame's
//             performance.now() time
//   done    : the intro landed or was cut short, or this visit has none (a deep
//             link arrives in place)
//
// A Restart remounts the camera controller, which sets it back to pending.

export const INTRO_DURATION_MS = 4400;

let snapshot = { phase: 'pending', startedAt: null };
const listeners = new Set();

export const getIntroTimeline = () => snapshot;

export const setIntroTimeline = (phase, startedAt = null) => {
  if (snapshot.phase === phase && snapshot.startedAt === startedAt) return;
  snapshot = { phase, startedAt };
  listeners.forEach((listener) => listener());
};

export const subscribeIntroTimeline = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
