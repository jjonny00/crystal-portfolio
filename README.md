# Crystal Portfolio

A React + Vite project showcasing a 3D crystal scene. The app adapts its rendering quality based on the visitor's device and a short performance test.
A React + Vite project showcasing a 3D crystal scene. Rendering quality is tuned by running a short benchmark at startup to choose an appropriate performance profile.

## Performance manager (`usePerformance`)

`usePerformance` exposes the active performance profile detected by `PerformanceManager`. The hook returns:
`usePerformance` exposes the active profile managed by `PerformanceManager`. When the app starts the manager renders a minimal scene (`RuntimePerformanceTest`) and assigns one of three tiers:

- `high` – fast desktop or mobile hardware
- `medium` – mid‑range devices
- `low` – slower devices

The hook returns:

- `profile` – current performance settings
- `isReady` – `true` once the manager has finished its initial test
- `updateProfile(tier)` – manually set the performance tier
- `isReady` – `true` once the benchmark has completed
- `updateProfile(tier)` – manually switch tiers

Profiles are defined in [`src/utils/deviceProfiles.js`](src/utils/deviceProfiles.js). Use `updateProfile` to override the detected tier at runtime.
Profiles are defined in [`src/utils/deviceProfiles.js`](src/utils/deviceProfiles.js). Call `updateProfile` or use the performance controls in the debug panel to override the selected profile at runtime.

### Debugging in production

To inspect the device and performance profiles in a live build you can toggle the debug panel at any time by pressing **P**. This sets `window.__PERF_DEBUG__` to `true` and re‑pressing **P** hides it again.
To inspect the active performance profile in a live build you can toggle the debug panel at any time by pressing **P**. This sets `window.__PERF_DEBUG__` to `true` and re‑pressing **P** hides it again.

## Customising performance settings

Performance presets for each device tier live in [`src/utils/deviceProfiles.js`](src/utils/deviceProfiles.js). To tweak defaults edit those profiles. Use `updateProfile` from `usePerformance` to switch tiers at runtime.
The predefined tiers are `high`, `medium`, `low` and the new `very-low` profile for extremely slow hardware.
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