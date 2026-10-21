export const HERO_OVERVIEW_CINEMATIC_CONFIG_SOURCE = 'src/config/heroOverviewCinematicConfig.js';

export const HERO_OVERVIEW_CINEMATIC_CONFIG = {
  // The phase values are weights, normalized over the total; they are written in
  // seconds here so they read directly. The camera does not hold through the
  // charge (it carries the hero orbit straight into the bullet-time orbit), so
  // the three hold phases are only nominal and overviewTravel spans nearly the
  // whole move.
  //
  // Bullet time: the camera and the fragments work against each other. From the
  // split (0.5s): the fragments burst out (to ~0.8s) and hang almost still,
  // mid-explosion (~0.9–1.9s), while the camera sweeps round them at full speed
  // (the parallax is what sells the frozen moment). Then it brakes and pulls in
  // to the index as the fragments drift on to their places (~1.9–2.9s).
  //
  // totalDurationSeconds is the camera's time for its shortest orbit (180°);
  // longer orbits take longer (camera.orbitSecondsPerExtraHalfTurn). The phase
  // windows below are fractions of whichever it is.
  timeline: {
    totalDurationSeconds: 3,
    fractureHold: 0.03,
    explosionImpulse: 0.01,
    bulletTime: 0.01,
    overviewTravel: 2.8,
    overviewSettle: 0.15,
  },

  camera: {
    // Both 0: the camera holds still from the split until the fragments release.
    // The punch (a 5cm jab forward and back in ~70ms, right after the split) and
    // the drift after it moved the camera while the fragments and the rays held
    // still, so they read as jitter.
    explosionPunchDistance: 0,
    bulletTimeDriftDistance: 0,
    // The camera's distance out to the index: out to an orbiting distance while
    // it gets up to speed, held there through the sweep, then in to the index
    // as it brakes (bulletTimeOrbitDolly).
    travelEase: 'bulletTimeOrbitDolly',
    // Where it looks, its FOV and film offset: the hero's framing, centred on
    // the explosion, until the sweep is braking, then the index's.
    framingEase: 'bulletTimeFraming',
    settleEase: 'smoothSettle',
    punchEase: 'easeOutExpo',
    driftEase: 'smoothSettle',
    // The orbit round the crystal from the hero camera's angle to the index's,
    // over the whole move. It always goes at least orbitMinArcDegrees round,
    // the shortest way that does (180–360°: a full turn when the hero camera is
    // already at the index angle), and never reverses. The intro lands the
    // hero camera well round from the index (camera.heroTuning
    // .introIndexOffsetDegrees in the layouts) so the default is ~200°.
    orbitEase: 'bulletTimeOrbit',
    orbitMinArcDegrees: 180,
    // A full turn gets this much longer than a half turn (pro rata between), so
    // 360° does not run at twice the speed of 180°. 0 turns it off.
    orbitSecondsPerExtraHalfTurn: 1,
    // The hero orbit's own speed (auto-orbit plus any drag fling still coasting,
    // rad/s) is carried into the start of the orbit when it turns the same way,
    // up to this.
    orbitEntrySpeedCap: 2,
    // The shockwave hitting the camera as the crystal splits: one recoil
    // straight back along its view (a share of its distance to what it looks
    // at, so it reads the same near or far) and a slight roll, peaking
    // peakSeconds after the split and easing back to nothing over
    // recoverySeconds. No shake or spring: one push, one return. Added on top
    // of the orbit, so the path and the index pose are untouched. Off under
    // reduced motion. look.cameraRecoil / cameraRoll scale each part.
    // A sharp push (peak 35ms after the split, inside the 40ms impulse) and a
    // slower, softer return that settles as time finishes collapsing, so the
    // recoil reads as the force of the release rather than a wobble alongside it
    // (was 50ms / 200ms). The roll is kept, halved (was 0.9°): it adds to the
    // hit, but at 0.9° it read as the frame tipping.
    impact: {
      // A jolt, not a push: ~125ms in all, 2.5% of the distance to the look
      // target (~0.07 close in), so the camera is struck and carries straight
      // on (was 3.5%, 35ms + 280ms, which read as the camera backing away).
      recoil: 0.025,
      rollDegrees: 0.5,
      peakSeconds: 0.025,
      recoverySeconds: 0.1,
    },
    // The distance through the move: one expanding spiral from the hero's
    // distance to the index's, set by the share of the orbit's turn done (so it
    // stretches with longer orbits, and the distance and the turn arrive
    // together: it slows as the turn brakes). It is logarithmic: each degree
    // takes the camera out by a share of its distance (the pitch), so the
    // explosion shrinks in the frame at a steady rate rather than all at the
    // end. The pitch builds from nothing over the first `rampIn` of the turn
    // (the hero orbit runs at a fixed distance), then climbs to `endPitch`×
    // its starting value by the end, on a power of `pitchCurve`: a gentle
    // outward drift through the slow motion, widening as the turn goes on.
    // (heroOverviewSpiralShare draws it.) Higher endPitch keeps the camera
    // closer for longer and expands later; rampIn later delays the first
    // drift.
    // Was a fixed close orbit (the hero's distance plus 0.6, taken on as the
    // fragments spread) until 75% of the turn, then a pull back to the index
    // over the last quarter: 2.75 → 3.16 → 8.49 on desktop, read as a flyby
    // and then a zoom out.
    // framingStart → framingEnd: the share of the turn over which the camera's
    // aim eases (smootherstep) from the explosion round to the index's (and the
    // FOV to the index's), so the index composition builds as the camera
    // spirals out: the fragments drift across the frame to their index places
    // from mid-orbit (~85% of the way by 83% of the turn) and settle as the
    // turn does. Was framingStart 0.7 on the clock, which put most of the
    // reframing after the turn had slowed and read as a pan left at the end.
    // centerBy: the share of the turn by which the film offset reaches the
    // index's (centred), so the explosion sits in the middle of the frame
    // through the orbit.
    spiral: {
      rampIn: 0.12,
      endPitch: 1.6,
      pitchCurve: 2,
      framingStart: 0.4,
      framingEnd: 1,
      centerBy: 0.3,
    },
  },

  // The explosion's timing (lib/explosionTime): one clock for the fragments,
  // the smoke and both sparkle bursts; the camera stays on real time. These
  // values are the explosive release, the hero → index transition: the
  // smoke and sparkles run on real time (no time dilation) and slow under
  // their own drag, and the fragments are thrown out by a blast and lose
  // speed continuously to rest as the camera lands. The brief bullet-time
  // profile (explosionMotionProfiles below) lays bullet time over them.
  timeDilation: {
    // The clock: full speed for impulseSeconds, then slowing over
    // slowdownSeconds to minTimeScale (in log terms, braking hardest at once),
    // held, then back to full speed over releaseSeconds from releaseStart of
    // the camera's move (or suspensionSeconds after time is caught, when set).
    // The smoke and sparkles bottom out at their own smokeTimeScale /
    // sparkleTimeScale. All at 1 here: time runs normally.
    impulseSeconds: 0,
    slowdownSeconds: 0,
    minTimeScale: 1,
    smokeTimeScale: 1,
    sparkleTimeScale: 1,
    // The smoke's and the sparkles' first instant runs this much faster
    // (fading out over the impulse and the slowdown).
    effectsImpulseBoost: 0,
    releaseStart: 1,
    suspensionSeconds: null,
    releaseSeconds: 0,
    // Once time has resumed, the smoke and sparkles age at this rate
    // (× real time), so they fade out as the index settles. 1: as they live.
    smokeTailAgeRate: 1,
    sparkleTailAgeRate: 1,
    // After the camera lands, the held-back bloom and glows (look.bloom, halo,
    // glow) ease back to the index's own level over this long, so the index is
    // crisp as it arrives and its glow settles in after (was 1s).
    glowReturnSeconds: 1.8,
    // The held-back bloom and glows (look.*) come down from lookRiseSeconds
    // to lookCatchSeconds after the split, so the burst is never under full
    // bloom.
    lookRiseSeconds: 0,
    lookCatchSeconds: 0.105,
    // The fragments, which have to land exactly with the camera. With
    // fragmentReleaseShare null they are thrown out by a blast (lib/
    // explosionTime) — up to speed in 20ms, a 7× spike that decays over ~40ms
    // into a slower 200ms decay — then lose speed continuously through the
    // orbit, (1 − u^fragmentSustainPower)^fragmentLandingPower, and come to
    // rest as the camera lands. Measured on the default move (~200°, 3.1s):
    // peak 7× the average speed 13ms after the split, 10% of their travel by
    // 50ms, 15% by 100ms, 25% by 250ms, ~29% over the first 0.3s, ~50%
    // through the sweep, ~21% in the settle as the camera brakes.
    // fragmentTimeScale is their floor on the clock above (1: none).
    fragmentTimeScale: 1,
    fragmentReleaseShare: null,
    fragmentImpulseBoost: 0,
    fragmentAttackSeconds: 0.02,
    fragmentBlastBoost: 6,
    fragmentBlastSeconds: 0.04,
    fragmentAfterBlastBoost: 0.4,
    fragmentAfterBlastSeconds: 0.2,
    fragmentSustainPower: 2.2,
    fragmentLandingPower: 1.4,
    // Used only with a fragment release (fragmentReleaseShare set).
    fragmentReleaseDelay: 0,
    fragmentReleaseSeconds: 0.35,
  },

  // Which explosion to play:
  //   'explosiveRelease' — the values above as they are.
  //   'briefBulletTime' — the earlier experiment: a 180ms burst, time caught,
  //     a 0.6s hold, then the explosion carries on into the index.
  // (The longer bullet-time pass before that is the checkpoint commit.)
  explosionMotionProfile: 'explosiveRelease',
  explosionMotionProfiles: {
    explosiveRelease: {},
    // Laid over timeDilation, the smoke (crystalConfig fracture.smoke) and
    // explosionParticles. 180ms of full-speed explosion (the fragments ~25% of
    // their way), caught over the 80ms slowdown, held suspensionSeconds
    // (0.6s), then released. Measured (any orbit length): ~25% of the
    // fragments' travel in the burst (including the shards' pop), ~1.5% as
    // time collapses, ~4% through the hold, and the last ~70% in the release,
    // which eases up from the crawl over fragmentReleaseSeconds and back to
    // rest as the camera lands. fragmentReleaseDelay starts it that long after
    // the smoke's and the sparkles' release, so they are seen to stir ~100ms
    // first. The smoke and sparkles hang at 1.2% / 1.5% through the hold.
    briefBulletTime: {
      timeDilation: {
        impulseSeconds: 0.18,
        slowdownSeconds: 0.08,
        minTimeScale: 0.03,
        smokeTimeScale: 0.012,
        sparkleTimeScale: 0.015,
        effectsImpulseBoost: 0,
        releaseStart: 0.53,
        suspensionSeconds: 0.6,
        releaseSeconds: 0.45,
        smokeTailAgeRate: 1.1,
        sparkleTailAgeRate: 0.4,
        lookRiseSeconds: 0.025,
        fragmentTimeScale: 0.06,
        fragmentReleaseShare: 0.72,
        fragmentReleaseDelay: 0.08,
        fragmentReleaseSeconds: 0.35,
        fragmentImpulseBoost: 0,
      },
      smoke: { expand: 14, drag: 0.94, liftRampStart: 0.35, liftRampEnd: 1, lateCount: 0 },
      explosionParticles: { duration: 1.9, spawnRadius: 0.85 },
    },
  },

  // The explosion's look: one { enabled, intensity } per effect it lights up,
  // `intensity` multiplying that effect's own brightness (1 = as it was before
  // the clarity pass, so these read as the change).
  //
  // Measured with each effect switched off in turn (mid-orbit and at the
  // release): the smoke made most of the luminous cyan cloud over the fragments
  // (the frame's mean brightness 0.60 → 0.35 without it at the release), the
  // bloom spread every additive effect into it, and bloom + halo + smoke
  // together whited out the impact (82% of the frame's centre near white). The
  // ring, rays and flash only touch the impact; the motes and the lens dirt add
  // a broad haze through the orbit; the sparkles barely change the brightness.
  // So: the smoke, the bloom and the backdrop glows come down hardest, the
  // impact beat (rays, flash) stays, and the sparkles are thinned out into a
  // hierarchy instead (particles.prominent*). In DEV,
  // globalThis.__EXPLOSION_LOOK__ overrides any of them live, e.g.
  // { smoke: { enabled: false }, bloom: { intensity: 0.5 } }, or 'previous'
  // for the look before the pass (lib/explosionLook).
  look: {
    // Post bloom (crystalConfig.postProcessing.bloom) while the explosion runs,
    // easing back to full once it is over.
    bloom: { enabled: true, intensity: 0.55 },
    // The two glow sprites behind the crystal (GlowingSphereImage): the wide
    // backdrop halo and the tighter glow.
    // Like the bloom, only while the explosion plays: the index keeps its glow.
    halo: { enabled: true, intensity: 0.6 },
    glow: { enabled: true, intensity: 0.6 },
    // The energy motes swarming the orb (OrbEnergyParticles).
    motes: { enabled: true, intensity: 0.45 },
    // The shockwave ring (FractureRingImage) and the crack rays (FractureRays).
    ring: { enabled: true, intensity: 0.85 },
    rays: { enabled: true, intensity: 1 },
    // The crystal's own flash as it splits (the swap mask glow).
    // Sharper and brighter than before, but shorter (see the scene's
    // FORWARD_MASK_GLOW_DURATION_S): the light comes from inside the crystal.
    flash: { enabled: true, intensity: 1.3 },
    // Smoke (FractureSmokePuff) and the two sparkle bursts (FractureBurstParticles).
    smoke: { enabled: true, intensity: 0.45 },
    sparkles: { enabled: true, intensity: 1 },
    explosionSparkles: { enabled: true, intensity: 0.6 },
    // The background's white flash on the split (crystalConfig fracture.backgroundFlash).
    // Found in the impact pass: until then it was the main cause of the pale,
    // overexposed first second, not any of the effects above.
    backgroundFlash: { enabled: true, intensity: 1 },
    // The lens dirt's extra flare during the explosion (LensDirt transitionBoost).
    lensDirt: { enabled: true, intensity: 0.4 },
    // The impact (camera.impact below, and the prominent sparks' launch):
    // separately switchable to judge each one.
    cameraRecoil: { enabled: true, intensity: 1 },
    cameraRoll: { enabled: true, intensity: 1 },
    // The prominent sparks fired from the crystal's core, faster than the rest
    // (particles.prominentSpawnScale / prominentSpeedScale); 0 launches them
    // like the others.
    energyBurst: { enabled: true, intensity: 1 },
  },

  fracture: {
    holdDuration: 0.5,
    // On the hero → overview route the fragments' travel is timed by
    // timeDilation (lib/explosionTime): it lasts as long as the camera's move
    // and follows the bullet-time clock. These two are what it would be at the
    // shortest move, for the diagnostics and any other caller.
    travelDuration: 2.5,
    travelEase: 'bulletTimeBurst',
    fractureDistanceMultiplier: 1.0,
    spreadMultiplier: 1.0,
    depthMultiplier: 1.0,
    // Each fragment turns this many degrees (65–100% of it, on its own axis)
    // as it flies out, peaking mid-flight and back to rest as it lands.
    tumbleDegrees: 6,
    wired: true,
  },

  particles: {
    enabled: true,
    triggerAt: 0.5,
    delay: 0,
    // Fewer, with a hierarchy: a few prominent sparks you can follow as the
    // camera goes round them, over a dimmer field (was 12500, all alike).
    count: 200,
    prominentShare: 0.05,
    prominentSizeScale: 2.6,
    secondaryOpacity: 0.5,
    // The energy burst: the prominent sparks start this close to the core (×
    // the spawn column) and leave this much faster, so a few bright shards are
    // seen shooting out of the crystal before time slows (look.energyBurst).
    prominentSpawnScale: 0.2,
    prominentSpeedScale: 2.0,
    color: '#aeecff',
    emitterPosition: [0, 1.5, 0],
    spawnRadius: 0.075,
    // A column ±1.05 tall (was 25.5 → ±1.9), so the sparks start within the
    // crystal rather than strung out past it.
    emitterScale: [0.07, 14, 0.07],
    duration: null,
    // spread also scales the launch speed (× spread / 0.5): 1.15 sends them off
    // at 6.4–16.7 units/s (1.0 was 5.6–14.5, 2.0 11–29), so in the moment
    // before time slows they just clear the fragments.
    spread: 1.15,
    lifetime: null,
    lifetimeMin: 0.05,
    lifetimeMax: 6,
    speed: null,
    speedMin: 2.8,
    speedMax: 7.25,
    size: .07,
    opacity: 0.72,
    blending: 'additive',
    shimmerStrength: 0.75,
    shimmerSpeed: 40.0,
    // Keep drifting sideways until they die, instead of rising straight up late.
    sustainDrift: true,
    wired: true,
  },

  shardBurst: {
    enabled: true,
    triggerAt: 0.56,
    burstDuration: 0.07,
    // A crack opening between the pieces, not a throw: at 0.58 the pop alone
    // was over half of a fragment's whole journey, put on in 70ms, and paying it
    // back cancelled most of their outward speed afterwards, so they read as
    // thrown out and then frozen.
    burstDistance: 0.05,
    burstEase: 'easeOutExpo',
    // After the pop the extra distance is carried off by the fragments' own travel,
    // shrinking in step with the travel still to go, so the shards never overshoot
    // and come back: they share the travel's glide to a stop.
    wired: true,
  },

  explosionParticles: {
    enabled: true,
    triggerAt: 0.56,
    count: 500,
    color: '#b2fcff',
    // Each spark lives lifetimeMin–lifetimeMax seconds, so the spray thins out
    // through the orbit (some fading while others still fly), leaving a few
    // drifting round the index as it settles. A `duration` would give them all one life, and they
    // would all go out together (the brief bullet-time profile uses 1.9s).
    duration: null,
    speedMin: 0.01,
    speedMax: 0.5,
    // Mostly slow, a few fast (FractureBurstParticles speedSkew): the bulk is
    // caught just off the fragments, a few further out for depth. Even (1), the
    // median spark carried ~18 units/s into the slowdown.
    speedSkew: 1.7,
    // Up to 6.5s (was 4.5), so the longest-lived are still rising round the
    // fragments as the camera lands in the index (each fades out by ~76% of
    // its life).
    lifetimeMin: 1.0,
    lifetimeMax: 6.5,
    opacity: 0.65,
    // 1.25 (was 0.85): the sparks start from a shell round the crystal rather
    // than inside it, where the fragments hid their launch.
    spawnRadius: 1.25,
    emitterScale: [0.75, 1, 0.75],
    spread: 42,
    size: 0.05,
    blending: 'additive',
    shimmerStrength: 0.75,
    shimmerSpeed: 60.0,
    wired: true,
  },

  cameraForce: {
    enabled: false,
    triggerAt: 0.56,
    pushbackDistance: 0.42,
    pushbackDuration: 0.075,
    pushbackEase: 'easeOutExpo',
    catchDuration: 0.26,
    catchEase: 'smoothSettle',
    // Shake disabled: at 38 Hz it dithers the camera almost every frame, which
    // made the thin, bright fracture rays scintillate on the forced (WORK-link)
    // hero→overview path (the pilot/scroll path never applied it). Keeping the
    // smooth pushback recoil; only the high-frequency shake is removed.
    shakeAmplitude: 0,
    shakeDuration: 0.12,
    shakeFrequency: 38,
    wired: true,
  },

  ring: {
    enabled: true,
    triggerAt: 0.56,
    // Tuned for a visible outward sweep. The previous values
    // (duration 0.22 / easeOutExpo / startScale 0.01 / endScale 18) front-loaded
    // the entire expansion into ~4 frames, so the ring read as a near-invisible
    // single-frame flash. A longer linear sweep makes the shockwave readable.
    duration: 0.28,
    startScale: 0.7,
    endScale: 25.0,
    easing: 'linear',
    wired: true,
  }
};

