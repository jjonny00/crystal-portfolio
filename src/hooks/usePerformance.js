import { useState, useEffect, useCallback } from 'react';
import PerformanceManager from '../utils/PerformanceManager';

const manager = new PerformanceManager();

export const usePerformance = () => {
  const [profile, setProfile] = useState(manager.getProfile());
  const [isReady, setIsReady] = useState(manager.isReady());

  useEffect(() => {
    manager.initialize().then(() => {
      setProfile(manager.getProfile());
      setIsReady(true);
    });
  }, []);

  const updateProfile = useCallback((tier) => {
    manager.setProfile(tier);
    setProfile(manager.getProfile());
  }, []);

  return { profile, isReady, updateProfile };
};

export default usePerformance;
