class InteractiveSVG {
  constructor() {
    this.containerMap = new Map();
    this.parentMap = new Map();
    this.fullHierarchy = new Map();
    this.connexionsMap = new Map();
    this.nodeConnexions = new Map();
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

    // Processar nodes i connexions
    svg.querySelectorAll('g').forEach(g => {
      const classeOriginal = Array.from(g.classList).find(c => this.esBase64Valid(c));
      if (!classeOriginal) return;

      const decodificat = this.decodificarBase64(classeOriginal);
      const esConnexio = decodificat.startsWith('(');

      // Assignar classe bàsica
      g.classList.add(esConnexio ? 'diagram-connection' : 'diagram-node');

      if (esConnexio) {
        this.processarConnexio(g, classeOriginal, decodificat);
      } else {
        this.processarNode(g, classeOriginal, decodificat);
      }
    });

    // Marcar contenidors
    this.marcarContenidors();
  }

  processarNode(g, classeOriginal, decodificat) {
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

  processarConnexio(g, classeOriginal, decodificat) {
    const infoConnexio = this.parsejarConnexio(decodificat);
    if (!infoConnexio) return;

    this.connexionsMap.set(classeOriginal, infoConnexio);
    
    // Registrar connexions pels nodes
    const startClass = this.codificarBase64(infoConnexio.start);
    const endClass = this.codificarBase64(infoConnexio.end);
    
    [startClass, endClass].forEach(nodeClass => {
      if (!this.nodeConnexions.has(nodeClass)) {
        this.nodeConnexions.set(nodeClass, []);
      }
      this.nodeConnexions.get(nodeClass).push(classeOriginal);
    });
  }

  marcarContenidors() {
    this.containerMap.forEach((fills, classePare) => {
      const elementPare = document.querySelector(`.${CSS.escape(classePare)}`);
      if (elementPare && elementPare.classList.contains('diagram-node')) {
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

    const elementsAMostrar = new Set();
    elementsAMostrar.add(node);

    const esContenidor = node.classList.contains('diagram-container');
    const nodeDecodificat = this.decodificarBase64(classeOriginal);

    // Gestió de connexions i veïns
    if (!esContenidor) {
      // Node normal: mostrar connexions directes i veïns
      const connexions = this.nodeConnexions.get(classeOriginal) || [];
      
      connexions.forEach(connexioClasse => {
        const connexio = document.querySelector(`.${CSS.escape(connexioClasse)}`);
        if (connexio) {
          elementsAMostrar.add(connexio);
          
          // Afegir node veí
          const info = this.connexionsMap.get(connexioClasse);
          if (info) {
            const altreNode = info.start === nodeDecodificat ? info.end : info.start;
            const altreNodeClass = this.codificarBase64(altreNode);
            const altreElement = document.querySelector(`.${CSS.escape(altreNodeClass)}`);
            if (altreElement) elementsAMostrar.add(altreElement);
          }
        }
      });
    } else {
      // Contenidor: mostrar tota la descendència i connexions internes
      const descendents = this.obtenirDescendents(classeOriginal);
      descendents.forEach(d => {
        const element = document.querySelector(`.${CSS.escape(d)}`);
        if (element) {
          elementsAMostrar.add(element);
          
          // Afegir connexions dels fills
          const connexionsFill = this.nodeConnexions.get(d) || [];
          connexionsFill.forEach(c => {
            const connexio = document.querySelector(`.${CSS.escape(c)}`);
            if (connexio) elementsAMostrar.add(connexio);
          });
        }
      });
    }

    // Aplicar canvis visuals
    document.querySelectorAll('.diagram-node, .diagram-connection').forEach(el => {
      el.classList.toggle('hidden', !elementsAMostrar.has(el));
    });
  }

  reiniciar() {
    document.querySelectorAll('.hidden').forEach(el => el.classList.remove('hidden'));
  }

  parsejarConnexio(decodificat) {
    const regex = /\(([\w.]+)\s*([<-][->]|--)\s*([\w.]+)\)/;
    const match = decodificat.match(regex);
    if (!match) return null;

    return {
      start: match[1],
      type: match[2],
      end: match[3]
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
    
    return descendents;
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

// Inicialització per si falla la crida manual
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.contenidor-svg svg')) {
    new InteractiveSVG().init();
  }
});
