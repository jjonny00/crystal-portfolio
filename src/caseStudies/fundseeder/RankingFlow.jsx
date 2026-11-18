// src/caseStudies/fundseeder/RankingFlow.jsx
//
// "One Strategy Enters Two Systems": what happens when a trader adds a
// strategy, in the overview's media slot. Two nodes, the competition and
// Signal, joined by the one connector the copy turns on — a rank can prompt a
// closer look, but review, not rank, decides selection (S).
//
// Live text throughout, so it reads at any width; one column at every size.
// Drawn from fundseederContent.js (`overview.flow`).

import React from 'react';
import './fundseeder.css';

const RankingFlow = ({ label, competition, bridge, signal }) => (
  <figure className="fs-flow">
    <figcaption className="type-subhead-sm fs-flow__label">{label}</figcaption>

    <div className="fs-flow__node">
      <p className="type-subhead-sm fs-flow__title">{competition.title}</p>
      <p className="type-body-sm">{competition.body}</p>
    </div>

    <p className="type-body-sm fs-flow__bridge">{bridge}</p>

    <div className="fs-flow__node">
      <p className="type-subhead-sm fs-flow__title">{signal.title}</p>
      <p className="type-body-sm">{signal.body}</p>
      {signal.selection && (
        <p className="type-body-sm">
          <strong className="fs-flow__term">{signal.selection.term}</strong> ·{' '}
          {signal.selection.text}
        </p>
      )}
    </div>
  </figure>
);

export default RankingFlow;
