# CameraDirector Pilot: hero → overview (stabilization scaffold)

## Scope
- Keep bounded DEV diagnostics for hero → overview ownership/handoff analysis.
- Use the completed owning CameraDirector pilot as the default hero → overview camera path.
- Keep the legacy forced hero → overview runtime path as explicit DEV fallback only.


## Current default status

Hero → Overview now defaults to the owning `HERO_OVERVIEW_PILOT` path. It no longer requires `globalThis.__ENABLE_CAMERA_DIRECTOR_HERO_OVERVIEW__ = true` for normal DEV/runtime verification. The retained legacy forced Hero → Overview branch is fallback-only and can be requested in DEV with:

```js
globalThis.__HERO_OVERVIEW_CAMERA_MODE__ = 'legacy';
```

Reset by assigning `undefined` or reloading. Diagnostics such as `globalThis.__HERO_OVERVIEW_PILOT_DIAGNOSTICS__ = true` remain independent of route selection. The old `__ENABLE_CAMERA_DIRECTOR_HERO_OVERVIEW__` boolean remains accepted only as a DEV compatibility shim.

## Route mode controls
- Default: owning `HERO_OVERVIEW_PILOT` path.
- DEV legacy fallback: `globalThis.__HERO_OVERVIEW_CAMERA_MODE__ = 'legacy'`.
- Optional DEV compatibility shim: `globalThis.__ENABLE_CAMERA_DIRECTOR_HERO_OVERVIEW__ = false` also forces legacy; `true` forces pilot.
- Optional legacy env compatibility shim: explicit `VITE_CAMERA_DIRECTOR_HERO_OVERVIEW_PILOT=true` still forces pilot in DEV builds that define it, but `false`/unset no longer disables the default pilot path. Use `__HERO_OVERVIEW_CAMERA_MODE__ = 'legacy'` for fallback.
- Diagnostics toggle: `globalThis.__HERO_OVERVIEW_PILOT_DIAGNOSTICS__ = true`.

## Non-goals
- No explosion timing or style tuning.
- No fragments/particles/glow/ring/material changes.
- No About route fixes.
- No deletion of the legacy forced hero → overview branch in this PR.

## Known issues intentionally retained
- Legacy fallback Hero → Overview still has the old blip and is not the default.
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

## PR-25 live-lookAt and takeover re-entry guard
- Follow-up testing indicated the remaining end tilt/pop could still come from two older blind spots even after canonical `camera.up` normalization: stale logical lookAt state at handoff, or fracture/explosion camera takeover flags re-entering on the first post-pilot overview frame.
- The owning pilot capture path continues to use the real rendered camera transform for `fromPose`: `camera.position.clone()`, `getCameraLookAtFromTransform()` from `camera.getWorldDirection()`, `camera.fov`, `camera.filmOffset`, and the current `camera.up`. Diagnostics now explicitly report `fromPoseSource: live-camera-transform` and `fromLookAtSource: camera-world-direction` so browser samples prove the pilot did not start from `currentTarget`, `heroExitSnapshot`, or another semantic lookAt fallback.
- At pilot completion, before the normal overview branch can resume, the pilot now clears the legacy fracture/explosion camera takeover flags that previously caused post-handoff tilt/pop regressions: `fractureTiltActiveRef.current = false`, `fractureTiltRef.current = 0`, and `heroExplosionTransitionRef.current.active = false`.
- Completion and handoff diagnostics now record whether fracture/explosion takeover flags were active at completion, whether they were cleared before the first normal overview frame, and whether post-pilot fracture re-entry was detected.
- The canonical-up guard from PR-24 remains in place; PR-25 layers the known-good live-lookAt and takeover-clear protections on top without changing flag-off legacy behavior, object/facet explosion timing, or the pilot's baseline-parity camera curve.

## Milestone C: explicit cinematic camera phase timeline

Milestone C is the first cinematic refinement pass for the flag-on Hero → Overview owning pilot. It does **not** attempt final art direction polish; it only gives the pilot an explicit, tunable camera choreography timeline so future passes can tune the Overwatch / Play-of-the-Game style beat structure without re-opening camera ownership conflicts.

### Flag and rollback safety
- The pilot remains disabled by default.
- Enable only in DEV with `globalThis.__ENABLE_CAMERA_DIRECTOR_HERO_OVERVIEW__ = true` or the existing `VITE_CAMERA_DIRECTOR_HERO_OVERVIEW_PILOT` DEV flag.
- Flag-off behavior still uses the legacy Hero → Overview path.
- Rollback is immediate: turn the flag off and the Milestone C timeline is not used.
- Milestone C keeps the PR-25 guardrails: live from-pose capture, camera-world-direction lookAt capture, `hero-overview-legacy-final-pose` target parity, target `fov: 44`, target `filmOffset: 0`, monotonic pilot progress, canonical up at completion, and fracture/explosion takeover flag clearing.

### Camera phase timeline

The flag-on pilot now owns a dedicated `HERO_OVERVIEW_PILOT_CAMERA_TIMELINE` in `UnifiedCameraController.jsx`:

