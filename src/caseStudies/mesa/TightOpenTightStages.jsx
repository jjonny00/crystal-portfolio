// src/caseStudies/mesa/TightOpenTightStages.jsx
//
// The "Tight, Open, Tight" visual, dropped into FeatureSection's content slot as
// children. The section takes its height from this component, and this component
// owns its own responsive behaviour.
//
// Stages come from mesaContent.js like every other piece of media in the case
// study, and render through CaseStudyMedia — so each one gets lazy loading, alt
// text, aspect-ratio reservation, and a placeholder until its image exists.
// Adding artwork is a content change here too, not a change to this file.
//
// .mesa-arc__box owns each stage's shape (see mesa.css); the media fills it
// rather than imposing a ratio of its own, so the three boxes keep the widening
// and contracting proportions whether or not their artwork has arrived.

import React from 'react';
import CaseStudyMedia from '../system/CaseStudyMedia';
import './mesa.css';

const TightOpenTightStages = ({ stages = [] }) => {
  if (!stages.length) return null;

  return (
    <div className="mesa-arc">
      {stages.map((stage) => (
        <div className="mesa-arc__stage" data-stage={stage.key} key={stage.key}>
          <div className="mesa-arc__box">
            <CaseStudyMedia {...stage.media} />
          </div>
          <p className="mesa-arc__label">
            {stage.label} — {stage.note}
          </p>
        </div>
      ))}
    </div>
  );
};

export default TightOpenTightStages;
