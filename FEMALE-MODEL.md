# Female Model Integration Guide

## Overview

The 3D Anatomy Explorer now supports multiple body model variants:
- **Male Model** (default) - Standard BodyParts3D male anatomy
- **Female Model** - Female-specific anatomical variations and reproductive system
- **Child Model** (future)
- **Pathological Model** (future)

## Features

### Model Variant Manager (`model-variants.js`)

Manages switching between different anatomical models with automatic data loading.

```javascript
import { ModelVariantManager, FemaleAnatomyEnhancer } from './model-variants.js';

const variantManager = new ModelVariantManager();

// Get available variants
const available = variantManager.getEnabledVariants();
console.log(available);

// Switch to female model
await variantManager.switchVariant('female');

// Get current model
const current = variantManager.getCurrentVariant();
console.log(current.name); // "Женская модель"

// Listen for variant changes
variantManager.subscribe((event, data) => {
  if (event === 'changed') {
    console.log(`Switched to ${data.variant}`);
    // Reload models, UI, etc.
  }
});

// Get anatomical differences
const diff = variantManager.getAnatomicalDifferences('male', 'female');
console.log(diff.keyDifferences);
```

### Female Anatomy Data (`anatomy-data-female.js`)

Extends base anatomy with female-specific structures:

#### Female Reproductive System
- **Uterus** (Матка) - Pregnancy support
- **Ovaries** (Яичники) - Egg and hormone production
- **Fallopian Tubes** (Маточные трубы) - Egg transport
- **Vagina** (Влагалище) - Birth canal

#### Female-Specific Skeletal Features
- **Wider Pelvis** - Broader pelvic inlet for childbirth
- **Shorter Sacrum** - Less curved than male variant
- **Pelvic Anatomy** - 28-35cm width (female) vs 20-26cm (male)

#### Breast Tissue
- **Mammary Glands** - Develops at puberty

### Female Anatomy Enhancer

Utilities for working with female-specific anatomical data:

```javascript
import { FemaleAnatomyEnhancer } from './model-variants.js';

// Get female-specific anatomical facts
const facts = FemaleAnatomyEnhancer.getFacts();
facts.forEach(fact => console.log(fact));

// Compare male vs female anatomical measurements
const stats = FemaleAnatomyEnhancer.compareStats();
console.log(stats.pelvisWidth); // Female wider

// Enhance base anatomy with female structures
const enhancedAnatomy = FemaleAnatomyEnhancer.enhanceAnatomy(baseData);
```

## UI Integration

### Model Variant Selector

Add buttons in sidebar header to switch between models:

```html
<div class="model-variant-selector">
  <button class="variant-button active" data-variant="male">
    <span>♂</span>
    <small>Male</small>
  </button>
  <button class="variant-button" data-variant="female">
    <span>♀</span>
    <small>Female</small>
  </button>
  <button class="variant-button disabled" data-variant="child">
    <span>👶</span>
    <small>Child</small>
  </button>
</div>
```

### Model Info Panel

Display information about current model variant:

```html
<div class="model-info-panel">
  <strong id="variantName">Female Model</strong>
  <p id="variantDescription">Female-specific anatomical variations and reproductive system</p>
  <ul id="variantFeatures">
    <li>Wider pelvic inlet</li>
    <li>Reproductive system anatomy</li>
    <li>Female-specific skeletal variations</li>
  </ul>
</div>
```

## Implementation Steps

### Step 1: Initialize Variant Manager

```javascript
import { ModelVariantManager } from './model-variants.js';

const variantManager = new ModelVariantManager();

// Subscribe to changes
variantManager.subscribe((event, data) => {
  handleVariantChange(event, data);
});
```

### Step 2: Create UI Controls

```javascript
// Setup variant buttons
document.querySelectorAll('.variant-button').forEach(btn => {
  btn.addEventListener('click', async (e) => {
    const variantId = e.currentTarget.dataset.variant;
    try {
      await variantManager.switchVariant(variantId);
      updateUI(variantId);
    } catch (error) {
      console.error('Failed to switch variant:', error);
      showError(error.message);
    }
  });
});
```

### Step 3: Handle Model Switching

```javascript
async function handleVariantChange(event, data) {
  if (event === 'before-change') {
    // Unload current models
    unloadAllModels();
  } else if (event === 'changed') {
    // Load new variant models
    await loadVariantModels(data.variant);
    updateInfoPanel(data.metadata);
    updateTourList(data.variant);
    updateQuizBank(data.variant);
  } else if (event === 'load-error') {
    showError(`Failed to load ${data.variantId}: ${data.error}`);
  }
}
```

