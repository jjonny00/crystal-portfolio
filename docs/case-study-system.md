# Case study system

A small set of reusable section components under `src/caseStudies/system/`, plus
one folder per case study. Adding the next case study should mean writing
content, supplying media, and composing existing sections — not designing or
coding a new page.

Deliberately independent of the crystal/facet/project-background system. A case
study opens as a full-page layer over the portfolio; the scroll position,
camera, and crystal state underneath are untouched, so closing one returns the
reader exactly where they were.

## Layout

```
src/caseStudies/
  registry.js               slug -> dynamic import (one line per case study)
  CaseStudyOverlay.jsx      mounts the case study over the portfolio
  system/                   the reusable system (see below)
  mesa/
    MesaCaseStudy.jsx       page composition
    mesaContent.js          copy + media descriptors
    TightOpenTightPlaceholder.jsx  case-study-specific visual
    mesa.css                case-study-specific visual styling only
    assets/
```

## Adding a case study

1. Add `caseStudySlug` and `caseStudyColors` (exactly two colours) to the
   project in `src/data/projects.js`. Nothing else about the case study lives
   there.
2. Create `src/caseStudies/<slug>/` with a content module and a JSX module that
   composes sections inside `<CaseStudyPage>`.
3. Add one line to `src/caseStudies/registry.js`.

That is the whole wiring. The project's "read the case study" CTA already routes
through `App.jsx` → `CaseStudyOverlay`, and the module is dynamically imported,
so an unopened case study adds nothing to the initial bundle.

## Theming

Every case study has exactly two colours, published as `--cs-color-a` /
`--cs-color-b` on `.cs-root`. Sections choose which one is the background:

| tone | background | foreground |
| --- | --- | --- |
| `a` | colour A | colour B |
| `b` | colour B | colour A |

Components never name a colour — they resolve `--cs-bg` / `--cs-fg` from the
tone. Text weights come from `color-mix()` on the foreground, so muted body copy,
captions, and metadata labels stay correct in both tones automatically.

## Sections

| Component | Shape |
| --- | --- |
| `CaseStudyHero` | Project name, case study title, intro, hero media. Mobile is a different composition, not a shrunk grid. |
| `CaseStudyOverview` | Narrative + media in a content column, metadata rail alongside. On mobile the rail moves ahead of the narrative. |
| `SplitSection` | `direction="text-left"` / `"text-right"`. Media bleeds off the outer edge. Mobile collapses to title → body → media → caption. |
| `SequenceSection` | Title, intro, a wide stage, caption, optional takeaway. |
| `FeatureSection` | Centred title, intro, a full-bleed stage, caption, optional takeaway. |
| `ConclusionSection` | Outcome items and reflection; two columns on desktop, stacked on mobile. |

`SequenceSection` and `FeatureSection` take arbitrary children as their stage.
Neither imposes a height — the stage is sized by whatever it contains, and that
child owns its own responsive behaviour. Supply `media` instead of children for
the standard image/placeholder treatment.

## Media

`CaseStudyMedia` is the single media primitive: responsive sources, `contain` /
`cover`, aspect-ratio reservation (no layout shift), lazy loading below the fold,
optional enlargement, and a `fullSrc` used only by the enlarged view.
`MediaGallery` arranges several of them (`2-up`, `3-up`, `stacked`, collapsing to
one column on phones) and hands the whole set to the viewer when one is opened.

Media with no `src` renders `PlaceholderMedia` at the exact size the real asset
will occupy, naming the expected asset (always to assistive tech, and on screen
in dev builds). Replacing a placeholder is a content change, never a layout one.

### Enlargement

`MediaViewer.jsx` is the only module that knows which lightbox library is in use
(currently `yet-another-react-lightbox`, with the captions and zoom plugins).
Case studies only ever call `useMediaViewer().open(slides, index)` with our own
slide shape, and the implementation is lazily imported — the library and its
stylesheet stay out of the bundle until a reader enlarges something. Swapping
libraries means rewriting `MediaViewerLightbox.jsx` and nothing else.

## Enter / exit

`CaseStudyOverlay` runs a small phase machine — `closed → entering → open →
exiting → closed` — because closing cannot simply unmount: the layer has to stay
up while it fades.

Entry starts by clearing the stage: `ProjectFocusSection` fades its preview copy
(title, subhead, description, CTA) out the moment `viewMode` becomes
`caseStudy` — for projects with a full case study it does so *without* showing
the inline stub — so the crystal is briefly alone before the layer arrives.

Then two beats, after a deliberate pause:

1. **The colour wash.** After `offsetMs` of stillness, a plain backdrop in the
   hero's tone colour fades up over `washMs`. It is inline-styled rather than in
   `caseStudy.css` because it has to paint before the case study's chunk (and
   stylesheet) has loaded. The sections rise on the same curve, so the hero's own
   background joins the wash without a seam — same colour, invisible handover,
   whenever the chunk happens to arrive.
2. **The hero, staggered.** Project name → case study title → media → intro copy,
   `staggerMs` apart, each a fade plus a short rise.

All of it comes from `src/caseStudies/transitionTiming.js` — the one place to
retime the sequence. The overlay publishes those numbers onto itself as CSS
custom properties, so the stylesheet composes its delays from the same values
instead of keeping a second copy; `App.jsx` derives the scene-freeze delay from
them too. Currently the sequence takes ~3.1s end to end.

Exit is a single fade of the whole layer, revealing the crystal — which has
already resumed rendering by then, since the scene thaws the moment `viewMode`
changes.

Two constraints worth keeping if you edit these animations, both noted in the
stylesheet: never animate opacity on an ancestor of the fixed back button (an
in-flight opacity makes it a containing block, flinging the button to the bottom
of the scrolled document), and use `backwards` rather than `both` fill — every
end state here is the element's natural state, and a forwards fill would keep a
dozen elements on their own compositor layers for the whole visit.

The top nav's case-study colour is driven by the overlay, not by `viewMode`, so
it holds through the exit fade instead of snapping back to cream early.

## Scene freeze

The crystal is fully hidden behind an opaque case study, so rendering it is pure
waste — and a case study is exactly where the browser needs its budget for
images, scrolling, and the lightbox. `App.jsx` sets `paused` on `Fixed3DCanvas`
`SCENE_FREEZE_DELAY_MS` after a case study opens. That delay is derived from the
entry timing rather than guessed: the crystal is visible through the layer until
the colour wash is fully opaque, so freezing (and hiding) the canvas any earlier
would blink it out mid-transition. Retiming the entrance moves it. That switches the
Canvas to `frameloop="never"` — no `useFrame` callbacks, no draw calls, no
postprocessing — and hides the canvas with `visibility: hidden` so it is not
composited either.

`SceneFreezeGuard` (in `Fixed3DCanvas.jsx`) makes this safe. r3f's
`setFrameloop()` zeroes `clock.elapsedTime` on both stop and restart, which would
jump every `uTime` shader uniform and, worse, make the camera controller's
transition bookkeeping (`startedAt` is stored as an elapsed time) compute a
negative elapsed. The guard records the last rendered time each frame and
restores it in a layout effect the moment the loop restarts, before the first
frame renders. Do not remove it if you touch `frameloop`.

## Responsive behaviour

`system/caseStudy.css` owns every breakpoint. Fluid values are interpolated
between the two supplied reference widths (402px and 1728px) so both endpoints
land on the design. A case study should not need breakpoint CSS of its own; a
custom diagram dropped into a stage handles its own internal transformation.
