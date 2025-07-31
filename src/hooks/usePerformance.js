import { useState, useEffect, useCallback } from 'react';
import PerformanceManager from '../utils/PerformanceManager';

const manager = new PerformanceManager();

export const usePerformance = () => {
  const [profile, setProfile] = useState(manager.getProfile());
  const [tier, setTier] = useState(manager.getTier());
  const [isReady, setIsReady] = useState(manager.isReady());

  useEffect(() => {
    manager.initialize().then(() => {
      setProfile(manager.getProfile());
      setTier(manager.getTier());
      setIsReady(true);
    });
  }, []);

  const updateProfile = useCallback((tier) => {
    manager.setProfile(tier);
    setProfile(manager.getProfile());
    setTier(manager.getTier());
  }, []);

  return { profile, tier, isReady, updateProfile };
};

export default usePerformance;
