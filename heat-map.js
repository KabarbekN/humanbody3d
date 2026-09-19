// Heat Map Overlay System - Visualize anatomical properties with color mapping
export class HeatMapOverlay {
  constructor(scene) {
    this.scene = scene;
    this.heatMaps = new Map();
    this.activeHeatMap = null;
    this.colorScheme = 'temperature';
    this.opacity = 0.7;
    this.setupColorSchemes();
  }

  setupColorSchemes() {
    // Temperature color scheme (cool to hot)
    this.colorSchemes = {
      temperature: [
        { value: 0.0, color: 0x0000ff }, // Blue - cold
        { value: 0.25, color: 0x00ffff }, // Cyan
        { value: 0.5, color: 0x00ff00 }, // Green
        { value: 0.75, color: 0xffff00 }, // Yellow
        { value: 1.0, color: 0xff0000 }  // Red - hot
      ],
      pain: [
        { value: 0.0, color: 0x00ff00 }, // Green - no pain
        { value: 0.5, color: 0xffff00 }, // Yellow - moderate
        { value: 1.0, color: 0xff0000 }  // Red - severe pain
      ],
      innervation: [
        { value: 0.0, color: 0x808080 }, // Gray - no innervation
        { value: 0.5, color: 0xffff00 }, // Yellow - partial
        { value: 1.0, color: 0x00ff00 }  // Green - full innervation
      ],
      bloodFlow: [
        { value: 0.0, color: 0x0000ff }, // Blue - low flow
        { value: 0.5, color: 0xffff00 }, // Yellow - moderate flow
        { value: 1.0, color: 0xff0000 }  // Red - high flow
      ],
      muscleFatigue: [
        { value: 0.0, color: 0x00ff00 }, // Green - fresh
        { value: 0.5, color: 0xffaa00 }, // Orange - tired
        { value: 1.0, color: 0xff0000 }  // Red - exhausted
      ],
      inflammation: [
        { value: 0.0, color: 0x0000ff }, // Blue - no inflammation
        { value: 1.0, color: 0xff0000 }  // Red - severe inflammation
      ]
    };
  }

  // Register a heat map data set
  registerHeatMap(id, name, data, colorScheme = 'temperature') {
    this.heatMaps.set(id, {
      id,
      name,
      data, // Map of structureId -> value (0-1)
      colorScheme,
      material: null,
      isActive: false
    });
  }

  // Activate a heat map
  activateHeatMap(id) {
    if (!this.heatMaps.has(id)) {
      throw new Error(`Heat map ${id} not found`);
    }

    // Deactivate previous
    if (this.activeHeatMap) {
      this.deactivateHeatMap(this.activeHeatMap);
    }

    this.activeHeatMap = id;
    const heatMap = this.heatMaps.get(id);
    heatMap.isActive = true;

    // Apply heat map to scene
    this.applyHeatMap(heatMap);
  }

  deactivateHeatMap(id) {
    const heatMap = this.heatMaps.get(id);
    if (heatMap) {
      heatMap.isActive = false;
      this.removeHeatMapVisuals(heatMap);
    }
  }

  applyHeatMap(heatMap) {
    const colorScheme = this.colorSchemes[heatMap.colorScheme];

    // Apply colors to all structures in the scene
    this.scene.traverse((object) => {
      if (object.isMesh && object.userData && object.userData.id) {
        const structureId = object.userData.id;
        const value = heatMap.data[structureId];

        if (value !== undefined) {
          const color = this.interpolateColor(value, colorScheme);
          this.applyColorToMesh(object, color, this.opacity);
        }
      }
    });

    // Store visualization info
    heatMap.material = new THREE.MeshStandardMaterial({
      emissive: 0x000000,
      emissiveIntensity: 0.2
    });
  }

  removeHeatMapVisuals(heatMap) {
    this.scene.traverse((object) => {
      if (object.isMesh) {
        // Reset to original material
        if (object.userData.originalMaterial) {
          object.material = object.userData.originalMaterial;
        }
      }
    });
  }

