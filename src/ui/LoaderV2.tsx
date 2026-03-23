// src/ui/LoaderV2.tsx
// Radial loader showing initialization, asset loading, and performance testing

import React, { useEffect, useMemo, useState } from 'react';
import styles from './LoaderV2.module.css';

const clamp = (v: number) => Math.min(1, Math.max(0, v));

export const LOADER_CONTENT_FADE_MS = 420;
export const LOADER_SCENE_REVEAL_DELAY_MS = 520;
export const LOADER_OVERLAY_FADE_MS = 1680;

interface LoaderProps {
  initProgress?: number;   // 0..1 initialization progress
  assetProgress?: number;  // 0..1 asset loading progress
  testProgress?: number;   // 0..1 performance testing progress
  statusMessage?: string;
  exiting?: boolean;       // trigger fade-out animation
}

const LoaderV2: React.FC<LoaderProps> = ({
  initProgress = 0,
  assetProgress = 0,
  testProgress = 0,
  statusMessage = '',
  exiting = false
}) => {
  // Loader dimensions
  const size = 260; // matches CSS meter size
  const stroke =
    parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--ringStroke')
    ) || 6;

  const radii = [
    size / 2 - stroke / 2,
    size / 2 - (stroke * 3) / 2,
    size / 2 - (stroke * 5) / 2
  ];

  const [outer, setOuter] = useState(() => clamp(initProgress) * 100);
  const [middle, setMiddle] = useState(() => clamp(assetProgress) * 100);
  const [inner, setInner] = useState(() => clamp(testProgress) * 100);
  const [isContentFadingOut, setIsContentFadingOut] = useState(false);
  const [isOverlayFadingOut, setIsOverlayFadingOut] = useState(false);

  useEffect(() => {
    if (exiting) {
      setOuter(100);
      setMiddle(100);
      setInner(100);
    } else {
      setOuter(clamp(initProgress) * 100);
      setMiddle(clamp(assetProgress) * 100);
      setInner(clamp(testProgress) * 100);
    }
  }, [initProgress, assetProgress, testProgress, exiting]);

  useEffect(() => {
    if (!exiting) {
      setIsContentFadingOut(false);
      setIsOverlayFadingOut(false);
      return undefined;
    }

    let frame = requestAnimationFrame(() => {
      setIsContentFadingOut(true);
    });

    const overlayTimer = window.setTimeout(() => {
      setIsOverlayFadingOut(true);
    }, LOADER_SCENE_REVEAL_DELAY_MS);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(overlayTimer);
    };
  }, [exiting]);

  const overlayClassName = useMemo(
    () => `${styles.overlay} ${isOverlayFadingOut ? styles.fadeOut : ''}`.trim(),
    [isOverlayFadingOut]
  );

  const contentClassName = useMemo(
    () => `${styles.content} ${isContentFadingOut ? styles.contentFadeOut : ''}`.trim(),
    [isContentFadingOut]
  );

  const overall = Math.round(
    clamp(initProgress) * 33 +
    clamp(testProgress) * 33 +
    clamp(assetProgress) * 34
  );

  // Diamond sizing based on spec
  const gap = 10;
  const safeRadius = radii[0] - stroke * 1.5 - gap;
  const box = safeRadius * 2.2; // safeRadius*1.1*2

  return (
    <div className={overlayClassName}>
      <div className={contentClassName}>
      <h1 className={styles.headline}>
        Multifaceted Designer
        <span className={styles.subhead}></span>
      </h1>

      <div className={styles.meter}>
        <svg
          className={styles.svg}
          viewBox={`-${size / 2} -${size / 2} ${size} ${size}`}
        >
          <g transform="rotate(90 0 0)">
            {radii.map((r, i) => (
              <circle
                key={`track-${i}`}
                className={styles.track}
                cx={0}
                cy={0}
                r={r}
                fill="none"
                stroke="var(--ringTrack)"
                strokeWidth={stroke}
              />
            ))}

            {[
              { r: radii[0], color: 'var(--ring1)', progress: outer },
              { r: radii[1], color: 'var(--ring2)', progress: middle },
              { r: radii[2], color: 'var(--ring3)', progress: inner }
            ].map((ring, i) => {
              const circumference = 2 * Math.PI * ring.r;
              const offset = circumference * (1 - ring.progress / 100);
              return (
                <circle
                  key={`progress-${i}`}
                  className={`${styles.progress} ${exiting ? styles.complete : ''}`}
                  cx={0}
                  cy={0}
                  r={ring.r}
                  fill="none"
                  stroke={ring.color}
                  strokeWidth={stroke}
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                />
              );
            })}
          </g>

          <g style={{ transform: 'scale(var(--diamond-scale,1))' }}>
            <image
              href="/assets/ui/diamond.svg"
              x={-box / 2}
              y={-box / 2}
              width={box}
              height={box}
              preserveAspectRatio="xMidYMid meet"
              className={styles.diamond}
            />
          </g>
        </svg>

        <div className={styles.percent}>{overall}%</div>
      </div>

      <p className={styles.status} aria-live="polite">
        {statusMessage}
        <span className={styles.dots}>
          <i />
          <i />
          <i />
        </span>
      </p>
      </div>
    </div>
  );
};

export default LoaderV2;

