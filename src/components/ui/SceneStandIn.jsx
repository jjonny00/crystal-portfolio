// src/components/ui/SceneStandIn.jsx
//
// The project's sky, painted where the 3D scene will be, for a case study opened
// from its own URL before the scene has loaded. Its transparent sections show
// the scene through them, and without this they would show the bare page ground
// and then brighten all at once when the crystal arrived. Rendered by the
// prerender too, so the first paint and the app's takeover match.

import React from 'react';
import { projectBackgrounds } from '../../data/projectBackgrounds';
import { OVERLAY_Z_INDEX } from '../../caseStudies/CaseStudyOverlay';

export const SCENE_STAND_IN_FADE_MS = 1400;

const SceneStandIn = ({ projectId, fading = false }) => {
  const sky = projectBackgrounds[projectId] || projectBackgrounds.default;
  return (
    <div
      aria-hidden="true"
      data-scene-stand-in=""
      style={{
        // Absolute, not fixed, and that matters. iOS 26 Safari tints its
        // status and tool bars from any position:fixed element spanning the top
        // edge (it ignores theme-color), so a fixed sky here turned the top of
        // the phone the project's colour on every deep link. The document never
        // scrolls (body is overflow:hidden; the portfolio and the case study
        // scroll inside their own layers), so absolute sits exactly where fixed
        // would: against #root (position:relative, min-height:100vh) in the
        // app, against the initial containing block in the prerendered page.
        // inset rather than a height of its own, so it never makes #root
        // taller than the viewport and gives the document something to scroll.
        position: 'absolute',
        inset: 0,
        // Directly under the case study, over everything else. (The canvas and
        // content layers are fixed, but z-index orders across positioning
        // schemes within the same stacking context, so this still covers them.)
        zIndex: OVERLAY_Z_INDEX - 1,
        pointerEvents: 'none',
        background: `linear-gradient(to top, ${sky.colorA}, ${sky.colorB})`,
        opacity: fading ? 0 : 1,
        transition: `opacity ${SCENE_STAND_IN_FADE_MS}ms ease`,
      }}
    />
  );
};

export default SceneStandIn;
