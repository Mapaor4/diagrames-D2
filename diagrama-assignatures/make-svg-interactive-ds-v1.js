class InteractiveSVG {
  constructor() {
    this.containerMap = new Map();
    this.parentMap = new Map();
    this.initialized = false;
    console.log('Constructor executat'); // Punt de control 1
  }

  init() {
    console.log('Iniciant inicialització...'); // Punt de control 2
    try {
      this.addStyles();
      this.processSVG();
      this.attachEventListeners();
      this.initialized = true;
      console.log('✅ Interactive SVG inicialitzat correctament');
    } catch (error) {
      console.error('❌ Error inicialitzant:', error);
      this.cleanup();
    }
  }

  addStyles() {
    console.log('Afegint estils...'); // Punt de control 3
    const styleId = 'diagram-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .hidden { opacity: 0.2; transition: opacity 0.3s; }
      .diagram-node, .diagram-connection, .diagram-container { 
        transition: opacity 0.3s; 
      }
    `;
    document.head.appendChild(style);
    console.log('Estils afegits correctament');
  }

  processSVG() {
    console.log('Processant SVG...'); // Punt de control 4
    
    const svgContainer = document.querySelector('.contenidor-svg');
    if (!svgContainer) {
      console.error('❌ No es troba el contenidor SVG');
      throw new Error('SVG container not found');
    }

    const elements = svgContainer.querySelectorAll('g');
    console.log(`Elements <g> trobats: ${elements.length}`); // Punt de control 5

    if (elements.length === 0) {
      console.warn('⚠️ No s\'han trobat elements <g> per processar');
      return;
    }

    elements.forEach((element, index) => {
      console.group(`Processant element ${index}:`);
      console.log('Element:', element);
      
      if (!element.classList || element.classList.length === 0) {
        console.warn('Element sense classes, ignorant...');
        console.groupEnd();
        return;
      }

      console.log('Classes de l\'element:', Array.from(element.classList)); // Punt de control 6

      let classified = false;
      Array.from(element.classList).forEach(className => {
        try {
          // Mètode simplificat per detectar connexions
          const isConnection = /(\(|->|<-|--|→|←|↔)/.test(className);
          
          if (isConnection) {
            console.log(`Classificant com a CONNEXIÓ: ${className}`);
            element.classList.add('diagram-connection');
            this.processConnection(className);
            classified = true;
          } else if (className.includes('.')) {
            console.log(`Classificant com a NODE: ${className}`);
            element.classList.add('diagram-node');
            this.processNode(className);
            classified = true;
          }
        } catch (error) {
          console.warn(`Error processant classe ${className}:`, error);
        }
      });

      if (!classified) {
        console.warn('No s\'ha pogut classificar aquest element');
      }
      console.groupEnd();
    });

    this.markContainers();
    console.log('📊 Estat final dels maps:', {
      containerMap: this.containerMap,
      parentMap: this.parentMap
    }); // Punt de control 7
  }

  processConnection(className) {
    console.log(`Processant connexió: ${className}`); // Punt de control 8
    try {
      const parsed = this.parseConnectionID(className);
      if (!parsed) {
        console.warn(`No s'ha pogut analitzar la connexió: ${className}`);
        return;
      }

      console.log('Connexió analitzada:', parsed);

      if (!this.containerMap.has(parsed.startNode)) {
        this.containerMap.set(parsed.startNode, { nodes: [], connections: [] });
      }
      if (!this.containerMap.has(parsed.endNode)) {
        this.containerMap.set(parsed.endNode, { nodes: [], connections: [] });
      }

      this.containerMap.get(parsed.startNode).connections.push(className);
      this.containerMap.get(parsed.endNode).connections.push(className);
    } catch (error) {
      console.error(`Error processant connexió ${className}:`, error);
    }
  }

  processNode(className) {
    console.log(`Processant node: ${className}`); // Punt de control 9
    const parentName = this.getParentName(className);
    if (parentName) {
      console.log(`Node ${className} té parent: ${parentName}`);
      this.parentMap.set(className, parentName);

      if (!this.containerMap.has(parentName)) {
        this.containerMap.set(parentName, { nodes: [], connections: [] });
      }
      this.containerMap.get(parentName).nodes.push(className);
    } else {
      console.log(`Node ${className} no té parent`);
    }
  }

  markContainers() {
    console.log('Marcant contenidors...'); // Punt de control 10
    this.containerMap.forEach((_, containerID) => {
      const containerElement = document.querySelector(`.contenidor-svg g.${CSS.escape(containerID)}`);
      if (containerElement) {
        console.log(`Afegint classe diagram-container a: ${containerID}`);
        containerElement.classList.add('diagram-container');
      } else {
        console.warn(`No s'ha trobat el contenidor per: ${containerID}`);
      }
    });
  }

  // ... (Restaura els altres mètodes de la versió original que necessitis)
  // Assegura't d'afegir console.log als mètodes highlightNode i resetHighlight
}

// Inicialització amb verificació de càrrega
function initInteractiveSVG() {
  console.log('👀 Comprovant si el SVG està carregat...');
  const svgCheckInterval = setInterval(() => {
    const svgContainer = document.querySelector('.contenidor-svg');
    if (svgContainer && svgContainer.querySelector('g')) {
      clearInterval(svgCheckInterval);
      console.log('🎯 SVG trobat, inicialitzant...');
      window.interactiveSVG = new InteractiveSVG();
      window.interactiveSVG.init();
    } else {
      console.log('Encara no es troba l\'SVG...');
    }
  }, 500);

  // Timeout per evitar bucles infinits
  setTimeout(() => {
    clearInterval(svgCheckInterval);
  }, 10000);
}

// Iniciar quan el DOM estigui carregat
if (document.readyState !== 'loading') {
  initInteractiveSVG();
} else {
  document.addEventListener('DOMContentLoaded', initInteractiveSVG);
}
