# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install      # install dependencies
npm run dev      # start Vite dev server
npm run build    # production build (also the de facto type/compile check)
npm run preview  # serve the dist/ build for smoke testing
```

There is no test runner or `lint` script configured (no Jest/Vitest, no `lint` entry in package.json). ESLint config (`eslint.config.js`) exists but must be invoked directly: `npx eslint .`. Before committing, the project's own quality bar (per README) is `npm run build` followed by `npm run preview` for a manual smoke test — there is no automated test suite to lean on, so UI-affecting changes should be verified in the browser.

The codebase is JS/JSX except `src/ui/LoaderV2.tsx` (one TypeScript component, no `tsconfig.json` — Vite transpiles it directly).

## Architecture overview

This is a single-page 3D portfolio built with React + react-three-fiber/drei/postprocessing + Vite. The whole experience is one continuously-scrolling page: a crystal model whole→exploded→whole through four scroll zones (`hero` → `overview` → `projects` (6 sub-sections) → `about`), with a synchronized 3D camera and a parallel DOM-scroll content layer.

### Two parallel layers, one scroll position

- **`ScrollablePortfolio`** (`src/components/layout/`) is the real scrollable DOM content (text sections, project cards).
- **`Fixed3DCanvas`** (`src/components/layout/Fixed3DCanvas.jsx`) is a fixed-position `<Canvas>` that renders the crystal scene on top/behind the DOM layer; it is *not* itself scrolled. It reads the same scroll-derived state instead.
- Both are driven by one state machine, so changes to zone boundaries or project ordering need to stay consistent across both layers.

### Animation/state pipeline (read in this order to understand a bug)

1. **`useScrollProgress`** — turns raw container scroll position into a normalized progress value + velocity/fast-scroll flags.
2. **`MasterAnimationCoordinator`** (`src/components/three/MasterAnimationCoordinator.jsx`) — glue component. Feeds scroll progress into the animation controller, builds the `animationData` object, and clones its children (`Fixed3DCanvas`) with that data as props.
3. **`useUnifiedAnimationController`** (`src/hooks/useUnifiedAnimationController.js`) — the actual state machine. Maps scroll progress to `state`/`zone`/`cameraState`/`crystalForm`/`focusedFacet`/`focusedProject`, exposes direct-override escape hatches (`setDirectZoneOverride`, `setDirectProjectOverride`) used by nav clicks, and computes per-project scroll-section boundaries.
4. **`Fixed3DCanvas`** merges, in order: hardcoded `crystalConfig.js` defaults → device layout config (`src/config/layout/desktop.json` / `mobile.json`, validated by `src/lib/layout/parseLayout.js`, picked via `useLayoutConfig`) → live runtime overrides from the debug control panel (`App.jsx`'s `cameraRuntimeOverrides`/`projectRuntimeOverrides`) → per-project camera settings (`projectCameraSettings`). It then renders the crystal scene, lights, postprocessing, and the camera controller, and exposes an imperative ref API (`directSelectZone`, `modelsLoaded`, `updateBackground`) consumed by `App.jsx`'s nav handlers.
5. **`UnifiedCameraController`** (`src/components/three/UnifiedCameraController.jsx`, ~8000 lines) is the camera's `useFrame` writer — by far the largest and most failure-prone file in the repo. See "Camera system" below before touching it.

### Navigation intent

`src/navigation/navigationIntent.js` defines canonical destinations (`intro`/`hero`/`overview`/`about`/`project`/`caseStudy`) and a small requester factory. Top-nav clicks in `App.jsx` go through `requestNavigationIntent(...)`, which still ultimately calls the legacy `directSelectZone` + DOM `scrollToSection` pair — this is an intentionally incomplete migration (see `docs/navigation-intent-map.md`). Scroll-driven navigation does **not** go through this intent layer; it talks directly to `useUnifiedAnimationController`.

### Camera system — read the docs before editing

`UnifiedCameraController.jsx` is being incrementally replaced by a newer `CameraDirector`/"pilot" system (`src/camera/CameraDirector.js`, `src/camera/destinationResolver.js`, `src/camera/cameraPoseCompare.js`), but the legacy file still owns most transitions and contains the pilot activation/execution branches inline. Per-route ownership is controlled by DEV-only globals checked at runtime, e.g. `globalThis.__OVERVIEW_PROJECT_CAMERA_MODE__ = 'legacy'` forces the old code path; omitting it uses the pilot. Current defaults (see `docs/camera-pilot-selection.md`, `docs/camera-owner-map.md`):

| route | default owner |
|---|---|
| Overview ↔ Project, Project ↔ Project | CameraDirector pilot (`__OVERVIEW_PROJECT_CAMERA_MODE__`, `__PROJECT_OVERVIEW_CAMERA_MODE__`, `__PROJECT_PROJECT_CAMERA_MODE__`) |
| Hero → Overview | owning `HERO_OVERVIEW_PILOT` (`__HERO_OVERVIEW_CAMERA_MODE__`) |
| Anything touching **About** | legacy only — known-buggy and explicitly out of scope for pilot migration |

Before changing camera behavior:
- Read `docs/camera-owner-map.md` (writer inventory + known conflict zones) and `docs/camera-pilot-selection.md` (why About and Hero↔Overview are excluded from migration).
- A DEV-only conflict detector exists: `src/camera/cameraWriteGuard.js`, exposed via `globalThis.__printCameraWriteGuardSummary()` / `__printCameraWriteGuardConflictDetails()`. Use it to check whether a change introduces a new dual-writer conflict on `position`/`orientation`/`fov`/`filmOffset`/`currentTarget` in the same frame.
- `docs/camera-legacy-state-audit.md`, `docs/camera-suppression-matrix.md`, and `docs/camera-director-pilot-*.md` document specific known bugs (About exit corruption, Hero↔Overview "end blip") — check whether your bug is already a documented, intentionally-deferred issue before re-diagnosing it.

### Hero → Overview explosion sequence

`useHeroOverviewRuntime` (`src/hooks/useHeroOverviewRuntime.js`) is a small phase-based clock (`fractureCharge` → `explosionImpulse` → `bulletTimeSlowdown` → `overviewSettle`) started on the hero→overview zone crossing and reset when scrolling back to hero. Its timing constants live in `crystalConfig.js`'s `timing.heroOverviewRuntime` (also overridable via layout JSON). It's read by the camera controller and the fragment/particle burst components (`FractureBurstParticles`, `FractureRingImage`) to keep camera pushback and fragment motion synchronized — they must stay driven by the same shared clock rather than independent timers.

### Project/facet identity (two independent ID spaces, intentionally decoupled)

- **Project identity**: `project01`...`project06`, defined with content (title, description, images, tech list, mobile variants) in `src/data/projects.js`.
- **Scene facet identity**: `empathy`/`narrative`/`craft`/`system`/`leadership`/`exploration` — the semantic keys used throughout `crystalConfig.js` for positions/rotations/camera targets, and `facetA`...`facetF` — abstract slot order used by `src/data/facetSystem.js`.
- `facetSystem.js` provides the mapping helpers (`buildProjectFacetAssignment`, `getSceneKeyByProjectId`, etc.) that glue project IDs to scene facet keys. When adding/reordering projects, update the assignment via this module rather than hardcoding facet keys elsewhere.

### Performance & asset loading (V2 systems)

- `usePerformanceV2` / `PerformanceManagerV2` (`src/hooks/`, `src/utils/`) benchmark the device at startup (medium tier first, then attempts high if FPS thresholds are met, falls back to low) and produce a performance `profile` consumed for renderScale/PBR/texture/postprocessing settings. Tiers are defined in `src/utils/deviceProfiles.js`. Results are cached against app version + hardware fingerprint. Press **P** at runtime to open the live debug panel (`window.__PERF_DEBUG__`).
- `useAssetLoaderV2` / `AssetLoaderV2` load GLTF models/textures/HDRIs based on the chosen performance profile.
- `App.jsx` gates the splash `LoaderV2` (`src/ui/LoaderV2.tsx`) on both systems plus a simulated init progress ramp before mounting the real app.
- Full behavior details (FPS thresholds, tier criteria) are documented in the README — don't restate them from memory, re-check `README.md` if tuning this system.

### Case studies

`src/caseStudies/` is a self-contained system, intentionally decoupled from the crystal/facet/project-background rendering. A project opts in with `caseStudySlug` + `caseStudyColors` (exactly two colours) in `projects.js`; `src/caseStudies/registry.js` maps the slug to a dynamically-imported module, and `CaseStudyOverlay` (mounted from `App.jsx` when `viewMode === 'caseStudy'`) renders it as a full-page layer over the portfolio without touching the scroll/camera state underneath. Reusable sections, the media/lightbox abstraction, and all responsive CSS live in `src/caseStudies/system/`; project content lives in `src/caseStudies/<slug>/`. Read `docs/case-study-system.md` before adding a case study or changing a section component — in particular, case studies should not need their own breakpoint CSS, and only `MediaViewerLightbox.jsx` may import the lightbox library.

### Config layering, in general

A recurring pattern in this codebase: a hardcoded JS default (`crystalConfig.js`) is overlaid by a validated JSON layout config (`src/config/layout/*.json`, schema-checked by `src/lib/layout/parseLayout.js`, picked desktop vs. mobile by `useLayoutConfig`), which is then overlaid by live runtime overrides from the in-app debug panel (`TabbedControlPanel`/`CrystalControls` in `App.jsx`). When debugging "wrong" camera/crystal values, check all three layers — the bug is often a stale or missing key at one layer rather than wrong math.

### Logging convention

Prefer `src/utils/logger.js`'s `createLogger(scope)` (`debug`/`info` gated behind `import.meta.env.DEV` + an optional `localStorage.crystalDebugLogs` scope filter; `warn` DEV-only; `error` always-on) over raw `console.*`. The codebase has a known backlog of ungated `console.log` calls in hot paths (see `docs/console-log-cleanup-plan.md`) — don't add new ones; migrate to `logger` when touching nearby code.
