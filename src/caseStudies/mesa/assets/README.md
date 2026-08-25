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

| Slot | Asset |
| --- | --- |
| `hero.media` | `hero.webp` |
| `overview.gallery` | `prototype01.webp` · `prototype02.webp` · `prototype03.webp` |
| `turnSequence.media` | `one-turn01.webp` |
| `boardTeaches.media` | `preview-mesa.webp` |
| `tightOpenTight` | **Outstanding** — Opening → Midgame → Endgame diagram with the choice-space curve (currently `TightOpenTightPlaceholder.jsx`) |
| `costOfPower.media` | **Outstanding** — power table: ability, damage value, tiles remaining |
| `asynchronous.media` | **Outstanding** — turn-replay sequence or animation |

Nothing is `expandable` yet. When enabling it on a detailed image, ship a
display-resolution `src` plus a larger `fullSrc`, so the lightbox is the only
thing that loads the full-size file.
