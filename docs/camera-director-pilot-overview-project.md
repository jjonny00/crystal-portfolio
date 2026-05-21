# CameraDirector Pilot: Overview → Project (PR-7)

## Scope
- Runtime pilot for **overview → project** only.
- All other transitions remain legacy.

## Feature flag
- Flag: `globalThis.__ENABLE_CAMERA_DIRECTOR_OVERVIEW_TO_PROJECT__`
- Default: `false` when not explicitly set.
- Safe default path is legacy behavior.

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
  - Pilot captures `fromPose` from live camera (`position`, inferred `lookAt`, `fov`, `filmOffset`).
  - Pilot resolves `toPose` using destination resolver (`project`, `selected`, current project).
  - Pilot interpolates and writes `position`, `lookAt/orientation`, `fov`, `filmOffset`, and `currentTarget`.
- On completion, pilot deactivates and legacy project-state camera path immediately resumes ownership.

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
