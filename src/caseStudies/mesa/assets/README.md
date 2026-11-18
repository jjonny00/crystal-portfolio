# Mesa case study assets

Shipped media for the Mesa case study lives here, next to the content that
references it, and is pulled in by `import` rather than by a `/public` URL — Vite
content-hashes imported assets, and a mistyped filename fails the build instead
of rendering a broken image at runtime.

Anything without a `src` renders the system placeholder at the correct size.
Supplying `src` is the only change needed — note the key is `src`, not
`placeholder`; `placeholder` describes an asset that is still missing, so setting
it to an import leaves the placeholder on screen:

```js
import heroImage from './assets/hero.webp';

hero: {
  media: {
    src: heroImage,
    alt: 'Mesa running on an iPhone, held in one hand during a match.',
  },
},
```

## Status

Slots follow the finishing pass (November 2026).

| Slot | Asset |
| --- | --- |
| `hero.media` | `opening-board.webp` (1480×1435, from the Case Study Finish package) — the opening board, its one playable tile at the peak |
| `overview.gallery` | `prototype01.webp` · `prototype02.webp` · `prototype03.webp` |
| `turnSequence.steps` | `one-turn/one-turn-01.webp` … `-05.webp` — rendered by `MediaRail` |
| `board.stages` | `tight-open-tight01.webp` · `02` · `03` — rendered by `TightOpenTightStages.jsx`, captioned as a conceptual match rhythm |
| `powers.media` | `power-key-steal.webp` (506×70) — the Steal row of the power key, shown at about its own size |

Not on the page:

- `power-key.webp` and `power-cards/*.webp`. The key and the cards disagree on
  Draw (−15 / −10) and Freeze (−20 / −15); both agree on Steal at −5, which is
  why the section ships with the Steal row alone. Restore the full key only
  after checking the shipped build or the final balance sheet.
- `hero.webp` (the phone in hand) and `preview-mesa.webp`, replaced by the
  opening board.
- The animated turn (`mesa-turn-sequence.webp` in the package): four of the
  existing instructional stills, not a recording of the opponent replay, so
  the five-screen rail stays.
- `one-turn01.webp`, left over from the single-image version of the turn
  sequence. Safe to delete.
