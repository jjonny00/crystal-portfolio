export const HERO_OVERVIEW_CINEMATIC_CONFIG_SOURCE = 'src/config/heroOverviewCinematicConfig.js';

export const HERO_OVERVIEW_CINEMATIC_CONFIG = {
  timeline: {
    totalDurationSeconds: 2,
    fractureHold: 0.28,
    explosionImpulse: 0.01,
    bulletTime: 0.01,
    overviewTravel: 0.6,
    overviewSettle: 0.07,
  },

  camera: {
    explosionPunchDistance: 0.06,
    bulletTimeDriftDistance: 0.0,
    travelEase: 'cinematicRevealOut',
    settleEase: 'smoothSettle',
    punchEase: 'smoothSettle',
    driftEase: 'smoothSettle',
  },

  fracture: {
    holdDuration: 0.6,
    travelDuration: 2.5,
    travelEase: 'easeOutExpo',
    fractureDistanceMultiplier: 1.0,
    spreadMultiplier: 1.0,
    depthMultiplier: 1.0,
    wired: true,
    multipliersWired: {
      fractureDistanceMultiplier: 'fallback-only',
      spreadMultiplier: false,
      depthMultiplier: false,
    },
    notes: 'Controls Hero → Overview facet explosion hold/travel timing. Ring and particles remain separate follow-ups.',
  },

  particles: {
    enabled: true,
    triggerAt: 0.28,
    delay: 0,
    duration: null,
    wired: false,
    notes: 'Particles should be wired to the Hero → Overview route timeline in this pass. Duration may remain component-driven if unsafe to wire.',
  },

  ring: {
    enabled: true,
    triggerAt: 0.28,
    duration: 0.8,
    startScale: 0.2,
    endScale: 3.5,
    easing: 'sinePulse',
    wired: false,
    notes: 'Ring trigger/timing should be wired to the Hero → Overview route timeline in this pass.',
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

const DURATION_TO_PHASE = [
  ['fractureHold', 'fractureCharge'],
  ['explosionImpulse', 'explosionImpulse'],
  ['bulletTime', 'bulletTimeSlowdown'],
  ['overviewTravel', 'overviewTravel'],
  ['overviewSettle', 'overviewSettle'],
];

const DEFAULT_TOTAL_DURATION_SECONDS = HERO_OVERVIEW_CINEMATIC_CONFIG.timeline.totalDurationSeconds;
const DEFAULT_FRACTURE_CONFIG = { ...HERO_OVERVIEW_CINEMATIC_CONFIG.fracture };
const DEFAULT_DURATIONS = DURATION_TO_PHASE.reduce((acc, [durationKey]) => {
  acc[durationKey] = HERO_OVERVIEW_CINEMATIC_CONFIG.timeline[durationKey];
  return acc;
}, {});

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

const readPositiveSeconds = (value, fallback) => (
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback
);

const readNonNegativeSeconds = (value, fallback) => (
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback
);

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
  const rawTotalDurationSeconds = config?.timeline?.totalDurationSeconds;
  const invalidTotalDuration = !(
    typeof rawTotalDurationSeconds === 'number' &&
    Number.isFinite(rawTotalDurationSeconds) &&
    rawTotalDurationSeconds > 0
  );
  const totalDurationSeconds = readPositiveSeconds(rawTotalDurationSeconds, DEFAULT_TOTAL_DURATION_SECONDS);
  const totalDurationFallbackUsed = invalidTotalDuration;
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
    const normalizedDuration = Math.max(0, end - start);
    acc[phaseName] = {
      start,
      end,
      durationWeight: safeDurations[durationKey],
      normalizedDuration,
      durationSeconds: Number((normalizedDuration * totalDurationSeconds).toFixed(4)),
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

  const invalidFractureKeys = [];
  const rawFracture = { ...(config?.fracture || {}) };
  const pushInvalidFractureKey = (key) => {
    if (!invalidFractureKeys.includes(key)) invalidFractureKeys.push(key);
  };
  const fractureHoldDuration = readNonNegativeSeconds(rawFracture.holdDuration, DEFAULT_FRACTURE_CONFIG.holdDuration);
  if (!(typeof rawFracture.holdDuration === 'number' && Number.isFinite(rawFracture.holdDuration) && rawFracture.holdDuration >= 0)) {
    pushInvalidFractureKey('holdDuration');
  }
  const fractureTravelDuration = readPositiveSeconds(rawFracture.travelDuration, DEFAULT_FRACTURE_CONFIG.travelDuration);
  if (!(typeof rawFracture.travelDuration === 'number' && Number.isFinite(rawFracture.travelDuration) && rawFracture.travelDuration > 0)) {
    pushInvalidFractureKey('travelDuration');
  }
  const fractureTravelEase = readEasingName(rawFracture.travelEase, DEFAULT_FRACTURE_CONFIG.travelEase);
  if (!(typeof rawFracture.travelEase === 'string' && HERO_OVERVIEW_EASING[rawFracture.travelEase])) {
    pushInvalidFractureKey('travelEase');
  }
  const fractureDistanceMultiplier = readPositiveSeconds(rawFracture.fractureDistanceMultiplier, DEFAULT_FRACTURE_CONFIG.fractureDistanceMultiplier);
  if (!(typeof rawFracture.fractureDistanceMultiplier === 'number' && Number.isFinite(rawFracture.fractureDistanceMultiplier) && rawFracture.fractureDistanceMultiplier > 0)) {
    pushInvalidFractureKey('fractureDistanceMultiplier');
  }
  const spreadMultiplier = readPositiveSeconds(rawFracture.spreadMultiplier, DEFAULT_FRACTURE_CONFIG.spreadMultiplier);
  if (!(typeof rawFracture.spreadMultiplier === 'number' && Number.isFinite(rawFracture.spreadMultiplier) && rawFracture.spreadMultiplier > 0)) {
    pushInvalidFractureKey('spreadMultiplier');
  }
  const depthMultiplier = readPositiveSeconds(rawFracture.depthMultiplier, DEFAULT_FRACTURE_CONFIG.depthMultiplier);
  if (!(typeof rawFracture.depthMultiplier === 'number' && Number.isFinite(rawFracture.depthMultiplier) && rawFracture.depthMultiplier > 0)) {
    pushInvalidFractureKey('depthMultiplier');
  }
  const fracture = {
    ...DEFAULT_FRACTURE_CONFIG,
    ...rawFracture,
    holdDuration: fractureHoldDuration,
    travelDuration: fractureTravelDuration,
    travelEase: fractureTravelEase,
    fractureDistanceMultiplier,
    spreadMultiplier,
    depthMultiplier,
    totalDuration: Number((fractureHoldDuration + fractureTravelDuration).toFixed(4)),
    wired: true,
    multipliersWired: {
      fractureDistanceMultiplier: 'fallback-only',
      spreadMultiplier: false,
      depthMultiplier: false,
    },
    invalidKeys: invalidFractureKeys,
    fallbackUsed: invalidFractureKeys.length > 0,
  };

  return {
    sourceFile: HERO_OVERVIEW_CINEMATIC_CONFIG_SOURCE,
    sourceName: 'HERO_OVERVIEW_CINEMATIC_CONFIG',
    rawDurations,
    rawTotalDurationSeconds,
    durations: safeDurations,
    configuredPhaseWeights: safeDurations,
    totalDurationSeconds,
    resolvedTotalDurationSeconds: totalDurationSeconds,
    totalDurationFallbackUsed,
    invalidTotalDuration,
    derivedTimeline: timeline,
    derivedPhaseDurationsSeconds: Object.fromEntries(
      Object.entries(timeline).map(([phaseName, phase]) => [phaseName, phase.durationSeconds]),
    ),
    camera,
    fracture,
    rawFracture,
    invalidFractureKeys,
    fractureConfigFallbackUsed: fracture.fallbackUsed,
    particles: {
      ...HERO_OVERVIEW_CINEMATIC_CONFIG.particles,
      ...(config?.particles || {}),
      routeTimelineWired: true,
      triggerAtUnits: 'seconds-from-hero-overview-start',
      unwiredFields: {
        duration: 'FractureBurstParticles randomizes per-particle lifetimes internally; duration remains a placeholder.',
      },
    },
    ring: {
      ...HERO_OVERVIEW_CINEMATIC_CONFIG.ring,
      ...(config?.ring || {}),
      routeTimelineWired: true,
      triggerAtUnits: 'seconds-from-hero-overview-start',
      mappedProps: {
        duration: 'FractureRingImage.duration',
        startScale: 'FractureRingImage.baseSize',
        endScale: 'FractureRingImage.maxScale',
        easing: 'FractureRingImage.scaleEasing',
      },
      unwiredFields: {},
    },
    totalConfiguredDuration,
    normalizedDurationTotal: safeTotal,
    defaultsUsed: invalidDurationKeys.length > 0 || invalidTotal || totalDurationFallbackUsed || fracture.fallbackUsed,
    invalidConfigFallbackOccurred: invalidDurationKeys.length > 0 || invalidTotal || totalDurationFallbackUsed || fracture.fallbackUsed,
    invalidDurationKeys,
    invalidTotal,
  };
};

export const HERO_OVERVIEW_CINEMATIC_RESOLVED = resolveHeroOverviewCinematicConfig();
