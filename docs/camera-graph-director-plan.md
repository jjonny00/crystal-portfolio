# Camera Graph + CameraDirector Plan (Phase 1: Audit + Scaffolding)

## Scope and non-goals
- This document captures a low-risk architecture pass only.
- No full migration yet; existing runtime camera behavior remains owned by `UnifiedCameraController` + `useUnifiedAnimationController`.
- Intro/project/case-study/about remain in graph scope.

## 1) Destination audit (current system)

### Source of authored camera values
- Base authored camera values come from merged layout config (`desktop.json` / `mobile.json`) via `config.cameraPositions` and `config.cameraTargets` and `config.projectCameraSettings`.
- Primary runtime resolution currently happens in `UnifiedCameraController.getConfigCameraState(...)`.

### Destination: `intro`
- Resolver path: `getConfigCameraState('intro', ...)`.
- Base source: `config.cameraPositions.intro`, `config.cameraTargets.intro`.
- Desktop/mobile differences: no device-specific intro split in current branch.
- Offsets: global + zone offsets are applied later in the frame (`cameraOffsets.global`, `cameraOffsets.zones.intro`).
- `projectCameraSettings`: not used.
- FOV: inherited from `animationData.cameraConfig.fov`.
- filmOffset: hero-only path; intro has no authored film offset.
- lookAt/target: authored target from config.
- runtime mutation refs: `currentTarget`, smoothing pipeline, fallback branches can still affect writes.

### Destination: `hero`
- Resolver path: `getConfigCameraState('hero', ...)`.
- Base source: `config.cameraPositions.hero`, `config.cameraTargets.hero`.
- Desktop/mobile differences: indirect via merged config.
- Offsets: global + zone offsets are applied.
- `projectCameraSettings`: not used.
- FOV: inherited from `animationData.cameraConfig.fov`.
- filmOffset: hero composition (`camera.composition.hero.filmOffsetX`) is applied on projection.
- lookAt/target: authored target, then hero orbit/currentTarget/fracture-tilt can influence runtime.
- runtime mutation refs: hero orbit refs, handoff refs, current target smoothing refs.

### Destination: `overview`
- Resolver path: `getConfigCameraState('overview', ...)`.
- Base source: `config.cameraPositions.overview`, `config.cameraTargets.overview`.
- Desktop/mobile differences: via merged config.
- Offsets: global + zone offsets are applied.
- `projectCameraSettings`: not used.
- FOV: inherited from `animationData.cameraConfig.fov`.
- filmOffset: not specific.
- lookAt/target: authored target plus runtime smoothing.
- runtime mutation refs: hero→overview handoff refs and fallback writer paths.

### Destination: `about`
- Resolver path: `getConfigCameraState('about', ...)`.
- Base source: `config.cameraPositions.about`, `config.cameraTargets.about`.
- Desktop/mobile differences: via merged config.
- Offsets: global + zone offsets are applied.
- `projectCameraSettings`: not used.
- FOV: inherited from `animationData.cameraConfig.fov`.
- filmOffset: not specific.
- lookAt/target: authored.
- runtime mutation refs: shared smoothing/fallback paths.

### Destination: `project` (selected project 1–6)
- Resolver path: `getConfigCameraState('project', focusedFacet, focusedProjectId)`.
- Base source: `config.projectCameraSettings[projectId][deviceKey].selected`.
- Fallback source: legacy `config.cameraPositions.projects[facet]` + `config.cameraTargets.projects[facet]`.
- Desktop/mobile differences: explicit `deviceKey` split; mobile branch first.
- Offsets: global + per-project (`cameraOffsets.projects[facet]`) on desktop; mobile skips project offsets.
- `projectCameraSettings`: primary source.
- FOV: inherited from `animationData.cameraConfig.fov`.
- filmOffset: none currently.
- lookAt/target: authored target may lock; otherwise anchor-derived target from facet anchor lookup.
- runtime mutation refs: `projectTargetLockRef`, `cameraSettledRef`, `findAnchorInFacet`.

