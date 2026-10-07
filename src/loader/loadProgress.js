// src/loader/loadProgress.js
//
// What the loader shows, measured rather than simulated. Three stages, one ring
// each, and each one tracks real work:
//
//   download  "Loading portfolio"         bytes of the app code and of the files
//                                         every tier needs (src/loader/downloads.js)
//   device    "Tuning for your device"    the performance test that picks the
//                                         quality tier (usePerformanceV2)
//   scene     "Preparing scene"           bytes of the files the test chose, then
//                                         the scene mounted behind the loader:
//                                         parsing, materials, shader compile and
//                                         first frames (markScenePrep below)
//
// The percentage is weighted by time, not by stage: each part counts for as long
// as it should take. Downloads by bytes over the measured throughput, the device
// test by its known length (nothing, when its result is cached), and preparing
// the scene by how long that typically takes. A stage that is over in an instant
// — every download, on a fast connection — barely moves it.
//
// A plain module store (no React, no three.js) because several places write to
// it — the boot code in main.jsx before the app chunk exists, App, and components
// inside the canvas — and the loader reads it.

const STAGES = ['download', 'device', 'scene'];

// Until enough has downloaded to measure: 10 Mbps.
const DEFAULT_BYTES_PER_MS = 1250;
// The device test: setting up its scene, then a 2.5s run at the medium tier, and
// another 2.5s at the high tier when medium passes (PerformanceManagerV2).
const DEVICE_TEST_MS = 3000;
const DEVICE_TEST_WITH_HIGH_MS = 5500;
// Mounting the scene and getting it to its first real frames, on a typical
// machine: parsing, materials, the warmup compile.
const SCENE_PREP_MS = 1500;

// Steps of preparing the scene, as shares of SCENE_PREP_MS. `resolved` is the
// big one: the canvas's Suspense boundary resolving means every model, the HDRI
// and the textures are parsed. `warmup` is the shader compile (SceneWarmup).
const SCENE_STEPS = {
  canvas: 0.1,
  resolved: 0.5,
  materials: 0.15,
  warmup: 0.15,
  frames: 0.1,
};

const listeners = new Set();
const sceneStepsDone = new Set();

const downloads = {
  boot: { progress: 0, done: false, bytes: 0 },
  tiered: { progress: 0, done: false, bytes: 0 },
  bytesPerMs: null,
};
// Before the tier is known: what its files probably weigh, and whether the test
// will run at all (a cached result skips it). Set at boot (sceneAssets.js).
const expectations = { tieredBytes: 0, deviceTestRuns: true };
// When the device test started and finished: once it has run, it counts for as long
// as it actually took. A device that fails it early is done in a fraction of
// DEVICE_TEST_MS, and weighting it at the estimate would make the percentage jump.
const deviceTiming = { startedAt: null, endedAt: null };
// The app's code, when it can't be fetched as one file with progress: a dev
// server serves it as hundreds of modules (src/loader/devModuleProgress.js).
// Part of the first ring, weighted by how long it is expected to take. In a
// build the app chunk is an ordinary download instead and this stays unused.
const code = { registered: false, progress: 0, expectedMs: 0, done: false };

let state = {
  download: { started: false, done: false, progress: 0 },
  device: { started: false, done: false, progress: 0 },
  scene: { started: false, done: false, progress: 0 },
};
let overall = 0;
// Whether the loader is on screen, and whether it is on its way out. App owns
// these; the loader itself is mounted once, outside App (main.jsx), so it reads
// them here rather than as props.
let presentation = { shown: true, exiting: false };
let snapshot = buildSnapshot();

const stepsProgress = () =>
  [...sceneStepsDone].reduce((total, step) => total + SCENE_STEPS[step], 0);

// How long each part should take, in ms, from what is known so far.
function durations() {
  const bytesPerMs = downloads.bytesPerMs || DEFAULT_BYTES_PER_MS;
  const tieredBytes = downloads.tiered.bytes || expectations.tieredBytes;
  let device = 0;
  if (expectations.deviceTestRuns) {
    const estimate = state.device.progress > 0.5 ? DEVICE_TEST_WITH_HIGH_MS : DEVICE_TEST_MS;
    const { startedAt, endedAt } = deviceTiming;
    if (endedAt !== null && startedAt !== null) device = endedAt - startedAt;
    else if (startedAt !== null) device = Math.max(estimate, performance.now() - startedAt);
    else device = estimate;
  }
  return {
    files: downloads.boot.bytes / bytesPerMs,
    code: code.registered ? code.expectedMs : 0,
    get boot() { return this.files + this.code; },
    device,
    tiered: tieredBytes / bytesPerMs,
    prep: SCENE_PREP_MS,
  };
}

