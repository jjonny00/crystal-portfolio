// src/performance/RuntimePerformanceMonitor.js
// Monitors runtime performance and offers user friendly optimisation options

export default class RuntimePerformanceMonitor {
  constructor() {
    this.warningDismissed = false;
    this.retestInProgress = false;
    this.fpsHistory = [];
  }

  checkPerformance(currentFPS) {
    if (this.warningDismissed || this.retestInProgress) return;
    this.fpsHistory.push(currentFPS);
    if (this.fpsHistory.length > 150) {
      this.fpsHistory.shift();
    }
    const recentFPS = this.fpsHistory.slice(-90);
    const avgFPS = recentFPS.reduce((a, b) => a + b, 0) / recentFPS.length;
    if (avgFPS < 30 && recentFPS.length >= 90) {
      this.showPerformanceOptions(Math.round(avgFPS));
    }
  }

  showPerformanceOptions(currentFPS) {
    const modal = this.createPerformanceModal(currentFPS);
    document.body.insertAdjacentHTML('beforeend', modal);
  }

  createPerformanceModal(currentFPS) {
    return `
      <div class="performance-modal-overlay">
        <div class="performance-modal">
          <div class="performance-modal-header">
            <h3>Need smoother performance?</h3>
          </div>
          <div class="performance-modal-content">
            <p>Your experience is averaging <strong>${currentFPS} FPS</strong>. Run a quick test and we'll pick the best settings for you.</p>
            <div class="performance-stats">
              <div class="stat">
                <span class="stat-label">Current Performance:</span>
                <span class="stat-value ${currentFPS < 25 ? 'poor' : 'fair'}">${currentFPS} FPS</span>
              </div>
              <div class="stat">
                <span class="stat-label">Target Performance:</span>
                <span class="stat-value good">30+ FPS</span>
              </div>
            </div>
            <p class="optimization-note">
              <strong>What happens:</strong> we'll test a few quality levels and choose the smoothest one for your device.
            </p>
          </div>
          <div class="performance-modal-actions">
            <button class="btn-optimize primary" onclick="RuntimePerformanceMonitor.instance.handleOptimize()">
              <span class="btn-icon">⚡</span>
              Run Performance Test
              <span class="btn-subtitle">Recommended • 5‑10 seconds</span>
            </button>
            <button class="btn-dismiss secondary" onclick="RuntimePerformanceMonitor.instance.handleDismiss()">
              Keep Current Settings
              <span class="btn-subtitle">Dismiss warning</span>
            </button>
          </div>
          <div class="performance-modal-footer">
            <small>You can adjust settings any time from the controls panel</small>
          </div>
        </div>
      </div>
    `;
  }

  async handleOptimize() {
    this.retestInProgress = true;
    this.hidePerformanceModal();
    this.showOptimizationProgress();
    try {
      const { ProgressivePerformanceTester } = await import('./ProgressivePerformanceTester');
      const tester = new ProgressivePerformanceTester();
      const newSettings = await tester.findOptimalSettings((p, t) => this.updateOptimizationProgress(p, t));
      this.applyNewSettings(newSettings);
      this.showOptimizationSuccess(newSettings);
      this.fpsHistory = [];
    } catch (error) {
      this.showOptimizationFailed();
    }
    this.retestInProgress = false;
  }

  handleDismiss() {
    this.warningDismissed = true;
    this.hidePerformanceModal();
    this.showDismissConfirmation();
  }

  updateOptimizationProgress(progress, text) {
    const fill = document.getElementById('optimization-progress-fill');
    const label = document.getElementById('optimization-progress-text');
    if (fill) fill.style.width = `${progress}%`;
    if (label) label.textContent = text || '';
  }

  showOptimizationProgress() {
    const overlay = `
      <div class="optimization-overlay">
        <div class="optimization-card">
          <div class="optimization-spinner"></div>
          <h4>Optimizing performance...</h4>
          <p>Testing quality levels to keep things smooth</p>
          <div class="optimization-progress">
            <div class="progress-bar">
              <div class="progress-fill" id="optimization-progress-fill"></div>
            </div>
            <span class="progress-text" id="optimization-progress-text">Testing quality settings...</span>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', overlay);
  }

  showOptimizationSuccess(newSettings) {
    const improvements = this.getSettingsChanges(newSettings);
    const successNotification = `
      <div class="success-notification">
        <div class="success-content">
          <span class="success-icon">✅</span>
          <div class="success-text">
            <strong>Performance Optimized!</strong>
            <p>Your experience should now run smoothly at 30+ FPS</p>
            ${improvements.length > 0 ? `
              <details class="settings-changes">
                <summary>What changed</summary>
                <ul>${improvements.map(change => `<li>${change}</li>`).join('')}</ul>
              </details>` : ''}
          </div>
        </div>
      </div>`;
    this.showTemporaryNotification(successNotification, 5000);
  }

  showOptimizationFailed() {
    const notification = `
      <div class="success-notification">
        <div class="success-content">
          <span class="success-icon">❌</span>
          <div class="success-text">
            <strong>Optimization Failed</strong>
            <p>We couldn't find better settings automatically.</p>
          </div>
        </div>
      </div>`;
    this.showTemporaryNotification(notification, 5000);
  }

  showDismissConfirmation() {
    const notification = `
      <div class="success-notification">
        <div class="success-content">
          <span class="success-icon">ℹ️</span>
          <div class="success-text">
            <strong>Continuing with current settings</strong>
          </div>
        </div>
      </div>`;
    this.showTemporaryNotification(notification, 2000);
  }

  hidePerformanceModal() {
    document
      .querySelectorAll('.performance-modal-overlay')
      .forEach(el => el.remove());
  }

  applyNewSettings(settings) {
    // Placeholder to integrate with renderer's settings
    console.log('Applying new settings:', settings);
  }

  getSettingsChanges(newSettings) {
    return Object.keys(newSettings || {});
  }

  showTemporaryNotification(html, duration) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    const element = wrapper.firstElementChild;
    document.body.appendChild(element);
    setTimeout(() => {
      element.remove();
    }, duration);
  }
}

// Expose single instance for modal buttons to access
RuntimePerformanceMonitor.instance = new RuntimePerformanceMonitor();
