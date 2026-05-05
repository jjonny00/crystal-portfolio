const IOS_26_REGEX = /OS 26[_\.]/i;
const SAFARI_26_REGEX = /Version\/26\./i;
const A18_REGEX = /A18(?:\b|\w)/i;
const DEVICE_REGEX = /(iPhone|iPad)17,/i;

function normalizeMajor(versionString = '') {
  return versionString.split('.')[0];
}

function hasIOS26ViaUAData(uaData, majorVersionHint) {
  if (!uaData) return false;

  const platform = uaData.platform || '';
  const platformVersion = uaData.platformVersion || majorVersionHint || '';
  const major = normalizeMajor(platformVersion);

  if (!major) return false;

  const isIOSPlatform = /ios|iphone|ipad/.test(platform.toLowerCase());

  if (isIOSPlatform && major === '26') {
    return true;
  }

  // iPadOS can masquerade as macOS in UAData, fall back to touch heuristic
  if (!isIOSPlatform && /mac/i.test(platform) && typeof navigator !== 'undefined') {
    if (navigator.maxTouchPoints > 1 && major === '26') {
      return true;
    }
  }

  return false;
}

let cachedEntropy;
let entropyRequested = false;

async function requestHighEntropyValues(uaData) {
  if (!uaData || typeof uaData.getHighEntropyValues !== 'function') {
    return null;
  }

  if (cachedEntropy) {
    return cachedEntropy;
  }

  if (entropyRequested) {
    return null;
  }

  entropyRequested = true;

  try {
    const values = await uaData.getHighEntropyValues(['platformVersion', 'architecture', 'model']);
    cachedEntropy = values;
    return cachedEntropy;
  } catch (error) {
    console.debug('[isIOS26] Failed to retrieve high entropy UA data', error);
    entropyRequested = false;
    return null;
  }
}

export function isIOS26(entropyValues) {
  if (typeof navigator === 'undefined') {
    return false;
  }

  const ua = navigator.userAgent || '';
  const uaData = navigator.userAgentData;

  const resolvedEntropy = entropyValues || cachedEntropy;
  const model = resolvedEntropy?.model || '';
  const architecture = resolvedEntropy?.architecture || '';
  const platformVersion = resolvedEntropy?.platformVersion;

  if (
    IOS_26_REGEX.test(ua) ||
    SAFARI_26_REGEX.test(ua) ||
    DEVICE_REGEX.test(ua) ||
    A18_REGEX.test(ua) ||
    DEVICE_REGEX.test(model) ||
    A18_REGEX.test(architecture)
  ) {
    return true;
  }

  if (hasIOS26ViaUAData(uaData, platformVersion)) {
    return true;
  }

  if (platformVersion && normalizeMajor(platformVersion) === '26') {
    return true;
  }

  // Fire-and-forget attempt to fetch richer UA hints for future calls
  requestHighEntropyValues(uaData);

  return false;
}
