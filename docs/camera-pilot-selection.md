# Camera Pilot Transition Selection (PR-6, docs-only)

## Scope and constraints
- Documentation-only decision memo for selecting the **first runtime CameraDirector pilot transition**.
- No runtime changes in this PR.
- No camera writer suppression in this PR.
- No fixes for known Hero/Overview/About bugs in this PR.
- Evidence inputs:
  - `docs/camera-owner-map.md`
  - `docs/camera-legacy-state-audit.md`
  - `docs/camera-suppression-matrix.md`
  - `docs/camera-write-guard.md`
  - `docs/camera-destination-resolver.md`

---

## Decision criteria
Scoring levels:
- `low` = minimal evidence of instability for this criterion
- `medium` = some sensitivity/unknowns
- `high` = known instability or active conflict risk

Pilot preference weighting used:
1. Avoid known bug clusters (especially About and Hero↔Overview).
2. Minimize write-guard conflict overlap.
3. Keep migration scope contained to one transition with a clear legacy owner.
4. Preserve project/caseStudy nuances unless that nuance is explicitly the pilot target.
5. Ensure straightforward feature-flag + rollback.

---

## Candidate transition scoring

| transition | known bug involvement | writer conflict evidence | About-state contamination risk | Hero/overview contamination risk | project/caseStudy nuance risk | ease of rollback | user-visible importance | recommended as pilot |
|---|---|---|---|---|---|---|---|---|
| overview → about | low | low | medium | low | low | high | medium | no |
| about → overview | high | medium | high | medium | low | medium | high | no |
| overview → project | low | low | low | low | medium | high | high | **yes** |
| project → overview | medium | low | low | low | medium | high | high | no (backup) |
| project → project | low | low | low | low | high | medium | medium | no |
| project → caseStudy | low | low | low | low | high | medium | medium | no |
| caseStudy → project | low | low | low | low | high | medium | medium | no |
| caseStudy → overview | medium | low | low | low | medium | high | medium | no |
| overview → hero | high | high | medium | high | low | low | high | no |
| hero → overview | high | high | medium | high | low | low | high | no |

---

## Per-candidate evidence notes

### overview → about
- Not in known bug list as a primary failing flow; about **entry** is described as usually stable.
- De-prioritized because it does not improve the highest-value work/project path and still sits adjacent to About contamination on exit.

### about → overview (explicitly ruled out)
- Directly listed in known About corruption set (overview horizontal offset loss).
- About exit path is identified as high-risk contamination area.
- Explicitly not a safe first pilot.

### overview → project (**selected pilot**)
- Not listed among known high-risk bug flows.
- Owner-map marks this as a normal branch with medium (not high) risk and clear project-selected ownership.
- Avoids About and Hero↔Overview hazard clusters while still covering a high-frequency user flow.
- Transition boundary is contained and feature-flag friendly.

### project → overview (backup)
- Adjacent to selected pilot and similarly free from known Hero↔Overview and About bug focus.
- Slightly higher sensitivity than overview → project due to handoff timing back into overview and offset composition timing.
- Good backup if implementation friction appears on overview → project.

### project → project
- Potentially large nuance surface (focused project/facet continuity, intra-project behavior).
- Not ideal as first pilot because verification burden is higher than a simple cross-state transition.

### project → caseStudy
- Not currently a known bug hotspot, but it is nuance-heavy due to case-study authored/fallback behaviors.
- Better as later pilot once project base transitions are stabilized.

### caseStudy → project
- Similar nuance concerns as project → caseStudy.
- Useful later, but not best first runtime migration target.

### caseStudy → overview
- Moderate handoff and framing risk on exit from caseStudy.
- Less ideal than overview ↔ project for first migration.

### overview → hero (explicitly ruled out)
- Owner-map transition matrix marks this as high risk and historically fragile.
- Write guard evidence includes dual-writer conflict pair during Overview → Hero (`FORCED_OVERVIEW_TO_HERO <> authoritativeOverviewToHero`) across position/orientation/filmOffset/currentTarget categories.
- Explicitly deferred.

