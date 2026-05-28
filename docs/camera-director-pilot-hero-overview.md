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

## PR-18 clock-drift stabilization note
- Timeline + clock-drift diagnostics showed shared runtime reaching `complete` while forced camera local progress remained around `0.81`.
- Root cause: forced local progress advanced by clamped frame delta, so under larger frame times it could lag wall-clock/shared runtime completion.
- Narrow fix in legacy forced hero→overview branch: clamp local forced progress to at least elapsed wall-clock progress each frame (`transition.progress = max(transition.progress, elapsedProgress)`).
- This keeps the forced camera completion seam aligned with shared-runtime completion without changing pilot ownership or broad transition logic.

## PR-19 phase-staging diagnosis result
- Attempted: a naive runtime phase gate delayed forced overview travel until `bulletTimeSlowdown` by remapping shared progress inside the legacy forced branch.
- Result: rejected. The transition became visually chaotic, with delayed dolly timing and remaining early horizontal motion.
- Reverted/disabled runtime effect: the forced progress remap and `HERO_OVERVIEW_FORCED_TRAVEL_START_PHASE` behavior were removed so flag-off Hero→Overview returns to the less-chaotic pre-PR-19 baseline.
- Preserved diagnostic value: `__printHeroOverviewPhaseStaging()` remains available to quantify per-phase camera/lookAt/filmOffset movement and overlap.
- Learning: the issue is likely overlapping phase choreography, not only final handoff/refire or clock drift.
- Learning: the legacy forced branch has multiple overlapping motion contributors; simply remapping forced progress is not enough to create clean ownership.
- Direction: avoid further broad patching of the legacy forced branch; next work should be a disabled owning CameraDirector pilot with explicit sub-phases.

## Next Pilot Plan: owning Hero → Overview CameraDirector pilot
The proposed pilot should:
- remain feature-flagged and disabled by default;
- preserve flag-off legacy behavior;
- own the camera only when explicitly enabled;
- use explicit sub-phases:
  1. `fractureCharge`
  2. `explosionImpulse`
  3. `bulletTimeSlowdown`
  4. `overviewTravel`
  5. `overviewSettle`
  6. `complete`
- define the camera owner in each sub-phase;
- define whether camera behavior is hold, tilt, drift, dolly, or settle in each sub-phase;
- start from the real live camera transform where possible instead of stale snapshots;
- use `getCameraLookAtFromTransform` or equivalent live lookAt derivation;
- avoid accidental overlap between forced overview travel and fracture camera effects;
- use one authoritative phase clock for camera choreography;
- keep object/facet explosion timing unchanged initially;
- reproduce baseline first before creative tuning;
- only after baseline parity, tune toward the Overwatch/Sigma-style cinematic goal.

### Milestone A
- Disabled pilot only.
- No visual runtime change with flag off.
- Flag-on path owns the camera through explicit phases.
- Initially reproduce current baseline as closely as possible.
- Include diagnostic comparison against legacy.
- No explosion style polish yet.

## Milestone A scaffold status
- Added an explicit disabled pilot phase model in `UnifiedCameraController`:
  1. `fractureCharge`
  2. `explosionImpulse`
  3. `bulletTimeSlowdown`
  4. `overviewTravel`
  5. `overviewSettle`
  6. `complete`
- Initial phase behavior map is declarative only: hold/capture, baseline-equivalent fracture or hold, controlled handoff, overview interpolation, exact settle, clear ownership.
- Current Milestone A code is scaffold-only: `ownsCameraInMilestoneA: false`; flag-on capture records phase metadata and live/target poses, but does not block legacy writers or write the camera.
- Capture source is the live camera transform (`camera.position.clone()` plus `getCameraLookAtFromTransform()`), not hero snapshots.
- Target source is explicit overview resolution through `resolveCameraDestination`/`getOverviewProjectResolvedPose`, with intentional `filmOffset` from the resolver.
- Pilot diagnostics:
  - `__clearHeroOverviewPilotSamples()`
  - `__printHeroOverviewPilotSummary()`
  - `__printHeroOverviewPilotSamples()`
- Enable smoke test in DEV with `globalThis.__ENABLE_CAMERA_DIRECTOR_HERO_OVERVIEW__ = true`; rollback by setting it to `false` or reloading with the default disabled flag.

## Milestone A capture activation fix
- Initial Milestone A scaffold did not capture in browser because the activation gate expected a narrow state edge (`prevCameraState === 'hero'`, `state === 'overview'`, `cameraState === 'hero'`). The observed route can already be in `state/viewMode: overview` while `cameraState` remains `hero`, or the legacy forced writer can already be active.
- Activation now treats any of these as Hero→Overview scaffold intent when the pilot flag is enabled:
  - the original plain hero→overview edge,
  - observed `state: overview`, `cameraState: hero`, `viewMode: overview`,
  - active legacy forced Hero→Overview route with overview state/viewMode context.
- False-start blocking for the non-owning scaffold is intentionally limited to an already-active CameraDirector pilot; fracture tilt, hero explosion, and legacy forced writer are recorded as observed owners instead of blocking capture.
- Capture diagnostics now record attempted/succeeded status, activation key, observed/previous state fields, phase, duplicate suppression, blocked reason, live fromPose, and resolved overview target.
