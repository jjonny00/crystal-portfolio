import * as THREE from 'three';

/**
 * Simple runtime performance test that measures FPS while rendering
 * a minimal three.js scene.
 */
export default class RuntimePerformanceTest {
  constructor({ sampleInterval = 100, testDuration = 3000 } = {}) {
    this.sampleInterval = sampleInterval;
    this.testDuration = testDuration;
    this.samples = [];
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.meshes = [];
  }

  /**
   * Initialise a tiny scene with a single spinning cube.
   * The renderer uses an unattached canvas so it does not
   * interfere with the visible DOM.
   */
  init() {
    const canvas = document.createElement('canvas');
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
    this.renderer.setSize(256, 256);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 10);
    this.camera.position.z = 2;

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
    this.meshes = [];
    for (let i = 0; i < 5; i++) {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = Math.sin((i / 5) * Math.PI * 2) * 1.5;
      mesh.position.y = Math.cos((i / 5) * Math.PI * 2) * 1.5;
      this.scene.add(mesh);
      this.meshes.push(mesh);
    }

    // Basic lighting
    const ambient = new THREE.AmbientLight(0x404040);
    const directional = new THREE.DirectionalLight(0xffffff, 1);
    directional.position.set(1, 1, 1);
    this.scene.add(ambient);
    this.scene.add(directional);
  }

  /**
   * Run the performance test and resolve with the detected tier
   * and collected statistics.
   */
  run() {
    if (!this.renderer) this.init();

    this.samples = [];
    const start = performance.now();
    let last = start;
    let nextSample = start + this.sampleInterval;

    return new Promise((resolve) => {
      const frame = (time) => {
        // Spin meshes
        for (const mesh of this.meshes) {
          mesh.rotation.x += 0.02;
          mesh.rotation.y += 0.02;
        }

        // Render frame
        this.renderer.render(this.scene, this.camera);

        const delta = time - last;
        last = time;

        if (time >= nextSample) {
          this.samples.push(1000 / delta);
          nextSample += this.sampleInterval;
        }

        if (time - start < this.testDuration) {
          requestAnimationFrame(frame);
        } else {
          const avg = this.samples.reduce((a, b) => a + b, 0) / (this.samples.length || 1);
          const tier = this._tierFromFPS(avg);
          resolve({ tier, avg, samples: this.samples });
        }
      };

      requestAnimationFrame(frame);
    });
  }

  _tierFromFPS(avgFps) {
    if (avgFps >= 40) return 'high';
    if (avgFps >= 25) return 'medium';
    return 'low';
  }
}
