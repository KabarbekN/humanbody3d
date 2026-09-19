// Heat Map System Integration Module
// Connects HeatMapOverlay to the app UI and state

export function initializeHeatMapSystem(scene, state, byId, qsa, invalidate) {
  return new HeatMapSystemIntegration(scene, state, byId, qsa, invalidate);
}

class HeatMapSystemIntegration {
  constructor(scene, state, byId, qsa, invalidate) {
    this.scene = scene;
    this.state = state;
    this.byId = byId;
    this.qsa = qsa;
    this.invalidate = invalidate;
    
    // Import HeatMapOverlay dynamically
    this.heatMapOverlay = null;
    this.legend = null;
    this.currentScheme = 'temperature';
    
    this.initHeatMaps();
    this.setupUI();
  }

  async initHeatMaps() {
    // Dynamically import heat-map module
    const { HeatMapOverlay, HeatMapGenerator, HeatMapLegend } = await import('./heat-map.js');
    
    // Initialize overlay
    this.HeatMapOverlay = HeatMapOverlay;
    this.HeatMapGenerator = HeatMapGenerator;
    this.HeatMapLegend = HeatMapLegend;
    
    this.heatMapOverlay = new HeatMapOverlay(this.scene);
    
    // Register default heat maps
    this.registerDefaultHeatMaps();
    this.updateUI();
  }

  registerDefaultHeatMaps() {
    if (!this.heatMapOverlay) return;

    // Temperature map
    const tempData = this.HeatMapGenerator.generateTemperatureSample();
    this.heatMapOverlay.registerTemperatureMap(tempData);

    // Pain map
    const painData = this.HeatMapGenerator.generatePainMap(
      ['FMA13377', 'FMA13408', 'FMA38928'],
      0.7
    );
    this.heatMapOverlay.registerPainMap(painData);

    // Innervation map
    const innervationData = this.HeatMapGenerator.generateInnervationMap({});
    this.heatMapOverlay.registerInnervationMap(innervationData);

    // Blood flow map
    const bloodFlowData = this.HeatMapGenerator.generateBloodFlowMap({});
    this.heatMapOverlay.registerBloodFlowMap(bloodFlowData);

    // Muscle fatigue
    const fatigueData = this.HeatMapGenerator.generateMuscleFatigueMap([
      'FMA13408', 'FMA13377', 'FMA38928'
    ]);
    this.heatMapOverlay.registerMuscleFatigueMap(fatigueData);

    // Inflammation map
    const inflammationData = this.HeatMapGenerator.generateInflammationMap(
      ['FMA52788', 'FMA13377'],
      0.5
    );
    this.heatMapOverlay.registerInflammationMap(inflammationData);
  }

  setupUI() {
    const selector = this.byId('heatMapSelector');
    if (!selector) return;

    // Create heat map buttons
    const heatMaps = this.heatMapOverlay?.getAvailableHeatMaps() || [];
    
    for (const heatMap of heatMaps) {
      const button = document.createElement('button');
      button.className = 'heat-map-button';
      button.textContent = heatMap.name;
      button.dataset.heatMapId = heatMap.id;
      
      button.addEventListener('click', () => {
        this.activateHeatMap(heatMap.id);
      });
      
      selector.appendChild(button);
    }

    // Opacity slider
    const opacitySlider = this.byId('heatMapOpacity');
    if (opacitySlider) {
      opacitySlider.addEventListener('input', (e) => {
        if (this.heatMapOverlay) {
          this.heatMapOverlay.setOpacity(parseFloat(e.target.value));
          this.invalidate();
        }
      });
    }
  }

  activateHeatMap(id) {
    if (!this.heatMapOverlay) return;

    // Update button states
    const buttons = this.qsa('[data-heat-map-id]');
    buttons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.heatMapId === id);
    });

    // Activate heat map
    this.heatMapOverlay.activateHeatMap(id);
    
    // Update legend
    this.updateLegend(id);
    
    // Trigger render
    this.invalidate();
  }

  updateLegend(heatMapId) {
    const legendContainer = this.byId('heatMapLegendContainer');
    if (!legendContainer || !this.heatMapOverlay) return;

    // Clear previous legend
    legendContainer.innerHTML = '';

    const heatMap = this.heatMapOverlay.heatMaps.get(heatMapId);
    if (heatMap) {
      // Create simple legend
      const schemes = this.heatMapOverlay.colorSchemes[heatMap.colorScheme];
      const legend = document.createElement('div');
      legend.className = 'heat-map-legend';

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

      legendContainer.appendChild(legend);
    }
  }

  updateUI() {
    if (!this.heatMapOverlay) return;
    this.setupUI();
  }

  // Create a custom heat map from structure data
  createCustomHeatMap(id, name, colorScheme, mapFunction) {
    if (!this.heatMapOverlay) return;

    const customData = this.HeatMapGenerator.generateCustomMap({}, mapFunction);
    this.heatMapOverlay.registerHeatMap(id, name, customData, colorScheme);
    
    // Add button to UI
    const selector = this.byId('heatMapSelector');
    if (selector) {
      const button = document.createElement('button');
      button.className = 'heat-map-button';
      button.textContent = name;
      button.dataset.heatMapId = id;
      
      button.addEventListener('click', () => {
        this.activateHeatMap(id);
      });
      
      selector.appendChild(button);
    }
  }

  // Clear all heat maps
  clearHeatMaps() {
    if (this.heatMapOverlay) {
      this.heatMapOverlay.clear();
      this.byId('heatMapSelector').innerHTML = '';
      this.byId('heatMapLegendContainer').innerHTML = '';
      this.invalidate();
    }
  }

  // Get current active heat map
  getActiveHeatMap() {
    return this.heatMapOverlay?.getActiveHeatMap();
  }

  // Export heat map data
  exportHeatMapData(heatMapId) {
    const heatMap = this.heatMapOverlay?.heatMaps.get(heatMapId);
    if (heatMap) {
      return {
        id: heatMap.id,
        name: heatMap.name,
        colorScheme: heatMap.colorScheme,
        data: { ...heatMap.data }
      };
    }
    return null;
  }

  // Import heat map data
  importHeatMapData(data) {
    if (!this.heatMapOverlay || !data.id) return;

    this.heatMapOverlay.registerHeatMap(
      data.id,
      data.name,
      data.data,
      data.colorScheme || 'temperature'
    );

    // Add button
    const selector = this.byId('heatMapSelector');
    if (selector) {
      const button = document.createElement('button');
      button.className = 'heat-map-button';
      button.textContent = data.name;
      button.dataset.heatMapId = data.id;
      
      button.addEventListener('click', () => {
        this.activateHeatMap(data.id);
      });
      
      selector.appendChild(button);
    }
  }
}

// Export for module
if (typeof window !== 'undefined') {
  window.HeatMapSystemIntegration = HeatMapSystemIntegration;
}
