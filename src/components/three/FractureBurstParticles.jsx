import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createLogger } from '../../utils/logger';

const EMITTER_START_LEAD_S = 0.08;
const PARTICLE_FADE_IN_END = 0.03;
const PARTICLE_FADE_OUT_START = 0.42;
const PARTICLE_FADE_OUT_END = 0.76;
const DEFAULT_LIFETIME_MIN = 0.9;
const DEFAULT_LIFETIME_MAX = 1.6;
const DEFAULT_SPEED_MIN = 4.4;
const DEFAULT_SPEED_MAX = 6.6;
const DEFAULT_PARTICLE_BLENDING = 'additive';
const PARTICLE_BLENDING_BY_NAME = {
  additive: THREE.AdditiveBlending,
  normal: THREE.NormalBlending,
  subtractive: THREE.SubtractiveBlending,
  multiply: THREE.MultiplyBlending,
  none: THREE.NoBlending,
  no: THREE.NoBlending,
};

const normalizeParticleBlending = (value) => (
  typeof value === 'string' && PARTICLE_BLENDING_BY_NAME[value] != null ? value : DEFAULT_PARTICLE_BLENDING
);

const logger = createLogger('fracture-burst-particles');

const smoothstep = (edge0, edge1, x) => {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
};

const swapScalar = (arr, a, b) => {
  const tmp = arr[a];
  arr[a] = arr[b];
  arr[b] = tmp;
};

const swapVec3 = (arr, a, b) => {
  const a3 = a * 3;
  const b3 = b * 3;
  for (let k = 0; k < 3; k += 1) {
    const tmp = arr[a3 + k];
    arr[a3 + k] = arr[b3 + k];
    arr[b3 + k] = tmp;
  }
};

