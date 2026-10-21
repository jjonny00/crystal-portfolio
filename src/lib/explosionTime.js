// src/lib/explosionTime.js
//
// The hero → overview explosion's bullet-time clock: one time scale that the
// fragments (UnifiedCrystalScene), the smoke (FractureSmokePuff) and both
// sparkle bursts (FractureBurstParticles) all run on, while the camera stays on
// real time. Its shape is HERO_OVERVIEW_CINEMATIC_CONFIG.timeDilation: full
// speed for a moment after the split, a fast slowdown to a crawl, held through
// the camera's orbit, then released back to full speed as the camera comes in to
// the index.
//
// The scene starts a run when the crystal explodes (the clock of its fragments)
// and stops it when the crystal reforms; the camera reports how long its move
// will take, so the release and the fragments' landing scale with the orbit.
// Outside a run the time scale is 1.
//
// The particles integrate their motion, ageing and fading over the simulated
// time, so slowing and resuming never moves anything; the smoke and the sparkles
// each run on the same curve bottoming out at their own speed
// (smokeTimeScale / sparkleTimeScale), so they keep visibly expanding through
// the orbit. The fragments, which must land on
// their index places with the camera, run on the same curve less deeply (see
// fragmentTimeScaleExponent / fragmentReleaseLift) through a progress table built
// per run.

import { HERO_OVERVIEW_CINEMATIC_RESOLVED } from '../config/heroOverviewCinematicConfig';

const HOLD_SECONDS = HERO_OVERVIEW_CINEMATIC_RESOLVED.fracture.holdDuration;
const DEFAULT_MOVE_SECONDS = HERO_OVERVIEW_CINEMATIC_RESOLVED.totalDurationSeconds;
// How recent a reported move length has to be to belong to this explosion.
const PAIRING_WINDOW_MS = 1500;
const TABLE_SAMPLES = 2048;

const clamp01 = (x) => Math.min(Math.max(x, 0), 1);
const smootherstep = (x) => {
  const t = clamp01(x);
  return t * t * t * (t * (t * 6 - 15) + 10);
};

let run = null;
let defaultRun = null;
let reportedMove = null;

// The time scale `t` seconds after the split, for a move of `moveSeconds`.
const timeScaleAt = (t, moveSeconds) => {
  const cfg = HERO_OVERVIEW_CINEMATIC_RESOLVED.timeDilation;
  const min = Math.min(Math.max(cfg.minTimeScale, 1e-4), 1);
  const slowStart = cfg.impulseSeconds;
  const slowEnd = slowStart + Math.max(cfg.slowdownSeconds, 1e-4);
  const releaseStart = Math.max(slowEnd, cfg.releaseStart * moveSeconds - HOLD_SECONDS);
  const releaseEnd = releaseStart + Math.max(cfg.releaseSeconds, 1e-4);
  // Slowing and releasing work in log terms (min^k). The slowdown brakes hardest
  // the instant the impulse ends and eases onto the crawl (k = 1 − (1 − x)²),
  // so time is visibly caught rather than wound down; the release eases both
  // ways (smootherstep) so time picks up without a jolt.
  if (t < slowStart) return 1;
  if (t < slowEnd) {
    const x = (t - slowStart) / (slowEnd - slowStart);
    return min ** (1 - (1 - x) ** 2);
  }
  if (t < releaseStart) return min;
  if (t < releaseEnd) return min ** (1 - smootherstep((t - releaseStart) / (releaseEnd - releaseStart)));
  return 1;
};

// When the release is over (seconds after the split), for a move of `moveSeconds`.
const releaseEndAt = (moveSeconds) => {
  const cfg = HERO_OVERVIEW_CINEMATIC_RESOLVED.timeDilation;
  const slowEnd = cfg.impulseSeconds + Math.max(cfg.slowdownSeconds, 1e-4);
  return Math.max(slowEnd, cfg.releaseStart * moveSeconds - HOLD_SECONDS) + Math.max(cfg.releaseSeconds, 1e-4);
};

