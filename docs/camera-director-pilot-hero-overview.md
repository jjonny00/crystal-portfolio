# CameraDirector Pilot: hero → overview (stabilization scaffold)

## Scope
- Add bounded DEV diagnostics for hero → overview ownership/handoff analysis.
- Add disabled-by-default CameraDirector pilot scaffold for hero → overview intent capture.
- Keep legacy hero → overview runtime path authoritative.

## Feature flag
- Env: `VITE_CAMERA_DIRECTOR_HERO_OVERVIEW_PILOT` (default `false`).
- DEV override: `globalThis.__ENABLE_CAMERA_DIRECTOR_HERO_OVERVIEW__ = true`.
- Diagnostics toggle: `globalThis.__HERO_OVERVIEW_PILOT_DIAGNOSTICS__ = true`.

## Non-goals
- No explosion timing or style tuning.
- No fragments/particles/glow/ring/material changes.
- No About route fixes.
- No replacement of the legacy forced hero → overview branch.

## Known issues intentionally retained
- Existing hero → overview end blip may still occur.
- About-related camera bugs remain out of scope.

## Current ownership map (hero → overview)
- Intent originates from scroll/top-nav via controller/coordinator.
- Shared runtime/explosion clock participates in camera phase timing.
- `UnifiedCameraController` forced hero→overview branch writes camera.
- Handoff lock frames and first-normal-frame checks handle seam to overview branch.

## Likely blip seam
- Forced-final frame to normal overview ownership boundary.
- Completion/handoff may evaluate one timing surface while pose writes are influenced by another.

## Diagnostic strategy
- DEV-only bounded logs for hero→overview intent and scaffold capture.
- Existing trace buffers remain primary evidence source for handoff windows.
- New global helpers:
  - `__clearHeroOverviewDiagnosticSamples()`
  - `__printHeroOverviewDiagnosticSummary()`
  - `__printHeroOverviewDiagnosticSamples()`

## Start-capture strategy (scaffold)
- Capture from live camera transform:
  - `fromPose.position = camera.position.clone()`
  - `fromPose.lookAt = camera.getWorldDirection(...) + camera.position`
- Capture current lens values from live camera.

## Target-pose strategy (scaffold)
- Resolve overview target through destination resolver for parity baselining.
- Keep as diagnostic scaffold only; no ownership handoff yet.

## False-start blocking (scaffold)
Block scaffold start if any are active:
- another CameraDirector pilot
- `fractureTiltActiveRef.current`
- `heroExplosionTransitionRef.current.active`
- `authoritativeHeroToOverviewTransitionRef.current.active`
- `cameraMoveProgressRef.current < 0.999`

## Duplicate-start guard
- Transition key: `hero-to-overview:${prevState}:${prevCameraState}->${nextState}:${nextCameraState}`
- One intent edge records one scaffold capture.

## Why explosion tuning is deferred
- Ownership and handoff instrumentation must be stabilized first.
- Tuning explosion choreography before stable ownership boundaries would mask root causes.

## Recommended test checklist
1. Flag off baseline: verify unchanged behavior and no new errors.
2. Diagnostics-on run: trigger slow/fast hero→overview and inspect summary/samples.
3. Pilot-flag-on smoke: verify scaffold logs once per intent and no route regressions.