const clamp01 = (value) => Math.min(Math.max(value, 0), 1);
const roundPhaseBoundary = (value) => Number(clamp01(value).toFixed(10));

// Most of the way quickly, then a long landing. Up to `knee` (a share of the
// time) a quartic leaves rest and covers `share` of the distance; after it the
// speed falls as (1−u)^tailPower to rest at the end, so the rest of the
// distance is spread over the rest of the time instead of stalling. The quartic
// meets the tail with the same speed and acceleration, so there is no seam, and
// the speed only falls once past its peak.
const quickLanding = ({ knee, share, tailPower }) => {
  const tail = 1 - knee;
  const joinSpeed = ((tailPower + 1) * (1 - share)) / tail;
  // The quartic a·s² + b·s³ + c·s⁴ in s = x / knee, solved for its value, slope
  // and curvature at the join.
  const slope = joinSpeed * knee;
  const curvature = ((-tailPower * joinSpeed) / tail) * knee * knee;
  const c = (curvature - 4 * slope + 6 * share) / 2;
  const b = 5 * slope - 8 * share - curvature;
  const a = share - b - c;
  return (t) => {
    const x = clamp01(t);
    if (x < knee) {
      const s = x / knee;
      return s * s * (a + s * (b + s * c));
    }
    return 1 - (1 - share) * ((1 - (x - knee) / tail) ** (tailPower + 1));
  };
};

