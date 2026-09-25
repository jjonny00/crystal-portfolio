// src/caseStudies/ge-experience-centers/ApproachDiagram.jsx
//
// One state of the approach interaction, drawn for the case study: the display
// wall in elevation with its row of content blocks, the sensors along its base,
// the detection zone they cover, and a visitor either outside it (state
// "readable") or inside it in front of a block that has expanded (state
// "approach"). Two of these sit in a MediaRail after the Dubai wall photo, and
// each has to make sense on its own, since a phone shows one at a time.
//
// Retrospective and deliberately abstract. The dots along the base read as a
// row, not a count; the zone's scalloped edge says "overlapping cones" without
// an angle; nothing is to scale. None of it should be read as the installed
// geometry, and the rail's caption says so.
//
// Geometry is SVG in a fixed 400×360 box. The labels are HTML over it, placed
// in percentages of that same box, so they keep the system's type sizes while
// the drawing scales with the rail — the rail fixes the height (see
// geExperienceCenters.css), the ratio fixes the width, and the percentages
// line up exactly. Leaders are drawn in the SVG, from the point being labelled
// to where its chip begins.

import React from 'react';
import './geExperienceCenters.css';

const VIEW_W = 400;
const VIEW_H = 360;

const WALL = { x: 16, y: 52, w: 368, h: 124 };
const BLOCK = { w: 78, h: 34, gap: 12, count: 4 };
const BLOCK_X0 = WALL.x + (WALL.w - (BLOCK.count * BLOCK.w + (BLOCK.count - 1) * BLOCK.gap)) / 2;
const BLOCK_Y = WALL.y + (WALL.h - BLOCK.h) / 2;
// The block the visitor approaches, and what it grows to.
const EXPANDED_INDEX = 1;
const EXPANDED = { x: 108, y: 64, w: 94, h: 100 };

const SENSOR_Y = 184;
const ZONE = { top: 190, depth: 44, scallop: 12, lobes: 8 };

const blockX = (index) => BLOCK_X0 + index * (BLOCK.w + BLOCK.gap);
const blockCentre = (index) => blockX(index) + BLOCK.w / 2;

const VISITOR = {
  readable: { x: blockCentre(EXPANDED_INDEX), y: 292 },
  approach: { x: blockCentre(EXPANDED_INDEX), y: 222 },
  // Where the visitor walked in from, in the second state. Low and to the
  // left, so the trail passes above the chip hanging under the visitor.
  from: { x: 40, y: 300 },
};

// Label anchors, in viewBox units. `x`/`y` is the chip's corner nearest its
// leader: the bottom-left for chips above their point, the top-left for chips
// below. `point` is what the leader runs to.
const CALLOUTS = {
  readable: { x: 16, y: 34, edge: 'bottom', point: { x: blockCentre(0), y: BLOCK_Y } },
  expanded: { x: 116, y: 34, edge: 'bottom', point: { x: blockCentre(EXPANDED_INDEX), y: EXPANDED.y } },
  distance: { x: 100, y: 272, edge: 'top', point: { x: VISITOR.approach.x, y: VISITOR.approach.y } },
};

const pct = (value, total) => `${((value / total) * 100).toFixed(2)}%`;

// The zone's front edge: a run of shallow arcs, one per overlapping cone.
const zonePath = () => {
  const left = WALL.x;
  const right = WALL.x + WALL.w;
  const front = ZONE.top + ZONE.depth;
  const lobe = WALL.w / ZONE.lobes;
  let d = `M${left} ${ZONE.top} H${right} V${front - ZONE.scallop}`;
  for (let i = 0; i < ZONE.lobes; i += 1) {
    const x1 = right - (i + 1) * lobe;
    const mid = right - (i + 0.5) * lobe;
    d += ` Q${mid} ${front + ZONE.scallop * 0.6} ${x1} ${front - ZONE.scallop}`;
  }
  return `${d} Z`;
};

const TextLines = ({ x, y, w, lines }) =>
  lines.map((share, index) => (
    <rect
      key={index}
      className={index === 0 ? 'gec-approach__ink' : 'gec-approach__ink gec-approach__ink--soft'}
      x={x}
      y={y + index * 7}
      width={w * share}
      height={index === 0 ? 3 : 2}
      rx={1}
    />
  ));

