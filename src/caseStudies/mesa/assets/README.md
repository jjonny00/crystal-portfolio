# Mesa case study assets

Media referenced by `mesaContent.js`. Anything without a `src` currently renders
the system placeholder at the correct size — supplying `src` (and `fullSrc` for
the enlarged view) is the only change needed.

Outstanding:

| Slot | Expected asset |
| --- | --- |
| `hero.media` | Mesa in hand, mid-match |
| `overview.gallery` | Card prototype · printed hex tiles · poker-chip board |
| `turnSequence.media` | Turn sequence diagram: Select Tile → Place in Slot → Rotate → Match Colors → Deal Damage + Earn Power |
| `boardTeaches.media` | Opening board with one selectable tile, plus placement UI |
| `tightOpenTight` | Final Opening → Midgame → Endgame diagram with the choice-space curve (currently `TightOpenTightPlaceholder.jsx`) |
| `costOfPower.media` | Power table: ability, damage value, tiles remaining |
| `asynchronous.media` | Turn-replay sequence or animation |

Ship a display-resolution `src` plus a larger `fullSrc` for anything marked
`expandable`, so the lightbox is the only thing that loads the full-size file.
