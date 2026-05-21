# Camera Overview → Project Shadow Instrumentation (PR-9)

## Scope
This instrumentation is **DEV-only, shadow-only, and read-only**. It observes existing Overview → Project behavior and does not drive camera movement, suppress writers, or enable CameraDirector pilot behavior.

## What is sampled
During Overview → Project transitions, samples capture:
- Timing/state: `cameraMoveProgress`, `state`, `cameraState`, `viewMode`, `focusedProject`, `selectedProject` (if present), frame number, and frame delta.
- Transition lifecycle: inferred start, inferred completion, approximate duration in seconds and frames.
- Composition/live camera: live camera position, derived live lookAt (forward vector), `fov`, and `filmOffset`.
- Current target: `currentTarget.position`, `currentTarget.lookAt`, `currentTarget.fov`.
- Resolved destinations: resolved overview pose and resolved project pose via `resolveCameraDestination` when available.
- Delta checks:
  - Live vs resolved overview deltas at transition start.
  - Live vs resolved project deltas at completion.
  - Per-sample live vs resolved project positional/look deltas.
- Facet coupling snapshot (if available from scene): focused facet key/project id, focus rotation progress, approximate facet rotation progress, and cameraMoveProgress.

## Manual helper commands
In DEV console:
- `globalThis.__printOverviewProjectTimingSummary()`
  - Prints current/last transition summary including start/completion and duration.
- `globalThis.__printOverviewProjectTimingSamples()`
  - Prints bounded sample buffer.
- `globalThis.__clearOverviewProjectTimingSamples()`
  - Clears buffered samples.

## Bounded diagnostics behavior
- Default behavior is silent except explicit helper calls.
- Samples are bounded (ring-style truncation) to avoid console flooding.

## How to test
1. Run app in DEV.
2. Navigate to overview.
3. Select a project to trigger overview → project.
4. Wait for camera settle.
5. Call helper commands above and capture outputs.
6. Repeat across several projects/devices/layouts for parity evidence.

## Values needed before retrying pilot
Collect and compare:
- Start contamination deltas (live vs resolved overview).
- Completion deltas (live vs resolved project).
- Real transition duration distribution (frames + seconds).
- `cameraMoveProgress` curve shape over time.
- Whether facet rotation progression tracks `cameraMoveProgress` and whether camera settles before facet progression completes.

## Explicit non-goals
This PR does **not**:
- Change runtime camera behavior.
- Change camera writes or writer ownership.
- Enable CameraDirector pilot.
- Migrate/suppress any camera paths.
- Touch Hero ↔ Overview behavior or About bugs.
- Tune fragments/particles/glow/ring/project facet behavior.
