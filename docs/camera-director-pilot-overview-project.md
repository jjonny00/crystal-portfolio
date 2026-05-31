# CameraDirector Pilot: Overview → Project (PR-12 findings)

## Current default status

Overview → Project now defaults to its completed CameraDirector/pilot path. The legacy path is retained as a DEV-only fallback and can be requested with:

```js
globalThis.__OVERVIEW_PROJECT_CAMERA_MODE__ = 'legacy';
```

Reset by assigning `undefined` or reloading. The old `__ENABLE_CAMERA_DIRECTOR_OVERVIEW_TO_PROJECT__` boolean remains accepted only as a DEV compatibility shim; prefer the explicit `__*_CAMERA_MODE__` override for fallback testing. Diagnostics remain independent of route selection.


## Scope
- Runtime pilot for **overview → project** only.
- Current status: completed/stabilized and promoted to default.
- Legacy overview → project behavior is retained as explicit DEV fallback only.

## Route mode controls
- Default: CameraDirector/pilot path.
- DEV legacy fallback: `globalThis.__OVERVIEW_PROJECT_CAMERA_MODE__ = 'legacy'`.
- Optional DEV compatibility shim: `globalThis.__ENABLE_CAMERA_DIRECTOR_OVERVIEW_TO_PROJECT__ = false` also forces legacy; `true` forces pilot.

## Activation conditions
Pilot activates only when all conditions are true:
1. Route mode resolves to CameraDirector/pilot.
2. Previous `cameraState` is `overview`.
3. Current `cameraState` is `project`.
4. `focusedProject` is present.
5. Pilot is not already active.

## Ownership model
- **Flag false**: legacy `UnifiedCameraController` owns camera writes.
- **Flag true + active transition**:
  - Pilot captures `fromPose` from live camera/resolved-overview guarded selection.
  - Pilot resolves `toPose` using destination resolver (`project`, `selected`, current project).
  - Pilot interpolates and writes `position`, `lookAt/orientation`, `fov`, `filmOffset`, and `currentTarget`.
- On completion, pilot deactivates and legacy project-state camera path immediately resumes ownership.

## PR-11 / PR-12 findings
- PR-11 fixed project resolver FOV parity for this path:
  - `resolvedProjectFov = 35`
  - `legacyProjectFovCandidate = 35`
  - `currentTargetFov = 35`
  - `targetFovMismatch = false`
- PR-12 observation outcome:
  - pilot can start and complete.
  - pilot can reach near-zero `liveDistanceToProjectTarget`.
  - visual result still fails in the same way as earlier runtime attempts.
- Conclusion:
  - near-zero position delta is **not** a sufficient success condition.
  - remaining failure likely involves composition and choreography mismatch rather than endpoint position only:
    - `lookAt`
    - `fov` timing
    - `filmOffset` / composition framing
    - project facet rotation timing coupling
    - scroll/state handoff timing
- Standalone generic CameraDirector replacement is not the right next move for overview → project at this stage.
- Flag remains off by default.

## Latest validated status (PR-12)
- **Flag off** remains unchanged.
- **Flag on (project01)** currently verifies:
  - pilot starts once
  - start jump gone
  - end jump gone
  - project lands correctly
  - project → overview unchanged
  - Hero → Overview unchanged
  - About unchanged
  - no console errors

### Root cause of the former start jump
- The start jump was caused by a **pre-pilot lookAt snap** before pilot capture.
- Diagnostics showed previous frame and live-start matched for position/fov/filmOffset, but lookAt changed abruptly:
  - previousFrameLookAt: `[1.7, 0.3, 0]`
  - liveStartLookAt: `[-0.1, 2.3, 0.9]`
  - `deltaPreviousToLiveLookAt: 2.8373`

### Fix now in place
- For the detected pre-start lookAt snap case, pilot uses **previousFrameLookAt** as `fromPose.lookAt`.
- `fromPose.position`, `fromPose.fov`, and `fromPose.filmOffset` remain live-start values.
- `toPose.lookAt` remains the project target lookAt source.

### Why previous-frame lookAt is sometimes required
- At activation time, visible continuity can be broken before pilot first write if state/cameraState/viewMode handoff already advanced lookAt.
- Using prior visible lookAt as the interpolation start restores continuity without changing destination composition.

### Historical experimental status
- This section described an earlier research-only state.
- Current state: Overview → Project is completed/stabilized and defaults to CameraDirector/pilot ownership.
- Use `globalThis.__OVERVIEW_PROJECT_CAMERA_MODE__ = 'legacy'` only for explicit DEV fallback testing.

## Historical decision note
- Earlier isolated-pilot findings are retained for context.
- Current default behavior is the completed CameraDirector/pilot path documented at the top of this file.

## Suppression list
- During active pilot only: legacy branches are bypassed by early return in `useFrame` after pilot write.
- No global writer suppression is introduced.
- No Hero/Overview/About/caseStudy suppression is added.

