export const HERO_OVERVIEW_CINEMATIC_CONFIG_SOURCE = 'src/config/heroOverviewCinematicConfig.js';

export const HERO_OVERVIEW_CINEMATIC_CONFIG = {
  timeline: {
    fractureHold: 0.10,
    explosionImpulse: 0.08,
    bulletTime: 0.16,
    overviewTravel: 0.56,
    overviewSettle: 0.10,
  },

  camera: {
    explosionPunchDistance: 0.06,
    bulletTimeDriftDistance: 0,
    travelEase: 'cinematicRevealOut',
    settleEase: 'smoothSettle',
    punchEase: 'sinePulse',
    driftEase: 'sinePulse',
  },

  particles: {
    enabled: true,
    triggerAt: 0.10,
    duration: null,
    wired: false,
    notes: 'Placeholder for Hero → Overview route-phase timing. Current particles fire from UnifiedCrystalScene.runExplodeSwap via burstId and mergedConfig.fracture.particles.',
  },

  ring: {
    enabled: true,
    triggerAt: 0.10,
    duration: null,
    startScale: null,
    endScale: null,
    easing: 'sinePulse',
    wired: false,
    notes: 'Placeholder for Hero → Overview route-phase timing. Current ring is shown by UnifiedCrystalScene.runExplodeSwap and animated by FractureRingImage using mergedConfig.fracture.image.',
  },
};

const clamp01 = (value) => Math.min(Math.max(value, 0), 1);
const roundPhaseBoundary = (value) => Number(clamp01(value).toFixed(10));

export const HERO_OVERVIEW_EASING = {
  linear: (t) => clamp01(t),
  smoothstep: (t) => {
    const x = clamp01(t);
    return x * x * (3 - 2 * x);
  },
  smootherstep: (t) => {
    const x = clamp01(t);
    return x * x * x * (x * (x * 6 - 15) + 10);
  },
  easeOutCubic: (t) => {
    const x = clamp01(t);
    return 1 - ((1 - x) ** 3);
  },
  easeOutExpo: (t) => {
    const x = clamp01(t);
    return x >= 1 ? 1 : clamp01(1 - (2 ** (-10 * x)));
  },
  expoOut: (t) => {
    const x = clamp01(t);
    return x >= 1 ? 1 : clamp01(1 - (2 ** (-10 * x)));
  },
  cinematicRevealOut: (t) => {
    const x = clamp01(t);
    return x >= 1 ? 1 : clamp01(1 - ((1 - x) ** 3.4));
  },
  sinePulse: (t) => Math.sin(Math.PI * clamp01(t)),
  smoothSettle: (t) => {
    const x = clamp01(t);
    return x * x * (3 - 2 * x);
  },
};

const DEFAULT_DURATIONS = { ...HERO_OVERVIEW_CINEMATIC_CONFIG.timeline };
const DURATION_TO_PHASE = [
  ['fractureHold', 'fractureCharge'],
  ['explosionImpulse', 'explosionImpulse'],
  ['bulletTime', 'bulletTimeSlowdown'],
  ['overviewTravel', 'overviewTravel'],
  ['overviewSettle', 'overviewSettle'],
];

const CAMERA_PHASE_META = {
  fractureCharge: {
    cameraMode: 'hold',
    easingKey: null,
    fallbackEasing: 'hold',
    notes: 'Very brief live Hero orbit hold; tune only duration for charge intensity.',
  },
  explosionImpulse: {
    cameraMode: 'impactPunch',
    easingKey: 'punchEase',
    fallbackEasing: 'sinePulse',
    notes: 'Short impact beat with isolated in/out camera punch that returns to the hold pose.',
  },
  bulletTimeSlowdown: {
    cameraMode: 'suspendedHold',
    easingKey: 'driftEase',
    fallbackEasing: 'sinePulse',
    notes: 'Brief suspended tension beat; camera stays locked so overviewTravel releases from a clean pose.',
  },
  overviewTravel: {
    cameraMode: 'travel',
    easingKey: 'travelEase',
    fallbackEasing: 'cinematicRevealOut',
    notes: 'Main reveal: decisive initial dolly-out with a polished slowdown into Overview.',
  },
  overviewSettle: {
    cameraMode: 'settle',
    easingKey: 'settleEase',
    fallbackEasing: 'smoothSettle',
    notes: 'Short exact final lock; no extra float after the reveal.',
  },
};

