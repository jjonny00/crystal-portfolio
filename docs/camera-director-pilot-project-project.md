# CameraDirector Pilot: Project → Project (PR-14)

## Feature flag
- Flag: `globalThis.__ENABLE_CAMERA_DIRECTOR_PROJECT_TO_PROJECT__`
- Default: disabled (`false` / `undefined`).
- With flag off, behavior remains legacy.

## Activation strategy (focusedProject + last stable project id)
Project→project pilot activates only when all are true:
- feature flag enabled
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
- Flag off unchanged.
- Flag on project→project transitions accepted for merge quality:
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
1. Flag off (`false`/unset) and verify legacy behavior remains unchanged.
2. Flag on and run:
   - `__clearProjectProjectPilotParity()`
3. Navigate:
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

## Rollback
- Disable/unset `__ENABLE_CAMERA_DIRECTOR_PROJECT_TO_PROJECT__` to return immediately to legacy behavior.

## Non-goals
- No changes to overview→project or project→overview pilot systems.
- No changes to hero/about/caseStudy route behavior.
- No global visual-system tuning (fragments/particles/glow/ring).