// Leaves rest and comes to rest with the speed going as t^startPower ·
// (1−t)^endPower (integer powers), normalized to cover the distance: a
// regularized incomplete beta, summed in its binomial form. Powers of 2 or more
// leave and land with zero acceleration too; a larger endPower stretches the
// braking out (the peak comes at startPower / (startPower + endPower)).
const smoothGlide = ({ startPower, endPower }) => {
  const m = startPower + 1;
  const n = m + endPower;
  const terms = [];
  for (let j = m, coeff = binomial(n, m); j <= n; j += 1) {
    terms.push([j, coeff]);
    coeff = (coeff * (n - j)) / (j + 1);
  }
  return (t) => {
    const x = clamp01(t);
    return terms.reduce((sum, [j, coeff]) => sum + coeff * (x ** j) * ((1 - x) ** (n - j)), 0);
  };
};

function binomial(n, k) {
  let result = 1;
  for (let i = 1; i <= k; i += 1) result = (result * (n - k + i)) / i;
  return result;
}

const smoothstep = (t) => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};
const smootherstep = (t) => {
  const x = clamp01(t);
  return x * x * x * (x * (x * 6 - 15) + 10);
};

// A sum of eases, each over its own window of the time and covering its share
// of the distance (the shares add to 1). Windows may overlap, so one motion can
// hand over to the next without stopping.
const stagedEase = (parts) => (t) => parts.reduce(
  (sum, { from, to, share, ease }) => sum + share * ease((t - from) / (to - from)),
  0,
);

