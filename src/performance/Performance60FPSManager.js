export default class Performance60FPSManager {
  constructor() {
    this.targetFPS = 60;
    this.acceptableRange = { min: 55, target: 60, max: 65 };
    this.fpsHistory = [];
    this.qualityLevels = ['ultra', 'high', 'medium', 'low', 'minimal'];
    this.currentLevel = 2; // Start at medium
    this.degradationCooldown = 2000; // 2 seconds between adjustments
    this.lastAdjustment = 0;
  }

  update(deltaTime) {
    const currentFPS = 1000 / deltaTime;
    this.fpsHistory.push(currentFPS);

    // Maintain 30-frame window (0.5 seconds at 60 FPS)
    if (this.fpsHistory.length > 30) this.fpsHistory.shift();

    const avgFPS = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
    const now = Date.now();

    // Check cooldown
    if (now - this.lastAdjustment < this.degradationCooldown) return;

    if (avgFPS < this.acceptableRange.min && this.currentLevel < this.qualityLevels.length - 1) {
      this.downgrade();
      this.lastAdjustment = now;
      this.fpsHistory = [];
    } else if (avgFPS > this.acceptableRange.max && this.currentLevel > 0) {
      this.upgrade();
      this.lastAdjustment = now;
      this.fpsHistory = [];
    }
  }

  downgrade() {
    this.currentLevel++;
    this.applyQualityLevel(this.qualityLevels[this.currentLevel]);
  }

  upgrade() {
    this.currentLevel--;
    this.applyQualityLevel(this.qualityLevels[this.currentLevel]);
  }

  // Placeholder - applications should override
  applyQualityLevel(level) {
    console.log(`Switching to quality level: ${level}`);
  }
}
