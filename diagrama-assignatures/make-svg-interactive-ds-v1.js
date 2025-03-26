class InteractiveSVG {
  constructor() {
    this.containerMap = new Map();  // Map of containers and their children
    this.parentMap = new Map();     // Parent-child relationships
    this.initialized = false;
  }

  init() {
    try {
      this.addStyles();
      this.processSVG();
      this.attachEventListeners();
      this.initialized = true;
      console.log('Interactive SVG initialized');
    } catch (error) {
      console.error('Initialization error:', error);
    }
  }

  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .hidden { opacity: 0.2; transition: opacity 0.3s; }
      .diagram-node { cursor: pointer; transition: opacity 0.3s; }
      .diagram-connection { stroke-opacity: 0.6; transition: stroke-opacity 0.3s; }
    `;
    document.head.appendChild(style);
  }

  processSVG() {
    const svg = document.querySelector('.contenidor-svg svg');
    if (!svg) throw new Error('SVG element not found');

    svg.querySelectorAll('g').forEach(g => {
      const originalClass = Array.from(g.classList).find(c => this.isValidBase64(c));
      if (!originalClass) return;

      // Clear existing diagram classes
      g.classList.remove('diagram-node', 'diagram-connection', 'diagram-container');

      const decoded = this.decodeBase64(originalClass);
      const isConnection = decoded.startsWith('(');
      
      if (isConnection) {
        g.classList.add('diagram-connection');
      } else {
        g.classList.add('diagram-node');
        const parentName = this.getParentName(decoded);
        if (parentName) {
          this.registerParentChild(originalClass, parentName);
        }
      }
    });

    // Mark containers after processing all nodes
    this.markContainers();
  }

  registerParentChild(childClass, parentName) {
    const parentClass = this.encodeBase64(parentName);
    this.parentMap.set(childClass, parentClass);
    
    if (!this.containerMap.has(parentClass)) {
      this.containerMap.set(parentClass, []);
    }
    this.containerMap.get(parentClass).push(childClass);
  }

  markContainers() {
    this.containerMap.forEach((children, parentClass) => {
      const parentElement = document.querySelector(`.${CSS.escape(parentClass)}`);
      if (parentElement) {
        parentElement.classList.add('diagram-container');
      }
    });
  }

  // Helper methods
  isValidBase64(str) {
    try {
      return btoa(atob(str)) === str;
    } catch (e) {
      return false;
    }
  }

  decodeBase64(str) {
    return decodeURIComponent(escape(atob(str)));
  }

  encodeBase64(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }

  getShortName(decoded) {
    return decoded.split('.').pop();
  }

  getParentName(decoded) {
    const parts = decoded.split('.');
    return parts.length > 1 ? parts.slice(0, -1).join('.') : null;
  }

  attachEventListeners() {
    document.querySelectorAll('.diagram-node').forEach(node => {
      node.addEventListener('mouseover', () => this.highlight(node));
      node.addEventListener('mouseout', () => this.reset());
    });
  }

  highlight(node) {
    const originalClass = Array.from(node.classList).find(c => this.isValidBase64(c));
    if (!originalClass) return;

    document.querySelectorAll('.diagram-node, .diagram-connection').forEach(el => {
      const elClass = Array.from(el.classList).find(c => this.isValidBase64(c));
      if (elClass !== originalClass) el.classList.add('hidden');
    });
  }

  reset() {
    document.querySelectorAll('.hidden').forEach(el => el.classList.remove('hidden'));
  }
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  new InteractiveSVG().init();
});
