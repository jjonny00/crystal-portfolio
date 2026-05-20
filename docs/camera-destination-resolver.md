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