| Phase | Progress window | Camera mode | Starting behavior |
| --- | ---: | --- | --- |
| `fractureCharge` | `0.00 → 0.16` | `hold` | Hold exact captured live Hero camera pose. |
| `explosionImpulse` | `0.16 → 0.26` | `impactHold` | Hold exact captured live Hero camera pose. |
| `bulletTimeSlowdown` | `0.26 → 0.42` | `suspendedHold` | Hold exact captured live Hero camera pose for the conservative first pass. |
| `overviewTravel` | `0.42 → 0.88` | `travel` | Main camera interpolation to final Overview, using `expoOut`. |
| `overviewSettle` | `0.88 → 1.00` | `settle` | Lock exactly onto final Overview pose, canonical up, `fov: 44`, `filmOffset: 0`. |

This means the camera should no longer dolly toward Overview during the fracture/charge, explosion impulse, or bullet-time slowdown beats. The first intentional travel should begin at pilot global progress `0.42`, inside `overviewTravel`.

### How to tune timing

Adjust only the constants in `HERO_OVERVIEW_PILOT_CAMERA_TIMELINE` for this pass:
- Move `overviewTravel.start` earlier/later to control when the dolly begins.
- Move `overviewTravel.end` to control how long the main travel lasts.
- Move `overviewSettle.start` with `overviewTravel.end` so settle remains the final stabilization window.
- Change `overviewTravel.easing` if a later pass needs a different travel feel.

Keep phase ranges monotonic and contiguous between `0` and `1`. Avoid routing gaps; the owning pilot should write a stable camera pose every frame.

### Diagnostics

Milestone C adds/updates per-frame pilot diagnostics with:
- `pilotCinematicMilestone: "Milestone C"`
- phase metadata: `cameraMode`, `phaseStart`, `phaseEnd`, `phaseLocalProgress`
- camera travel metadata: `cameraTravelProgress`, `cameraTravelEasedProgress`, `cameraTravelEasing`
- hold metadata: `heldCameraPosition`, `heldLookAt`, `isHoldingCamera`, `fovChangedDuringHold`, `filmOffsetChangedDuringHold`
- travel metadata: `firstTravelFrame`, `travelStartTime`, `travelStartProgress`, `travelDuration`, `settleStartProgress`, `finalPoseLocked`
- cumulative per-phase camera movement: `distanceMovedDuringFractureCharge`, `distanceMovedDuringExplosionImpulse`, `distanceMovedDuringBulletTimeSlowdown`, `distanceMovedDuringOverviewTravel`, `distanceMovedDuringOverviewSettle`

New helper:

```js
globalThis.__printHeroOverviewPilotCinematic?.();
```

It summarizes hold phases, first actual travel phase, camera distance moved per phase, whether `fractureCharge` and `explosionImpulse` stayed still, whether travel begins in `overviewTravel`, whether final target parity passes, whether the up/roll guard remains clean, and whether a competing writer appeared.

### Visual test focus

With the pilot flag on, test Hero → Overview and look specifically for:
1. No start jump from Hero into the pilot.
2. Camera holds during `fractureCharge`.
3. Camera still does not obviously dolly toward Overview during `explosionImpulse`.
4. `bulletTimeSlowdown` reads as a short suspended moment.
5. The main Overview travel begins intentionally in `overviewTravel`.
6. The final Overview composition matches the existing Overview target.
7. No end tilt/roll, and no `HERO_OVERVIEW_PILOT <> FORCED_HERO_TO_OVERVIEW` conflict.

### Out of scope for Milestone C

No fragments, particles, glow, ring, material, layout, UI, object explosion timing, About-route behavior, or non-Hero→Overview routes were intentionally changed.

## Milestone C follow-up: first-write live hold-pose lock

The first Milestone C implementation proved that the phase hold concept works, but visual testing showed a start jump: the pilot could hold the activation/scaffold pose instead of the actual rendered Hero orbit pose at the moment the pilot first owned the camera. That made the first run jump farther back than the visible Hero camera, and later runs could appear to snap to an orbit-start/baseline pose.

The fix keeps the activation capture for diagnostics, but it no longer treats that early capture as the authoritative hold source for active camera ownership. On the first active `HERO_OVERVIEW_PILOT` camera write, immediately before writing any held camera pose, the pilot now locks the active hold pose from the live rendered camera transform:

- `camera.position.clone()`
- `camera.getWorldDirection(...) + camera.position` for lookAt
- `camera.up.clone()`
- `camera.quaternion.clone()`
- current `camera.fov`
- current `camera.filmOffset`

That locked first-write hold pose becomes the source for `fractureCharge`, `explosionImpulse`, `bulletTimeSlowdown`, and the start of `overviewTravel`. It is not recaptured during the run.

The first active pilot write also forces camera travel progress to `0` for that frame, so the pilot captures the visible live camera and writes the same pose back. Diagnostics compare the live camera immediately before the first pilot write against the held pose written by the pilot:

