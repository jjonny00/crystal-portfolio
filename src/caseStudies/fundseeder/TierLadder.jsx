// src/caseStudies/fundseeder/TierLadder.jsx
//
// The tier ladder, dropped into the tiers FeatureSection as children. D through
// A climb a staircase of performance; a review gate stands between A and S, and
// S sits on the top step on its own, under "Selection" rather than
// "Performance" — the one distinction the section's copy turns on.
//
// The badges are the product's own, cut from the tier cards (see
// assets/README.md); the steps, gate and phase brackets are drawn here so the
// labels stay live type. The whole ladder is one image to assistive tech: its
// `alt` comes from the content file like any other media, and the parts inside
// are decorative.
//
// One layout at every width. Six columns fit a phone once the badges and risers
// scale with the viewport, so the ladder never has to turn on its side and lose
// the climb it exists to show.

import React from 'react';
import './fundseeder.css';

const TierLadder = ({ steps = [], gate = 'Review', phases = {}, alt = '' }) => {
  if (!steps.length) return null;

  const performance = steps.filter((step) => step.phase === 'performance');
  const selection = steps.filter((step) => step.phase === 'selection');

  const renderStep = (step, rise) => (
    <div
      className="fs-ladder__step"
      data-phase={step.phase}
      style={{ '--fs-rise': rise }}
      key={step.key}
    >
      <img className="fs-ladder__badge" src={step.src} alt="" decoding="async" loading="lazy" />
      <div className="fs-ladder__riser" />
    </div>
  );

  return (
    <div className="fs-ladder" role="img" aria-label={alt}>
      <p
        className="type-caption-caps fs-ladder__phase"
        style={{ gridColumn: `1 / span ${performance.length}` }}
      >
        {phases.performance}
      </p>
      <p
        className="type-caption-caps fs-ladder__phase"
        style={{ gridColumn: `${performance.length + 2} / span ${selection.length}` }}
      >
        {phases.selection}
      </p>

      {performance.map((step, index) => renderStep(step, index + 1))}

      <div className="fs-ladder__gate">
        <span className="type-caption-caps fs-ladder__gate-label">{gate}</span>
      </div>

      {selection.map((step) => renderStep(step, performance.length + 1))}
    </div>
  );
};

export default TierLadder;
