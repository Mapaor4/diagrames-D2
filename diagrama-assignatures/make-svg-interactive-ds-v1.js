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
    const svg = document.querySelector('.interactive-svg-container svg'); // Canvia el selector segons el teu HTML
    if (!svg) throw new Error('No es troba el SVG (afegeix un div amb classe "interactive-svg-container" que contingui l\'SVG)');

    // Primer passat: Netejar classes existents
    svg.querySelectorAll('g').forEach(g => {
      g.classList.remove('diagram-node', 'diagram-connection', 'diagram-container');
    });

    // Segon passat: Assignar classes correctes
    svg.querySelectorAll('g').forEach(g => {
      const originalClass = Array.from(g.classList).find(c => this.isValidBase64(c));
      if (!originalClass) return;

      const decoded = this.decodeBase64(originalClass);
      const isConnection = decoded.startsWith('(');
      
      // Assignar classe principal
      g.classList.add(isConnection ? 'diagram-connection' : 'diagram-node');

      // Registrar contenidors
      if (!isConnection) {
        const parentName = this.getParentName(decoded);
        if (parentName) {
          const parentClass = this.encodeBase64(parentName);
          this.registerContainer(parentClass, originalClass);
        }
      }
    });

    // Tercer passat: Marcar contenidors
    this.markContainers();
  }

  registerContainer(parentClass, childClass) {
    if (!this.containerMap.has(parentClass)) {
      this.containerMap.set(parentClass, []);
    }
    this.containerMap.get(parentClass).push(childClass);
  }

  markContainers() {
    this.containerMap.forEach((children, parentClass) => {
      const parentElement = document.querySelector(`.${CSS.escape(parentClass)}`);
      if (parentElement && parentElement.classList.contains('diagram-node')) {
        parentElement.classList.add('diagram-container');
      }
    });
  }

  // Helpers
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

// Ús: Assegura't que el teu SVG està dins d'un div amb classe "interactive-svg-container"
document.addEventListener('DOMContentLoaded', () => {
  new InteractiveSVG().init();
});
