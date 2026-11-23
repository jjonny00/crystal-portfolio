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
| `hero.media` | `public/media/fundseeder/fs-last-visit-*` (crop `1272:708:84:70`) | Video, frameless (hard edges); the sample-data line is its caption |
| `overview.paths` | — | Drawn live by `StrategyPaths.jsx` |
| `rivals.media` | `public/media/fundseeder/fs-rivals-*` (crop `1464:708:84:70`) | Video, frameless (hard edges) |
| `tiers.ladder` | `tiers/tier-d.webp` … `tier-s.webp` | Drawn by `TierLadder.jsx` around the product's badges |
| `seeded.media` | `public/media/fundseeder/fs-seeded-*` (crop `1794:708:84:70`) | Video, full-bleed stage, frameless (hard edges) |
| `countries.media` | `public/media/fundseeder/fs-countries.webp` (x 160–3060, y 120–1550; 2400×1183) | Frameless (hard edges) |
| `compare.pinned` | `public/media/fundseeder/fs-pinned-row.webp` (x 1052–3770, y 1094–2156; 2600×1016) | Wide stage, frameless |
| `signal.media` | `signal/pairwise-evidence.webp` (345×275) · `signal/connection-detail.webp` (1194×340) | A `MediaRail` at 275px (220px on phones). The connection detail keeps its counts row: cropped it is 1194×164, too small at that height. |

The globe loops and stills are in `public/media/fundseeder/` (served as-is,
not bundled), made from `fundseederViz/globeCaptures`. Each loop has its own crop (above),
without the app's sidebar, top bar, scrollbar or FILTERS bar (the app card
spans x 81–1880 and y 67–778 of the 1920×1080 source). The crop is the only
change: source frame rate (60fps, passthrough), no scaling, no fades, no
audio, BT.709 kept. One size per clip: `<name>.webm` (VP9), `<name>.mp4`
(H.264) and `<name>-poster.webp`. Posters are
settled, cursor-free frames: Last Visit 1.5s, Rivals 3.4s, Seeded 17.6s. `v2/f01-hero-desktop.webp` and `v2/f04-nearby-rivals.webp`
stay in the repo, unused.

The figures are FundSeeder's own, as of October 7, 2026: 20 traders seeded
since relaunch (none before it) and $256M allocated to them. The product images
and loops show sample data, said once under the hero.

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
