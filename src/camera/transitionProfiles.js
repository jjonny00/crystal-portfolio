export const CAMERA_TRANSITION_PROFILES = Object.freeze({
  defaultSmooth: { id: 'defaultSmooth', style: 'smooth', durationMs: 700, easing: 'expoOut' },
  projectSmooth: { id: 'projectSmooth', style: 'smooth', durationMs: 700, easing: 'expoOut' },
  caseStudySmooth: { id: 'caseStudySmooth', style: 'smooth', durationMs: 700, easing: 'expoOut' },
  aboutSmooth: { id: 'aboutSmooth', style: 'smooth', durationMs: 700, easing: 'expoOut' },
  introHeroSmooth: { id: 'introHeroSmooth', style: 'smooth', durationMs: 900, easing: 'expoOut' },
  heroOverviewCinematic: { id: 'heroOverviewCinematic', style: 'cinematicBlast', durationMs: 1600, easing: 'customHeroOverview' }
});

export const selectTransitionProfile = (fromDestination, toDestination) => {
  if (fromDestination === 'hero' && toDestination === 'overview') return CAMERA_TRANSITION_PROFILES.heroOverviewCinematic;
  if (fromDestination === 'intro' && toDestination === 'hero') return CAMERA_TRANSITION_PROFILES.introHeroSmooth;
  if (toDestination === 'about') return CAMERA_TRANSITION_PROFILES.aboutSmooth;
  if (toDestination === 'project') return CAMERA_TRANSITION_PROFILES.projectSmooth;
  if (toDestination === 'caseStudy') return CAMERA_TRANSITION_PROFILES.caseStudySmooth;
  return CAMERA_TRANSITION_PROFILES.defaultSmooth;
};
