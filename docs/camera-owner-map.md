# Camera Writer Ownership Map (PR-1, docs-only)

## Scope and constraints
- This document is code-inspection only. No runtime behavior changes are proposed here.
- Audited files:
  - `src/components/three/UnifiedCameraController.jsx`
  - `src/hooks/useUnifiedAnimationController.js`
  - `src/components/three/MasterAnimationCoordinator.jsx`
  - `src/components/layout/Fixed3DCanvas.jsx`
  - `src/App.jsx`
  - `src/lib/layout/parseLayout.js`
  - `src/config/layout/desktop.json`
  - `src/config/layout/mobile.json`
  - `src/crystalConfig.js`
  - `src/hooks/useHeroOverviewRuntime.js`

---

## 1) Camera writer inventory

| writer name | file/function | cadence | writes camera.position | writes lookAt / quaternion / rotation | writes fov | writes filmOffset | writes currentTarget | activation conditions | route/state/cameraState | returns early after writing | known conflicts |
|---|---|---|---:|---:|---:|---:|---:|---|---|---|---|
| Initial intro lookAt writer | `Fixed3DCanvas.jsx` / `InitialCameraLookAt` (`useEffect`) | useEffect (mount/init) | no | yes (`camera.lookAt`, matrix update) | no | no | no | Canvas mount with intro/hero initial target array present | initial load, before controller settles | n/a | can briefly diverge from immediate first `useFrame` write by `UnifiedCameraController` |
| Unified camera frame writer (primary) | `UnifiedCameraController.jsx` / main `useFrame` loop | useFrame | yes | yes (lookAt + fracture tilt rotation ops) | yes | yes (hero composition/film offset path) | yes | active whenever component mounted and valid camera target resolution exists | intro, hero, overview, project, caseStudy, about, transitions between them | branch-dependent; many paths short-circuit once branch handled | central conflict surface: can overlap with hero-overview runtime sequencing, intro init lookAt, and state flips from coordinator/controller |
| Fracture tilt rotation overlay | `UnifiedCameraController.jsx` / `applyFractureTilt` | useFrame (called during frame write) | no direct | yes (`camera.rotateX`, `camera.rotateZ`) | no | no | no | `fractureTiltActiveRef.current` true and thresholds met | mostly hero/hero→overview related | yes (deactivates when distance threshold reached) | can add post-target rotation after translation logic; candidate contributor to perceived end blip |
| Hero→Overview authoritative transition writer | `UnifiedCameraController.jsx` / authoritative transition refs + frame branch | useFrame | yes | yes | yes (if branch updates lens) | yes | yes | hero→overview path, authoritative flags/transition refs active | hero→overview | yes, intended handoff path | possible handoff conflict with normal camera branch and hero overview runtime phase completion |
| Overview→Hero authoritative transition writer | `UnifiedCameraController.jsx` / overview→hero transition refs + frame branch | useFrame | yes | yes | yes (if branch updates lens) | yes | yes | overview→hero path with authoritative transition ref active | overview→hero | yes | fragile during migration attempts; potential overlap with standard hero orbit re-entry logic |
| Hero orbit writer | `UnifiedCameraController.jsx` / hero orbit state (`isOrbitingRef`, orbit velocity refs) | useFrame | yes | yes | usually no change | possible | yes | hero camera state + orbit initiation conditions + settle gating | hero | no (continuous) | transition boundary conflicts if orbit restarts while authoritative transition/handoff still active |
| Intro playback writer | `UnifiedCameraController.jsx` / intro refs (`introActiveRef`, `introFromRef`, `introToRef`) | useFrame | yes | yes | yes | possible | yes | intro state, restart token, intro active flags | intro→hero | yes when intro branch owns frame | can compete with state changes if cameraState flips before intro completion |
| HeroOverviewRuntime phase state source (indirect writer selector) | `useHeroOverviewRuntime.js` / runtime object used by camera + crystal systems | useFrame update via ticker + event start/reset | no (direct) | no (direct) | no | no | no | starts on hero→overview zone crossing, resets on return to hero | hero→overview and hero re-entry | n/a | indirect conflict vector: camera and fragments read same phase timing but may not hand off ownership atomically |
| Animation intent/state mutator (not direct camera write) | `useUnifiedAnimationController.js` | event + debounced updates | no | no | no | no | no | scroll/input driven zone and cameraState derivation | all zones and transitions | n/a | high influence: rapid state/cameraState mutation can trigger competing branches in camera frame writer |
| Coordinator scroll propagation (not direct camera write) | `MasterAnimationCoordinator.jsx` | useEffect (scroll-driven) | no | no | no | no | no | significant scroll change > threshold | all scroll-mediated transitions | n/a | indirect: can push frequent updates into animation controller while camera transition in flight |

### Notes on non-writers that still affect camera ownership
- `App.jsx` builds animation config and runtime overrides used as camera inputs (positions/targets/offsets/project camera settings).
- `Fixed3DCanvas.jsx` merges camera layers from layout + runtime overrides + project overrides and passes merged config into both camera and crystal components.
- `parseLayout.js` validates/normalizes schema used by merge logic (including `camera.projects.selected/caseStudy`).