- `activationFromPoseSource`
- `activeHoldPoseSource`
- `holdPoseLockedAtFrame`
- `holdPoseLockedAtPhase`
- `holdPoseLockedAfterHeroOrbitWrite`
- `liveCameraBeforeFirstPilotWriteX/Y/Z`
- `liveLookAtBeforeFirstPilotWriteX/Y/Z`
- `heldCameraX/Y/Z`
- `heldLookAtX/Y/Z`
- `holdPosePositionDeltaFromLiveAtLock`
- `holdPoseLookAtDeltaFromLiveAtLock`
- `holdPoseQuaternionDeltaFromLiveAtLock`
- `startJumpDistance`
- `startLookAtJumpDistance`
- `firstPilotWriteMovedCamera`
- `firstPilotWriteMoveDistance`
- `respectsCurrentHeroOrbitPose`
- `orbitPhaseOrAngleAtCapture`

`globalThis.__printHeroOverviewPilotCinematic?.()` now reports the hold-pose source, lock phase/frame, start jump, first-write move distance, current-orbit-respect status, first travel phase, configured travel start, and per-phase camera distance totals.

Rollback remains the same: disable `globalThis.__ENABLE_CAMERA_DIRECTOR_HERO_OVERVIEW__` or leave the default flag-off path active. No fragments, particles, materials, styling, About behavior, object explosion timing, or other routes are affected by this hold-pose lock.

## Milestone C follow-up: pre-pilot hero writer trace and visible-pose source

Follow-up diagnostics showed that the first-write live camera lock can still be too late if the live camera has already been reset by an upstream Hero writer before the pilot locks the hold pose. The pilot now keeps a DEV-only record of the last rendered Hero camera pose and prefers that last visible Hero pose when locking the Hero → Overview hold source.

Current Hero writer finding:
- The `AUTHORITATIVE_HERO` path is the active rendered Hero writer for the authoritative plain-Hero branch.
- The previous `AUTHORITATIVE_HERO <> heroOrbit` CameraWriteGuard conflict was caused by duplicate DEV guard labels in the same authoritative Hero path, not by two independent rendered camera writers winning in the same frame.
- The old `HERO_ORBIT` branch is still traced if it runs, but the pilot's safe source is now the last visible Hero pose recorded from whichever Hero writer actually rendered most recently.

The pilot hold lock now uses this order:
1. Last visible Hero pose recorded from the rendered Hero writer within the recent pre-pilot window.
2. First-active-pilot-write live camera transform only as a fallback.

This stored visible Hero pose includes position, lookAt, up, quaternion, fov, filmOffset, frame/time, writer id/reason, and hero orbit angle/polar metadata. It becomes the source for `fractureCharge`, `explosionImpulse`, `bulletTimeSlowdown`, and the start of `overviewTravel`.

New helper:

```js
globalThis.__printHeroOverviewPrePilotHeroTrace?.();
```

The trace summarizes and tables the 10-frame pre-activation window and first 5 pilot frames, including:
- Hero writer id/reason and pose after write.
- Last visible Hero pose before pilot lock.
- Last authoritative Hero pose before pilot lock.
- Pilot locked hold pose.
- Distance between Hero writer poses.
- Distance between pilot hold and the last visible Hero pose.
- Whether the pilot hold matches the visible Hero pose.

`__printHeroOverviewPilotCinematic?.()` also reports `lastWriterBeforePilotLock`, `lastHeroWriterBeforePilotLock`, `lastHeroOrbitPoseBeforePilotLock`, `lastAuthoritativeHeroPoseBeforePilotLock`, `distanceBetweenPilotHoldPoseAndHeroOrbit`, `distanceBetweenPilotHoldPoseAndAuthoritativeHero`, `doesPilotHoldMatchHeroOrbit`, and `doesPilotHoldMatchAuthoritativeHero`.

## Milestone C follow-up: visible composition trace

The previous visible-Hero-pose attempt still fell back to `first-active-pilot-write-live-camera-transform` in runtime diagnostics. The most likely implementation issue was that the recency check depended on `state.clock.frame`, which may be absent/unstable in React Three Fiber clock data, so a valid last rendered Hero pose could be rejected as not recent. The camera controller now keeps its own monotonically increasing `cameraFrameIndexRef` for pilot/trace windows and uses that for visible-Hero-pose recency.

A new DEV-only visible composition trace has also been added:

```js
globalThis.__printHeroOverviewVisibleCompositionTrace?.();
globalThis.__clearHeroOverviewVisibleCompositionTrace?.();
```

The trace records the 20 frames before Hero → Overview activation and the first 10 pilot frames. It compares raw camera pose, camera world pose, currentTarget, previousFramePose, the last recorded Hero-orbit state, camera parent world transform, and crystal scene transform snapshots published by `UnifiedCrystalScene`.

The helper summarizes:
- whether raw camera position moved during Hero orbit
- whether camera world position moved during Hero orbit
- whether camera quaternion changed during Hero orbit
- whether filmOffset changed during Hero orbit
- whether scene root / crystal group transforms moved during Hero orbit
- the best visible Hero pose candidate relative to the pilot hold
- whether the visible orbit appears camera-, scene-, or projection-based