// The power that takes the shared curve's floor (minTimeScale) to `floor`: a
// system running at s^p slows and speeds up at the same moments, on the same
// shape (in log terms), but bottoms out at its own speed, above the shared
// floor (p < 1) or below it (p > 1).
const exponentFor = (floor) => {
  const min = Math.min(Math.max(HERO_OVERVIEW_CINEMATIC_RESOLVED.timeDilation.minTimeScale, 1e-4), 0.9999);
  return Number.isFinite(floor) && floor > 0 ? Math.log(Math.min(Math.max(floor, 1e-4), 1)) / Math.log(min) : 1;
};

// Each system's own clock (see advanceExplosionClock): its time-scale exponent.
const SYSTEM_EXPONENTS = () => {
  const cfg = HERO_OVERVIEW_CINEMATIC_RESOLVED.timeDilation;
  return { base: 1, smoke: exponentFor(cfg.smokeTimeScale), sparkles: exponentFor(cfg.sparkleTimeScale) };
};

const buildRun = (startMs, moveSeconds) => {
  const cfg = HERO_OVERVIEW_CINEMATIC_RESOLVED.timeDilation;
  // Simulated time from the split to the end of the release, by the
  // millisecond, for each system's clock.
  const releaseEnd = releaseEndAt(moveSeconds);
  const simSamples = Math.max(16, Math.ceil(releaseEnd * 1000));
  const simStep = releaseEnd / simSamples;
  const simTables = {};
  // The smoke and the sparkles burst out faster than the curve alone in the
  // first instant (effectsImpulseBoost, fading out over the impulse and the
  // slowdown, like the fragments' kick), so the burst is seen before time is
  // caught, while the fragments are caught close together.
  const effectsKickEnd = Math.max(cfg.impulseSeconds + cfg.slowdownSeconds, 1e-4);
  const effectsKick = (system, t) => (system === 'base'
    ? 1
    : 1 + (cfg.effectsImpulseBoost ?? 0) * (1 - smootherstep(t / effectsKickEnd)));
  Object.entries(SYSTEM_EXPONENTS()).forEach(([system, exponent]) => {
    const simTable = new Float64Array(simSamples + 1);
    for (let i = 1; i <= simSamples; i += 1) {
      const t = (i - 0.5) * simStep;
      simTable[i] = simTable[i - 1] + timeScaleAt(t, moveSeconds) ** exponent * effectsKick(system, t) * simStep;
    }
    simTables[system] = simTable;
  });
  const travelSeconds = Math.max(0.3, moveSeconds - HOLD_SECONDS);
  const kickEnd = Math.max(cfg.impulseSeconds + cfg.slowdownSeconds, 1e-4);
  // The fragments' own release starts fragmentReleaseDelay after the shared one,
  // so the smoke and sparkles are seen to stir first.
  const releaseStart = Math.min(
    travelSeconds * 0.95,
    Math.max(kickEnd, cfg.releaseStart * moveSeconds - HOLD_SECONDS) + (cfg.fragmentReleaseDelay ?? 0),
  );
  const floor = Math.min(Math.max(cfg.fragmentTimeScale ?? 0.06, 1e-4), 1);
  const exponent = exponentFor(floor);
  // Up to the release: the shared time scale, bottoming out at the fragments'
  // own floor (fragmentTimeScale), their first instant fragmentImpulseBoost×
  // faster, fading out over the impulse and the slowdown, so they snap apart
  // and are caught before they crawl.
  const caught = (t) => timeScaleAt(t, moveSeconds) ** exponent
    * (1 + (cfg.fragmentImpulseBoost ?? 0) * (1 - smootherstep(t / kickEnd)));
  // The release: from the crawl, easing up to `peak` over fragmentReleaseSeconds,
  // all of it tapering to rest exactly as the camera's move ends. One
  // continuous curve, so the explosion carries on rather than firing again.
  const rampSeconds = Math.max(cfg.fragmentReleaseSeconds ?? cfg.releaseSeconds, 1e-3);
  const landingSeconds = Math.max(travelSeconds - releaseStart, 1e-4);
  const released = (t, peak) => (floor + (peak - floor) * smootherstep((t - releaseStart) / rampSeconds))
    * (1 - smootherstep((t - releaseStart) / landingSeconds)) ** 1.5;
  const integrate = (fn, from, to) => {
    const n = 1024; const d = (to - from) / n; let sum = 0;
    for (let i = 0; i < n; i += 1) sum += fn(from + (i + 0.5) * d) * d;
    return sum;
  };
  // `peak` is set so the release covers fragmentReleaseShare of the whole
  // travel, whatever the move's length.
  const caughtArea = integrate(caught, 0, releaseStart);
  const share = Math.min(Math.max(cfg.fragmentReleaseShare ?? 0.78, 0), 0.98);
  let lo = floor; let hi = 1000;
  for (let i = 0; i < 50; i += 1) {
    const mid = (lo + hi) / 2;
    const area = integrate((t) => released(t, mid), releaseStart, travelSeconds);
    if (area / (area + caughtArea) < share) lo = mid; else hi = mid;
  }
  const peak = (lo + hi) / 2;
  const speed = (t) => (t <= releaseStart ? caught(t) : released(t, peak));
  const table = new Float64Array(TABLE_SAMPLES + 1);
  const step = travelSeconds / TABLE_SAMPLES;
  for (let i = 1; i <= TABLE_SAMPLES; i += 1) table[i] = table[i - 1] + speed((i - 0.5) * step) * step;
  const total = table[TABLE_SAMPLES] || 1;
  for (let i = 0; i <= TABLE_SAMPLES; i += 1) table[i] /= total;
  return { startMs, moveSeconds, travelSeconds, table, releaseEnd, simTables, simStep, simSamples };
};

