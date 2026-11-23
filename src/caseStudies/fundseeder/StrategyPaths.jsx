// src/caseStudies/fundseeder/StrategyPaths.jsx
//
// "One Strategy Enters Two Systems", drawn: a trader adds a strategy, the path
// splits into the competition and Signal's review, one link runs across (a
// rank can prompt a closer look), and the two meet at S. The shape alone
// should read: split, one link across, merge.
//
// Live SVG, so its labels are text. Two drawings of the same diagram: across
// on desktop, stacked on phones, each drawn at about the size it is shown so
// the labels stay at caption size or larger. Thick strokes in two colours: the
// section's ink (the accent) for the paths and S, and a neutral for the boxes.
// Labels come from fundseederContent.js (`overview.paths`).

import React, { useId } from 'react';
import './fundseeder.css';

const ArrowHead = ({ id }) => (
  <marker id={id} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
    <path d="M0 0 L10 5 L0 10 Z" fill="currentColor" />
  </marker>
);

const Lines = ({ x, y, lines, className, step = 20, anchor = 'start' }) =>
  lines.map((line, index) => (
    <text key={line} x={x} y={y + index * step} className={className} textAnchor={anchor}>
      {line}
    </text>
  ));

// Desktop: left to right.
const Across = ({ paths, arrow, dashArrow }) => (
  <svg className="fs-paths__svg fs-paths__svg--across" viewBox="0 0 860 316" aria-hidden="true" focusable="false">
    <defs>
      <ArrowHead id={arrow} />
      <ArrowHead id={dashArrow} />
    </defs>

    {/* The start, and the split. */}
    <rect className="fs-paths__node" x="2" y="130" width="166" height="56" rx="28" />
    <text className="type-subhead-sm fs-paths__title" x="85" y="164" textAnchor="middle">
      {paths.start}
    </text>
    <path className="fs-paths__line" d="M168 158 H196 M196 72 V243 M196 72 H226 M196 243 H226" />
    <path className="fs-paths__line" d="M226 72 H234 M226 243 H234" markerEnd={`url(#${arrow})`} />

    {/* The two systems. */}
    <rect className="fs-paths__node" x="238" y="30" width="250" height="86" rx="10" />
    <text className="type-subhead-sm fs-paths__title" x="258" y="64">{paths.competition.title}</text>
    <Lines x={258} y={90} lines={paths.competition.lines} className="type-caption fs-paths__label" />

    <rect className="fs-paths__node" x="238" y="184" width="250" height="118" rx="10" />
    <text className="type-subhead-sm fs-paths__title" x="258" y="218">{paths.review.title}</text>
    <Lines x={258} y={244} lines={paths.review.lines} className="type-caption fs-paths__label" />

    {/* The one link across. */}
    <path className="fs-paths__line fs-paths__line--link" d="M363 116 V176" markerEnd={`url(#${dashArrow})`} />
    <Lines x={378} y={142} lines={paths.link} className="type-caption fs-paths__link-label" step={18} />

    {/* The merge at S. */}
    <path className="fs-paths__line" d="M488 73 H600 Q640 73 650 112 L656 128" markerEnd={`url(#${arrow})`} />
    <path className="fs-paths__line" d="M488 243 H600 Q640 243 650 200 L656 181" markerEnd={`url(#${arrow})`} />
    <circle className="fs-paths__s" cx="676" cy="158" r="30" />
    <text className="type-subhead-sm fs-paths__s-mark" x="676" y="165" textAnchor="middle">
      {paths.merge.mark}
    </text>
    <Lines x={720} y={152} lines={paths.merge.lines} className="type-caption fs-paths__label" />
  </svg>
);

// Phones: down the page, the two systems side by side.
const Stacked = ({ paths, arrow, dashArrow }) => (
  <svg className="fs-paths__svg fs-paths__svg--stacked" viewBox="0 0 360 470" aria-hidden="true" focusable="false">
    <defs>
      <ArrowHead id={arrow} />
      <ArrowHead id={dashArrow} />
    </defs>

    <rect className="fs-paths__node" x="95" y="2" width="170" height="46" rx="23" />
    <text className="type-subhead-sm fs-paths__title" x="180" y="31" textAnchor="middle">
      {paths.start}
    </text>
    <path className="fs-paths__line" d="M180 48 V66 M90 66 H270 M90 66 V76 M270 66 V76" />
    <path className="fs-paths__line" d="M90 76 V80 M270 76 V80" markerEnd={`url(#${arrow})`} />

    <rect className="fs-paths__node" x="4" y="84" width="168" height="124" rx="10" />
    <text className="type-subhead-sm fs-paths__title" x="16" y="112">{paths.competition.title}</text>
    <Lines x={16} y={138} lines={paths.competition.lines} className="type-caption fs-paths__label" />

    <rect className="fs-paths__node" x="188" y="84" width="168" height="124" rx="10" />
    <text className="type-subhead-sm fs-paths__title" x="200" y="112">{paths.review.title}</text>
    <Lines x={200} y={138} lines={paths.review.lines} className="type-caption fs-paths__label" step={20} />

    {/* The link across, under the two boxes. */}
    <path className="fs-paths__line fs-paths__line--link" d="M120 208 V226 H240 V214" markerEnd={`url(#${dashArrow})`} />
    <Lines x={180} y={250} lines={paths.link} className="type-caption fs-paths__link-label" step={18} anchor="middle" />

    <path className="fs-paths__line" d="M36 208 V318 Q36 338 56 338 H138" markerEnd={`url(#${arrow})`} />
    <path className="fs-paths__line" d="M324 208 V318 Q324 338 304 338 H222" markerEnd={`url(#${arrow})`} />
    <circle className="fs-paths__s" cx="180" cy="338" r="30" />
    <text className="type-subhead-sm fs-paths__s-mark" x="180" y="345" textAnchor="middle">
      {paths.merge.mark}
    </text>
    <Lines x={180} y={396} lines={paths.merge.lines} className="type-caption fs-paths__label" anchor="middle" />
  </svg>
);

const StrategyPaths = ({ label, description, ...paths }) => {
  const id = useId().replace(/:/g, '');
  return (
    <figure className="fs-paths" role="img" aria-label={description}>
      <figcaption className="type-subhead-sm fs-paths__caption">{label}</figcaption>
      <Across paths={paths} arrow={`${id}a`} dashArrow={`${id}b`} />
      <Stacked paths={paths} arrow={`${id}c`} dashArrow={`${id}d`} />
    </figure>
  );
};

export default StrategyPaths;
