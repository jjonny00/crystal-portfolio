# Camera Audit: Overview → Project Timing & Object-Motion Coupling (PR-8)

## Scope and guardrails
- Documentation-only audit of current **legacy** overview → project choreography.
- No runtime changes, no writer suppression changes, no CameraDirector migration in this PR.
- Hero ↔ Overview and About behaviors are referenced only for context; no fixes proposed here.

## 1) Current overview → project camera timing

### Where the transition starts
- The transition intent starts in the animation-state layer when zone resolution enters `projects` and calls `handleProjectFocus(activeProject.project)`.
- `handleProjectFocus` immediately sets `focusedFacet`, `cameraState: 'project'`, and `isTransitioning: false`.
- This is triggered from scroll/zone updates (including top-nav-driven scroll outcomes), not from a dedicated camera transition state machine for overview → project.

### What state/cameraState/viewMode changes trigger it
- Primary trigger is zone change to `projects` plus an active project determination.
- Camera branch selection is based on `animationData.cameraState === 'project' && animationData.state === 'project_focused'` in camera controller branch logging.
- The transition is effectively a branch handoff inside the same frame-driven writer, rather than an explicit authored timeline.

### What writer owns the camera during it
- `UnifiedCameraController` remains the owning writer in `useFrame`.
- Legacy flow writes camera continuously and smooths camera toward `currentTarget`; no separate legacy overview→project transition writer exists.

### Easing and duration/timing values
- Legacy handoff uses exponential smoothing based on frame delta:
  - `smoothingFactor = 1 - exp(-6 * delta)`
  - clamped to `[0.01, 0.15]`
- Camera `position`, derived `lookAt` direction, and `fov` move via this smoothing each frame.
- No fixed configured duration is used for overview → project camera motion in legacy path.

### What clock drives timing
- Frame-time (`delta`) drives smoothing progression.
- Effective transition completion is settle-based (`position/lookAt/fov` epsilon + settle frames), and progress is computed from baseline distance/angle deltas (`cameraMoveProgress`).
- So timing source is neither raw scroll progress nor a fixed duration; it is frame-time smoothing with settle/progress bookkeeping.

## 2) Current project facet/object timing

### Where project facet rotation is controlled
- In `UnifiedCrystalScene` frame loop, per-facet quaternion targets are computed for base/selected/caseStudy states.
- Focused facet rotation interpolation uses `cameraMoveProgress` as the transition progress input.

### What triggers selected project facet rotation
- Trigger conditions for selected facet motion:
  - `animationData.viewMode !== 'caseStudy'`
  - `animationData.focusedFacet === facetKey`
  - `animationData.cameraState === 'project'`
- This occurs when project focus is set by animation controller (`handleProjectFocus`).

### Easing and duration/timing values
- Target focused quaternion is built by slerping base→selected with:
  - `focusRotationProgress = clamp(cameraMoveProgress / FOCUS_ROTATION_PROGRESS_LEAD, 0, 1)`
  - `FOCUS_ROTATION_PROGRESS_LEAD = 1`
- Then mesh applies per-frame slerp toward that target:
  - focused facets: `focusedRotationLerp = min(1, deltaTime * 4)`
  - non-focused facets: `rotationLerp = min(1, deltaTime * 6)`
- No explicit fixed millisecond duration for project-focused rotation; timing is frame-time + camera progress coupling.

### Shared clock with camera?
- Yes, partially and intentionally: facet target progression uses `cameraMoveProgress`, which is produced by camera movement progress/settle in `UnifiedCameraController`.
- Additional facet quaternion convergence then uses per-frame slerp factors (`deltaTime`).

### Scroll/state/frame-time source
- Trigger is state-driven (focused facet + camera state from scroll/zone logic).
- Progress is camera-driven (`cameraMoveProgress`) and frame-time-driven (`deltaTime`).

## 3) Coupling between camera and project object motion

### Do camera and facet rotation share a transition clock?
- Yes: shared `cameraMoveProgress` is the key coupling signal.
- Camera computes progress from actual distance/angle/fov closure to target; crystal scene consumes that progress for focused rotation blending.

### Intentional lead/lag
- Legacy design allows mild lag/smoothing because camera and facet both have frame smoothing layers.
- But target facet orientation progression is gated by camera progress, which keeps macro timing synchronized and prevents camera “arrives instantly while facet starts late” behavior.

### What makes current transition feel correct
- Shared progress coupling + same-frame continuous updates from both systems.
- Camera settle/progress reflects true spatial convergence, then facet rotation uses that same progression instead of an unrelated timer.

### Where PR-7 pilot diverged
- Pilot used CameraDirector duration + `smoothstep` timeline from `elapsed / duration` (generic normalized time), not legacy settle-derived `cameraMoveProgress` choreography.
- Pilot destination resolver gives static pose, but legacy transition feeling depends on runtime-updated composition and progress coupling to facet motion.