### hero → overview (explicitly ruled out)
- Owner-map marks this as high risk with known end blip sensitivity.
- Write guard evidence includes long-running conflict patterns related to hero lanes and transition ownership (`AUTHORITATIVE_HERO <> heroOrbit`, plus expected Hero→Overview dual-label conflict family).
- Explicitly deferred.

---

## Required high-risk exclusions
The following remain excluded from first pilot scope:
- `hero → overview` (known blip + high conflict/handoff risk)
- `overview → hero` (known fragile re-entry + guard conflict evidence)
- `about → hero` (known wrong-position bug)
- `about → overview` (known horizontal offset loss bug)

No evidence from current docs overturns these exclusions.

---

## Recommended first runtime pilot transition
## **overview → project**

Why this wins:
- Outside the explicitly known About and Hero↔Overview bug clusters.
- No named high-severity write-guard conflict pair tied to this transition in current guard findings.
- Clear legacy owner path (project selected branch in `UnifiedCameraController`).
- High user-visible value (core portfolio navigation path).
- Can be isolated behind a single transition-scoped feature flag and reverted quickly.

---

## Backup pilot transition
## **project → overview**

Why this backup:
- Same destination family and comparable implementation surface.
- Also avoids About and Hero↔Overview first-order hazard zones.
- Provides a near-neighbor fallback if overview → project reveals unexpected coupling.

---

## PR-7 proposed implementation scope (for selected pilot)

### Exact transition to migrate
- `overview → project` only.

### Expected current owner
- Legacy: `UnifiedCameraController` project-selected destination branch.

### Proposed future owner
- `CameraDirector` transition owner for `overview -> project`, behind a feature flag.

### Likely files touched (planning estimate)
- `src/components/three/UnifiedCameraController.jsx` (flagged routing/ownership gate at transition boundary)
- `src/camera/destinationResolver.js` (consume canonical destination for migrated boundary if needed)
- `src/camera/*director*` or equivalent new/existing director module (transition execution ownership)
- `src/components/three/MasterAnimationCoordinator.jsx` (if transition ownership switch requires wiring)
- `src/hooks/useUnifiedAnimationController.js` (only if transition intent metadata is needed)
- `src/config/*` or feature-flag wiring location currently used in project
- `docs/camera-suppression-matrix.md` (update planning rows only if needed)

> Note: file list is a planning forecast, not a required change set.

### Suppression list needed (PR-7)
- For the pilot itself: **none initially** (keep warning-mode guard; no writer suppression by default).
- If duplicate writes emerge specifically on `overview -> project`, suppress only the non-authoritative duplicate lane for that transition under the pilot flag.

### Feature flag name
- `cameraDirectorOverviewToProjectPilot`

### Rollback plan
1. Toggle off `cameraDirectorOverviewToProjectPilot`.
2. Verify legacy `UnifiedCameraController` path is fully authoritative again.
3. Re-run transition checklist + guard summary to confirm baseline behavior restored.
4. Keep pilot code dormant (or revert commit) depending on severity.

### Manual test checklist (PR-7)
1. Overview idle → select project (mouse/touch) repeatedly across multiple projects.
2. Repeat with slow and rapid user input.
3. Enter About, return to Overview, then run overview → project again (contamination check only; no About fixes).
4. Ensure project framing/offset parity vs legacy baseline.
5. Confirm caseStudy open from selected project still matches baseline behavior.
6. DEV guard checks:
   - `__printCameraWriteGuardSummary()` before and after pilot flag on.
   - confirm no new high-risk conflict pair spikes for pilot transition.
7. Disable flag and confirm immediate return to baseline.

### Stop/reassess criteria (PR-7)
- Any new or worsened conflict pair involving `currentTarget`, `position`, or `filmOffset` during overview → project.
- Any visible regression in project framing parity versus baseline.
- Any spillover instability into project → overview or caseStudy entry.
- Any coupling that requires touching Hero↔Overview or About transitions.

---

## PR-7 “do not touch” list
- Hero → Overview
- Overview → Hero
- Any About transitions
- Animation timing/tuning
- Fragments/particles/ring/glow behavior
- Project/caseStudy transitions other than selected pilot (`overview → project`)

