// src/caseStudies/mesa/TightOpenTightPlaceholder.jsx
//
// Stand-in for the final "Tight, Open, Tight" diagram, dropped into
// FeatureSection's content slot as children. It exists to hold the right shape
// and to prove the slot works: the section takes its height from this component,
// and this component owns its own responsive behaviour.
//
// Replacing it means swapping this element for the finished diagram in
// MesaCaseStudy.jsx — no section layout changes.

import React from 'react';
import PlaceholderMedia from '../system/PlaceholderMedia';
import './mesa.css';

const STAGES = [
  { key: 'opening', label: 'Opening', note: 'One legal move' },
  { key: 'midgame', label: 'Midgame', note: 'Choice space at its widest' },
  { key: 'endgame', label: 'Endgame', note: 'Legible, contracting, decisive' },
];

const TightOpenTightPlaceholder = () => (
  <div className="mesa-arc">
    {STAGES.map((stage) => (
      <div className="mesa-arc__stage" data-stage={stage.key} key={stage.key}>
        <div className="mesa-arc__box">
          <PlaceholderMedia
            label={`Board state — ${stage.label}, with choice-space curve`}
          />
        </div>
        <p className="mesa-arc__label">
          {stage.label} — {stage.note}
        </p>
      </div>
    ))}
  </div>
);

export default TightOpenTightPlaceholder;
