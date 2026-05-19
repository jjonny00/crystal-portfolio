import { resolveCameraDestination } from './cameraDestinations';
import { selectTransitionProfile } from './transitionProfiles';

export class CameraDirectorPlan {
  constructor({ getCurrentPose, applyPose, logger = console } = {}) {
    this.getCurrentPose = getCurrentPose;
    this.applyPose = applyPose;
    this.logger = logger;
  }

  planTransition({ fromDestination, toDestination, resolverInput }) {
    const fromPose = this.getCurrentPose?.() ?? null;
    const resolved = resolveCameraDestination({ destination: toDestination, ...resolverInput });
    const profile = selectTransitionProfile(fromDestination, toDestination, resolverInput);

    return { fromPose, toPose: resolved.pose, profile, metadata: resolved.source };
  }
}
