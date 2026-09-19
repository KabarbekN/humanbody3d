// Model Variant Management - Switch between male/female and other body models
export class ModelVariantManager {
  constructor() {
    this.variants = new Map();
    this.currentVariant = 'male';
    this.listeners = new Set();
    this.setupVariants();
  }

  setupVariants() {
    // Male model (default - BodyParts3D standard)
    this.registerVariant('male', {
      id: 'male',
      name: 'Мужская модель',
      displayName: 'Male',
      description: 'Стандартная мужская анатомическая модель BodyParts3D',
      icon: '♂',
      dataSource: './anatomy-data.js', // Current data
      color: 0x8b9fb2,
      modelRoot: 'MALE_MODEL'
    });

    // Female model (BodyParts3D Female variant)
    this.registerVariant('female', {
      id: 'female',
      name: 'Женская модель',
      displayName: 'Female',
      description: 'Женская анатомическая модель с анатомическими особенностями',
      icon: '♀',
      dataSource: './anatomy-data-female.js', // Separate data file
      color: 0xc48a8a,
      modelRoot: 'FEMALE_MODEL'
    });

    // Child model (future)
    this.registerVariant('child', {
      id: 'child',
      name: 'Детская модель',
      displayName: 'Child',
      description: 'Анатомия ребёнка (7-12 лет)',
      icon: '👶',
      dataSource: './anatomy-data-child.js',
      color: 0x9fc4e8,
      modelRoot: 'CHILD_MODEL',
      enabled: false // Not yet available
    });

    // Pathological variant (future)
    this.registerVariant('pathology', {
      id: 'pathology',
      name: 'Патологическая модель',
      displayName: 'Pathological',
      description: 'Модель с патологическими изменениями и заболеваниями',
      icon: '⚕️',
      dataSource: './anatomy-data-pathology.js',
      color: 0xd4956e,
      modelRoot: 'PATHOLOGY_MODEL',
      enabled: false // Not yet available
    });
  }

  registerVariant(id, metadata) {
    this.variants.set(id, {
      ...metadata,
      loadedModels: new Map(),
      isLoaded: false,
      loadProgress: 0
    });
  }

  getVariant(id) {
    return this.variants.get(id);
  }

  getAllVariants() {
    return Array.from(this.variants.values());
  }

  getEnabledVariants() {
    return this.getAllVariants().filter(v => v.enabled !== false);
  }

  async switchVariant(variantId) {
    if (!this.variants.has(variantId)) {
      throw new Error(`Variant ${variantId} not found`);
    }

    const variant = this.variants.get(variantId);

    if (variant.enabled === false) {
      throw new Error(`Variant ${variantId} is not available yet`);
    }

    // Dispatch before-change event
    this.notifyListeners('before-change', {
      from: this.currentVariant,
      to: variantId
    });

    this.currentVariant = variantId;

    // Load variant data if not already loaded
    if (!variant.isLoaded) {
      await this.loadVariantData(variantId);
    }

    // Dispatch change event
    this.notifyListeners('changed', {
      variant: variantId,
      metadata: variant
    });
  }

  getCurrentVariant() {
    return this.variants.get(this.currentVariant);
  }

  async loadVariantData(variantId) {
    const variant = this.variants.get(variantId);
    
    try {
      // Dynamic import of variant data
      const dataModule = await import(variant.dataSource);
      variant.anatomyData = dataModule;
      variant.isLoaded = true;
      
      this.notifyListeners('data-loaded', {
        variantId,
        dataAvailable: true
      });
      
      return dataModule;
    } catch (error) {
      console.error(`Failed to load data for variant ${variantId}:`, error);
      this.notifyListeners('load-error', {
        variantId,
        error: error.message
      });
      throw error;
    }
  }

  // Check if variant data is available
  isVariantLoaded(variantId) {
    const variant = this.variants.get(variantId);
    return variant?.isLoaded || false;
  }

  // Get variant anatomical differences
  getAnatomicalDifferences(variant1Id, variant2Id) {
    const v1 = this.variants.get(variant1Id);
    const v2 = this.variants.get(variant2Id);

    if (!v1 || !v2) return null;

    return {
      variant1: v1.name,
      variant2: v2.name,
      keyDifferences: this.getDifferences(v1.id, v2.id)
    };
  }