## Bounded logs
DEV-only bounded logs:
- `[camera-director-pilot] overview-to-project start`
- `[camera-director-pilot] overview-to-project complete`
- `[camera-director-pilot] overview-to-project fallback`

No frame-level pilot spam is added.

## Rollback / fallback
1. Set `globalThis.__OVERVIEW_PROJECT_CAMERA_MODE__ = 'legacy'` in DEV.
2. Verify overview → project uses retained legacy behavior.
3. Reset by assigning `undefined` or reloading.

## Test checklist
### Default CameraDirector/pilot
- App load and normal navigation remain stable.
- Scroll and top nav behave as baseline.
- Project flow behaves as baseline.
- Hero → Overview unchanged.
- About bugs unchanged.

### Flag true
- Enable in DEV console: `globalThis.__ENABLE_CAMERA_DIRECTOR_OVERVIEW_TO_PROJECT__ = true`.
- Trigger overview → project across multiple projects.
- Verify smooth movement and correct landing pose.
- Verify project UI/state still works.
- Verify project → overview remains legacy.
- Verify Hero/Overview/About behaviors remain unchanged.
- Verify no console flooding.

### Multi-project spot-check checklist (flag true)
- project01
  - overview → project start and end are smooth
  - landing pose correct
- project02
  - overview → project start and end are smooth
  - landing pose correct
- project06
  - overview → project start and end are smooth
  - landing pose correct

## Non-goals
- No Hero → Overview changes.
- No Overview → Hero changes.
- No About transition fixes.
- No project → overview migration.
- No project → project migration.
- No project → caseStudy migration.
- No caseStudy behavior changes.
- No fragment/particle/glow/ring/runtime fragment rotation changes.

## Current test findings (PR-7)
- Flag-off is safe:
  - App load/navigation/scroll/project flow remain unchanged.
  - Overview → project and project → overview remain legacy baseline.
- Flag-on improvements:
  - Pilot starts once (restart guard resolved repeated start/complete loops).
  - Project destination landing and project UI/state remain functional.
- Flag-on remaining issues:
  - Scrolling into first project still shows a wrong visual start composition.
  - Start-pose diagnostics showed `fromPoseSource: resolved-overview` with:
    - position delta near `0`
    - but large lookAt / filmOffset / fov deltas versus live composition.
  - This indicates composition mismatch even when base position matches.
  - Pilot camera timing is not synchronized to existing project facet rotation timing.
  - Result: transition can visually jump and arrive before facet motion completes.

## Why the pilot is not ready
1. **Composition mismatch**
   - Position parity alone is insufficient; lookAt/fov/filmOffset must preserve live visual composition.
2. **Project motion sync mismatch**
   - Pilot easing timeline is not currently coupled to legacy project facet rotation timing.
3. **From-pose correctness requirement**
   - A future runtime attempt must preserve live composition semantics or consume an authoritative transition timing source.
4. **Resolver scope limitation**
   - Destination resolver is useful for endpoints but is not enough by itself for project transition choreography.

## Recommended next direction
- Audit/refactor the **existing legacy overview → project owner path** first, instead of replacing it with a standalone pilot.
- Identify the **smallest internal cleanup** inside that current legacy owner that improves reliability while preserving behavior.
- Preserve existing choreography coupling (camera composition + facet rotation + scroll/state handoff) rather than approximating with a separate generic transition.
- Only after that owner path is stabilized and explicit should it be extracted into CameraDirector.

## Default-promotion timing audit note

After route promotion, Overview → Project no longer exercises the legacy camera-progress path by default; it exercises the completed pilot path that was previously behind `__ENABLE_CAMERA_DIRECTOR_OVERVIEW_TO_PROJECT__`. That means any visible camera/facet timing mismatch observed immediately after promotion is most likely the already-existing pilot choreography being exposed as the default path, not a new Hero → Overview or route-selection ownership regression.

Current timing model:
- Camera position uses the overview→project pilot's lagged smoothstep driver from `min(rawProgress, facetProgress)`.
- Facet focus rotation reads `cameraMoveProgress` and then applies its own per-frame quaternion slerp in `UnifiedCrystalScene`.
- The pilot completion gate waits for strict camera target parity and facet progress when available, but camera interpolation and facet mesh rotation do not share a single duration/easing function.

Diagnostics were expanded to capture `cameraMoveProgress`, `facetRotationProgress`, `facetRotationProgressApprox`, active writer, route mode, target project id, camera/facet easing labels, and camera/facet completion frame deltas. Use `__printOverviewProjectPilotParitySummary()` and `__printOverviewProjectPilotParitySamples()` after a default Overview → Project run to quantify whether camera completion leads or trails facet completion.

No behavior was changed in this audit pass. If visual review requires exact lockstep, the recommended follow-up is a narrow Overview → Project timing pass that aligns the pilot's published camera progress and facet rotation completion without changing final composition or non-project routes.