const Block = ({ index, expanded }) => {
  if (expanded) {
    const { x, y, w, h } = EXPANDED;
    return (
      <g>
        <rect className="gec-approach__block gec-approach__block--expanded" x={x} y={y} width={w} height={h} rx={2} />
        <rect className="gec-approach__image" x={x + 7} y={y + 7} width={w - 14} height={38} rx={1} />
        <TextLines x={x + 7} y={y + 54} w={w - 14} lines={[0.7, 1, 1, 0.9, 1, 0.6]} />
      </g>
    );
  }
  const x = blockX(index);
  return (
    <g>
      <rect className="gec-approach__block" x={x} y={BLOCK_Y} width={BLOCK.w} height={BLOCK.h} rx={2} />
      <TextLines x={x + 7} y={BLOCK_Y + 9} w={BLOCK.w - 14} lines={[0.75, 1, 0.8]} />
    </g>
  );
};

const Visitor = ({ x, y, ghost = false }) => (
  <g className={ghost ? 'gec-approach__visitor gec-approach__visitor--ghost' : 'gec-approach__visitor'}>
    <circle className="gec-approach__visitor-halo" cx={x} cy={y} r={14} />
    <circle className="gec-approach__visitor-body" cx={x} cy={y} r={7.5} />
  </g>
);

const Leader = ({ callout }) => {
  const { point, y } = CALLOUTS[callout];
  return (
    <g className="gec-approach__leader">
      <line x1={point.x} y1={point.y} x2={point.x} y2={y} />
      <circle cx={point.x} cy={point.y} r={3.5} />
    </g>
  );
};

const ApproachDiagram = ({ state = 'readable', number, title, description, callouts = [], zoneLabel }) => {
  const approaching = state === 'approach';
  const visitor = approaching ? VISITOR.approach : VISITOR.readable;

  return (
    <div className="gec-approach" data-state={state} role="img" aria-label={description}>
      <svg
        className="gec-approach__drawing"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        aria-hidden="true"
        focusable="false"
      >
        <rect className="gec-approach__wall" x={WALL.x} y={WALL.y} width={WALL.w} height={WALL.h} rx={3} />
        {Array.from({ length: BLOCK.count }, (_, index) =>
          approaching && index === EXPANDED_INDEX ? null : <Block key={index} index={index} />
        )}
        {approaching && <Block index={EXPANDED_INDEX} expanded />}

        <path className="gec-approach__zone" d={zonePath()} />
        {Array.from({ length: 22 }, (_, index) => (
          <circle
            key={index}
            className="gec-approach__sensor"
            cx={WALL.x + 12 + index * ((WALL.w - 24) / 21)}
            cy={SENSOR_Y}
            r={1.8}
          />
        ))}

        {approaching && (
          <>
            <line
              className="gec-approach__trail"
              x1={VISITOR.from.x}
              y1={VISITOR.from.y}
              x2={visitor.x - 9}
              y2={visitor.y + 9}
            />
            <Visitor {...VISITOR.from} ghost />
          </>
        )}
        <Visitor {...visitor} />

        {callouts.map((callout) => (
          <Leader key={callout.key} callout={callout.key} />
        ))}
      </svg>

      <div className="gec-approach__labels" aria-hidden="true">
        {callouts.map((callout) => {
          const anchor = CALLOUTS[callout.key];
          return (
            <span
              key={callout.key}
              className="gec-approach__tag"
              data-edge={anchor.edge}
              style={{
                left: pct(anchor.x, VIEW_W),
                ...(anchor.edge === 'bottom'
                  ? { bottom: pct(VIEW_H - anchor.y, VIEW_H) }
                  : { top: pct(anchor.y, VIEW_H) }),
              }}
            >
              {callout.label}
            </span>
          );
        })}

        {zoneLabel && (
          <span
            className="gec-approach__zone-label"
            style={{ top: pct(ZONE.top + ZONE.depth / 2 - 2, VIEW_H) }}
          >
            {zoneLabel}
          </span>
        )}

        <p className="gec-approach__title">
          <span className="gec-approach__number">{number}</span>
          {title}
        </p>
      </div>
    </div>
  );
};

export default ApproachDiagram;
