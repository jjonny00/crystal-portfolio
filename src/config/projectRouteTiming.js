// src/config/projectRouteTiming.js
//
// The four moves between the index, a selected project and its case study, as
// timed moves rather than the camera's open-ended chase: how long each takes,
// how the camera and its look target ease, and when the copy waiting at the
// other end comes in.
//
// Read by the camera (camera/projectRouteMove.js, written from
// UnifiedCameraController), the scene (the selected fragment's turn), the
// project copy (ProjectFocusSection), the index labels (FacetLabels) and the
// case study's entrance (caseStudies/transitionTiming.js), so they all run off
// one clock (lib/projectRouteClock.js) and these numbers.
//
// Shares are of the move's time. Routine project moves stay well short of the
// hero transformations (the index → hero return is 2.4s).

// An ease drawn as its speed, t^a·(1−t)^b: off rest and back to rest, with the
// peak at a/(a+b) of the time. A larger b is a longer, softer landing. The same
// family as the hero moves' smoothGlide, with fractional powers, so it is
// integrated once into a table.
const glide = (a, b, samples = 512) => {
  const table = new Float64Array(samples + 1);
  for (let i = 1; i <= samples; i += 1) {
    const x = (i - 0.5) / samples;
    table[i] = table[i - 1] + (x ** a) * ((1 - x) ** b);
  }
  const total = table[samples];
  return (t) => {
    if (!(t > 0)) return 0;
    if (t >= 1) return 1;
    const x = t * samples;
    const i = Math.floor(x);
    return (table[i] + (table[i + 1] - table[i]) * (x - i)) / total;
  };
};

export const PROJECT_ROUTES = Object.freeze({
  // Into a project from the index. The camera leaves at once (the click should
  // feel answered) and lands softly: 50% of the way by ~0.38s, 90% by ~0.7s,
  // 99% by ~0.93s. The look target runs a little ahead, so the fragment is
  // framed before the dolly settles. The copy starts as the dolly enters its
  // last 10%, on a frame that is no longer sweeping.
  overviewToProject: {
    from: 'overview',
    to: 'project',
    durationMs: 1200,
    dollyEase: glide(1, 3),
    framingEase: glide(1, 3.6),
    contentAt: 0.58,
  },
  // Into the case study: a push into the fragment from rest, ~90% by 0.73s.
  // The case study's title starts just before the fragment finishes opening on
  // to its colour (the artwork cut-out, useFacetOverlayGeometry, done by
  // ~0.75s), so it is legible as the colour resolves; the rest close behind.
  projectToCaseStudy: {
    from: 'project',
    to: 'caseStudy',
    durationMs: 1100,
    dollyEase: glide(2, 3),
    framingEase: glide(2, 3),
    contentAt: 0.55,
  },
  // Back out of the case study: a short settle back from the close-up while
  // the page fades off it (CASE_STUDY_RETURN_EXIT_MS), the project's copy
  // returning as the framing settles.
  caseStudyToProject: {
    from: 'caseStudy',
    to: 'project',
    durationMs: 850,
    dollyEase: glide(2, 3),
    framingEase: glide(2, 3),
    contentAt: 0.5,
  },
  // Back to the index: a withdrawal that gathers speed, peaking ~0.6s in, and
  // lands over the second half (90% by 1s). The look target hands over a touch
  // later than the dolly, so the fragment is drawn back from before the frame
  // swings to the index. The labels come in once the fragment is mostly clear
  // of their column.
  projectToOverview: {
    from: 'project',
    to: 'overview',
    durationMs: 1500,
    dollyEase: glide(2, 3),
    framingEase: glide(2.4, 2.8),
    contentAt: 0.6,
  },
});

/** The route between two camera states, or null if the move is not one of these. */
export const projectRouteBetween = (fromState, toState) => {
  for (const [route, timing] of Object.entries(PROJECT_ROUTES)) {
    if (timing.from === fromState && timing.to === toState) return route;
  }
  return null;
};
