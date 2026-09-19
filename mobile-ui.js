// Mobile UI Manager - handles responsive behavior and mobile-specific interactions
export class MobileUIManager {
  constructor() {
    this.isMobile = this.detectMobile();
    this.isTablet = this.detectTablet();
    this.orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    this.sidebarOpen = false;
    this.settingsOpen = false;
    this.setupListeners();
  }

  detectMobile() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
    return window.innerWidth < 768 && mobileRegex.test(userAgent.toLowerCase());
  }

  detectTablet() {
    return window.innerWidth >= 768 && window.innerWidth < 1200;
  }

  setupListeners() {
    window.addEventListener('resize', this.onResize.bind(this));
    window.addEventListener('orientationchange', this.onOrientationChange.bind(this));
    document.addEventListener('keydown', this.onKeyDown.bind(this));
  }

  onResize() {
    this.isMobile = this.detectMobile();
    this.isTablet = this.detectTablet();
    this.dispatchEvent('viewport-change');
  }

  onOrientationChange() {
    this.orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    // Close sidebars on orientation change
    this.closeSidebar();
    this.closeSettings();
    this.dispatchEvent('orientation-change', { orientation: this.orientation });
  }

  onKeyDown(event) {
    // Close sidebars on Escape
    if (event.key === 'Escape') {
      this.closeSidebar();
      this.closeSettings();
    }
  }

  toggleSidebar() {
    if (this.sidebarOpen) {
      this.closeSidebar();
    } else {
      this.openSidebar();
    }
  }

  openSidebar() {
    document.body.classList.add('sidebar-open');
    this.sidebarOpen = true;
    this.dispatchEvent('sidebar-opened');
  }

  closeSidebar() {
    document.body.classList.remove('sidebar-open');
    this.sidebarOpen = false;
    this.dispatchEvent('sidebar-closed');
  }

  toggleSettings() {
    if (this.settingsOpen) {
      this.closeSettings();
    } else {
      this.openSettings();
    }
  }

  openSettings() {
    document.body.classList.add('settings-open');
    this.settingsOpen = true;
    this.dispatchEvent('settings-opened');
  }

  closeSettings() {
    document.body.classList.remove('settings-open');
    this.settingsOpen = false;
    this.dispatchEvent('settings-closed');
  }

  // Get viewport info
  getViewportInfo() {
    return {
      isMobile: this.isMobile,
      isTablet: this.isTablet,
      isDesktop: !this.isMobile && !this.isTablet,
      width: window.innerWidth,
      height: window.innerHeight,
      orientation: this.orientation,
      screenDensity: window.devicePixelRatio
    };
  }

  // Check if touch is supported
  static isTouchSupported() {
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0
    );
  }

  // Get optimal canvas resolution for device
  getOptimalCanvasSize() {
    const baseWidth = window.innerWidth;
    const baseHeight = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;

    // On mobile, reduce resolution for better performance
    const scaleFactor = this.isMobile ? 0.75 : 1;

    return {
      width: Math.floor(baseWidth * scaleFactor),
      height: Math.floor(baseHeight * scaleFactor),
      dpr: Math.min(dpr, 2), // Cap at 2x for performance
    };
  }

  // Setup viewport meta tag
  static configureViewport() {
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }

    viewport.content = 
      'width=device-width, initial-scale=1.0, ' +
      'maximum-scale=5.0, user-scalable=yes, ' +
      'viewport-fit=cover';
  }

  // Detect safe area (for notch, Dynamic Island, etc.)
  getSafeArea() {
    const styles = getComputedStyle(document.documentElement);
    return {
      top: parseFloat(styles.getPropertyValue('--safe-area-inset-top')) || 0,
      right: parseFloat(styles.getPropertyValue('--safe-area-inset-right')) || 0,
      bottom: parseFloat(styles.getPropertyValue('--safe-area-inset-bottom')) || 0,
      left: parseFloat(styles.getPropertyValue('--safe-area-inset-left')) || 0,
    };
  }

  // Adaptive layout adjustments
  adjustLayoutForDevice() {
    const info = this.getViewportInfo();
    const root = document.documentElement;

    if (this.isMobile) {
      root.style.fontSize = '14px';
      root.style.setProperty('--button-size', '40px');
    } else if (this.isTablet) {
      root.style.fontSize = '15px';
      root.style.setProperty('--button-size', '44px');
    } else {
      root.style.fontSize = '16px';
      root.style.setProperty('--button-size', '38px');
    }

    if (info.orientation === 'landscape' && this.isMobile) {
      document.body.classList.add('landscape-mobile');
    } else {
      document.body.classList.remove('landscape-mobile');
    }
  }

  // Lock scroll (useful for modals on mobile)
  lockScroll() {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = scrollbarWidth + 'px';
  }

  // Unlock scroll
  unlockScroll() {
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  }

  // Vibration feedback (haptic)
  vibrate(pattern = 10) {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }

  // Custom event dispatcher
  dispatchEvent(type, data = {}) {
    const event = new CustomEvent(`mobile:${type}`, { detail: data });
    window.dispatchEvent(event);
  }

  // Cleanup
  destroy() {
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('orientationchange', this.onOrientationChange);
    document.removeEventListener('keydown', this.onKeyDown);
  }
}

// Fullscreen API helper
export class FullscreenHelper {
  static isSupported() {
    return !!(
      document.fullscreenEnabled ||
      document.webkitFullscreenEnabled ||
      document.mozFullScreenEnabled
    );
  }

  static async enter(element = document.documentElement) {
    try {
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen();
      } else if (element.mozRequestFullScreen) {
        await element.mozRequestFullScreen();
      }
      return true;
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
      return false;
    }
  }

  static async exit() {
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        }
      }
      return true;
    } catch (error) {
      console.error('Failed to exit fullscreen:', error);
      return false;
    }
  }

  static toggle(element = document.documentElement) {
    if (document.fullscreenElement) {
      return this.exit();
    } else {
      return this.enter(element);
    }
  }

  static isActive() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  }

  static onChangeHandler(callback) {
    const handler = () => {
      callback(this.isActive());
    };

    document.addEventListener('fullscreenchange', handler);
    document.addEventListener('webkitfullscreenchange', handler);
    document.addEventListener('mozfullscreenchange', handler);

    return () => {
      document.removeEventListener('fullscreenchange', handler);
      document.removeEventListener('webkitfullscreenchange', handler);
      document.removeEventListener('mozfullscreenchange', handler);
    };
  }
}
