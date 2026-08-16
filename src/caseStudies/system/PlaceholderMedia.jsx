// src/caseStudies/system/PlaceholderMedia.jsx
//
// Stands in for artwork that has not been supplied yet. It fills the exact box
// the real media will occupy, so swapping it out later is a content change
// (`src` on the media prop) and never a layout change.
//
// The expected asset is always announced to assistive tech, and shown on screen
// in dev builds so unfinished media is obvious while a case study is in
// progress.

import React from 'react';

const PlaceholderMedia = ({ label }) => {
  const description = label || 'Placeholder — final media pending';

  return (
    <div className="cs-placeholder" role="img" aria-label={description}>
      <svg
        className="cs-placeholder__svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <rect x="0" y="0" width="100" height="100" className="cs-placeholder__x" />
        <line x1="0" y1="0" x2="100" y2="100" className="cs-placeholder__x" />
        <line x1="100" y1="0" x2="0" y2="100" className="cs-placeholder__x" />
      </svg>
      {import.meta.env.DEV && (
        <span className="cs-placeholder__label">{description}</span>
      )}
    </div>
  );
};

export default PlaceholderMedia;
