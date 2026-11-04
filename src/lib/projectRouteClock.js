// src/lib/projectRouteClock.js
//
// The project move running now (config/projectRouteTiming.js): which route,
// for which project, and when it started (performance.now ms). Published by the
// camera the moment the move's target is set; read by the copy and labels that
// come in during it, and by the scene to turn the fragment in step with it.
// Null when no such move is running (one cut short is cleared).

import { PROJECT_ROUTES } from '../config/projectRouteTiming';

let current = null;
const listeners = new Set();

export const markProjectRouteMove = (move) => {
  current = move
    ? { route: move.route, projectId: move.projectId ?? null, startedAt: move.startedAt, durationMs: move.durationMs }
    : null;
  listeners.forEach((listener) => listener());
};

export const getProjectRouteMove = () => current;

export const subscribeProjectRouteMove = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const matching = (route, projectId) =>
  current &&
  current.route === route &&
  (projectId == null || current.projectId == null || current.projectId === projectId)
    ? current
    : null;

/**
 * Milliseconds from now until `route` (for `projectId`, if given) reaches its
 * copy's entry point (PROJECT_ROUTES[route].contentAt), never negative; null
 * when that move is not the one running.
 */
export const msUntilProjectRouteContent = (route, projectId = null) => {
  const move = matching(route, projectId);
  if (!move) return null;
  const at = move.startedAt + move.durationMs * PROJECT_ROUTES[route].contentAt;
  return Math.max(0, at - performance.now());
};

/** The running `route`'s dolly progress (0–1, eased), or null if it is not running. */
export const projectRouteProgress = (route, projectId = null) => {
  const move = matching(route, projectId);
  if (!move) return null;
  const u = (performance.now() - move.startedAt) / move.durationMs;
  return PROJECT_ROUTES[route].dollyEase(Math.min(1, Math.max(0, u)));
};
