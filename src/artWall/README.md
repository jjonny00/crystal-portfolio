# Comics & Other Bad Ideas (the art wall)

The wall at `/about/comics`, entered from About. Every tile comes from one
folder:

```
src/artWall/artwork/
```

Add or remove files there, rebuild (`npm run build`), and deploy. Nothing else
needs editing: `artWallData.js` finds every file under the folder at build time
with Vite's `import.meta.glob`, and `scripts/artWall/vitePlugin.mjs` reads each
image's size so a tile holds its shape before it loads.

| You add | The wall shows |
|---|---|
| An image (or a video) at the root of `artwork/` | One tile. It opens in the case studies' lightbox. |
| A subfolder of images and videos | One **series** tile, with a stacked-paper edge and its count. It opens on the folder's first file; previous and next stay inside the series. |

Every tile shows its title underneath, and a series its count.

**Order.** Natural and numeric, for the wall and for a series' pages: `2` comes
before `10`. Start a name with a number to place it (`03 The Party.webp`,
`04 Woodford Reserve Storyboards/`); the number and the space after it are not
shown. Underscores read as spaces. Pages named only by a number (`01.webp`) are
titled *Page 1*, *Page 2*.

**Layout.** Row-first masonry: in folder order, each tile goes into whichever
column is shortest, so with four columns `01`–`04` read across the top. Four
columns on a wide desktop, three from 768px, two on a phone, so the rows below
the first shift with the screen.

## Optional files

All plain text, read at build time. None is required.

| File | Where | Does |
|---|---|---|
| `caption.txt` | in a series folder | A line under every page in the viewer. |
| `<name>.txt` | beside a single (`07 Took.txt`) | The same, for that piece. |
| `cover.txt` | in a series folder | The file name to show on the wall (`Page 01.webp`) when it isn't the first. The series still opens on its first file. |
| `pixelated.txt` | in a series folder (empty) | Pixel art: drawn with hard edges on the wall and in the viewer. |
| `<name>.pixelated.txt` | beside a single | The same, for that piece. |

## Video

MP4 or WebM, as a single or inside a series. It plays muted, looping and
inline, on the wall and in the viewer (with reduced motion, the wall shows the
poster). Its poster is `<its name>.poster.<image>` beside it
(`00 Crank demo.mp4` → `00 Crank demo.poster.webp`); without one, the first
still in its series. Keep clips short and small: a muted loop, about 1080px, a
few MB.

## Formats

Export stills as WebP at about 2000–2400px on the long side (quality ~82): the
wall loads each cover at full size, so a 20 MB PNG dropped in as-is is a 20 MB
tile. Animated GIFs become animated WebP.

**Pixel art** scales by whole numbers only (2×, 3×, 4×, 5×) with
nearest-neighbour, exported lossless, plus `pixelated.txt`. Crop a small sprite
on an empty screen tight to the action first.

**Not here.** The About teaser (the space panel under the portrait) lives in
`src/assets/about/`, so it is not also a tile.

## Current set (November 2026)

32 tiles, in rows of four on a wide desktop:

| | | | |
|---|---|---|---|
| 01 The Veil Lifted | 02 Mage Wave | 03 The Party | 04 Woodford Reserve Storyboards |
| 05 Death After Life | 06 The Falls | 07 Took | 08 Visor |
| 09 Wasted Youth | 10 Darlings | 11 Pink Coat | 12 Thoughts |
| 13 Of Course Of Course | 14 Seafoam | 15 Just Nothing | 16 Covid |
| 17 Superfluous | 18 Pink Smoke | 19 Faces | 20 Private Prancer |
| 21 Dry Summers | 22 Nightlife | 23 It Ain’t Gonna Save Me | 24 James Lindsey |
| 25 Blades of the Big Screen | 26 You Dreamt This | 27 Louisville Magazine | 28 Crockett Johnson |
| 29 January | 30 Red House | 31 Foliage | 32 Tiny Book 1 |

Sources are `PortfolioProject/about/comicsBadIdeas` and the November 2026
additions (Mage Wave, Took, Darlings, Of Course Of Course, Covid). Notes:

- **The Veil Lifted:** 15 pages and a title card, 16 images. The title card is
  `Page 00` so it opens the series; `cover.txt` keeps Page 01 on the wall.
- **Superfluous:** the same, `00 Title` and `cover.txt`.
- **Mage Wave:** Playdate pixel art at 3× (the 400×240 screen is already doubled
  in the source), the skull at 5×; the beam and the fireball cropped from their
  empty 800×480 frames. `crystalMage01.gif` is left out (a near-empty frame).
  The crank demo goes in as `00 Crank demo.mp4`, which makes it the first page
  and the wall's cover. Its `caption.txt` leaves out the collaborator's name until it is
  confirmed.
- **Covid:** Eyes, Nose, Ears, in that order.

Not on the wall: Night Visions, Future Urban Spaces, Climate and Tiny Book 2
(removed November 2026); the duplicate of *Thoughts*
(`tumblr_ntxk95Dkip1qb1xeio1_1280.jpg`); `blades-of-the-big-screen04.pdf`; and
the two MP4s in the library (`The Falls Pt 6-02_4.mp4`,
`fgHolidayPoster-timelapse.mp4`), which can now go in as video if wanted.
