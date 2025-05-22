// src/utils/fpsMonitor.js
// Utility functions for FPS monitoring and performance tracking

/**
 * Simple FPS Calculator
 * Lightweight FPS tracking without React dependencies
 */
export class FPSMonitor {
  constructor(sampleSize = 60) {
    this.sampleSize = sampleSize;
    this.frameTimes = [];
    this.lastTime = performance.now();
    this.callbacks = [];
    this.isRunning = false;
    
    // Stats
    this.currentFPS = 0;
    this.averageFPS = 0;
    this.minFPS = 0;
    this.maxFPS = 0;
  }
  
  /**
   * Start monitoring FPS
   */
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastTime = performance.now();
    this.tick();
  }
  
  /**
   * Stop monitoring FPS
   */
  stop() {
    this.isRunning = false;
  }
  
  /**
   * Internal tick function
   */
  tick() {
    if (!this.isRunning) return;
    
    const now = performance.now();
    const delta = now - this.lastTime;
    
    if (delta > 0) {
      const fps = 1000 / delta;
      this.addSample(fps);
    }
    
    this.lastTime = now;
    
    // Continue monitoring
    requestAnimationFrame(() => this.tick());
  }
  
  /**
   * Add FPS sample and calculate stats
   */
  addSample(fps) {
    this.frameTimes.push(fps);
    
    // Keep only recent samples
    if (this.frameTimes.length > this.sampleSize) {
      this.frameTimes.shift();
    }
    
    // Calculate stats
    this.currentFPS = Math.round(fps);
    this.averageFPS = Math.round(
      this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length
    );
    this.minFPS = Math.round(Math.min(...this.frameTimes));
    this.maxFPS = Math.round(Math.max(...this.frameTimes));
    
    // Notify callbacks
    this.callbacks.forEach(callback => {
      callback({
        current: this.currentFPS,
        average: this.averageFPS,
        min: this.minFPS,
        max: this.maxFPS
      });
    });
  }
  
  /**
   * Subscribe to FPS updates
   */
  subscribe(callback) {
    this.callbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }
  
  /**
   * Get current stats
   */
  getStats() {
    return {
      current: this.currentFPS,
      average: this.averageFPS,
      min: this.minFPS,
      max: this.maxFPS,
      samples: this.frameTimes.length
    };
  }
  
  /**
   * Reset all stats
   */
  reset() {
    this.frameTimes = [];
    this.currentFPS = 0;
    this.averageFPS = 0;
    this.minFPS = 0;
    this.maxFPS = 0;
  }
}

/**
 * Performance threshold checker
 */
export class PerformanceWatcher {
  constructor(options = {}) {
    this.thresholds = {
      critical: options.critical || 20,
      poor: options.poor || 30,
      fair: options.fair || 45,
      good: options.good || 55,
      ...options.thresholds
    };
    
    this.callbacks = {
      critical: [],
      poor: [],
      fair: [],
      good: [],
      excellent: []
    };
    
    this.currentLevel = 'unknown';
    this.alertCooldown = options.alertCooldown || 3000; // 3 seconds
    this.lastAlert = 0;
  }
  
  /**
   * Check performance level based on FPS
   */
  checkPerformance(fps) {
    let newLevel = 'excellent';
    
    if (fps < this.thresholds.critical) {
      newLevel = 'critical';
    } else if (fps < this.thresholds.poor) {
      newLevel = 'poor';
    } else if (fps < this.thresholds.fair) {
      newLevel = 'fair';
    } else if (fps < this.thresholds.good) {
      newLevel = 'good';
    }
    
    // Only trigger callbacks if level changed
    if (newLevel !== this.currentLevel) {
      this.currentLevel = newLevel;
      this.triggerCallbacks(newLevel, fps);
    }
    
    return newLevel;
  }
  
  /**
   * Trigger callbacks for performance level
   */
  triggerCallbacks(level, fps) {
    const now = performance.now();
    
    // Respect cooldown for alerts
    if (level === 'critical' || level === 'poor') {
      if (now - this.lastAlert < this.alertCooldown) {
        return;
      }
      this.lastAlert = now;
    }
    
    // Call registered callbacks
    this.callbacks[level].forEach(callback => {
      try {
        callback({ level, fps, timestamp: now });
      } catch (error) {
        console.warn('Performance callback error:', error);
      }
    });
  }
  
  /**
   * Subscribe to performance level changes
   */
  onPerformanceChange(level, callback) {
    if (this.callbacks[level]) {
      this.callbacks[level].push(callback);
      
      // Return unsubscribe function
      return () => {
        const index = this.callbacks[level].indexOf(callback);
        if (index > -1) {
          this.callbacks[level].splice(index, 1);
        }
      };
    }
  }
  
  /**
   * Get current performance info
   */
  getCurrentPerformance() {
    return {
      level: this.currentLevel,
      thresholds: this.thresholds
    };
  }
}

/**
 * Auto-optimization system
 * Automatically adjusts settings based on performance
 */
export class AutoOptimizer {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.aggressiveMode = options.aggressive || false;
    this.adjustmentDelay = options.adjustmentDelay || 5000; // 5 seconds
    
    this.lastAdjustment = 0;
    this.adjustmentHistory = [];
    this.onOptimizationChange = options.onOptimizationChange || (() => {});
    
