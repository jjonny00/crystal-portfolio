// Strict contract so progress math can’t drift.

export type LoaderPhase = 'testing' | 'loading' | 'ready';

export interface LoaderSnapshot {
  phase: LoaderPhase;
  testPct: number;          // 0..100
  assetsPct: number;        // 0..100
  performanceReady: boolean;
  assetsReady: boolean;
  status?: string;          // optional override (UPPERCASE)
}

export interface RingState {
  innerPerf: number;   // 0..100 (moves only in 'testing', else 0 or 100)
  middleAssets: number;// 0..100 (moves only in 'loading', else 0 or 100)
  outerOverall: number;// 0..100 (<=99 until both ready, then 100)
  ready: boolean;
  status: string;      // line below the meter
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export function computeRings(s: LoaderSnapshot): RingState {
  // Sanitize
  const test = clamp(s.testPct);
  const assets = clamp(s.assetsPct);
  const perfDone = !!s.performanceReady || test >= 100;
  const assetsDone = !!s.assetsReady || assets >= 100;
  const ready = perfDone && assetsDone;

  // Inner (performance) — moves only during testing
  const innerPerf =
    s.phase === 'testing' ? test : (perfDone ? 100 : 0);

  // Middle (assets) — moves only during loading
  const middleAssets =
    s.phase === 'loading' ? assets : (assetsDone ? 100 : 0);

  // Composite: 50/50 split
  const composite =
    0.5 * (perfDone ? 1 : test / 100) +
    0.5 * (assetsDone ? 1 : assets / 100);

  // Outer (overall): <=99 until truly ready, then snap to 100
  const outerOverall = ready ? 100 : Math.min(99, Math.round(composite * 100));

  const status =
    s.status ??
    (s.phase === 'testing'
      ? 'TESTING PERFORMANCE'
      : s.phase === 'loading'
      ? 'LOADING ASSETS'
      : ready
      ? 'READY'
      : 'FINALIZING…');

  // Assertions (visible in console) to catch wrong wiring during dev
  if (s.phase === 'testing' && assets > 0 && !assetsDone) {
    console.warn('[Loader] Assets ring must not progress during testing phase.');
  }
  if (s.phase === 'loading' && test < 100 && !perfDone) {
    console.warn('[Loader] Performance ring must be 100 when loading starts.');
  }

  return { innerPerf, middleAssets, outerOverall, ready, status };
}