  interpolateColor(value, colorScheme) {
    // Find surrounding color stops
    let lower = colorScheme[0];
    let upper = colorScheme[colorScheme.length - 1];

    for (let i = 0; i < colorScheme.length - 1; i++) {
      if (value >= colorScheme[i].value && value <= colorScheme[i + 1].value) {
        lower = colorScheme[i];
        upper = colorScheme[i + 1];
        break;
      }
    }

    // Linear interpolation between colors
    const range = upper.value - lower.value;
    const t = (value - lower.value) / range;

    const lowerColor = new THREE.Color(lower.color);
    const upperColor = new THREE.Color(upper.color);

    return lowerColor.lerp(upperColor, t);
  }

  applyColorToMesh(mesh, color, opacity) {
    // Save original material
    if (!mesh.userData.originalMaterial) {
      mesh.userData.originalMaterial = mesh.material;
    }

    // Create new colored material
    const material = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.4,
      metalness: 0.1,
      roughness: 0.8,
      transparent: true,
      opacity: opacity
    });

    mesh.material = material;
  }

  // Temperature heat map (e.g., for thermal imaging)
  registerTemperatureMap(data) {
    this.registerHeatMap('temperature', 'Body Temperature', data, 'temperature');
  }

  // Pain visualization
  registerPainMap(data) {
    this.registerHeatMap('pain', 'Pain Intensity', data, 'pain');
  }

  // Nerve innervation map
  registerInnervationMap(data) {
    this.registerHeatMap('innervation', 'Nerve Innervation', data, 'innervation');
  }

  // Blood flow visualization
  registerBloodFlowMap(data) {
    this.registerHeatMap('bloodFlow', 'Blood Flow', data, 'bloodFlow');
  }

  // Muscle fatigue visualization
  registerMuscleFatigueMap(data) {
    this.registerHeatMap('muscleFatigue', 'Muscle Fatigue', data, 'muscleFatigue');
  }

  // Inflammation visualization
  registerInflammationMap(data) {
    this.registerHeatMap('inflammation', 'Inflammation', data, 'inflammation');
  }

  // Get sample temperature map (normal body temperature)
  static createTemperatureSample() {
    return {
      'FMA7163': 0.5, // Skin - moderate temp
      'FMA13408': 0.7, // Muscles - higher temp
      'FMA7274': 0.9, // Heart - very high temp
      // Add more structures as needed
    };
  }

  // Get sample pain map (example)
  static createPainMapSample() {
    return {
      'FMA52788': 0.3, // Parietal bone - mild pain
      'FMA13377': 0.7, // Rectus abdominis - moderate pain
      'FMA7274': 0.0, // Heart - no pain
    };
  }

  // Get sample innervation map
  static createInnervationMapSample() {
    return {
      'FMA13408': 1.0, // Sternocleidomastoid - fully innervated
      'FMA13377': 1.0, // Rectus abdominis - fully innervated
      'FMA52788': 0.0, // Bone - not innervated
    };
  }

  // Set opacity for heat map visualization
  setOpacity(opacity) {
    this.opacity = Math.max(0, Math.min(1, opacity));
    if (this.activeHeatMap) {
      this.activateHeatMap(this.activeHeatMap);
    }
  }

  // Set color scheme
  setColorScheme(scheme) {
    if (this.colorSchemes[scheme]) {
      this.colorScheme = scheme;
      if (this.activeHeatMap) {
        const heatMap = this.heatMaps.get(this.activeHeatMap);
        heatMap.colorScheme = scheme;
        this.activateHeatMap(this.activeHeatMap);
      }
    }
  }

  // Get all available heat maps
  getAvailableHeatMaps() {
    return Array.from(this.heatMaps.values()).map(hm => ({
      id: hm.id,
      name: hm.name,
      isActive: hm.isActive
    }));
  }

  // Get active heat map
  getActiveHeatMap() {
    return this.activeHeatMap ? this.heatMaps.get(this.activeHeatMap) : null;
  }

  // Clear all heat maps
  clear() {
    if (this.activeHeatMap) {
      this.deactivateHeatMap(this.activeHeatMap);
    }
    this.heatMaps.clear();
    this.activeHeatMap = null;
  }
}

