# Loader

The first screen, from boot until the scene is ready. Code: `src/ui/LoaderV2.tsx`
(view), `src/loader/` (what it measures). Every ring tracks real work; nothing on
it is simulated.

## Stages

Three rings, outermost first, in the order the work starts. The status line names
whichever stage is holding things up.

| Ring | Copy | Measures | Reported by |
|---|---|---|---|
| outer | Loading portfolio | Bytes of the app chunk and of the files every tier needs | `src/loader/downloads.js` (group `boot`); on a dev server, `devModuleProgress.js` for the app's code |
| middle | Adjusting to your device | The performance test that picks the quality tier (instant when its result is cached) | `usePerformanceV2` |
| inner | Preparing scene | Bytes of the files the test chose (crystal and project meshes, HDRI), then the scene mounted behind the loader: canvas created, Suspense resolved (models, HDRI, textures parsed), materials applied, shader warmup (`SceneWarmup`), first frames drawn | `downloads.js` (group `tiered`), then `markScenePrep` calls in `Fixed3DCanvas` and `UnifiedCrystalScene` |

The tier's files are counted in the scene ring rather than the outer one because
they can't start until the test is done: in the outer ring they made it stall for
the whole test and then jump.

All three write to one store, `src/loader/loadProgress.js`. The loader is mounted
once, by `main.jsx` (outside App, before the app chunk exists), and reads the
store; App says when it shows and leaves through `setLoaderPresentation`. A ring
never moves backwards: if the download total grows (the tier settles which files
are needed), the ring holds until the bytes catch up.

## Pipeline

1. **Boot** (`main.jsx`): render the loader, start the app chunk and the loader's
   fonts, and register every file all tiers share (`startBootDownloads`). Their
   fetches wait for the fonts, which otherwise lose the connection to them and
   arrive seconds late. A returning visitor's cached tier is known here, so their
   tiered files start too.
2. **App mounts**: the performance test runs; when it settles, the tier's files
   are requested (`requestTieredDownloads`).
3. **Downloads done**: the bytes are put in `THREE.Cache` (`threeCache.js`), so
   the scene's own loaders (useGLTF, useTexture, drei's Environment, the material's
   TextureLoader) parse them instead of fetching again. The scene mounts behind the
   loader with the camera intro held at its first frame (`introHold`) and the
   content's entrance animations held (`ScrollablePortfolio`'s `revealed`).
4. **Scene ready**: the rings are full and the diamond's last third has filled
   (`LOADER_COMPLETE_PULSE_MS`). Then the loader fades, the intro and the content
   are let go, and `THREE.Cache` is cleared and turned off.

Sizes for the outer ring come from `public/` at build start (`vite.config.js`
defines `__LOADER_ASSET_BYTES__`). The app chunk can't be counted as a module
import (an import reports no progress), so `main.jsx` fetches it first, byte by
byte, then imports it from the HTTP cache (`/_app/*` is immutable). The
`loader-app-chunk-info` plugin writes its URL and its decoded and compressed sizes
into the entry; its share of the ring is weighted by the compressed size, which
is what the time goes on.

A dev server has no app chunk: it serves the app as ~110 modules requested as the
import graph unfolds. `devModuleProgress.js` counts them as they arrive against
how many the last dev load took, and weights them by how long that load took
(both remembered in localStorage; the first dev load in a browser guesses).

**Keeping it honest.** Every URL in `src/loader/sceneAssets.js` must be exactly
the one the scene asks for (paths live in `src/config/assetPaths.js` for that
reason). A mismatch doesn't break anything, but the file is downloaded twice and
the ring counts the wrong one.

## Layout

From the comp, top to bottom, centred:

- Wordmark `J. JON SHAW`: IvyPresto Display, the nav's tracking (-0.025em), 33px
  (30px under 480px wide). Not a heading: the hero headline is the page's `h1`.
