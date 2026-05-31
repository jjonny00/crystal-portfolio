# CameraDirector Pilot: Project → Project (PR-14)

## Current default status

Project → Project now defaults to its completed CameraDirector/pilot path. The legacy path is retained as a DEV-only fallback and can be requested with:

```js
globalThis.__PROJECT_PROJECT_CAMERA_MODE__ = 'legacy';
```

Reset by assigning `undefined` or reloading. The old `__ENABLE_CAMERA_DIRECTOR_PROJECT_TO_PROJECT__` boolean remains accepted only as a DEV compatibility shim; prefer the explicit `__*_CAMERA_MODE__` override for fallback testing. Diagnostics remain independent of route selection.


## Route mode controls
- Default: CameraDirector/pilot path.
- DEV legacy fallback: `globalThis.__PROJECT_PROJECT_CAMERA_MODE__ = 'legacy'`.
- Optional DEV compatibility shim: `globalThis.__ENABLE_CAMERA_DIRECTOR_PROJECT_TO_PROJECT__ = false` also forces legacy; `true` forces pilot.

## Activation strategy (focusedProject + last stable project id)
Project→project pilot activates only when all are true:
- route mode resolves to CameraDirector/pilot
- no other camera-director pilot is active
- `prevCameraState === 'project'` and `nextCameraState === 'project'`
- `fromProjectId` resolves from last stable focused project id
- `toProjectId` resolves from current `focusedProject` (`selectedProject` fallback only)
- `fromProjectId !== toProjectId`
- `viewMode !== 'caseStudy'`

## Duplicate-start guard
- Stable transition key:
  - `project-to-project:${fromProjectId}->${toProjectId}`
- Duplicate starts blocked for same key while active/handled.
- Bounded diagnostic:
  - `[camera-director-pilot] project-to-project restart-blocked`

## False mid-transition start blocking
- Invalid starts are blocked when activation is detected post-settle / invalid mid-transition state.
- Bounded diagnostic:
  - `[camera-director-pilot] project-to-project start-blocked`

## fromPose strategy
- Capture live visible camera pose at pilot start.
- Preserve first-write continuity to avoid start jump.

## Target pose strategy
- Resolve `toPose` with `resolveCameraDestination(... destination: 'project', mode: 'selected')`.
- Keep target composition parity for `fov` / `filmOffset`.
- If target cannot resolve, parity rows still record with null deltas and reason fields.

## Final curve strategy (accepted)
- Position uses project→project easing tuned to legacy-like pacing while maintaining no-jump/no-pop.
- LookAt resolves early enough to avoid lingering mismatch.
- Camera settle is synchronized against facet progress in project→project pilot path for acceptable visual end alignment.

## progressEasingSource
- Final descriptive label:
  - `project-to-project:facet-synced-settle`

## Final accepted status
- Default project→project CameraDirector transitions accepted for merge quality:
  - no start jump
  - no end pop
  - correct landing
  - acceptable camera/facet timing

## Parity helpers
- `globalThis.__clearProjectProjectPilotParity()`
- `globalThis.__printProjectProjectPilotParitySummary()`
- `globalThis.__printProjectProjectPilotParitySamples()`

## Known diagnostics (bounded)
- `[camera-director-pilot] project-to-project activation-check`
- `[camera-director-pilot] project-to-project activation-matched`
- `[camera-director-pilot] project-to-project parity-start-written`
- `[camera-director-pilot] project-to-project restart-blocked`
- `[camera-director-pilot] project-to-project start-blocked`
- `[camera-director-pilot] project-to-project curve-path`
- `[camera-director-pilot] project-to-project motion-curve-summary`
- `[camera-director-pilot] project-to-project complete`
- `[camera-director-pilot] project-to-project fallback`

## Recommended test checklist
1. Default CameraDirector/pilot and run:
   - `__clearProjectProjectPilotParity()`
2. Navigate:
   - Overview → Project 1
   - Project 1 → Project 2
   - Project 2 → Project 3
   - Project 3 → Project 1
4. Verify:
   - one pilot start per project→project transition
   - no start jump / no end pop
   - correct project landing
   - bounded diagnostics only
5. Inspect parity:
   - `__printProjectProjectPilotParitySummary()`
   - `__printProjectProjectPilotParitySamples()`
6. Re-check unaffected routes:
   - overview→project
   - project→overview
   - hero/overview
   - about

## Rollback / fallback
- Set `globalThis.__PROJECT_PROJECT_CAMERA_MODE__ = 'legacy'` in DEV to return immediately to retained legacy behavior; reset with `undefined` or reload.

## Non-goals
- No changes to overview→project or project→overview pilot systems.
- No changes to hero/about/caseStudy route behavior.
- No global visual-system tuning (fragments/particles/glow/ring).
