# Crystal Portfolio

A React + Vite project showcasing a 3D crystal scene. The app adapts its rendering quality based on the visitor's device and a short performance test.

## Performance manager (`usePerformance`)

`usePerformance` exposes the active performance profile detected by `PerformanceManager`. The hook returns:

- `profile` – current performance settings
- `isReady` – `true` once the manager has finished its initial test
- `updateProfile(tier)` – manually set the performance tier

Profiles are defined in [`src/utils/deviceProfiles.js`](src/utils/deviceProfiles.js). Use `updateProfile` to override the detected tier at runtime.

### Debugging in production

To inspect the device and performance profiles in a live build you can toggle the debug panel at any time by pressing **P**. This sets `window.__PERF_DEBUG__` to `true` and re‑pressing **P** hides it again.

## Customising performance settings

Performance presets for each device tier live in [`src/utils/deviceProfiles.js`](src/utils/deviceProfiles.js). To tweak defaults edit those profiles. Use `updateProfile` from `usePerformance` to switch tiers at runtime.
The predefined tiers are `high`, `medium`, `low` and the new `very-low` profile for extremely slow hardware.

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