### Destination: `caseStudy` (project case study 1–6)
- Resolver path: `getConfigCameraState('caseStudy', focusedFacet, focusedProjectId)`.
- Base source: `config.projectCameraSettings[projectId][deviceKey].caseStudy`.
- Fallback: generated closer shot from selected pose when case-study authored values missing.
- Desktop/mobile differences: explicit `deviceKey` split.
- Offsets: same as project-like handling.
- `projectCameraSettings`: primary source.
- FOV: inherited from `animationData.cameraConfig.fov`.
- filmOffset: none currently.
- lookAt/target: authored target preferred; anchor/config lock behavior same as project branch.
- runtime mutation refs: same project target lock / anchor pathway.

## 2) Navigation/input audit

### Scroll navigation path (current)
- Scroll capture and normalized progress: `useScrollProgress`.
- Zone/project resolution + camera state transitions: `useUnifiedAnimationController.updateFromScrollProgress`.
- Transition state writes happen through `setAnimationState` and camera-specific branches in `transitionToZone`.
- Canvas adapter exposes controls via `MasterAnimationCoordinator.scrollControls`.

### Top-nav navigation path (current)
- Top nav click handlers in `App.jsx`: `handleHomeClick`, `handleWorkClick`, `handleAboutClick`.
- Each handler calls BOTH:
  1) `fixedCanvasRef.current?.directSelectZone(...)` (direct camera/zone override), and
  2) `scrollToSection(..., 'auto')` (instant DOM scroll).

### Shared setters and bypasses
- Shared camera transition machinery eventually converges in `useUnifiedAnimationController`, but top nav currently bypasses by pushing direct zone override and forcing instant scroll.
- Result: top-nav and scroll are not a single intent pipeline yet.

## 3) Normalized pose contract (new)
```js
{
  position,
  lookAt,
  fov,
  filmOffset
}
```

Implemented in `src/camera/cameraPose.js`.

## 4) Resolver scaffolding (new)
- Added `resolveCameraDestination(...)` in `src/camera/cameraDestinations.js`.
- Supports: `intro`, `hero`, `overview`, `about`, `project`, `caseStudy`.
- Preserves: authored base values + projectCameraSettings + global/zone offsets + fov + hero filmOffset metadata.
- Designed for audit/compare use first; not wired to own runtime camera writes yet.

## 5) Transition profile scaffolding (new)
- Added `selectTransitionProfile(from,to,context)` and profile registry in `src/camera/transitionProfiles.js`.
- Profiles scaffolded:
  - `defaultSmooth`
  - `projectSmooth`
  - `caseStudySmooth`
  - `aboutSmooth`
  - `introHeroSmooth`
  - `heroOverviewCinematic`
- Rule enforced: `hero -> overview` resolves to `heroOverviewCinematic`.

## 6) CameraDirector scaffolding (new)
- Added `CameraDirectorPlan` class in `src/camera/CameraDirectorPlan.js`.
- Lifecycle scaffold:
  1) capture `fromPose`
  2) resolve `toPose`
  3) select profile
  4) return transition plan object for a future runner

## 7) Dev-only ownership model plan
Future CameraDirector-active mode should suppress/log legacy writers.

Legacy writers/paths to gate later:
- Hero orbit writer path in `UnifiedCameraController`.
- currentTarget smoothing write path.
- forced hero<->overview delay/handoff transitions in `useUnifiedAnimationController`.
- fallback camera branch in `UnifiedCameraController`.
- fracture tilt camera adjustments in hero.
- direct zone override entry points (`directSelectZone`).
- snapshot/handoff refs in `UnifiedCameraController`.

Planned approach:
- Introduce `cameraOwner` enum in dev (`legacy` | `director`).
- When `director` owns transition, non-owner writes are ignored and bounded warnings emitted.
- Keep read-only diagnostics from legacy branches during rollout.

## 8) Destination graph (proposed)
- Intro
- Hero
- Overview
- About
- Project(projectId: 1..6)
- CaseStudy(projectId: 1..6)

All navigation methods should request one of these destination keys and flow through the same resolver + profile selector.

## 9) Migration safety order
Safest first:
1. intro <-> hero
2. overview <-> about
3. overview <-> project (selected)
4. project <-> project
5. project <-> caseStudy and caseStudy <-> project

Preserve/later (high-risk):
- hero <-> overview cinematic handoff + fracture timing ownership
- any branch that currently depends on handoff locks or hero orbit refs
