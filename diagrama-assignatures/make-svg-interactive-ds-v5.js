class InteractiveSVG {
  constructor() {
    this.containerMap = new Map();
    this.parentMap = new Map();
    this.fullHierarchy = new Map();
    this.connexionsMap = new Map();
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
      
      if (decodificat.startsWith('(')) {
        const infoConnexio = this.parsejarConnexio(decodificat);
        if (infoConnexio) {
          this.connexionsMap.set(classeOriginal, infoConnexio);
          g.classList.add('diagram-connection');
        }
      } else {
        g.classList.add('diagram-node');
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

  parsejarConnexio(decodificat) {
    const regex = /^(?:([\w.]+)\.)?\((.*?)\s*([-<->]+)\s*(.*?)\)\[(\d+)\]$/;
    const match = decodificat.match(regex);
    
    if (!match) return null;
    
    const containerPath = match[1] || '';
    let startNode = match[2].trim();
    const tipus = match[3].trim().replace(/-/g, '');
    let endNode = match[4].trim();

    // Resoldre rutes relatives
    if (containerPath) {
      startNode = `${containerPath}.${startNode}`;
      endNode = `${containerPath}.${endNode}`;
    }

    return {
      startNode: startNode,
      tipus: tipus,
      endNode: endNode
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

    // 1. Element principal
    elementsAMostrar.add(node);

    // 2. Veïns directes
    const { veïns, connexions } = this.obtenirVeïnsIConnexions(classeOriginal, nodeDecodificat);
    veïns.forEach(v => elementsAMostrar.add(v));
    connexions.forEach(c => elementsAMostrar.add(c));

    // 3. Gestió de contenidors
    if (esContenidor) {
      const descendents = this.obtenirDescendents(classeOriginal);
      descendents.forEach(d => {
        const element = document.querySelector(`.${CSS.escape(d)}`);
        if (element) {
          elementsAMostrar.add(element);
          // Obtenir veïns dels descendents
          const { veïns: vDesc, connexions: cDesc } = 
            this.obtenirVeïnsIConnexions(d, this.decodificarBase64(d));
          vDesc.forEach(v => elementsAMostrar.add(v));
          cDesc.forEach(c => elementsAMostrar.add(c));
        }
      });
    }

    // 4. Aplicar canvis
    document.querySelectorAll('.diagram-node, .diagram-connection').forEach(el => {
      el.classList.toggle('hidden', !elementsAMostrar.has(el));
    });
  }

  obtenirVeïnsIConnexions(classeOriginal, nodeDecodificat) {
    const veïns = new Set();
    const connexions = new Set();
    
    this.connexionsMap.forEach((info, classeConnexio) => {
      const elementConnexio = document.querySelector(`.${CSS.escape(classeConnexio)}`);
      if (!elementConnexio) return;

      if (info.startNode === nodeDecodificat || info.endNode === nodeDecodificat) {
        connexions.add(elementConnexio);
        
        // Afegir nodes veïns
        const classeStart = this.codificarBase64(info.startNode);
        const classeEnd = this.codificarBase64(info.endNode);
        
        [classeStart, classeEnd].forEach(c => {
          const n = document.querySelector(`.${CSS.escape(c)}`);
          if (n) veïns.add(n);
        });
      }
    });

    return { 
      veïns: Array.from(veïns), 
      connexions: Array.from(connexions) 
    };
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