// Simulated seconds since the split on `system`'s clock, `t` real seconds after
// it (t < 0: before the split, when time runs normally).
const simulatedAt = (r, t, system) => {
  const simTable = r.simTables[system] ?? r.simTables.base;
  if (t <= 0) return t;
  if (t >= r.releaseEnd) return simTable[r.simSamples] + (t - r.releaseEnd);
  const x = t / r.simStep;
  const i = Math.min(Math.floor(x), r.simSamples - 1);
  return simTable[i] + (simTable[i + 1] - simTable[i]) * (x - i);
};

// The explosion's age: simulated time until the release is over, then
// advancing at the system's tail rate (smokeTailAgeRate, sparkleTailAgeRate),
// so smoke and sparkles keep rising and fade out over a set tail rather than
// living on for the time spent slowed or all expiring at once.
const TAIL_AGE_RATES = () => {
  const cfg = HERO_OVERVIEW_CINEMATIC_RESOLVED.timeDilation;
  return { base: 1, smoke: cfg.smokeTailAgeRate ?? 1, sparkles: cfg.sparkleTailAgeRate ?? 1 };
};
const agedAt = (r, t, system) => {
  if (t <= r.releaseEnd) return simulatedAt(r, t, system);
  return simulatedAt(r, r.releaseEnd, system) + (t - r.releaseEnd) * (TAIL_AGE_RATES()[system] ?? 1);
};

/**
 * How far the explosion moved on, and aged, between two performance.now times
 * (seconds), on `system`'s clock ('smoke', 'sparkles', or the shared base
 * curve): the exact integral of its time scale over that span, so a long or
 * stalled frame lands where it should. Outside a run both are the real span.
 */
