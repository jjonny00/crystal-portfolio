// src/components/three/PlacedOverviewLabels.jsx
//
// The overview's labels when the layout places them beside their fragments
// (`overviewLabels.mode: 'placed'`): each project's title and descriptor on one
// of two rails, with a short connector to a glowing dot on its fragment.
//
// Plain DOM: the labels are the links (to each project's URL) that screen
// readers and keyboards use, and the rects OverviewTouchPicker hit-tests on
// touch. They do not follow the fragments' idle drift; FacetLabels measures the
// fragments once as the labels come up (and again on resize) and hands the
// points in, so labels and lines sit still.
//
// Every connector is drawn the same way (overviewLabelPlacement.connectorRoute):
// a level run out of the title's inner edge, one rounded right-angle corner,
// and straight into the dot. The only per-project choice is where the dot sits.

import React, { useLayoutEffect, useRef, useState } from 'react';
import Headline from '../ui/Headline';
import { inPageLinkHandler } from '../../navigation/linkClick';
import { projectPath } from '../../navigation/routes';
import { OVERVIEW_TITLE_INK, connectorColor, connectorRoute } from './overviewLabelPlacement';

// The least room kept between a label and the screen's right edge: where the
// nav's last link ends.
const EDGE_CLEARANCE_PX = 16;

