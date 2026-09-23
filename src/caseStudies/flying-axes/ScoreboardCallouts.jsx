// src/caseStudies/flying-axes/ScoreboardCallouts.jsx
//
// The scoreboard close-up with four restrained callouts, dropped into a
// MediaGallery item as children. The image still renders through CaseStudyMedia
// (lazy loading, ratio reservation, enlargement); this component only lays the
// annotations over it.
//
// Two compositions from one markup, switched on the component's own width
// rather than the viewport — it lives in one cell of a 2-up, so the viewport
// says little about how much room it has (see flyingAxes.css):
//   wide   — a label tag at the image edge, a leader line in to the point;
//   narrow — a numbered tag just beside the point, and a legend underneath.
//
// The annotations are visual only. The image's alt text names all four, so
// assistive tech gets them once, from the image, rather than three times.

import React from 'react';
import CaseStudyMedia from '../system/CaseStudyMedia';
import './flyingAxes.css';

const ScoreboardCallouts = ({ media, callouts = [] }) => (
  <div className="fa-callouts">
    <div className="fa-callouts__figure">
      <CaseStudyMedia {...media} expandable />

      <ol className="fa-callouts__marks" aria-hidden="true">
        {callouts.map((callout, index) => (
          <li
            key={callout.key}
            className="fa-callout"
            data-side={callout.side === 'right' ? 'right' : 'left'}
            style={{ '--fa-x': callout.x, '--fa-y': callout.y }}
          >
            <span className="fa-callout__tag">
              <span className="fa-callout__number">{index + 1}</span>
              <span className="fa-callout__label">{callout.label}</span>
            </span>
            <span className="fa-callout__line" />
            <span className="fa-callout__point" />
          </li>
        ))}
      </ol>
    </div>

    <ol className="fa-callouts__legend" aria-hidden="true">
      {callouts.map((callout, index) => (
        <li key={callout.key}>
          <span className="fa-callout__number">{index + 1}</span>
          {callout.label}
        </li>
      ))}
    </ol>
  </div>
);

export default ScoreboardCallouts;
