# Camera Write Guard (DEV warning mode)

This PR adds a **DEV-only** camera write guard that inventories camera write ownership and reports potential multi-writer conflicts.

## Scope
- Warning mode only.
- No write suppression.
- No runtime camera behavior changes.
- No transition logic changes.

## What it tracks
Per frame, the guard records writer activity for these categories:
- `position`
- `lookAt/quaternion/rotation` (normalized as `orientation`)
- `fov`
- `filmOffset`
- `currentTarget`

## Conflict definition
A conflict is recorded when, in the same frame, more than one distinct `writerId` writes the same category.

## Instrumented lanes
Primary instrumentation is attached at UnifiedCameraController writer boundaries (intro, hero orbit, authoritative transition lanes, fracture/transition lanes, fallback-like transition writes, and project/about branches where logged).

## Console behavior
Bounded by design:
- No mandatory per-frame spam.
- One-time deduped conflict warnings per `writerPair + category + phase/reason` key when verbose mode is enabled.
- Manual summary output.
- Manual conflict detail output.

## Manual helpers
Available in DEV:
- `globalThis.__printCameraWriteGuardSummary()`
- `globalThis.__clearCameraWriteGuardSummary()`
- `globalThis.__printCameraWriteGuardConflictDetails()`
- Optional verbose mode: `globalThis.__CAMERA_WRITE_GUARD_VERBOSE__ = true`

## Summary fields
`__printCameraWriteGuardSummary()` includes:
- `totalFramesObserved`
- `totalWritesRecorded`
- `conflictCount`
- `conflictCategories`
- `conflictPairs`
- `conflictsByState`
- `conflictsByCameraState`
- `conflictsByTransitionOrPhase`
- `topWriterIds`
- `highRiskFlowsObserved`

## Why this exists
This creates ownership visibility needed for a later suppression matrix rollout, without changing current camera execution behavior.


## Conflict details table
`__printCameraWriteGuardConflictDetails()` prints a compact `console.table` with:
- `frameId`
- `state`
- `cameraState`
- `viewMode`
- `selectedProject`
- `phase`
- `category`
- `writerA`
- `writerB`
- `writerAReason`
- `writerBReason`
- `transitionOrPhase`
- `firstSeenAt`
- `count`
- `conflictId`
- `firstSeenFrame`
- `lastSeenFrame`

If the renderer frame counter is unavailable, the guard uses a stable fallback key (`frame-seq-N`) so rows never show an undefined frame identifier.
