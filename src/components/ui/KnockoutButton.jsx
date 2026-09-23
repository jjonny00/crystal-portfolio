// src/components/ui/KnockoutButton.jsx
//
// A filled pill whose label is cut OUT of the fill rather than drawn on top, so
// the letterforms are windows onto the scene behind the button — the crystal on
// desktop, the project scrim on a phone.
//
// The windows are veiled, and they have to be. A hole straight through shows
// whatever the crystal is doing, which is any luminance at all, including exactly
// the fill's — at which point the label is invisible. Not a corner case either:
// it is the same hole `mix-blend-mode: difference` has, and the reason this site
// stopped using it (see legibility.css). So each letterform carries a veil, and
// solveVeil below works out how opaque it has to be for the label to clear
// TARGET_CONTRAST against EVERY frame the scene can produce rather than against a
// typical one.
//
// What that costs is the size of the window, and it is not the same everywhere:
// the veil and the fill have to sit far apart in luminance, so a bright accent
// leaves room for a real window and a dark one does not. MESA's #EAFF00 runs a
// veil at 0.57 — nearly half the scene reads through. SLIPSTREAM's #873cff needs
// 0.95 and is a window in name only. That is arithmetic, not a setting: at a
// luminance of 0.156 there is no veil colour that clears 4.5:1 with more of the
// scene showing. Brighter accents would buy bigger windows.
//
// Why SVG and not CSS. There is no CSS way to punch live text through an
// element's own background: `background-clip: text` reveals that element's
// background, not what is behind it, and the blend mode that would do it
// (`destination-out`) is a canvas compositing operator, not one of the
// `mix-blend-mode` keywords. An SVG <mask> does it directly — white keeps the
// fill, black removes it — and inline SVG text uses the document's fonts, so the
// label renders in the same face as the rest of the block.
//
// The pill is drawn in the SVG rather than as a CSS background because the mask
// has to apply to the FILL: a CSS background would sit behind the masked shape
// and fill the holes straight back in.

import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { animated } from '@react-spring/web';

const toRgb = (hex) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** Mixes a hex colour toward a ground colour. amount 1 = unchanged. */
const mixRgb = (hex, ground, amount) => toRgb(hex).map((c, i) => (
  Math.round(c * amount + ground[i] * (1 - amount))
));

/** The accent at an alpha, for the state rings. */
const accentAt = (hex, alpha) => `rgba(${toRgb(hex).join(', ')}, ${alpha})`;

const WHITE = [255, 255, 255];
const BLACK = [0, 0, 0];

/**
 * Contrast the label holds against any frame.
 *
 * 4.5:1 rather than the 3:1 large-text allowance, because the mobile label is 20px
 * at weight 600 and WCAG's large-text bar wants >=24px, or >=18.66px at weight 700.
 * 600 is not bold by that definition, so the smaller size takes the stricter ratio
 * and both sizes use it rather than having the effect change strength on rotation.
 */
const TARGET_CONTRAST = 4.5;

