# Camera Suppression Matrix (planning only)

> Status: analysis-only. No suppression is implemented in runtime.

This document captures observed writer conflicts from the DEV camera write guard and proposes future ownership/suppression decisions for a later PR.

| known conflict pair | category affected | likely transition/flow | current risk | suggested future owner | writer likely to suppress later | writer that should remain authoritative later | notes |
|---|---|---|---|---|---|---|---|
| `AUTHORITATIVE_HERO <> heroOrbit` | position, orientation, filmOffset | plain hero orbit update lane | Medium (duplicate writes can hide ownership intent) | `AUTHORITATIVE_HERO` lane | `heroOrbit` alias/duplicate instrumentation lane | `AUTHORITATIVE_HERO` | Likely a naming overlap where both entries represent the same effective hero owner path. Resolve as ownership normalization, not behavior change. |
| `FORCED_OVERVIEW_TO_HERO <> authoritativeOverviewToHero` | position, orientation, filmOffset, currentTarget | forced Overview → Hero authoritative transition | Medium (dual labels on same transition ownership) | `FORCED_OVERVIEW_TO_HERO` transition lane | `authoritativeOverviewToHero` duplicate lane label | `FORCED_OVERVIEW_TO_HERO` | Keep runtime as-is for now; future cleanup should unify writer identity for this path. |
| `FORCED_HERO_TO_OVERVIEW <> authoritativeHeroToOverview` (expected potential) | position, orientation, filmOffset, currentTarget | forced Hero → Overview authoritative transition | Medium | `FORCED_HERO_TO_OVERVIEW` transition lane | `authoritativeHeroToOverview` duplicate lane label | `FORCED_HERO_TO_OVERVIEW` | Track in warning mode; suppress only after final owner map signoff. |
| `about path writer <> fallback/currentTarget smoothing` (expected potential) | filmOffset, currentTarget, possibly position/orientation | About navigation and return/hand-off paths | High (known About bugs remain) | About-specific authoritative lane per flow | fallback smoother where it overlaps About authoritative writes | About authoritative writer per resolved owner map | Do not fix About behavior in this phase; document conflict surface only. |
| `project/caseStudy writer <> fallback/currentTarget smoothing` (expected potential) | currentTarget, position/orientation | project focus / case study hand-offs | Medium | project/caseStudy authoritative writer | generic fallback smoother while project owner is active | project/caseStudy lane | Requires later suppression matrix rollout once guard data is stable over multiple sessions. |

## Notes
- This matrix is intentionally forward-looking and does **not** alter current runtime behavior.
- Known bugs (Hero→Overview blip and About-path issues) remain out of scope in this phase.
- Any future suppression PR should reference this matrix and the guard detail output before changing ownership.
