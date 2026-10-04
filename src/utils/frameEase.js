// Turns a per-frame easing amount tuned at 60fps into the right amount for a
// frame of any length.
//
// The tempting form, `lerp(target, perFrame * delta * 60)`, is only safe while
// frames are short. A long frame — the first one after the tab comes back, or
// after the scene resumes from a freeze — pushes the factor past 1, and a lerp
// factor past 1 overshoots: at 3 the value lands twice as far beyond its target
// as it started short of it, and then eases back. That is how facets came back
// from far off screen after a tab switch.
//
// Compounding the per-frame amount instead gives the same motion at 60fps,
// stays correct at any frame rate, and only ever approaches 1.
export const frameEase = (perFrame, delta) =>
  1 - Math.pow(1 - Math.min(Math.max(perFrame, 0), 1), Math.max(delta, 0) * 60);
