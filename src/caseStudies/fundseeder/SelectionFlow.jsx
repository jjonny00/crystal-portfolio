// src/caseStudies/fundseeder/SelectionFlow.jsx
//
// The "Competition Needs a Destination" diagram, dropped into the
// SequenceSection stage as children: the five stages of the pipeline in the
// middle, what the participant sees running above them, and what Signal does
// with the same strategy running below.
//
// The public lane breaks at Review on purpose. Review happens out of sight; the
// participant next sees the outcome, as an S tier. Signal runs the whole length,
// because every strategy enters it on joining.
//
// One grid, two orientations. On desktop the stages are columns and the lanes
// are rows; on phones that transposes, stages down the page and the lanes either
// side of them. Each cell carries its stage (and span) as custom properties, and
// the stylesheet picks which axis they place it on — so the markup and the
// content have only one order, and screen readers get it as a list either way.

import React from 'react';
import './fundseeder.css';

const cellStyle = (stage, span = 1) => ({
  '--fs-col': stage,
  '--fs-row': stage + 1,
  '--fs-span': span,
});

const Lane = ({ lane, cells }) => {
  // Every stage the lane covers, spans included.
  const covered = new Set(
    cells.flatMap((cell) =>
      Array.from({ length: cell.span || 1 }, (_, offset) => cell.stage + offset)
    )
  );

  return cells.map((cell) => {
    const span = cell.span || 1;
    return (
      <p
        key={`${lane}-${cell.stage}`}
        className="type-body-sm fs-flow__cell"
        data-lane={lane}
        // A band reads as continuous across neighbouring cells, so only its
        // outermost ends are rounded.
        data-band-start={covered.has(cell.stage - 1) ? undefined : ''}
        data-band-end={covered.has(cell.stage + span) ? undefined : ''}
        style={cellStyle(cell.stage, span)}
      >
        {cell.text}
      </p>
    );
  });
};

const SelectionFlow = ({ stages = [], lanes = {}, publicCells = [], signalCells = [] }) => {
  if (!stages.length) return null;

  return (
    <div className="fs-flow" style={{ '--fs-stages': stages.length }}>
      <p className="type-caption-caps fs-flow__lane-label" data-lane="public">
        {lanes.public}
      </p>
      <p className="type-caption-caps fs-flow__lane-label" data-lane="signal">
        {lanes.signal}
      </p>

      <Lane lane="public" cells={publicCells} />

      <ol className="fs-flow__stages">
        {stages.map((stage, index) => (
          <li
            key={stage}
            className="fs-flow__stage"
            data-first={index === 0 ? '' : undefined}
            data-last={index === stages.length - 1 ? '' : undefined}
            style={cellStyle(index + 1)}
          >
            <span className="fs-flow__dot" aria-hidden="true" />
            <span className="type-subhead-sm fs-flow__stage-label">{stage}</span>
          </li>
        ))}
      </ol>

      <Lane lane="signal" cells={signalCells} />
    </div>
  );
};

export default SelectionFlow;
