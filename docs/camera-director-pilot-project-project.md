# CameraDirector Pilot: Project → Project (PR-14)

## Feature flag
- `globalThis.__ENABLE_CAMERA_DIRECTOR_PROJECT_TO_PROJECT__ = true`
- Default is disabled (`false` / `undefined`).

## Activation conditions
Pilot activates only when all are true:
- feature flag enabled
- no other CameraDirector pilot active
- `cameraState` stays `project` and source/target selected project ids differ
- not in `caseStudy` view mode

## fromPose strategy
- Capture live visible camera pose at pilot start.
- Preserve live position/lookAt/fov/filmOffset for first write continuity.
- If pre-start lookAt changed, prefer previous-frame lookAt to avoid a start snap.

## target pose strategy
- Resolve target selected project pose from camera destination resolver.
- Use legacy-equivalent composition for fov/filmOffset by preferring live/currentTarget equivalents.
- Maintain strict settle thresholds and max-duration fallback to avoid hard hangs.

## Parity helpers
- `globalThis.__clearProjectProjectPilotParity()`
- `globalThis.__printProjectProjectPilotParitySummary()`
- `globalThis.__printProjectProjectPilotParitySamples()`

Captured parity fields include mode, from/to project ids, sample buckets, view mode, camera deltas to resolved project, progress fields, completion reason, and progress easing source.

## Rollback plan
- Set `globalThis.__ENABLE_CAMERA_DIRECTOR_PROJECT_TO_PROJECT__ = false` (or remove override).
- Behavior immediately returns to legacy without writer suppression.

## Test checklist
- Flag off: verify project→project remains legacy.
- Flag on: verify project transitions trigger one pilot start per selection change.
- Validate no start jump, no end pop, and final composition parity.
- Verify overview/project, project/overview, and caseStudy-related transitions remain unaffected.

## Non-goals
- No changes to hero/overview/about transitions.
- No changes to overview→project or project→overview pilot behavior.
- No global tuning for fragments, particles, glow, or ring.
