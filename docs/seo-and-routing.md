# SEO and routing

How the one-page 3D portfolio gets real URLs, readable HTML for crawlers and link
previews, and deep links that land in place.

## URL model

| URL | Lands on | Indexed |
|---|---|---|
| `/` | hero, normal intro | yes |
| `/work/<slug>`, project with a case study | the case study, readable immediately; the scene loads behind it | yes |
| `/work/<slug>`, project without one | the project's facet, after the loader, no intro | yes |
| `/about` | About, after the loader, no intro | canonical → `/` |
| `/work` | overview, after the loader, no intro | canonical → `/` |
| anything else | `404.html` (static, no app), served with a 404 status by Netlify | no |

Slugs live on each project in `src/data/projects.js` (`slug`). They are public
URLs: renaming one breaks inbound links and search results. A project's search
title, description and share image are next to it (`seo`).

`src/navigation/routes.js` is the single path ↔ destination mapping
(`parsePath`, `pathFor`, `getPrerenderRoutes`). Both the client and the build use
it; nothing else should build or parse paths.

## Build: one HTML file per route

`npm run build` runs three steps:

1. `vite build`: the client, with `build.manifest` on and hashed output in `/_app/`.
2. `vite build --ssr src/seo/entry-server.jsx`: a Node bundle of the renderer.
3. `node scripts/prerender.mjs`: for every route, takes `dist/index.html` and
   - replaces the `<!--seo:start-->…<!--seo:end-->` block with the route's head
     (`src/seo/seoMeta.js`): title, description, robots, canonical, Open Graph,
     Twitter card, JSON-LD (`Person`, `WebSite`, and per project a
     `CreativeWork` + `BreadcrumbList`);
   - fills `<div id="prerender">` with the route's body;
   - for a case study, links its chunk's stylesheets and modulepreloads its JS
     (from the manifest);
   - writes `sitemap.xml`, `robots.txt` and `404.html`.

Files are flat (`work/mesa.html`), not folders. Netlify's Pretty URLs serve a
flat file at `/work/mesa` with no redirect; a folder `index.html` would be forced
to `/work/mesa/` by a 301, and the canonical would point at a redirect.

There is deliberately **no** `/* /index.html 200` catch-all in `netlify.toml`:
that would answer every unknown URL with the home page and a 200 (a soft 404).

### What the prerendered body is

- **Case study routes**: the real case study, rendered through the same
  `CaseStudyOverlay` and components the app uses, plus the nav. It is
  visible: it *is* the page on first paint.
- **Every other route**: the page's copy as plain semantic HTML (name, role,
  intro, each project linking to its URL, About). Visually hidden
  (`.prerender--hidden`): sighted readers get the loader and then the scene.
  Screen readers, crawlers and no-JavaScript readers get the text; a
  `<noscript>` style turns it into a readable page.

Copy shown on the live page and in the prerender comes from one place:
`src/data/siteCopy.js` (hero, About), `projects.js`, and each case study's
`*Content.js`.

## Client: arriving, and staying in sync

`App.jsx` reads `parsePath(location.pathname)` once.

**Case-study fast path** (`/work/<slug>` with a case study):

1. `main.jsx` preloads the case study module (`preloadCaseStudy`) and mounts
   without waiting on the fracture textures.
2. `CaseStudyOverlay` mounts with `initiallyOpen`: no wash, no entrance stagger
   (`data-instant`, see `caseStudy.css`), and it resumes the prerendered page's
   scroll position. The app renders the same markup, so the takeover is
   invisible; `#prerender` is removed in the same commit.
3. The perf benchmark, assets and fracture textures load behind it. The loader
   stays hidden while the case study is open. While `data-instant` is set,
   the sections that normally show the scene through them
   (`.cs-section[data-surface='none']`) paint their colour solid, so the scene
   loading behind is never seen. The flag clears when the case study first
   closes; any case study opened after that sees through as usual.
4. When the scene mounts, it lands on the project (below). Closing the case
   study reveals the facet; closing it before the scene is ready shows the
   loader, which then hands off as usual.

**Landing** (`/work`, `/about`, `/work/<slug>`): in the commit that mounts the
scene, `App` jumps the content layer to the section and sets the controller's
direct override (`directSelectProject` / `directSelectZone`), the same path a
facet click uses. The intro and the hero → overview cinematic only arm when the
controller is in the hero state when the camera mounts, so neither runs.

**URL sync** (`src/navigation/useRouteSync.js`):

- scrolling between sections → `history.replaceState` (copyable URL, no
  history spam);
- opening a case study → `pushState`, so Back (or the back swipe) closes it;
- closing it from the page → `history.back()` off the entry it pushed;
- `popstate` → reopen/close the case study, or move the scene to the entry's
  section (`requestNavigationIntent` for zones, the facet path for projects).

Each entry carries `{ caseStudy: projectId | null }`, because a case study and
its project share a URL. `useDocumentHead` keeps title, description, canonical
and JSON-LD in step with the current path.

## Links

Navigation, the overview labels (`FacetLabels`) and the project CTAs
(`KnockoutButton` with `href`) are real `<a href>`s. A plain left click runs the
in-page transition (`src/navigation/linkClick.js`); modified clicks (new tab,
copy link) behave like normal links.

## Site identity and assets

- `src/seo/site.js`: `SITE_URL` (canonical origin), name, job title,
  `sameAs` profile links for structured data, and `CONTACT_EMAIL` (null keeps
  CONTACT inert; an address makes it a `mailto:`).
- Share cards (`public/og/*.jpg`, 1200×630) and icons (`favicon.svg`,
  `favicon-48.png`, `apple-touch-icon.png`) come from
  `npm run build:share-images` (`scripts/generate-share-images.mjs`, sharp).
  Run it when a project's art or title changes and commit the output.

## Adding a project

1. Add it to `projects.js` with a `slug` and `seo` block.
2. Add art to `scripts/generate-share-images.mjs` and run `npm run build:share-images`.
3. `npm run build`; the route, sitemap entry and prerendered page follow.

## Checking a deploy

- `curl -sI https://<site>/work/mesa`: 200, no redirect.
- `curl -s https://<site>/work/mesa | grep '<h1'`: content is in the raw HTML.
- `curl -sI https://<site>/work/nope`: 404.
- Google Rich Results Test on a case-study URL; LinkedIn Post Inspector for the
  share card.
- Search Console: submit `/sitemap.xml`; URL Inspection → "View crawled page"
  on `/` and a case study, to see the rendered HTML Google indexed.

## iOS 26 Safari status bar

Safari 26 ignores `theme-color` and colours its status bar from a
`position: fixed` bar at the top edge of the page; a transparent one makes it
show whatever is behind. The nav was that bar, which turned the status bar the
project colour on case-study deep links. The nav is `position: absolute`
(the document never scrolls, so it renders the same), and Safari falls back to
the page background, `#050505`. Keep full-width top bars non-fixed.
