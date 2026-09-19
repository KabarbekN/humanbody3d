// Accessibility utilities for keyboard navigation and screen readers
export class AccessibilityManager {
  constructor() {
    this.activeElement = null;
    this.focusableElements = [];
    this.keyBindings = new Map();
    this.setupKeyboardNavigation();
  }

  // Register keyboard shortcuts
  registerShortcut(key, callback, description) {
    this.keyBindings.set(key, { callback, description });
  }

  setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      // Tab navigation between interactive elements
      if (e.key === 'Tab') {
        this.handleTabNavigation(e);
      }
      
      // Arrow keys for orientation
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        this.handleArrowNavigation(e);
      }
      
      // Custom shortcuts
      if (this.keyBindings.has(e.key)) {
        e.preventDefault();
        this.keyBindings.get(e.key).callback();
      }
      
      // Escape key to close panels
      if (e.key === 'Escape') {
        this.handleEscape();
      }
    });
  }

  handleTabNavigation(event) {
    const focusable = this.getFocusableElements();
    const index = focusable.indexOf(document.activeElement);
    
    if (event.shiftKey) {
      // Shift + Tab: previous element
      const prev = index > 0 ? focusable[index - 1] : focusable[focusable.length - 1];
      prev?.focus();
    } else {
      // Tab: next element
      const next = index < focusable.length - 1 ? focusable[index + 1] : focusable[0];
      next?.focus();
    }
    event.preventDefault();
  }

  handleArrowNavigation(event) {
    // Dispatch custom event for arrow key handling
    const detail = {
      up: event.key === 'ArrowUp',
      down: event.key === 'ArrowDown',
      left: event.key === 'ArrowLeft',
      right: event.key === 'ArrowRight'
    };
    
    const navEvent = new CustomEvent('accessibility:arrow-key', { detail });
    document.dispatchEvent(navEvent);
  }

  handleEscape() {
    const event = new CustomEvent('accessibility:escape');
    document.dispatchEvent(event);
  }

  getFocusableElements() {
    if (this.focusableElements.length === 0) {
      this.focusableElements = Array.from(
        document.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden';
      });
    }
    return this.focusableElements;
  }

  // Set ARIA attributes for interactive elements
  setAriaLabel(element, label) {
    element.setAttribute('aria-label', label);
  }

  setAriaDescribedBy(element, descriptionId) {
    element.setAttribute('aria-describedby', descriptionId);
  }

  setAriaPressed(element, pressed) {
    element.setAttribute('aria-pressed', pressed);
  }

  setAriaExpanded(element, expanded) {
    element.setAttribute('aria-expanded', expanded);
  }

  // Announce messages to screen readers
  announce(message, priority = 'polite') {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only'; // visually hidden but readable
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    setTimeout(() => announcement.remove(), 1000);
  }

  // Focus on 3D viewport with accessible name
  makeFocusable(element) {
    element.setAttribute('tabindex', '0');
    element.setAttribute('role', 'img');
    element.setAttribute('aria-label', '3D анатомическая модель. Используйте мышь или сенсорный экран для взаимодействия.');
  }

  // Manage focus for modal dialogs
  setFocusTrap(modalElement, onEscape) {
    const focusableInModal = Array.from(
      modalElement.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    );

    if (focusableInModal.length === 0) return;

    const firstElement = focusableInModal[0];
    const lastElement = focusableInModal[focusableInModal.length - 1];

    firstElement.focus();

    modalElement.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    });

    modalElement.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        onEscape();
      }
    });
  }

  // Get keyboard shortcuts for help/documentation
  getShortcutsHelp() {
    return Array.from(this.keyBindings.entries()).map(([key, { description }]) => ({
      key,
      description
    }));
  }
}
