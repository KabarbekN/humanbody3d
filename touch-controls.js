// Touch gesture support for mobile 3D controls
export class TouchControls {
  constructor(canvas, camera) {
    this.canvas = canvas;
    this.camera = camera;
    this.touchStart = { x: 0, y: 0, distance: 0 };
    this.isDoubleTap = false;
    this.lastTapTime = 0;
    this.touchDistance = 0;
    
    this.setupListeners();
  }

  setupListeners() {
    this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this), false);
    this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this), false);
    this.canvas.addEventListener('touchend', this.onTouchEnd.bind(this), false);
  }

  getDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  onTouchStart(event) {
    if (event.touches.length === 1) {
      // Single touch - potential rotation
      const touch = event.touches[0];
      this.touchStart.x = touch.clientX;
      this.touchStart.y = touch.clientY;
      
      // Detect double tap for zoom reset
      const now = Date.now();
      if (now - this.lastTapTime < 300) {
        this.isDoubleTap = true;
        this.dispatchEvent('double-tap');
      }
      this.lastTapTime = now;
    } else if (event.touches.length === 2) {
      // Two-finger touch - zoom/pinch
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      this.touchStart.distance = this.getDistance(touch1, touch2);
    }
  }

  onTouchMove(event) {
    event.preventDefault();
    
    if (event.touches.length === 1) {
      // Single touch rotation
      const touch = event.touches[0];
      const deltaX = touch.clientX - this.touchStart.x;
      const deltaY = touch.clientY - this.touchStart.y;
      
      this.dispatchEvent('rotate', { deltaX, deltaY });
      
      this.touchStart.x = touch.clientX;
      this.touchStart.y = touch.clientY;
    } else if (event.touches.length === 2) {
      // Two-finger pinch zoom
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const newDistance = this.getDistance(touch1, touch2);
      
      if (this.touchStart.distance > 0) {
        const delta = newDistance - this.touchStart.distance;
        this.dispatchEvent('zoom', { delta, scale: newDistance / this.touchStart.distance });
      }
      
      this.touchStart.distance = newDistance;
    }
  }

  onTouchEnd(event) {
    if (event.touches.length === 0) {
      this.touchStart.distance = 0;
      this.isDoubleTap = false;
    }
  }

  dispatchEvent(type, data = {}) {
    const event = new CustomEvent(`touch:${type}`, { detail: data });
    this.canvas.dispatchEvent(event);
  }

  destroy() {
    this.canvas.removeEventListener('touchstart', this.onTouchStart);
    this.canvas.removeEventListener('touchmove', this.onTouchMove);
    this.canvas.removeEventListener('touchend', this.onTouchEnd);
  }
}
