# CameraDirector Pilot: Project → Project (PR-14)

## Feature flag
- Flag: `globalThis.__ENABLE_CAMERA_DIRECTOR_PROJECT_TO_PROJECT__`
- Default: disabled (`false` / `undefined`).
- With flag off, legacy behavior is unchanged.

## Activation strategy (focusedProject + last stable project)
Project→project pilot activation is gated and only starts when all are true:
- project→project pilot flag is enabled
- no other camera-director pilot is active
- `prevCameraState === 'project'` and `nextCameraState === 'project'`
- `fromProjectId` resolves from the last stable project id (focused project history)
- `toProjectId` resolves from current `focusedProject` (selected project is fallback only)
- `fromProjectId !== toProjectId`
- `viewMode !== 'caseStudy'`

## Duplicate-start guard
- Stable transition key is used:
  - `project-to-project:${fromProjectId}->${toProjectId}`
- Duplicate starts are blocked if the same transition key is already handled/active.
- Bounded duplicate suppression diagnostic:
  - `[camera-director-pilot] project-to-project restart-blocked`

## False mid-transition start blocking
To avoid false late starts (already settled state), starts are blocked when the transition appears invalid/post-settle.
- Bounded diagnostic:
  - `[camera-director-pilot] project-to-project start-blocked`

## fromPose strategy
- Capture visible live camera pose on start.
- Preserve first-write continuity (`position`/`lookAt`/`fov`/`filmOffset`) to avoid start jump.

## Target pose strategy
- Resolve target pose with `resolveCameraDestination(... destination: 'project', mode: 'selected')`.
- Preserve legacy-equivalent composition behavior for `fov`/`filmOffset`.
- If target pose cannot resolve, parity rows are still recorded with null pose deltas and reason fields.

## Final curve strategy (active)
- `progressEasingSource`: `project-to-project:legacy-settle-ease-out`
- Camera position uses a front-loaded but moderated project→project remap (closer to legacy 25/50/75 settle pacing).
- LookAt resolves early (faster than old smooth interpolation) while keeping no-start-jump behavior.

## Facet/choreography parity
- Project→project pilot preserves legacy-like facet choreography behavior.
- Camera pilot keeps camera ownership, but shared choreography progress is preserved so facet lag vs legacy is avoided.

## Completion strategy
- Strict completion remains:
  - near-zero position/lookAt/fov deltas
  - filmOffset parity preserved
  - completion reason remains `thresholds-met` when strict criteria are met

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

## Final successful status (current)
- Flag off: unchanged legacy behavior.
- Flag on: project→project starts once, no start jump, no end pop, correct landing, and parity rows are captured.

## Recommended test checklist
1. Set `globalThis.__ENABLE_CAMERA_DIRECTOR_PROJECT_TO_PROJECT__ = false` and confirm all transitions remain legacy.
2. Set flag true.
3. Run:
   - `__clearProjectProjectPilotParity()`
4. Navigate:
   - Overview → Project 1
   - Project 1 → Project 2
5. Verify:
   - single project→project pilot activation
   - no start jump / no end pop
   - bounded logs only (no console flooding)
6. Inspect parity:
   - `__printProjectProjectPilotParitySummary()`
   - `__printProjectProjectPilotParitySamples()`
7. Confirm completion remains strict and final deltas settle correctly.

## Rollback
- Disable the flag (`false`/unset) to return immediately to legacy project→project behavior.

## Non-goals
- No changes to hero/overview/about transitions.
- No changes to overview→project or project→overview pilot behavior.
- No global visual-system tuning (fragments/particles/glow/ring).
