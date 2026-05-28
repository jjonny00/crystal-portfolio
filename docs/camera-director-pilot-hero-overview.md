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

## PR-16 legacy handoff finding (filmOffset)
- Legacy forced hero→overview branch used shared explosion-clock eased progress directly for filmOffset lerp.
- Near completion, shared clock progress can regress/reset while forced transition is still active, causing filmOffset to jump back toward hero value.
- Mitigation added in legacy branch: monotonic clamp for shared-eased progress used by filmOffset lerp, plus forced final/handoff filmOffset normalization to transition destination.
- This is a targeted handoff stabilization fix; pilot still does not own the route.

## PR-17 timeline diagnosis pivot
- Final handoff seam patches (filmOffset, early lock, seeded refs) reduced specific snaps but did not remove the user-visible refire.
- Current working hypothesis: broader timeline/state/composition mismatch, potentially while `state/cameraState` are already `overview` but forced writer remains active.
- Added bounded full-route timeline diagnostics (`__printHeroOverviewFullTimeline`) plus manual marker helper (`__markHeroOverviewVisualIssue`) to identify the exact discontinuity frame before further runtime patching.
- Do not continue Hero→Overview handoff patching until timeline evidence identifies the first true visual discontinuity frame and branch cause.
