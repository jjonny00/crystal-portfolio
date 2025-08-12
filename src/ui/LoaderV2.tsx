import React, { useMemo } from 'react';
import styles from './LoaderV2.module.css';

export type LoaderV2Props = {
  phase: 'starting' | 'loading' | 'testing';
  phaseProgress: number; // 0..1
  overallProgress: number; // 0..1
};

const statusText = (phase: LoaderV2Props['phase']) => {
  switch (phase) {
    case 'starting':
      return 'Starting';
    case 'loading':
      return 'Loading';
    case 'testing':
      return 'Testing';
    default:
      return '';
  }
};

const LoaderV2: React.FC<LoaderV2Props> = ({ phase, phaseProgress, overallProgress }) => {
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);
  const stroke = isMobile ? 4 : 6;
  const R = 100;
  const gap = 10;
  const safeRadius = R - (stroke * 1.5) - gap;
  const D = safeRadius * 1.10;
  const box = D * 2;

  const radii = [R, R - stroke * 4, R - stroke * 8];

  const ringProgress = useMemo(() => ({
    outer: phase === 'starting' ? phaseProgress : 1,
    middle: phase === 'loading' ? phaseProgress : phase === 'testing' ? 1 : 0,
    inner: phase === 'testing' ? phaseProgress : 0
  }), [phase, phaseProgress]);

  const circumference = (r: number) => 2 * Math.PI * r;
  const S = (R + stroke) * 2;

  const percent = Math.round(overallProgress * 100);

  return (
    <div className={styles.loader}>
      <h1 className={styles.title}>Multifaceted Designer</h1>
      <svg
        className={styles.meter}
        viewBox={`${-S / 2} ${-S / 2} ${S} ${S}`}
        width={S}
        height={S}
      >
        {radii.map((radius, i) => {
          const prog = [ringProgress.outer, ringProgress.middle, ringProgress.inner][i];
          const color = ['var(--ring1, #9CF6DC)', 'var(--ring2, #B2A3FF)', 'var(--ring3, #FFB15A)'][i];
          const c = circumference(radius);
          return (
            <g key={i}>
              <circle
                r={radius}
                fill="none"
                stroke="var(--ringTrack, rgba(255,255,255,0.08))"
                strokeWidth={stroke}
              />
              <circle
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth={stroke}
                strokeDasharray={`${c} ${c}`}
                strokeDashoffset={c * (1 - prog)}
                strokeLinecap="round"
                className={styles.progress}
              />
            </g>
          );
        })}
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <image
          href="/assets/ui/diamond.svg"
          x={-box / 2}
          y={-box / 2}
          width={box}
          height={box}
          preserveAspectRatio="xMidYMid meet"
          className={styles.diamond}
          pointerEvents="none"
        />
        <text
          x="0"
          y="0"
          textAnchor="middle"
          dominantBaseline="central"
          className={styles.percent}
        >
          {percent}%
        </text>
      </svg>
      <div className={styles.status} aria-live="polite">
        {statusText(phase)}
        <span className={styles.dots}>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </span>
      </div>
    </div>
  );
};

export default LoaderV2;
