// src/ui/LoaderV2.tsx
// The loading screen: three rings, one per stage of real work (see
// src/loader/loadProgress.js for what each one measures), the percentage they
// add up to, and the diamond the rings break around. Mounted once, by main.jsx;
// App shows and dismisses it through the progress store.

import React, { useEffect, useId, useState, useSyncExternalStore } from 'react';
import styles from './LoaderV2.module.css';
import { getLoadProgress, subscribeLoadProgress } from '../loader/loadProgress';

export const LOADER_CONTENT_FADE_MS = 420;
export const LOADER_SCENE_REVEAL_DELAY_MS = 520;
export const LOADER_OVERLAY_FADE_MS = 3360;
// App holds the hand-off this long once every ring is full: the last ring's
// colour washes across the diamond (the 900ms .washSweep animation) and the
// whole thing holds a beat before the loader fades.
export const LOADER_COMPLETE_PULSE_MS = 1100;

type Stage = 'download' | 'device' | 'scene';

// Two lines each, broken where the comp breaks them.
const STATUS_COPY: Record<Stage, [string, string]> = {
  download: ['Loading', 'portfolio'],
  device: ['Adjusting to', 'your device'],
  scene: ['Preparing', 'scene'],
};

// How long an outgoing status label takes to fade (matches .labelOut).
const LABEL_OUT_MS = 260;

// Outermost first, in the order the stages run.
const RINGS: { stage: Stage; radius: number }[] = [
  { stage: 'download', radius: 69.25 },
  { stage: 'device', radius: 57.75 },
  { stage: 'scene', radius: 46.25 },
];

// The SVG draws at 1:1 CSS px with the rings' centre at the origin. The diamond
// (public/assets/ui/diamond.svg, inlined so its fill can animate) hangs from just
// under the percentage and runs past the bottom of the rings, which break around
// it: its outline is painted in the background colour over them.
const VIEW_LEFT = -72;
const VIEW_TOP = -72;
const VIEW_WIDTH = 144;
const VIEW_HEIGHT = 168;
const DIAMOND_HEIGHT = 78;
const DIAMOND_TOP = 16;
const DIAMOND_SOURCE_WIDTH = 42.29;
const DIAMOND_SOURCE_HEIGHT = 107.9;
const DIAMOND_SCALE = DIAMOND_HEIGHT / DIAMOND_SOURCE_HEIGHT;
const DIAMOND_TRANSFORM = `translate(${(-DIAMOND_SOURCE_WIDTH / 2) * DIAMOND_SCALE} ${DIAMOND_TOP}) scale(${DIAMOND_SCALE})`;

const DIAMOND_OUTER = '0,53.95 21.14,0 42.29,53.95 21.14,107.9';
const DIAMOND_FACE = '1.61,53.95 21.14,4.11 40.68,53.95 21.14,103.79';
const DIAMOND_SPINE = 'M21.14,8.22c1.37,30.47,1.38,60.99,0,91.46-1.38-30.47-1.37-60.99,0-91.46h0Z';

// --- fonts -------------------------------------------------------------------
// The loader doesn't appear until its two faces are in, so its type never swaps
// in front of the reader. The Typekit kit serves them with font-display: auto,
// which would otherwise hide the text for a moment and then pop it in. Loading
// starts as soon as this module runs (main.jsx imports it at boot).
//
// The wait is capped, at about where the browser would give up and show a
// fallback anyway: past it the loader comes in regardless, and its Acumin text
// is set in a system face until Acumin arrives (the one case that still swaps).
const IVY = '400 33px "ivypresto-display"';
const ACUMIN = '400 16px "acumin-variable"';
const FONT_WAIT_CAP_MS = 3000;

const hasFontApi = typeof document !== 'undefined' && Boolean(document.fonts);
const loadFont = (spec: string) =>
  hasFontApi ? document.fonts.load(spec).then(() => undefined, () => undefined) : Promise.resolve();

const acuminLoaded = loadFont(ACUMIN);
let acuminLoadedNow = !hasFontApi;
acuminLoaded.then(() => { acuminLoadedNow = true; });

const fontsSettled = Promise.race([
  Promise.all([loadFont(IVY), acuminLoaded]),
  new Promise((resolve) => setTimeout(resolve, FONT_WAIT_CAP_MS)),
]);
let fontsSettledNow = !hasFontApi;
fontsSettled.then(() => { fontsSettledNow = true; });

