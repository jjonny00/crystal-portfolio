// src/performance/EnhancedLoadingManager.js
// Tracks progress across loading phases and updates UI
import { LOADING_PHASES } from './loadingPhases';

export default class EnhancedLoadingManager {
  constructor() {
    this.currentPhase = null;
    this.phaseProgress = 0;
    this.totalProgress = 0;
    this.currentSubmessage = 0;
  }

  startPhase(phaseName) {
    this.currentPhase = LOADING_PHASES[phaseName];
    this.phaseProgress = 0;
    this.currentSubmessage = 0;
    this.updateProgress();
  }

  updatePhaseProgress(progress, customMessage = null) {
    this.phaseProgress = progress;
    const submessageIndex = Math.floor(
      (progress / 100) * this.currentPhase.submessages.length
    );
    this.currentSubmessage = Math.min(
      submessageIndex,
      this.currentPhase.submessages.length - 1
    );
    this.updateProgress(customMessage);
  }

  updateProgress(customMessage = null) {
    const completedWeight = this.getCompletedPhaseWeight();
    const currentPhaseWeight = this.currentPhase.weight;
    const currentPhaseProgress = (this.phaseProgress / 100) * currentPhaseWeight;
    this.totalProgress = completedWeight + currentPhaseProgress;

    const displayMessage = customMessage || this.currentPhase.message;
    const submessage = this.currentPhase.submessages[this.currentSubmessage];

    this.updateLoadingScreen(this.totalProgress, displayMessage, submessage);
  }

  getCompletedPhaseWeight() {
    const phases = Object.values(LOADING_PHASES);
    const index = phases.indexOf(this.currentPhase);
    if (index <= 0) return 0;
    return phases
      .slice(0, index)
      .reduce((sum, phase) => sum + phase.weight, 0);
  }

  // Default hook for updating DOM; applications can override
  updateLoadingScreen(total, message, submessage) {
    if (window.updateImmediateLoader) {
      window.updateImmediateLoader(total, message, submessage, null);
    }
  }
}
