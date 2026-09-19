# Heat Map Visualization System

Interactive heat map visualization for anatomical structures. Color-code structures based on properties like temperature, pain intensity, blood flow, innervation, muscle fatigue, or inflammation.

## Features

- **Multiple color schemes**: Temperature, pain, innervation, blood flow, muscle fatigue, inflammation
- **Interactive UI controls**: Heat map selector buttons, opacity slider, color legend
- **Real-time visualization**: Color-coded structures update instantly
- **Custom heat maps**: Create custom visualizations with your own data
- **Lazy loading**: Heat map module loads on-demand
- **Accessibility**: Works with keyboard navigation and screen readers

## Installation

Heat map system is initialized automatically in `app.js`:

```javascript
import { initializeHeatMapSystem } from './heat-map-integration.js';

// In bindUI():
initializeHeatMapSystem(scene, state, byId, qsa, invalidate);
```

## Usage

### Activate a heat map

```javascript
// Click on heat map button in Settings drawer
// Or programmatically:
heatMapSystem.activateHeatMap('temperature');
```

### Available heat maps

- **temperature** - Body temperature distribution (blue=cold, red=hot)
- **pain** - Pain intensity visualization (green=no pain, red=severe)
- **innervation** - Nerve innervation coverage (gray=none, green=full)
- **bloodFlow** - Blood circulation intensity (blue=low, red=high)
- **muscleFatigue** - Muscle fatigue levels (green=fresh, red=exhausted)
- **inflammation** - Inflammation markers (blue=none, red=severe)

### Create custom heat map

```javascript
const customData = {
  'FMA13408': 0.8,  // 80% intensity
  'FMA13377': 0.5,  // 50% intensity
  'FMA7274': 0.9    // 90% intensity
};

heatMapSystem.heatMapOverlay.registerHeatMap(
  'custom-id',
  'My Heat Map',
  customData,
  'temperature'
);
```

### Adjust opacity

```javascript
// Via UI slider (0.0 - 1.0)
heatMapSystem.heatMapOverlay.setOpacity(0.7);
```

## File Structure

### heat-map.js
Core heat map visualization engine:
- `HeatMapOverlay` - Main class for rendering heat maps to 3D scene
- `HeatMapGenerator` - Static methods for generating heat map data
- `HeatMapLegend` - Utility for rendering color legends

### heat-map-integration.js
Integration with main app UI:
- `HeatMapSystemIntegration` - Connects heat map to app controls
- `initializeHeatMapSystem()` - Factory function for setup

### styles.css
Heat map UI styles:
- `.heat-map-controls` - Container for controls
- `.heat-map-selector` - Button group
- `.heat-map-button` - Individual heat map toggle
- `.heat-map-legend` - Color legend display
- `.heat-map-slider` - Opacity control

### index.html
Heat map UI elements:
- `#heatMapSelector` - Heat map button container
- `#heatMapLegendContainer` - Legend display
- `#heatMapOpacity` - Opacity slider

## API Reference

### HeatMapOverlay

```javascript
// Constructor
new HeatMapOverlay(scene)

// Methods
registerHeatMap(id, name, data, colorScheme)
activateHeatMap(id)
deactivateHeatMap(id)
setOpacity(opacity)
setColorScheme(scheme)
getAvailableHeatMaps()
getActiveHeatMap()
clear()

// Color schemes
.colorSchemes.temperature    // Blue → Red gradient
.colorSchemes.pain           // Green → Red gradient
.colorSchemes.innervation    // Gray → Green
.colorSchemes.bloodFlow      // Blue → Red
.colorSchemes.muscleFatigue  // Green → Red
.colorSchemes.inflammation   // Blue → Red
```

### HeatMapGenerator

```javascript
// Static methods for generating heat map data
generateTemperatureMap(anatomyData, metabolicRate)
generatePainMap(affectedStructures, painLevel)
generateInnervationMap(anatomyData)
generateBloodFlowMap(anatomyData)
generateMuscleFatigueMap(workingMuscles)
generateCustomMap(anatomyData, mapFunction)

// Samples
createTemperatureSample()
createPainMapSample()
createInnervationMapSample()
```

### HeatMapSystemIntegration

```javascript
// Constructor
initializeHeatMapSystem(scene, state, byId, qsa, invalidate)

// Methods
activateHeatMap(id)
createCustomHeatMap(id, name, colorScheme, mapFunction)
clearHeatMaps()
getActiveHeatMap()
exportHeatMapData(heatMapId)
importHeatMapData(data)
```

## Examples

### Medical education - Show blood flow to organs

```javascript
const bloodFlowData = {
  'FMA7274': 0.95,     // Heart - very high flow
  'FMA7202': 0.85,     // Liver - high flow
  'FMA13377': 0.60,    // Muscle - moderate flow
  'FMA52788': 0.10     // Bone - low flow
};

heatMapSystem.heatMapOverlay.registerHeatMap(
  'blood-flow-organs',
  'Organ Blood Flow',
  bloodFlowData,
  'bloodFlow'
);
heatMapSystem.activateHeatMap('blood-flow-organs');
```

### Physical therapy - Show muscle fatigue zones

```javascript
const tiredMuscles = ['FMA13408', 'FMA13377', 'FMA38928'];
const fatigueData = HeatMapGenerator.generateMuscleFatigueMap(tiredMuscles);

heatMapSystem.heatMapOverlay.registerHeatMap(
  'fatigue-zones',
  'Muscle Fatigue',
  fatigueData,
  'muscleFatigue'
);
heatMapSystem.activateHeatMap('fatigue-zones');
```

### Pain management - Highlight affected areas

```javascript
const painStructures = ['FMA13377', 'FMA38928'];
const painData = HeatMapGenerator.generatePainMap(painStructures, 0.85);

heatMapSystem.heatMapOverlay.registerHeatMap(
  'pain-areas',
  'Pain Distribution',
  painData,
  'pain'
);
heatMapSystem.activateHeatMap('pain-areas');
```

## Performance Considerations

- Heat maps use shader-based color mapping (GPU-accelerated)
- Material recreation is batched for efficiency
- Only active heat map materials are rendered
- Legend rendering is optional and lightweight
- UI updates are throttled to 16ms (60fps)

## Accessibility

- Heat map selection via keyboard (Tab to focus, Enter to activate)
- Opacity slider works with keyboard arrow keys
- Color schemes provide visual redundancy (not color-only information)
- Legend provides numeric value labels (0-100%)
- Screen reader annotations for all controls

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Requires WebGL support
- Works on desktop and mobile (touch-optimized slider)

## Future Enhancements

- Animated transitions between heat maps
- Time-based heat map sequences
- Export heat map overlays as images
- Interactive heat map creation tools
- Preset heat map collections (sports, medical, academic)
- Real-time data integration (wearable sensors, simulations)
- 3D heat map contours and isosurfaces
