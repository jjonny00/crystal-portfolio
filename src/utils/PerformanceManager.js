import RuntimePerformanceTest from '../performance/RuntimePerformanceTest.js';
import { PERFORMANCE_PROFILES } from './deviceProfiles.js';

const STORAGE_KEY = 'crystal-performance-tier';

export default class PerformanceManager {
  constructor() {
    this.tier = 'medium';
    this.profile = PERFORMANCE_PROFILES[this.tier] || PERFORMANCE_PROFILES.medium;
    this._initialized = false;
    this._ready = false;
    this._initPromise = null;
  }

  initialize() {
    if (this._initPromise) return this._initPromise;
    this._initialized = true;

    const storedTier = typeof window !== 'undefined'
      ? window.localStorage.getItem(STORAGE_KEY)
      : null;

    if (storedTier && PERFORMANCE_PROFILES[storedTier]) {
      this.tier = storedTier;
      this.profile = PERFORMANCE_PROFILES[storedTier];
      this._ready = true;
      this._initPromise = Promise.resolve();
    } else {
      this._initPromise = this._runTest().then(() => {
        this._ready = true;
      });
    }

    return this._initPromise;
  }

  _runTest() {
    const tester = new RuntimePerformanceTest();
    return tester.run().then(({ tier }) => {
      if (tier && PERFORMANCE_PROFILES[tier]) {
        this.setProfile(tier);
      }
    });
  }

  isReady() {
    return this._ready;
  }

  getProfile() {
    return this.profile;
  }

  getTier() {
    return this.tier;
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

