# Facet map

The facet map marks the current project with that project's own crystal
fragment. It is the overview's six-fragment layout drawn as a small flat glyph,
with the current fragment filled: shape says which project, position gives the
order, colour only confirms.

Where it shows: the project previews and the case studies. Not the hero, not the
overview (the 3D scene is the map there), not About.

Status: stage 4 of 6. Done: the outlines, the glyph, the review panel, the
dock and the phone's disc, and the index they open. Next: the Next Project block
at the end of each case study.

## Where it sits

Always the screen's bottom right, on every preview and case study, so it never
moves as you go between projects or open and close a case study. It mirrors the
case study's close button (`.cs-back`) at the bottom left: the same distance
from the screen's edges, bottoms level. Two layouts (`data-layout`), by
`MQ_DESKTOP` (768px):

- **The dock** (`'dock'`, 768px and up, tablets included): the map alone,
  44 x 72, in a 104px circle in the index's dark (#070015) at 87%, whichever
  project: white outlines, the current fragment in its colour. No name beside
  it: the project's name is already on screen, large. Inset `clamp(16px, 2vw, 28px)` from the right and bottom,
  as the close button is from the left and bottom.
- **The disc** (`'button'`, a phone): the right of the screen's last row, the
  map alone (20 x 32) in a 49px circle in the close button's colours, the
  project card's (`lib/projectCardColors.js`): the card's ink for the fill, the
  map drawn in the card's fill (a dark fill with white outlines before any
  project has been shown), the card's edge (`--project-card-edge`,
  21px) from the screen's side and bottom (`--bottom-row-*`, `index.css`). On a
  preview the card's CTA fills the rest of the row, 12px from it; on a case
  study the close button is a circle the disc's size at the row's left. The CTA
  labels share one size, 21px where the row has room and less where it
  doesn't, so the longest still fits (`ProjectFocusSection`). The hero's CTA
  sits in the same row (`--mobile-bottom-inset`).

Held through a move between projects, when no project is marked, the disc keeps
the last project's colours, so it doesn't change colour on the way out; the map lets go of the current fragment as the move starts.

## The index

The map is a button ("Project index. Current project: Mesa", `aria-expanded`).
Its index is a dark card (#070015) with the six projects in the map's order, by name, and
"View All Work" last (`VIEW_ALL_WORK_LABEL`, `siteCopy.js`: the same words as a
case study's way out when it was opened from its own URL, since both go where
the nav's Work does). The current one's name is in its project's colour
and carries `aria-current` (the brief's "identifiable without colour" now rests
on its fragment being filled on the map beside it, and on screen readers).

- A project goes to its preview, the way an overview label does (App's
  `handleFacetMapProjectSelect`). From a case study, the case study closes first
  and the scene moves on from under it. The current project only closes the
  index: no move, no scroll.
- "View All Work" is the nav's Work.
- Escape (focus goes back to the map), a press outside (which does nothing
  else: the click it ends in is dropped), or the page scrolling closes it.
- The rows are real links (`/work/<slug>`), so they open in a new tab or copy
  like any other.

**From the dock** it rises over it from its corner: the names, the map beside
them at the list's height (260px), and "View All Work" across the foot. The map
grows to that out of the dock's: closed, it is scaled down to the dock map's
size exactly over it (`facet-map.css`), and opening it scales up and rises into
place. The card covers the dock, so the pointer's way in never crosses a gap. Hover, keyboard focus or a click opens it; opened by hover
it closes when the pointer has been off it for 240ms, opened by a click or the
keyboard it stays until one of the above, or focus leaving. Pointing at a name or
a fragment lights that fragment (its colour as an outline over a 35% fill) and
the row together; nothing is selected by it. A click or tap on a fragment
chooses its project, as its name does, from either index. (The index is
focusable, `tabIndex=-1`, so a press on a fragment keeps focus inside it; it
closes when focus leaves.)

**From the disc** it rises across the width between the page's edges, up to
400px, the same way: the names, the map beside them (half the index's width, up
to 300px tall, about the list's height; measured in `FacetMapNav`, the names
wrapping beside it) growing out of the disc's, and a foot row
the disc's height with "View All Work" and a close button exactly where the disc
was. Rows are at least 50px tall. Short of room (a small phone, one on its
side), the list scrolls inside it and the foot stays put.

- Only a tap, a click or the keyboard opens it. Hover and focus don't: it is a
  tap target, and a mouse at a phone's width clicks it like one.
- It takes no swipes. The page scrolls under the reader's thumb as before; a
  swipe that starts on the disc itself doesn't scroll, as on the nav. A swipe
  outside closes it and scrolls.

## What it reads

`useFacetMapSelection` derives the map from App's state, the same state the
router mirrors into the URL: `viewMode`, `activeProjectId` and the settled scroll
section. It keeps no state of its own beyond what is on screen:

- While a scroll is in flight the map stays up, so it does not blink out
  between projects, but the project being left goes back to rest as soon as
  the scroll starts: no fragment is filled until the next one arrives.
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

The current fragment is filled in its colour with a dark 1px outline
(#161A32) outside its edge (a 2px stroke painted under the fill; on a phone the
outline is the fill behind the map instead, the disc's or the index's, so it
reads as a gap around the fragment) and glows in its own colour: two halos, 8px at 25% and 25px at 50%
(as a box-shadow's blur), drawn as an SVG filter in `FacetMapGlyph` since
box-shadow doesn't reach SVG shapes and Safari ignores CSS filters on them. The
halos are full size from the dock's 72px map up and shrink in proportion on
smaller maps (the phone's disc).

On the disc the map is drawn in the project card's fill, current fragment
filled, on the card's ink; on the dock, white outlines on the index's dark with
the current fragment in its colour (see Where it sits). In the index's dark card
the current fragment and name take the project's `headlineColor` from
`projects.js`, the colour its preview title and CTA are set in.

## Reviewing it

In DEV or on a Netlify deploy preview, open any page with `?facetMapPreview`
(for example `/work?facetMapPreview`, to compare it with the overview it is
traced from). It shows the map large with each fragment numbered, and the states
at actual size: rest, hover, the case-study ink variant and the phone button. It
stays on for the tab; `?facetMapPreview=0` turns it off. It is never in a
production build: deploy previews get it from `VITE_REVIEW_TOOLS` in
`netlify.toml`, which production does not set.