export const advanceExplosionClock = (fromMs, toMs, system = 'base') => {
  const real = Math.max(0, (toMs - fromMs) / 1000);
  if (!run || !Number.isFinite(fromMs)) return { motion: real, age: real, real };
  const from = (fromMs - run.startMs) / 1000 - HOLD_SECONDS;
  const to = (toMs - run.startMs) / 1000 - HOLD_SECONDS;
  return {
    motion: Math.max(0, simulatedAt(run, to, system) - simulatedAt(run, from, system)),
    age: Math.max(0, agedAt(run, to, system) - agedAt(run, from, system)),
    real,
  };
};

/** The camera's hero → overview move will take this long (seconds). */
export const setExplosionMoveDuration = (seconds) => {
  if (!(Number.isFinite(seconds) && seconds > 0)) return;
  const now = performance.now();
  reportedMove = { seconds, at: now };
  if (run && now - run.startMs < PAIRING_WINDOW_MS && run.moveSeconds !== seconds) {
    run = buildRun(run.startMs, seconds);
  }
};

/** The crystal exploded at `startMs` (performance.now time; it splits HOLD later). */
export const startExplosionTime = (startMs) => {
  const paired = reportedMove && Math.abs(startMs - reportedMove.at) < PAIRING_WINDOW_MS;
  run = buildRun(startMs, paired ? reportedMove.seconds : DEFAULT_MOVE_SECONDS);
};

/** The crystal reformed: the explosion is over, time runs normally again. */
export const stopExplosionTime = () => {
  run = null;
};

/** The explosion's time scale now (1 outside a run, and before the split). */
export const getExplosionTimeScale = (nowMs = performance.now()) => {
  if (!run) return 1;
  const t = (nowMs - run.startMs) / 1000 - HOLD_SECONDS;
  return t < 0 ? 1 : timeScaleAt(t, run.moveSeconds);
};

/**
 * 0–1: how far into its slowed-down stretch the explosion is, for effects that
 * hold back while it plays (the bloom): 0 before the split and outside a run,
 * up to 1 as time collapses, held through the orbit, back to 0 over the second
 * after the camera's move ends.
 */
export const getExplosionEnvelope = (nowMs = performance.now(), { fromSplit = false } = {}) => {
  if (!run) return 0;
  const cfg = HERO_OVERVIEW_CINEMATIC_RESOLVED.timeDilation;
  const t = (nowMs - run.startMs) / 1000 - HOLD_SECONDS;
  // fromSplit: up within 30ms of the split itself, for the broad light that
  // would otherwise white out the impact (the wide halo, the bloom).
  const riseStart = fromSplit ? 0 : cfg.impulseSeconds;
  const riseEnd = fromSplit ? 0.03 : cfg.impulseSeconds + cfg.slowdownSeconds;
  if (t <= riseStart) return 0;
  const rising = smootherstep((t - riseStart) / Math.max(riseEnd - riseStart, 1e-4));
  const moveEnd = run.moveSeconds - HOLD_SECONDS;
  return rising * (1 - smootherstep((t - moveEnd) / Math.max(cfg.glowReturnSeconds ?? 1, 1e-3)));
};

/** Seconds since the crystal split (negative before it), or null outside a run. */
export const getExplosionSplitSeconds = (nowMs = performance.now()) => (
  run ? (nowMs - run.startMs) / 1000 - HOLD_SECONDS : null
);

/** How long the fragments travel for, from the split (seconds). */
export const getFragmentTravelSeconds = () => (
  run ? run.travelSeconds : Math.max(0.3, DEFAULT_MOVE_SECONDS - HOLD_SECONDS)
);

/** The fragments' eased progress at `fraction` (0–1) of their travel time. */
export const easeFragmentTravel = (fraction) => {
  if (!run && !defaultRun) defaultRun = buildRun(0, DEFAULT_MOVE_SECONDS);
  const table = (run ?? defaultRun).table;
  const x = clamp01(fraction) * TABLE_SAMPLES;
  const i = Math.min(Math.floor(x), TABLE_SAMPLES - 1);
  return table[i] + (table[i + 1] - table[i]) * (x - i);
};
