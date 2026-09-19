# Developer Guide - 3D Anatomy Explorer

## New Modules Overview (Tier 1 Improvements)

### 1. Touch Controls (`touch-controls.js`)
Mobile gesture support for better UX on mobile devices.

**Features:**
- Single-touch rotation support
- Two-finger pinch-to-zoom
- Double-tap detection
- Touch event customization

**Usage:**
```javascript
import { TouchControls } from './touch-controls.js';

const touchControls = new TouchControls(canvas, camera);

// Listen to touch events
canvas.addEventListener('touch:rotate', (e) => {
  const { deltaX, deltaY } = e.detail;
  // Handle rotation
});

canvas.addEventListener('touch:zoom', (e) => {
  const { delta, scale } = e.detail;
  // Handle zoom
});

canvas.addEventListener('touch:double-tap', () => {
  // Reset zoom
});
```

### 2. Accessibility Manager (`accessibility.js`)
Comprehensive keyboard navigation and screen reader support.

**Features:**
- Tab/Shift+Tab navigation between focusable elements
- Arrow key handling for 3D view control
- ARIA label management
- Screen reader announcements
- Focus trapping for modals
- Keyboard shortcuts registration

**Usage:**
```javascript
import { AccessibilityManager } from './accessibility.js';

const a11y = new AccessibilityManager();

// Register custom keyboard shortcuts
a11y.registerShortcut('h', () => showHelp(), 'Show help');
a11y.registerShortcut('s', () => saveAnnotation(), 'Save annotation');

// Set ARIA labels
a11y.setAriaLabel(button, 'Expand sidebar');
a11y.setAriaExpanded(button, true);

// Make canvas accessible
a11y.makeFocusable(canvas);

// Announce to screen readers
a11y.announce('Model loaded', 'polite');

// Setup focus trap for modals
a11y.setFocusTrap(modalElement, () => modalElement.close());
```

## 4. Mobile UI Manager (`mobile-ui.js`)
Comprehensive mobile device handling and responsive UI management.

**Features:**
- Mobile/tablet/desktop detection
- Orientation change handling
- Sidebar and settings drawer management
- Viewport info and optimization
- Fullscreen API wrapper
- Touch support detection
- Safe area (notch) handling
- Haptic feedback support

**Usage:**
```javascript
import { MobileUIManager, FullscreenHelper } from './mobile-ui.js';

// Initialize mobile UI manager
const mobileUI = new MobileUIManager();

// Listen to mobile events
window.addEventListener('mobile:viewport-change', () => {
  console.log('Viewport changed');
  console.log(mobileUI.getViewportInfo());
});

window.addEventListener('mobile:orientation-change', (e) => {
  console.log('Orientation:', e.detail.orientation);
});

// Configure viewport on page load
MobileUIManager.configureViewport();

// Sidebar toggle
document.getElementById('sidebarToggle').addEventListener('click', () => {
  mobileUI.toggleSidebar();
});

// Get optimal canvas resolution for device
const size = mobileUI.getOptimalCanvasSize();
canvas.width = size.width;
canvas.height = size.height;
renderer.setPixelRatio(size.dpr);

// Fullscreen support
if (FullscreenHelper.isSupported()) {
  document.getElementById('fullscreenBtn').addEventListener('click', () => {
    FullscreenHelper.toggle(document.getElementById('viewport'));
  });
  
  FullscreenHelper.onChangeHandler((isFullscreen) => {
    console.log('Fullscreen:', isFullscreen);
  });
}

// Check touch support
if (MobileUIManager.isTouchSupported()) {
  console.log('Touch is supported');
}

// Haptic feedback
mobileUI.vibrate(50); // Short buzz
mobileUI.vibrate([100, 30, 100]); // Pattern
```
Real-time performance monitoring and optimization tools.

**Features:**
- FPS monitoring and history
- Memory usage tracking (Chrome only)
- Model load time tracking
- Render frame time measurement
- Memory and load reports
- Concurrency-controlled STL loading
- Lazy loading manager for models

**Usage:**
```javascript
import { PerformanceMonitor, OptimizedSTLLoader, LazyLoadManager } from './performance.js';

// Setup performance monitoring
const perfMonitor = new PerformanceMonitor();
perfMonitor.start(renderer);

// Display FPS in UI
perfMonitor.fpsDisplay = (fps) => {
  document.getElementById('fpsDisplay').textContent = fps;
};

// Track model loading
const endTimer = perfMonitor.startLoadTimer('model-id');
// ... load model
const loadTime = endTimer(); // Returns time in ms

// Measure frame performance
perfMonitor.measureFrame(() => {
  renderer.render(scene, camera);
});

// Get reports
console.log(perfMonitor.getSummary());
console.log(perfMonitor.generateReport());

// Optimize STL loading with concurrency control
const stlLoader = new OptimizedSTLLoader(scene);
const geometry = await stlLoader.loadModel(url, 'model-id');

// Lazy loading manager for visible layers
const lazyManager = new LazyLoadManager(scene);
lazyManager.setVisibleLayers(['skin', 'muscle']);
lazyManager.unloadHiddenLayers(); // Free up memory
console.log('Memory usage:', lazyManager.getMemoryUsage());
```

