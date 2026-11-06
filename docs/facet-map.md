# Facet map

The facet map marks the current project with that project's own crystal
fragment. It is the overview's six-fragment layout drawn as a small flat glyph,
with the current fragment filled: shape says which project, position gives the
order, colour only confirms.

Where it shows: the project previews and the case studies. Not the hero, not the
overview (the 3D scene is the map there), not About.

Status: stage 4 of 6. Done: the outlines, the glyph, the review panel, the
desktop map in the gutter, the index it opens, and the button below 1230px and
on phones. Next: the Next Project block at the end of each case study.

## Sizes

- Desktop: the map is 42 x 68, about the height of a preview title's capitals,
  with a 58 x 76 target that narrows to keep clear of the content edge, never
  under 44 wide. It is shown from 1230px wide, where a case study's gutter (the
  strip outside `--page-edge`) reaches the 56px that target needs; below that
  the map is the phone's button.
- Phone: a 49px disc (44px on a tablet) with a 20 x 32 map, chosen on device from four sizes
  (the brief's 18 x 28 read too small).

## Where it sits

One place, on every preview and case study, so it never moves as you go
between projects or open and close a case study:

- Across: the middle of the left gutter (the strip outside `--page-edge`). A
  case study's content starts at the page edge, so anything further in would
  sit on it below about 1900px wide.
- Down: level with the capitals of the preview titles. Every preview's title is
  at the same height, because the copy blocks share the tallest one's height
  (`useSharedProjectCopyHeight`), copy at the top and CTA at the bottom.

`FacetMapNav` takes that height from a preview title (they carry
`data-facet-map-title`) and its place in its section, so it holds wherever the
portfolio is scrolled. It measures again when the title's copy block or section
changes size. Arriving on a case study's own URL, the portfolio behind it
mounts a few seconds after the page, and the map comes in once it has.

## The index

On desktop the map is a button ("Project index. Current project: Mesa",
`aria-expanded`). Hover, keyboard focus or a click opens the index: a card that
grows out of the map into the page, with the map again at 101px tall beside the
six projects, numbered in the map's order. The current one says "You are here"
and carries `aria-current`, so it reads in words as well as colour. Last comes
"View crystal overview".

- Pointing at a name or a fragment lights that fragment (its colour as an
  outline over a 35% fill) and the row together. Nothing is selected by it.
- A project goes to its preview, the way an overview label does (App's
  `handleFacetMapProjectSelect`). From a case study, the case study closes first
  and the scene moves on from under it. The current project only closes the
  index: no move, no scroll.
- "View crystal overview" is the nav's Work.
- Escape (focus goes back to the map), a click outside, focus leaving, or the
  pointer leaving for 240ms closes it. Opened by hover, it closes on leaving;
  opened by a click or the keyboard, it stays until one of the others.
- The card covers the map it grew from, so the pointer's way in never crosses
  a gap. It keeps 12px from the window's edge and stays below the nav.
- The rows are real links (`/work/<slug>`), so they open in a new tab or copy
  like any other.

Over a preview whose copy is set dark (FundSeeder's light scrim), the map's
resting outlines take that ink rather than white.

## The button (below 1230px, and phones)

Narrower than `MQ_FACET_MAP_GUTTER` (1230px) the gutter can't hold the map,
and it becomes a dark disc with the map 32px tall inside it, in white with the
current fragment in its colour. Where it sits (`data-place`):

- **The bottom row** (`'bottom'`): on a phone (the portfolio's mobile layout,
  below `MQ_DESKTOP`), the right of the screen's last row, on a preview and a
  case study alike, so it never moves between them. The row is a filled button
  (the hero CTA's shape) and the disc, both the button's height (49px), the
  card's edge (`--project-card-edge`, 21px) from the screen's sides and
  bottom, 12px apart (`--bottom-row-*`, `index.css`). On a preview the
  button is the card's CTA, in the card's ink with the label in its fill; on a
  case study it is the way out (`.cs-back`), "Close case study", in the same
  colours, since the card takes the case study hero's. The disc is solid
  there, as the button is: the case study scrolls under both. The CTA labels
  share one size, 21px where the row has room and less where it doesn't, so
  the longest still fits (`ProjectFocusSection`).
- **At the top** (`'top'`): from 768px to 1229px, on a preview and a case
  study, 44px across (rgba(17, 19, 24, 0.88)), the top right, 12px under the
  nav, its right edge on the nav's (`--page-edge`). A case study's title keeps
  56px clear at its right end there (`caseStudy.css`), so a long one wraps
  rather than running under the disc.

Every phone card is as tall as the tallest (`useSharedProjectCopyHeight`, the
hook that lines up the desktop titles), copy from the top and the CTA at the
bottom, so the cards' top edges line up from project to project too.

A tap opens the index from it: the map, "Projects", a close button where the
disc was, the six projects in rows at least 50px tall, and "View crystal
overview". It spans the page between its edges, up to 400px, held to the right.
At the top it drops down; from the bottom it rises, its header at its foot so
the close button is over the disc, and stops short of the nav. Short of room (a
small phone, one on its side), the list scrolls inside it and the header stays
put.

- Only a tap, a click or the keyboard opens it. Hover and focus don't: it is a
  tap target, and at a narrow window a mouse clicks it like one.
- It takes no swipes. The page scrolls under the reader's thumb as before; a
  swipe that starts on the disc itself doesn't scroll, as on the nav.
- A touch outside closes it and does nothing else: the tap that dismisses the
  index doesn't also open what's under it. A swipe outside closes it and
  scrolls.
- The page scrolling by any other means (a wheel, the keyboard) closes it too,
  in both layouts.

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
