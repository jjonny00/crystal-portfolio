# Crystal Portfolio

A React + Vite project showcasing a 3D crystal scene. Rendering quality is tuned by running a short benchmark at startup to choose an appropriate performance profile. The benchmark always begins at a safe medium tier and only attempts high quality after the medium test averages at least **70 FPS** with a **65 FPS** minimum. High tier is selected only when a follow‑up test stays above **55 FPS** average and **50 FPS** minimum and the device passes hardware capability checks. If medium can't keep up the manager falls back to a low tier. At runtime the performance manager averages FPS over the last five seconds to dynamically downgrade or upgrade quality tiers.

## Performance manager (`usePerformanceV2`)

`usePerformanceV2` exposes the active profile managed by `PerformanceManagerV2`. When the app starts the manager renders a minimal scene (`RuntimePerformanceTest`) and assigns one of three tiers. The benchmark now includes a short 200 ms warm‑up period and runs three iterations of the 1.5 s test, averaging the results before deciding which tier to use. These averaged metrics are cached so the test only reruns when needed. Cached high‑tier results are validated against the current app version and hardware fingerprint (user agent and device pixel ratio) before reuse:

- `high` – fast desktop or mobile hardware
- `medium` – mid‑range devices
- `low` – slower devices

The hook returns:

- `profile` – current performance settings
- `isReady` – `true` once the benchmark has completed
- `updateProfile(tier, overrides?)` – manually switch tiers and optionally
  override specific settings (e.g. `updateProfile('low', { simplifiedAnimations: false })`)
- `tier` – active tier name

Profiles are defined in [`src/utils/deviceProfiles.js`](src/utils/deviceProfiles.js). Call `updateProfile` or use the performance controls in the debug panel to override the selected profile at runtime.

### Debugging in production

To inspect the active performance profile in a live build you can toggle the debug panel at any time by pressing **P**. This sets `window.__PERF_DEBUG__` to `true` and re‑pressing **P** hides it again.

## Customising performance settings

Performance presets for each tier live in [`src/utils/deviceProfiles.js`](src/utils/deviceProfiles.js). To tweak defaults edit those profiles. You can also press **P** to open the performance controls panel and adjust settings or call `updateProfile` to force another tier. The predefined tiers are `high`, `medium` and `low`.

## Development

Install dependencies and start a dev server:

```bash
npm install
npm run dev
```

## Building for production

```bash
npm run build
# Optional preview of the dist folder
npm run preview
```

The build output is placed in `dist/`.

## Quality checks

Before committing changes, run:

```bash
npm run build
npm run preview
```

`npm run build` verifies the production bundle compiles, and `npm run preview` serves the generated `dist/` output for a quick smoke test.

