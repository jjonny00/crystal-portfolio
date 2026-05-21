const DEV = typeof import.meta !== 'undefined' ? Boolean(import.meta.env?.DEV) : false;

const CATEGORIES = ['position', 'orientation', 'fov', 'filmOffset', 'currentTarget'];

const buildInitialState = () => ({
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
  conflictDetails: new Map(),
  warned: new Set(),
});

const state = DEV ? buildInitialState() : null;

const noop = () => {};
const bump = (obj, key) => {
  obj[key] = (obj[key] || 0) + 1;
};

const normalizeWrites = (writes = []) => {
  const includesOrientationWrite =
    writes.includes('lookAt') || writes.includes('quaternion') || writes.includes('rotation');

  if (!includesOrientationWrite) return writes;

  return [
    ...new Set([...writes.filter((w) => !['lookAt', 'quaternion', 'rotation'].includes(w)), 'orientation']),
  ];
};

const toSummaryConflictDetails = () => {
  const details = [...state.conflictDetails.values()]
    .map((row) => ({ ...row }))
    .sort((a, b) => b.count - a.count || a.firstSeenAt - b.firstSeenAt);
  return details;
};

export const beginCameraFrame = DEV
  ? (frameId, context = {}) => {
      if (state.activeFrame) endCameraFrame(state.activeFrame.frameId);
      state.activeFrame = { frameId, context, writesByCategory: new Map() };
      state.totalFramesObserved += 1;
    }
  : noop;

export const recordCameraWrite = DEV
  ? ({ writerId, writes = [], phase, state: animState, cameraState, reason, viewMode, selectedProject }) => {
      if (!state.activeFrame) return;
      const normalizedWriterId = writerId || 'unknown';
      const normalizedReason = reason || 'unknown';
      const transitionKey = phase || normalizedReason || 'unknown';

      state.totalWritesRecorded += 1;
      bump(state.topWriterIds, normalizedWriterId);

      const categories = normalizeWrites(writes);
      categories.forEach((category) => {
        if (!CATEGORIES.includes(category)) return;

        const categoryMap = state.activeFrame.writesByCategory.get(category) || new Map();
        categoryMap.set(normalizedWriterId, normalizedReason);
        state.activeFrame.writesByCategory.set(category, categoryMap);

        if (categoryMap.size > 1) {
          const sortedWriters = [...categoryMap.keys()].sort();
          const writerA = sortedWriters[0];
          const writerB = sortedWriters[1];
          const pair = `${writerA} <> ${writerB}`;
          const dedupeKey = `${pair}|${category}|${transitionKey}`;
          const detailKey = `${dedupeKey}|${animState || 'unknown'}|${cameraState || 'unknown'}|${viewMode || 'unknown'}|${selectedProject || 'none'}`;

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
              console.warn('[CAMERA_WRITE_GUARD] conflict', {
                pair,
                category,
                transitionKey,
                animState,
                cameraState,
              });
            }
          }

          const existingDetail = state.conflictDetails.get(detailKey);
          if (existingDetail) {
            existingDetail.count += 1;
          } else {
            state.conflictDetails.set(detailKey, {
              frameId: state.activeFrame.frameId,
              state: animState || 'unknown',
              cameraState: cameraState || 'unknown',
              viewMode: viewMode || 'unknown',
              selectedProject: selectedProject || 'none',
              phase: phase || 'unknown',
              category,
              writerA,
              writerB,
              writerAReason: categoryMap.get(writerA) || 'unknown',
              writerBReason: categoryMap.get(writerB) || 'unknown',
              transitionOrPhase: transitionKey,
              firstSeenAt: state.totalFramesObserved,
              count: 1,
            });
          }
        }
      });
    }
  : noop;

export const endCameraFrame = DEV
  ? (frameId) => {
      if (!state.activeFrame) return;
      if (frameId !== undefined && state.activeFrame.frameId !== frameId) return;
      state.activeFrame = null;
    }
  : noop;

export const getCameraWriteGuardSummary = DEV
  ? () => ({
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
    })
  : () => ({ devOnly: true });

export const printCameraWriteGuardSummary = DEV
  ? () => {
      console.log('[CAMERA_WRITE_GUARD] summary', getCameraWriteGuardSummary());
    }
  : noop;

export const printCameraWriteGuardConflictDetails = DEV
  ? () => {
      const details = toSummaryConflictDetails();
      if (!details.length) {
        console.log('[CAMERA_WRITE_GUARD] conflict details: none recorded');
        return;
      }
      console.table(details);
    }
  : noop;

export const clearCameraWriteGuardSummary = DEV
  ? () => {
      Object.assign(state, buildInitialState());
    }
  : noop;

if (DEV) {
  globalThis.__printCameraWriteGuardSummary = printCameraWriteGuardSummary;
  globalThis.__printCameraWriteGuardConflictDetails = printCameraWriteGuardConflictDetails;
  globalThis.__clearCameraWriteGuardSummary = clearCameraWriteGuardSummary;
}
