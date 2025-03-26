class InteractiveSVG {
  constructor() {
    this.containerMap = new Map();   // Mapa de contenidors i els seus fills directes
    this.parentMap = new Map();      // Mapa de fills amb el seu pare directe
    this.fullHierarchy = new Map();  // Mapa complet de totes les relacions
  }

  init() {
    try {
      this.afegirEstils();
      this.processarSVG();
      this.afegirListeners();
      console.log('Interactivitat activada');
    } catch (error) {
      console.error('Error:', error);
    }
  }

  afegirEstils() {
    const style = document.createElement('style');
    style.textContent = `
      .hidden { opacity: 0.2 !important; transition: opacity 0.3s; }
      .diagram-node { cursor: pointer; transition: opacity 0.3s; }
      .diagram-connection { stroke-opacity: 0.6; transition: stroke-opacity 0.3s; }
    `;
    document.head.appendChild(style);
  }

  processarSVG() {
    const svg = document.querySelector('.contenidor-svg svg');
    if (!svg) throw new Error('No es troba el SVG');

    // Netejar classes existents
    svg.querySelectorAll('g').forEach(g => {
      g.classList.remove('diagram-node', 'diagram-connection', 'diagram-container');
    });

    // Processar elements
    svg.querySelectorAll('g').forEach(g => {
      const classeOriginal = Array.from(g.classList).find(c => this.esBase64Valid(c));
      if (!classeOriginal) return;

      const decodificat = this.decodificarBase64(classeOriginal);
      const esConnexio = decodificat.startsWith('(');

      g.classList.add(esConnexio ? 'diagram-connection' : 'diagram-node');

      if (!esConnexio) {
        // Registrar jerarquia
        const parts = decodificat.split('.');
        this.fullHierarchy.set(classeOriginal, parts);
        
        // Registrar relacions pare-fill
        if (parts.length > 1) {
          const nomPare = parts.slice(0, -1).join('.');
          const classePare = this.codificarBase64(nomPare);
          this.parentMap.set(classeOriginal, classePare);
          
          if (!this.containerMap.has(classePare)) {
            this.containerMap.set(classePare, []);
          }
          this.containerMap.get(classePare).push(classeOriginal);
        }
      }
    });

    this.marcarContenidors();
  }

  marcarContenidors() {
    this.containerMap.forEach((fills, classePare) => {
      const elementPare = document.querySelector(`.${CSS.escape(classePare)}`);
      if (elementPare) {
        elementPare.classList.add('diagram-container');
      }
    });
  }

  // Funcionalitat d'interactivitat
  afegirListeners() {
    document.querySelectorAll('.diagram-node').forEach(node => {
      node.addEventListener('mouseover', (e) => {
        e.stopPropagation();
        this.resaltar(node);
      });
      node.addEventListener('mouseout', () => this.reiniciar());
    });
  }

  resaltar(node) {
    const classeOriginal = Array.from(node.classList).find(c => this.esBase64Valid(c));
    if (!classeOriginal) return;

    const esContenidor = node.classList.contains('diagram-container');
    const elementsAMostrar = new Set();

    // 1. Afegir sempre l'element hover i les seves connexions directes
    elementsAMostrar.add(node);
    this.obtenirConnexionsRelacionades(classeOriginal).forEach(c => elementsAMostrar.add(c));

    if (esContenidor) {
      // Cas contenidor: mostrar tota la descendència
      const descendents = this.obtenirDescendents(classeOriginal);
      descendents.forEach(d => {
        const elementDescendent = document.querySelector(`.${CSS.escape(d)}`);
        if (elementDescendent) {
          elementsAMostrar.add(elementDescendent);
          this.obtenirConnexionsRelacionades(d).forEach(c => elementsAMostrar.add(c));
        }
      });
    }

    // 2. Ocultar la resta d'elements
    document.querySelectorAll('.diagram-node, .diagram-connection').forEach(el => {
      if (!elementsAMostrar.has(el)) {
        el.classList.add('hidden');
      }
    });
  }

  reiniciar() {
    document.querySelectorAll('.hidden').forEach(el => el.classList.remove('hidden'));
  }

  obtenirDescendents(classeBase) {
    const descendents = new Set();
    const cua = [classeBase];
    
    while (cua.length > 0) {
      const actual = cua.pop();
      const fills = this.containerMap.get(actual) || [];
      
      fills.forEach(fill => {
        descendents.add(fill);
        cua.push(fill);
      });
    }
    
    return descendents;
  }

  obtenirConnexionsRelacionades(classeBase) {
    const decodificat = this.decodificarBase64(classeBase);
    const selectorConnexio = `[class*="${this.codificarBase64(`(${decodificat}.`)}"]`;
    return Array.from(document.querySelectorAll(selectorConnexio)).filter(el => 
      el.classList.contains('diagram-connection')
    );
  }

  // Helpers
  esBase64Valid(str) {
    return /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/.test(str);
  }

  decodificarBase64(str) {
    try {
      return decodeURIComponent(escape(atob(str)));
    } catch {
      return '';
    }
  }

  codificarBase64(str) {
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
