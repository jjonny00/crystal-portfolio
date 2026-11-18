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

Slots follow the finishing pass (November 2026).

| Slot | Asset | Placement |
| --- | --- | --- |
| `hero.media` | `v2/f01-hero-desktop.webp` (1600×1050) | Directly on the crystal, no frame |
| `overview.flow` | — | Drawn live by `RankingFlow.jsx` |
| `nextStep.ladder` | `tiers/tier-d.webp` … `tier-s.webp` | Drawn by `TierLadder.jsx` around the product's badges |
| `nextStep.rivals` | `v2/f04-nearby-rivals.webp` (1280×1300) | Centred under the ladder, max 680px |
| `compare.pinned` | — | Drawn live by `PinnedTable.jsx`: the source's ranks, aliases and FS Scores (81.23 for the pinned trader); flags left out, the country intent unconfirmed |
| `signal.media` | `signal/pairwise-evidence.webp` (345×275) · `signal/connection-detail.webp` (1194×340) | `StackedMedia.jsx`, max 400px / 1000px, each expandable. Crops with no trader names or contact details in frame; each is its own enlarged view (`src` and `fullSrc` together). |

The figures (17 seeded, 1,027 ranked) are as of August 2026: the hero's
before/after sentence says so, and the outcomes carry the date once for the pair.

The v2 comparison, period-control and Signal screens were removed from the
repo: the Signal screens showed trader names and emails, and the leaderboard's
1,700 strategies disagreed with the 1,027 reported. The originals are still in
`fundseederViz/fundseeder_webp_v2`.

Not imported any more (the v1 assets): `hero.webp`, `ranking-neighbourhood.webp`,
`pinned-entry.webp`, `leaderboard-filters.webp`, `dashboard.webp`,
`leaderboard.webp`, `leaderboard-table.webp` (each with `-full` where there is
one) and `names-and-flags.webp`.

Still to capture, if it can be done in one short session: an expanded
leaderboard row.
