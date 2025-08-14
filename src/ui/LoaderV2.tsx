import React from 'react';
import styles from './LoaderV2.module.css';
import { computeRings, LoaderSnapshot } from '../loader/loaderContract';

type Props = LoaderSnapshot;

const S = 240;            // viewBox extent
const R_OUTER = 100;      // outer ring radius
const GAP = 20;           // spacing
const R_MID   = R_OUTER - GAP;
const R_INNER = R_OUTER - GAP * 2;

const RingPair = ({ r, pct, colorVar }:{ r:number; pct:number; colorVar:string }) => {
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, Math.round(pct)));
  const dashOffset = c * (1 - p / 100);
  return (
    <>
      <circle cx="0" cy="0" r={r} stroke="var(--ringTrack)" strokeWidth="var(--ringStroke)" fill="none" strokeLinecap="round" className={styles.track}/>
      <circle cx="0" cy="0" r={r} stroke={colorVar} strokeWidth="var(--ringStroke)" fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={dashOffset} className={styles.progress}/>
    </>
  );
};

export default function LoaderV2(snapshot: Props) {
  const rings = computeRings(snapshot);

  // diamond sizing from spec: safeRadius = R_INNER - (stroke * 1.5); diamondBox = safeRadius * 1.10 * 2
  const strokeVar = getComputedStyle(document.documentElement).getPropertyValue('--ringStroke') || '6';
  const STROKE = Number(strokeVar.trim());
  const safeRadius = R_INNER - (STROKE * 1.5);
  const diamondBox = safeRadius * 1.10 * 2;

  return (
    <div className={styles.overlay} role="status" aria-live="polite">
      {/* Headline per spec/mock */}
      <h1 className={styles.headline}>
        JON SHAW
        <span className={styles.subhead}>PRODUCT DESIGNER</span>
      </h1>

      <div className={styles.meter}>
        <svg className={styles.svg} viewBox={`${-S/2} ${-S/2} ${S} ${S}`} aria-hidden="true">
          {/* Start at 6 o’clock (BOTTOM) and sweep clockwise — rotate rings only, not diamond */}
          <g transform="rotate(90)">
            <RingPair r={R_OUTER} pct={rings.outerOverall}  colorVar="var(--ring1)"/>
            <RingPair r={R_MID}   pct={rings.middleAssets} colorVar="var(--ring2)"/>
            <RingPair r={R_INNER} pct={rings.innerPerf}    colorVar="var(--ring3)"/>
          </g>

          {/* Diamond centered, no rotation, meet */}
          <image
            href="/assets/ui/diamond.svg"
            x={-diamondBox/2}
            y={-diamondBox/2}
            width={diamondBox}
            height={diamondBox}
            preserveAspectRatio="xMidYMid meet"
            className={styles.diamond}
          />
        </svg>
      </div>

      {/* ONLY status text changes */}
      <div className={styles.status}>
        {rings.status}
        {!rings.ready && <span className={styles.dots} aria-hidden="true"><i/><i/><i/></span>}
      </div>
    </div>
  );
}
