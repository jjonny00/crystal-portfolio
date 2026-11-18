// src/caseStudies/fundseeder/NextStepComposition.jsx
//
// "The Next Rival Matters More Than First Place": the two scales of a trader's
// next step in FeatureSection's stage — the tier ladder (D–A by performance, S
// held apart by review) above the dashboard's ranking card (the seven positions
// around the trader, and the route into the full leaderboard).
//
// The ladder is drawn by TierLadder.jsx and keeps one layout at every width.
// The ranking card is the actual dashboard card, centred at the width its rows
// read at.

import React from 'react';
import CaseStudyMedia from '../system/CaseStudyMedia';
import TierLadder from './TierLadder';
import './fundseeder.css';

const NextStepComposition = ({ ladder, rivals }) => (
  <div className="fs-next">
    {ladder && (
      <div className="fs-next__ladder">
        <TierLadder {...ladder} />
      </div>
    )}
    {rivals && <CaseStudyMedia className="fs-next__rivals" fit="contain" expandable {...rivals} />}
  </div>
);

export default NextStepComposition;
