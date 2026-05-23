# CameraDirector Pilot: Overview → Project (PR-12 findings)

## Scope
- Runtime pilot for **overview → project** only.
- All other transitions remain legacy.
- Status: **experimental research scaffold, not production-ready**.

## Feature flag
- Flag: `globalThis.__ENABLE_CAMERA_DIRECTOR_OVERVIEW_TO_PROJECT__`
- Default: `false` when not explicitly set.
- Safe default path is legacy behavior.
- **Do not enable in production.**

## Activation conditions
Pilot activates only when all conditions are true:
1. Flag is enabled.
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

## Decision: Do not continue patching this pilot.
- Do not treat this pilot as the production migration path for overview → project.
- Keep the pilot disabled by default and research-only.
- Do not add further runtime timing/completion patches in this isolated pilot loop.

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

## Rollback
1. Set `globalThis.__ENABLE_CAMERA_DIRECTOR_OVERVIEW_TO_PROJECT__ = false`.
2. Verify overview → project uses legacy behavior.
3. If needed, revert PR-7 commit.

## Test checklist
### Flag false
- App load and normal navigation remain unchanged.
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
