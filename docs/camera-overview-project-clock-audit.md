# Overview → Project transition clock audit (PR-10)

## Scope
This audit identifies the real timing signals behind the visible Overview → Project camera movement and focused project facet rotation, without changing runtime behavior.

## Candidate clocks found

### 1) `cameraMoveProgress` (derived settle progress)
- Computed in `UnifiedCameraController` from **three normalized settle channels**:
  - position distance to `currentTarget.current.position`
  - lookAt angle delta (`currentDirection` vs `targetDirection`)
  - fov delta (`currentTarget.current.fov` vs `camera.fov`)
- Per-frame `moveProgress = min(positionProgress, lookAtProgress, fovProgress)` and made monotonic via `max(previous, clampedMoveProgress)`.
- This means it is **not an elapsed-time clock**; it is a settle metric and may already be `1` when sampling begins if baselines are small/already-settled.

### 2) `currentTarget` smoothing clock (actual visible camera motion)
- Visible camera movement is driven by per-frame smoothing toward `currentTarget`:
  - `camera.position.lerp(currentTarget.current.position, clampedSmoothing)`
  - `currentDirection.lerp(targetDirection, clampedSmoothing)` then `lookAt`
  - `camera.fov += (currentTarget.current.fov - camera.fov) * clampedSmoothing`
- `clampedSmoothing` is delta-based (`useFrame` dt path), so the true motion clock is frame-delta accumulation + remaining deltas to target.

### 3) State routing clocks (`state`, `cameraState`, `viewMode`, `focusedProject`)
- Transition observability gates are routed by changes in `cameraState` and project context.
- `focusedProject` and `viewMode` changes can precede or overlap camera settle behavior.
- These are transition event clocks (discrete), not motion clocks.

### 4) Facet rotation clocks
- Target focused quaternion uses
  - `focusRotationProgress = clamp(cameraMoveProgress / FOCUS_ROTATION_PROGRESS_LEAD, 0, 1)`
- Mesh rotation is still applied with per-frame slerp (`focusedRotationLerp` / `rotationLerp`) toward that target, making final visible facet convergence partly delta-time driven.

## What appears to drive visible motion

### Camera movement (overview → project)
Primary driver: **`currentTarget` delta-based smoothing path** (position/lookAt/fov deltas shrinking over frames).

`cameraMoveProgress` is a derived settle indicator, useful as coupling/progress metadata, but not a reliable start-at-zero transition clock.

### Facet rotation
Primary driver for intended target progression: **`cameraMoveProgress`**.

Primary driver for visible final convergence: **per-frame quaternion slerp toward that target**.

## Shared vs correlated
- Camera and facet are **partially shared** through `cameraMoveProgress`.
- They are also **independently time-shaped** by separate per-frame smoothing/slerp paths.
- Therefore they are correlated, but not a single strict elapsed-time clock.

## DEV-only shadow instrumentation added
Manual helper:
- `globalThis.__printOverviewProjectTimingTimeline()`

Timeline rows include:
- event/sample type
- timestamp/frame
- `state`, `cameraState`, `viewMode`, `focusedProject`
- live distance to resolved project target
- live fov delta to resolved project target
- live filmOffset delta to resolved project target
- facet progress/quaternion delta (if focused facet debug available)
- `cameraMoveProgress`
- frame-delta accumulation

Additional event rows are captured on:
- state change
- cameraState change
- viewMode change
- focusedProject change

Default console remains silent; output is helper-triggered only.

## Recommendation for future CameraDirector pilot
Use a **dual-source timing contract**:
1. Motion clock: live target deltas over frame time (distance/lookAt/fov/filmOffset error envelope).
2. Coupling clock: explicit normalized transition progress that matches legacy facet expectations (or explicit facet clock).

In other words, do not rely on `cameraMoveProgress` alone as the sole transition clock; consume both event boundaries and live camera-to-target error curves.
