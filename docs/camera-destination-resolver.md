# Camera Destination Resolver (PR-4 Shadow Mode)

- Adds pure resolver API: `resolveCameraDestination(...)` in `src/camera/destinationResolver.js`.
- Adds compare helper: `compareCameraPoses(...)` in `src/camera/cameraPoseCompare.js`.
- Shadow-mode only: legacy camera pipeline remains authoritative.
- Compare runs only on destination-key changes (cameraState/project/viewMode/device), not per-frame.
- Dev helpers:
  - `globalThis.__printCameraDestinationCompareSummary()`
  - `globalThis.__printCameraDestinationCompareDetails()`
  - Optional verbose: `globalThis.__CAMERA_DESTINATION_COMPARE_VERBOSE__ = true`

## Current scope
Supported canonical destinations:
- `intro`, `hero`, `overview`, `about`, `project`, `caseStudy`

## Notes
- No camera writes changed.
- No transition timing changes.
- Hero→Overview behavior intentionally untouched.
- Known About corruption remains unresolved in this PR.

## PR-11: Project FOV parity fix (overview → project)
- Root cause: resolver project/caseStudy branch returned the default base FOV (`45`) because it only resolved position/target from `projectCameraSettings` and never sourced FOV for project destinations.
- Legacy/runtime target source for this transition remains `animationData.cameraConfig.fov` (observed project target `35`), so shadow compare showed `resolvedProjectFov=45` vs `currentTargetFov=35`.
- Fix: project/caseStudy resolver path now reads FOV from `animationData.cameraConfig.fov` (same source used by legacy runtime targeting) and keeps fallback to base FOV only when animation data is unavailable.
- Non-goal unchanged: transition timing/start-capture instrumentation is still downstream and not addressed here.
