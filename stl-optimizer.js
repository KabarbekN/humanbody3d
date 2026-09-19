// STL Streaming and Progressive Loading
export class STLStreamLoader {
  constructor(scene) {
    this.scene = scene;
    this.chunkSize = 1024 * 1024; // 1MB chunks
    this.cache = new Map();
    this.activeLoads = new Map();
    this.maxConcurrent = 2;
  }

  // Load STL file with progress callback
  async loadWithProgress(url, onProgress, onComplete) {
    if (this.cache.has(url)) {
      onComplete(this.cache.get(url));
      return this.cache.get(url);
    }

    try {
      const response = await fetch(url);
      const total = response.headers.get('content-length');
      let loaded = 0;

      const reader = response.body.getReader();
      const chunks = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        loaded += value.length;

        // Call progress callback
        if (onProgress && total) {
          onProgress({
            loaded,
            total: parseInt(total),
            percentage: Math.round((loaded / parseInt(total)) * 100)
          });
        }
      }

      // Combine chunks into single buffer
      const buffer = this.combineChunks(chunks);
      const geometry = this.parseSTL(buffer);
      
      this.cache.set(url, geometry);
      onComplete(geometry);
      
      return geometry;
    } catch (error) {
      console.error('STL loading error:', error);
      throw error;
    }
  }

  combineChunks(chunks) {
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;

    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    return combined.buffer;
  }

  parseSTL(arrayBuffer) {
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
    geometry.computeBoundingBox();
    
    return geometry;
  }

  // Batch load multiple models
  async loadBatch(urls, onBatchProgress) {
    const results = new Map();
    const total = urls.length;
    let completed = 0;

    const loadOne = async (url) => {
      try {
        const geometry = await new Promise((resolve, reject) => {
          this.loadWithProgress(url, null, resolve).catch(reject);
        });
        results.set(url, geometry);
        completed++;
        onBatchProgress?.({
          completed,
          total,
          percentage: Math.round((completed / total) * 100),
          url
        });
      } catch (error) {
        console.error(`Failed to load ${url}:`, error);
      }
    };

    // Load with concurrency control
    const queue = [...urls];
    const promises = [];

    for (let i = 0; i < Math.min(this.maxConcurrent, urls.length); i++) {
      promises.push(this.processQueue(queue, loadOne));
    }

    await Promise.all(promises);
    return results;
  }

  async processQueue(queue, loadFn) {
    while (queue.length > 0) {
      const url = queue.shift();
      await loadFn(url);
    }
  }

  // Calculate memory footprint
  getMemoryUsage() {
    let total = 0;
    for (const [url, geometry] of this.cache.entries()) {
      if (geometry.attributes.position) {
        const positions = geometry.attributes.position.array;
        total += positions.byteLength;
      }
      if (geometry.attributes.normal) {
        const normals = geometry.attributes.normal.array;
        total += normals.byteLength;
      }
    }
    return {
      bytes: total,
      mb: (total / 1024 / 1024).toFixed(2),
      itemCount: this.cache.size
    };
  }

  clearCache() {
    this.cache.clear();
  }

  removeCached(url) {
    this.cache.delete(url);
  }

  // Estimate load time
  estimateLoadTime(url, fileSize = 5) {
    // fileSize in MB
    const networkSpeed = 5; // Mbps average
    const bitsToTransfer = fileSize * 8;
    return (bitsToTransfer / networkSpeed) * 1000; // ms
  }
}

// Model Pool for reusing geometries
export class ModelPool {
  constructor(scene, maxModels = 100) {
    this.scene = scene;
    this.maxModels = maxModels;
    this.pool = new Map();
    this.metadata = new Map();
  }

  // Add model to pool
  add(id, geometry, metadata = {}) {
    if (this.pool.size >= this.maxModels) {
      // Remove oldest
      const oldestKey = this.pool.keys().next().value;
      this.remove(oldestKey);
    }

    this.pool.set(id, geometry);
    this.metadata.set(id, {
      created: Date.now(),
      ...metadata
    });
  }

  // Get model from pool
  get(id) {
    return this.pool.get(id);
  }

  // Remove model from pool
  remove(id) {
    const geometry = this.pool.get(id);
    if (geometry) {
      geometry.dispose();
    }
    this.pool.delete(id);
    this.metadata.delete(id);
  }

  // Clear entire pool
  clear() {
    for (const geometry of this.pool.values()) {
      geometry.dispose();
    }
    this.pool.clear();
    this.metadata.clear();
  }

  // Get pool statistics
  getStats() {
    let totalVertices = 0;
    let totalMemory = 0;

    for (const geometry of this.pool.values()) {
      if (geometry.attributes.position) {
        totalVertices += geometry.attributes.position.count;
        totalMemory += geometry.attributes.position.array.byteLength;
      }
      if (geometry.attributes.normal) {
        totalMemory += geometry.attributes.normal.array.byteLength;
      }
    }

    return {
      modelCount: this.pool.size,
      maxModels: this.maxModels,
      totalVertices,
      totalMemory: (totalMemory / 1024 / 1024).toFixed(2) + ' MB',
      utilization: ((this.pool.size / this.maxModels) * 100).toFixed(1) + '%'
    };
  }