- `PRODUCT DESIGNER`: `type-subhead-sm`.
- Meter, 144 × 168px SVG at 1:1, rings centred 72px from its top: radii 69.25 /
  57.75 / 46.25, 1.5px strokes, round caps, each starting at 6 o'clock and filling
  clockwise. The track is the ring's colour at 16%. While a ring's stage is
  working, a pulse sweeps its filled arc from the start to the leading edge every
  2.2s, fading in and out: the hero energy line's colours and color-dodge blend,
  as a comet whose bright spot leads — a white head, cyan behind it, an indigo
  tail (three dashes whose fronts line up). A full ring is still. No pulse under
  reduced motion.
- Percentage inside the rings: the time-weighted total (see Percentage), 30px Acumin 600 with
  a raised `%` at 0.55em. Only the digits are centred; the `%` hangs off their
  right edge so it doesn't pull the number off-centre. A readout, so it is styled
  locally.
- Diamond (`public/assets/ui/diamond.svg`, inlined): 78px tall, its top 16px below
  the rings' centre, so it runs past the outer ring. Its outline (plus a 7-unit
  stroke) is masked out of the rings, so they break around it and the background
  gradient shows through the gap.
- Status: `type-subhead-sm`, always two lines (`Loading / portfolio`, `Adjusting
  to / your device`, `Preparing / scene`), `aria-live="polite"`. On a change the
  old label fades out (260ms) while the new one fades in rising 8px (550ms, 120ms
  in).

The meter is a `role="progressbar"` with the percentage as its value.

## Colour

The hero's palette, so the hand-off reads as one scene. Sampled from the hero as
it renders, not invented for the loader:

| | | Source |
|---|---|---|
| Background | desktop: `#1a1219` → `#2a2730`, top to bottom (`--sky-top` / `--sky-bottom`, index.css), the sky behind the crystal (`projectBackgrounds.js` default, after tone mapping); phones: solid `#2a2730` (`--phone-ground`), the same colour as the page and the frame's corners there, so Safari's bars match the corners during the load and after it | |
| Outer ring | `#384ce6` | blue-violet |
| Middle ring | `#3c83e5` | blue |
| Inner ring | `#3abebe` | teal |
| Wordmark | `#fffcee` | the headline ink (hero, About) |
| Subtitle, status | ink at 70% | |
| Percentage | ink at 88% | |

## Diamond

Starts in its own cream (`#feffde`). As each ring completes, its colour washes
over the whole diamond from right to left (0.9s), on top of the one before, so it
ends in the colour of the last stage to finish. The wash sweeps in under a mask
whose leading edge is a soft band (22 of the diamond's 42 units wide) rather than
a line, so the new colour blends into the one beneath as it crosses. Each wash is
a vertical gradient of its ring's colour (a light tint at the top, the colour, a
deeper shade at the foot) that drifts slowly up and down. A glow in the latest
wash's colour grows with each one. App holds the hand-off 1100ms after the last
ring (`LOADER_COMPLETE_PULSE_MS`) so its wash lands and the diamond holds a beat.
Reduced motion: washes fade in where they are, nothing drifts, and the hand-off
doesn't wait.

## Percentage

Weighted by time, not by stage: each part counts for as long as it should take.
Downloads by bytes over the throughput measured while fetches are in flight
(10 Mbps until ~64KB has arrived), the device test by its length (3s, or 5.5s
once the high-tier test runs; nothing when cached; its real duration once done),
and preparing the scene by 1.5s, split across its steps. The scene ring splits
its two parts (the tier's files, then preparation) the same way. A part that is
over in an instant, like every download on a fast connection, barely moves it.
Never goes backwards: when an estimate grows, it holds until the work catches up.

## Exit

Unchanged from before: content fades over 420ms, the overlay starts fading 520ms
in, and App unmounts the loader at 520 + 3360ms.

## Entrance and fonts

Typekit serves its faces with `font-display: auto`, so text would be hidden and
then pop in. The loader shows nothing (just its background) until IvyPresto and
Acumin are both in, then fades up the wordmark, role, meter and status 150ms
apart. The wait is capped at 3s; past it the loader comes in anyway with its
Acumin text in a system face until Acumin arrives (the only case that still
swaps).
