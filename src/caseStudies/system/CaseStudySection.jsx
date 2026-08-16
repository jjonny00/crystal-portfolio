// src/caseStudies/system/CaseStudySection.jsx
//
// Shared wrapper for every section: full-bleed tone background, consistent page
// gutters, and consistent block spacing. Sections compose this rather than each
// re-deriving the theme or the gutter.

import React from 'react';
import { normalizeTone } from './caseStudyTheme';

const CaseStudySection = ({
  tone = 'b',
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
    aria-labelledby={ariaLabelledBy || undefined}
    {...rest}
  >
    <div className={`cs-container ${innerClassName}`.trim()}>{children}</div>
  </section>
);

export default CaseStudySection;
