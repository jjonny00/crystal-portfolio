const round = (n) => (Number.isFinite(n) ? Number(n.toFixed(6)) : 0);
const dist = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== 3 || b.length !== 3) return 0;
  const dx = (a[0] ?? 0) - (b[0] ?? 0);
  const dy = (a[1] ?? 0) - (b[1] ?? 0);
  const dz = (a[2] ?? 0) - (b[2] ?? 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

export const compareCameraPoses = (legacyPose, resolvedPose, tolerances = {}, options = {}) => {
  if (options?.skip === true) {
    return { status: 'skipped', reason: options.reason || 'context-mismatch', positionDelta: 0, lookAtDelta: 0, fovDelta: 0, filmOffsetDelta: 0, mismatchedFields: 'none' };
  }
  if (!legacyPose || !resolvedPose || resolvedPose?.meta?.unresolved) {
    return { status: 'unresolved', positionDelta: 0, lookAtDelta: 0, fovDelta: 0, filmOffsetDelta: 0, mismatchedFields: 'unresolved' };
  }
  const positionDelta = round(dist(legacyPose.position, resolvedPose.position));
  const lookAtDelta = round(dist(legacyPose.lookAt, resolvedPose.lookAt));
  const fovDelta = round(Math.abs((legacyPose.fov ?? 0) - (resolvedPose.fov ?? 0)));
  const filmOffsetDelta = round(Math.abs((legacyPose.filmOffset ?? 0) - (resolvedPose.filmOffset ?? 0)));
  const mismatches = [];
  if (positionDelta > (tolerances.position ?? 0.0001)) mismatches.push('position');
  if (lookAtDelta > (tolerances.lookAt ?? 0.0001)) mismatches.push('lookAt');
  if (fovDelta > (tolerances.fov ?? 0.0001)) mismatches.push('fov');
  if (filmOffsetDelta > (tolerances.filmOffset ?? 0.0001)) mismatches.push('filmOffset');
  return { status: mismatches.length ? 'mismatch' : 'match', positionDelta, lookAtDelta, fovDelta, filmOffsetDelta, mismatchedFields: mismatches.join(', ') || 'none' };
};