    // Performance targets
    this.targets = {
      mobile: 30,
      tablet: 45,
      desktop: 60,
      ...options.targets
    };
  }
  
  /**
   * Analyze performance and suggest optimizations
   */
  analyzeAndOptimize(fps, averageFps, deviceProfile, currentSettings) {
    if (!this.enabled) return null;
    
    const now = performance.now();
    
    // Don't adjust too frequently
    if (now - this.lastAdjustment < this.adjustmentDelay) {
      return null;
    }
    
    const target = this.targets[deviceProfile.category] || this.targets.desktop;
    const suggestions = [];
    
    // If significantly below target, suggest optimizations
    if (averageFps < target * 0.8) {
      suggestions.push(...this.generateOptimizations(averageFps, target, currentSettings));
    }
    
    // If way above target, suggest quality improvements
    if (averageFps > target * 1.3 && !this.aggressiveMode) {
      suggestions.push(...this.generateQualityImprovements(averageFps, target, currentSettings));
    }
    
    if (suggestions.length > 0) {
      this.lastAdjustment = now;
      this.adjustmentHistory.push({
        timestamp: now,
        fps: averageFps,
        target,
        suggestions: suggestions.slice()
      });
      
      // Keep history limited
      if (this.adjustmentHistory.length > 10) {
        this.adjustmentHistory.shift();
      }
      
      this.onOptimizationChange(suggestions, { fps: averageFps, target });
      
      return suggestions;
    }
    
    return null;
  }
  
  /**
   * Generate optimization suggestions to improve performance
   */
  generateOptimizations(currentFps, targetFps, settings) {
    const suggestions = [];
    const severity = targetFps - currentFps;
    
    // Prioritize optimizations by impact
    if (severity > 20) {
      // Critical performance issues
      if (settings.usePBR) {
        suggestions.push({
          setting: 'usePBR',
          value: false,
          reason: 'Disable PBR materials for major performance boost',
          impact: 'high'
        });
      }
      
      if (settings.renderScale > 0.6) {
        suggestions.push({
          setting: 'renderScale',
          value: Math.max(0.5, settings.renderScale - 0.2),
          reason: 'Reduce render resolution',
          impact: 'high'
        });
      }
    } else if (severity > 10) {
      // Moderate issues
      if (settings.postProcessing.bloom) {
        suggestions.push({
          setting: 'postProcessing.bloom',
          value: false,
          reason: 'Disable bloom effect',
          impact: 'medium'
        });
      }
      
      if (settings.useNormalMaps) {
        suggestions.push({
          setting: 'useNormalMaps',
          value: false,
          reason: 'Disable normal maps',
          impact: 'medium'
        });
      }
    } else {
      // Minor optimizations
      if (settings.textureQuality === 'high') {
        suggestions.push({
          setting: 'textureQuality',
          value: 'medium',
          reason: 'Reduce texture quality',
          impact: 'low'
        });
      }
    }
    
    return suggestions;
  }
  
  /**
   * Generate quality improvement suggestions when performance allows
   */
  generateQualityImprovements(currentFps, targetFps, settings) {
    const suggestions = [];
    const headroom = currentFps - targetFps;
    
    if (headroom > 15) {
      // Significant headroom - can improve quality
      if (!settings.usePBR) {
        suggestions.push({
          setting: 'usePBR',
          value: true,
          reason: 'Enable PBR materials for better visuals',
          impact: 'high'
        });
      }
      
      if (settings.renderScale < 1.0) {
        suggestions.push({
          setting: 'renderScale',
          value: Math.min(1.0, settings.renderScale + 0.1),
          reason: 'Increase render resolution',
          impact: 'medium'
        });
      }
    }
    
    return suggestions;
  }
  
  /**
   * Get optimization history
   */
  getHistory() {
    return this.adjustmentHistory.slice();
  }
  
  /**
   * Clear optimization history
   */
  clearHistory() {
    this.adjustmentHistory = [];
  }
}

/**
 * Global FPS monitor instance
 * Singleton for application-wide FPS monitoring
 */
let globalFPSMonitor = null;

export const getGlobalFPSMonitor = () => {
  if (!globalFPSMonitor) {
    globalFPSMonitor = new FPSMonitor();
  }
  return globalFPSMonitor;
};

/**
 * Performance utilities
 */
export const performanceUtils = {
  /**
   * Get performance color based on FPS
   */
  getPerformanceColor(fps) {
    if (fps >= 55) return '#4CAF50'; // Green
    if (fps >= 45) return '#8BC34A'; // Light Green
    if (fps >= 30) return '#FFC107'; // Yellow
    if (fps >= 20) return '#FF9800'; // Orange
    return '#F44336'; // Red
  },
  
  /**
   * Get performance description
   */
  getPerformanceDescription(fps) {
    if (fps >= 55) return 'Excellent';
    if (fps >= 45) return 'Good';
    if (fps >= 30) return 'Fair';
    if (fps >= 20) return 'Poor';
    return 'Critical';
  },
  
  /**
   * Format FPS for display
   */
  formatFPS(fps) {
    return `${Math.round(fps)} FPS`;
  },
  
  /**
   * Calculate performance score (0-100)
   */
  calculateScore(fps, target = 60) {
    return Math.min(100, Math.round((fps / target) * 100));
  }
};