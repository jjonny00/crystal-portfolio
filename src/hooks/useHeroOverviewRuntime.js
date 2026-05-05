import { useMemo, useRef } from 'react';

const DEFAULT_DURATIONS_MS = {
  fractureCharge: 140,
  explosionImpulse: 220,
  bulletTimeSlowdown: 720,
  overviewSettle: 420,
};

const PHASES = {
  IDLE: 'idle',
  FRACTURE_CHARGE: 'fractureCharge',
  EXPLOSION_IMPULSE: 'explosionImpulse',
  BULLET_TIME_SLOWDOWN: 'bulletTimeSlowdown',
  OVERVIEW_SETTLE: 'overviewSettle',
  COMPLETE: 'complete',
};

const debugEnabled = () => {
  if (typeof globalThis === 'undefined') return false;
  return Boolean(globalThis.__HERO_OVERVIEW_RUNTIME_DEBUG__);
};

const runtimeDebug = (type, payload) => {
  if (!debugEnabled()) return;
  console.log(`[hero-overview-runtime] ${type}`, payload);
};

const derivePhaseFromElapsed = (elapsedMs, durations) => {
  const fractureEnd = durations.fractureCharge;
  const impulseEnd = fractureEnd + durations.explosionImpulse;
  const slowdownEnd = impulseEnd + durations.bulletTimeSlowdown;
  const settleEnd = slowdownEnd + durations.overviewSettle;

  if (elapsedMs <= 0) return PHASES.FRACTURE_CHARGE;
  if (elapsedMs < fractureEnd) return PHASES.FRACTURE_CHARGE;
  if (elapsedMs < impulseEnd) return PHASES.EXPLOSION_IMPULSE;
  if (elapsedMs < slowdownEnd) return PHASES.BULLET_TIME_SLOWDOWN;
  if (elapsedMs < settleEnd) return PHASES.OVERVIEW_SETTLE;
  return PHASES.COMPLETE;
};

const getTotalDuration = (durations) => Object.values(durations).reduce((acc, ms) => acc + ms, 0);

export const createHeroOverviewRuntime = (durationOverrides = {}) => {
  const durations = {
    ...DEFAULT_DURATIONS_MS,
    ...(durationOverrides || {}),
  };

  const totalDurationMs = getTotalDuration(durations);
  const state = {
    active: false,
    startedAt: 0,
    progress: 0,
    phase: PHASES.IDLE,
    lastPhaseLogged: PHASES.IDLE,
    durations,
    totalDurationMs,
  };

  return {
    start: ({ startedAt = performance.now(), source = 'unknown' } = {}) => {
      state.active = true;
      state.startedAt = startedAt;
      state.progress = 0;
      state.phase = PHASES.FRACTURE_CHARGE;
      state.lastPhaseLogged = '';
      runtimeDebug('start', {
        source,
        startedAt: Math.round(startedAt),
        totalDurationMs: state.totalDurationMs,
      });
    },
    update: (now = performance.now()) => {
      if (!state.active) return;

      const elapsedMs = Math.max(0, now - state.startedAt);
      const normalized = state.totalDurationMs > 0
        ? Math.min(1, elapsedMs / state.totalDurationMs)
        : 1;

      state.progress = normalized;
      const nextPhase = derivePhaseFromElapsed(elapsedMs, state.durations);

      if (nextPhase !== state.lastPhaseLogged) {
        state.lastPhaseLogged = nextPhase;
        runtimeDebug('phase', {
          phase: nextPhase,
          elapsedMs: Math.round(elapsedMs),
          progress: Number(normalized.toFixed(3)),
        });
      }

      state.phase = nextPhase;

      if (nextPhase === PHASES.COMPLETE) {
        state.active = false;
        runtimeDebug('complete', {
          elapsedMs: Math.round(elapsedMs),
          progress: 1,
        });
      }
    },
    getSnapshot: () => ({
      active: state.active,
      startedAt: state.startedAt,
      progress: state.progress,
      phase: state.phase,
      durations: state.durations,
      totalDurationMs: state.totalDurationMs,
    }),
  };
};

export const useHeroOverviewRuntime = (durationOverrides) => {
  const runtimeRef = useRef(null);

  const overridesKey = useMemo(() => JSON.stringify(durationOverrides || {}), [durationOverrides]);

  if (!runtimeRef.current || runtimeRef.current.__overridesKey !== overridesKey) {
    const runtime = createHeroOverviewRuntime(durationOverrides);
    runtime.__overridesKey = overridesKey;
    runtimeRef.current = runtime;
  }

  return runtimeRef.current;
};

export { PHASES as HERO_OVERVIEW_RUNTIME_PHASES };