---

## 2) Transition/state matrix

| transition/state | expected camera owner | actual possible camera writers | risk | notes |
|---|---|---|---|---|
| intro | UnifiedCameraController intro branch | InitialCameraLookAt init + UnifiedCameraController | medium | init effect sets lookAt once, then frame writer takes over |
| hero | UnifiedCameraController hero/orbit branch | UnifiedCameraController (hero base + orbit + fracture tilt overlay) | medium | multiple sub-branches inside same writer family |
| hero → overview | UnifiedCameraController authoritative hero→overview branch (intended) | authoritative branch + normal frame branch + fracture tilt overlay + runtime phase-driven branching | high | known end blip risk, handoff locks and runtime phase completion timing sensitive |
| overview | UnifiedCameraController overview branch | UnifiedCameraController + possible residual transition refs | medium | must preserve configured overview horizontal target/offset |
| overview → hero | UnifiedCameraController authoritative overview→hero branch (intended) | authoritative transition + hero orbit re-entry + standard branch | high | historically fragile in migration attempts |
| overview → project | UnifiedCameraController project selected branch | selected target resolver + project offsets/global offsets | medium | depends on focused project/facet mapping consistency |
| project | UnifiedCameraController selected project branch | selected branch + fallback project camera settings paths | medium | per-device project settings and offsets can diverge |
| project → overview | UnifiedCameraController overview branch | project branch until state flip, then overview branch | medium | state timing/handoff determines smoothness |
| project → caseStudy | UnifiedCameraController caseStudy branch | selected/caseStudy resolver branches (device-specific + fallback) | medium | authored caseStudy path exists but includes temporary debug fallback behavior |
| caseStudy | UnifiedCameraController caseStudy branch | caseStudy authored + fallback selected-derived caseStudy | medium | mixed authored/fallback path can mask config gaps |
| caseStudy → overview | UnifiedCameraController overview branch | caseStudy branch then overview branch | medium | depends on clean state flip and offsets |
| about | UnifiedCameraController about branch | about zone branch + inherited global offsets | medium | about itself stable, but outgoing transitions show corruption symptoms |
| about → hero | UnifiedCameraController hero transition/hero branch | about branch on exit + hero branch + orbit/transition re-entry | high | known wrong-position/jump symptom |
| about → overview | UnifiedCameraController overview branch | about branch on exit + overview branch + offsets merge path | high | known overview horizontal offset loss symptom |
| about → scroll back to project | UnifiedCameraController project branch | about branch exit + scroll-driven state changes + project resolver | high | known issues when returning toward last project via scroll |

---

## 3) Navigation input map (current flow)

## Scroll
- **Starting handler**: `useScrollProgress` feed in `MasterAnimationCoordinator`, then `updateFromScrollProgress` in `useUnifiedAnimationController`.
- **State mutations**: zone info, project info, animation state, cameraState, focused facet/project.
- **cameraState mutations**: derived from scroll zone/project calculations and view mode handling.
- **Scroll mutation**: raw scroll source of truth.
- **Bypasses shared navigation intent?**: **Yes** (no central canonical intent object yet; direct scroll updates drive controller state).

## Logo/name click
- **Starting handler**: app/nav callback path in `App.jsx` through scroll/navigation controls provided by coordinator/canvas.
- **State mutations**: view mode normalization + scroll target updates + possible direct zone override hooks.
- **cameraState mutations**: indirect through animation controller when scroll/zone changes land.
- **Scroll mutation**: yes (programmatic scroll to zone/progress).
- **Bypasses shared navigation intent?**: **Partially yes** (uses convenience control calls; no unified intent layer).

## Work click
- **Starting handler**: navigation callback through scroll controls (`scrollToZone('overview')` style path).
- **State mutations**: zone transition toward overview; project selection may remain null initially.
- **cameraState mutations**: derived by animation controller from resulting zone.
- **Scroll mutation**: yes.
- **Bypasses shared navigation intent?**: **Yes** (direct scroll/zone targeting).

## About click
- **Starting handler**: navigation callback through scroll controls/direct zone selection.
- **State mutations**: zone changes to about, possibly view mode normalization.
- **cameraState mutations**: animation controller derives `about` camera state from zone.
- **Scroll mutation**: yes.
- **Bypasses shared navigation intent?**: **Yes**.

## Project selection
- **Starting handler**: project click handlers propagate via coordinator controls (`directSelectProject`, scroll-to-project helpers).
- **State mutations**: focused project override refs + projectInfo/focusedFacet updates.
- **cameraState mutations**: enters project mode (`project`) based on state/view mode.
- **Scroll mutation**: often yes (scroll to project section start), sometimes direct override path.
- **Bypasses shared navigation intent?**: **Yes** (direct override refs exist).