const FractureBurstParticles = ({
  trigger,
  delay = 0,
  count = 360,
  color = '#9af8ff',
  emitterPosition = [0, 0, 0],
  spawnRadius = 0.5,
  emitterScale = [1, 1, 1],
  spread = 0.5,
  duration = null,
  lifetime = null,
  lifetimeMin = null,
  lifetimeMax = null,
  speed = null,
  speedMin = null,
  speedMax = null,
  size = null,
  opacity = null,
  blending = DEFAULT_PARTICLE_BLENDING,
  // Per-particle high-frequency twinkle (matches the orb motes' shimmer). Each
  // particle gets its own random phase/rate so the swarm sparkles rather than
  // pulsing in lockstep. shimmerStrength=0 (or shimmer=false) fully disables it.
  shimmer = true,
  shimmerStrength = 0.55,
  shimmerSpeed = 9.0,
  onBurstGenerated = null,
}) => {
  const resolvedCount = Math.max(0, Math.floor(Number.isFinite(count) ? count : 0));
  const pointsRef = useRef();
  const startTimeRef = useRef(0);
  const delayRef = useRef(null);
  const activeCountRef = useRef(0);
  const latestPropsRef = useRef({
    delay,
    count: resolvedCount,
    spawnRadius,
    emitterScale,
    spread,
    duration,
    lifetime,
    lifetimeMin,
    lifetimeMax,
    speed,
    speedMin,
    speedMax,
    size,
    opacity,
    blending,
    onBurstGenerated,
  });
  const generatedOpacityRef = useRef(1);
  const generationRef = useRef({ trigger: null, countForTrigger: 0 });

  const velocitiesRef = useRef(new Float32Array(resolvedCount * 3));
  const lifetimesRef = useRef(new Float32Array(resolvedCount));
  const agesRef = useRef(new Float32Array(resolvedCount));
  const baseSizesRef = useRef(new Float32Array(resolvedCount));
  const dragsRef = useRef(new Float32Array(resolvedCount));
  const buoyanciesRef = useRef(new Float32Array(resolvedCount));
  const turbulencesRef = useRef(new Float32Array(resolvedCount));
  const swirlsRef = useRef(new Float32Array(resolvedCount));
  const phasesRef = useRef(new Float32Array(resolvedCount));
  const flowFreqsRef = useRef(new Float32Array(resolvedCount));
  const flowAmpsRef = useRef(new Float32Array(resolvedCount));

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(resolvedCount * 3), 3));
    g.setAttribute('aAlpha', new THREE.BufferAttribute(new Float32Array(resolvedCount), 1));
    g.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(resolvedCount), 1));
    g.setAttribute('aShimmerPhase', new THREE.BufferAttribute(new Float32Array(resolvedCount), 1));
    g.setAttribute('aShimmerRate', new THREE.BufferAttribute(new Float32Array(resolvedCount), 1));
    return g;
  }, [resolvedCount]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(color) },
          uPixelRatio: {
            value: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1,
          },
          uTime: { value: 0 },
          uShimmerStrength: { value: shimmer ? THREE.MathUtils.clamp(shimmerStrength, 0, 3) : 0 },
          uShimmerSpeed: { value: Math.max(0, shimmerSpeed) },
        },
        vertexShader: `
          attribute float aSize;
          attribute float aAlpha;
          attribute float aShimmerPhase;
          attribute float aShimmerRate;
          uniform float uPixelRatio;
          uniform float uTime;
          uniform float uShimmerStrength;
          uniform float uShimmerSpeed;
          varying float vAlpha;
          varying float vShimmer;

          void main() {
            vAlpha = aAlpha;
            // Per-particle sparkle. A gentle twinkle sets a baseline wobble, but
            // the readable part is the flare: a sharp, brief spike (pow(sin,16)) at
            // a per-particle rate/phase. In a dense additive cloud a brightness-only
            // twinkle averages out, so the flare also PULSES the point size -- the
            // momentary bigger, brighter dots register as distinct glints.
            // At strength 0 this collapses to bright=1 / sizePulse=1 (no shimmer).
            float tw = 0.5 + 0.5 * sin(uTime * uShimmerSpeed * aShimmerRate + aShimmerPhase);
            float flare = pow(max(0.0, sin(uTime * uShimmerSpeed * 0.5 * aShimmerRate + aShimmerPhase * 2.3)), 16.0);
            float bright = (1.0 - 0.6 * uShimmerStrength) + 0.6 * uShimmerStrength * tw + 2.4 * uShimmerStrength * flare;
            vShimmer = max(bright, 0.0);
            float sizePulse = 1.0 + 1.2 * uShimmerStrength * flare;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = aSize * uPixelRatio * (300.0 / -mvPosition.z) * sizePulse;
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          varying float vAlpha;
          varying float vShimmer;

          void main() {
            vec2 uv = gl_PointCoord - 0.5;
            float d = length(uv);
            float soft = 1.0 - smoothstep(0.25, 0.5, d);
            gl_FragColor = vec4(uColor, vAlpha * soft * vShimmer);
          }
        `,
        transparent: true,
        blending: PARTICLE_BLENDING_BY_NAME[DEFAULT_PARTICLE_BLENDING],
        depthWrite: false,
      }),
    [color],
  );

  useEffect(() => {
    latestPropsRef.current = {
      delay,
      count: resolvedCount,
      spawnRadius,
      emitterScale,
      spread,
      duration,
      lifetime,
      lifetimeMin,
      lifetimeMax,
      speed,
      speedMin,
      speedMax,
      size,
      opacity,
      blending,
      onBurstGenerated,
    };
  }, [delay, resolvedCount, spawnRadius, emitterScale, spread, duration, lifetime, lifetimeMin, lifetimeMax, speed, speedMin, speedMax, size, opacity, blending, onBurstGenerated]);

  useEffect(() => {
    const resolvedBlending = normalizeParticleBlending(blending);
    material.blending = PARTICLE_BLENDING_BY_NAME[resolvedBlending];
    material.needsUpdate = true;
  }, [blending, material]);

  useEffect(() => {
    material.uniforms.uShimmerStrength.value = shimmer ? THREE.MathUtils.clamp(shimmerStrength, 0, 3) : 0;
    material.uniforms.uShimmerSpeed.value = Math.max(0, shimmerSpeed);
  }, [shimmer, shimmerStrength, shimmerSpeed, material]);

  useEffect(() => {
    velocitiesRef.current = new Float32Array(resolvedCount * 3);
    lifetimesRef.current = new Float32Array(resolvedCount);
    agesRef.current = new Float32Array(resolvedCount);
    baseSizesRef.current = new Float32Array(resolvedCount);
    dragsRef.current = new Float32Array(resolvedCount);
    buoyanciesRef.current = new Float32Array(resolvedCount);
    turbulencesRef.current = new Float32Array(resolvedCount);
    swirlsRef.current = new Float32Array(resolvedCount);
    phasesRef.current = new Float32Array(resolvedCount);
    flowFreqsRef.current = new Float32Array(resolvedCount);
    flowAmpsRef.current = new Float32Array(resolvedCount);
    activeCountRef.current = Math.min(activeCountRef.current, resolvedCount);
  }, [resolvedCount]);

  useEffect(() => {
    logger.debug('geometry attributes', Object.keys(geometry.attributes));
  }, [geometry]);

  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  useEffect(() => {
    if (delayRef.current) {
      clearTimeout(delayRef.current);
      delayRef.current = null;
    }

    if (!trigger) {
      startTimeRef.current = 0;
      activeCountRef.current = 0;
      return;
    }

    logger.debug('[fracture] trigger fired');

    let cancelled = false;

    const reset = () => {
      if (cancelled) return;

      const positions = geometry.attributes.position.array;
      const alphas = geometry.attributes.aAlpha.array;
      const sizes = geometry.attributes.aSize.array;
      const shimmerPhases = geometry.attributes.aShimmerPhase.array;
      const shimmerRates = geometry.attributes.aShimmerRate.array;
      const velocities = velocitiesRef.current;
      const lifetimes = lifetimesRef.current;
      const ages = agesRef.current;
      const baseSizes = baseSizesRef.current;
      const drags = dragsRef.current;
      const buoyancies = buoyanciesRef.current;
      const turbulences = turbulencesRef.current;
      const swirls = swirlsRef.current;
      const phases = phasesRef.current;
      const flowFreqs = flowFreqsRef.current;
      const flowAmps = flowAmpsRef.current;
      const latest = latestPropsRef.current;
      const requestedCount = Math.max(0, Math.floor(Number.isFinite(latest.count) ? latest.count : 0));
      const spawnCount = Math.min(requestedCount, lifetimes.length);
      const resolvedSpawnRadius = Number.isFinite(latest.spawnRadius) ? Math.max(0, latest.spawnRadius) : 0.5;
      const spawnRadiusScale = resolvedSpawnRadius / 0.5;
      const resolvedEmitterScale = Array.isArray(latest.emitterScale) && latest.emitterScale.length === 3
        ? latest.emitterScale.map((value) => (Number.isFinite(value) ? Math.max(0, value) : 1))
        : [1, 1, 1];
      const [emitterScaleX, emitterScaleY, emitterScaleZ] = resolvedEmitterScale;
      const resolvedSpread = Number.isFinite(latest.spread) ? Math.max(0, latest.spread) : 0.5;
      const spreadScale = resolvedSpread / 0.5;
      const readPositive = (value) => (typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null);
      const readNonNegative = (value) => (typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null);
      const fixedLifetime = readPositive(latest.lifetime);
      const durationLifetime = readPositive(latest.duration);
      let resolvedLifetimeMin = readPositive(latest.lifetimeMin);
      let resolvedLifetimeMax = readPositive(latest.lifetimeMax);
      const fixedSpeed = readNonNegative(latest.speed);
      let resolvedSpeedMin = readNonNegative(latest.speedMin);
      let resolvedSpeedMax = readNonNegative(latest.speedMax);
      const fixedSize = readPositive(latest.size);
      const resolvedOpacity = typeof latest.opacity === 'number' && Number.isFinite(latest.opacity)
        ? THREE.MathUtils.clamp(latest.opacity, 0, 1)
        : 1;
      const resolvedBlending = normalizeParticleBlending(latest.blending);
      generatedOpacityRef.current = resolvedOpacity;
      const sameTrigger = generationRef.current.trigger === trigger;
      const generationCountForCurrentTrigger = sameTrigger ? generationRef.current.countForTrigger + 1 : 1;
      generationRef.current = { trigger, countForTrigger: generationCountForCurrentTrigger };
      let lifetimeMin = Infinity;
      let lifetimeMax = -Infinity;
      let velocityMin = Infinity;
      let velocityMax = -Infinity;
      let initialRadiusMin = Infinity;
      let initialRadiusMax = -Infinity;
      let travelDistanceMin = Infinity;
      let travelDistanceMax = -Infinity;
      let initialBoundsXMin = Infinity;
      let initialBoundsXMax = -Infinity;
      let initialBoundsYMin = Infinity;
      let initialBoundsYMax = -Infinity;
      let initialBoundsZMin = Infinity;
      let initialBoundsZMax = -Infinity;
      const invalidParticleRuntimeValues = [];
      if (latest.lifetime != null && fixedLifetime == null) invalidParticleRuntimeValues.push('lifetime');
      if (latest.duration != null && durationLifetime == null) invalidParticleRuntimeValues.push('duration');
      if (latest.lifetimeMin != null && resolvedLifetimeMin == null) invalidParticleRuntimeValues.push('lifetimeMin');
      if (latest.lifetimeMax != null && resolvedLifetimeMax == null) invalidParticleRuntimeValues.push('lifetimeMax');
      const lifetimeSource = fixedLifetime != null
        ? 'fixed-lifetime'
        : (durationLifetime != null
          ? 'duration'
          : (resolvedLifetimeMin != null || resolvedLifetimeMax != null ? 'configured-range' : 'internal-default'));
      if (lifetimeSource === 'configured-range') {
        resolvedLifetimeMin = resolvedLifetimeMin ?? DEFAULT_LIFETIME_MIN;
        resolvedLifetimeMax = resolvedLifetimeMax ?? DEFAULT_LIFETIME_MAX;
        if (resolvedLifetimeMin > resolvedLifetimeMax) {
          invalidParticleRuntimeValues.push('lifetimeRangeOrder');
          [resolvedLifetimeMin, resolvedLifetimeMax] = [resolvedLifetimeMax, resolvedLifetimeMin];
        }
      }
      if (latest.speed != null && fixedSpeed == null) invalidParticleRuntimeValues.push('speed');
      if (latest.speedMin != null && resolvedSpeedMin == null) invalidParticleRuntimeValues.push('speedMin');
      if (latest.speedMax != null && resolvedSpeedMax == null) invalidParticleRuntimeValues.push('speedMax');
      const speedSource = fixedSpeed != null
        ? 'fixed-speed'
        : (resolvedSpeedMin != null || resolvedSpeedMax != null ? 'configured-range' : 'internal-default');
      if (speedSource === 'configured-range') {
        resolvedSpeedMin = resolvedSpeedMin ?? DEFAULT_SPEED_MIN;
        resolvedSpeedMax = resolvedSpeedMax ?? DEFAULT_SPEED_MAX;
        if (resolvedSpeedMin > resolvedSpeedMax) {
          invalidParticleRuntimeValues.push('speedRangeOrder');
          [resolvedSpeedMin, resolvedSpeedMax] = [resolvedSpeedMax, resolvedSpeedMin];
        }
      }
      if (latest.size != null && fixedSize == null) invalidParticleRuntimeValues.push('size');
      if (latest.opacity != null && !(typeof latest.opacity === 'number' && Number.isFinite(latest.opacity))) invalidParticleRuntimeValues.push('opacity');
      if (typeof latest.opacity === 'number' && Number.isFinite(latest.opacity) && (latest.opacity < 0 || latest.opacity > 1)) invalidParticleRuntimeValues.push('opacityClamped');
      if (latest.blending != null && normalizeParticleBlending(latest.blending) !== latest.blending) invalidParticleRuntimeValues.push('blending');
      const lifetimeMode = lifetimeSource;
      const speedMode = speedSource;
      const sizeMode = fixedSize != null ? 'fixed' : 'default-randomized';
      const opacityMode = latest.opacity != null ? 'config-driven' : 'default';
      let baseSpeedMin = Infinity;
      let baseSpeedMax = -Infinity;
      let sizeMin = Infinity;
      let sizeMax = -Infinity;

      logger.debug('[particles] before spawn activeCount=', activeCountRef.current);
      logger.debug('[particles] spawning count=', spawnCount, 'spawnRadius=', resolvedSpawnRadius, 'emitterScale=', resolvedEmitterScale, 'spread=', resolvedSpread);

      for (let i = 0; i < spawnCount; i += 1) {
        const i3 = i * 3;

        const angle = Math.random() * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
        const ringRadius = (0.38 + Math.random() * 0.44) * spawnRadiusScale;
        const ringThickness = (-0.14 + Math.random() * 0.28) * spawnRadiusScale;
        const yOffset = (-0.48 + Math.random() * 1.0) * spawnRadiusScale;
        const radial = ringRadius + ringThickness;
        const ringYOffset = -0.24 * spawnRadiusScale;

        const emitterWidth = 1.0;
        const emitterHeight = 1.15;
        const emitterDepth = 1.0;

        positions[i3] = Math.cos(angle) * emitterWidth * radial * emitterScaleX;
        positions[i3 + 1] = (yOffset * emitterHeight + ringYOffset) * emitterScaleY;
        positions[i3 + 2] = Math.sin(angle) * emitterDepth * radial * emitterScaleZ;
        initialBoundsXMin = Math.min(initialBoundsXMin, positions[i3]);
        initialBoundsXMax = Math.max(initialBoundsXMax, positions[i3]);
        initialBoundsYMin = Math.min(initialBoundsYMin, positions[i3 + 1]);
        initialBoundsYMax = Math.max(initialBoundsYMax, positions[i3 + 1]);
        initialBoundsZMin = Math.min(initialBoundsZMin, positions[i3 + 2]);
        initialBoundsZMax = Math.max(initialBoundsZMax, positions[i3 + 2]);
        const initialRadius = Math.sqrt(positions[i3] ** 2 + positions[i3 + 1] ** 2 + positions[i3 + 2] ** 2);
        if (Number.isFinite(initialRadius)) {
          initialRadiusMin = Math.min(initialRadiusMin, initialRadius);
          initialRadiusMax = Math.max(initialRadiusMax, initialRadius);
        } else {
          invalidParticleRuntimeValues.push(`initialRadius:${i}`);
        }

        const outwardDir = new THREE.Vector3(
          Math.cos(angle) * (0.65 + Math.random() * 0.35),
          -0.22 + Math.random() * 0.42,
          Math.sin(angle) * (0.65 + Math.random() * 0.35),
        ).normalize();
        const burstJitter = new THREE.Vector3(
          (-0.48 + Math.random() * 0.96) * Math.min(spreadScale, 2),
          (-0.48 + Math.random() * 0.96) * Math.min(spreadScale, 2),
          (-0.48 + Math.random() * 0.96) * Math.min(spreadScale, 2),
        );
        const burstDir = outwardDir.add(burstJitter).normalize();
        const baseSpeed = fixedSpeed != null
          ? fixedSpeed
          : (speedSource === 'configured-range'
            ? THREE.MathUtils.lerp(
              resolvedSpeedMin ?? resolvedSpeedMax,
              resolvedSpeedMax ?? resolvedSpeedMin,
              Math.random(),
            )
            : DEFAULT_SPEED_MIN + Math.random() * (DEFAULT_SPEED_MAX - DEFAULT_SPEED_MIN));
        baseSpeedMin = Math.min(baseSpeedMin, baseSpeed);
        baseSpeedMax = Math.max(baseSpeedMax, baseSpeed);
        const velocity = burstDir.multiplyScalar(baseSpeed * spreadScale);
        const verticalKickScale = speedSource === 'internal-default' ? 1 : (baseSpeed / ((DEFAULT_SPEED_MIN + DEFAULT_SPEED_MAX) / 2));
        velocity.y += (-0.7 + Math.random() * 0.54) * spreadScale * verticalKickScale;
        const velocityMagnitude = velocity.length();
        if (Number.isFinite(velocityMagnitude)) {
          velocityMin = Math.min(velocityMin, velocityMagnitude);
          velocityMax = Math.max(velocityMax, velocityMagnitude);
        } else {
          invalidParticleRuntimeValues.push(`velocity:${i}`);
        }

        velocities[i3] = velocity.x;
        velocities[i3 + 1] = velocity.y;
        velocities[i3 + 2] = velocity.z;

        ages[i] = 0;
        lifetimes[i] = fixedLifetime != null
          ? fixedLifetime
          : (durationLifetime != null
            ? durationLifetime
            : (lifetimeSource === 'configured-range'
              ? THREE.MathUtils.lerp(
                resolvedLifetimeMin,
                resolvedLifetimeMax,
                Math.random(),
              )
              : DEFAULT_LIFETIME_MIN + Math.random() * (DEFAULT_LIFETIME_MAX - DEFAULT_LIFETIME_MIN)));
        if (Number.isFinite(lifetimes[i]) && lifetimes[i] > 0) {
          lifetimeMin = Math.min(lifetimeMin, lifetimes[i]);
          lifetimeMax = Math.max(lifetimeMax, lifetimes[i]);
          if (Number.isFinite(velocityMagnitude)) {
            const travelDistance = velocityMagnitude * lifetimes[i];
            travelDistanceMin = Math.min(travelDistanceMin, travelDistance);
            travelDistanceMax = Math.max(travelDistanceMax, travelDistance);
          }
        } else {
          invalidParticleRuntimeValues.push(`lifetime:${i}`);
        }

        const tierRoll = Math.random();
        let baseSize;
        if (tierRoll > 0.9) {
          baseSize = 0.07 + Math.random() * 0.04;
        } else if (tierRoll > 0.62) {
          baseSize = 0.045 + Math.random() * 0.03;
        } else {
          baseSize = 0.028 + Math.random() * 0.022;
        }
        baseSize = fixedSize ?? (baseSize * 2.0);
        baseSizes[i] = baseSize;
        sizes[i] = baseSize;
        if (Number.isFinite(baseSize) && baseSize > 0) {
          sizeMin = Math.min(sizeMin, baseSize);
          sizeMax = Math.max(sizeMax, baseSize);
        } else {
          invalidParticleRuntimeValues.push(`size:${i}`);
        }

        drags[i] = 0.84 + Math.random() * 0.08;
        buoyancies[i] = 0.013 + Math.random() * 0.013;
        turbulences[i] = 0.014 + Math.random() * 0.021;
        swirls[i] = 0.008 + Math.random() * 0.012;
        phases[i] = Math.random() * Math.PI * 2;
        flowFreqs[i] = 8.0 + Math.random() * 10.0;
        flowAmps[i] = 0.018 + Math.random() * 0.032;
        shimmerPhases[i] = Math.random() * Math.PI * 2;
        shimmerRates[i] = 0.6 + Math.random() * 0.9;

        alphas[i] = resolvedOpacity;
      }

      for (let i = spawnCount; i < lifetimes.length; i += 1) {
        const i3 = i * 3;
        positions[i3] = positions[i3 + 1] = positions[i3 + 2] = 0;
        velocities[i3] = velocities[i3 + 1] = velocities[i3 + 2] = 0;
        ages[i] = 0;
        lifetimes[i] = 0;
        baseSizes[i] = 0;
        drags[i] = 0;
        buoyancies[i] = 0;
        turbulences[i] = 0;
        swirls[i] = 0;
        phases[i] = 0;
        flowFreqs[i] = 0;
        flowAmps[i] = 0;
        shimmerPhases[i] = 0;
        shimmerRates[i] = 0;
        sizes[i] = 0;
        alphas[i] = 0;
      }

      activeCountRef.current = spawnCount;
      const generationDetails = {
        trigger,
        generatedCount: spawnCount,
        requestedCount,
        spawnRadius: resolvedSpawnRadius,
        emitterScale: resolvedEmitterScale,
        spread: resolvedSpread,
        spreadScale,
        duration: durationLifetime,
        lifetime: fixedLifetime,
        lifetimeMinProp: resolvedLifetimeMin,
        lifetimeMaxProp: resolvedLifetimeMax,
        speed: fixedSpeed,
        speedMinProp: resolvedSpeedMin,
        speedMaxProp: resolvedSpeedMax,
        size: fixedSize,
        opacity: resolvedOpacity,
        blending: latest.blending,
        resolvedParticleBlending: resolvedBlending,
        emitterPosition,
        initialRadiusMin: Number.isFinite(initialRadiusMin) ? initialRadiusMin : null,
        initialRadiusMax: Number.isFinite(initialRadiusMax) ? initialRadiusMax : null,
        initialBoundsXMin: Number.isFinite(initialBoundsXMin) ? initialBoundsXMin : null,
        initialBoundsXMax: Number.isFinite(initialBoundsXMax) ? initialBoundsXMax : null,
        initialBoundsYMin: Number.isFinite(initialBoundsYMin) ? initialBoundsYMin : null,
        initialBoundsYMax: Number.isFinite(initialBoundsYMax) ? initialBoundsYMax : null,
        initialBoundsZMin: Number.isFinite(initialBoundsZMin) ? initialBoundsZMin : null,
        initialBoundsZMax: Number.isFinite(initialBoundsZMax) ? initialBoundsZMax : null,
        lifetimeMin: Number.isFinite(lifetimeMin) ? lifetimeMin : null,
        lifetimeMax: Number.isFinite(lifetimeMax) ? lifetimeMax : null,
        velocityMin: Number.isFinite(velocityMin) ? velocityMin : null,
        velocityMax: Number.isFinite(velocityMax) ? velocityMax : null,
        speedMin: Number.isFinite(baseSpeedMin) ? baseSpeedMin : null,
        speedMax: Number.isFinite(baseSpeedMax) ? baseSpeedMax : null,
        sizeMin: Number.isFinite(sizeMin) ? sizeMin : null,
        sizeMax: Number.isFinite(sizeMax) ? sizeMax : null,
        lastGeneratedLifetimeMin: Number.isFinite(lifetimeMin) ? lifetimeMin : null,
        lastGeneratedLifetimeMax: Number.isFinite(lifetimeMax) ? lifetimeMax : null,
        lastGeneratedSpeedMin: Number.isFinite(baseSpeedMin) ? baseSpeedMin : null,
        lastGeneratedSpeedMax: Number.isFinite(baseSpeedMax) ? baseSpeedMax : null,
        lastGeneratedSizeMin: Number.isFinite(sizeMin) ? sizeMin : null,
        lastGeneratedSizeMax: Number.isFinite(sizeMax) ? sizeMax : null,
        lastGeneratedOpacity: resolvedOpacity,
        lifetimeMode,
        speedMode,
        sizeMode,
        opacityMode,
        lifetimeSource,
        speedSource,
        lifetimeWasFixed: lifetimeSource === 'fixed-lifetime' || lifetimeSource === 'duration',
        lifetimeWasRandomized: lifetimeSource === 'configured-range' || lifetimeSource === 'internal-default',
        speedWasFixed: speedSource === 'fixed-speed',
        speedWasRandomized: speedSource !== 'fixed-speed',
        sizeWasFixed: sizeMode === 'fixed',
        sizeWasDefaultRandomized: sizeMode === 'default-randomized',
        opacityWasConfigDriven: opacityMode === 'config-driven',
        travelDistanceMin: Number.isFinite(travelDistanceMin) ? travelDistanceMin : null,
        travelDistanceMax: Number.isFinite(travelDistanceMax) ? travelDistanceMax : null,
        spreadAppliedToInitialPosition: false,
        spreadAppliedToVelocityOrTravel: true,
        emitterScaleAppliedToInitialPosition: true,
        emitterScaleAppliedToVelocityOrTravel: false,
        generationCountForCurrentTrigger,
        regeneratedThisFrame: false,
        regenerationReason: generationCountForCurrentTrigger > 1
          ? 'same trigger generated more than once'
          : 'trigger changed',
        invalidParticleRuntimeValues,
      };
      latest.onBurstGenerated?.(generationDetails);
      if (typeof globalThis !== 'undefined') {
        globalThis.__FRACTURE_BURST_PARTICLES_LAST_GENERATED__ = generationDetails;
        if (generationCountForCurrentTrigger > 1 && globalThis.__HERO_OVERVIEW_PILOT_DIAGNOSTICS__) {
          console.warn('[fracture-burst-particles] duplicate generation for trigger', generationDetails);
        }
      }
      logger.debug('[particles] after spawn activeCount=', activeCountRef.current);

      for (let i = 0; i < Math.min(5, activeCountRef.current); i += 1) {
        const i3 = i * 3;
        logger.debug('[particle]', i, {
          position: [positions[i3], positions[i3 + 1], positions[i3 + 2]],
          velocity: [velocities[i3], velocities[i3 + 1], velocities[i3 + 2]],
          life: lifetimes[i],
          age: ages[i],
          size: sizes[i],
          alpha: alphas[i],
        });
      }

      geometry.setDrawRange(0, activeCountRef.current);
      logger.debug('drawRange', geometry.drawRange);
      logger.debug('activeCount', activeCountRef.current);

      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.aAlpha.needsUpdate = true;
      geometry.attributes.aSize.needsUpdate = true;
      geometry.attributes.aShimmerPhase.needsUpdate = true;
      geometry.attributes.aShimmerRate.needsUpdate = true;

      startTimeRef.current = performance.now() - EMITTER_START_LEAD_S * 1000;
    };

    const effectiveDelay = Math.max((latestPropsRef.current.delay ?? 0) - EMITTER_START_LEAD_S, 0);
    if (effectiveDelay > 0) {
      delayRef.current = setTimeout(() => {
        delayRef.current = null;
        reset();
      }, effectiveDelay * 1000);
    } else {
      reset();
    }

    return () => {
      cancelled = true;
      if (delayRef.current) {
        clearTimeout(delayRef.current);
        delayRef.current = null;
      }
    };
  }, [trigger]);

  useEffect(() => {
    if (pointsRef.current) {
      pointsRef.current.frustumCulled = false;
    }
  });

  useFrame((state, dt) => {
    // Keep the shimmer clock advancing even before/after a burst so the twinkle
    // never jumps when particles (re)appear.
    material.uniforms.uTime.value = state.clock.elapsedTime;
    if (!startTimeRef.current) return;

    const positions = geometry.attributes.position.array;
    const alphas = geometry.attributes.aAlpha.array;
    const sizes = geometry.attributes.aSize.array;
    const shimmerPhases = geometry.attributes.aShimmerPhase.array;
    const shimmerRates = geometry.attributes.aShimmerRate.array;
    const velocities = velocitiesRef.current;
    const lifetimes = lifetimesRef.current;
    const ages = agesRef.current;
    const baseSizes = baseSizesRef.current;
    const drags = dragsRef.current;
    const buoyancies = buoyanciesRef.current;
    const turbulences = turbulencesRef.current;
    const swirls = swirlsRef.current;
    const phases = phasesRef.current;
    const flowFreqs = flowFreqsRef.current;
    const flowAmps = flowAmpsRef.current;

    let activeCount = activeCountRef.current;
    const activeBefore = activeCount;
    let expiredThisFrame = 0;

    for (let i = 0; i < activeCount; i += 1) {
      const life = lifetimes[i];
      if (!life) continue;

      ages[i] += dt;
      const lifeT = THREE.MathUtils.clamp(ages[i] / life, 0, 1);

      if (i < 3) {
        logger.debug('[particle update]', i, {
          age: ages[i],
          lifetime: life,
          normalized: lifeT,
        });
      }

      if (ages[i] >= life) {
        alphas[i] = 0;
        sizes[i] = 0;

        const last = activeCount - 1;
        if (i !== last) {
          swapVec3(positions, i, last);
          swapVec3(velocities, i, last);
          swapScalar(lifetimes, i, last);
          swapScalar(ages, i, last);
          swapScalar(baseSizes, i, last);
          swapScalar(drags, i, last);
          swapScalar(buoyancies, i, last);
          swapScalar(turbulences, i, last);
          swapScalar(swirls, i, last);
          swapScalar(phases, i, last);
          swapScalar(flowFreqs, i, last);
          swapScalar(flowAmps, i, last);
          swapScalar(shimmerPhases, i, last);
          swapScalar(shimmerRates, i, last);
          swapScalar(alphas, i, last);
          swapScalar(sizes, i, last);
        }

        activeCount -= 1;
        expiredThisFrame += 1;
        i -= 1;
        continue;
      }

      const i3 = i * 3;
      if (ages[i] < 0.1) {
        velocities[i3] *= 0.982;
        velocities[i3 + 1] *= 0.982;
        velocities[i3 + 2] *= 0.982;
        velocities[i3 + 1] -= 0.01;
      } else {
        const time = ages[i];
        const flowT = time * flowFreqs[i] + phases[i];
        const flowAmp = flowAmps[i] + turbulences[i];
        const flowX = Math.sin(flowT) * flowAmp;
        const flowZ = Math.cos(flowT * 1.17) * flowAmp;
        const flowY = Math.sin(flowT * 0.72) * flowAmp * 0.28;
        const riseRamp = smoothstep(0.14, 0.48, lifeT);
        const turbulenceFade = 1.0 - smoothstep(0.24, 0.64, lifeT);
        const verticalTurbulenceFade = 1.0 - smoothstep(0.18, 0.45, lifeT);
        const lateralDrag = THREE.MathUtils.lerp(drags[i], drags[i] * 0.82, smoothstep(0.35, 0.85, lifeT));
        const minRise = THREE.MathUtils.lerp(0.003, 0.038, riseRamp);
        const phaseTurbulenceScale = lifeT >= 0.5 ? 0.7 : 1.0;

        const swirlStrength = swirls[i] * 2.1;
        const swirlX = -positions[i3 + 2] * swirlStrength;
        const swirlZ = positions[i3] * swirlStrength;

        velocities[i3] *= lateralDrag;
        velocities[i3 + 2] *= lateralDrag;
        velocities[i3 + 1] *= 0.985;

        velocities[i3] += (flowX + swirlX) * turbulenceFade * phaseTurbulenceScale;
        velocities[i3 + 1] += Math.max(flowY, -0.001) * verticalTurbulenceFade;
        velocities[i3 + 2] += (flowZ + swirlZ) * turbulenceFade * phaseTurbulenceScale;
        velocities[i3 + 1] += buoyancies[i] * riseRamp * 1.12;
        if (velocities[i3 + 1] < 0) {
          velocities[i3 + 1] += buoyancies[i] * 1.6;
        }
        velocities[i3 + 1] = Math.max(velocities[i3 + 1], minRise);
        if (lifeT > 0.45) {
          velocities[i3 + 1] = Math.max(velocities[i3 + 1], 0.012);
        }
      }

      positions[i3] += velocities[i3] * dt;
      positions[i3 + 1] += velocities[i3 + 1] * dt;
      positions[i3 + 2] += velocities[i3 + 2] * dt;

      sizes[i] = baseSizes[i];
      alphas[i] = generatedOpacityRef.current * smoothstep(0.0, PARTICLE_FADE_IN_END, lifeT) * (1.0 - smoothstep(PARTICLE_FADE_OUT_START, PARTICLE_FADE_OUT_END, lifeT));

      if (i < 3) {
        logger.debug('[fade timing]', i, {
          t: lifeT,
          alpha: alphas[i],
        });
      }
    }

    activeCountRef.current = activeCount;
    logger.debug('[particles]', {
      activeBefore,
      expiredThisFrame,
      activeAfter: activeCount,
    });

    geometry.setDrawRange(0, activeCount);
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.aAlpha.needsUpdate = true;
    geometry.attributes.aSize.needsUpdate = true;
    // The per-particle shimmer attributes are static per spawn, but the expiry
    // swap above reorders them — re-upload only on frames where that happened.
    if (expiredThisFrame > 0) {
      geometry.attributes.aShimmerPhase.needsUpdate = true;
      geometry.attributes.aShimmerRate.needsUpdate = true;
    }
  });

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      material={material}
      position={emitterPosition}
      renderOrder={5}
    />
  );
};

export default FractureBurstParticles;
