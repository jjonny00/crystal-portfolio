# FundSeeder case study assets

Shipped media for the FundSeeder case study, imported by
`fundseederContent.js` rather than served from `/public` — see
`src/caseStudies/mesa/assets/README.md` for why, and for how a placeholder is
replaced (`src`, not `placeholder`).

Every file here was made from the supplied product renders (the
`fundseederViz` set: `Dashboard05.png`, `Leaderboard.png`, `Group 3385.png`,
`tiers/tier*.png`), not re-exported from them: cropped to the frame each slot
needs, converted to WebP at q85 (a step above the other case studies'
graphics, for the small table type), and sized to roughly what a retina screen can use. Where a slot is
small and the screen is dense, a `-full` file at higher resolution feeds the
enlarged view only.

## Status

| Slot | Asset | Made from |
| --- | --- | --- |
| `hero.media` | `hero.webp` | A composition, 2400×1600 (the hero's 3:2) on a transparent ground: `tiers/tierA.png` with the 101 / 102 You / 103 rows of `Dashboard05.png`'s ranking panel floating over it. Built in HTML and rendered headlessly. |
| `overview.gallery` | `dashboard.webp` (+ `-full`) | `Dashboard05.png`, whole frame |
| `overview.gallery` | `leaderboard.webp` (+ `-full`) | `Leaderboard.png`, top 3840×2256 cropped to the dashboard's ratio; `-full` is the whole page |
| `overview.gallery` | — Signal | **Still a placeholder.** No Signal screen in the supplied set. |
| `tiers.ladder` | `tiers/tier-{d,c,b,a,s}.webp` | The badge cut from each tier card, 272×272, masked to the ring's outer edge. `tierC.png`'s badge sits 4px right of the others; the crop follows it. The ladder itself is `TierLadder.jsx`. |
| `leaderboard.gallery` | `leaderboard-table.webp` (+ `-full`) | `Leaderboard.png`, the leaderboard panel from the filter bar to the pinned row, 2577×2227 |
| `leaderboard.gallery` | `leaderboard-filters.webp` (+ `-full`) | `Group 3385.png`, whole frame (same ratio as the table, so the pair sits level) |
| `nextRival.gallery` | `ranking-neighbourhood.webp` | `Dashboard05.png`, the ranking panel alone, its rounded corners cut transparent |
| `nextRival.gallery` | `pinned-entry.webp` | `Leaderboard.png`, rows 12–16 and the pinned "You" row |
| `identity.gallery` | `names-and-flags.webp` | `Group 3385.png`, the podium |
| `identity.gallery` | — name approval | **Still a placeholder.** No approval screen in the supplied set. |
| `destination.flow` | — | Drawn by `SelectionFlow.jsx`; no raster asset |

`home-hero-cards03.jpg` (the fanned tier cards from fundseeder.com's hero) was
in the set and isn't used: the case study's hero needed rank as well as tier.
fundseeder.com's own feature images (`home-features-*`, `howItWorks-*`) are
800–912px wide, too small for any slot here, and were used only as reference
for the hero's composition.