This pass intentionally keeps the fix narrow: it improves the visible-pose recency mechanism and adds evidence to identify whether the remaining visual snap is camera-based, scene/object-based, projection-based, or state-order based. It does not tune cinematic timing, object explosion timing, fragments, particles, materials, styling, About behavior, or other routes.

## Milestone D: cinematic timing and motion pass

Milestone D keeps the flag-on Hero → Overview owning pilot architecture intact and only tunes the pilot-owned camera choreography. It does not change flag-off behavior, non-Hero→Overview routes, target parity, live hold-pose capture, anti-reownership protections, object explosion systems, fragment/particle/glow/material styling, or About behavior.

### Milestone D timeline

The tunable `HERO_OVERVIEW_PILOT_CAMERA_TIMELINE` now uses a tighter Overwatch / Play-of-the-Game style rhythm:

| Phase | Progress window | Camera mode | Easing | Tuning intent |
| --- | ---: | --- | --- | --- |
| `fractureCharge` | `0.00 → 0.10` | `hold` | `hold` | Very brief live Hero orbit hold so the charge reads as energy building rather than dead time. |
| `explosionImpulse` | `0.10 → 0.18` | `impactPunch` | `sinePulse` | Short isolated impact beat. |
| `bulletTimeSlowdown` | `0.18 → 0.34` | `suspendedHold` | `hold` | Brief tense suspended moment from a clean held pose, with no pre-travel drift. |
| `overviewTravel` | `0.34 → 0.90` | `travel` | `cinematicRevealOut` | Main reveal starts earlier and moves decisively before easing down into Overview. |
| `overviewSettle` | `0.90 → 1.00` | `settle` | `smoothSettle` | Short exact final lock with no floaty extra settle. |

### Milestone D motion constants

New motion values are centralized in `HERO_OVERVIEW_PILOT_CAMERA_MOTION` next to the timeline constants:

- `explosionImpulse.punchDistance: 0.06` moves the camera a tiny distance along the captured hold-pose forward axis toward the held lookAt. It resolves by `returnCompleteAt: 0.72` of the impact phase, keeps lookAt stable, does not touch roll/up/FOV/filmOffset, and leaves the held pose clean before bullet time.
- `bulletTimeSlowdown.driftAmount: 0` removes the earlier suspended drift so bullet time reads as intentional suspension rather than pre-travel camera movement.
- `overviewTravel` and `overviewSettle` keep `punchDistance` and `driftAmount` at zero so final target parity remains owned by the existing resolved Overview pose.

### Milestone D diagnostics

`globalThis.__printHeroOverviewPilotCinematic?.()` now reports the timeline and motion config plus the requested cinematic fields:

- `firstTravelFrame`
- `configuredTravelStartProgress`
- `actualTravelStartProgress`
- `cameraDistanceMovedByPhase`
- `punchDistanceApplied`
- `maxImpulseCameraOffset`
- `returnedToHoldPoseBeforeTravel`
- `holdPoseDeltaAtTravelStart`
- `explosionImpulseMaxOffset`
- `bulletTimeDriftDistance`
- `overviewTravelDuration`
- `settleDuration`
- `finalPoseLocked`
- `finalTargetParityPasses`
- `rollUpGuardClean`
- `competingWriterAppeared`

Per-frame diagnostic rows also include the phase easing, current/max impulse offset, current bullet-time offset, bullet-time drift distance, hold-pose delta at travel start, and returned-to-hold-pose status so a visual test can verify the impact and suspended beats without reopening the ownership baseline.

## Milestone E tuning config

Hero → Overview cinematic authoring now lives in one local config file:

- `src/config/heroOverviewCinematicConfig.js`
- Export: `HERO_OVERVIEW_CINEMATIC_CONFIG`
- Runtime resolver: `resolveHeroOverviewCinematicConfig()`
- Easing registry: `HERO_OVERVIEW_EASING`

Use this file for timing/easing/motion tuning only. Do **not** tune by editing route ownership, target parity, CameraWriteGuard, canonical-up/roll guard, live lookAt capture, or final overview pose logic in `UnifiedCameraController`.

### Values Jon should edit

```js
export const HERO_OVERVIEW_CINEMATIC_CONFIG = {
  timeline: {
    totalDurationSeconds: 1.45,
    fractureHold: 0.10,
    explosionImpulse: 0.08,
    bulletTime: 0.16,
    overviewTravel: 0.56,
    overviewSettle: 0.10,
  },
  camera: {
    explosionPunchDistance: 0.06,
    bulletTimeDriftDistance: 0,
    travelEase: 'cinematicRevealOut',
    settleEase: 'smoothSettle',
    punchEase: 'sinePulse',
    driftEase: 'sinePulse',
  },
  fracture: {
    holdDuration: 0.5,
    travelDuration: 1.1,
    travelEase: 'easeOutCubic',
    fractureDistanceMultiplier: 1.0,
    spreadMultiplier: 1.0,
    depthMultiplier: 1.0,
    wired: true,
  },
  particles: { enabled: true, triggerAt: 0.10, duration: null, wired: false },
  ring: { enabled: true, triggerAt: 0.10, duration: null, startScale: null, endScale: null, easing: 'sinePulse', wired: false },
};
```