// Advanced heat map generator
export class HeatMapGenerator {
  // Generate temperature map based on proximity to heat sources (heart, muscles)
  static generateTemperatureMap(anatomyData, metabolicRate = {}) {
    const temperatureMap = {};

    for (const [structureId, rate] of Object.entries(metabolicRate)) {
      // Higher metabolic rate = higher temperature
      temperatureMap[structureId] = Math.min(1, rate / 100);
    }

    // Default values for common structures
    const defaults = {
      'FMA7274': 0.95, // Heart - highest temp
      'FMA13377': 0.7, // Core muscles - high temp
      'FMA7163': 0.5, // Skin - moderate temp (surface)
    };

    return { ...defaults, ...temperatureMap };
  }

  // Generate pain map from selected structures
  static generatePainMap(affectedStructures, painLevel = 0.7) {
    const painMap = {};

    for (const structureId of affectedStructures) {
      painMap[structureId] = painLevel;
    }

    return painMap;
  }

  // Generate innervation map based on nerve supply
  static generateInnervationMap(anatomyData) {
    const innervationMap = {};

    // Structures with nerve supply get high values
    const innervated = [
      'FMA13408', // Sternocleidomastoid
      'FMA13377', // Rectus abdominis
      'FMA38928', // Rectus femoris
      // Add more structures as needed
    ];

    for (const structureId of innervated) {
      innervationMap[structureId] = 1.0;
    }

    // Bones and cartilage typically not innervated
    const nonInnervated = [
      'FMA52788', // Parietal bone
      'FMA16202', // Sacrum
    ];

    for (const structureId of nonInnervated) {
      innervationMap[structureId] = 0.0;
    }

    return innervationMap;
  }

  // Generate blood flow map
  static generateBloodFlowMap(anatomyData) {
    const bloodFlowMap = {};

    // High blood flow areas
    const highFlow = [
      'FMA7274', // Heart
      'FMA7202', // Liver
    ];

    for (const structureId of highFlow) {
      bloodFlowMap[structureId] = 1.0;
    }

    // Moderate flow
    const moderateFlow = [
      'FMA13377', // Rectus abdominis
      'FMA13408', // Sternocleidomastoid
    ];

    for (const structureId of moderateFlow) {
      bloodFlowMap[structureId] = 0.6;
    }

    // Low flow (bones, cartilage)
    const lowFlow = [
      'FMA52788', // Parietal bone
    ];

    for (const structureId of lowFlow) {
      bloodFlowMap[structureId] = 0.2;
    }

    return bloodFlowMap;
  }

  // Generate muscle fatigue map
  static generateMuscleFatigueMap(workingMuscles = []) {
    const fatigueMap = {};

    for (const muscleId of workingMuscles) {
      // Simulate fatigue accumulation
      fatigueMap[muscleId] = Math.random() * 0.8; // 0-80% fatigue range
    }

    return fatigueMap;
  }

  // Generate custom map from function
  static generateCustomMap(anatomyData, mapFunction) {
    const customMap = {};

    // Iterate through all structures and apply function
    if (anatomyData && anatomyData.SYSTEMS) {
      for (const system of anatomyData.SYSTEMS) {
        for (const structure of system.structures || []) {
          const value = mapFunction(structure);
          if (value !== undefined) {
            customMap[structure.id] = value;
          }
        }
      }
    }

    return customMap;
  }
}

// Heat map legend utility
export class HeatMapLegend {
  constructor(container, colorScheme, heatMapOverlay) {
    this.container = container;
    this.colorScheme = colorScheme;
    this.heatMapOverlay = heatMapOverlay;
    this.render();
  }

  render() {
    const legend = document.createElement('div');
    legend.className = 'heat-map-legend';

    const schemes = this.heatMapOverlay.colorSchemes[this.colorScheme];

    for (const stop of schemes) {
      const item = document.createElement('div');
      item.className = 'legend-item';

      const color = new THREE.Color(stop.color);
      const hexColor = color.getHexString();

      item.innerHTML = `
        <div class="legend-color" style="background-color: #${hexColor}"></div>
        <div class="legend-label">${(stop.value * 100).toFixed(0)}%</div>
      `;

      legend.appendChild(item);
    }

    this.container.appendChild(legend);
  }

  clear() {
    this.container.innerHTML = '';
  }
}
