// src/ui/LoaderV2.tsx
// Radial loader with phase specific rings and diamond center

import React from 'react';
import styles from './LoaderV2.module.css';

const clamp = (v: number) => Math.min(1, Math.max(0, v));

interface LoaderProps {
  phase?: 'starting' | 'loading' | 'testing';
  phaseProgress?: number; // 0..1 for active phase
  overallProgress?: number; // 0..1 overall
  statusMessage?: string;
  testingProgress?: number; // optional explicit progress for testing ring
  loadingProgress?: number; // optional explicit progress for loading ring
}

const LoaderV2: React.FC<LoaderProps> = ({
  phase = 'starting',
  phaseProgress = 0,
  overallProgress = 0,
  statusMessage = '',
  testingProgress = 0,
  loadingProgress = 0
}) => {
  // Loader dimensions
  const size = 260; // matches CSS meter size
  const stroke = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--ringStroke')
  ) || 6;

  const radii = [
    size / 2 - stroke / 2,
    size / 2 - stroke * 3 / 2,
    size / 2 - stroke * 5 / 2
  ];

  // Determine per-ring progress
  let testing = phase === 'testing' ? phaseProgress : testingProgress;
  let loading = phase === 'loading' ? phaseProgress : loadingProgress;

  // Lock completed rings at 100%
  if (phase === 'loading' || phase === 'starting') {
    testing = 1;
  }
  if (phase === 'starting') {
    loading = 0;
  }

  const ringProgress = {
    outer: clamp(overallProgress) * 100,
    middle: clamp(loading) * 100,
    inner: clamp(testing) * 100
  };

  // Diamond sizing based on spec
  const gap = 10;
  const safeRadius = radii[0] - stroke * 1.5 - gap;
  const box = safeRadius * 2.2; // safeRadius*1.1*2

  return (
    <div className={styles.overlay}>
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
            { r: radii[0], color: 'var(--ring1)', progress: ringProgress.outer },
            { r: radii[1], color: 'var(--ring2)', progress: ringProgress.middle },
            { r: radii[2], color: 'var(--ring3)', progress: ringProgress.inner }
          ].map((ring, i) => {
            const circumference = 2 * Math.PI * ring.r;
            const offset = circumference * (1 - ring.progress / 100);
            return (
              <circle
                key={`progress-${i}`}
                className={styles.progress}
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

        <div className={styles.percent}>{Math.round(ringProgress.outer)}%</div>
      </div>

      <p className={styles.status} aria-live="polite">
        {statusMessage}
        <span className={styles.dots}><i/><i/><i/></span>
      </p>
    </div>
  );
};

export default LoaderV2;

