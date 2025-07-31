import RuntimePerformanceTest from '../performance/RuntimePerformanceTest.js';
import { PERFORMANCE_PROFILES } from './deviceProfiles.js';

const STORAGE_KEY = 'crystal-performance-tier';

class PerformanceManager {
  constructor() {
    const storedTier = typeof window !== 'undefined'
      ? window.localStorage.getItem(STORAGE_KEY)
      : null;

    this.tier = storedTier || 'medium';
    this.profile = PERFORMANCE_PROFILES[this.tier] || PERFORMANCE_PROFILES.medium;
    this._testStarted = false;

    if (!storedTier) {
      this._runTest();
    } else {
      this._testStarted = true;
    }
  }

  _runTest() {
    this._testStarted = true;
    const tester = new RuntimePerformanceTest();
    tester.run().then(({ tier }) => {
      if (tier && PERFORMANCE_PROFILES[tier]) {
        this.setProfile(tier);
      }
    });
  }

  getProfile() {
    return this.profile;
  }

  setProfile(tier) {
    if (PERFORMANCE_PROFILES[tier]) {
      this.tier = tier;
      this.profile = PERFORMANCE_PROFILES[tier];
      try {
        window.localStorage.setItem(STORAGE_KEY, tier);
      } catch (err) {
        // ignore storage errors
      }
    }
  }
}

const manager = new PerformanceManager();
export default manager;
export const getProfile = () => manager.getProfile();
export const setProfile = (tier) => manager.setProfile(tier);
