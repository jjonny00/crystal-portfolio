# Crystal Portfolio

A React + Vite project showcasing a 3D crystal scene. The app adapts its rendering quality based on the visitor's device and a short performance test.

## Device detection (`useDeviceProfile`)

`useDeviceProfile` runs on start up and determines the current device type and a recommended performance profile. The hook provides:

- `deviceProfile` – information about the platform (mobile, tablet, desktop, etc.)
- `performanceProfile` – initial performance settings based on that device
- `uiProfile` – UI layout hints for responsive design
- `isDetecting` – `true` while device capabilities are being measured

Options such as `enableDebugLogging`, `enableOrientationLock` and `enableProfileOverride` can be passed to the hook for additional control. Profiles are defined in [`src/utils/deviceProfiles.js`](src/utils/deviceProfiles.js).

The returned `updateExternalPerformanceConfig` function allows you to override the automatic profile at runtime (for example from the "Performance" tab in the UI).

### Debugging in production

To inspect the device and performance profiles in a live build you can toggle the debug panel at any time by pressing **P** or by using the "Show Debug Panel" button under the *Performance* tab of the settings UI. Both methods set `window.__PERF_DEBUG__` to `true` and pressing the control again hides it.

## One‑time performance test

After the device profile is resolved the app runs `useInitialPerformanceTest`. This hook measures the FPS for about four seconds and adjusts the performance profile if necessary. The test runs only once on first load. When complete, the resulting profile is stored via `updateExternalPerformanceConfig`.

While detection and the FPS test are running the `LoadingScreen` component keeps the UI hidden. You can edit the loader styles or text in [`src/components/ui/LoadingScreen.jsx`](src/components/ui/LoadingScreen.jsx).

## Customising performance settings

Performance presets for each device tier live in [`src/utils/deviceProfiles.js`](src/utils/deviceProfiles.js). To tweak defaults edit those profiles. To override the active settings at runtime call `updateExternalPerformanceConfig` with a custom configuration object. You may also enable the manual `overrideProfile` helper exposed by `useDeviceProfile` when developing.
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