  getDifferences(variantId1, variantId2) {
    // Map of anatomical differences between models
    const differences = {
      'male-female': [
        'Wider pelvis in female model',
        'Different pelvic inlet shape',
        'Smaller overall bone density',
        'Different shoulder width ratio',
        'Reproductive system anatomy',
        'Breast tissue representation',
        'Different muscle distribution'
      ],
      'adult-child': [
        'Proportionally larger head',
        'Open growth plates',
        'Different tooth development',
        'Immature reproductive organs',
        'Different bone density',
        'Proportionally longer limbs'
      ]
    };

    const key = `${variantId1}-${variantId2}`;
    const reverseKey = `${variantId2}-${variantId1}`;
    
    return differences[key] || differences[reverseKey] || [];
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners(event, data) {
    for (const listener of this.listeners) {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Listener error:', error);
      }
    }
  }

  // Get statistics for variant
  getStats(variantId) {
    const variant = this.variants.get(variantId);
    if (!variant?.anatomyData) return null;

    let totalStructures = 0;
    const layerCount = {};

    // Count structures (simplified example)
    if (variant.anatomyData.SYSTEMS) {
      for (const system of variant.anatomyData.SYSTEMS) {
        // Count would be done based on actual data structure
      }
    }

    return {
      variant: variant.name,
      isLoaded: variant.isLoaded,
      totalStructures,
      availableLayers: Object.keys(layerCount)
    };
  }
}

// Female-specific anatomical data enhancements
export class FemaleAnatomyEnhancer {
  static enhanceAnatomy(baseAnatomy) {
    // Add female-specific reproductive system
    const femaleReproductive = {
      system: 'reproductive',
      region: 'Pelvis',
      structures: [
        {
          id: 'FMA74002', // Uterus
          name: 'Матка',
          layer: 'organ',
          description: 'Female reproductive organ'
        },
        {
          id: 'FMA7207', // Ovary right
          name: 'Правый яичник',
          layer: 'organ'
        },
        {
          id: 'FMA7208', // Ovary left
          name: 'Левый яичник',
          layer: 'organ'
        },
        {
          id: 'FMA18256', // Fallopian tube right
          name: 'Правая маточная труба',
          layer: 'organ'
        },
        {
          id: 'FMA18255', // Fallopian tube left
          name: 'Левая маточная труба',
          layer: 'organ'
        }
      ]
    };

    return {
      ...baseAnatomy,
      femaleReproductive,
      anatomicalModifications: {
        pelvis: 'Wider pelvic inlet and outlet',
        sacrum: 'Shorter, less curved sacrum',
        shoulders: 'Narrower shoulder width relative to pelvis',
        ribcage: 'Wider lower rib cage'
      }
    };
  }

  // Get anatomical facts about female model
  static getFacts() {
    return [
      'Женский таз шире и имеет больший угол входа',
      'Крестец короче и менее изогнут',
      'Плечи относительно уже по сравнению с мужским телом',
      'Нижняя часть грудной клетки пропорционально шире',
      'Содержит органы репродуктивной системы',
      'Мышечная масса ниже, чем у мужчин',
      'Плотность костей немного ниже'
    ];
  }

  // Compare measurements between male and female
  static compareStats() {
    return {
      height: 'Female ~5-10% shorter on average',
      pelvisWidth: 'Female wider (28-35cm vs 20-26cm)',
      shoulderWidth: 'Female narrower relative to pelvis',
      muscularSystem: 'Female less muscle mass (~23% vs ~40%)',
      skeletalDensity: 'Female ~10% lower',
      ribcage: 'Female lower ribs more flared'
    };
  }
}

// Model appearance customization
export class ModelAppearance {
  constructor() {
    this.settings = {
      skinOpacity: 0.24,
      showSkeleton: false,
      skeletonOpacity: 1.0,
      modelColor: null, // Use default
      highlighted: null,
      isolated: null
    };
  }

  setSkinOpacity(opacity) {
    this.settings.skinOpacity = Math.max(0, Math.min(1, opacity));
  }

  setSkeletonVisibility(visible, opacity = 1.0) {
    this.settings.showSkeleton = visible;
    this.settings.skeletonOpacity = opacity;
  }

  setModelColor(color) {
    this.settings.modelColor = color;
  }

  highlightStructure(structureId) {
    this.settings.highlighted = structureId;
  }

  isolateStructure(structureId) {
    this.settings.isolated = structureId;
  }

  clear() {
    this.settings.modelColor = null;
    this.settings.highlighted = null;
    this.settings.isolated = null;
  }

  getAppearanceSettings() {
    return { ...this.settings };
  }
}
