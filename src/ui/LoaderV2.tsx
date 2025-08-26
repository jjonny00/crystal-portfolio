// src/ui/LoaderV2.tsx
// Radial loader showing initialization, asset loading, and performance testing

import React, { useEffect, useState } from 'react';
import styles from './LoaderV2.module.css';

const clamp = (v: number) => Math.min(1, Math.max(0, v));

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

  const [outer, setOuter] = useState(0);
  const [middle, setMiddle] = useState(0);
  const [inner, setInner] = useState(0);

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
    <div className={`${styles.overlay} ${exiting ? styles.fadeOut : ''}`}>
      <h1 className={styles.headline}>
        Multifaceted Designer
        <span className={styles.subhead}></span>
      </h1>

      <div className={styles.meter}>
        <svg
          className={styles.svg}
          viewBox={`-${size / 2} -${size / 2} ${size} ${size}`}
        >
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
  );
};

export default LoaderV2;

