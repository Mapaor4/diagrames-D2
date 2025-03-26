class InteractiveSVG {
  constructor() {
    this.containerMap = new Map();  // Mapa de contenidors i els seus fills
    this.parentMap = new Map();     // Relacions parent-fill
    this.initialized = false;
  }

  init() {
    try {
      this.addStyles();
      this.processSVG();
      this.attachEventListeners();
      this.initialized = true;
      console.log('✅ SVG interactiu inicialitzat correctament');
    } catch (error) {
      console.error('❌ Error inicialitzant:', error);
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
    if (!svg) throw new Error('No es troba l\'SVG');

    // Processar tots els elements <g>
    svg.querySelectorAll('g').forEach(g => {
      const originalClass = Array.from(g.classList).find(c => this.isValidBase64(c));
      
      if (!originalClass) {
        console.warn('Element sense classe vàlida:', g);
        return;
      }

      // Decodificar la classe
      const decoded = this.decodeBase64(originalClass);
      const isConnection = decoded.startsWith('(');
      const shortName = this.getShortName(decoded);
      const parentName = this.getParentName(decoded);

      console.log('Processant element:', {
        originalClass,
        decoded,
        isConnection,
        shortName,
        parentName
      });

      // Assignar classes
      g.classList.remove('diagram-node', 'diagram-connection', 'diagram-container');
      
      if (isConnection) {
        g.classList.add('diagram-connection');
        this.processConnection(originalClass, decoded);
      } else {
        g.classList.add('diagram-node');
        this.processNode(originalClass, decoded, parentName);
      }
    });

    // Marcar contenidors
    this.markContainers();
  }

  processNode(originalClass, decodedName, parentName) {
    // Registrar relació parent-fill
    if (parentName) {
      const parentClass = this.encodeBase64(parentName);
      this.parentMap.set(originalClass, parentClass);
      
      if (!this.containerMap.has(parentClass)) {
        this.containerMap.set(parentClass, []);
      }
      this.containerMap.get(parentClass).push(originalClass);
    }
  }

  processConnection(originalClass, decodedName) {
    // Registrar connexions (implementar lògica específica segons necessitat)
    console.log('Registrant connexió:', decodedName);
  }

  markContainers() {
    this.containerMap.forEach((children, parentClass) => {
      const parentElement = document.querySelector(`.${CSS.escape(parentClass)}`);
      if (parentElement) {
        parentElement.classList.add('diagram-container');
        console.log(`Marcat com a contenidor: ${parentClass}`);
      }
    });
  }

  // Helpers
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

    const decoded = this.decodeBase64(originalClass);
    console.log('Highlighting:', decoded);

    // Lògica d'highlight (exemple bàsic)
    document.querySelectorAll('.diagram-node, .diagram-connection').forEach(el => {
      const elClass = Array.from(el.classList).find(c => this.isValidBase64(c));
      if (elClass !== originalClass) el.classList.add('hidden');
    });
  }

  reset() {
    document.querySelectorAll('.hidden').forEach(el => el.classList.remove('hidden'));
  }
}

// Inicialització
document.addEventListener('DOMContentLoaded', () => {
  new InteractiveSVG().init();
});
