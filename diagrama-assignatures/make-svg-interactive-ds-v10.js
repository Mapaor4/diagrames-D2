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

    svg.querySelectorAll('g').forEach(g => {
      g.classList.remove('diagram-node', 'diagram-connection', 'diagram-container');
    });

    svg.querySelectorAll('g').forEach(g => {
      const classeOriginal = Array.from(g.classList).find(c => this.esBase64Valid(c));
      if (!classeOriginal) return;

      const decodificat = this.decodificarBase64(classeOriginal);
      
      if (decodificat.startsWith('(')) {
        const infoConnexio = this.parsejarConnexio(decodificat);
        if (infoConnexio) {
          this.connexionsMap.set(classeOriginal, infoConnexio);
          g.classList.add('diagram-connection');
          console.log('Connexió registrada:', infoConnexio);
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
        console.log('Node registrat:', { classe: classeOriginal, decodificat });
      }
    });

    this.marcarContenidors();
  }

  parsejarConnexio(decodificat) {
    const regex = /^(?:([\w.-]+)\.)?\(([\w.-]+)\s*(-(&gt;|>)|<(-|&gt;|>))\s*([\w.-]+)\)\[(\d+)\]$/;
    const match = decodificat.match(regex);
    
    if (!match) {
        console.warn('Connexió no reconeguda:', decodificat);
        return null;
    }

    const containerPath = match[1] || '';
    const tipus = match[3].replace(/&gt;/g, '>');

    // Funció per resoldre rutes absolutes
    const resoldreRutaAbsoluta = (node, container) => {
        // Si el node ja té un path absolut (conté punt), el deixem tal qual
        if (node.includes('.')) return node;
        
        // Si estem en un contenidor, afegim el seu path
        return container ? `${container}.${node}` : node;
    };

    const startNode = resoldreRutaAbsoluta(match[2].trim(), containerPath);
    const endNode = resoldreRutaAbsoluta(match[6].trim(), containerPath);

    // Debug per connexions internes
    if (containerPath) {
        console.log(`Connexió interna processada:`, {
            original: decodificat,
            start: startNode,
            end: endNode,
            container: containerPath
        });
    }

    return { startNode, tipus, endNode };
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

    const nodeDecodificat = this.decodificarBase64(classeOriginal);
    const elementsAMostrar = new Set([node]);
    console.group(`Resaltant: ${nodeDecodificat}`);

    // Obtenir connexions directes
    const { connexions, nodesRelacionats } = this.obtenirConnexionsRelacionades(nodeDecodificat);
    console.log('Connexions trobades:', connexions.map(c => this.decodificarBase64(c.classList[0])));
    console.log('Nodes relacionats:', nodesRelacionats.map(n => this.decodificarBase64(n.classList[0])));

    connexions.forEach(c => elementsAMostrar.add(c));
    nodesRelacionats.forEach(n => elementsAMostrar.add(n));

    // Gestió de contenidors
    if (node.classList.contains('diagram-container')) {
      const descendents = this.obtenirDescendents(classeOriginal);
      console.log('Descendents:', descendents.map(d => this.decodificarBase64(d)));
      
      descendents.forEach(d => {
        const element = document.querySelector(`.${CSS.escape(d)}`);
        if (element) {
          elementsAMostrar.add(element);
          const decodificatFill = this.decodificarBase64(d);
          const { connexions: c, nodesRelacionats: n } = this.obtenirConnexionsRelacionades(decodificatFill);
          c.forEach(con => elementsAMostrar.add(con));
          n.forEach(nd => elementsAMostrar.add(nd));
        }
      });
    }

    // Aplicar canvis
    document.querySelectorAll('.diagram-node, .diagram-connection').forEach(el => {
      const visible = elementsAMostrar.has(el);
      el.classList.toggle('hidden', !visible);
      if (visible) console.log('Mostrant:', this.decodificarBase64(el.classList[0]));
    });

    console.groupEnd();
  }

  obtenirConnexionsRelacionades(nodeDecodificat) {
    const connexions = new Set();
    const nodesRelacionats = new Set();

    // Obtenim el camí base del node actual (sense el nom final)
    const parts = nodeDecodificat.split('.');
    const basePath = parts.length > 1 ? parts.slice(0, -1).join('.') : null;

    this.connexionsMap.forEach((info, classeConnexio) => {
        const elementConnexio = document.querySelector(`.${CSS.escape(classeConnexio)}`);
        if (!elementConnexio) return;

        // Debug: Mostrem la connexió que s'està avaluant
        console.log(`Analitzant connexió: ${info.startNode} -> ${info.endNode}`, {
            nodeActual: nodeDecodificat,
            basePath
        });

        // Cas 1: Connexió directa al node
        const esDirecte = info.startNode === nodeDecodificat || info.endNode === nodeDecodificat;
        
        // Cas 2: Node és pare d'algun extrem
        const esPare = info.startNode.startsWith(`${nodeDecodificat}.`) || 
                      info.endNode.startsWith(`${nodeDecodificat}.`);
        
        // Cas 3: Connexió entre germans (mateix path base)
        const startBase = info.startNode.split('.').slice(0, -1).join('.');
        const endBase = info.endNode.split('.').slice(0, -1).join('.');
        const esGerma = basePath && (startBase === basePath || endBase === basePath);

        if (esDirecte || esPare || esGerma) {
            console.log(`Connexió RELLEVANT trobada: ${info.startNode} -> ${info.endNode}`, {
                tipus: esDirecte ? 'Directa' : esPare ? 'Pare-Fill' : 'Germans',
                nodeBase: basePath,
                startBase,
                endBase
            });

            connexions.add(elementConnexio);
            
            // Afegim tots dos nodes de la connexió
            [info.startNode, info.endNode].forEach(nomNode => {
                const classeNode = this.codificarBase64(nomNode);
                const node = document.querySelector(`.${CSS.escape(classeNode)}`);
                if (node) {
                    nodesRelacionats.add(node);
                    console.log(`Afegit node relacionat: ${nomNode}`);
                }
            });
        }
    });

    console.log(`RESUM CONNEXIONS per ${nodeDecodificat}:`, {
        connexions: Array.from(connexions).map(c => this.decodificarBase64(Array.from(c.classList)[0])),
        nodesRelacionats: Array.from(nodesRelacionats).map(n => this.decodificarBase64(Array.from(n.classList)[0]))
    });

    return { 
        connexions: Array.from(connexions), 
        nodesRelacionats: Array.from(nodesRelacionats) 
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