## Case-study open/close
- **Starting handler**: `App.jsx` view mode handlers (set `viewMode` to `caseStudy` and back to `project`).
- **State mutations**: `viewMode`, active project context.
- **cameraState mutations**: coordinator maps `viewMode==='caseStudy'` to effective `cameraState='caseStudy'`.
- **Scroll mutation**: usually no immediate scroll mutation required.
- **Bypasses shared navigation intent?**: **Yes** (viewMode switch is separate control lane from scroll intent).

---

## 4) Ref inventory (camera-ownership relevant)

- `currentTarget`: live target snapshot for camera interpolation (position/lookAt/fov); core internal write destination in controller.
- `latestAuthoritativeHeroSnapshotRef`: latest hero-authoritative snapshot for transition continuity/handoff.
- `heroExitSnapshotRef`: captures hero exit state for hero→overview alignment.
- `heroOrbitStartTimeRef`: timing anchor for hero orbit lifecycle.
- `isOrbitingRef`: gate for hero orbit writer branch.
- `authoritativeHeroToOverviewTransitionRef`: state machine/ref payload for authoritative hero→overview transition ownership.
- `authoritativeOverviewToHeroTransitionRef`: counterpart for overview→hero ownership path.
- `heroExplosionTransitionRef`: explosion-linked transition envelope used during hero→overview runtime choreography.
- `fractureTiltActiveRef`: rotation overlay gate; when true, adds camera rotational writes post-translation.
- Handoff lock refs:
  - `heroToOverviewHandoffPendingRef`
  - `heroToOverviewHandoffLockFramesRef`
  - `heroToOverviewTransitionStartedForExitRef`
  - `heroToOverviewLastForcedFinalRef`
  - `heroToOverviewAwaitFirstNormalFrameRef`
  - plus trace/meta refs used to debug branch boundaries and forced-final frames.
- `heroOverviewExplosionClockRef` (in canvas, passed to camera/crystal): shared reference intended to synchronize explosion timing surfaces.
- `useHeroOverviewRuntime` state affecting camera/fragments:
  - runtime `active`, `progress`, `phase`, `timing`
  - `start()` invoked on hero→overview zone crossing
  - `resetToIdle()` invoked when returning to hero
  - updated each frame by `HeroOverviewRuntimeTicker`

---

## 5) Static conflict diagnosis (code-inspection only, no fixes)

## Hero → Overview end blip (likely causes)
- Multi-branch handoff complexity inside one frame writer (authoritative branch, forced-final/handoff lock refs, then return to normal branch).
- Fracture tilt overlay can still apply rotational writes near/after transition unless fully released.
- Runtime phase completion (`useHeroOverviewRuntime`) and camera branch completion may not clear ownership on same frame.

## Overview → Hero jump/wrong position (likely causes)
- Overview→hero authoritative transition and hero orbit re-entry are both active paths with delicate gating.
- Hero snapshot reuse + orbit initialization timing can cause discontinuity if baseline hero pose differs from transition endpoint.

## About → Hero wrong position (likely causes)
- About exit path depends on zone/state flip timing from scroll/controller; hero branch may consume stale/partial target refs.
- Potential interaction with cached hero snapshots/orbit init once returning from about.

## About → Overview horizontal offset loss (likely causes)
- Overview target/offset comes from layered config merges (layout + runtime + global/zone offsets).
- About exit + overview entry can transiently resolve with fallback/base target before full offset chain is applied.

## About → scroll back to project issues (likely causes)
- Competing lanes: scroll-derived zone/project calculation plus direct override refs/project focus reconciliation.
- Transition from about to projects may briefly mismatch focused project, section progress, and cameraState branch.

---

## 6) Recommended next task (PR-2)

Create **`docs/camera-legacy-state-audit.md`** (docs-only) to reproduce and record:
1. About → Hero wrong position
2. About → Overview horizontal offset loss
3. About → scroll back to project issues

PR-2 should include reproducible scripts/steps, expected vs actual camera pose notes, and trace snapshots tied to ownership rows from this document.

---

## Coverage checklist (required files)
- ✅ `src/components/three/UnifiedCameraController.jsx`
- ✅ `src/hooks/useUnifiedAnimationController.js`
- ✅ `src/components/three/MasterAnimationCoordinator.jsx`
- ✅ `src/components/layout/Fixed3DCanvas.jsx`
- ✅ `src/App.jsx`
- ✅ `src/lib/layout/parseLayout.js`
- ✅ `src/config/layout/desktop.json`
- ✅ `src/config/layout/mobile.json`
- ✅ `src/crystalConfig.js`
- ✅ `src/hooks/useHeroOverviewRuntime.js`
- ✅ project/caseStudy camera config paths (`projectCameraSettings` in config, merge usage in canvas/controller)

## PR-15 hero→overview stabilization note
- Hero → Overview remains legacy-owned in runtime.
- Added DEV-only diagnostics helpers and a disabled scaffold gate for future CameraDirector migration work.
- About route behaviors remain intentionally unchanged in this step.
