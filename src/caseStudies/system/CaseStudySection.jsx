// src/caseStudies/system/CaseStudySection.jsx
//
// Shared wrapper for every section: full-bleed tone background, consistent page
// gutters, and consistent block spacing. Sections compose this rather than each
// re-deriving the theme or the gutter.

import React from 'react';
import { normalizeTone } from './caseStudyTheme';

const CaseStudySection = ({
  tone = 'b',
  /**
   * 'tone' paints the tone's background colour. 'none' paints nothing, so
   * whatever sits behind the case study shows through — the 3D scene, in
   * practice. Foreground colours still come from the tone either way.
   */
  background = 'tone',
  className = '',
  innerClassName = '',
  id = null,
  'aria-labelledby': ariaLabelledBy = null,
  children,
  ...rest
}) => (
  <section
    id={id || undefined}
    className={`cs-section ${className}`.trim()}
    data-tone={normalizeTone(tone)}
    data-surface={background === 'none' ? 'none' : undefined}
    aria-labelledby={ariaLabelledBy || undefined}
    {...rest}
  >
    <div className={`cs-container ${innerClassName}`.trim()}>{children}</div>
  </section>
);

export default CaseStudySection;
