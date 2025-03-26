class InteractiveSVG {
  constructor() {
    this.containerMap = new Map();  // Mapa de contenidors i els seus fills directes
    this.parentMap = new Map();     // Mapa de fills amb el seu parent directe
    this.fullHierarchy = new Map(); // Mapa complet de totes les relacions
  }

  init() {
    try {
      this.addStyles();
      this.processSVG();
      this.attachEventListeners();
      console.log('Interactivitat activada');
    } catch (error) {
      console.error('Error:', error);
    }
  }

  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .hidden { opacity: 0.2 !important; transition: opacity 0.3s; }
      .diagram-node { cursor: pointer; transition: opacity 0.3s; }
      .diagram-connection { stroke-opacity: 0.6; transition: stroke-opacity 0.3s; }
    `;
    document.head.appendChild(style);
  }

  processSVG() {
    const svg = document.querySelector('.contenidor-svg svg');
    if (!svg) throw new Error('No es troba el SVG');

    // Netejar classes existents
    svg.querySelectorAll('g').forEach(g => {
      g.classList.remove('diagram-node', 'diagram-connection', 'diagram-container');
    });

    // Processar elements
    svg.querySelectorAll('g').forEach(g => {
      const originalClass = Array.from(g.classList).find(c => this.isValidBase64(c));
      if (!originalClass) return;

      const decoded = this.decodeBase64(originalClass);
      const isConnection = decoded.startsWith('(');

      g.classList.add(isConnection ? 'diagram-connection' : 'diagram-node');

      if (!isConnection) {
        // Registrar jerarquia
        const parts = decoded.split('.');
        this.fullHierarchy.set(originalClass, parts);
        
        // Registrar relacions parent-fill
        if (parts.length > 1) {
          const parentName = parts.slice(0, -1).join('.');
          const parentClass = this.encodeBase64(parentName);
          this.parentMap.set(originalClass, parentClass);
          
          if (!this.containerMap.has(parentClass)) {
            this.containerMap.set(parentClass, []);
          }
          this.containerMap.get(parentClass).push(originalClass);
        }
      }
    });

    this.markContainers();
  }

  markContainers() {
    this.containerMap.forEach((children, parentClass) => {
      const parentElement = document.querySelector(`.${CSS.escape(parentClass)}`);
      if (parentElement) {
        parentElement.classList.add('diagram-container');
      }
    });
  }

  // Funcionalitat d'interactivitat
  attachEventListeners() {
    document.querySelectorAll('.diagram-node').forEach(node => {
      node.addEventListener('mouseover', (e) => {
        e.stopPropagation();
        this.highlight(node);
      });
      node.addEventListener('mouseout', () => this.reset());
    });
  }

  highlight(node) {
    const originalClass = Array.from(node.classList).find(c => this.isValidBase64(c));
    if (!originalClass) return;

    const isContainer = node.classList.contains('diagram-container');
    const elementsToShow = new Set();

    // Afegir el propi node
    elementsToShow.add(node);

    // Obtenir totes les connexions relacionades
    const connections = this.getRelatedConnections(originalClass);
    connections.forEach(c => elementsToShow.add(c));

    if (isContainer) {
      // Cas contenidor: mostrar tota la descendència
      const descendants = this.getAllDescendants(originalClass);
      descendants.forEach(d => {
        elementsToShow.add(document.querySelector(`.${CSS.escape(d)}`));
        this.getRelatedConnections(d).forEach(c => elementsToShow.add(c));
      });
    } else {
      // Cas node normal: mostrar parent, germans i connexions directes
      const parentClass = this.parentMap.get(originalClass);
      if (parentClass) {
        elementsToShow.add(document.querySelector(`.${CSS.escape(parentClass)}`));
        this.containerMap.get(parentClass)?.forEach(sibling => {
          elementsToShow.add(document.querySelector(`.${CSS.escape(sibling)}`));
        });
      }
    }

    // Amagar tots els elements excepte els rellevants
    document.querySelectorAll('.diagram-node, .diagram-connection').forEach(el => {
      if (!elementsToShow.has(el)) {
        el.classList.add('hidden');
      }
    });
  }

  reset() {
    document.querySelectorAll('.hidden').forEach(el => el.classList.remove('hidden'));
  }

  // Helpers
  getAllDescendants(baseClass) {
    const descendants = new Set();
    const queue = [baseClass];
    
    while (queue.length > 0) {
      const current = queue.pop();
      const children = this.containerMap.get(current) || [];
      
      children.forEach(child => {
        descendants.add(child);
        queue.push(child);
      });
    }
    
    return descendants;
  }

  getRelatedConnections(baseClass) {
    const decoded = this.decodeBase64(baseClass);
    const connectionSelector = `[class*="${this.encodeBase64(`(${decoded}.`)}"]`; // Les connexions comencen amb '('
    return Array.from(document.querySelectorAll(connectionSelector)).filter(el => 
      el.classList.contains('diagram-connection')
    );
  }

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
}

// Inicialització automàtica
function attachSVGEvents() {
  new InteractiveSVG().init();
}

// Inicialització per si falla la crida manual
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.contenidor-svg svg')) {
    new InteractiveSVG().init();
  }
});