function buildSnapshot() {
  const complete = STAGES.every((stage) => state[stage].done);

  // The stage the copy names: the one the visitor is waiting on. The device test
  // runs while boot downloads continue around it, and the scene can only be
  // prepared once both are done.
  let activeStage = 'scene';
  if (state.device.started && !state.device.done) activeStage = 'device';
  else if (!state.download.done) activeStage = 'download';
  else if (!state.device.done) activeStage = 'device';

  return { ...state, overall, complete, activeStage, presentation };
}

function emit() {
  snapshot = buildSnapshot();
  listeners.forEach((listener) => listener());
}

// Weight every part by its duration. Never backwards: when an estimate grows
// (the connection turns out slower, the high-tier test runs), the percentage
// holds until the work catches up rather than dropping.
function recomputeOverall() {
  if (STAGES.every((stage) => state[stage].done)) {
    overall = 1;
    return;
  }
  const d = durations();
  const sceneDownload = downloads.tiered.done ? 1 : downloads.tiered.progress;
  const done =
    d.boot * state.download.progress +
    d.device * state.device.progress +
    d.tiered * sceneDownload +
    d.prep * stepsProgress();
  const total = d.boot + d.device + d.tiered + d.prep;
  overall = Math.max(overall, total > 0 ? Math.min(1, done / total) : 0);
}

function setStage(stage, patch) {
  const prev = state[stage];
  const progress = patch.done
    ? 1
    : Math.max(prev.progress, Math.min(1, Math.max(0, patch.progress ?? prev.progress)));
  state = {
    ...state,
    [stage]: {
      started: prev.started || Boolean(patch.started) || Boolean(patch.done) || progress > 0,
      done: prev.done || Boolean(patch.done),
      progress,
    },
  };
}

function commit() {
  recomputeOverall();
  emit();
}

/** Update a stage directly (the device test). Progress never goes backwards. */
export function updateStage(stage, patch) {
  setStage(stage, patch);
  if (stage === 'device') {
    const now = performance.now();
    if (state.device.started && deviceTiming.startedAt === null) deviceTiming.startedAt = now;
    if (state.device.done && deviceTiming.endedAt === null) deviceTiming.endedAt = now;
  }
  commit();
}

// The scene ring, like the percentage, splits its two parts by time: the tier's
// files over the measured throughput, then preparing the scene.
function setSceneStage() {
  const d = durations();
  const sceneDownload = downloads.tiered.done ? 1 : downloads.tiered.progress;
  const allSteps = Object.keys(SCENE_STEPS).every((step) => sceneStepsDone.has(step));
  setStage('scene', {
    progress: (d.tiered * sceneDownload + d.prep * stepsProgress()) / (d.tiered + d.prep),
    done: downloads.tiered.done && allSteps,
  });
}

/** Byte counts and throughput from downloads.js. */
// The first ring: the boot files and (in dev) the app's modules, split by time.
function setDownloadStage() {
  const d = durations();
  const total = d.files + d.code;
  const progress = total > 0
    ? (d.files * downloads.boot.progress + d.code * code.progress) / total
    : downloads.boot.progress;
  setStage('download', {
    started: true,
    progress,
    done: downloads.boot.done && (!code.registered || code.done),
  });
}

export function updateDownloads({ boot, tiered, bytesPerMs }) {
  downloads.boot = boot;
  downloads.tiered = tiered;
  if (bytesPerMs) downloads.bytesPerMs = bytesPerMs;
  setDownloadStage();
  setSceneStage();
  commit();
}

/** The app's modules arriving on a dev server (devModuleProgress.js). */
export function updateCode({ progress, expectedMs, done }) {
  code.registered = true;
  code.progress = done ? 1 : Math.max(code.progress, progress);
  code.expectedMs = expectedMs;
  code.done = code.done || done;
  setDownloadStage();
  commit();
}

/** What boot can tell before the tier is known (sceneAssets.js). */
export function setLoadExpectations({ tieredBytes, deviceTestRuns }) {
  expectations.tieredBytes = tieredBytes;
  expectations.deviceTestRuns = deviceTestRuns;
  commit();
}

/** Record one step of preparing the scene (see SCENE_STEPS). Repeats are ignored. */
export function markScenePrep(step) {
  if (!(step in SCENE_STEPS) || sceneStepsDone.has(step)) return;
  sceneStepsDone.add(step);
  setSceneStage();
  commit();
}

/** Give up waiting on the scene's steps (App's safety timeout). */
export function forceSceneDone() {
  updateStage('scene', { done: true });
}

export function setLoaderPresentation(patch) {
  const next = { ...presentation, ...patch };
  if (next.shown === presentation.shown && next.exiting === presentation.exiting) return;
  presentation = next;
  emit();
}

export const subscribeLoadProgress = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getLoadProgress = () => snapshot;