/** Resolves once the loader can appear (its fonts are in, or the wait ran out). */
export const loaderFontsReady = fontsSettled;

const useSettledPromise = (promise: Promise<unknown>, settledNow: () => boolean) => {
  const [settled, setSettled] = useState(settledNow);
  useEffect(() => {
    if (settled) return undefined;
    let cancelled = false;
    promise.then(() => { if (!cancelled) setSettled(true); });
    return () => { cancelled = true; };
  }, [promise, settled]);
  return settled;
};

// --- status label --------------------------------------------------------------
// The current label rises in as the previous one fades out. The first label
// arrives with the loader's own entrance instead.
interface Label { key: number; stage: Stage; leaving: boolean; initial: boolean }

const useStatusLabels = (stage: Stage) => {
  const [labels, setLabels] = useState<Label[]>(() => [{ key: 0, stage, leaving: false, initial: true }]);

  useEffect(() => {
    setLabels((prev) => {
      const current = prev[prev.length - 1];
      if (current.stage === stage) return prev;
      return [
        // Anything already on its way out goes now; only one label leaves at a time.
        ...prev.filter((label) => !label.leaving).map((label) => ({ ...label, leaving: true })),
        { key: current.key + 1, stage, leaving: false, initial: false },
      ];
    });
  }, [stage]);

  useEffect(() => {
    if (!labels.some((label) => label.leaving)) return undefined;
    const timeoutId = setTimeout(() => {
      setLabels((prev) => prev.filter((label) => !label.leaving));
    }, LABEL_OUT_MS);
    return () => clearTimeout(timeoutId);
  }, [labels]);

  return labels;
};

// --- diamond -------------------------------------------------------------------
// Starts in its own cream. Each ring, as it completes, washes its colour over the
// whole diamond from right to left, on top of the one before, so the diamond ends
// in the colour of the last stage to finish. Each wash is a soft vertical gradient
// of its ring's colour, drifting slowly so a finished diamond still reads as live.
// It sweeps in under a mask whose leading edge is a soft band rather than a line,
// so the new colour blends into the one beneath as it crosses. Reduced motion
// fades each wash in where it is, and holds the drift.
const STAGE_ORDER: Stage[] = RINGS.map(({ stage }) => stage);
const WASH_DRIFT = 0.35; // share of the diamond's height the gradient drifts
const WASH_DRIFT_S = 5; // one drift there and back
// Width of the soft leading edge, in the diamond's own units (it is 42.29 wide).
const WASH_SOFT_EDGE = 22;
const WASH_SWEEP_WIDTH = DIAMOND_SOURCE_WIDTH + WASH_SOFT_EDGE;

const useCompletionOrder = (doneByStage: Record<Stage, boolean>) => {
  const [order, setOrder] = useState<Stage[]>(() => STAGE_ORDER.filter((stage) => doneByStage[stage]));
  const { download, device, scene } = doneByStage;
  useEffect(() => {
    const done = { download, device, scene };
    setOrder((prev) => {
      const newly = STAGE_ORDER.filter((stage) => done[stage] && !prev.includes(stage));
      return newly.length ? [...prev, ...newly] : prev;
    });
  }, [download, device, scene]);
  return order;
};

// --- rings while loading ---------------------------------------------------------
// While a ring's stage is working, a pulse sweeps its filled part from the start to
// the leading edge: the travelling peak from the hero's energy line (vertical-
// energy-line.css), turned into a comet so the bright spot leads: a white head,
// cyan behind it, an indigo tail. Three dashes whose fronts line up. A full ring
// is still. Masked to the arc, so it never shows past the edge.
const PULSE_LAYERS = [
  { name: 'pulseOuter', length: 34 },
  { name: 'pulseMid', length: 20 },
  { name: 'pulseCore', length: 7 },
];

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

const LoaderV2: React.FC = () => {
  const progress = useSyncExternalStore(subscribeLoadProgress, getLoadProgress, getLoadProgress);
  const { shown, exiting } = progress.presentation;
  if (!shown) return null;
  return <LoaderScreen exiting={exiting} />;
};

