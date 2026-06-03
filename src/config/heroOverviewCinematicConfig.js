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
    triggerAt: 0.5,
    delay: 0,
    count: 360,
    color: '#66ffcc',
    emitterPosition: [0, 0, 0],
    spawnRadius: 0.02,
    emitterScale: [1, 1, 1],
    duration: null,
    spread: 0.5,
    lifetime: null,
    lifetimeMin: null,
    lifetimeMax: null,
    speed: null,
    speedMin: null,
    speedMax: null,
    size: null,
    opacity: null,
    wired: true,
    notes: 'Hero → Overview particle trigger plus supported FractureBurstParticles props are config-driven. spawnRadius controls initial emitter tightness; emitterScale shapes the initial emitter volume; spread controls outward travel dispersion. Duration/lifetime/speed/size remain component-internal placeholders until a particle API pass wires them safely.',
  },

  ring: {
    enabled: true,
    triggerAt: 0.55,
    duration: 0.6,
    startScale: 0.05,
    endScale: 25.5,
    easing: 'easeOutExpo',
    wired: true,
    notes: 'Ring trigger/timing is wired to the Hero → Overview route timeline.',
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
const DEFAULT_PARTICLES_CONFIG = { ...HERO_OVERVIEW_CINEMATIC_CONFIG.particles };
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

const readPositiveInteger = (value, fallback) => (
  Number.isInteger(value) && value > 0 ? value : fallback
);

const isHexColorString = (value) => typeof value === 'string' && /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(value);

const readVec3 = (value, fallback) => (
  Array.isArray(value) &&
  value.length === 3 &&
  value.every((entry) => typeof entry === 'number' && Number.isFinite(entry))
    ? value
    : fallback
);

const readNonNegativeVec3 = (value, fallback) => (
  Array.isArray(value) &&
  value.length === 3 &&
  value.every((entry) => typeof entry === 'number' && Number.isFinite(entry) && entry >= 0)
    ? value
    : fallback
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

  const invalidParticleKeys = [];
  const rawParticles = { ...(config?.particles || {}) };
  const pushInvalidParticleKey = (key) => {
    if (!invalidParticleKeys.includes(key)) invalidParticleKeys.push(key);
  };
  const particleEnabled = typeof rawParticles.enabled === 'boolean' ? rawParticles.enabled : DEFAULT_PARTICLES_CONFIG.enabled;
  if (typeof rawParticles.enabled !== 'boolean') pushInvalidParticleKey('enabled');
  const particleTriggerAt = readNonNegativeSeconds(rawParticles.triggerAt, DEFAULT_PARTICLES_CONFIG.triggerAt);
  if (!(typeof rawParticles.triggerAt === 'number' && Number.isFinite(rawParticles.triggerAt) && rawParticles.triggerAt >= 0)) pushInvalidParticleKey('triggerAt');
  const particleDelay = readNonNegativeSeconds(rawParticles.delay, DEFAULT_PARTICLES_CONFIG.delay);
  if (!(typeof rawParticles.delay === 'number' && Number.isFinite(rawParticles.delay) && rawParticles.delay >= 0)) pushInvalidParticleKey('delay');
  const particleCount = readPositiveInteger(rawParticles.count, DEFAULT_PARTICLES_CONFIG.count);
  if (!(Number.isInteger(rawParticles.count) && rawParticles.count > 0)) pushInvalidParticleKey('count');
  const particleColor = isHexColorString(rawParticles.color) ? rawParticles.color : DEFAULT_PARTICLES_CONFIG.color;
  if (!isHexColorString(rawParticles.color)) pushInvalidParticleKey('color');
  const particleEmitterPosition = readVec3(rawParticles.emitterPosition, DEFAULT_PARTICLES_CONFIG.emitterPosition);
  if (particleEmitterPosition !== rawParticles.emitterPosition) pushInvalidParticleKey('emitterPosition');
  const particleSpawnRadius = readNonNegativeNumber(rawParticles.spawnRadius, DEFAULT_PARTICLES_CONFIG.spawnRadius);
  if (!(typeof rawParticles.spawnRadius === 'number' && Number.isFinite(rawParticles.spawnRadius) && rawParticles.spawnRadius >= 0)) pushInvalidParticleKey('spawnRadius');
  const particleEmitterScale = readNonNegativeVec3(rawParticles.emitterScale, DEFAULT_PARTICLES_CONFIG.emitterScale);
  if (particleEmitterScale !== rawParticles.emitterScale) pushInvalidParticleKey('emitterScale');
  const particleSpread = readNonNegativeNumber(rawParticles.spread, DEFAULT_PARTICLES_CONFIG.spread);
  if (!(typeof rawParticles.spread === 'number' && Number.isFinite(rawParticles.spread) && rawParticles.spread >= 0)) pushInvalidParticleKey('spread');
  const particleFieldsWired = [
    'enabled',
    'triggerAt',
    'delay',
    'count',
    'color',
    'emitterPosition',
    'spawnRadius',
    'emitterScale',
    'spread',
  ];
  const particleFieldsPlaceholders = {
    duration: 'FractureBurstParticles does not consume duration; particle lifetimes are randomized internally.',
    lifetime: 'No single lifetime prop exists yet.',
    lifetimeMin: 'Lifetimes are currently randomized internally between 0.9 and 1.6 seconds.',
    lifetimeMax: 'Lifetimes are currently randomized internally between 0.9 and 1.6 seconds.',
    speed: 'Initial speed is randomized internally.',
    speedMin: 'Initial speed is randomized internally between 4.4 and 6.6, then scaled by particles.spread before vertical adjustment.',
    speedMax: 'Initial speed is randomized internally between 4.4 and 6.6, then scaled by particles.spread before vertical adjustment.',
    size: 'Particle sizes use internal tiered randomization.',
    opacity: 'Opacity is driven by shader alpha/fade constants internally.',
  };
  const particles = {
    ...DEFAULT_PARTICLES_CONFIG,
    ...rawParticles,
    enabled: particleEnabled,
    triggerAt: particleTriggerAt,
    delay: particleDelay,
    count: particleCount,
    color: particleColor,
    emitterPosition: particleEmitterPosition,
    spawnRadius: particleSpawnRadius,
    emitterScale: particleEmitterScale,
    spread: particleSpread,
    wired: true,
    routeTimelineWired: true,
    triggerAtUnits: 'seconds-from-hero-overview-start',
    fieldsWired: particleFieldsWired,
    fieldsPlaceholders: particleFieldsPlaceholders,
    unwiredFields: particleFieldsPlaceholders,
    finalProps: {
      delay: particleDelay,
      count: particleCount,
      color: particleColor,
      emitterPosition: particleEmitterPosition,
      spawnRadius: particleSpawnRadius,
      emitterScale: particleEmitterScale,
      spread: particleSpread,
    },
    invalidKeys: invalidParticleKeys,
    fallbackUsed: invalidParticleKeys.length > 0,
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
    particles,
    rawParticles,
    invalidParticleKeys,
    particleConfigFallbackUsed: particles.fallbackUsed,
    particleFieldsWired,
    particleFieldsPlaceholders,
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
    defaultsUsed: invalidDurationKeys.length > 0 || invalidTotal || totalDurationFallbackUsed || fracture.fallbackUsed || particles.fallbackUsed,
    invalidConfigFallbackOccurred: invalidDurationKeys.length > 0 || invalidTotal || totalDurationFallbackUsed || fracture.fallbackUsed || particles.fallbackUsed,
    invalidDurationKeys,
    invalidTotal,
  };
};

export const HERO_OVERVIEW_CINEMATIC_RESOLVED = resolveHeroOverviewCinematicConfig();
