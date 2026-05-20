# Camera Legacy State Audit (PR-2, docs-only)

## Scope and constraints
- This is a documentation-only audit. No runtime behavior changes are included.
- Primary reference: `docs/camera-owner-map.md`.
- Focus area: About-linked corruption paths that must be understood before any camera runtime migration.

---

## 1) About-state corruption summary

### Known corruption cluster
1. **About → Hero** can jump or land in the wrong camera pose.
2. **About → Overview** can lose intended horizontal overview offset and re-center camera target.
3. **About → Scroll back to project** can produce unstable camera behavior while re-entering projects flow.
4. These can contaminate later **Overview → Hero** behavior due to stale state/handoff residue.

### Why this cluster is dangerous pre-migration
- About exits traverse multiple control lanes at once: scroll-zone derivation, optional direct zone/project overrides, and top-nav programmatic scroll.
- Unified camera writes are branch-heavy in a single frame writer; if exit/entry state flips are not frame-aligned, transitional residues can bleed into next destination branch.
- Overview/project re-entry are offset-sensitive; a transient fallback target can visually resemble “wrong owner” even if branch ultimately switches correctly.

---

## 2) Per-flow audit table

| Flow | Repro steps | Expected behavior | Observed/known wrong behavior | State changes involved | cameraState changes involved | Scroll mutation involved | Likely camera writers involved | Likely refs involved | Potential stale/reset (`horizontal offset` / `filmOffset` / `currentTarget`) | Classification |
|---|---|---|---|---|---|---|---|---|---|---|
| overview → about | 1) Enter overview. 2) Trigger About (nav or scroll). 3) Observe settle into about. | Smooth transition to about pose; no carry-over from overview-specific framing. | Usually stable, but can set up contamination that appears on next exit from about. | zone: overview→about; view mode normalization. | `overview` → `about`. | yes (scroll/nav to about zone). | UnifiedCameraController overview branch then about branch. | `currentTarget`, transition refs that should be idle. | horizontal offset should no longer dominate; if retained unexpectedly, about entry may not fully neutralize prior target chain. | handoff sensitivity / state contamination precursor |
| about → overview | 1) Enter about. 2) Navigate to Work/overview or scroll up into overview band. 3) Observe final overview framing. | Overview should keep authored horizontal offset (not centered). | Known failure: overview target becomes centered or offset partially lost. | zone about→overview; possible direct zone override; scroll-driven recalculation. | `about` → `overview`. | yes (programmatic and/or manual). | About branch then overview branch; possible transient fallback target path. | `currentTarget`, overview target resolution path, offset composition chain. | **horizontal offset may be stale/reset or bypassed** during handoff; `currentTarget` may momentarily resolve from base target. filmOffset less likely primary. | resolver/merge mismatch + handoff problem |
| about → hero | 1) Enter about. 2) Click logo/name (or equivalent hero nav). 3) Observe arrival in hero. | Stable hero framing with no jump; correct hero orbit baseline. | Known failure: jump or wrong final hero position. | zone about→hero (direct or via scroll); view mode normalization; possibly rapid state updates. | `about` → `hero`. | yes (top-nav programmatic scroll and/or scroll lane). | About branch exit + hero branch + hero orbit re-entry path. | `currentTarget`, `latestAuthoritativeHeroSnapshotRef`, `heroExitSnapshotRef`, `isOrbitingRef`, `heroOrbitStartTimeRef`. | `currentTarget` and hero snapshot refs may carry stale values; filmOffset may not be reset consistently before orbit resumes. | state contamination + writer handoff conflict |
| about → scroll back to project | 1) Enter about. 2) Scroll downward toward projects and stop near previous project area. 3) Repeat with varying speed. | Project camera should reacquire correct selected/focused project pose with stable progression. | Known failure: camera instability/mismatch while returning toward last project. | zone about→projects; projectInfo/focused project reconciliation; direct overrides may linger. | `about` → `project` (or transient overview/projects states depending on scroll thresholds). | yes (manual continuous scroll). | About branch, then project selected/caseStudy resolver branch based on focus/view mode. | `currentTarget`, project lock refs, direct override refs in animation controller. | `currentTarget` may be stale from about; horizontal/project offsets may apply late; filmOffset unlikely primary but possible residual. | state contamination + resolver mismatch |
| about → Work top nav | 1) Enter about. 2) Click Work top nav. 3) Observe transition and final overview framing. | Deterministic about→overview with preserved overview offset and stable settle. | Same corruption profile as about→overview (centering risk). | direct zone intent + scroll jump to overview range. | `about` → `overview`. | yes (programmatic scroll). | About branch exit + overview branch; may bypass gradual scroll path and amplify handoff timing. | `currentTarget`, offset chain, zone override refs. | horizontal offset most at risk; currentTarget may briefly resolve with base target. | handoff + resolver mismatch |
| about → logo/name top nav | 1) Enter about. 2) Click logo/name. 3) Observe hero landing and first orbit frames. | Deterministic return to hero baseline pose and orbit continuity. | Same corruption profile as about→hero (jump/wrong position risk). | direct zone intent + view mode normalization. | `about` → `hero`. | yes (programmatic scroll). | About exit + hero branch + orbit re-entry. | hero snapshot refs + orbit refs + `currentTarget`. | `currentTarget` and hero snapshots may be stale across fast nav lane switch. | state contamination + handoff conflict |
| about → scroll upward/downward | 1) Enter about. 2) Slowly scroll upward toward overview then back down; repeat with fast flick. 3) Observe branch stability and offsets. | Bidirectional stability; no drift, no sudden recentering, no incorrect project capture. | Reported issues when crossing back toward project/overview boundaries from about. | frequent zone recalculation; project boundary selection; hysteresis interactions. | `about` ↔ `overview/projects` depending on thresholds. | yes (manual continuous, velocity-sensitive). | UnifiedCameraController branch switches driven by animation controller state updates. | `currentTarget`, last zone/project refs, direct override release refs. | horizontal offset and currentTarget at risk during rapid threshold crossing; filmOffset likely secondary. | state machine boundary/handoff problem |

