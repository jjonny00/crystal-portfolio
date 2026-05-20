const DEV = typeof import.meta !== 'undefined' ? Boolean(import.meta.env?.DEV) : false;

const CATEGORIES = ['position', 'orientation', 'fov', 'filmOffset', 'currentTarget'];

const state = DEV
  ? {
      activeFrame: null,
      totalFramesObserved: 0,
      totalWritesRecorded: 0,
      conflictCount: 0,
      conflictCategories: {},
      conflictPairs: {},
      conflictsByState: {},
      conflictsByCameraState: {},
      conflictsByTransitionOrPhase: {},
      topWriterIds: {},
      highRiskFlowsObserved: {},
      warned: new Set(),
    }
  : null;

const noop = () => {};
const bump = (obj, key) => { obj[key] = (obj[key] || 0) + 1; };
const normalizeWrites = (writes = []) => writes.includes('lookAt') || writes.includes('quaternion') || writes.includes('rotation') ? [...new Set([...writes.filter((w) => !['lookAt','quaternion','rotation'].includes(w)), 'orientation'])] : writes;

export const beginCameraFrame = DEV ? (frameId, context = {}) => {
  if (state.activeFrame) endCameraFrame(state.activeFrame.frameId);
  state.activeFrame = { frameId, context, writesByCategory: new Map() };
  state.totalFramesObserved += 1;
} : noop;

export const recordCameraWrite = DEV ? ({ writerId, writes = [], phase, state: animState, cameraState, reason }) => {
  if (!state.activeFrame) return;
  state.totalWritesRecorded += 1;
  bump(state.topWriterIds, writerId || 'unknown');
  const categories = normalizeWrites(writes);
  categories.forEach((category) => {
    if (!CATEGORIES.includes(category)) return;
    const categorySet = state.activeFrame.writesByCategory.get(category) || new Set();
    categorySet.add(writerId || 'unknown');
    state.activeFrame.writesByCategory.set(category, categorySet);
    if (categorySet.size > 1) {
      const writers = [...categorySet].sort();
      const pair = `${writers[0]} <> ${writers[1]}`;
      const transitionKey = phase || reason || 'unknown';
      const dedupeKey = `${pair}|${category}|${transitionKey}`;
      if (!state.warned.has(dedupeKey)) {
        state.warned.add(dedupeKey);
        state.conflictCount += 1;
        bump(state.conflictCategories, category);
        bump(state.conflictPairs, `${pair}|${category}`);
        bump(state.conflictsByState, animState || 'unknown');
        bump(state.conflictsByCameraState, cameraState || 'unknown');
        bump(state.conflictsByTransitionOrPhase, transitionKey);
        bump(state.highRiskFlowsObserved, `${transitionKey}:${category}`);
        if (globalThis.__CAMERA_WRITE_GUARD_VERBOSE__) {
          console.warn('[CAMERA_WRITE_GUARD] conflict', { pair, category, transitionKey, animState, cameraState });
        }
      }
    }
  });
} : noop;

export const endCameraFrame = DEV ? (frameId) => {
  if (!state.activeFrame) return;
  if (frameId !== undefined && state.activeFrame.frameId !== frameId) return;
  state.activeFrame = null;
} : noop;

export const getCameraWriteGuardSummary = DEV ? () => ({
  totalFramesObserved: state.totalFramesObserved,
  totalWritesRecorded: state.totalWritesRecorded,
  conflictCount: state.conflictCount,
  conflictCategories: { ...state.conflictCategories },
  conflictPairs: { ...state.conflictPairs },
  conflictsByState: { ...state.conflictsByState },
  conflictsByCameraState: { ...state.conflictsByCameraState },
  conflictsByTransitionOrPhase: { ...state.conflictsByTransitionOrPhase },
  topWriterIds: { ...state.topWriterIds },
  highRiskFlowsObserved: { ...state.highRiskFlowsObserved },
}) : () => ({ devOnly: true });

export const printCameraWriteGuardSummary = DEV ? () => {
  console.log('[CAMERA_WRITE_GUARD] summary', getCameraWriteGuardSummary());
} : noop;

export const clearCameraWriteGuardSummary = DEV ? () => {
  Object.assign(state, { activeFrame: null, totalFramesObserved: 0, totalWritesRecorded: 0, conflictCount: 0, conflictCategories: {}, conflictPairs: {}, conflictsByState: {}, conflictsByCameraState: {}, conflictsByTransitionOrPhase: {}, topWriterIds: {}, highRiskFlowsObserved: {}, warned: new Set() });
} : noop;

if (DEV) {
  globalThis.__printCameraWriteGuardSummary = printCameraWriteGuardSummary;
  globalThis.__clearCameraWriteGuardSummary = clearCameraWriteGuardSummary;
}
