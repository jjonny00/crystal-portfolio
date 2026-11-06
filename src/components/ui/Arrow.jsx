// src/components/ui/Arrow.jsx
//
// The site's arrow: the hero CTA's (HeroSection), straight strokes with square
// ends and an open chevron head, turned to point any way. Drawn in the text's
// colour (currentColor) and sized by its container (CSS), so one shape serves
// a 16px link and a headline alike, its strokes in proportion.
//
// The hero's own arrow stays inline there: it is the vertical line's anchor and
// is measured at its exact 19 x 21 box.

import React from 'react';

// The hero arrow's path, pointing down, in its 19 x 21 box.
const DOWN_PATH = 'M1.0625 10.3394L10.5601 19.8388M17.9413 10.3395L8.44279 19.838M9.50194 0V19';

// Turned about the middle of a square box, so it fits pointing any way.
const ROTATION = { down: 0, left: 90, up: 180, right: -90 };

const Arrow = ({ direction = 'right', className, style }) => (
  <svg
    className={className}
    style={style}
    viewBox="-1 -0.5 21 21"
    fill="none"
    overflow="visible"
    aria-hidden="true"
    focusable="false"
  >
    <path
      d={DOWN_PATH}
      transform={`rotate(${ROTATION[direction] ?? 0} 9.5 10)`}
      stroke="currentColor"
      strokeWidth="3"
    />
  </svg>
);

export default Arrow;
