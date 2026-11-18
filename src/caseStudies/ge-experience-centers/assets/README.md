# GE Experience Centers case study assets

Shipped media for the GE Experience Centers case study, imported by
`geExperienceCentersContent.js` rather than served from `/public` — see
`src/caseStudies/mesa/assets/README.md` for why, and for how a placeholder is
replaced (`src`, not `placeholder`).

Every file here was made from the supplied originals (the `GEC` folder and
`AscendGPOverview.pdf`), not re-exported from them: cropped where the page needs
a particular frame, converted to WebP, and sized to roughly what a retina screen
can use (photographs at q72, graphics at q80).

Images credited to the PDF were **extracted from it**, not rendered: each slide
embeds its photo at full camera resolution under a burned-in slide title, and
pulling the embedded image out leaves the title behind. Page numbers are the
file's page order, starting at 1.

## Status

Slots follow the finishing pass (November 2026): the hero, then straight to
proximity, the selector, and the regional story as the ending.

| Slot | Asset | Made from |
| --- | --- | --- |
| `hero.media` | `hero.webp` | `7R3A7365.jpg`, resized; the hero crops it to its standard frame |
| `approach.wall` | `proximity-wall.webp` (1310×652) | From the Case Study Finish package: the Dubai wall with the expanded block marked, in place of the repeated wall shot |
| `hosts.selector.full` | `selector-full.webp` | PDF page 12, embedded image `Im22`: the tablet screen only (x 200–2532, y 0–1748). Native resolution. |
| `hosts.selector.crops` | `selector-wide.webp` · `selector-narrow.webp` | The same screen cut to 2332×1250 (both columns) and 1140×1250 (the left column only, for phones) |
| `hosts.states` | `display-content-wall.webp` · `display-ambient.webp` | `7R3A7359.jpg`, resized · PDF page 23, embedded image `Im53`, resized |

Callout positions in the content file are measured against the selector crops,
so re-cropping either means re-measuring its callouts. The approach diagram is
not an asset: it is drawn in `ApproachDiagram.jsx`.

Not imported any more: `dubai-lobby.webp`, `shanghai-data-lab.webp`,
`dubai-interactive-wall.webp` and `austin-installation.webp` (the unfinished
Austin photo is retired with the regional diagram).

## Alternatives not used

- `7R3A7360.jpg` — the writeup's first choice for the hero (see above).
- `7R3A7504 (1).jpg` — the same data lab as `dataLab.jpg`; one of the two is enough.
- `UI Mock/iPad-5up.jpg` — the five-screen composition; too dense to explain the
  selector, and it includes a Virtual Reality entry the copy does not claim.
  The flat screen on page 12 replaced it. `iPad-5up.psd` was not opened.
- `7R3A7361.jpg` — supports the scale of the Shanghai wall, but no
  sensor-triggered state can be assigned to it.
- PDF page 30 — the other Austin installation photo, also stored rotated.

The project preview on the crystal facet is unchanged:
`public/assets/projects/preview-gec.webp`.