`timeline.totalDurationSeconds` is the absolute camera-pilot runtime control. The phase fields remain relative weights inside that total duration, not absolute per-phase seconds. The default is `1.45` seconds because the owning pilot previously used a hardcoded `transition.duration: 1.45` for elapsed camera progress.

The runtime derives normalized phase windows from the relative weights. With the default values, the derived windows remain:

- `fractureCharge`: `0.00 → 0.10`
- `explosionImpulse`: `0.10 → 0.18`
- `bulletTimeSlowdown`: `0.18 → 0.34`
- `overviewTravel`: `0.34 → 0.90`
- `overviewSettle`: `0.90 → 1.00`

If a phase weight is missing, zero, negative, or non-finite, the resolver falls back to the default weight for that field and reports `defaultsUsed` / `invalidConfigFallbackOccurred` in `__printHeroOverviewPilotCinematic?.()`. If the phase-weight total differs from `1`, the resolver normalizes the phase windows while preserving the authored proportions. If `timeline.totalDurationSeconds` is missing, zero, negative, or non-finite, the resolver falls back to `1.45` and reports `totalDurationFallbackUsed` / `invalidTotalDuration`.

The owning Hero → Overview pilot now computes camera-write progress from elapsed camera runtime divided by `resolvedTotalDurationSeconds`. Shared runtime and explosion progress remain diagnostic fields for timing comparison, but they no longer accelerate the owning pilot camera progress with `max(elapsed, runtime, explosion)`. This keeps total duration edits observable while preserving monotonic camera progress and final-pose guardrails.

### Easing swaps

`camera.travelEase`, `camera.settleEase`, `camera.punchEase`, and `camera.driftEase` are string names resolved through `HERO_OVERVIEW_EASING`. Current supported names include:

- `linear`
- `smoothstep`
- `smootherstep`
- `easeOutCubic`
- `easeOutExpo`
- `expoOut`
- `cinematicRevealOut`
- `sinePulse`
- `smoothSettle`

To try a more aggressive reveal, change `camera.travelEase`. To add a new curve, add a function to `HERO_OVERVIEW_EASING`, then reference its key from the config.

### Particle findings

Particles are currently spawned in `UnifiedCrystalScene.runExplodeSwap()` by incrementing `burstId`; `FractureBurstParticles` receives that `trigger` plus existing `mergedConfig.fracture.particles` props. The particle component currently consumes trigger/delay/count/color/emitter position, while particle lifetimes are generated internally.

That means particles are tied to the crystal explosion swap / `crystalForm === 'exploded'` visual path, not directly to the Hero → Overview CameraDirector phase windows. Trigger delay is partly tweakable in the existing particle component, but route-phase trigger timing and duration are not safely wired without changing the particle trigger/lifetime source. Milestone E therefore leaves `particles.triggerAt` and `particles.duration` as documented placeholders in the new config and reports them in diagnostics.

Follow-up needed to wire route-phase particle timing: pass the resolved Hero → Overview cinematic config into the crystal scene or central visual effects trigger, then trigger `burstId` from a single monotonic route-phase crossing instead of from `runExplodeSwap()` alone.

### Ring findings

The ring is made visible in `UnifiedCrystalScene.runExplodeSwap()` via `setRingVisible(true)`. Its animation is controlled inside `FractureRingImage`, which watches `animationData.crystalForm`, applies `triggerDelay`, and uses props from `mergedConfig.fracture.image` for `duration`, `baseSize`, `maxScale`, `fadeInDuration`, `fadeOutDuration`, and `scaleEasing`.

That means ring duration and scale are already tweakable in the existing fracture image config, but Hero → Overview route-phase `triggerAt` is not safely wired without changing the effect trigger source. Milestone E therefore leaves `ring.triggerAt`, `ring.duration`, `ring.startScale`, `ring.endScale`, and `ring.easing` as documented placeholders in the new config and reports them in diagnostics.

Follow-up needed to wire route-phase ring timing/scale: map the new config values to `FractureRingImage` props and trigger the ring from an explicit Hero → Overview phase crossing rather than only from crystal-form change / explosion swap visibility.

### Concise tuning guide

1. To speed up or slow down the whole camera transition, edit `timeline.totalDurationSeconds`.
2. To make the fracture hold shorter within the same total runtime, edit `timeline.fractureHold`.
3. To make the reveal start sooner, reduce `timeline.bulletTime` or `timeline.explosionImpulse`.
4. To make the dolly feel more dramatic, change `camera.travelEase`.
5. To remove pre-travel motion, set `camera.explosionPunchDistance` and `camera.bulletTimeDriftDistance` to `0`.
6. Particle and ring route-phase fields are placeholders in this PR; tune existing visuals through `fracture.particles` / `fracture.image` until a follow-up wires route-phase effect triggers.

### Local test commands

