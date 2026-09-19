// Performance monitoring and optimization utilities
export class PerformanceMonitor {
  constructor() {
    this.metrics = {
      fps: [],
      memoryUsage: [],
      loadTimes: new Map(),
      renderTimes: []
    };
    this.fpsDisplay = null;
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.isMonitoring = false;
  }

  start(renderer) {
    this.renderer = renderer;
    this.isMonitoring = true;
    this.setupFPSMonitor();
    this.setupMemoryMonitor();
  }

  setupFPSMonitor() {
    let lastTime = performance.now();
    let frames = 0;

    const tick = () => {
      const now = performance.now();
      frames++;

      if (now >= lastTime + 1000) {
        const fps = frames;
        this.metrics.fps.push(fps);
        
        if (this.fpsDisplay) {
          this.fpsDisplay(fps);
        }

        frames = 0;
        lastTime = now;
      }

      if (this.isMonitoring) {
        requestAnimationFrame(tick);
      }
    };

    tick();
  }

  setupMemoryMonitor() {
    if (!performance.memory) {
      console.log('Memory monitoring not available (requires Chrome with --enable-precise-memory-info)');
      return;
    }

    const checkMemory = () => {
      const used = performance.memory.usedJSHeapSize / 1048576;
      const limit = performance.memory.jsHeapSizeLimit / 1048576;
      
      this.metrics.memoryUsage.push({
        used,
        limit,
        percentage: (used / limit) * 100,
        timestamp: Date.now()
      });

      if (this.isMonitoring) {
        setTimeout(checkMemory, 2000);
      }
    };

    checkMemory();
  }

  // Track model loading time
  startLoadTimer(modelId) {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      this.metrics.loadTimes.set(modelId, duration);
      return duration;
    };
  }

  // Track render frame time
  measureFrame(callback) {
    const start = performance.now();
    callback();
    const end = performance.now();
    this.metrics.renderTimes.push(end - start);
    
    // Keep only last 60 frames
    if (this.metrics.renderTimes.length > 60) {
      this.metrics.renderTimes.shift();
    }
  }

  // Get average FPS
  getAverageFPS() {
    if (this.metrics.fps.length === 0) return 0;
    return Math.round(
      this.metrics.fps.reduce((a, b) => a + b, 0) / this.metrics.fps.length
    );
  }

  // Get average render time
  getAverageRenderTime() {
    if (this.metrics.renderTimes.length === 0) return 0;
    return (
      this.metrics.renderTimes.reduce((a, b) => a + b, 0) / 
      this.metrics.renderTimes.length
    ).toFixed(2);
  }

  // Get memory report
  getMemoryReport() {
    if (this.metrics.memoryUsage.length === 0) return null;
    
    const latest = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];
    return {
      used: latest.used.toFixed(2) + ' MB',
      limit: latest.limit.toFixed(2) + ' MB',
      percentage: latest.percentage.toFixed(1) + '%',
      warning: latest.percentage > 80
    };
  }

  // Get load time for model
  getLoadTime(modelId) {
    const time = this.metrics.loadTimes.get(modelId);
    return time ? (time / 1000).toFixed(2) + 's' : 'N/A';
  }

  // Get all metrics summary
  getSummary() {
    return {
      averageFPS: this.getAverageFPS(),
      averageRenderTime: this.getAverageRenderTime() + 'ms',
      memory: this.getMemoryReport(),
      loadTimes: Object.fromEntries(
        Array.from(this.metrics.loadTimes.entries()).map(([id, time]) => [
          id,
          (time / 1000).toFixed(2) + 's'
        ])
      )
    };
  }

  // Mark performance issue
  markIssue(message, severity = 'warning') {
    console.warn(`[Performance ${severity}] ${message}`);
    
    if (severity === 'critical' && this.getAverageFPS() < 30) {
      console.error('Critical performance issue detected!');
    }
  }

  // Stop monitoring
  stop() {
    this.isMonitoring = false;
  }

  // Create performance report
  generateReport() {
    const summary = this.getSummary();
    return `
=== Performance Report ===
FPS: ${summary.averageFPS}
Avg Render Time: ${summary.averageRenderTime}
Memory: ${summary.memory?.used || 'N/A'} / ${summary.memory?.limit || 'N/A'} (${summary.memory?.percentage || 'N/A'})
Models Loaded: ${this.metrics.loadTimes.size}
    `;
  }
}

