// src/camera/projectRouteMove.js
//
// One of the timed project moves (config/projectRouteTiming.js): from the live
// camera to the route's target, the position on the route's dolly ease and the
// look target and lens on its framing ease. A camera that is already moving
// when the move starts (a new destination picked mid-flight) carries that
// motion in, so it is turned rather than stopped dead or snapped. The carry is
// u(1−u)⁵ rather than the hero return's u(1−u)²: the same speed at the start,
// but spent in the first ~15% of the move, so a camera heading for one fragment
// turns towards the next without running on into the fragments between them
// (u(1−u)² let ~0.15 of the move's time at the old speed run on).
const CARRY_POWER = 5;

import * as THREE from 'three';
import { PROJECT_ROUTES } from '../config/projectRouteTiming';

export const createProjectRouteMove = ({
  route,
  projectId = null,
  from,
  to,
  velocity,
  lookVelocity,
  startedAt,
  durationMs = PROJECT_ROUTES[route].durationMs,
}) => ({
  route,
  projectId,
  startedAt,
  durationMs,
  from: { position: from.position.clone(), lookAt: from.lookAt.clone(), fov: from.fov },
  to: { position: to.position.clone(), lookAt: to.lookAt.clone(), fov: to.fov },
  velocity: velocity.clone(),
  lookVelocity: lookVelocity.clone(),
});

/**
 * Writes the move's pose at `nowMs` into `out` ({ position, lookAt, fov }).
 * Returns the time share `u`, the dolly's eased progress, and whether it is done.
 */
export const sampleProjectRouteMove = (move, nowMs, out) => {
  const timing = PROJECT_ROUTES[move.route];
  const u = THREE.MathUtils.clamp((nowMs - move.startedAt) / move.durationMs, 0, 1);
  const dolly = timing.dollyEase(u);
  const framing = timing.framingEase(u);
  const carry = (move.durationMs / 1000) * u * (1 - u) ** CARRY_POWER;
  out.position
    .lerpVectors(move.from.position, move.to.position, dolly)
    .addScaledVector(move.velocity, carry);
  out.lookAt
    .lerpVectors(move.from.lookAt, move.to.lookAt, framing)
    .addScaledVector(move.lookVelocity, carry);
  out.fov = THREE.MathUtils.lerp(move.from.fov, move.to.fov, framing);
  return { u, dolly, done: u >= 1 };
};
