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

## Milestone B owning pilot status
- Milestone B is flag-on only and remains disabled by default via `VITE_CAMERA_DIRECTOR_HERO_OVERVIEW_PILOT=false` / unset `__ENABLE_CAMERA_DIRECTOR_HERO_OVERVIEW__`.
- When enabled and scaffold capture resolves an overview target, `ownsCameraInMilestoneB: true` and the pilot writes the camera every active frame.
- The pilot blocks the legacy forced Hero→Overview writer by:
  - skipping new forced-route initialization while the pilot is active,
  - clearing `authoritativeHeroToOverviewTransitionRef.current.active` if legacy forced ownership is observed during pilot frames,
  - early-returning after pilot writes so generic fallback/transition writers do not run on active pilot frames.
- Baseline parity source: shared runtime/explosion progress clamped by elapsed local progress, using the existing exponential-out camera interpolation from live `fromPose` to resolved overview `toPose`.
- No phase hold, cinematic improvement, explosion timing change, or visual polish is included in Milestone B.
- Completion writes the exact resolved overview pose, seeds `currentTarget` / `previousFramePose`, marks camera progress settled, and applies the existing short handoff lock.
- Pilot diagnostics now report `ownsCameraInMilestoneB`, `legacyForcedWriterBlocked`, `blockedLegacyWriterCount`, `distanceToTarget`, target deltas, completion status, and whether any competing writer was detected.

## PR-22 Milestone B parity correction
- Milestone B remains flag-on only and disabled by default; flag-off legacy Hero → Overview behavior is unchanged.
- Browser diagnostics showed the first owning-pilot pass was using the generic destination resolver for the pilot target during Hero → Overview capture. In the observed route shape, that resolver could inherit hero-biased lens/composition values (`fov: 32`, `filmOffset: 9`) even though the legacy forced Hero → Overview final pose normalizes to the overview composition.
- The Milestone B pilot target now uses the proven legacy Hero → Overview final pose for parity: overview camera position/target from `cameraPositions.overview` and `cameraTargets.overview` plus offsets, overview FOV from the overview camera config (`44`), and `filmOffset: 0` from the legacy forced branch's final target.
- The generic resolver overview pose is still captured in diagnostics for comparison, but it is not used as the owning-pilot target when it carries stale hero lens/composition values.
- Diagnostics also showed pilot camera progress could reset mid-run when the shared/explosion progress source regressed while elapsed wall-clock progress continued. The pilot now keeps a monotonic run-level camera interpolation progress (`monotonicGlobalProgress`) and records the source values separately.
- `__printHeroOverviewPilotSamples()` now includes flattened camera/from/target vector fields so parity rows are readable without expanding console objects.
- New helper: `__printHeroOverviewPilotParity()` compares pilot from/to poses, the proven legacy overview final pose, the resolver overview pose, and the current final camera pose with position/lookAt/FOV/filmOffset deltas.

## PR-23 active-pilot wiring guardrails
- Follow-up browser output still showed `targetFov: 32`, `targetFilmOffset: 9`, and non-monotonic `globalProgress`, which means the active camera-write path needed stronger proof fields and runtime correction rather than only capture-time target selection.
- The active Milestone B writer now revalidates `transition.toPose` on every pilot write. If a stale resolver/current-target pose reaches the active writer, it is replaced before camera writes with `hero-overview-legacy-final-pose` (`fov: 44`, `filmOffset: 0`) and diagnostics record `targetWasOverwritten` plus `targetOverwriteReason`.
- Active pilot samples now distinguish the target used for camera writes from resolver/debug targets with `activeToPoseSource`, `activeToPoseFov`, `activeToPoseFilmOffset`, `cameraWriteTargetSource`, `diagnosticTargetSource`, and `completionTargetSource`.
- Active pilot samples also distinguish raw progress candidates from write progress with `progressSourceUsedForCameraWrite`, `rawProgressCandidate`, `previousMonotonicGlobalProgress`, `globalProgressPrintedSource`, `progressWentBackwards`, and `progressWasClampedToMonotonic`.
- DEV warning: if the active writer encounters a stale non-legacy target, it logs a one-time correction warning with previous and corrected FOV/filmOffset values. The warning does not crash or change flag-off behavior.

## PR-24 orientation / roll guard
- Follow-up flag-on testing showed the owning pilot target/progress path was smooth, but a narrow end tilt/roll remained.
- The likely cause is inherited `camera.up`: Three.js `camera.lookAt()` uses the current `camera.up`, so a stale rolled up vector can survive otherwise-correct position/lookAt/fov/filmOffset writes.
- The active Hero → Overview pilot now normalizes `camera.up` to canonical world/overview up (`0, 1, 0`) before pilot `lookAt()` writes, on the exact completion write, and during the handoff-lock frames.
- Completion now seeds `currentTarget.up`, `previousFramePose.up`, `previousFramePose.quaternion`, and handoff-pending `finalUp`/`finalQuaternion` so the first normal overview frames inherit the same non-rolled basis.
- New helper: `__printHeroOverviewPilotOrientation()` summarizes up/roll deltas, start/completion/handoff up vectors, whether up changed during the pilot, and whether completion restored canonical overview up.
