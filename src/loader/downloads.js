// src/loader/downloads.js
//
// Every byte the first screen needs, counted as it arrives. Free of three.js so
// main.jsx can start it before the app chunk lands.
//
// Two groups, two rings:
//   boot    the app chunk and the files every tier needs, all started at boot:
//           the "Loading portfolio" ring
//   tiered  the files the device test chooses (which crystal mesh, which HDRI):
//           part of the "Preparing scene" ring, since they can't start until the
//           test is done and they are specific to this device
//
// Files are fetched once, here, and handed to three's loaders through THREE.Cache
// (src/loader/threeCache.js), so the scene parses these exact bytes instead of
// requesting them again.

import { updateDownloads } from './loadProgress';

/* global __LOADER_ASSET_BYTES__ */
// Byte size of every file the loader can request, read from public/ when the
// build starts (vite.config.js). Knowing sizes up front is what lets a ring show
// a real fraction from the first byte instead of a count of files.
const ASSET_BYTES = typeof __LOADER_ASSET_BYTES__ === 'object' ? __LOADER_ASSET_BYTES__ : {};

// url -> { group, expected, loaded, wire, done }. `expected` and `loaded` are
// decoded bytes (what a fetch body reads); `wire` is what crosses the network,
// which is what the time goes on. They differ only for compressed responses (the
// app chunk); for the scene's binary files `wire` is just `expected`.
const items = new Map();
const results = new Map(); // url -> Promise<{ buffer, contentType } | null>
let tieredComplete = false; // every tiered file has been requested

// Throughput, measured over the time any fetch is in flight (idle gaps, like the
// device test, would otherwise read as a slow connection). The loader's
// percentage weights each stage by how long it should take, and for downloads
// that is bytes left over this.
let inFlight = 0;
let activeSince = 0;
let activeMs = 0;
let bytesReceived = 0;

const bytesPerMs = () => {
  const ms = activeMs + (inFlight > 0 ? performance.now() - activeSince : 0);
  // Too little to go on until ~64KB has arrived.
  return bytesReceived > 65536 && ms > 0 ? bytesReceived / ms : null;
};

const fetchStarted = () => {
  if (inFlight === 0) activeSince = performance.now();
  inFlight += 1;
};

const fetchEnded = () => {
  inFlight -= 1;
  if (inFlight === 0) activeMs += performance.now() - activeSince;
};

const wireOf = (item) => item.wire ?? item.expected;

function sum(group) {
  let wire = 0;
  let loadedWire = 0;
  let count = 0;
  let done = true;
  items.forEach((item) => {
    if (item.group !== group) return;
    count += 1;
    const itemWire = wireOf(item);
    wire += itemWire;
    if (item.expected > 0) loadedWire += itemWire * Math.min(item.loaded / item.expected, 1);
    if (!item.done) done = false;
  });
  return { progress: wire > 0 ? loadedWire / wire : 0, done: count > 0 && done, bytes: wire };
}

function publish() {
  const tiered = sum('tiered');
  updateDownloads({
    boot: sum('boot'),
    tiered: { ...tiered, done: tieredComplete && tiered.done },
    bytesPerMs: bytesPerMs(),
  });
}

function setItem(id, patch) {
  const prev = items.get(id) || { group: 'boot', expected: 0, loaded: 0, done: false };
  items.set(id, { ...prev, ...patch });
  publish();
}

async function fetchWithProgress(url, priority, wireRatio, onBytes) {
  fetchStarted();
  try {
    return await readWithProgress(url, priority, wireRatio, onBytes);
  } finally {
    fetchEnded();
  }
}

async function readWithProgress(url, priority, wireRatio, onBytes) {
  const response = await fetch(url, { priority });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const contentType = response.headers.get('content-type') || '';

  if (!response.body?.getReader) {
    const buffer = await response.arrayBuffer();
    bytesReceived += buffer.byteLength * wireRatio;
    onBytes(buffer.byteLength);
    return { buffer, contentType };
  }

  const reader = response.body.getReader();
  const chunks = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.byteLength;
    bytesReceived += value.byteLength * wireRatio;
    onBytes(received);
  }

  const bytes = new Uint8Array(received);
  let offset = 0;
  chunks.forEach((chunk) => {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  });
  return { buffer: bytes.buffer, contentType };
}

/**
 * Download `url` once, counting its bytes toward its group's ring. Resolves with
 * the bytes, or null on failure — the scene's own loader then fetches it as
 * before, so a failed preload costs time, never correctness.
 */
export function download(url, {
  priority = 'auto',
  group = 'boot',
  after = null,
  // For a file not in the size table (the app chunk): its decoded size, and what
  // it weighs on the wire if that differs.
  expectedBytes = null,
  wireBytes = null,
  // False for a file only fetched to be counted (the app chunk, which the import
  // then reads from the HTTP cache): don't hold on to its bytes.
  keep = true,
} = {}) {
  if (results.has(url)) return results.get(url);

  const expected = expectedBytes || ASSET_BYTES[url] || 0;
  const wire = wireBytes || null;
  const wireRatio = wire && expected ? wire / expected : 1;

  // Counted from now even when the fetch waits (`after`), so the ring's total is
  // right from the start rather than growing when the fetch begins.
  setItem(url, { group, expected, wire, loaded: 0, done: false });

  const promise = Promise.resolve(after).then(() => fetchWithProgress(url, priority, wireRatio, (received) => {
    const item = items.get(url);
    // A file missing from the size table (or larger than it said) grows the total
    // as it arrives; the ring holds rather than running backwards.
    setItem(url, { loaded: received, expected: Math.max(item?.expected || 0, received) });
  }))
    .then((result) => {
      setItem(url, { loaded: items.get(url).expected, done: true });
      return keep ? result : null;
    })
    .catch((error) => {
      if (import.meta.env.DEV) console.warn(`[loader] download failed: ${url}`, error);
      setItem(url, { loaded: items.get(url)?.expected || 0, done: true });
      return null;
    });

  results.set(url, promise);
  return promise;
}

/** The bytes for `url`, if it was downloaded (or is downloading) here. */
export const getDownload = (url) => results.get(url) || Promise.resolve(null);

/** Every tiered file is requested: that part of the scene ring completes with them. */
export function completeTieredRequests() {
  tieredComplete = true;
  publish();
}
