# Console Log Audit + Cleanup Plan

Date: 2026-04-02

## Quick Inventory
- Total `console.*` statements found in `src/`: **215**
- Statements not obviously gated by `import.meta.env.DEV` / debug flags: **144**
- Highest-volume files:
  - `src/components/three/UnifiedCrystalScene.jsx` (45)
  - `src/components/three/MaterialManager.jsx` (20)
  - `src/hooks/useUnifiedAnimationController.js` (18)
  - `src/utils/PerformanceManagerV2.js` (12)
  - `src/utils/AssetLoaderV2.js` (12)
  - `src/components/three/UnifiedCameraController.jsx` (12)

## Excessive Logs To Remove or Gate First (Priority List)

### 1) High-frequency runtime/debug traces in render/animation paths
- `src/components/three/UnifiedCrystalScene.jsx`
  - Examples include repeated state/change traces and per-event diagnostics (e.g. connector counts, focus-change logs, hover logs, anchor verification logs).
  - Representative lines: `962-967`, `1451-1520`, `1564-1593`, `2019`.
- `src/hooks/useUnifiedAnimationController.js`
  - Multiple zone/project transition logs fire often during scrolling.
  - Representative lines: `886`, `935-943`, `977-1003`, `1021-1022`.
- `src/components/three/FractureBurstParticles.jsx`
  - Verbose particle lifecycle dumps suitable only for short-term debugging.
  - Representative lines: `124`, `146-148`, `228-244`, `308`, `392`, `400`.

### 2) Material/camera diagnostic spam
- `src/components/three/MaterialManager.jsx`
  - Material creation/update logs are very chatty and include repeated environment-map updates.
  - Representative lines: `48-53`, `129`, `300`, `349`, `429-443`.
- `src/components/three/UnifiedCameraController.jsx`
  - Frequent camera-target/anchor traces and state logs.
  - Representative lines: `206`, `620`, `686`, `701`, `773`, `1125`.

### 3) Load/performance progress chatter
- `src/utils/AssetLoaderV2.js`
  - Startup/progress/completion logs should be behind a debug logger.
  - Representative lines: `262`, `323`, `443`.
- `src/hooks/useAssetLoaderV2.js`
  - Progress updates and start/complete logs are noisy during load.
  - Representative lines: `68`, `116`, `182`, `208`, `235`, `267`.
- `src/utils/PerformanceManagerV2.js` and `src/hooks/usePerformanceV2.js`
  - Performance profiling lifecycle logs are useful during tuning but too verbose for normal runs.
  - Representative lines: `44`, `58`, `75`, `477`, `501`; and `33`, `60`, `74`, `114`, `190`.

## Cleanup Plan (Implementation)

### Phase 1 — Immediate noise reduction (safe, low risk)
1. Remove obvious one-off debug `console.log` calls that do not affect behavior.
2. Gate all non-critical logs behind a single helper (`logger.debug`) conditioned on `import.meta.env.DEV` + optional `localStorage` debug flag.
3. Keep `console.error` for true failures; convert warning/info diagnostics to helper-based debug logs.

### Phase 2 — Centralize logging
1. Add `src/utils/logger.js` with methods: `debug`, `info`, `warn`, `error`.
2. Ensure `debug`/`info` no-op in production by default.
3. Support scoped channels (e.g. `logger.scope('camera')`) to toggle targeted debugging only.

### Phase 3 — Migrate top offenders first
1. `UnifiedCrystalScene.jsx`
2. `useUnifiedAnimationController.js`
3. `MaterialManager.jsx`
4. `UnifiedCameraController.jsx`
5. `FractureBurstParticles.jsx`
6. Asset/performance hooks + utils

### Phase 4 — Guardrails
1. Add ESLint policy to prevent accidental `console.log`/`console.debug` in committed code (except in `logger` utility).
2. Add a CI check to fail on unmanaged console statements.

## Definition of Done
- No raw `console.log` / `console.debug` left in app runtime paths.
- Production keeps only actionable `warn`/`error` (or routes them through logger).
- Debug verbosity can be toggled without code edits.