// An ease drawn as its speed over time: the speed is integrated once, here, into
// a table normalized to end at 1, and read back with linear interpolation.
const easeFromSpeed = (speed, samples = 1024) => {
  const table = new Float64Array(samples + 1);
  for (let i = 1; i <= samples; i += 1) {
    table[i] = table[i - 1] + Math.max(0, speed((i - 0.5) / samples)) / samples;
  }
  const total = table[samples] || 1;
  return (t) => {
    const x = clamp01(t) * samples;
    const i = Math.min(Math.floor(x), samples - 1);
    return (table[i] + (table[i + 1] - table[i]) * (x - i)) / total;
  };
};

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
  // Out fast, then a long glide to a stop: the speed falls as (1−t)⁴, so the last
  // third of the time covers about 0.4% of the distance.
  quintOut: (t) => {
    const x = clamp01(t);
    return 1 - ((1 - x) ** 5);
  },
  // A push off the mark and a long glide to a stop: the speed goes as t(1−t)⁴, so
  // it leaves rest at once (no jump in speed) and comes in with the same (1−t)⁴
  // tail as quintOut.
  glideOut: (t) => {
    const x = clamp01(t);
    return 1 - ((1 - x) ** 5) * (1 + 5 * x);
  },
  // 90% of the way in the first 30% of the time, then the last 10% easing to rest
  // over the rest, the braking itself fading out so it lands with no final check
  // (a tailPower of 1 braked at a constant rate right up to the stop). Over the
  // turn's 2.5s: 50% by ~0.33s, 90% by ~0.75s, 95% by ~1.1s, 99% by ~1.7s. A
  // knee of 0.25 whipped harder but braked out of it too abruptly.
  longLanding: quickLanding({ knee: 0.3, share: 0.9, tailPower: 2 }),
  // Off rest gently, peaking a third of the way in, then twice as long braking
  // on a (1−t)⁴ tail. Over the turn's 2.5s: 10% by ~0.42s, 50% by ~0.91s, 90% by
  // ~1.5s, 99% by ~1.9s; the last 0.5s covers under 0.5% of the turn.
  gentleLanding: smoothGlide({ startPower: 2, endPower: 4 }),
  // Bullet time, over the fragments' 2.5s travel from the split (0.5s in): the
  // explosion itself in extreme slow motion. The split kicks them out (a short
  // impulse, dying away in ~0.1s: ~12% of the way by 0.15s, with the shard
  // pop), then they carry on outward at one slow, steady speed right through the
  // camera's orbit (~0.4 of the way per second, against the camera's ~90°/s),
  // and from ~1.9s after the split ease off into their index places (the last
  // ~11%), with no rush at the end. Drawn as its speed: the impulse decays into
  // the cruise, which fades out to rest.
  bulletTimeBurst: easeFromSpeed(
    (t) => 2.5 * Math.exp(-t / 0.025) + smoothstep(t / 0.01) * (1 - smoothstep((t - 0.75) / 0.25)),
    4096,
  ),
  // The camera's distance, over overviewTravel (nearly the whole move): a third
  // of the way out by 30% (hero 2.75 → ~4.6 on desktop, 3 → ~5.6 on mobile),
  // where it orbits clear of the fragments without losing them, creeping a
  // little further through the sweep, then the rest from 55% as it brakes.
  bulletTimeOrbitDolly: stagedEase([
    { from: 0, to: 0.3, share: 0.32, ease: smootherstep },
    { from: 0.2, to: 0.75, share: 0.08, ease: smootherstep },
    { from: 0.55, to: 1, share: 0.6, ease: smoothGlide({ startPower: 2, endPower: 3 }) },
  ]),
  // Look target, FOV, film offset: 12% of the way while the camera sweeps, so
  // it keeps looking into the explosion, the rest from 50%, landing with the
  // dolly.
  bulletTimeFraming: stagedEase([
    { from: 0, to: 0.75, share: 0.12, ease: smootherstep },
    { from: 0.5, to: 1, share: 0.88, ease: smoothGlide({ startPower: 2, endPower: 3 }) },
  ]),
  // The orbit, over the whole move: up to speed by 22% (smoothly, from the hero
  // orbit's own slow turn), a steady sweep to 60% (through the fragments'
  // hang), then braking to a stop with no final check. The peak speed is 1.45×
  // the average.
  bulletTimeOrbit: easeFromSpeed((t) => smoothstep(t / 0.22) * (1 - smoothstep((t - 0.6) / 0.4))),
  // Index → hero (HERO_RETURN_CINEMATIC). The reform: the fragments gather
  // slowly, then close in faster and faster, snapping together at the end
  // (19% of the way in by half time, 56% by 80%).
  returnReform: (t) => clamp01(t) ** 2.4,
  // The return orbit: up to speed by 25%, a steady sweep to 55%, then slowing
  // to the hero orbit's own pace at the end (its speed is blended in there).
  returnOrbit: easeFromSpeed((t) => smoothstep(t / 0.25) * (1 - smoothstep((t - 0.55) / 0.45))),
  // The return's distance: 60% of the way in from the index by 40% (index 8.5
  // → ~5 on desktop, 11.3 → ~6.3 on mobile), where it orbits the gathering
  // fragments, creeping a little closer, then in to the hero distance from 55%,
  // landing softly as the crystal closes up.
  returnDolly: stagedEase([
    { from: 0, to: 0.4, share: 0.6, ease: smootherstep },
    { from: 0.3, to: 0.7, share: 0.05, ease: smootherstep },
    { from: 0.55, to: 1, share: 0.35, ease: smoothGlide({ startPower: 2, endPower: 3 }) },
  ]),
  // Look target and film offset: off the index's framing and on to the hero's
  // (centred on the crystal) over the first 60%, so the orbit is framed on the
  // gathering fragments.
  returnFraming: stagedEase([{ from: 0, to: 0.6, share: 1, ease: smootherstep }]),
  sinePulse: (t) => Math.sin(Math.PI * clamp01(t)),
  smoothSettle: (t) => {
    const x = clamp01(t);
    return x * x * (3 - 2 * x);
  },
};

