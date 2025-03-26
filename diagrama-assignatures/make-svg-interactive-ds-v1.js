class InteractiveSVG {
  constructor() {
    this.containerMap = new Map();
  }

  init() {
    try {
      this.processSVG();
      console.log('Classes assignades correctament');
    } catch (error) {
      console.error('Error:', error);
    }
  }

  processSVG() {
    const svg = document.querySelector('.contenidor-svg svg');
    if (!svg) {
      console.warn('SVG no trobat - esperant a que es carregui...');
      setTimeout(() => this.processSVG(), 100);
      return;
    }

    // Clear existing classes
    svg.querySelectorAll('g').forEach(g => {
      g.classList.remove('diagram-node', 'diagram-connection', 'diagram-container');
    });

    // Assign proper classes
    svg.querySelectorAll('g').forEach(g => {
      const originalClass = Array.from(g.classList).find(c => this.isValidBase64(c));
      if (!originalClass) return;

      const decoded = this.decodeBase64(originalClass);
      const isConnection = decoded.startsWith('(');
      
      g.classList.add(isConnection ? 'diagram-connection' : 'diagram-node');

      if (!isConnection) {
        const parentName = this.getParentName(decoded);
        if (parentName) {
          const parentClass = this.encodeBase64(parentName);
          if (!this.containerMap.has(parentClass)) {
            this.containerMap.set(parentClass, []);
          }
          this.containerMap.get(parentClass).push(originalClass);
        }
      }
    });

    // Mark containers
    this.containerMap.forEach((children, parentClass) => {
      const parentElement = document.querySelector(`.${CSS.escape(parentClass)}`);
      if (parentElement && parentElement.classList.contains('diagram-node')) {
        parentElement.classList.add('diagram-container');
      }
    });
  }

  // Helper methods
  isValidBase64(str) {
    return /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/.test(str);
  }

  decodeBase64(str) {
    try {
      return decodeURIComponent(escape(atob(str)));
    } catch {
      return '';
    }
  }

  encodeBase64(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }

  getParentName(decoded) {
    return decoded.includes('.') ? decoded.split('.').slice(0, -1).join('.') : null;
  }
}

// Initialize after SVG is loaded
function attachSVGEvents() {
  new InteractiveSVG().init();
}

// Fallback initialization
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.contenidor-svg svg')) {
    new InteractiveSVG().init();
  }
});