## 4) Composition source audit

### Why overview position matched while lookAt/fov/filmOffset differed
- Resolver comparison path for overview pose derives from static config (`cameraPositions/cameraTargets` + offsets), with fixed `fov: 45` and `filmOffset` sourced from hero composition fallback.
- Live pre-selection camera composition is whatever `UnifiedCameraController` has actually evolved to at that frame (`camera position`, inferred live lookAt, current `fov`, current `filmOffset`), including runtime mutations/handoffs/smoothing history.
- Therefore position parity can occur while orientation/composition fields diverge.

### Live overview composition active immediately before project selection
- Pilot instrumentation captures `liveFromPose` from current camera + currentTarget-derived lookAt + active `camera.filmOffset` + `camera.fov` right before starting.
- This live pose is the visual truth at handoff, not necessarily equal to static resolver overview pose.

### Where filmOffset/fov/lookAt are authored/mutated today
- `filmOffset`:
  - Hero composition path (`composition.hero.filmOffsetX`) and explicit non-hero reset-to-zero branch.
  - Transition/handoff branches and pilot writes can also mutate it.
- `fov`:
  - Smoothed toward `currentTarget.current.fov` in frame loop.
  - Set directly in intro/transition special branches as applicable.
- `lookAt`:
  - Updated continuously by camera writer from smoothed direction toward `currentTarget.lookAt`.
  - Overridden in transition/handoff branches when active.

### Is resolver overview pose missing runtime composition state?
- Yes. Resolver pose is a static destination definition; it does not encode all runtime composition state accumulated by current writer flow at transition start.

## 5) Pilot failure analysis

### Wrong start composition cause
- Pilot attempted to normalize `fromPose` against resolved overview pose when deltas were above threshold, forcing a mismatch correction path.
- Because resolved overview pose omitted runtime composition nuances, forcing that pose caused visible jump/blip.

### Camera-arrives-before-facet-rotation cause
- Pilot camera timing used its own duration/ease clock.
- Facet selected rotation still followed legacy camera-progress-coupled logic (`cameraMoveProgress` + per-frame slerp).
- Without parity mapping between pilot progress and legacy movement progress characteristics, camera completion could precede object rotation completion.

### Why generic smoothstep timing failed
- Legacy is not “generic duration-based lerp”; it is branch-coupled frame smoothing with settle-derived progress that downstream object motion consumes.
- Smoothstep timeline lacked this coupled progress semantics.

### Timing/composition source future pilot must consume
- Start composition must come from live runtime camera composition (position + lookAt + fov + filmOffset) at handoff moment.
- Progress/timing must either:
  1) reuse legacy move-progress semantics (`cameraMoveProgress` contract), or
  2) provide a parity signal that downstream facet rotation consumes equivalently.
- Destination resolution alone is insufficient; runtime composition and choreography coupling are required.

## 6) Recommended next implementation PR (smallest safe runtime step)

**Recommendation: Option B (preferred for safety): add shadow-mode instrumentation parity before next runtime attempt.**

Smallest safe step:
- Keep pilot disabled by default.
- Add instrumentation that records, for overview → project attempts:
  - live handoff pose vs resolver pose deltas (`position/lookAt/fov/filmOffset`)
  - legacy cameraMoveProgress curve samples over time
  - focused facet rotation progress samples over same frames
  - relative completion ordering (camera settle vs focused facet near-target)
- No behavior changes; no writer ownership changes.

Rationale:
- Produces concrete parity targets for timing/composition before re-enabling runtime behavior.
- Minimizes regression risk to Hero/Overview/About and unchanged paths.

(If runtime work is required next instead: Option A only if it strictly consumes legacy live handoff composition and legacy-equivalent progress contract while remaining behind flag.)

## 7) Future overview → project pilot retry checklist
- [ ] Flag **off** parity remains unchanged.
- [ ] Flag **on** overview → project via top nav behaves correctly.
- [ ] Flag **on** overview → project via scroll to first project behaves correctly.
- [ ] Focused project facet rotation stays synced with camera transition progression.
- [ ] Project landing pose matches legacy visual composition expectations.
- [ ] Project → overview remains unchanged.
- [ ] Hero → Overview remains unchanged.
- [ ] About flows remain unchanged.
- [ ] No console flooding/regression in diagnostic logs.

---

## Evidence map (key code paths audited)
- Animation-state trigger and project focus handoff: `useUnifiedAnimationController`.
- Camera writer ownership/timing/progress: `UnifiedCameraController`.
- Facet rotation timing/coupling via shared camera progress: `UnifiedCrystalScene`.
- Resolver-vs-legacy composition comparison context: `Fixed3DCanvas`.
- Pilot timing model (`smoothstep` duration clock): `CameraDirector` and pilot integration in `UnifiedCameraController`.