// The hero → index spiral (camera.spiral): how far along its distance ratio
// the camera is (0 at the hero's distance, 1 at the index's, in log terms) at
// `share` of the orbit's turn. The integral of the pitch, normalized to end at
// 1; built once per set of parameters.
const spiralShareTables = new Map();
export const heroOverviewSpiralShare = (share, spiral = {}) => {
  const rampIn = Math.max(Number(spiral.rampIn) || 0, 1e-4);
  const endPitch = Math.max(Number.isFinite(spiral.endPitch) ? spiral.endPitch : 1, 0);
  const pitchCurve = Math.max(Number.isFinite(spiral.pitchCurve) ? spiral.pitchCurve : 1, 0);
  const key = `${rampIn}|${endPitch}|${pitchCurve}`;
  let ease = spiralShareTables.get(key);
  if (!ease) {
    ease = easeFromSpeed((s) => smoothstep(s / rampIn) * (1 + (endPitch - 1) * s ** pitchCurve));
    spiralShareTables.set(key, ease);
  }
  return ease(share);
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
const DEFAULT_SHARD_BURST_CONFIG = { ...HERO_OVERVIEW_CINEMATIC_CONFIG.shardBurst };
const DEFAULT_EXPLOSION_PARTICLES_CONFIG = { ...HERO_OVERVIEW_CINEMATIC_CONFIG.explosionParticles };
const DEFAULT_CAMERA_FORCE_CONFIG = { ...HERO_OVERVIEW_CINEMATIC_CONFIG.cameraForce };
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
  const motionProfileName = HERO_OVERVIEW_CINEMATIC_CONFIG.explosionMotionProfiles[config?.explosionMotionProfile]
    ? config.explosionMotionProfile
    : HERO_OVERVIEW_CINEMATIC_CONFIG.explosionMotionProfile;
  const motionProfile = HERO_OVERVIEW_CINEMATIC_CONFIG.explosionMotionProfiles[motionProfileName] || {};
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
    orbitEase: readEasingName(config?.camera?.orbitEase, HERO_OVERVIEW_CINEMATIC_CONFIG.camera.orbitEase),
    framingEase: readEasingName(config?.camera?.framingEase, HERO_OVERVIEW_CINEMATIC_CONFIG.camera.framingEase),
    orbitMinArcDegrees: Math.min(360, readNonNegativeNumber(config?.camera?.orbitMinArcDegrees, HERO_OVERVIEW_CINEMATIC_CONFIG.camera.orbitMinArcDegrees)),
    orbitSecondsPerExtraHalfTurn: readNonNegativeNumber(config?.camera?.orbitSecondsPerExtraHalfTurn, HERO_OVERVIEW_CINEMATIC_CONFIG.camera.orbitSecondsPerExtraHalfTurn),
    orbitEntrySpeedCap: readNonNegativeNumber(config?.camera?.orbitEntrySpeedCap, HERO_OVERVIEW_CINEMATIC_CONFIG.camera.orbitEntrySpeedCap),
    impact: { ...HERO_OVERVIEW_CINEMATIC_CONFIG.camera.impact, ...(config?.camera?.impact || {}) },
    spiral: { ...HERO_OVERVIEW_CINEMATIC_CONFIG.camera.spiral, ...(config?.camera?.spiral || {}) },
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
  const particleShimmerStrength = (typeof rawParticles.shimmerStrength === 'number' && Number.isFinite(rawParticles.shimmerStrength))
    ? Math.min(Math.max(rawParticles.shimmerStrength, 0), 3)
    : DEFAULT_PARTICLES_CONFIG.shimmerStrength;
  if (!(typeof rawParticles.shimmerStrength === 'number' && Number.isFinite(rawParticles.shimmerStrength))) pushInvalidParticleKey('shimmerStrength');
  const particleShimmerSpeed = readNonNegativeNumber(rawParticles.shimmerSpeed, DEFAULT_PARTICLES_CONFIG.shimmerSpeed);
  if (!(typeof rawParticles.shimmerSpeed === 'number' && Number.isFinite(rawParticles.shimmerSpeed) && rawParticles.shimmerSpeed >= 0)) pushInvalidParticleKey('shimmerSpeed');
  const particleSustainDrift = typeof rawParticles.sustainDrift === 'boolean' ? rawParticles.sustainDrift : DEFAULT_PARTICLES_CONFIG.sustainDrift;
  if (typeof rawParticles.sustainDrift !== 'boolean') pushInvalidParticleKey('sustainDrift');

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
    'shimmerStrength',
    'shimmerSpeed',
    'sustainDrift',
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
    shimmerStrength: particleShimmerStrength,
    shimmerSpeed: particleShimmerSpeed,
    sustainDrift: particleSustainDrift,
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
      shimmerStrength: particleShimmerStrength,
      shimmerSpeed: particleShimmerSpeed,
      sustainDrift: particleSustainDrift,
    },
    invalidKeys: invalidParticleKeys,
    fallbackUsed: invalidParticleKeys.length > 0,
  };


  const resolveBurstLayerConfig = (rawConfig, defaults, fields) => {
    const raw = { ...(rawConfig || {}) };
    const invalidKeys = [];
    const invalid = (key) => { if (!invalidKeys.includes(key)) invalidKeys.push(key); };
    const resolved = { ...defaults, ...raw };
    fields.forEach(({ key, type = 'nonNegative', easing = false }) => {
      if (key === 'enabled') {
        resolved.enabled = typeof raw.enabled === 'boolean' ? raw.enabled : defaults.enabled;
        if (typeof raw.enabled !== 'boolean') invalid(key);
      } else if (easing) {
        resolved[key] = readEasingName(raw[key], defaults[key]);
        if (!(typeof raw[key] === 'string' && HERO_OVERVIEW_EASING[raw[key]])) invalid(key);
      } else if (type === 'positiveInteger') {
        resolved[key] = readPositiveInteger(raw[key], defaults[key]);
        if (!(Number.isInteger(raw[key]) && raw[key] > 0)) invalid(key);
      } else if (type === 'positive') {
        resolved[key] = readPositiveSeconds(raw[key], defaults[key]);
        if (!(typeof raw[key] === 'number' && Number.isFinite(raw[key]) && raw[key] > 0)) invalid(key);
      } else if (type === 'opacity') {
        resolved[key] = readNullableOpacity(raw[key], defaults[key]);
        if (!(typeof raw[key] === 'number' && Number.isFinite(raw[key]))) invalid(key);
      } else {
        resolved[key] = readNonNegativeSeconds(raw[key], defaults[key]);
        if (!(typeof raw[key] === 'number' && Number.isFinite(raw[key]) && raw[key] >= 0)) invalid(key);
      }
    });
    if (resolved.speedMin != null && resolved.speedMax != null && resolved.speedMin > resolved.speedMax) {
      invalid('speedRangeOrder');
      [resolved.speedMin, resolved.speedMax] = [resolved.speedMax, resolved.speedMin];
    }
    if (resolved.lifetimeMin != null && resolved.lifetimeMax != null && resolved.lifetimeMin > resolved.lifetimeMax) {
      invalid('lifetimeRangeOrder');
      [resolved.lifetimeMin, resolved.lifetimeMax] = [resolved.lifetimeMax, resolved.lifetimeMin];
    }
    return {
      ...resolved,
      wired: true,
      routeTimelineWired: true,
      triggerAtUnits: 'seconds-from-hero-overview-start',
      invalidKeys,
      fallbackUsed: invalidKeys.length > 0,
    };
  };

  const shardBurst = resolveBurstLayerConfig(config?.shardBurst, DEFAULT_SHARD_BURST_CONFIG, [
    { key: 'enabled' },
    { key: 'triggerAt' },
    { key: 'burstDuration', type: 'positive' },
    { key: 'burstDistance' },
    { key: 'burstEase', easing: true },
  ]);
  const explosionParticles = resolveBurstLayerConfig({ ...(config?.explosionParticles || {}), ...(motionProfile.explosionParticles || {}) }, DEFAULT_EXPLOSION_PARTICLES_CONFIG, [
    { key: 'enabled' }, { key: 'triggerAt' }, { key: 'count', type: 'positiveInteger' }, { key: 'duration', type: 'positive' },
    { key: 'speedMin' }, { key: 'speedMax' }, { key: 'lifetimeMin', type: 'positive' }, { key: 'lifetimeMax', type: 'positive' },
    { key: 'opacity', type: 'opacity' }, { key: 'spawnRadius' }, { key: 'spread' },
  ]);
  const cameraForce = resolveBurstLayerConfig(config?.cameraForce, DEFAULT_CAMERA_FORCE_CONFIG, [
    { key: 'enabled' }, { key: 'triggerAt' }, { key: 'pushbackDistance' }, { key: 'pushbackDuration', type: 'positive' },
    { key: 'pushbackEase', easing: true }, { key: 'catchDuration', type: 'positive' }, { key: 'catchEase', easing: true },
    { key: 'shakeAmplitude' }, { key: 'shakeDuration' }, { key: 'shakeFrequency' },
  ]);

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
    explosionMotionProfile: motionProfileName,
    // The profile's values go over everything else, so switching the profile
    // is all it takes.
    timeDilation: {
      ...Object.fromEntries(
        Object.entries(HERO_OVERVIEW_CINEMATIC_CONFIG.timeDilation).map(([key, fallback]) => {
          const value = config?.timeDilation?.[key];
          return [key, typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback];
        }),
      ),
      ...(motionProfile.timeDilation || {}),
    },
    // Laid over crystalConfig fracture.smoke where the smoke is mounted.
    smoke: { ...(motionProfile.smoke || {}) },
    fracture,
    rawFracture,
    invalidFractureKeys,
    fractureConfigFallbackUsed: fracture.fallbackUsed,
    particles,
    rawParticles,
    invalidParticleKeys,
    particleConfigFallbackUsed: particles.fallbackUsed || shardBurst.fallbackUsed || explosionParticles.fallbackUsed || cameraForce.fallbackUsed,
    particleFieldsWired,
    particleFieldsPlaceholders,
    shardBurst,
    explosionParticles,
    cameraForce,
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
    defaultsUsed: invalidDurationKeys.length > 0 || invalidTotal || totalDurationFallbackUsed || fracture.fallbackUsed || particles.fallbackUsed || shardBurst.fallbackUsed || explosionParticles.fallbackUsed || cameraForce.fallbackUsed,
    invalidConfigFallbackOccurred: invalidDurationKeys.length > 0 || invalidTotal || totalDurationFallbackUsed || fracture.fallbackUsed || particles.fallbackUsed || shardBurst.fallbackUsed || explosionParticles.fallbackUsed || cameraForce.fallbackUsed,
    invalidDurationKeys,
    invalidTotal,
  };
};