```js
globalThis.__HERO_OVERVIEW_PILOT_DIAGNOSTICS__ = true;
globalThis.__clearHeroOverviewDiagnosticSamples?.();
globalThis.__clearHeroOverviewPilotSamples?.();
globalThis.__clearHeroOverviewPrePilotHeroTrace?.();
globalThis.__clearHeroOverviewVisibleCompositionTrace?.();
globalThis.__clearCameraWriteGuardSummary?.();
```

Trigger Hero → Overview from a visibly offset Hero orbit, then run:

```js
globalThis.__printHeroOverviewPilotSummary?.();
globalThis.__printHeroOverviewPilotCinematic?.();
globalThis.__printHeroOverviewPilotParity?.();
globalThis.__printHeroOverviewPilotOrientation?.();
globalThis.__printCameraWriteGuardSummary?.();
globalThis.__printCameraWriteGuardConflictDetails?.();
```

For a local tweak smoke test, temporarily change `timeline.totalDurationSeconds` from `1.45` to `2.0` or `0.8`, rerun Hero → Overview, and confirm `__printHeroOverviewPilotCinematic?.()` reports the changed total duration plus changed `derivedPhaseDurationsSeconds`. You can also temporarily change `timeline.fractureHold` from `0.10` to `0.14` or `camera.explosionPunchDistance` from `0.06` to `0`. Restore defaults before committing unless the change is intentional.

## Milestone E follow-up audit: facet explosion timing

This audit is documentation-only. It does not wire facet explosion, particles, ring, glow, route ownership, or camera values into `src/config/heroOverviewCinematicConfig.js` yet.

### Current camera timing control

Hero → Overview camera timing is now controlled by `HERO_OVERVIEW_CINEMATIC_CONFIG.timeline` in `src/config/heroOverviewCinematicConfig.js`. `timeline.totalDurationSeconds` controls the owning pilot camera runtime, while the phase fields remain relative weights that derive normalized phase windows and per-phase seconds.

### Current facet explosion trigger path

The visual crystal/facet explosion starts from the scroll/route animation state, not from the Hero → Overview cinematic config:

1. `MasterAnimationCoordinator` feeds scroll progress into `useUnifiedAnimationController`.
2. When the controller enters the `overview` zone, `useUnifiedAnimationController.handleZoneTransition()` sets:
   - `state: overview`
   - `crystalForm: 'exploded'`
   - `cameraState: 'hero'` initially
   - then delays `cameraState: 'overview'` by `config.crystal.fracturePause`.
3. `UnifiedCrystalScene` watches `animationData.crystalForm`. When it changes to `exploded`, it starts the forward mask glow and sets `pendingExplodeSwapAtRef.current = performance.now() + FORWARD_PRE_SWAP_WINDOW_MS`.
4. In the next frame after that short pre-swap window, `runExplodeSwap()` runs. It hides the whole crystal, shows facets/sphere/ring, sets `explosionStartRef.current`, increments `burstId` for particles, snaps facets to fracture positions, captures the whole-crystal quaternion, and starts fracture glow.

### Current facet translation / travel timing

Facet translation is currently controlled in `UnifiedCrystalScene`, not in the Hero → Overview cinematic config.

- **Trigger source:** `animationData.crystalForm === 'exploded'` plus `runExplodeSwap()` setting `explosionStartRef.current`.
- **Start position:** `crystalConfig.fracturePositions[facetKey]`; fallback is `explodedPosition.normalized * explodedPosition.length() * crystalConfig.fractureDistance`.
- **End position / travel distance:** `crystalConfig.positions[facetKey]`, sourced from `ANIMATION_CONFIG.crystal.explodedPositions` / layout crystal config and adjusted by `getAnchorAdjustedPosition()` for overview anchor alignment.
- **Fracture hold:** While `(performance.now() - explosionStartRef.current) / 1000 < crystalConfig.fracturePause`, facets are held at fracture positions and the rest of the facet animation loop returns early.
- **Travel duration:** `crystalConfig.explodeDuration - crystalConfig.fracturePause`; default controller values are currently `explodeDuration = 1.6` and `fracturePause = fracture.duration` from `src/crystalConfig.js` (`0.5` seconds by default), so travel is about `1.1` seconds before any frame-rate effects.
- **Progress source:** wall-clock `performance.now()` compared with `explosionStartRef.current`.
- **Progress formula:** `progress = (elapsedExplosion - fracturePause) / (totalDuration - fracturePause)`, clamped to `0 → 1`.
- **Primary travel easing:** `crystalConfig.explosionEase(progress)`, defaulting to `1 - (1 - t)^3` from `ANIMATION_CONFIG.crystal.explosionEase`.
- **Additional Hero Overview fragment travel shaping:** during Hero → Overview runtime debugging/scaffolding, `resolveHeroOverviewFragmentTravel(config?.timing?.heroOverviewRuntime, sharedProgressEased)` computes `travelProgress`. In the current implementation, that function returns `travelProgress = sharedProgressEased`, so the final written facet position uses `anchorAdjustedStartPosition.lerp(anchorAdjustedEndPosition, travelProgress)`. `sharedProgressEased` is an expo-out transform of the raw explosion progress.
- **Motion mechanism:** not springs. Translation uses per-frame `Vector3.lerp()` from fracture/start to end based on computed progress, then directly writes `facetRef.current.position.copy(finalPosition)`.

