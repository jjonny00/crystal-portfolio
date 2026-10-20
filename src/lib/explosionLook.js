// src/lib/explosionLook.js
//
// How strongly each of the hero → overview explosion's effects shows:
// HERO_OVERVIEW_CINEMATIC_CONFIG.look, one { enabled, intensity } per effect,
// `intensity` multiplying the effect's own brightness (1 = as it was before the
// clarity pass). In DEV, globalThis.__EXPLOSION_LOOK__ overrides it live, for
// comparing effects side by side:
//
//   globalThis.__EXPLOSION_LOOK__ = { smoke: { enabled: false } }
//   globalThis.__EXPLOSION_LOOK__ = { bloom: { intensity: 0.5 }, halo: { intensity: 0 } }
//   globalThis.__EXPLOSION_LOOK__ = 'previous'   // every effect at 1
//
// Read every frame by the effects, so a change shows on the next explosion (or
// at once, for one already running).

import { HERO_OVERVIEW_CINEMATIC_CONFIG } from '../config/heroOverviewCinematicConfig';
import { getExplosionEnvelope } from './explosionTime';

const FULL = Object.freeze({ enabled: true, intensity: 1 });

/** { enabled, intensity } for the effect `name` (see HERO_OVERVIEW_CINEMATIC_CONFIG.look). */
export const getExplosionLook = (name) => {
  const configured = HERO_OVERVIEW_CINEMATIC_CONFIG.look?.[name] ?? FULL;
  if (!import.meta.env.DEV) return configured;
  const override = globalThis.__EXPLOSION_LOOK__;
  if (override === 'previous') return FULL;
  const live = override?.[name];
  return live ? { ...configured, ...live } : configured;
};

/** The effect's brightness multiplier: its intensity, or 0 when it is off. */
export const getExplosionLookScale = (name) => {
  const look = getExplosionLook(name);
  return look.enabled === false ? 0 : Math.max(0, Number.isFinite(look.intensity) ? look.intensity : 1);
};

/**
 * For effects that also belong to the scene at rest (the bloom, the halo and the
 * glow behind the index): their look multiplier only while the explosion plays.
 * Full for the impact, the look's share from the moment time collapses through
 * the orbit, back to full as the camera lands (lib/explosionTime's envelope),
 * so the index keeps its designed glow. Off (enabled: false) is off throughout.
 */
export const getExplosionLookBlend = (name, { fromSplit = false } = {}) => {
  const look = getExplosionLook(name);
  if (look.enabled === false) return 0;
  return 1 + (getExplosionLookScale(name) - 1) * getExplosionEnvelope(performance.now(), { fromSplit });
};
