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

| Slot | Asset | Made from |
| --- | --- | --- |
| `hero.media` | `hero.webp` | `356A4943.jpg`, resized; the hero crops it to its standard frame |
| `overview.media` | `venue-lanes.webp` | `flying axes-60.jpg`, resized, shown at its own 3:2 |
| `match.scoreboard` | `scoreboard.webp` | `board_fa.jpg`, cropped to 943×629 (3:2) around the board, native resolution. Callout positions in the content file are measured against this crop, so re-cropping means re-measuring them. |
| `match.venue` | `scoreboard-in-venue.webp` | `356A4435.jpg`, cropped to 3:2 **from the top** so the mounted scoreboard stays in frame |
| `coach.gallery` | `coach-tablet.webp` · `scorecard.webp` | `flying axes-101.jpg` · `scorecard_01.jpg`, resized |
| `changeTheGame.steps` | `session-mapping.webp` | `7R3A5920.webp`, resized, full 3:2 frame |
| `changeTheGame.steps` | `booklet-handicaps.webp` · `booklet-games.webp` · `booklet-twenty-one.webp` — with the photo above, rendered by `MediaRail` | `Index_Prep_Cards.pdf` pages 8, 10 and 13, each rendered flat at 4× (1440×864) |
| `venues.steps` | `build-display-test.webp` · `scoreboard-hardware.webp` · `build-install.webp` — rendered by `MediaRail` | `0EA9E7AB-DE48-4CB7-BFE1-6661FC828F07.JPG` (resized) · `backside.jpg` (unchanged frame) · `7R3A6713.jpg` (resized) |

`scorecard_02.jpg` (the phone and printed card together) was the alternative for
the scorecard slot; the case study uses one scorecard image, not both.
`flying axes-9.jpg` and `coachesApp_01.jpg` were in the overview and coach slots
before the current photos replaced them. `prototyping.jpg` was in the venues rail and was taken out.

The project preview on the crystal facet is not here: it is
`public/assets/projects/preview-flying-axes.webp`, from `flying axes-111.jpg`,
referenced by URL from `src/data/projects.js` like the other projects' previews.
