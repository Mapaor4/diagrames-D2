class InteractiveSVG {
  constructor() {
    this.containerMap = new Map();
    this.parentMap = new Map();
    this.initialized = false;
  }

  init() {
    console.log('🔍 Cercant SVG...');
    try {
      this.addStyles();
      
      // Intentar fins a 5 vegades amb retard entre intents
      let attempts = 0;
      const maxAttempts = 5;
      const tryProcessing = () => {
        attempts++;
        console.log(`\n⟳ Intent ${attempts}/${maxAttempts}...`);
        
        if (this.processSVG()) {
          this.attachEventListeners();
          this.initialized = true;
          console.log('✅ SVG interactiu inicialitzat correctament');
        } else if (attempts < maxAttempts) {
          setTimeout(tryProcessing, 500 * attempts);
        } else {
          console.error('❌ No s\'ha pogut inicialitzar després de múltiples intents');
        }
      };
      
      tryProcessing();
    } catch (error) {
      console.error('❌ Error crític:', error);
    }
  }

  addStyles() {
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
    console.log('🎨 Estils afegits');
  }

  processSVG() {
    const svgContainer = document.querySelector('.contenidor-svg');
    if (!svgContainer) {
      console.error('❌ No es troba .contenidor-svg');
      return false;
    }

    // Cerca més flexible d'elements SVG
    const elements = [
      ...svgContainer.querySelectorAll('g'),
      ...svgContainer.querySelectorAll('svg g') // Per si està niuat
    ];
    
    console.log(`📊 Elements trobats: ${elements.length}`);
    elements.forEach(el => console.log('  ├─', el));

    if (elements.length === 0) {
      console.warn('⚠️ No hi ha elements <g> per processar');
      return false;
    }

    // Processament simplificat
    elements.forEach(element => {
      if (!element.classList || element.classList.length === 0) {
        element.classList.add('diagram-node'); // Assigna per defecte
        console.log('➕ Classificat com a node per defecte:', element);
        return;
      }

      const isConnection = Array.from(element.classList).some(cls => 
        cls.match(/[()→←↔-]/) // Patrons de connexions
      );

      if (isConnection) {
        element.classList.add('diagram-connection');
        console.log('🔄 Classificat com a connexió:', element);
      } else {
        element.classList.add('diagram-node');
        console.log('⏹️ Classificat com a node:', element);
        
        // Marcar com a contenidor si té fills
        if (element.querySelector('g, path, rect, circle')) {
          element.classList.add('diagram-container');
          console.log('📦 Marcat com a contenidor:', element);
        }
      }
    });

    return true;
  }

  attachEventListeners() {
    const nodes = document.querySelectorAll('.diagram-node, .diagram-container');
    console.log(`🎯 Afegint listeners a ${nodes.length} elements`);
    
    nodes.forEach(node => {
      node.addEventListener('mouseenter', () => this.highlightNode(node));
      node.addEventListener('mouseleave', () => this.resetHighlight());
    });
  }

  highlightNode(nodeElement) {
    const className = nodeElement.classList.value.split(' ')[0];
    console.log(`💡 Highlight: ${className}`);
    
    // Implementació simplificada per testing
    document.querySelectorAll('.diagram-node, .diagram-connection').forEach(el => {
      el.classList.toggle('hidden', !el.classList.contains(className));
    });
  }

  resetHighlight() {
    document.querySelectorAll('.hidden').forEach(el => {
      el.classList.remove('hidden');
    });
  }
}

// Inicialització amb verificació millorada
function initInteractiveSVG() {
  console.log('🏁 Iniciant inicialització...');
  
  // Versió tolerant a SVG dinàmics
  const svgObserver = new MutationObserver((mutations, obs) => {
    const svgContent = document.querySelector('.contenidor-svg g, .contenidor-svg svg');
    if (svgContent) {
      console.log('🎯 SVG carregat, procedint...');
      obs.disconnect();
      new InteractiveSVG().init();
    }
  });

  svgObserver.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Timeout de seguretat
  setTimeout(() => {
    svgObserver.disconnect();
    if (!document.querySelector('.diagram-node')) {
      console.error('⏳ Timeout: No es va detectar SVG carregat');
    }
  }, 10000);
}

// Iniciar
if (document.readyState === 'complete') {
  initInteractiveSVG();
} else {
  window.addEventListener('load', initInteractiveSVG);
  document.addEventListener('DOMContentLoaded', initInteractiveSVG);
}s
