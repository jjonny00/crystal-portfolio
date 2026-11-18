// src/caseStudies/flying-axes/GameModesComparison.jsx
//
// "Coaches Invented Games. We Changed the App.": the two formats as steps —
// the official game and freeform — answering one question, who decides when
// play ends. Then the original Twenty-One rules card from the coaches'
// booklet, the variation the copy names.
//
// Live text, so it reads at any width: side by side on desktop, stacked on
// narrow screens. Drawn from flyingAxesContent.js (`freeform.formats`).

import React from 'react';
import CaseStudyMedia from '../system/CaseStudyMedia';
import './flyingAxes.css';

const GameModesComparison = ({ label, modes = [], booklet = null }) => (
  <div className="fa-modes">
    <figure className="fa-modes__figure">
      <figcaption className="type-subhead-sm fa-modes__label">{label}</figcaption>
      <div className="fa-modes__pair">
        {modes.map((mode) => (
          <div className="fa-modes__mode" data-mode={mode.key} key={mode.key}>
            <p className="type-subhead-sm fa-modes__title">{mode.title}</p>
            <ol className="type-body-sm fa-modes__steps">
              {mode.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </figure>

    {booklet && (
      <CaseStudyMedia className="fa-modes__booklet" fit="contain" expandable {...booklet} />
    )}
  </div>
);

export default GameModesComparison;
