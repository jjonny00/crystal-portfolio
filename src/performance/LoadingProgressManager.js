export default class LoadingProgressManager {
  constructor(onProgressUpdate) {
    this.tasks = new Map();
    this.onProgressUpdate = onProgressUpdate;
    this.startTime = Date.now();
  }

  defineTasks() {
    return [
      { id: 'gpu-detect', name: 'Detecting GPU', weight: 5 },
      { id: 'load-models', name: 'Loading 3D models', weight: 25 },
      { id: 'load-textures', name: 'Loading textures', weight: 15 },
      { id: 'load-hdri', name: 'Loading environment', weight: 10 },
      { id: 'compile-shaders', name: 'Compiling shaders', weight: 15 },
      { id: 'warmup-scene', name: 'Optimizing performance', weight: 20 },
      { id: 'final-quality', name: 'Applying settings', weight: 10 }
    ];
  }

  async executeWithProgress() {
    const tasks = this.defineTasks();
    let completedWeight = 0;
    const totalWeight = tasks.reduce((sum, task) => sum + task.weight, 0);

    for (const task of tasks) {
      try {
        await this.executeTask(task, completedWeight, totalWeight);
        completedWeight += task.weight;
      } catch (error) {
        console.error(`Task ${task.id} failed:`, error);
        completedWeight += task.weight;
      }

      // Ensure progress is updated after each task completes
      this.onProgressUpdate({
        progress: (completedWeight / totalWeight) * 100,
        currentTask: task.name,
        isIndeterminate: false
      });
    }

    return {
      loadTime: Date.now() - this.startTime,
      success: true
    };
  }

  async executeTask(task, completedWeight, totalWeight) {
    // Estimated durations for each task (ms)
    const durations = {
      'gpu-detect': 300,
      'load-models': 800,
      'load-textures': 600,
      'load-hdri': 500,
      'compile-shaders': 600,
      'warmup-scene': 800,
      'final-quality': 400
    };

    const duration = durations[task.id] || 300;
    return this.simulateWork(duration, completedWeight, task.weight, totalWeight, task.name);
  }

  // Placeholder progress simulation that provides smooth updates for each task
  simulateWork(duration, completedWeight, taskWeight, totalWeight, taskName) {
    return new Promise((resolve) => {
      const start = performance.now();

      const tick = () => {
        const elapsed = performance.now() - start;
        const fraction = Math.min(elapsed / duration, 1);
        const overall = ((completedWeight + taskWeight * fraction) / totalWeight) * 100;

        this.onProgressUpdate({
          progress: overall,
          currentTask: taskName,
          isIndeterminate: false
        });

        if (fraction < 1) {
          setTimeout(tick, 50);
        } else {
          resolve();
        }
      };

      tick();
    });
  }
}