const readPositiveDuration = (durations, key, fallback, invalidKeys) => {
  const value = durations?.[key];
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value;
  invalidKeys.push(key);
  return fallback;
};

const readNonNegativeNumber = (value, fallback) => (
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback
);

const readEasingName = (value, fallback) => (
  typeof value === 'string' && HERO_OVERVIEW_EASING[value] ? value : fallback
);

export const resolveHeroOverviewCinematicConfig = (config = HERO_OVERVIEW_CINEMATIC_CONFIG) => {
  const invalidDurationKeys = [];
  const rawDurations = { ...(config?.timeline || {}) };
  const resolvedDurations = DURATION_TO_PHASE.reduce((acc, [durationKey]) => {
    acc[durationKey] = readPositiveDuration(rawDurations, durationKey, DEFAULT_DURATIONS[durationKey], invalidDurationKeys);
    return acc;
  }, {});

  const totalConfiguredDuration = Object.values(resolvedDurations).reduce((sum, value) => sum + value, 0);
  const invalidTotal = !(totalConfiguredDuration > 0) || !Number.isFinite(totalConfiguredDuration);
  const safeDurations = invalidTotal ? { ...DEFAULT_DURATIONS } : resolvedDurations;
  const safeTotal = Object.values(safeDurations).reduce((sum, value) => sum + value, 0) || 1;

  let cursor = 0;
  const timeline = DURATION_TO_PHASE.reduce((acc, [durationKey, phaseName], index) => {
    const start = index === 0 ? 0 : cursor;
    const end = index === DURATION_TO_PHASE.length - 1
      ? 1
      : roundPhaseBoundary(cursor + (safeDurations[durationKey] / safeTotal));
    const meta = CAMERA_PHASE_META[phaseName];
    const easing = meta.easingKey
      ? readEasingName(config?.camera?.[meta.easingKey], meta.fallbackEasing)
      : meta.fallbackEasing;
    acc[phaseName] = {
      start,
      end,
      cameraMode: meta.cameraMode,
      easing,
      notes: meta.notes,
    };
    cursor = end;
    return acc;
  }, {});

  const camera = {
    explosionPunchDistance: readNonNegativeNumber(config?.camera?.explosionPunchDistance, HERO_OVERVIEW_CINEMATIC_CONFIG.camera.explosionPunchDistance),
    bulletTimeDriftDistance: readNonNegativeNumber(config?.camera?.bulletTimeDriftDistance, HERO_OVERVIEW_CINEMATIC_CONFIG.camera.bulletTimeDriftDistance),
    travelEase: readEasingName(config?.camera?.travelEase, HERO_OVERVIEW_CINEMATIC_CONFIG.camera.travelEase),
    settleEase: readEasingName(config?.camera?.settleEase, HERO_OVERVIEW_CINEMATIC_CONFIG.camera.settleEase),
    punchEase: readEasingName(config?.camera?.punchEase, HERO_OVERVIEW_CINEMATIC_CONFIG.camera.punchEase),
    driftEase: readEasingName(config?.camera?.driftEase, HERO_OVERVIEW_CINEMATIC_CONFIG.camera.driftEase),
  };

  return {
    sourceFile: HERO_OVERVIEW_CINEMATIC_CONFIG_SOURCE,
    sourceName: 'HERO_OVERVIEW_CINEMATIC_CONFIG',
    rawDurations,
    durations: safeDurations,
    derivedTimeline: timeline,
    camera,
    particles: { ...HERO_OVERVIEW_CINEMATIC_CONFIG.particles, ...(config?.particles || {}) },
    ring: { ...HERO_OVERVIEW_CINEMATIC_CONFIG.ring, ...(config?.ring || {}) },
    totalConfiguredDuration,
    normalizedDurationTotal: safeTotal,
    defaultsUsed: invalidDurationKeys.length > 0 || invalidTotal,
    invalidConfigFallbackOccurred: invalidDurationKeys.length > 0 || invalidTotal,
    invalidDurationKeys,
    invalidTotal,
  };
};

export const HERO_OVERVIEW_CINEMATIC_RESOLVED = resolveHeroOverviewCinematicConfig();
