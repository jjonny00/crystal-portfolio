// src/utils/keyboardNavigation.js
// Enhanced keyboard navigation that works with CSS scroll snapping

/**
 * Keyboard navigation utility for scroll-snapped sections
 */
export class KeyboardNavigator {
  constructor(options = {}) {
    this.sectionSelector = options.sectionSelector || '.scroll-section';
    this.enabledKeys = options.enabledKeys || ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'];
    this.debugMode = options.debugMode || false;
    
    this.sections = [];
    this.currentSectionIndex = 0;
    this.isNavigating = false;
    
    this.init();
  }
  
  /**
   * Initialize the navigator
   */
  init() {
    this.updateSections();
    this.bindEvents();
    this.findCurrentSection();
    
    if (this.debugMode) {
      console.log('🎹 Keyboard Navigator initialized with', this.sections.length, 'sections');
    }
  }
  
  /**
   * Update the list of sections
   */
  updateSections() {
    this.sections = Array.from(document.querySelectorAll(this.sectionSelector))
      .filter(section => section.id) // Only sections with IDs
      .map((section, index) => ({
        element: section,
        id: section.id,
        index: index
      }));
  }
  
  /**
   * Find the current section based on scroll position
   */
  findCurrentSection() {
    const scrollY = window.pageYOffset;
    let closestIndex = 0;
    let minDistance = Infinity;
    
    this.sections.forEach((section, index) => {
      const sectionTop = section.element.offsetTop;
      const distance = Math.abs(scrollY - sectionTop);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });
    
    this.currentSectionIndex = closestIndex;
    
    if (this.debugMode) {
      console.log('📍 Current section:', this.sections[closestIndex]?.id);
    }
  }
  
  /**
   * Navigate to a specific section
   */
  navigateToSection(index, smooth = true) {
    if (index < 0 || index >= this.sections.length) {
      return false;
    }
    
    if (this.isNavigating) {
      return false; // Prevent rapid navigation
    }
    
    this.isNavigating = true;
    this.currentSectionIndex = index;
    
    const section = this.sections[index];
    
    if (this.debugMode) {
      console.log('🎹 Navigating to section:', section.id);
    }
    
    // Use scrollIntoView for better scroll snap support
    section.element.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
      block: 'start',
      inline: 'nearest'
    });
    
    // Reset navigation lock after animation
    setTimeout(() => {
      this.isNavigating = false;
    }, smooth ? 800 : 100);
    
    return true;
  }
  
  /**
   * Navigate to next section
   */
  navigateNext() {
    return this.navigateToSection(this.currentSectionIndex + 1);
  }
  
  /**
   * Navigate to previous section
   */
  navigatePrevious() {
    return this.navigateToSection(this.currentSectionIndex - 1);
  }
  
  /**
   * Navigate to first section
   */
  navigateToFirst() {
    return this.navigateToSection(0);
  }
  
  /**
   * Navigate to last section
   */
  navigateToLast() {
    return this.navigateToSection(this.sections.length - 1);
  }
  
  /**
   * Bind keyboard events
   */
  bindEvents() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
    
    document.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('scroll', this.handleScroll, { passive: true });
  }
  
  /**
   * Handle keyboard events
   */
  handleKeyDown(event) {
    // Don't interfere with form inputs
    if (this.isInputFocused()) {
      return;
    }
    
    // Don't interfere with modifier keys
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }
    
    if (!this.enabledKeys.includes(event.key)) {
      return;
    }
    
    let handled = false;
    
    switch (event.key) {
      case 'ArrowDown':
      case 'PageDown':
        handled = this.navigateNext();
        break;
        
      case 'ArrowUp':
      case 'PageUp':
        handled = this.navigatePrevious();
        break;
        
      case 'Home':
        handled = this.navigateToFirst();
        break;
        
      case 'End':
        handled = this.navigateToLast();
        break;
    }
    
    if (handled) {
      event.preventDefault();
      event.stopPropagation();
    }
  }
  
  /**
   * Handle scroll events to update current section
   */
  handleScroll() {
    if (!this.isNavigating) {
      // Throttle the current section detection
      if (this.scrollTimeout) {
        clearTimeout(this.scrollTimeout);
      }
      
      this.scrollTimeout = setTimeout(() => {
        this.findCurrentSection();
      }, 100);
    }
  }
  
  /**
   * Check if an input element is currently focused
   */
  isInputFocused() {
    const activeElement = document.activeElement;
    
    if (!activeElement) return false;
    
    const inputTypes = ['input', 'textarea', 'select', 'button'];
    
    return (
      inputTypes.includes(activeElement.tagName.toLowerCase()) ||
      activeElement.isContentEditable ||
      activeElement.getAttribute('role') === 'textbox'
    );
  }
  
  /**
   * Get current section info
   */
  getCurrentSection() {
    return this.sections[this.currentSectionIndex] || null;
  }
  
  /**
   * Get all sections
   */
  getAllSections() {
    return [...this.sections];
  }
  
  /**
   * Navigate to section by ID
   */
  navigateToSectionById(sectionId) {
    const index = this.sections.findIndex(section => section.id === sectionId);
    if (index !== -1) {
      return this.navigateToSection(index);
    }
    return false;
  }
  
  /**
   * Update keyboard navigation settings
   */
  updateSettings(options = {}) {
    if (options.enabledKeys) {
      this.enabledKeys = options.enabledKeys;
    }
    
    if (options.debugMode !== undefined) {
      this.debugMode = options.debugMode;
    }
    
    // Refresh sections if selector changed
    if (options.sectionSelector && options.sectionSelector !== this.sectionSelector) {
      this.sectionSelector = options.sectionSelector;
      this.updateSections();
    }
  }
  
  /**
   * Destroy the navigator
   */
  destroy() {
    document.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('scroll', this.handleScroll);
    
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    
    if (this.debugMode) {
      console.log('🎹 Keyboard Navigator destroyed');
    }
  }
}

/**
 * React hook for keyboard navigation
 */
export const useKeyboardNavigation = (options = {}) => {
  const [navigator, setNavigator] = React.useState(null);
  const [currentSection, setCurrentSection] = React.useState(null);
  
  React.useEffect(() => {
    const nav = new KeyboardNavigator({
      ...options,
      debugMode: options.debugMode || false
    });
    
    setNavigator(nav);
    setCurrentSection(nav.getCurrentSection());
    
    // Update current section when navigation happens
    const originalNavigateToSection = nav.navigateToSection.bind(nav);
    nav.navigateToSection = (...args) => {
      const result = originalNavigateToSection(...args);
      if (result) {
        setTimeout(() => {
          setCurrentSection(nav.getCurrentSection());
        }, 100);
      }
      return result;
    };
    
    return () => {
      nav.destroy();
    };
  }, []);
  
  // Update current section when external scroll happens
  React.useEffect(() => {
    if (!navigator) return;
    
    const handleScroll = () => {
      if (!navigator.isNavigating) {
        setCurrentSection(navigator.getCurrentSection());
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [navigator]);
  
  return {
    navigator,
    currentSection,
    navigateNext: () => navigator?.navigateNext(),
    navigatePrevious: () => navigator?.navigatePrevious(),
    navigateToFirst: () => navigator?.navigateToFirst(),
    navigateToLast: () => navigator?.navigateToLast(),
    navigateToSection: (id) => navigator?.navigateToSectionById(id),
    allSections: navigator?.getAllSections() || []
  };
};