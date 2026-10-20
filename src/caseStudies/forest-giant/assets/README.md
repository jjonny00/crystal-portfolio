# Forest Giant case study assets

Shipped media for the Forest Giant case study, imported by
`forestGiantContent.js` rather than served from `/public` — see
`src/caseStudies/mesa/assets/README.md` for why, and for how a placeholder is
replaced (`src`, not `placeholder`).

Every file here was made from the supplied originals in
`Documents/PortfolioProject/Working/projects/fg`, not re-exported from them:
cropped where the page needs a particular frame, converted to WebP, and sized to
roughly what a retina screen can use (photographs at q72, graphics at q80).
Images credited to `FGCaseStudies.pdf` were **extracted from it** (the embedded
image, without the slide around it), not rendered. Page numbers are the file's
page order, starting at 1.

## Status

| Slot | Asset | Made from |
| --- | --- | --- |
| `hero.media` | `hero.webp` | `7R3A4885.jpg`, native size; already 3:2, the hero's frame |
| `overview.gallery[0]` | `quantified.webp` | `Downloads/quantified/Quantified Header.jpg` (1090×614), cropped to 3:2 (x 90–1011) around the phone and watch |
| `overview.gallery[1]` | `roth-river.webp` | `Downloads/roth-river.jpg` (540×374), trimmed to 3:2 (y 7–367). **Low resolution** — soft where the 3-up stacks full-width on phones; replace with a larger original if one exists. |
| `overview.gallery[2]` | `gross.webp` | `Downloads/gross/Gross 1.jpg` (1010×674), trimmed to an exact 3:2 |
| `responsibility.media` | `studio.webp` | `new_office_bog-12.jpg`, resized |
| `practice.gallery` | `guide/page-09` · `-11` · `-12` · `-23` (`.webp` and `-full.webp`) | `FG-Process-FlowChart-V0-0-1.pdf`, those pages rendered flat at 1600px and 3200px wide |
| `means.gallery[0]` | **Outstanding** | The critique worksheet if it survives. Fallback: `FG-WordDoc-Stakeholders.pdf` (keep the LUMA Institute attribution) or an excerpt of `FG-WordDoc-PreMeetingWorksheet.pdf` — neither is in the folder. Never labelled a critique worksheet. |
| `means.gallery[1]` | `workshop.webp` | `workshop-7930.tif`, resized |
| `possible.rail` | `magic-forest/development` · `gesture-control` · `exhibit` · `mcn-2016-booth` (`.webp`) | `magic-forest/MagicForest-*.jpg`, at their native size (1090–1200px wide, the largest supplied) |

## Still to confirm

- **Overview captions:** Jon's involvement in Quantified, Gross and the Roth River
  display, and their dates. The Roth River caption names the client from the
  file name; confirm it, and that the Woodford Reserve barrel was the real
  deployment rather than a demo.
- **`responsibility.media`:** studio location and approximate date for a caption.
- **`means.gallery[1]`:** the actual activity and occasion for a caption, and
  whether it is the same session as the worksheet.
- **Magic Forest:** Jon's contribution, and its timing relative to the process —
  the section's copy places it among the work the practice made possible.

## Alternatives not used

- `7R3A4892.jpg` — a wider view of the same workshop as the hero; the hero's
  closer frame has a clearer focal point.
- `7R3A4829.jpg` · `7R3A4992.jpg` — the same workshop: mapping on a whiteboard,
  and three people over a table-sized map. Candidates for the session slot if
  that workshop turns out to be the better-documented occasion.
- `new_office_bog-11.jpg` — three people at laptops, seen through glass (black and white).
- `IMG_2213.jpg` — a team meeting around the conference table.
- `DSCF2326.jpg` · `DSCF2346.jpg` — an art show in the studio. The optional event
  photograph for the rail, if its occasion adds specific context.
- `IMG_2389.jpg` · `2016-05-03 15.05.56.jpg` · `Office-door hero-1.jpg` — studio life
  (arcade cabinets, the sasquatch costume at the bar, the office door).
- `7R3A7069.jpg` · `IMG_0070.JPG` — GE installation work, covered by the GE case study.
- `MagicForest-Foliage.jpg` — close-up of the installation's foliage; the gesture
  photo shows the same build with the interaction.
- `FGCaseStudies.pdf` — Big Ass Fans (page 18), Storywise (27), Realtree (26) and
  Coopers' Craft (32) are other application candidates for the overview.
- `designDiscovery01.pdf` — a discovery explainer; possibly a guidance resource
  for the worksheet slot, if it was used internally.
- `jon.png` — portrait; not used here.
- `rally78.webp` · `magbooth.webp` — the overview's earlier Rally78 and Magbooth
  images, dropped because Jon had little part in either. No longer imported;
  delete them.
- The early interactive (Flash-era) slot was dropped for a third project: nothing
  supplied predates the move to mobile.

### From `Downloads` (October 2026), not used

- `quantified/*` — the rest of the Quantified set: device mockups on flat colour
  (`Quantified-iphone-a.jpg`, `quantified-watch-screen.jpg`, 2000–2200px), the
  icon set, the watch on a wrist, a watch-and-logo lockup. The header photo
  matches the other photographs in the 3-up better than a flat mockup.
- `gross/Gross Header.jpg` — a hand holding the week view; the chosen photo shows
  the day view clearly.
- `A82A7224.jpg` — the studio floor without people (colourful chairs, the
  mezzanine, sticky-note walls). A candidate for `responsibility.media` if an
  empty studio reads better than the current one with teams at work.
- `IMG_5130.JPG` · `IMG_5212.JPG` · `IMG_0070 2.JPG` — GE installation testing in
  a factory (LED walls, server racks). Possible support for the GE paragraph in
  "Responsibility Grew with the Studio", but GE has its own case study.
- `7a.jpg` · `7d.jpg` — Forest Giant social graphics (whiteboard sessions under
  illustrated shapes) with the logo baked in; not usable as photographs.
- `final/production-shaded.png` · `structure-shaded.png` · `support-shaded.png` —
  illustrations (3300px). Not from the process guide, whose pages are
  photographic; don't present them as process material without knowing what they
  were made for.
- `7R3A3908.jpg` — a panel discussion in the studio; an event, not a working session.
- `IMG_2256.jpg` · `IMG_3855.JPG` · `FG_1.png` — studio life, the branded glass
  wall, the logo.
- `Shaw-OldKYHome-*.jpg` — a My Old Kentucky Home poster for the Kentucky State
  Parks Foundation, credited to Jon; reads as his own illustration, not studio work.
- `svg/*.svg` — client logos (Atria, Big Ass Solutions, Brown-Forman, Flying
  Axes, GE, iRobot, LG&E, Realtree, UPS). The system has no logo row yet.
- `reel.mp4` (90s, black and white, studio and project work) · `website_reel_3.mp4`
  (36s, studio life).