### Current facet rotation timing

Facet rotation has two layers:

1. **Group-level fracture rotation recovery:** `facetsGroupRef.current.quaternion.slerpQuaternions(fractureStartQuatRef.current, neutralQuat, eased)` uses the same `eased = crystalConfig.explosionEase(progress)` as the explosion travel.
2. **Per-facet rotation:** each facet resolves `targetQuat` from `baseFacetTargetQuats` and writes `facetRef.current.quaternion.slerpQuaternions(neutralQuat, finalQuat, eased)`. `finalQuat` is based on the target facet quaternion plus any offsets returned by `resolveHeroOverviewFragmentTravel()`. Current computed/applied offsets are zero, so the real rotation target is primarily the facet target quaternion and the same `eased` explosion progress.

Rotation is therefore time/progress-driven by the same explosion wall-clock progress and easing, with quaternion slerp, not spring damping.

### Current facet settle / Overview positioning

A facet is effectively “settled” when explosion progress reaches `1`, because the per-frame position write reaches `anchorAdjustedEndPosition` and rotation reaches `finalQuat`. Separately, `UnifiedCrystalScene` marks `facetsSettled` when the app is in active Overview, `crystalForm === 'exploded'`, facets are visible, and no explosion start is active. There is no separate authored `settleDuration` for facet motion today.

### Current particles timing

Particles are not driven by the Hero → Overview camera config yet.

- **Trigger source:** `runExplodeSwap()` increments `burstId`; `FractureBurstParticles` receives `trigger={burstId}`.
- **Timing source:** `FractureBurstParticles` watches `trigger` and can apply its `delay` prop.
- **Config today:** `mergedConfig.fracture.particles`, backed by `src/crystalConfig.js`, includes `delay`, `count`, `color`, `duration`, and `spread`, but the component currently consumes trigger/delay/count/color/emitter position and internally randomizes particle lifetimes.
- **Safe follow-up:** trigger timing can be exposed safely only after a single source of truth decides whether particle trigger follows route phase, explosion swap, or both. Particle lifetime/duration needs a small component API pass before `duration` is truly route-configurable.

### Current ring timing / scale

The ring is not driven by the Hero → Overview camera config yet.

- **Visibility trigger:** `runExplodeSwap()` sets `ringVisible` true.
- **Animation trigger:** `FractureRingImage` watches `animationData.crystalForm` and starts when it sees `triggerOnState` (default `exploded`) after `triggerDelay`.
- **Config today:** `mergedConfig.fracture.image`, backed by `src/crystalConfig.js`, controls `baseSize`, `maxScale`, `duration`, `triggerDelay`, `fadeInDuration`, `fadeOutDuration`, `scaleEasing`, `opacity`, and the image texture path.
- **Safe follow-up:** ring timing/scale can be exposed if the follow-up maps Hero Overview config fields to `FractureRingImage` props and ensures the ring has one trigger source instead of racing crystal-form detection and route-phase timing.

### Current glow / flash timing

There are two glow-like effects involved:

- **Forward swap mask glow:** starts before `runExplodeSwap()` through `triggerSwapMaskGlow()`, timed by constants such as `FORWARD_PRE_SWAP_WINDOW_MS` and `FORWARD_MASK_GLOW_DURATION_S` in `UnifiedCrystalScene`.
- **Facet fracture emissive glow:** `triggerFractureGlow()` starts from `runExplodeSwap()` and uses `mergedConfig.fracture.emissive.delay`, `mergedConfig.effects.fracture.initialGlow`, `crystalConfig.fracturePause`, and `crystalConfig.explodeDuration` to ramp/fade emissive intensity.

These are not wired to the Hero Overview cinematic config today.

### Camera/facet synchronization status

The camera and facets are only loosely coordinated today:

- The owning camera pilot uses `src/config/heroOverviewCinematicConfig.js` for camera runtime/progress/easing.
- Facets use `animationData.crystalForm`, `runExplodeSwap()`, `explosionStartRef`, `crystalConfig.fracturePause`, `crystalConfig.explodeDuration`, `crystalConfig.explosionEase`, and existing `config.timing.heroOverviewRuntime` fragment helpers.
- `heroOverviewExplosionClockRef` lets the camera/controller observe explosion progress, and diagnostics compare the two, but the camera timeline does not own the facet timeline and the facet timeline does not consume `HERO_OVERVIEW_CINEMATIC_CONFIG.timeline`.

Milestone F begins the synchronization work by feeding route-local facet hold, travel, and travel easing from `heroOverviewCinematicConfig.js` into `UnifiedCrystalScene`. Remaining follow-ups should only migrate trigger phase, independent rotation windows, settle windows, particles, and ring once they can keep legacy/non-Hero routes on existing `crystalConfig` defaults unless explicitly migrated.

### Remaining follow-up config fields