---

## 3) Likely root-cause hypotheses (static code inspection)

1. **Multi-lane navigation inputs without canonical intent object**
   - Scroll updates, direct zone/project overrides, and viewMode transitions can each mutate routing signals; About exits can flip multiple inputs near-simultaneously.

2. **Single frame writer with many branch-specific ownership assumptions**
   - `UnifiedCameraController` is the direct camera writer, but its internal branches (about/overview/hero/project/caseStudy + transition refs + orbit refs) depend on timing-sensitive gating.

3. **Offset chain timing / fallback target windows**
   - Overview/project targets depend on layered config merge + offsets. During about exits, a transient fallback/base target can appear before full offset composition applies, causing centered overview symptom.

4. **Hero re-entry snapshot and orbit bootstrapping sensitivity**
   - About→hero can be affected if hero snapshot/orbit initialization consumes stale `currentTarget` or transition residue, producing jump or wrong landing pose.

5. **Boundary churn around projects re-entry**
   - About→projects scroll path is vulnerable to threshold churn and focus reconciliation (zone/project selection vs direct overrides), increasing chance of camera mismatch.

---

## 4) How this can affect future CameraDirector migration

- If About-linked contamination is not characterized first, migration PRs may misattribute defects to new director logic instead of inherited legacy state pollution.
- A transition migrated “successfully” in isolation can still fail when entered from about, creating false negatives in migration validation.
- Overview→hero hardening can be blocked by upstream about exit residues, leading to repeated rollback cycles.
- Any pilot transition selection must include **entry-from-about coverage** to avoid selecting a deceptively low-risk path.

---

## 5) Recommended guardrails before any runtime migration

1. **Repro protocol lock-in**
   - Standardize deterministic repro scripts for each about-linked flow above (slow scroll + fast flick + top-nav).

2. **State snapshot checklist at flow boundaries**
   - At minimum for manual audits: route intent source, zone, cameraState, focused project, and whether about exit used nav or scroll.

3. **Offset integrity checks (manual/diagnostic criteria)**
   - Explicitly validate overview horizontal framing is preserved when entering from about via both Work nav and scroll.

4. **Hero re-entry consistency checks**
   - Validate about→hero landing pose and first orbit frames across repeated cycles.

5. **Migration gating rule**
   - No transition migration PR should proceed unless about-linked repro matrix for that destination family is green in manual verification.

6. **One-transition-per-PR remains mandatory**
   - Prevents conflating about contamination with unrelated migration edits.

---

## 6) Recommended next PR after this audit

### Recommended PR-3: **Navigation intent normalization (docs+small runtime adapter scope)**
Reason:
- The audit indicates core risk stems from multi-lane input ambiguity (scroll vs direct zone/project vs viewMode).
- A canonical navigation intent layer is the most leverageful next step to reduce about-exit ambiguity before ownership migration.

### Conditional fallback alternative (only if one isolated defect is proven)
- If follow-up evidence identifies a single, isolated, deterministic about-exit handoff defect with minimal blast radius, a tiny legacy handoff fix can be considered.
- Current audit does **not** yet establish one isolated defect strongly enough to prefer that path over intent normalization.

---

## Cross-reference
- See `docs/camera-owner-map.md` for writer inventory, transition risk matrix, and ref ownership map used as baseline for this audit.
