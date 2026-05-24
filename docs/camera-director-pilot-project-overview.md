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
- Use legacy-equivalent overview composition candidates from live `currentTarget`/camera when available, with resolver as fallback.
- Keep target parity aligned to legacy handoff expectations (`position`, `lookAt`, `fov`, `filmOffset`) to avoid end correction pops.

## Runtime status (current pilot)

- Target/handoff parity fix is in place.
- Start continuity fix is in place (no start jump in validated runs).
- End continuity fix is in place (no end pop in validated runs).
- Motion curve uses a front-loaded settle remap (`project-to-overview:legacy-settle-ease-out`) to reduce hard final approach.
- Pilot remains experimental and disabled by default.

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

- Flag off (default): verify legacy behavior is unchanged.
- Flag on: verify project→overview has no start jump, no end pop, correct overview composition, and soft final approach.
- Confirm no console flooding/errors.
- Confirm overview→project pilot remains unchanged.
- Confirm completion remains strict (`thresholds-met` only when settle thresholds are satisfied).

## Non-goals

- No changes to hero/overview/about flows.
- No global fragment/particle/glow/ring edits.
- No unrelated animation tuning.
