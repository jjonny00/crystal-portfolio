export const HERO_OVERVIEW_CINEMATIC_CONFIG_SOURCE = 'src/config/heroOverviewCinematicConfig.js';

export const HERO_OVERVIEW_CINEMATIC_CONFIG = {
  timeline: {
    totalDurationSeconds: 2,
    fractureHold: 0.31,
    explosionImpulse: 0.055,
    bulletTime: 0.15,
    overviewTravel: 0.92,
    overviewSettle: 0.13,
  },

  camera: {
    explosionPunchDistance: 0.05,
    bulletTimeDriftDistance: 0.01,
    travelEase: 'cinematicRevealOut',
    settleEase: 'smoothSettle',
    punchEase: 'easeOutExpo',
    driftEase: 'smoothSettle',
  },

  fracture: {
    holdDuration: 0.5,
    travelDuration: 1.8,
    travelEase: 'easeOutExpo',
    fractureDistanceMultiplier: 1.0,
    spreadMultiplier: 1.0,
    depthMultiplier: 1.0,
    wired: true,
  },

  particles: {
    enabled: true,
    triggerAt: 0.5,
    delay: 0,
    count: 625,
    color: '#aeecff',
    emitterPosition: [0, 1.1, 0],
    spawnRadius: 0.075,
    emitterScale: [0.07, 15.5, 0.07],
    duration: 1.45,
    spread: 1.2,
    lifetime: null,
    lifetimeMin: 0.05,
    lifetimeMax: 3.0,
    speed: null,
    speedMin: 0.08,
    speedMax: 5.25,
    size: null,
    opacity: 0.72,
    blending: 'additive',
    wired: true,
  },

  ring: {
    enabled: true,
    triggerAt: 0.5,
    duration: 0.28,
    startScale: 0.01,
    endScale: 25.5,
    easing: 'linear',
    wired: true,
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

export const HERO_OVERVIEW_PARTICLE_BLENDING_MODES = ['additive', 'normal', 'subtractive', 'multiply', 'none', 'no'];

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

const readNullablePositiveNumber = (value, fallback = null) => (
  value == null ? null : (typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback)
);

const readNullableNonNegativeNumber = (value, fallback = null) => (
  value == null ? null : (typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback)
);

const readNullableOpacity = (value, fallback = null) => (
  value == null ? null : (typeof value === 'number' && Number.isFinite(value) ? clamp01(value) : fallback)
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

  const particleDuration = readNullablePositiveNumber(rawParticles.duration, DEFAULT_PARTICLES_CONFIG.duration);
  if (!(rawParticles.duration == null || (typeof rawParticles.duration === 'number' && Number.isFinite(rawParticles.duration) && rawParticles.duration > 0))) pushInvalidParticleKey('duration');
  const particleLifetime = readNullablePositiveNumber(rawParticles.lifetime, DEFAULT_PARTICLES_CONFIG.lifetime);
  if (!(rawParticles.lifetime == null || (typeof rawParticles.lifetime === 'number' && Number.isFinite(rawParticles.lifetime) && rawParticles.lifetime > 0))) pushInvalidParticleKey('lifetime');
  let particleLifetimeMin = readNullablePositiveNumber(rawParticles.lifetimeMin, DEFAULT_PARTICLES_CONFIG.lifetimeMin);
  if (!(rawParticles.lifetimeMin == null || (typeof rawParticles.lifetimeMin === 'number' && Number.isFinite(rawParticles.lifetimeMin) && rawParticles.lifetimeMin > 0))) pushInvalidParticleKey('lifetimeMin');
  let particleLifetimeMax = readNullablePositiveNumber(rawParticles.lifetimeMax, DEFAULT_PARTICLES_CONFIG.lifetimeMax);
  if (!(rawParticles.lifetimeMax == null || (typeof rawParticles.lifetimeMax === 'number' && Number.isFinite(rawParticles.lifetimeMax) && rawParticles.lifetimeMax > 0))) pushInvalidParticleKey('lifetimeMax');
  if (particleLifetime == null && particleLifetimeMin != null && particleLifetimeMax != null && particleLifetimeMin > particleLifetimeMax) {
    pushInvalidParticleKey('lifetimeRangeOrder');
    [particleLifetimeMin, particleLifetimeMax] = [particleLifetimeMax, particleLifetimeMin];
  }

  const particleSpeed = readNullableNonNegativeNumber(rawParticles.speed, DEFAULT_PARTICLES_CONFIG.speed);
  if (!(rawParticles.speed == null || (typeof rawParticles.speed === 'number' && Number.isFinite(rawParticles.speed) && rawParticles.speed >= 0))) pushInvalidParticleKey('speed');
  let particleSpeedMin = readNullableNonNegativeNumber(rawParticles.speedMin, DEFAULT_PARTICLES_CONFIG.speedMin);
  if (!(rawParticles.speedMin == null || (typeof rawParticles.speedMin === 'number' && Number.isFinite(rawParticles.speedMin) && rawParticles.speedMin >= 0))) pushInvalidParticleKey('speedMin');
  let particleSpeedMax = readNullableNonNegativeNumber(rawParticles.speedMax, DEFAULT_PARTICLES_CONFIG.speedMax);
  if (!(rawParticles.speedMax == null || (typeof rawParticles.speedMax === 'number' && Number.isFinite(rawParticles.speedMax) && rawParticles.speedMax >= 0))) pushInvalidParticleKey('speedMax');
  if (particleSpeed == null && particleSpeedMin != null && particleSpeedMax != null && particleSpeedMin > particleSpeedMax) {
    pushInvalidParticleKey('speedRangeOrder');
    [particleSpeedMin, particleSpeedMax] = [particleSpeedMax, particleSpeedMin];
  }

  const particleSize = readNullablePositiveNumber(rawParticles.size, DEFAULT_PARTICLES_CONFIG.size);
  if (!(rawParticles.size == null || (typeof rawParticles.size === 'number' && Number.isFinite(rawParticles.size) && rawParticles.size > 0))) pushInvalidParticleKey('size');
  const particleOpacity = readNullableOpacity(rawParticles.opacity, DEFAULT_PARTICLES_CONFIG.opacity);
  if (!(rawParticles.opacity == null || (typeof rawParticles.opacity === 'number' && Number.isFinite(rawParticles.opacity)))) pushInvalidParticleKey('opacity');
  if (typeof rawParticles.opacity === 'number' && Number.isFinite(rawParticles.opacity) && (rawParticles.opacity < 0 || rawParticles.opacity > 1)) pushInvalidParticleKey('opacityClamped');
  const particleBlending = typeof rawParticles.blending === 'string' && HERO_OVERVIEW_PARTICLE_BLENDING_MODES.includes(rawParticles.blending)
    ? rawParticles.blending
    : DEFAULT_PARTICLES_CONFIG.blending;
  if (!(typeof rawParticles.blending === 'string' && HERO_OVERVIEW_PARTICLE_BLENDING_MODES.includes(rawParticles.blending))) pushInvalidParticleKey('blending');

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
    'duration',
    'lifetime',
    'lifetimeMin',
    'lifetimeMax',
    'speed',
    'speedMin',
    'speedMax',
    'size',
    'opacity',
    'blending',
  ];
  const particleFieldsPlaceholders = {};
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
    duration: particleDuration,
    spread: particleSpread,
    lifetime: particleLifetime,
    lifetimeMin: particleLifetimeMin,
    lifetimeMax: particleLifetimeMax,
    speed: particleSpeed,
    speedMin: particleSpeedMin,
    speedMax: particleSpeedMax,
    size: particleSize,
    opacity: particleOpacity,
    blending: particleBlending,
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
      duration: particleDuration,
      lifetime: particleLifetime,
      lifetimeMin: particleLifetimeMin,
      lifetimeMax: particleLifetimeMax,
      speed: particleSpeed,
      speedMin: particleSpeedMin,
      speedMax: particleSpeedMax,
      size: particleSize,
      opacity: particleOpacity,
      blending: particleBlending,
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
