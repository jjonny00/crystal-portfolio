# Flying Axes case study assets

Shipped media for the Flying Axes case study, imported by
`flyingAxesContent.js` rather than served from `/public` — see
`src/caseStudies/mesa/assets/README.md` for why, and for how a placeholder is
replaced (`src`, not `placeholder`).

Every file here was made from the supplied originals, not re-exported from
them: cropped where the page needs a particular frame, converted to WebP, and
sized to roughly what a retina screen can use (photographs at q72, graphics at
q80).

## Status

Slots follow the finishing pass (November 2026).

| Slot | Asset | Made from |
| --- | --- | --- |
| `hero.media` | `venue-lanes.webp` | `flying axes-60.jpg`, resized, 3:2 — the cage, uncropped (the package's `axes-cage.webp` is a smaller crop of the same photo) |
| `coach.scoreboard` | `scoreboard.webp` | `board_fa.jpg`, cropped to 943×629 (3:2) around the board, native resolution. Callout positions in the content file are measured against this crop, so re-cropping means re-measuring them. |
| `coach.gallery` | `coach-tablet.webp` · `scorecard.webp` | `flying axes-101.jpg` · `scorecard_01.jpg`, resized |
| `freeform.formats` | — | Drawn live by `GameModesComparison.jsx` |
| `freeform.booklet` | `booklet-twenty-one.webp` | `Index_Prep_Cards.pdf` page 13, rendered flat at 4× (1440×864); the package's `axes-twenty-one.webp` is a smaller copy |
| `venues.system` | — | Drawn live by `VenueSystem.jsx`: local functions only, no device wiring or transport |
| `venues.steps` | `build-display-test.webp` · `scoreboard-hardware.webp` · `build-install.webp` | The build strip under the diagram, rendered by `MediaRail`: tested, wired, installed. `scoreboard-hardware` is `backside.jpg`, unchanged frame. |

Not imported any more: `hero.webp` (the group photo), `scoreboard-in-venue.webp`,
`booklet-handicaps.webp`, `booklet-games.webp` and `session-mapping.webp`. The
score-entry placeholder is gone; a straight-on capture of the original coach
controls, if one is archived, is the first optional capture.
