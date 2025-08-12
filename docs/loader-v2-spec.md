# Loader V2 – Visual Spec (authoritative for Codex)

Scope
- Only replace the loader UI. Do NOT touch performance/testing logic or device profiles.

Files to touch
- /src/ui/LoaderV2.tsx
- /src/ui/LoaderV2.module.css

Assets
- Diamond SVG is at: /public/assets/ui/diamond.svg  (reference via URL: "/assets/ui/diamond.svg")

Layout
- Headline <h1> centered above meter: "Multifaceted Designer" with gradient (mint→lavender).
- Meter = 3 concentric progress rings (outer mint, middle lavender, inner peach).
- Diamond icon sits centered inside the rings.
- Percent text sits inside the inner ring.
- Status line under meter with three pulsing dots.

Colors (CSS vars)
--bg: #0B0B0C
--ring1: #9CF6DC
--ring2: #B2A3FF
--ring3: #FFB15A
--ringTrack: rgba(255,255,255,0.08)
--text: #E9E7F0
--offwhite: #F4F2E6

Typography
- Headline: bold, clamp(28px,6vw,64px), CSS text gradient left→right (ring1→ring2).

Rings
- SVG <circle> tracks + progress (stroke-linecap: round).
- Stroke: 6px desktop, 4px mobile.
- Progress driven by props:
  { phase: 'starting'|'loading'|'testing', phaseProgress: 0..1, overallProgress: 0..1 }
- Completed rings lock at 100%. Next ring animates with strokeDasharray.
- Respect prefers-reduced-motion (no sweep; dots stop pulsing).

## DIAMOND PLACEMENT (strict rules)
Goal: identical centering and proportion at all sizes; never overlaps ring strokes.

Coordinate system
- Meter SVG viewBox is centered at (0,0) with size = `[-S/2, -S/2, S, S]`.
- Outer ring radius = `R` (e.g., 100). Stroke width = `W` (6 desktop, 4 mobile).
- “Safe radius” for content inside rings = `R - (W * 1.5) - gap`, where `gap = 10`.

Sizing
- Diamond should appear visually prominent but not touch the inner ring.
- Target diamond BOX size = `D = safeRadius * 1.10` (so the diamond’s longest dimension fits inside).
- The diamond keeps its aspect ratio and scales to **fit** within a square of side `D*2` (because radii are measured from center).
- Final scale factor = `scale = (D*2) / min(svgWidth, svgHeight)` applied uniformly.

Placement
- The diamond is centered exactly at (0,0).
- Use `<image href="/assets/ui/diamond.svg" x={-box/2} y={-box/2} width={box} height={box} preserveAspectRatio="xMidYMid meet" />`
  where `box = D*2`.
- No manual pixel nudges. If needed, expose a tiny CSS custom property `--diamond-scale` default 1.0 to allow design nudging without code changes.

Visual styling
- Tint diamond via a white overlay: apply `filter: drop-shadow(0 0 10px rgba(255,255,240,0.25))`.
- Do NOT recolor the actual SVG file. Keep it as-is and control look via CSS/filter only.

Accessibility
- Headline is <h1>.
- Status region uses `aria-live="polite"`.

Acceptance checks
- At 320px wide (mobile) and 1440px+ (desktop), the diamond remains centered and never intersects ring strokes.
- Resizing the window preserves centering and proportion.
- Changing stroke width between 4px/6px does not cause overlap.
- If the SVG has extra viewBox padding, `preserveAspectRatio="xMidYMid meet"` still centers it perfectly.
