import { useMemo, useRef } from 'react';

const DEFAULT_TIMING = {
  totalDurationMs: 1500,
  fractureChargeEnd: 0.0933333333,
  explosionImpulseEnd: 0.24,
  bulletTimeSlowdownEnd: 0.72,
  overviewSettleEnd: 1.0,
  cameraPushbackDistance: 0.18,
  cameraPushbackStrength: 1.4,
  cameraPushbackDecayStart: 0.36,
  cameraPushbackDecayEnd: 0.72,
  // Practical starter scale; keep >1 support for iterative tuning.
  cameraPushbackApplyScale: 2,
  // Practical starter fragment impulse defaults for iterative tuning.
  fragmentImpulseDistance: 0.65,
  fragmentImpulseStrength: 1.4,
  fragmentRotationStrength: 0.55,
  fragmentImpulseApplyScale: 1.0,
  fragmentImpulseDecayStart: 0.36,
  fragmentImpulseDecayEnd: 0.72,
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

export const resolveHeroOverviewRuntimeTiming = (timingOverrides = {}) => {
  const merged = {
    ...DEFAULT_TIMING,
    ...(timingOverrides || {}),
  };

  const totalDurationMs =
    typeof merged.totalDurationMs === 'number' && Number.isFinite(merged.totalDurationMs) && merged.totalDurationMs > 0
      ? merged.totalDurationMs
      : DEFAULT_TIMING.totalDurationMs;

  const clamp = (value, fallback, min = 0, max = 1) => {
    const numeric = typeof value === 'number' && Number.isFinite(value) ? value : fallback;
    return Math.min(Math.max(numeric, min), max);
  };

  const fractureChargeEnd = clamp(merged.fractureChargeEnd, DEFAULT_TIMING.fractureChargeEnd);
  const explosionImpulseEnd = clamp(merged.explosionImpulseEnd, DEFAULT_TIMING.explosionImpulseEnd, fractureChargeEnd, 1);
  const bulletTimeSlowdownEnd = clamp(
    merged.bulletTimeSlowdownEnd,
    DEFAULT_TIMING.bulletTimeSlowdownEnd,
    explosionImpulseEnd,
    1,
  );
  const overviewSettleEnd = clamp(merged.overviewSettleEnd, DEFAULT_TIMING.overviewSettleEnd, bulletTimeSlowdownEnd, 1);
  const cameraPushbackDistance =
    typeof merged.cameraPushbackDistance === 'number' && Number.isFinite(merged.cameraPushbackDistance)
      ? Math.max(0, merged.cameraPushbackDistance)
      : DEFAULT_TIMING.cameraPushbackDistance;
  const cameraPushbackStrength =
    typeof merged.cameraPushbackStrength === 'number' && Number.isFinite(merged.cameraPushbackStrength)
      ? Math.max(0, merged.cameraPushbackStrength)
      : DEFAULT_TIMING.cameraPushbackStrength;
  const cameraPushbackDecayStart = clamp(
    merged.cameraPushbackDecayStart,
    DEFAULT_TIMING.cameraPushbackDecayStart,
    explosionImpulseEnd,
    1,
  );
  const cameraPushbackDecayEnd = clamp(
    merged.cameraPushbackDecayEnd,
    DEFAULT_TIMING.cameraPushbackDecayEnd,
    cameraPushbackDecayStart,
    1,
  );
  const cameraPushbackApplyScale =
    typeof merged.cameraPushbackApplyScale === 'number' && Number.isFinite(merged.cameraPushbackApplyScale)
      // Keep uncapped above 1 so temporary diagnostic scales (e.g. 100) survive resolution.
      ? Math.min(Math.max(merged.cameraPushbackApplyScale, 0), 200)
      : DEFAULT_TIMING.cameraPushbackApplyScale;
  const fragmentImpulseDistance =
    typeof merged.fragmentImpulseDistance === 'number' && Number.isFinite(merged.fragmentImpulseDistance)
      ? Math.max(0, merged.fragmentImpulseDistance)
      : DEFAULT_TIMING.fragmentImpulseDistance;
  const fragmentImpulseStrength =
    typeof merged.fragmentImpulseStrength === 'number' && Number.isFinite(merged.fragmentImpulseStrength)
      ? Math.max(0, merged.fragmentImpulseStrength)
      : DEFAULT_TIMING.fragmentImpulseStrength;
  const fragmentRotationStrength =
    typeof merged.fragmentRotationStrength === 'number' && Number.isFinite(merged.fragmentRotationStrength)
      ? Math.max(0, merged.fragmentRotationStrength)
      : DEFAULT_TIMING.fragmentRotationStrength;
  const fragmentImpulseApplyScale =
    typeof merged.fragmentImpulseApplyScale === 'number' && Number.isFinite(merged.fragmentImpulseApplyScale)
      ? Math.min(Math.max(merged.fragmentImpulseApplyScale, 0), 200)
      : DEFAULT_TIMING.fragmentImpulseApplyScale;
  const fragmentImpulseDecayStart = clamp(
    merged.fragmentImpulseDecayStart,
    DEFAULT_TIMING.fragmentImpulseDecayStart,
    explosionImpulseEnd,
    1,
  );
  const fragmentImpulseDecayEnd = clamp(
    merged.fragmentImpulseDecayEnd,
    DEFAULT_TIMING.fragmentImpulseDecayEnd,
    fragmentImpulseDecayStart,
    1,
  );

  return {
    totalDurationMs,
    fractureChargeEnd,
    explosionImpulseEnd,
    bulletTimeSlowdownEnd,
    overviewSettleEnd,
    cameraPushbackDistance,
    cameraPushbackStrength,
    cameraPushbackDecayStart,
    cameraPushbackDecayEnd,
    cameraPushbackApplyScale,
    fragmentImpulseDistance,
    fragmentImpulseStrength,
    fragmentRotationStrength,
    fragmentImpulseApplyScale,
    fragmentImpulseDecayStart,
    fragmentImpulseDecayEnd,
  };
};

const derivePhaseFromProgress = (progress, timing) => {
  const fractureEnd = timing.fractureChargeEnd;
  const impulseEnd = timing.explosionImpulseEnd;
  const slowdownEnd = timing.bulletTimeSlowdownEnd;
  const settleEnd = timing.overviewSettleEnd;

  if (progress <= 0) return PHASES.FRACTURE_CHARGE;
  if (progress < fractureEnd) return PHASES.FRACTURE_CHARGE;
  if (progress < impulseEnd) return PHASES.EXPLOSION_IMPULSE;
  if (progress < slowdownEnd) return PHASES.BULLET_TIME_SLOWDOWN;
  if (progress < settleEnd) return PHASES.OVERVIEW_SETTLE;
  return PHASES.COMPLETE;
};

export const createHeroOverviewRuntime = (durationOverrides = {}) => {
  const timing = resolveHeroOverviewRuntimeTiming(durationOverrides);
  const state = {
    active: false,
    startedAt: 0,
    progress: 0,
    phase: PHASES.IDLE,
    lastPhaseLogged: PHASES.IDLE,
    timing,
    director: {
      active: false,
      startedAt: 0,
      releasedCleanly: false,
      summaryLogged: false,
      stats: {
        directorCameraFrames: 0,
        directorFragmentFrames: 0,
        blockedLegacyCameraFrames: 0,
        blockedLegacyFragmentFrames: 0,
        anyNonDirectorCameraWriterDuringDirector: false,
        anyNonDirectorFragmentWriterDuringDirector: false,
      },
    },
  };

  return {
    start: ({ startedAt = performance.now(), source = 'unknown' } = {}) => {
      if (state.active) {
        runtimeDebug('duplicate start ignored', {
          source,
          startedAt: Math.round(startedAt),
          activePhase: state.phase,
          progress: Number(state.progress.toFixed(3)),
        });
        return false;
      }

      state.active = true;
      state.startedAt = startedAt;
      state.progress = 0;
      state.phase = PHASES.FRACTURE_CHARGE;
      state.lastPhaseLogged = '';
      state.director.active = true;
      state.director.startedAt = startedAt;
      state.director.releasedCleanly = false;
      state.director.summaryLogged = false;
      state.director.stats = {
        directorCameraFrames: 0,
        directorFragmentFrames: 0,
        blockedLegacyCameraFrames: 0,
        blockedLegacyFragmentFrames: 0,
        anyNonDirectorCameraWriterDuringDirector: false,
        anyNonDirectorFragmentWriterDuringDirector: false,
      };
      runtimeDebug('start', {
        source,
        startedAt: Math.round(startedAt),
        timing: state.timing,
      });
      runtimeDebug('trigger source', { source });
      return true;
    },
    update: (now = performance.now()) => {
      if (!state.active) return;

      const elapsedMs = Math.max(0, now - state.startedAt);
      const normalized = state.timing.totalDurationMs > 0
        ? Math.min(1, elapsedMs / state.timing.totalDurationMs)
        : 1;

      state.progress = normalized;
      const nextPhase = derivePhaseFromProgress(normalized, state.timing);

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
        state.director.active = false;
        state.director.releasedCleanly = true;
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
      timing: state.timing,
      director: {
        ...state.director,
        stats: { ...state.director.stats },
      },
    }),
    markDirectorFrame: (type) => {
      if (!state.director.active) return;
      if (type === 'camera') state.director.stats.directorCameraFrames += 1;
      if (type === 'fragments') state.director.stats.directorFragmentFrames += 1;
    },
    markBlockedLegacyFrame: (type) => {
      if (!state.director.active) return;
      if (type === 'camera') state.director.stats.blockedLegacyCameraFrames += 1;
      if (type === 'fragments') state.director.stats.blockedLegacyFragmentFrames += 1;
    },
    markNonDirectorWriter: (type) => {
      if (!state.director.active) return;
      if (type === 'camera') state.director.stats.anyNonDirectorCameraWriterDuringDirector = true;
      if (type === 'fragments') state.director.stats.anyNonDirectorFragmentWriterDuringDirector = true;
    },
    logDirectorSummary: (summary) => {
      if (state.director.summaryLogged) return;
      state.director.summaryLogged = true;
      console.log('[hero-overview-director] summary', summary);
    },
    resetToIdle: ({ reason = 'manual-reset' } = {}) => {
      const wasActive = state.active;
      state.active = false;
      state.startedAt = 0;
      state.progress = 0;
      state.phase = PHASES.IDLE;
      state.lastPhaseLogged = PHASES.IDLE;
      runtimeDebug('reset to idle', {
        reason,
        wasActive,
      });
    },
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
