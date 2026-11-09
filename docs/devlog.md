# Second Sentence devlog

Second Sentence holds the first project slot (Slipstream's until Nov 2026). Its
case study is a devlog: an archive at `/work/secondsentence` and one page per
entry at `/work/secondsentence/devlog/<slug>`. Entries are MDX files. Publishing
one is adding a file; no application code changes.

## Publishing an entry

1. **Create it.** `npm run devlog:new -- "Entry title"` copies
   `src/devlog/content/_template.mdx` to
   `src/devlog/content/entries/<slug>.mdx` as a draft dated today, and makes
   `public/media/devlog/<slug>/` for its media. (Or copy the template by hand.)
2. **Fill in the frontmatter.** Every field is explained in the template.

   | field | required | notes |
   |---|---|---|
   | `title` | yes | The entry's headline. Never the project title. |
   | `slug` | yes | Its URL. Lowercase words and hyphens. Don't change it once published. |
   | `date` | yes | `"YYYY-MM-DD"`, quoted. Decides the order and the latest entry. |
   | `category` | yes | One short label: Systems Design, Movement, Combat... |
   | `summary` | yes | One or two sentences. Used on the preview, card, search results and share card. |
   | `draft` | yes | `true` keeps it off the live site. |
   | `cover` | once published | An image in `public/`, e.g. `/media/devlog/<slug>/cover.webp`. |
   | `coverAlt` | with a cover | What the cover shows. |
   | `video` | no | A clip to lead the entry; the cover becomes its poster. |
   | `updated` | no | `"YYYY-MM-DD"` of a meaningful revision. |

   Anything else is an error, so a typo can't silently do nothing.
3. **Write it** in Markdown (below).
4. **Add its media** to `public/media/devlog/<slug>/`.
5. **Preview it:** `npm run dev`. Drafts and future-dated entries show there,
   marked *Draft* or *Scheduled*, everywhere they would appear (the project
   preview, the archive, the entry itself).
6. **Publish:** set `draft: false`, run `npm run build` (it fails and says why
   if anything is wrong), commit, and deploy.

The newest published entry becomes the latest everywhere at once: the project's
preview (its headline, date and summary), the archive's featured slot, the RSS
feed and the sitemap. `projects.js` is never touched.

**Updating an entry:** edit the file and deploy. Add `updated` for a
substantive change. Keep the `slug`; it is the URL.

**Scheduling:** an entry dated in the future (UTC) stays out of a build until a
build on or after that date. The site is static, so nothing appears on its own:
it goes live with the first deploy on or after its date. (A Netlify scheduled
build hook would automate that; there isn't one.)

**Previewing drafts on a deploy:** `DEVLOG_DRAFTS=1 npm run build` includes
drafts and scheduled entries, marked, with `noindex` and out of the sitemap and
feed. Set it on a deploy-preview context only, never production.

## Writing

Plain Markdown: paragraphs, `**bold**`, `_italic_`, links, lists, `> quotes`,
`## headings` (the title is the page's h1, so start at `##`), `---` rules, and
fenced code.

An image on a line of its own becomes an enlargeable figure; the quoted text is
its caption. Its size is measured at build time, so it reserves its space.

```md
![What the image shows](/media/devlog/<slug>/dash.webp "Optional caption.")
```

Richer media. Every entry has these, with no import:

```mdx
<GameplayVideo
  src="/media/devlog/<slug>/chain.mp4"
  poster="/media/devlog/<slug>/chain.webp"
  title="Three Remnants detonating in sequence"
  caption="Optional caption."
  loop        // optional
  autoPlay    // optional: plays muted while on screen; ignored for reduced motion
/>

<MediaFigure src="/media/devlog/<slug>/hud.webp" alt="..." caption="..." size="text" />

<MediaGallery
  layout="2-up"   // "2-up" | "3-up" | "stacked"
  caption="One caption for the set."
  items={[
    { src: '/media/devlog/<slug>/a.webp', alt: '...', aspectRatio: '16 / 9' },
    { src: '/media/devlog/<slug>/b.webp', alt: '...', aspectRatio: '16 / 9' },
  ]}
/>

<DesignNote kind="decision" title="One line on what was decided">
  Why, in Markdown.
</DesignNote>
```

- `size` on `MediaFigure` and `GameplayVideo`: `text` (the reading column),
  `wide` (default; runs past it), `full` (edge to edge).
- `DesignNote` `kind`: `note` (default), `constraint`, `experiment`,
  `decision`, `lesson`; `label` overrides the name.
- `MediaGallery` and `MediaRail` are the case studies' own
  (`src/caseStudies/system/`), as documented in `case-study-system.md`.
- Video is always muted to start, has controls, and downloads nothing until
  played (or scrolled to, with `autoPlay`). Give it a poster.
- Leave `src` out and give `placeholder` a description to hold the space for
  media still to come. Placeholders show their description only in dev.
- Every local media path must exist in `public/`, or the build stops and says
  which one.
- A link to another entry (`/work/secondsentence/devlog/<slug>`) stays inside
  the devlog. A published entry may only link to published entries; the build
  checks.

## How it fits together

```
src/devlog/
  entries.js              the one list of entries every surface reads
  projectPreview.js       the latest entry -> the project's preview copy
  devlog.css              layout on top of the case-study system
  components/             DevlogArchive, DevlogArticle, EntryCard, EntryMeta,
                          ArticleNavigation, GameplayVideo, MediaFigure,
                          DesignNote, mdxComponents, devlogLinks
  content/
    _template.mdx         the starting point (not an entry: _ files are skipped)
    entries/*.mdx         the entries
src/caseStudies/secondsentence/
  SecondSentenceCaseStudy.jsx   archive or entry, by the overlay's subpath
  secondSentenceContent.js      the archive's intro, status and About the Game
scripts/devlog/
  entries.mjs             discovery and validation (build time, Node)
  vitePlugin.mjs          `virtual:devlog`, and media measuring for MDX bodies
  new-entry.mjs           npm run devlog:new
```

**Content.** `scripts/devlog/vitePlugin.mjs` serves `virtual:devlog`: every
valid entry's metadata, newest first, plus a lazy `import()` per body, so each
body is its own chunk. A production build leaves drafts and scheduled entries
out entirely, so they are not in the bundle, the routes, the sitemap or the
feed. Invalid frontmatter fails the build (or shows Vite's overlay in dev).
`src/devlog/entries.js` is the app's view of that list; nothing else keeps an
entry's copy.

**The project.** `projects.js` keeps only the project's identity: id
(`project01`, the fragment's slot), slug, title, descriptor, colours, CTA, the
stable fallback description, and `devlog: true`. `withLatestDevlogEntry`
(`projectPreview.js`) lays the latest entry over it for `ProjectFocusSection`
and the prerendered home copy: a "Latest Entry · date" line and headline under
the descriptor, and the entry's summary as the description. With nothing
published, the stable description stands. The scene, facet map and project
selection never read entries.

**Routing.** The archive is the project's case study (`registry.js`,
`entry: 'reveal'`), so the preview's CTA, the fragment click, the camera's push
in, Close, Escape, the scene freeze, the nav's colour and the deep-link fast
path are all the case-study system's own. An entry is a *subpath* of that
case study: `parsePath('/work/secondsentence/devlog/x')` gives the case study's
route plus `subpath: 'devlog/x'` and `entrySlug: 'x'`. App holds
`caseStudySubpath`, passes it to `CaseStudyOverlay`, which passes it, with
`onNavigateSubpath`, through `CaseStudyNavContext`. Links between devlog pages
are real `<a href>`s that move the subpath on a plain click.

**History** (`useRouteSync`). Each case-study history entry records `depth`:
how many entries this visit to the case study has pushed. Opening pushes depth
1; moving to another devlog page pushes depth + 1; Back and Forward move
between pages without leaving the layer; Close (or Escape) steps back by
`depth`, past every page it pushed, to the preview it was opened from. The
entry a reader arrived on from outside is depth 0, so closing a deep-linked
page goes to All Work as every case study does.

**Page changes** inside the layer keep its entrance from replaying: the new
page's sections take their colour at once and only their content fades in
(260ms), the scroll resets (the archive returns to where the reader left it),
and focus moves to the new page's h1.

**Theme.** The devlog uses the project's `caseStudyColors` and the system's
tones (`--cs-fg` / `--cs-bg`); it names no colour. The intro is tone A with no
background (on the scene, as every hero); everything after it is tone B. Two
scoped departures, both in `devlog.css`: secondary text keeps 82% of the ink
(not 55%) so it holds 4.5:1 on the cream, and page changes swap content rather
than replaying the entrance. Change the pair in `projects.js`; keep secondary
text (82% of the ink) at 4.5:1 or better on the other colour.

**SEO.** `getPrerenderRoutes` adds a flat file per published entry
(`work/secondsentence/devlog/<slug>.html`) with the real entry in it, rendered
through the same overlay. `seoMeta.js` gives each entry its title
(`<title> · Second Sentence Devlog | Jon Shaw`), summary as description,
canonical, `BlogPosting` JSON-LD with a breadcrumb, `article:published_time`,
and a share card: the prerender crops each cover to 1200×630 at
`/og/devlog/<slug>.jpg`. The prerender also writes the RSS feed at
`/work/secondsentence/feed.xml`, linked from every devlog page's head, and the
sitemap's `lastmod` per entry. The project's own share card is
`public/og/secondsentence.jpg` (`npm run build:share-images`).

**Netlify** (`netlify.toml`): `/work/slipstream` 301s to `/work/secondsentence`
(`routes.js` also resolves it via the project's `legacySlugs`);
`/work/secondsentence/devlog` 301s to the archive; and `/work/secondsentence` is
pinned to its file by a 200 rewrite, because the entries' folder of the same
name now sits beside it. Check after the first deploy:

```sh
curl -sI https://jjonshaw.com/work/secondsentence          # 200, no redirect
curl -sI https://jjonshaw.com/work/slipstream              # 301 -> /work/secondsentence
curl -sI https://jjonshaw.com/work/secondsentence/devlog/<slug>   # 200
curl -sI https://jjonshaw.com/work/secondsentence/feed.xml # 200, application/rss+xml
```

## Limits

- The project preview has no image slot (it is copy over the 3D scene), so the
  latest entry's cover reaches the archive, the entry and its share card, not
  the preview.
- No category filtering, search, comments or subscriptions beyond RSS.
- Scheduled entries need a deploy on or after their date.
- Same-day entries order by slug; give them different dates to control order.