// STL Loader optimization with streaming
export class OptimizedSTLLoader {
  constructor(scene, cache = null) {
    this.scene = scene;
    this.cache = cache || new Map();
    this.loadingQueue = [];
    this.activeLoads = 0;
    this.maxConcurrentLoads = 2; // Limit concurrent STL loads
  }

  async loadModel(url, modelId) {
    return new Promise((resolve, reject) => {
      // Check cache first
      if (this.cache.has(url)) {
        resolve(this.cache.get(url));
        return;
      }

      // Queue load if already at max
      if (this.activeLoads >= this.maxConcurrentLoads) {
        this.loadingQueue.push({ url, modelId, resolve, reject });
        return;
      }

      this._performLoad(url, modelId, resolve, reject);
    });
  }

  async _performLoad(url, modelId, resolve, reject) {
    this.activeLoads++;

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}`);
      }

      // Stream large files
      const arrayBuffer = await response.arrayBuffer();
      const geometry = this._parseSTL(arrayBuffer);
      geometry.computeVertexNormals();

      this.cache.set(url, geometry);
      resolve(geometry);
    } catch (error) {
      console.error(`Error loading ${modelId}:`, error);
      reject(error);
    } finally {
      this.activeLoads--;
      this._processQueue();
    }
  }

  _processQueue() {
    if (this.loadingQueue.length > 0 && this.activeLoads < this.maxConcurrentLoads) {
      const { url, modelId, resolve, reject } = this.loadingQueue.shift();
      this._performLoad(url, modelId, resolve, reject);
    }
  }

  _parseSTL(arrayBuffer) {
    const view = new DataView(arrayBuffer);
    const triangles = view.getUint32(80, true);
    const geometry = new THREE.BufferGeometry();

    const vertices = [];
    const normals = [];
    const offset = 84;
    const size = 50;

    for (let i = 0; i < triangles; i++) {
      const start = offset + i * size;

      // Normal
      const nx = view.getFloat32(start, true);
      const ny = view.getFloat32(start + 4, true);
      const nz = view.getFloat32(start + 8, true);

      // Vertices
      for (let j = 0; j < 3; j++) {
        const vOffset = start + 12 + j * 12;
        vertices.push(
          view.getFloat32(vOffset, true),
          view.getFloat32(vOffset + 4, true),
          view.getFloat32(vOffset + 8, true)
        );
        normals.push(nx, ny, nz);
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3));

    return geometry;
  }

  clearCache() {
    this.cache.clear();
  }

  getCacheSize() {
    return this.cache.size;
  }
}

// Lazy loading manager
export class LazyLoadManager {
  constructor(scene) {
    this.scene = scene;
    this.visibleLayers = new Set();
    this.loadedModels = new Map();
    this.loadQueue = [];
  }

  setVisibleLayers(layers) {
    this.visibleLayers = new Set(layers);
    this.prioritizeLoading();
  }

  prioritizeLoading() {
    // Load visible layer models first
    for (const layer of this.visibleLayers) {
      if (!this.loadedModels.has(layer)) {
        this.loadQueue.unshift(layer);
      }
    }
  }

  unloadHiddenLayers() {
    for (const [layer, mesh] of this.loadedModels.entries()) {
      if (!this.visibleLayers.has(layer)) {
        this.scene.remove(mesh);
        this.loadedModels.delete(layer);
      }
    }
  }

  getMemoryUsage() {
    let total = 0;
    for (const mesh of this.loadedModels.values()) {
      if (mesh.geometry) {
        const vertices = mesh.geometry.attributes.position?.count || 0;
        total += vertices * 12; // 12 bytes per float32 vertex
      }
    }
    return (total / 1024 / 1024).toFixed(2) + ' MB';
  }
}
