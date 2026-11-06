// src/components/ui/SquircleSurface.jsx
//
// The filled shape behind a control, with smoothed (iOS-style) corners. CSS can't
// draw those yet (`corner-shape` is Chromium-only), so this draws the shape as an
// SVG path sized to its host and sits behind the host's content.
//
// Styled entirely from CSS, so the host's stylesheet stays the one place its look
// is set, media queries and all. On the host, or on this element by class:
//
//   --squircle-radius        corner radius, any length (default 0)
//   --squircle-smoothing     0-1, default 0.6 (iOS)
//   --squircle-fill          fill colour (default currentColor)
//   --squircle-stroke        stroke colour (default none)
//   --squircle-stroke-width  stroke width, drawn inside the edge (default 0)
//
// The host needs `position: relative` (or any positioning) and its own stacking
// context (`isolation: isolate` does it), since the surface sits at z-index -1 to
// paint under the host's text. It covers the host's padding box; override `inset`
// to make it larger or smaller than that.
//
// Until it has measured (and in prerendered HTML, which never measures), the
// element paints the same fill as a plain CSS rounded rectangle, so there is
// never a frame without a background.

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { IOS_CORNER_SMOOTHING, squirclePath } from '../../lib/squircle';
import '../../styles/squircle.css';

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

const readShape = (node, width, height) => {
  const style = getComputedStyle(node);
  // border-radius resolves the --squircle-radius length (em, rem, %) to px,
  // which reading the custom property itself would not.
  const radius = parseFloat(style.borderTopLeftRadius) || 0;
  const smoothingRaw = parseFloat(style.getPropertyValue('--squircle-smoothing'));
  const strokeWidth = parseFloat(style.getPropertyValue('--squircle-stroke-width')) || 0;
  return {
    width,
    height,
    radius,
    smoothing: Number.isFinite(smoothingRaw) ? smoothingRaw : IOS_CORNER_SMOOTHING,
    strokeWidth,
  };
};

const sameShape = (a, b) => (
  a && b
  && a.width === b.width
  && a.height === b.height
  && a.radius === b.radius
  && a.smoothing === b.smoothing
  && a.strokeWidth === b.strokeWidth
);

const SquircleSurface = ({ className = '' }) => {
  const ref = useRef(null);
  const [shape, setShape] = useState(null);

  useIsomorphicLayoutEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const apply = (width, height) => {
      const next = readShape(node, width, height);
      setShape((held) => (sameShape(held, next) ? held : next));
    };

    // offsetWidth would round to whole pixels, and a label's width rarely is one.
    // The host carries no scale transform, so the rect is the layout size.
    const rect = node.getBoundingClientRect();
    apply(rect.width, rect.height);

    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const box = entry.borderBoxSize?.[0];
      if (box) apply(box.inlineSize, box.blockSize);
      else apply(entry.contentRect.width, entry.contentRect.height);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const ready = Boolean(shape && shape.width > 0 && shape.height > 0);
  const half = ready ? shape.strokeWidth / 2 : 0;

  return (
    <span
      ref={ref}
      className={`squircle${className ? ` ${className}` : ''}`}
      data-ready={ready || undefined}
      aria-hidden="true"
    >
      {ready && (
        <svg
          width={shape.width}
          height={shape.height}
          viewBox={`0 0 ${shape.width} ${shape.height}`}
          focusable="false"
        >
          <path
            className="squircle__fill"
            d={squirclePath({ ...shape })}
          />
          {shape.strokeWidth > 0 && (
            // Inset by half the stroke so the whole line lands inside the edge,
            // as a CSS border would.
            <path
              className="squircle__stroke"
              strokeWidth={shape.strokeWidth}
              d={squirclePath({
                x: half,
                y: half,
                width: shape.width - shape.strokeWidth,
                height: shape.height - shape.strokeWidth,
                radius: Math.max(0, shape.radius - half),
                smoothing: shape.smoothing,
              })}
            />
          )}
        </svg>
      )}
    </span>
  );
};

export default SquircleSurface;
