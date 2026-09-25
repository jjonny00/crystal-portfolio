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

| Slot | Asset | Made from |
| --- | --- | --- |
| `hero.media` | `hero.webp` | `7R3A7365.jpg`, resized; the hero crops it to its standard frame. Chosen over `7R3A7360.jpg` because that frame is nearly identical to the content-wall photo further down. |
| `overview.gallery` | `dubai-lobby.webp` | `Photo Nov 07, 7 10 49 PM.jpg`, cropped from 4:3 to 3:2 (2048×1365, 90px off the top) so it sits level with the data lab |
| `overview.gallery` | `shanghai-data-lab.webp` | `dataLab.jpg`, resized, full 3:2 frame |
| `conversation.selector.full` | `selector-full.webp` | PDF page 12, embedded image `Im22`: the tablet screen only (x 200–2532, y 0–1748), without the slide's caption strip below it. Native resolution. |
| `conversation.selector.crops` | `selector-wide.webp` | The same screen cut to 2332×1250: both columns of areas, plus a band of empty screen under the last row for the callouts |
| `conversation.selector.crops` | `selector-narrow.webp` | The same screen cut to 1140×1250 (x 240–1380 of the embedded image): the left column only, for phones. Stops short of the right-hand column so no sliver of it shows. |
| `conversation.states` | `display-content-wall.webp` | `7R3A7359.jpg`, resized — the camera original of the photo on PDF page 22 |
| `conversation.states` | `display-ambient.webp` | PDF page 23, embedded image `Im53` (5760×3840), resized. No camera original was supplied. |
| `approach.wall` | `dubai-interactive-wall.webp` | `intWall.png`, cropped to 4:3 (x 110–2425, full height; the wall itself runs ~12–84% across, so nothing of it is lost) and resized. 4:3 so that on phones it comes in under the screen width and the first diagram peeks past it. |
| `expansion.media` | `austin-installation.webp` | PDF page 29, embedded image `Im69` (4032×3024), **rotated 180°** — it is stored upside down and the page turns it — then resized |

Callout positions in the content file are measured against the selector crops,
so re-cropping either means re-measuring its callouts.

The approach diagram is not an asset: it is drawn in `ApproachDiagram.jsx`.

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
