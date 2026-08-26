// src/lib/verticalRailSignal.js
//
// Snapshot store shared between the overview label layer and the vertical energy
// line.
//
// The line is a fixed DOM layer mounted from App, but the state it needs — which
// project is currently active, and whether the overview labels are on screen —
// lives in FacetLabels, which renders through its own `createRoot` portal. React
// context does not cross that root boundary, and lifting hover into App state
// would re-render the whole 3D tree on every pointer move. So the two sides talk
// through this tiny store instead: FacetLabels publishes, the line subscribes and
// writes CSS custom properties.
//
// The active project key/colour published here is the SAME state that drives the
// label's own active treatment, which is fed by both label hover and facet hover
// (see `hoverSourcesRef` in UnifiedCrystalScene) — so the strip stays in sync with
// either interaction without a second source of truth.

const state = {
  overviewVisible: false,
  activeProjectKey: null,
  activeProjectColor: null,
  // Viewport x of the line itself. Polled (by the hover particles, which need it
  // every frame), never reacted to — so it has its own non-emitting setter.
  railX: 0,
};

const listeners = new Set();

const emit = () => {
  listeners.forEach((listener) => listener(state));
};

export const getRailState = () => state;

export const setRailX = (x) => {
  state.railX = Number.isFinite(x) ? x : 0;
};

export const subscribeToRailState = (listener) => {
  listeners.add(listener);
  listener(state);
  return () => {
    listeners.delete(listener);
  };
};

export const setRailOverviewVisible = (visible) => {
  const next = Boolean(visible);
  if (state.overviewVisible === next) return;
  state.overviewVisible = next;
  emit();
};

export const setRailActiveProject = (projectKey = null, projectColor = null) => {
  const key = projectKey || null;
  const color = key ? (projectColor || null) : null;
  if (state.activeProjectKey === key && state.activeProjectColor === color) return;
  state.activeProjectKey = key;
  state.activeProjectColor = color;
  emit();
};
