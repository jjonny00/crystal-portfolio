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
| `turnSequence.steps` | `one-turn/one-turn-01.webp` … `-05.webp` — rendered by `MediaRail` |
| `boardTeaches.media` | `preview-mesa.webp` |
| `tightOpenTight.stages` | `tight-open-tight01.webp` · `02` · `03` — rendered by `TightOpenTightStages.jsx` |
| `costOfPower.key` · `.powers` | `power-key.webp` · `power-cards/*.webp` — rendered by `FeaturedGallery` |
| `asynchronous.media` | **Outstanding** — turn-replay sequence or animation |

`one-turn01.webp` is left over from the single-image version of the turn sequence
and is no longer imported by anything. Safe to delete.

A folder per set, as with `one-turn/` and `power-cards/`, once a slot holds more
than a couple of images — the arrangement components (`MediaGallery`,
`FeaturedGallery`, `MediaRail`) all take a plain array, so the folder and the
content array stay in step.

Everything in a gallery, a featured gallery, or a rail is `expandable`: opening
one hands the whole set to the viewer. None of them ship a separate `fullSrc`
yet, so the lightbox shows the same file the page loaded — worth adding for any
image detailed enough that a reader would want to zoom past display resolution.
