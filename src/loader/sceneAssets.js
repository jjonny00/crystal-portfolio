// src/loader/sceneAssets.js
//
// The files the scene loads on mount, and when the loader starts each one.
// Every URL here must be the one the scene's own loader asks for (useGLTF,
// useTexture, drei's <Environment>, CrystalMaterial's TextureLoader), or the
// download is wasted and the scene fetches its file again.

import {
  CRYSTAL_NORMAL_MAP,
  DUST_TEXTURE,
  FRACTURE_RAYS_MODEL,
  FRACTURE_RING_TEXTURE,
  GLOW_SPHERE_TEXTURE,
  MIST_TEXTURE,
  PROJECT_MODEL_KEYS,
  WIZARD_SMOKE_TEXTURE,
  crystalWholePathForTier,
  hdriPathForTier,
  projectModelPathForTier,
} from '../config/assetPaths';
import { PERFORMANCE_PROFILES } from '../utils/deviceProfiles';
import { readValidCachedTier } from '../utils/performanceCache';
import { completeTieredRequests, download } from './downloads';
import { setLoadExpectations } from './loadProgress';

// Needed on every tier.
export const SHARED_SCENE_ASSETS = [
  FRACTURE_RING_TEXTURE,
  GLOW_SPHERE_TEXTURE,
  WIZARD_SMOKE_TEXTURE,
  FRACTURE_RAYS_MODEL,
  MIST_TEXTURE,
  DUST_TEXTURE,
];

// Chosen by the performance profile. The HDRI default matches App's
// getOptimalEnvironmentProps, which is what the scene's <Environment> loads.
export const tieredSceneAssets = (profile) => [
  crystalWholePathForTier(profile.pbrQuality),
  ...PROJECT_MODEL_KEYS.map((key) => projectModelPathForTier(key, profile.pbrQuality)),
  ...(profile.useNormalMaps ? [CRYSTAL_NORMAL_MAP] : []),
  hdriPathForTier(profile.hdriQuality || 'medium'),
];

// Files every profile asks for whatever the test decides (today, the normal map):
// as safe to start at boot as the shared set, and the biggest of them is the
// largest single file the scene loads.
const EVERY_TIER_ASSETS = Object.values(PERFORMANCE_PROFILES)
  .map((profile) => tieredSceneAssets(profile))
  .reduce((common, urls) => common.filter((url) => urls.includes(url)));

// Low priority: at boot these share the connection with the app chunk, which is
// what everything else is waiting on.
const BOOT_PRIORITY = 'low';

const tierOnly = (profile) =>
  tieredSceneAssets(profile).filter((url) => !EVERY_TIER_ASSETS.includes(url));

/* global __LOADER_ASSET_BYTES__ */
const sizeOf = (url) =>
  (typeof __LOADER_ASSET_BYTES__ === 'object' ? __LOADER_ASSET_BYTES__[url] : 0) || 0;

/**
 * Start what can start before the app chunk arrives: the files every tier needs
 * ("Loading portfolio"). A returning visitor's tier is already known (the
 * performance test is cached), so their tier's files start now too.
 *
 * The fetches themselves wait for `after` — the loader's fonts, which it won't
 * appear without: left to compete with ~2.5MB of scene files for the connection,
 * they arrive seconds later and the loader is blank for most of the load.
 */
export function startBootDownloads({ after = null } = {}) {
  [...SHARED_SCENE_ASSETS, ...EVERY_TIER_ASSETS].forEach((url) => (
    download(url, { priority: BOOT_PRIORITY, group: 'boot', after })
  ));

  const cachedTier = readValidCachedTier();
  const cachedProfile = cachedTier ? PERFORMANCE_PROFILES[cachedTier] : null;

  // For the loader's time-weighted percentage: whether the device test will run,
  // and what the tier's files probably weigh (the medium tier, the usual result,
  // until the test says).
  setLoadExpectations({
    deviceTestRuns: !cachedProfile,
    tieredBytes: tierOnly(cachedProfile || PERFORMANCE_PROFILES.medium)
      .reduce((total, url) => total + sizeOf(url), 0),
  });

  if (cachedProfile) {
    tierOnly(cachedProfile).forEach((url) => (
      download(url, { priority: BOOT_PRIORITY, group: 'tiered', after })
    ));
  }
}

/**
 * The device test has settled the profile: request its files (any already
 * started at boot are reused). Returns every URL the scene will load, for
 * seeding THREE.Cache.
 */
export function requestTieredDownloads(profile) {
  tierOnly(profile).forEach((url) => download(url, { group: 'tiered' }));
  completeTieredRequests();
  return [...SHARED_SCENE_ASSETS, ...tieredSceneAssets(profile)];
}
