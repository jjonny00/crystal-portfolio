const DEBUG_FLAG_KEY = 'crystalDebugLogs';

const isDev = () => Boolean(import.meta?.env?.DEV);

const getDebugConfig = () => {
  if (typeof window === 'undefined') return { enabled: false, scopes: [] };

  const raw = window.localStorage?.getItem(DEBUG_FLAG_KEY);
  if (!raw) return { enabled: false, scopes: [] };

  if (raw === '1' || raw.toLowerCase() === 'true' || raw.toLowerCase() === 'all') {
    return { enabled: true, scopes: [] };
  }

  const scopes = raw
    .split(',')
    .map((scope) => scope.trim())
    .filter(Boolean);

  return { enabled: scopes.length > 0, scopes };
};

const shouldDebugScope = (scope) => {
  if (!isDev()) return false;

  const { enabled, scopes } = getDebugConfig();
  if (!enabled) return false;
  if (scopes.length === 0) return true;

  return scopes.includes(scope);
};

export const createLogger = (scope) => {
  const prefix = `[${scope}]`;

  return {
    debug: (...args) => {
      if (!shouldDebugScope(scope)) return;
      console.debug(prefix, ...args);
    },
    info: (...args) => {
      if (!shouldDebugScope(scope)) return;
      console.info(prefix, ...args);
    },
    warn: (...args) => {
      if (!isDev()) return;
      console.warn(prefix, ...args);
    },
    error: (...args) => {
      console.error(prefix, ...args);
    },
  };
};
