import * as THREE from 'three';

const toVec3 = (value) => {
  if (!value) return null;
  if (Array.isArray(value) && value.length === 3 && value.every((v) => Number.isFinite(v))) {
    return new THREE.Vector3(value[0], value[1], value[2]);
  }
  if (value.isVector3) return value.clone();
  if (typeof value.x === 'number' && typeof value.y === 'number' && typeof value.z === 'number') {
    return new THREE.Vector3(value.x, value.y, value.z);
  }
  return null;
};

const isFiniteNumber = (value) => typeof value === 'number' && Number.isFinite(value);

export const CAMERA_COMPARE_THRESHOLDS = Object.freeze({
  position: 0.001,
  lookAt: 0.001,
  fov: 0.001,
  filmOffset: 0.001
});

export const validateCameraPose = (pose) => {
  const invalidFields = [];
  const position = toVec3(pose?.position);
  const lookAt = toVec3(pose?.lookAt);
  const fovValid = isFiniteNumber(pose?.fov);
  const filmOffsetValid = isFiniteNumber(pose?.filmOffset);

  if (!position) invalidFields.push('position');
  if (!lookAt) invalidFields.push('lookAt');
  if (!fovValid) invalidFields.push('fov');
  if (!filmOffsetValid) invalidFields.push('filmOffset');

  return {
    valid: invalidFields.length === 0,
    invalidFields,
    normalized: {
      position,
      lookAt,
      fov: fovValid ? pose.fov : null,
      filmOffset: filmOffsetValid ? pose.filmOffset : null
    }
  };
};

export const compareCameraPoses = (legacyPose, resolvedPose) => {
  const legacy = validateCameraPose(legacyPose);
  const resolver = validateCameraPose(resolvedPose);

  if (!legacy.valid || !resolver.valid) {
    const invalidSide = !legacy.valid && !resolver.valid ? 'both' : (!legacy.valid ? 'legacy' : 'resolver');
    return {
      unresolved: true,
      invalidSide,
      invalidFields: {
        legacy: legacy.invalidFields,
        resolver: resolver.invalidFields
      },
      reason: 'pose-missing-or-non-finite'
    };
  }

  const positionDelta = legacy.normalized.position.distanceTo(resolver.normalized.position);
  const lookAtDelta = legacy.normalized.lookAt.distanceTo(resolver.normalized.lookAt);
  const fovDelta = Math.abs(legacy.normalized.fov - resolver.normalized.fov);
  const filmOffsetDelta = Math.abs(legacy.normalized.filmOffset - resolver.normalized.filmOffset);

  return {
    unresolved: false,
    positionDelta,
    lookAtDelta,
    fovDelta,
    filmOffsetDelta
  };
};

export const getMismatchedFields = (delta, thresholds = CAMERA_COMPARE_THRESHOLDS) => {
  if (delta?.unresolved) return [];
  const mismatchedFields = [];
  if (delta.positionDelta > thresholds.position) mismatchedFields.push('position');
  if (delta.lookAtDelta > thresholds.lookAt) mismatchedFields.push('lookAt');
  if (delta.fovDelta > thresholds.fov) mismatchedFields.push('fov');
  if (delta.filmOffsetDelta > thresholds.filmOffset) mismatchedFields.push('filmOffset');
  return mismatchedFields;
};

export const isCameraPoseMatch = (delta, thresholds = {}) => {
  if (delta?.unresolved) return false;
  const t = { ...CAMERA_COMPARE_THRESHOLDS, ...thresholds };
  return (
    delta.positionDelta <= t.position &&
    delta.lookAtDelta <= t.lookAt &&
    delta.fovDelta <= t.fov &&
    delta.filmOffsetDelta <= t.filmOffset
  );
};
