export const NAV_DESTINATIONS = Object.freeze({
  HERO: 'hero',
  OVERVIEW: 'overview',
  ABOUT: 'about'
});

const zoneByDestination = {
  [NAV_DESTINATIONS.HERO]: 'hero',
  [NAV_DESTINATIONS.OVERVIEW]: 'overview',
  [NAV_DESTINATIONS.ABOUT]: 'about'
};

export const createNavigationIntentRequester = ({ directSelectZone, scrollToSection }) => {
  return ({ destination, projectId = null, source = 'programmatic', scrollBehavior = 'auto' }) => {
    const zoneKey = zoneByDestination[destination];
    if (!zoneKey) return { handled: false, reason: 'unsupported-destination' };

    const legacyActions = [];

    if (typeof directSelectZone === 'function') {
      directSelectZone(zoneKey);
      legacyActions.push('directSelectZone');
    }

    if (typeof scrollToSection === 'function') {
      scrollToSection(zoneKey, scrollBehavior);
      legacyActions.push(`scrollToSection:${scrollBehavior}`);
    }

    if (import.meta.env.DEV) {
      console.log('[navigation-intent] request', { destination, projectId, source, legacyActions });
    }

    return { handled: true, destination: zoneKey, source, legacyActions };
  };
};

export const mapZoneToDestination = (zone) => {
  if (zone === 'hero' || zone === 'overview' || zone === 'about') return zone;
  return null;
};