### Step 4: Load Variant-Specific Data

```javascript
async function loadVariantModels(variantId) {
  const variant = variantManager.getVariant(variantId);
  
  if (!variant.isLoaded) {
    try {
      await variantManager.loadVariantData(variantId);
    } catch (error) {
      throw error;
    }
  }

  // Now variant.anatomyData contains the loaded module
  const data = variant.anatomyData;
  
  // Load all models for this variant
  for (const system of data.SYSTEMS) {
    // Load STL files for each system
    loadSystemModels(variantId, system);
  }
}
```

## Female-Specific Learning Content

### Female Reproductive System Tour

Interactive tour highlighting female reproductive anatomy:

```javascript
const reproductiveTour = {
  id: 'female-reproductive-tour',
  title: 'Female Reproductive System',
  steps: [
    { target: 'FMA7486', description: 'Uterus - pear-shaped organ' },
    { target: 'FMA7204', description: 'Right ovary - produces eggs' },
    { target: 'FMA7205', description: 'Left ovary - produces eggs' },
    // ... more steps
  ]
};
```

### Female Pelvis Tour

Anatomical differences in female pelvic structure:

```javascript
const pelvisTour = {
  id: 'female-pelvis-tour',
  title: 'Female Pelvis',
  steps: [
    { target: 'FMA16586', description: 'Right hip bone - wider than male' },
    { target: 'FMA16587', description: 'Left hip bone - expanded for birth' },
    { target: 'FMA16202', description: 'Sacrum - shorter, less curved' }
  ]
};
```

### Quiz Questions

Female-specific anatomy quiz bank:

- Reproductive system questions
- Pelvis anatomy questions
- Comparative anatomy questions

## Performance Considerations

### Model Switching

- **Data Loading**: Female data loads on-demand when first selected
- **Memory Management**: Unload previous model data before loading new variant
- **Caching**: Cache loaded variants to avoid re-downloading
- **Progress Feedback**: Show loading progress to user

### Model Pool Usage

```javascript
import { ModelPool } from './performance.js';

const modelPool = new ModelPool(scene, 150);

// Add variant-specific models to pool
async function loadVariantModels(variantId) {
  const models = await fetchVariantModels(variantId);
  
  for (const model of models) {
    modelPool.add(`${variantId}-${model.id}`, model.geometry);
  }
}

// Check memory usage
const stats = modelPool.getStats();
console.log(`Loaded ${stats.modelCount} models using ${stats.totalMemory}`);
```

## Measurements and Statistics

### Female-Specific Measurements (in cm)

| Measurement | Male | Female |
|---|---|---|
| Pelvis Width | 20-26 | 28-35 |
| Pelvic Inlet | 12.5-13 | 13-14 |
| Pelvic Outlet | 10-12 | 11-13 |
| Sacrum Length | 12-16 | 11-15 |
| Shoulder Width | 37-42 | 32-37 |

## Testing Checklist

- [ ] Model variant selector appears in sidebar
- [ ] Clicking male/female button switches models
- [ ] Models load and display correctly
- [ ] Reproductive system visible in female model
- [ ] Pelvis anatomy shows female-specific features
- [ ] Female-specific tours load correctly
- [ ] Quiz questions switch to female content
- [ ] Memory is freed when switching variants
- [ ] Performance remains >30 FPS during switch
- [ ] UI info panel updates correctly

## Future Enhancements

- **Anatomy Comparison Tool** - Side-by-side male/female comparison
- **Pregnancy Progression** - Show fetal development stages
- **Pathological Variants** - Disease/condition-specific models
- **Age Progression** - Child/adolescent/adult transitions
- **Custom Models** - Upload custom body models
- **Measurement Analysis** - Compare measurements between models

## API Reference

### ModelVariantManager

```javascript
class ModelVariantManager {
  // Switch to a variant
  async switchVariant(variantId)
  
  // Get current variant
  getCurrentVariant()
  
  // Get all variants
  getAllVariants()
  
  // Get enabled variants only
  getEnabledVariants()
  
  // Check if variant is loaded
  isVariantLoaded(variantId)
  
  // Load variant data
  async loadVariantData(variantId)
  
  // Get anatomical differences
  getAnatomicalDifferences(variant1Id, variant2Id)
  
  // Subscribe to changes
  subscribe(listener)
}
```

### FemaleAnatomyEnhancer

```javascript
class FemaleAnatomyEnhancer {
  // Enhance base anatomy with female structures
  static enhanceAnatomy(baseAnatomy)
  
  // Get female-specific facts
  static getFacts()
  
  // Get comparative statistics
  static compareStats()
}
```
