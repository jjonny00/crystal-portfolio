# Navigation Intent Map (PR-3)

## Purpose
This document records the new canonical navigation intent entry point added in PR-3 so top-nav and future programmatic navigation can share a single destination payload path before camera ownership migration.

## Canonical destinations
Defined in `src/navigation/navigationIntent.js`:
- `intro`
- `hero`
- `overview`
- `about`
- `project`
- `caseStudy`

## New API
- `mapZoneToDestination(zone)`
- `normalizeNavigationIntent(input)`
- `createNavigationIntentRequester({ onIntent, onDestinationChange })`

## Top-nav intent path
Top nav handlers in `App.jsx` now call `requestNavigationIntent(...)` with canonical destination payloads:
- logo/name click → `hero`
- Work click → `overview`
- About click → `about`

The intent requester still dispatches to legacy behavior:
- `directSelectZone(...)`
- `scrollToSection(...)`

This preserves runtime behavior while unifying intent shape.

## Scroll intent path
- Scroll runtime path is intentionally unchanged in this PR.
- Scroll still flows through `useScrollProgress` → `MasterAnimationCoordinator` → `useUnifiedAnimationController`.
- Integration point is documented only; no scroll engine rewrite and no timing changes.

## Known limitations (intentionally unchanged)
- About corruption paths remain unresolved in this PR:
  - about → overview offset loss
  - about → hero wrong landing/jump
  - about → scroll back to project instability
- Hero → Overview cinematic behavior is untouched.

## Logging
- Dev logging is limited to destination changes at intent-request level.
- No per-frame navigation logging was added.