## CSS Accessibility & Mobile Features

Added comprehensive accessibility and mobile-optimized CSS:

### Accessibility Features
- **Focus Styles**: Enhanced focus-visible with custom outlines
- **Touch Targets**: Min 44x44px on mobile devices
- **High Contrast Mode**: Support for `prefers-contrast: more`
- **Reduced Motion**: Respects `prefers-reduced-motion`
- **Color Scheme**: Support for both dark and light modes
- **Screen Reader Only**: `.sr-only` class for hidden but readable content

### Mobile Responsive Design
- **Multiple Breakpoints**:
  - Desktop: > 1200px (full layout)
  - Tablet: 768px - 1200px (optimized for medium screens)
  - Mobile: 520px - 768px (compact UI)
  - Small phones: < 380px (minimal layout)
  
- **Mobile Optimizations**:
  - Full-screen sidebars with slide-in animation
  - Bottom dock for tool buttons
  - Horizontal scrolling preset bar
  - Compact topbar without search
  - 44px+ touch target sizes
  - iOS viewport fit for notch support
  - Prevent double-tap zoom delay
  - Smooth scrolling (-webkit-overflow-scrolling)

- **Focus Styles**: Enhanced focus-visible with custom outlines
- **Touch Targets**: Min 44x44px on mobile devices
- **High Contrast Mode**: Support for `prefers-contrast: more`
- **Reduced Motion**: Respects `prefers-reduced-motion`
- **Color Scheme**: Support for both dark and light modes
- **Screen Reader Only**: `.sr-only` class for hidden but readable content

## Integration Guide

To integrate these new modules into the main app:

### 1. In `index.html`, update script imports:
```html
<script type="module">
  import { TouchControls } from './touch-controls.js';
  import { AccessibilityManager } from './accessibility.js';
  import { PerformanceMonitor, OptimizedSTLLoader, LazyLoadManager } from './performance.js';
  
  // Initialize in main app
</script>
```

### 2. Initialize in `app.js`:
```javascript
// After camera and controls are set up
const touchControls = new TouchControls(canvas, camera);

// After OrbitControls setup
canvas.addEventListener('touch:rotate', (e) => {
  controls.rotateSpeed = 2.0; // Increase sensitivity for touch
  // Handle rotation delta
});

canvas.addEventListener('touch:zoom', (e) => {
  const camera = scene.getObjectByName('camera');
  camera.position.multiplyScalar(e.detail.scale * 0.95);
});

// Accessibility
const a11y = new AccessibilityManager();
a11y.makeFocusable(canvas);

// Performance monitoring
const perfMonitor = new PerformanceMonitor();
perfMonitor.start(renderer);

// Optional: Display in UI
perfMonitor.fpsDisplay = (fps) => {
  const fpsEl = document.createElement('div');
  fpsEl.style.cssText = 'position:fixed;top:10px;right:10px;color:#0f0;font:12px monospace;z-index:999';
  fpsEl.textContent = `FPS: ${fps}`;
  document.body.appendChild(fpsEl);
};

// Use optimized loader for STL models
const stlLoader = new OptimizedSTLLoader(scene);
```

## Performance Targets

- **FPS**: 60 on desktop, 30-45 on mobile
- **Load Time**: < 3 seconds initial load on 4G
- **Bundle Size**: Target < 500 KB gzipped
- **Memory**: < 300 MB on average devices
- **Accessibility Score**: > 95 on Lighthouse

## Testing Checklist

- [ ] Test touch controls on iOS Safari
- [ ] Test touch controls on Android Chrome
- [ ] Verify keyboard navigation with Tab/Arrow keys
- [ ] Test screen reader with NVDA (Windows) or VoiceOver (Mac)
- [ ] Run Lighthouse accessibility audit
- [ ] Test with high contrast mode enabled
- [ ] Verify performance with DevTools (60 FPS, memory < 300MB)
- [ ] Test focus states on all interactive elements
- [ ] Verify touch targets are min 44x44px on mobile

## Debugging Tips

### Performance Issues
```javascript
// Enable performance monitoring
if (window.perfMonitor) {
  console.log(window.perfMonitor.generateReport());
}

// Check memory in Chrome
// Open DevTools → Memory → Heap snapshots
```

### Accessibility Issues
```javascript
// Check focusable elements
console.log(a11y.getFocusableElements());

// Get keyboard shortcuts
console.log(a11y.getShortcutsHelp());
```

### Touch Issues
```javascript
// Log touch events
canvas.addEventListener('touchstart', (e) => {
  console.log('Touch points:', e.touches.length);
});
```

## Architecture Notes

- All modules use vanilla JavaScript (no external dependencies)
- Modules follow ES6 module pattern
- Custom events for loose coupling
- Graceful degradation for unsupported features
- Focus on progressive enhancement

## Future Enhancements

- [ ] Gesture customization API
- [ ] Keyboard shortcut configuration UI
- [ ] Performance optimization suggestions
- [ ] Web Speech API for voice commands
- [ ] Haptic feedback for haptic-capable devices