const PlacedLabel = ({
  project,
  point,
  item,
  config,
  railLeft,
  maxRight,
  revealed,
  revealDelayMs,
  fadeMs,
  active,
  onHover,
  onClick,
  liRef,
}) => {
  const runtimeKey = project.facetKey || project.id;
  const side = item.side === 'right' ? 'right' : 'left';
  const titleRef = useRef(null);
  const nodeRef = useRef(null);
  const pathRef = useRef(null);
  const [box, setBox] = useState(null);
  const [pathLength, setPathLength] = useState(0);

  // The label's own size and its title's, for the right-edge clamp and the
  // connector. Watched, since the webfont arriving changes both.
  useLayoutEffect(() => {
    const node = nodeRef.current;
    // The headline itself (inline-block), not its block wrapper, which spans
    // the whole label.
    const title = titleRef.current?.firstElementChild;
    if (!node || !title) return undefined;
    const measure = () => {
      setBox((previous) => {
        const next = {
          width: node.offsetWidth,
          height: node.offsetHeight,
          titleLeft: title.offsetLeft,
          titleWidth: title.offsetWidth,
          titleMiddle: title.offsetTop + title.offsetHeight / 2,
        };
        const same = previous
          && Object.keys(next).every((key) => Math.abs(previous[key] - next[key]) < 0.5);
        return same ? previous : next;
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    observer.observe(title);
    return () => observer.disconnect();
  }, []);

  // Right-aligned (`rightAlign`), a right-rail label hangs from its right edge,
  // set `edgeMargin` in from the screen's right edge, mirroring the left rail.
  const alignRight = side === 'right' && config.rightAlign;
  let left = railLeft;
  if (box) {
    left = alignRight
      ? Math.min(maxRight - config.edgeMargin + (item.dx || 0), maxRight - EDGE_CLEARANCE_PX) - box.width
      : Math.min(railLeft + (item.dx || 0), maxRight - box.width - EDGE_CLEARANCE_PX);
  }
  const centreY = point ? point.y + (item.dy || 0) : 0;
  const top = box ? centreY - box.height / 2 : centreY;
  const placed = Boolean(box && point);

  // The connector, in the label's own coordinates (its top-left is 0,0).
  let connector = null;
  if (placed) {
    const [dotX, dotY] = item.dot || [0, 0];
    const end = { x: point.x + dotX - left, y: point.y + dotY - top };
    connector = { end, ...connectorRoute(box, side, end, config, item.exit) };
  }

  useLayoutEffect(() => {
    if (pathRef.current) setPathLength(pathRef.current.getTotalLength());
  }, [connector?.d]);

  const color = connectorColor(project, config);
  const gradientId = `overview-connector-${runtimeKey}`;
  const haloId = `overview-connector-halo-${runtimeKey}`;

  return (
    <li
      ref={(el) => {
        nodeRef.current = el;
        liRef?.(el);
      }}
      className={`facet-label-optimized placed-label${revealed ? ' is-revealed' : ''}`}
      // Read by OverviewTouchPicker (and the rail, on desktop) for this
      // label's bounds.
      data-rail-project={runtimeKey}
      onPointerEnter={() => onHover?.(runtimeKey, true)}
      onPointerLeave={() => onHover?.(runtimeKey, false)}
      style={{
        left,
        top,
        textAlign: alignRight ? 'right' : 'left',
        // Mounted (so its fade runs) but hidden until both it and its fragment
        // have been measured, so it never shows a frame in the wrong place.
        visibility: placed ? 'visible' : 'hidden',
        opacity: revealed ? 1 : 0,
        transition: `opacity ${fadeMs}ms ease ${revealed ? revealDelayMs : 0}ms`,
        '--headline-ink': active ? project.headlineColor : OVERVIEW_TITLE_INK,
        '--connector-delay': `${revealDelayMs + 250}ms`,
      }}
    >
      {/* Under the type, so a line that runs past a descriptor never covers it. */}
      {connector && (
        <svg className="placed-connector" aria-hidden="true" width="1" height="1">
          <defs>
            {/* Faint at the label, full at the fragment. */}
            <linearGradient
              id={gradientId}
              gradientUnits="userSpaceOnUse"
              x1={connector.start.x}
              y1={connector.start.y}
              x2={connector.end.x}
              y2={connector.end.y}
            >
              <stop offset="0" stopColor={color} stopOpacity="0.55" />
              <stop offset="1" stopColor={color} stopOpacity="0.95" />
            </linearGradient>
            <radialGradient id={haloId}>
              <stop offset="0" stopColor={color} stopOpacity="0.55" />
              <stop offset="1" stopColor={color} stopOpacity="0" />
            </radialGradient>
          </defs>
          <path
            ref={pathRef}
            className="placed-connector-line"
            d={connector.d}
            stroke={`url(#${gradientId})`}
            strokeWidth={config.connectorWidth}
            style={{ '--connector-length': `${pathLength}px` }}
          />
          <circle className="placed-connector-dot" cx={connector.end.x} cy={connector.end.y} r="7" fill={`url(#${haloId})`} />
          <circle className="placed-connector-dot" cx={connector.end.x} cy={connector.end.y} r="2.5" fill={color} />
        </svg>
      )}

      <a href={projectPath(runtimeKey)} onClick={inPageLinkHandler(onClick)}>
        <div ref={titleRef} data-facet-key={runtimeKey} className="placed-label-title">
          <Headline as="p" className="type-headline-xs label-title" style={{ margin: 0 }}>
            {project.shortLabel || project.label}
          </Headline>
        </div>
        <p className="type-subhead-xs label-description">{project.shortTagline || project.tagline}</p>
      </a>
    </li>
  );
};

/**
 * @param {object} props
 * @param {Record<string, {x: number, y: number}>|null} props.points  each fragment's
 *   point, in viewport px, keyed like the projects
 * @param {{ left: number, width: number }} props.canvas  the canvas's left edge and
 *   width in viewport px, which the rails are measured across
 */
const PlacedOverviewLabels = React.forwardRef(function PlacedOverviewLabels({
  projects,
  points,
  config,
  canvas,
  visible,
  fadeMs,
  staggerMs,
  activeKey,
  interactive,
  onHover,
  onSelect,
  labelRef,
  onTransitionEnd,
}, ref) {
  const rails = {
    left: canvas.left + config.edgeMargin,
    right: canvas.left + canvas.width * config.rightColumn,
  };
  const maxRight = canvas.left + canvas.width;

  return (
    <ul
      ref={ref}
      onTransitionEnd={onTransitionEnd}
      className="placed-labels"
      aria-label="Selected work"
      data-rail-list
      style={{
        opacity: visible ? 1 : 0,
        transition: `opacity ${fadeMs}ms`,
        // Mouse only; on touch the labels stay inert so a swipe that starts on
        // one still scrolls, and OverviewTouchPicker resolves taps by rect.
        pointerEvents: interactive && visible ? 'auto' : 'none',
      }}
    >
      {projects.map((project, index) => {
        const runtimeKey = project.facetKey || project.id;
        const point = points?.[runtimeKey] || null;
        const item = config.items?.[runtimeKey] || {};
        return (
          <PlacedLabel
            key={runtimeKey}
            project={project}
            point={point}
            item={item}
            config={config}
            railLeft={item.side === 'right' ? rails.right : rails.left}
            maxRight={maxRight}
            revealed={visible}
            revealDelayMs={index * staggerMs}
            fadeMs={fadeMs}
            active={activeKey === runtimeKey}
            onHover={onHover}
            onClick={() => onSelect(runtimeKey)}
            liRef={(el) => labelRef?.(runtimeKey, el)}
          />
        );
      })}
    </ul>
  );
});

export default PlacedOverviewLabels;
