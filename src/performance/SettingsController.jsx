import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';

// Default high quality settings used when no initial config is provided
const DEFAULT_CONFIG = {
  postProcessing: {
    bloom: true,
    chromaticAberration: true,
    noise: true,
    vignette: true
  },
  renderScale: 1,
  pbrQuality: 'high',
  usePBR: true,
  textureQuality: 'high',
  useNormalMaps: true,
  particleCount: 16,
  simplifiedAnimations: false,
  reducedParticles: false
};

const SettingsContext = createContext({
  config: DEFAULT_CONFIG,
  applyConfig: () => {},
  rollbackConfig: () => {},
  getConfig: () => DEFAULT_CONFIG
});

export const SettingsProvider = ({ children, initialConfig = DEFAULT_CONFIG }) => {
  const [config, setConfig] = useState(initialConfig);
  const previousRef = useRef(initialConfig);
  const configRef = useRef(config);

  // keep ref in sync with state
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // Apply a new configuration atomically
  const applyConfig = useCallback((newConfig) => {
    if (!newConfig || typeof newConfig !== 'object') return;
    setConfig(current => {
      previousRef.current = current;
      return { ...newConfig };
    });
  }, []);

  // Rollback to previously applied configuration
  const rollbackConfig = useCallback(() => {
    setConfig(current => {
      const prev = previousRef.current || current;
      previousRef.current = current;
      return prev;
    });
  }, []);

  const getConfig = useCallback(() => configRef.current, []);

  const value = { config, applyConfig, rollbackConfig, getConfig };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return ctx;
};

export default SettingsProvider;
