class InteractiveSVG {
  constructor() {
    this.containerMap = new Map();
    this.parentMap = new Map();
    this.fullHierarchy = new Map();
    this.connexionsMap = new Map(); // Nova estructura per guardar info de connexions
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

      if (esConnexio) {
        // Processar connexions
        const infoConnexio = this.parsejarConnexio(decodificat);
        if (infoConnexio) {
          this.connexionsMap.set(classeOriginal, infoConnexio);
        }
      } else {
        // Processar nodes
        const parts = decodificat.split('.');
        this.fullHierarchy.set(classeOriginal, parts);
        
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

  // Nova funció per analitzar connexions
  parsejarConnexio(decodificat) {
    const regex = /^\((.*?)\s*([-<->]+)\s*(.*?)\)\[\d+\]$/;
    const match = decodificat.match(regex);
    
    if (!match) return null;
    
    return {
      startNode: match[1].trim(),
      tipus: match[2].trim(),
      endNode: match[3].trim()
    };
  }

  marcarContenidors() {
    this.containerMap.forEach((fills, classePare) => {
      const elementPare = document.querySelector(`.${CSS.escape(classePare)}`);
      if (elementPare) {
        elementPare.classList.add('diagram-container');
      }
    });
  }

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
    const nodeDecodificat = this.decodificarBase64(classeOriginal);

    // 1. Afegir element principal
    elementsAMostrar.add(node);

    // 2. Obtenir veïns i connexions
    const { veins, connexions } = this.obtenirVeinsIConnexions(classeOriginal, nodeDecodificat);
    
    veins.forEach(veí => elementsAMostrar.add(veí));
    connexions.forEach(connexio => elementsAMostrar.add(connexio));

    // 3. Gestió de contenidors
    if (esContenidor) {
      const descendents = this.obtenirDescendents(classeOriginal);
      descendents.forEach(d => {
        const element = document.querySelector(`.${CSS.escape(d)}`);
        if (element) elementsAMostrar.add(element);
      });
    }

    // 4. Aplicar canvis
    document.querySelectorAll('.diagram-node, .diagram-connection').forEach(el => {
      el.classList.toggle('hidden', !elementsAMostrar.has(el));
    });
  }

  obtenirVeinsIConnexions(classeOriginal, nodeDecodificat) {
    const veins = new Set();
    const connexions = new Set();
    
    // Obtenir totes les connexions relacionades
    this.connexionsMap.forEach((info, classeConnexio) => {
      const elementConnexio = document.querySelector(`.${CSS.escape(classeConnexio)}`);
      if (!elementConnexio) return;

      // Comprovar si la connexió involucra el node actual
      if (info.startNode === nodeDecodificat || info.endNode === nodeDecodificat) {
        connexions.add(elementConnexio);
        
        // Afegir nodes veïns
        const classeStart = this.codificarBase64(info.startNode);
        const classeEnd = this.codificarBase64(info.endNode);
        
        const nodeStart = document.querySelector(`.${CSS.escape(classeStart)}`);
        const nodeEnd = document.querySelector(`.${CSS.escape(classeEnd)}`);
        
        if (nodeStart) veins.add(nodeStart);
        if (nodeEnd) veins.add(nodeEnd);
      }
    });

    return { veins: Array.from(veins), connexions: Array.from(connexions) };
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
    
    return Array.from(descendents);
  }

  reiniciar() {
    document.querySelectorAll('.hidden').forEach(el => el.classList.remove('hidden'));
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

// Inicialització
function attachSVGEvents() {
  new InteractiveSVG().init();
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.contenidor-svg svg')) {
    new InteractiveSVG().init();
  }
});