const LoaderScreen: React.FC<{ exiting: boolean }> = ({ exiting }) => {
  const progress = useSyncExternalStore(subscribeLoadProgress, getLoadProgress, getLoadProgress);
  const entered = useSettledPromise(fontsSettled, () => fontsSettledNow);
  const acuminReady = useSettledPromise(acuminLoaded, () => acuminLoadedNow);
  const labels = useStatusLabels(progress.activeStage as Stage);
  const [reducedMotion] = useState(prefersReducedMotion);
  const id = useId();
  const ringsMaskId = `${id}-rings`;
  const faceClipId = `${id}-face`;

  const complete = progress.complete || exiting;
  const percent = complete ? 100 : Math.floor(progress.overall * 100);
  const washes = useCompletionOrder({
    download: complete || progress.download.done,
    device: complete || progress.device.done,
    scene: complete || progress.scene.done,
  });
  const latestWash = washes[washes.length - 1];

  return (
    <div
      className={[
        styles.overlay,
        entered ? styles.entered : '',
        exiting ? styles.overlayExiting : '',
        acuminReady ? '' : styles.fallbackSans,
      ].join(' ')}
    >
      <div className={`${styles.content} ${exiting ? styles.contentExiting : ''}`}>
        <p className={styles.wordmark}>J. Jon Shaw</p>
        <p className={`type-subhead-sm ${styles.subtitle}`}>Product designer</p>

        <div
          className={styles.meter}
          role="progressbar"
          aria-label="Loading"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          <svg
            className={styles.svg}
            viewBox={`${VIEW_LEFT} ${VIEW_TOP} ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
            width={VIEW_WIDTH}
            height={VIEW_HEIGHT}
            aria-hidden="true"
          >
            <defs>
              {/* The rings break around the diamond: cut out, not painted over, so
                  the background gradient shows through the gap. */}
              <mask
                id={ringsMaskId}
                maskUnits="userSpaceOnUse"
                x={VIEW_LEFT}
                y={VIEW_TOP}
                width={VIEW_WIDTH}
                height={VIEW_HEIGHT}
              >
                <rect x={VIEW_LEFT} y={VIEW_TOP} width={VIEW_WIDTH} height={VIEW_HEIGHT} fill="#fff" />
                <polygon
                  className={styles.diamondCutout}
                  points={DIAMOND_OUTER}
                  transform={DIAMOND_TRANSFORM}
                />
              </mask>
              {/* The sweep's soft leading edge (left, since it travels right to
                  left): clear across WASH_SOFT_EDGE, then solid. */}
              <linearGradient id={`${id}-wash-edge`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#000" />
                <stop offset={WASH_SOFT_EDGE / WASH_SWEEP_WIDTH} stopColor="#fff" />
                <stop offset="1" stopColor="#fff" />
              </linearGradient>
              {STAGE_ORDER.map((stage) => (
                <mask
                  key={stage}
                  id={`${id}-wash-mask-${stage}`}
                  maskUnits="userSpaceOnUse"
                  x="0"
                  y="0"
                  width={DIAMOND_SOURCE_WIDTH}
                  height={DIAMOND_SOURCE_HEIGHT}
                >
                  {washes.includes(stage) && (
                    <rect
                      className={styles.washSweep}
                      x="0"
                      y="0"
                      width={WASH_SWEEP_WIDTH}
                      height={DIAMOND_SOURCE_HEIGHT}
                      fill={`url(#${id}-wash-edge)`}
                      style={{
                        '--sweep-from': DIAMOND_SOURCE_WIDTH,
                        '--sweep-to': -WASH_SOFT_EDGE,
                      } as React.CSSProperties}
                    />
                  )}
                </mask>
              ))}
              <clipPath id={faceClipId}>
                <polygon points={DIAMOND_FACE} />
              </clipPath>
              {/* One wash per ring: a light tint of its colour at the top, the
                  colour itself, then a deeper shade at the foot. Vertical, so the
                  horizontal wipe doesn't distort it. */}
              {STAGE_ORDER.map((stage) => (
                <linearGradient
                  key={stage}
                  id={`${id}-wash-${stage}`}
                  className={styles[`ring_${stage}`]}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                  spreadMethod="reflect"
                >
                  <stop offset="0" className={styles.washLight} />
                  <stop offset="0.55" className={styles.washBase} />
                  <stop offset="1" className={styles.washDeep} />
                  {!reducedMotion && (
                    <animateTransform
                      attributeName="gradientTransform"
                      type="translate"
                      values={`0 0; 0 ${-WASH_DRIFT}; 0 0`}
                      keyTimes="0; 0.5; 1"
                      calcMode="spline"
                      keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"
                      dur={`${WASH_DRIFT_S}s`}
                      repeatCount="indefinite"
                    />
                  )}
                </linearGradient>
              ))}
            </defs>

            <g mask={`url(#${ringsMaskId})`}>
              {/* Rotated a quarter turn so each ring starts at the bottom, behind
                  the diamond, and fills clockwise. */}
              <g transform="rotate(90)">
                {RINGS.map(({ stage, radius }) => {
                  const circumference = 2 * Math.PI * radius;
                  const value = complete ? 1 : progress[stage].progress;
                  const dashOffset = circumference * (1 - value);
                  const loading = !reducedMotion && !complete && !progress[stage].done && value > 0;
                  const arcMaskId = `${id}-${stage}-arc`;
                  return (
                    <g
                      key={stage}
                      className={styles[`ring_${stage}`]}
                      style={{
                        '--circumference': circumference,
                        '--arc': circumference * value,
                      } as React.CSSProperties}
                    >
                      <circle className={styles.track} r={radius} />
                      <circle
                        className={styles.arc}
                        r={radius}
                        strokeDasharray={circumference}
                        strokeDashoffset={dashOffset}
                      />
                      {loading && (
                        <>
                          <mask id={arcMaskId}>
                            <circle
                              className={styles.arcMask}
                              r={radius}
                              strokeDasharray={circumference}
                              strokeDashoffset={dashOffset}
                            />
                          </mask>
                          <g className={styles.pulse} mask={`url(#${arcMaskId})`}>
                            {PULSE_LAYERS.map(({ name, length }) => (
                              <circle
                                key={name}
                                className={`${styles.pulseLayer} ${styles[name]}`}
                                r={radius}
                                strokeDasharray={`${length} ${circumference - length}`}
                                // Its length places its tail; every layer's front is
                                // the same point (see @keyframes pulse).
                                style={{ '--len': length } as React.CSSProperties}
                              />
                            ))}
                          </g>
                        </>
                      )}
                    </g>
                  );
                })}
              </g>
            </g>

            <g
              transform={DIAMOND_TRANSFORM}
              className={styles.diamond}
              style={{
                '--glow-level': washes.length,
                '--glow-color': latestWash ? `var(--ring-${latestWash})` : 'transparent',
              } as React.CSSProperties}
            >
              <polygon className={styles.diamondFace} points={DIAMOND_FACE} />
              <g clipPath={`url(#${faceClipId})`}>
                {washes.map((stage) => (
                  <rect
                    key={stage}
                    className={styles.diamondWash}
                    mask={`url(#${id}-wash-mask-${stage})`}
                    x="0"
                    y="0"
                    width={DIAMOND_SOURCE_WIDTH}
                    height={DIAMOND_SOURCE_HEIGHT}
                    fill={`url(#${id}-wash-${stage})`}
                  />
                ))}
              </g>
              <path className={styles.diamondSpine} d={DIAMOND_SPINE} />
            </g>
          </svg>

          {/* Centred on the digits alone: the % hangs off their right edge, so it
              doesn't pull the number off the rings' centre. */}
          <div className={styles.percent} aria-hidden="true">
            <span className={styles.percentValue}>
              {percent}
              <span className={styles.percentSign}>%</span>
            </span>
          </div>
        </div>

        <p className={`type-subhead-sm ${styles.status}`} aria-live="polite">
          {labels.map((label) => {
            const [line1, line2] = STATUS_COPY[label.stage];
            const motion = label.leaving ? styles.labelOut : label.initial ? '' : styles.labelIn;
            return (
              <span
                key={label.key}
                className={`${styles.label} ${motion}`}
                aria-hidden={label.leaving || undefined}
              >
                <span>{line1}</span>
                <span>{line2}</span>
              </span>
            );
          })}
        </p>
      </div>
    </div>
  );
};

export default LoaderV2;