export const HERO_OVERVIEW_CINEMATIC_RESOLVED = resolveHeroOverviewCinematicConfig();

// Index → hero: the counterpart of the bullet-time move. The camera orbits round
// the crystal from the index back to the hero angle it left from (the shortest
// way, unless it is already moving the other way fast: see
// directionPenaltySeconds), closing in to an orbiting distance and then to the
// hero's, while the fragments gather and snap together just before it lands.
// It arrives turning at the hero auto-orbit's own speed, so the orbit simply
// carries on. A camera that is already moving (an interrupted hero → overview)
// carries that motion into the return and is turned round smoothly.
export const HERO_RETURN_CINEMATIC = {
  durationSeconds: 2.4,
  // The fragments reach the centre here, ~0.35s before the camera lands; the
  // masked swap to the whole crystal (~0.3s) completes as it does.
  reformSeconds: 2.05,
  reformEase: 'returnReform',
  // The hero copy comes back (HeroSection's schedule, unchanged) once the
  // reform is this share of the way through its time, so the headline is not
  // over the big fragments as they gather. At 0.7 they are ~40% of the way in;
  // they close up as the headline fades in, and its last line is in as the
  // camera lands. It used to start as soon as the scroll settled, ~1s in,
  // and was fully in at ~2s with the fragments only ~45% of the way in.
  headlineAt: 0.7,
  orbitEase: 'returnOrbit',
  dollyEase: 'returnDolly',
  framingEase: 'returnFraming',
  // Turning against the camera's current spin costs this many seconds of that
  // spin when choosing the way round, so a camera already sweeping one way keeps
  // going that way unless the other way is much shorter.
  directionPenaltySeconds: 0.6,
  // Limits on the motion carried in (rad/s, units/s), against stalled frames.
  carryAngularSpeedCap: 2.5,
  carryLinearSpeedCap: 10,
};

