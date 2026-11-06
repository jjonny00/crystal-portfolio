# Facet map

The facet map marks the current project with that project's own crystal
fragment. It is the overview's six-fragment layout drawn as a small flat glyph,
with the current fragment filled: shape says which project, position gives the
order, colour only confirms.

Where it shows: the project previews and the case studies. Not the hero, not the
overview (the 3D scene is the map there), not About.

Status: stage 2 of 6. Done: the outlines, the glyph, the review panel, and the
desktop marker beside the title (no input yet). Next: the index panel, the phone
button, the Next Project block.

## Sizes

- Desktop: the map is 42 x 68, about the height of a preview title's capitals,
  with a 58 x 76 target that narrows to keep clear of the content edge, never
  under 44 wide. It is shown from 1230px wide, where a case study's gutter (the
  strip outside `--page-edge`) reaches the 56px that target needs; below that
  the map is the phone's button.
- Phone: a 44px disc with a 20 x 32 map, chosen on device from four sizes
  (the brief's 18 x 28 read too small).

## Where it sits

Beside the title of the view it marks, centred on the capitals of the title's
first line: 24px left of a preview's title, and centred in the gutter left of a
case study's (which starts at the page edge). `FacetMapNav` measures the title
when the map comes in, when the project or view changes, and after a resize, and
glides to the new title as its copy comes in. The titles carry
`data-facet-map-title` (the project id on a preview, `case-study` on a case
study) so it can find them.

Every preview's title is at the same height: the copy blocks share the tallest
one's height (`useSharedProjectCopyHeight`), copy at the top, CTA at the bottom.
So between projects the map holds still, and it only travels between a preview
and its case study.

It stays fixed there: on a case study it keeps the title's height as the title
scrolls away. A preview's title is always where it was measured, because snap
scrolling settles every preview at the top of the screen.

## What it reads

`useFacetMapSelection` derives the map from App's state, the same state the
router mirrors into the URL: `viewMode`, `activeProjectId` and the settled scroll
section. It keeps no state of its own beyond what is on screen:

- While a scroll is in flight it holds what it shows, so the map does not blink
  out between projects.
- A new project comes in on the camera move's content beat
  (`projectRouteClock`), the moment the project's copy comes in. A newer
  selection replaces a pending one.
- It goes when a move away from the projects starts (to the overview or About),
  or once the reader settles anywhere that is not a project.
- A case study's project never changes while it is open, so scrolling one never
  moves the map.

On a case study the map takes the ink of the section under it: the overlay
reports the tone at the viewport's middle from the same scroll handler that
reports the tone under the nav.

## The outlines are generated

`src/data/facetMap.json` is written by `scripts/generate-facet-map.mjs`
(`npm run build:facet-map`). Don't edit it by hand. For each project, in
`projects.js` order:

1. **Which fragment.** The project's scene key, from `getSceneFacetKeyByProjectId`
   (the lookup the camera, the overview labels and the glow use), and the GLB the
   scene loads at that key, from `getProjectModelKeyByFacetKey`.
2. **Where it sits.** That GLB placed at the key's exploded position, with its
   base rotation, from `desktop.json` over `crystalConfig.js` (the order
   `Fixed3DCanvas` merges them in).
3. **How it looks from the overview.** Every vertex projected through the desktop
   overview camera (position, target, offsets, fov).
4. **Its outline.** The convex hull of those points, normalised with the other
   five into one shared viewBox.

It runs once, offline. Nothing tracks the live scene, so the idle drift and the
camera's moves never reach the map.

The desktop overview is used on every device. The phone's overview camera sits
lower and further back, and from there Mesa and Flying Axes overlap in 2D.

`npm run build` runs the generator with `--check` first and fails if the
committed JSON no longer matches the inputs. When a fragment GLB, an exploded
position or the overview camera changes, run `npm run build:facet-map` and commit
the result.

Checked against the running app (Nov 2026): projected from the live overview
camera, the real fragment meshes land on the generated outlines, within 0.3 to 3%
of the composition's height. The difference is the overview's idle drift.

## Fragment to project

The project ids, scene keys and GLB files are three separate numberings. This is
what the scene draws, confirmed by the lookups above, `projectSceneKeyById` in
`crystalConfig.js`, and the Blender object names noted in `assetPaths.js`:

| # | Project | Scene key | GLB |
|---|---|---|---|
| 01 | Slipstream | leadership | Project05.glb |
| 02 | Mesa | exploration | Project06.glb |
| 03 | FundSeeder | craft | Project03.glb |
| 04 | Flying Axes | system | Project04.glb |
| 05 | Forest Giant | narrative | Project02.glb |
| 06 | GE Experience Centers | empathy | Project01.glb |

Don't restate this table in code: the generator reads it from the same helpers
the scene uses, so a change to `projects.js` reaches the map on the next run.

## Colour

The current fragment takes the project's `headlineColor` from `projects.js`, the
colour its preview title and CTA are set in. On a case study it takes the page's
ink instead (the tone under the map), never a project colour.

## Reviewing it

In DEV or on a Netlify deploy preview, open any page with `?facetMapPreview`
(for example `/work?facetMapPreview`, to compare it with the overview it is
traced from). It shows the map large with each fragment numbered, and the states
at actual size: rest, hover, the case-study ink variant and the phone button. It
stays on for the tab; `?facetMapPreview=0` turns it off. It is never in a
production build: deploy previews get it from `VITE_REVIEW_TOOLS` in
`netlify.toml`, which production does not set.
