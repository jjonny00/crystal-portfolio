# Camera Director Pilot: project → overview (PR-13)

## Feature flag

- Flag: `globalThis.__ENABLE_CAMERA_DIRECTOR_PROJECT_TO_OVERVIEW__`
- Default: disabled (`false`/`undefined` means legacy path only)

## Activation conditions

Pilot activates only when all are true:
- flag is enabled
- camera pilot is not already active
- camera state transitions from `project` to `overview`
- view mode is not `caseStudy`

## From-pose strategy

- Capture live visible camera pose at transition start.
- Use previous frame `lookAt` when available to guard against pre-start lookAt snap.
- Preserve live `fov`/`filmOffset` from current camera state.

## Target pose strategy

- Resolve `overview` destination through existing `resolveCameraDestination`.
- Use resolved position/lookAt/fov when finite.
- Keep target `filmOffset` resolver-driven when finite; fallback to live from-pose filmOffset.

## Parity helpers

- `globalThis.__clearProjectOverviewPilotParity()`
- `globalThis.__printProjectOverviewPilotParitySummary()`
- `globalThis.__printProjectOverviewPilotParitySamples()`

Samples include mode, sample type, state/view fields, and deltas to resolved overview target.

## Diagnostics

Bounded logs:
- `[camera-director-pilot] project-to-overview start`
- `[camera-director-pilot] project-to-overview pre-start-continuity`
- `[camera-director-pilot] project-to-overview first-write-continuity`
- `[camera-director-pilot] project-to-overview complete`
- `[camera-director-pilot] project-to-overview fallback`

## Rollback plan

- Disable `__ENABLE_CAMERA_DIRECTOR_PROJECT_TO_OVERVIEW__` to return instantly to legacy behavior.
- Remove project→overview pilot branch if needed without touching other transitions.

## Test checklist

- Flag off: verify legacy behavior for all transitions.
- Flag on: verify project→overview pilot start, continuity, and completion.
- Confirm no console flooding/errors.
- Confirm overview→project pilot remains unchanged.

## Non-goals

- No changes to hero/overview/about flows.
- No global fragment/particle/glow/ring edits.
- No unrelated animation tuning.
