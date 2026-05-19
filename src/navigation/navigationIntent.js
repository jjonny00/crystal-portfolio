export const NAVIGATION_DESTINATIONS = Object.freeze({
  INTRO: 'intro',
  HERO: 'hero',
  OVERVIEW: 'overview',
  ABOUT: 'about',
  PROJECT: 'project',
  CASE_STUDY: 'caseStudy',
});

const ZONE_TO_DESTINATION = Object.freeze({
  intro: NAVIGATION_DESTINATIONS.INTRO,
  hero: NAVIGATION_DESTINATIONS.HERO,
  overview: NAVIGATION_DESTINATIONS.OVERVIEW,
  about: NAVIGATION_DESTINATIONS.ABOUT,
});

export const mapZoneToDestination = (zone) => ZONE_TO_DESTINATION[zone] || null;

export const normalizeNavigationIntent = (input = {}) => {
  const destination = input.destination || mapZoneToDestination(input.zone);
  if (!destination) {
    throw new Error('normalizeNavigationIntent requires a valid destination or zone.');
  }

  return {
    destination,
    zone: input.zone ?? null,
    projectId: input.projectId ?? null,
    source: input.source ?? 'unknown',
    behavior: input.behavior ?? 'auto',
    legacyAction: input.legacyAction ?? null,
  };
};

export const createNavigationIntentRequester = ({ onIntent, onDestinationChange } = {}) => {
  let lastDestination = null;

  return (rawIntent) => {
    const intent = normalizeNavigationIntent(rawIntent);

    if (intent.destination !== lastDestination) {
      onDestinationChange?.(intent.destination, lastDestination, intent);
      lastDestination = intent.destination;
    }

    onIntent?.(intent);
    return intent;
  };
};