  // Cleanup old models
  cleanup(maxAgeMs = 300000) { // 5 minutes
    const now = Date.now();
    const toRemove = [];

    for (const [id, meta] of this.metadata.entries()) {
      if (now - meta.created > maxAgeMs) {
        toRemove.push(id);
      }
    }

    for (const id of toRemove) {
      this.remove(id);
    }

    return toRemove.length;
  }
}

// Geometry Optimizer
export class GeometryOptimizer {
  // Remove duplicate vertices
  static deduplicateVertices(geometry, tolerance = 0.0001) {
    const positions = geometry.attributes.position.array;
    const normals = geometry.attributes.normal?.array;
    const uniqueVertices = new Map();
    const newIndices = [];
    let uniqueCount = 0;

    for (let i = 0; i < positions.length; i += 3) {
      const x = Math.round(positions[i] / tolerance) * tolerance;
      const y = Math.round(positions[i + 1] / tolerance) * tolerance;
      const z = Math.round(positions[i + 2] / tolerance) * tolerance;
      const key = `${x},${y},${z}`;

      if (uniqueVertices.has(key)) {
        newIndices.push(uniqueVertices.get(key));
      } else {
        uniqueVertices.set(key, uniqueCount);
        newIndices.push(uniqueCount);
        uniqueCount++;
      }
    }

    // Only optimize if we actually reduced vertices
    if (uniqueCount < positions.length / 3) {
      const newPositions = new Float32Array(uniqueCount * 3);
      let idx = 0;

      for (const [key, vertexIdx] of uniqueVertices) {
        const [x, y, z] = key.split(',').map(Number);
        newPositions[idx * 3] = x;
        newPositions[idx * 3 + 1] = y;
        newPositions[idx * 3 + 2] = z;
        idx++;
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(newPositions, 3));
      geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(newIndices), 1));

      return {
        originalVertices: positions.length / 3,
        optimizedVertices: uniqueCount,
        reduction: (((positions.length / 3 - uniqueCount) / (positions.length / 3)) * 100).toFixed(1) + '%'
      };
    }

    return null;
  }

  // Simplify geometry using quadratic error metric
  static simplify(geometry, targetRatio = 0.5) {
    // Note: This is a simplified implementation
    // For production, consider using libraries like meshoptimizer
    const positions = geometry.attributes.position.array;
    const targetCount = Math.floor(positions.length * targetRatio);

    // Basic vertex reduction by sampling
    const newPositions = new Float32Array(targetCount);
    const step = Math.ceil(positions.length / targetCount);

    for (let i = 0; i < targetCount; i++) {
      const srcIdx = (i * step) % positions.length;
      newPositions[i * 3] = positions[srcIdx];
      newPositions[i * 3 + 1] = positions[srcIdx + 1];
      newPositions[i * 3 + 2] = positions[srcIdx + 2];
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(newPositions, 3));
    geometry.computeVertexNormals();

    return {
      originalVertices: positions.length / 3,
      simplifiedVertices: targetCount / 3,
      reduction: ((1 - targetRatio) * 100).toFixed(1) + '%'
    };
  }

  // Merge multiple geometries
  static merge(geometries) {
    const merged = new THREE.BufferGeometry();
    let vertexOffset = 0;
    const vertices = [];
    const normals = [];
    const indices = [];

    for (const geometry of geometries) {
      const positions = geometry.attributes.position.array;
      const geoNormals = geometry.attributes.normal?.array;

      // Add vertices
      for (let i = 0; i < positions.length; i += 3) {
        vertices.push(positions[i], positions[i + 1], positions[i + 2]);
        if (geoNormals) {
          normals.push(geoNormals[i], geoNormals[i + 1], geoNormals[i + 2]);
        }
      }

      // Add indices
      const vertexCount = positions.length / 3;
      if (geometry.index) {
        for (let i = 0; i < geometry.index.array.length; i++) {
          indices.push(geometry.index.array[i] + vertexOffset);
        }
      } else {
        for (let i = 0; i < vertexCount; i++) {
          indices.push(vertexOffset + i);
        }
      }

      vertexOffset += vertexCount;
    }

    merged.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    if (normals.length > 0) {
      merged.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3));
    }
    merged.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));

    return merged;
  }

  // Calculate geometry statistics
  static getStats(geometry) {
    const positions = geometry.attributes.position.array;
    const vertices = positions.length / 3;
    let memoryUsage = positions.byteLength;

    if (geometry.attributes.normal) {
      memoryUsage += geometry.attributes.normal.array.byteLength;
    }

    if (geometry.index) {
      memoryUsage += geometry.index.array.byteLength;
    }

    return {
      vertices,
      triangles: geometry.index ? geometry.index.array.length / 3 : vertices / 3,
      memoryUsage: (memoryUsage / 1024).toFixed(2) + ' KB',
      boundingBox: geometry.boundingBox ? {
        width: geometry.boundingBox.max.x - geometry.boundingBox.min.x,
        height: geometry.boundingBox.max.y - geometry.boundingBox.min.y,
        depth: geometry.boundingBox.max.z - geometry.boundingBox.min.z
      } : null
    };
  }
}