Milestone F wires the safe `holdDuration`, `travelDuration`, `travelEase`, and fallback fracture-distance multiplier pieces route-locally. The shape below remains a recommendation for fields that are not yet wired, such as trigger phase, pre-swap lead, independent rotation duration/ease, explicit spread/depth scaling, settle duration, glow, particle, and ring timing:

```js
fracture: {
  triggerAt: 0.08,
  preSwapLeadSeconds: 0.12,
  holdDuration: 0.50,
  travelDuration: 1.10,
  travelEase: 'easeOutExpo',
  rotationDuration: 1.10,
  rotationEase: 'easeOutCubic',
  fractureDistanceMultiplier: 1.0,
  spreadMultiplier: 1.0,
  depthMultiplier: 1.0,
  settleDuration: 0.20,
  glowDelay: 0,
  glowDuration: null,
},

particles: {
  enabled: true,
  triggerAt: 0.10,
  delay: 0,
  duration: 0.80,
  count: 360,
},

ring: {
  enabled: true,
  triggerAt: 0.10,
  duration: 0.45,
  startScale: 0.20,
  endScale: 3.50,
  easing: 'sinePulse',
},
```

### Safe exposure assessment

- **Already exposed in Milestone F:** Hero → Overview fracture hold duration, travel duration, travel easing, and fallback fracture-distance multiplier.
- **Safe to expose next with a small adapter:** ring duration/scale/easing and particle trigger delay/count/color.
- **Needs care:** route-phase `triggerAt` for facets/particles/ring, because current triggers come from `crystalForm`/`runExplodeSwap()` and can double-trigger if route-phase triggers are added without removing the old source for Hero → Overview.
- **Needs component API work:** particle duration/lifetime, because `FractureBurstParticles` currently randomizes lifetimes internally rather than reading a duration prop for all particles.


## Milestone F runtime wiring: facet explosion timing controls

Milestone F wires the safest facet explosion controls into `src/config/heroOverviewCinematicConfig.js` for the Hero → Overview route only. Camera ownership, target parity, final FOV/filmOffset, roll/up guards, particles, and ring behavior remain unchanged.

### New fracture config fields

```js
fracture: {
  holdDuration: 0.5,
  travelDuration: 1.1,
  travelEase: 'easeOutCubic',
  fractureDistanceMultiplier: 1.0,
  spreadMultiplier: 1.0,
  depthMultiplier: 1.0,
  wired: true,
  multipliersWired: {
    fractureDistanceMultiplier: 'fallback-only',
    spreadMultiplier: false,
    depthMultiplier: false,
  },
}
```

- `holdDuration` is wired route-locally in `UnifiedCrystalScene` as the Hero → Overview facet hold before outward travel.
- `travelDuration` is wired route-locally as the Hero → Overview facet travel time after the hold.
- `travelEase` is wired route-locally through `HERO_OVERVIEW_EASING` for facet translation and rotation progress during the Hero → Overview explosion.
- `fractureDistanceMultiplier` is wired only for fallback fracture positions when an explicit `crystalConfig.fracturePositions[facetKey]` is unavailable. Existing explicit fracture positions remain authoritative.
- `spreadMultiplier` and `depthMultiplier` are validated placeholders; they are not wired yet because widening/depth scaling explicit facet targets would be broader than this safe timing pass.

### Relationship to the camera timeline

The camera timeline still comes from `timeline.totalDurationSeconds` and the camera phase weights. The facet explosion now has a separate route-local `fracture` timing section. These two sections can be tuned together, but they remain separate clocks:

- Camera progress: `HERO_OVERVIEW_CINEMATIC_CONFIG.timeline` in `UnifiedCameraController`.
- Facet hold/travel progress: `HERO_OVERVIEW_CINEMATIC_CONFIG.fracture` in `UnifiedCrystalScene` for Overview-route exploded facets.
- Particles: still triggered by `runExplodeSwap()` via `burstId`.
- Ring: still shown by `runExplodeSwap()` and animated by `FractureRingImage` from `animationData.crystalForm`.

### Diagnostics

Use:

```js
globalThis.__printHeroOverviewFractureTimingConfig?.();
globalThis.__printHeroOverviewPilotCinematic?.();
```

The fracture helper reports the trigger source, effective hold/travel/total duration, travel easing, original `crystalConfig` timing, whether the Hero → Overview route-local config is active, invalid fallback state, and which multipliers are wired versus placeholders. `__printHeroOverviewPilotCinematic?.()` also includes the resolved fracture config and fallback flags.

### Tuning examples

1. To make facets wait longer before traveling, increase `fracture.holdDuration`.
2. To make facet travel faster, decrease `fracture.travelDuration`.
3. To make facet travel feel more aggressive, try `fracture.travelEase: 'easeOutExpo'`.
4. To keep camera bullet-time and facet explosion aligned, compare `timeline.bulletTime`, `timeline.overviewTravel`, `fracture.holdDuration`, and `fracture.travelDuration` in the two diagnostics above.
5. Do not tune particles or ring from the fracture section; those remain separate follow-ups.
