class InteractiveSVG {
  constructor() {
    this.containerMap = new Map();
    this.parentMap = new Map();
    this.initialized = false;
  }

  init() {
    try {
      this.addStyles();
      this.processSVG();
      this.attachEventListeners();
      this.initialized = true;
      console.log('Interactive SVG initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Interactive SVG:', error);
      this.cleanup();
    }
  }

  addStyles() {
    const styleId = 'diagram-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .hidden { 
        opacity: 0.2; 
        transition: opacity 0.3s ease; 
      }
      .diagram-node, 
      .diagram-container, 
      .diagram-connection { 
        transition: opacity 0.3s ease; 
      }
    `;
    document.head.appendChild(style);
  }

  processSVG() {
    const svgContainer = document.querySelector('.contenidor-svg');
    if (!svgContainer) {
      throw new Error('SVG container not found');
    }

    const elements = svgContainer.querySelectorAll('g');
    if (elements.length === 0) {
      console.warn('No SVG groups found for processing');
      return;
    }

    elements.forEach(element => {
      if (!element.classList || element.classList.length === 0) {
        console.warn('Element without classes:', element);
        return;
      }

      // Processem TOTES les classes de l'element
      Array.from(element.classList).forEach(className => {
        try {
          // Intentem determinar si és node o connexió basat en el contingut
          const isConnection = className.startsWith('(') || 
                              className.includes('->') || 
                              className.includes('<-') || 
                              className.includes('--');

          if (isConnection) {
            element.classList.add('diagram-connection');
            this.processConnection(className);
          } else {
            element.classList.add('diagram-node');
            this.processNode(className);
          }
        } catch (error) {
          console.warn(`Error processing class ${className}:`, error);
        }
      });
    });

    this.markContainers();
  }

  processConnection(className) {
    try {
      const parsed = this.parseConnectionID(className);
      if (!parsed) return;

      if (!this.containerMap.has(parsed.startNode)) {
        this.containerMap.set(parsed.startNode, { nodes: [], connections: [] });
      }
      if (!this.containerMap.has(parsed.endNode)) {
        this.containerMap.set(parsed.endNode, { nodes: [], connections: [] });
      }

      this.containerMap.get(parsed.startNode).connections.push(className);
      this.containerMap.get(parsed.endNode).connections.push(className);
    } catch (error) {
      console.error(`Error processing connection ${className}:`, error);
    }
  }

  processNode(className) {
    const parentName = this.getParentName(className);
    if (parentName) {
      this.parentMap.set(className, parentName);

      if (!this.containerMap.has(parentName)) {
        this.containerMap.set(parentName, { nodes: [], connections: [] });
      }
      this.containerMap.get(parentName).nodes.push(className);
    }
  }

  markContainers() {
    this.containerMap.forEach((_, containerID) => {
      const containerElement = document.querySelector(`.contenidor-svg g.${CSS.escape(containerID)}`);
      if (containerElement) {
        containerElement.classList.add('diagram-container');
      }
    });
  }

  // ... (resta de mètodes es mantenen iguals però amb classes originals)
}

// Inicialització
document.addEventListener('DOMContentLoaded', () => {
  const interactiveSVG = new InteractiveSVG();
  interactiveSVG.init();
});