const SRGB_TO_LINEAR = new Float32Array(256);
for (let i = 0; i < 256; i += 1) {
  const c = i / 255;
  SRGB_TO_LINEAR[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

const luminance = (rgb) => (
  0.2126 * SRGB_TO_LINEAR[Math.round(rgb[0])] +
  0.7152 * SRGB_TO_LINEAR[Math.round(rgb[1])] +
  0.0722 * SRGB_TO_LINEAR[Math.round(rgb[2])]
);

const contrast = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

/**
 * The veil a letterform needs to stay legible over any frame.
 *
 * A hole shows `veil * a + scene * (1 - a)`, and `scene` is unbounded, so the
 * question is not what the contrast usually is — it is which end of the scene's
 * range can hurt. Contrast is a V with its floor where the hole matches the fill,
 * so the whole achievable range of the hole has to sit on ONE side of the fill:
 *
 *   a black veil keeps every hole darker, and is bound by its brightest case
 *     (scene white), so that is the one to solve
 *   a white veil keeps every hole lighter, and is bound by its darkest (scene black)
 *
 * A fill in the middle of the range can leave neither direction feasible below
 * a = 1, and then the label goes solid: legible first, window second.
 *
 * Scored at the two extremes only, because luminance is monotonic in each channel:
 * whatever the scene does in between is bracketed by black and white.
 */
const worstContrast = (fills, veil, alpha) => {
  let worst = Infinity;
  fills.forEach((fill) => {
    const fillL = luminance(fill);
    [0, 255].forEach((scene) => {
      const hole = veil.map((c) => c * alpha + scene * (1 - alpha));
      worst = Math.min(worst, contrast(fillL, luminance(hole)));
    });
  });
  return worst;
};

/**
 * How far the fill moves between states, and it is deliberately barely at all.
 *
 * The first pass moved it 22% toward white on hover and 18% toward black on press,
 * which read well and broke the label: the hover fill on a mid accent lands close
 * enough to white that a light veil has nowhere left to go, and four of the six
 * projects dropped under 4.5:1 in one state or another. Worse, the feasible veil
 * direction moved across the fill as the pointer arrived, so the label flipped from
 * light to dark and back.
 *
 * At 5% the whole set clears the target and costs only two or three points of
 * window against a fill that never moves at all. The states are carried by the ring
 * instead — it sits outside the pill, where it cannot enter the contrast budget.
 */
const HOVER_LIFT = 0.95;   // toward white
const PRESSED_SINK = 0.95; // toward black

/**
 * One veil for the whole control, solved against every state it can be in.
 *
 * The label is not a state, so it does not get a per-state colour: the direction and
 * the opacity are chosen once, against the worst of rest, hover and press. The
 * thinnest veil that clears the target wins, since that is the one showing the most
 * scene.
 *
 * If nothing clears it — a fill sitting mid-range with states pushed too far either
 * way — this returns the best it found rather than a fixed fallback. An opaque white
 * label is not automatically the safe answer, and quietly picking it was how the
 * first version failed.
 */
const solveVeilForStates = (color) => {
  const fills = [
    toRgb(color),
    mixRgb(color, WHITE, HOVER_LIFT),
    mixRgb(color, BLACK, PRESSED_SINK),
  ];

  let fallback = { veil: WHITE, alpha: 1, score: 0 };
  for (const veil of [BLACK, WHITE]) {
    for (let alpha = 0; alpha <= 1.0001; alpha += 0.01) {
      const score = worstContrast(fills, veil, alpha);
      if (score >= TARGET_CONTRAST) return { veil, alpha, score };
      if (score > fallback.score) fallback = { veil, alpha, score };
    }
  }
  return fallback;
};

const KnockoutButton = ({
  label,
  /** The project's accent. Fills the pill; the label is the absence of it. */
  color,
  isMobile = false,
  onClick,
  /**
   * Entrance spring from the parent. These are SpringValues, not numbers, so the
   * root has to be an `animated` element for them to subscribe — spread onto a
   * plain <button> they stringify and the block never fades in. The spring also
   * owns `transform`, which is why every state below moves colour and never scale.
   */
  springStyle,
  style,
  ariaLabel,
}) => {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [keyboardFocus, setKeyboardFocus] = useState(false);

  // Measured rather than derived from the type metrics: the pill's corner radius
  // has to be exactly half the height, and SVG clamps a too-large `rx` to half the
  // WIDTH, which on a full-bleed mobile button is an ellipse rather than a pill.
  // A ResizeObserver also catches the reflow when the webfont lands after first
  // paint, which a one-time measure would miss.
  const buttonRef = useRef(null);
  const [box, setBox] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const node = buttonRef.current;
    if (!node) return undefined;
    const measure = () => {
      const rect = node.getBoundingClientRect();
      // Compared before storing: the observer fires once on observe() as well as
      // on change, and a fresh object every time would re-render for a size that
      // has not moved.
      setBox((held) => (
        held.width === rect.width && held.height === rect.height
          ? held
          : { width: rect.width, height: rect.height }
      ));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [label, isMobile]);

  // Colons in React's generated ids are legal in XML but not in a `url(#…)`
  // reference, so they come out before the mask is addressed by it.
  const idBase = `knockout-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const pillMaskId = `${idBase}-pill`;
  const labelMaskId = `${idBase}-label`;

  // A pointer leaving mid-press would otherwise strand the pressed state.
  useEffect(() => {
    if (!pressed) return undefined;
    const release = () => setPressed(false);
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    return () => {
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
    };
  }, [pressed]);

  const fillRgb = pressed
    ? mixRgb(color, BLACK, PRESSED_SINK)
    : hovered
      ? mixRgb(color, WHITE, HOVER_LIFT)
      : toRgb(color);
  const fill = `rgb(${fillRgb.join(', ')})`;

  // Solved from the accent, not from the state on screen — see solveVeilForStates.
  // Constant across hover and press, so only the fill behind the label moves.
  const { veil, alpha: veilAlpha } = useMemo(() => solveVeilForStates(color), [color]);

  // The states live out here, in rings around the pill, because the fill cannot
  // carry them: every point of luminance it moves comes out of the label's contrast
  // budget (see HOVER_LIFT). A ring sits outside the shape, over the scene rather
  // than behind the label, so it can be as loud as it likes.
  const rings = [];
  if (keyboardFocus) rings.push(`0 0 0 3px ${accentAt(color, 0.9)}`);
  if (pressed) rings.push(`0 0 0 2px ${accentAt(color, 0.75)}`);
  else if (hovered) rings.push(`0 0 0 6px ${accentAt(color, 0.28)}`);

  const typeStyle = {
    fontFamily: '"acumin-variable", "Acumin VF", sans-serif',
    fontSize: isMobile ? '20px' : '24px',
    fontWeight: 600,
    letterSpacing: '-0.48px',
  };

  const radius = box.height ? box.height / 2 : 0;

  // Both masks have to place the label identically or the veil would sit off the
  // holes, so the placement is written once.
  const labelPos = {
    x: box.width / 2,
    y: box.height / 2,
    textAnchor: 'middle',
    dominantBaseline: 'central',
  };

  return (
    <animated.button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => { setHovered(false); setPressed(false); }}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onFocus={(event) => {
        // Only ring for keyboard users; a pointer press should not leave one behind.
        setKeyboardFocus(event.target.matches?.(':focus-visible') ?? false);
      }}
      onBlur={() => setKeyboardFocus(false)}
      style={{
        ...springStyle,
        position: 'relative',
        // The pill itself is painted by the SVG. This stays clear so the holes in
        // it reach all the way through to the scene.
        background: 'transparent',
        border: 'none',
        // Only so the focus ring follows the pill rather than boxing it.
        borderRadius: '999px',
        padding: isMobile ? '10px 16px' : '12px 22px',
        // Centred on both, which is what the label wants now that the button is a
        // filled shape: on mobile it stretches the column and a left-set label sat
        // off in one end of it.
        textAlign: 'center',
        cursor: 'pointer',
        display: 'block',
        width: isMobile ? '100%' : 'auto',
        lineHeight: isMobile ? '1.35' : '30px',
        WebkitTapHighlightColor: 'transparent',
        outline: 'none',
        boxShadow: rings.length ? rings.join(', ') : 'none',
        transition: 'box-shadow 160ms ease',
        ...style,
      }}
    >
      {box.width > 0 && box.height > 0 && (
        <svg
          aria-hidden="true"
          focusable="false"
          width={box.width}
          height={box.height}
          viewBox={`0 0 ${box.width} ${box.height}`}
          style={{
            position: 'absolute',
            // The containing block for an absolutely positioned child is the
            // padding box, so this covers the padding as well as the label.
            inset: 0,
            display: 'block',
            pointerEvents: 'none',
          }}
        >
          <defs>
            {/* White keeps, black removes: the label is cut out of the pill. */}
            <mask id={pillMaskId}>
              <rect
                x="0"
                y="0"
                width={box.width}
                height={box.height}
                rx={radius}
                ry={radius}
                fill="#fff"
              />
              <text {...labelPos} fill="#000" style={typeStyle}>{label}</text>
            </mask>
            {/* The same shape the other way up, so the veil lands in the holes and
                nowhere else. */}
            <mask id={labelMaskId}>
              <rect x="0" y="0" width={box.width} height={box.height} fill="#000" />
              <text {...labelPos} fill="#fff" style={typeStyle}>{label}</text>
            </mask>
          </defs>

          {/* Painted first, so it sits under the holes the pill leaves. */}
          <rect
            x="0"
            y="0"
            width={box.width}
            height={box.height}
            fill={`rgb(${veil.join(', ')})`}
            fillOpacity={veilAlpha}
            mask={`url(#${labelMaskId})`}
            style={{ transition: 'fill-opacity 160ms ease' }}
          />
          <rect
            x="0"
            y="0"
            width={box.width}
            height={box.height}
            rx={radius}
            ry={radius}
            fill={fill}
            mask={`url(#${pillMaskId})`}
            style={{ transition: 'fill 160ms ease' }}
          />
        </svg>
      )}

      {/* In flow, so it gives the button its size, and in the accessibility tree,
          so the control has a name. `transparent` rather than `visibility: hidden`
          for the second of those — hidden would take it out of the tree. It paints
          nothing; the SVG above is the visible label. */}
      <span style={{ ...typeStyle, color: 'transparent', whiteSpace: 'nowrap' }}>
        {label}
      </span>
    </animated.button>
  );
};

export default KnockoutButton;
