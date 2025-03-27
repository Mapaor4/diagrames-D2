class InteractiveSVG {

  // ______________________________________________TOT AIXÒ ESTÀ BÉ_______________________________________________
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

    // Netejar classes existents
    svg.querySelectorAll('g').forEach(g => {
        g.classList.remove('diagram-node', 'diagram-connection', 'diagram-container');
    });

    // Processar cada element
    svg.querySelectorAll('g').forEach(g => {
        const classeOriginal = Array.from(g.classList).find(c => this.esBase64Valid(c));
        if (!classeOriginal) return;

        const decodificat = this.decodificarBase64(classeOriginal);
        console.log("Processant:", decodificat);

        // LÒGICA CLAU: Detectar connexions pel DARRER segment
        const parts = decodificat.split('.');
        const ultimSegment = parts[parts.length - 1];
        const esConnexio = ultimSegment.startsWith('('); 

        if (esConnexio) {
            console.log("✅ És connexió:", decodificat);
            const info = this.parsejarConnexio(decodificat);
            if (info) {
                this.connexionsMap.set(classeOriginal, info);
                g.classList.add('diagram-connection');
            } else {
                console.warn("⚠️ No s'ha pogut parsejar:", decodificat);
                g.classList.add('diagram-node'); // Fallback
            }
        } else {
            console.log("🔵 És node:", decodificat);
            g.classList.add('diagram-node');
            // Registrar jerarquia
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
    // Regex optimitzat per tots els casos
    const regex = /^(?:([\w.]+)\.)?\(([\w-]+)\s*([-><]+|&gt;)\s*([\w-]+)\)\[\d+\]$/;
    const match = decodificat.match(regex);

    if (!match) {
        console.error("❌ Format de connexió invàlid:", decodificat);
        return null;
    }

    const contenidor = match[1] || '';
    const start = match[2].trim();
    const tipus = match[3].replace(/&gt;/g, '>');
    const end = match[4].trim();

    // Generar rutes absolutes
    const startNode = contenidor ? `${contenidor}.${start}` : start;
    const endNode = contenidor ? `${contenidor}.${end}` : end;

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

  // ____________________________________________________-AIXO NO ACABA D'ESTAR BÉ________________________________________________________


  obtenirConnexionsRelacionades(nodeDecodificat) {
    const connexions = new Set();
    const nodesRelacionats = new Set();
    const parts = nodeDecodificat.split('.');
    const contenidorPare = parts.length > 1 ? parts.slice(0, -1).join('.') : nodeDecodificat;

    console.log(`\nAnalitzant node: ${nodeDecodificat}`); // DEBUG
    console.log(`Contenidor pare: ${contenidorPare}`); // DEBUG

    this.connexionsMap.forEach((info, classeConnexio) => {
        const elementConnexio = document.querySelector(`.${CSS.escape(classeConnexio)}`);
        if (!elementConnexio) return;

        const startContainer = info.startNode.split('.').slice(0, -1).join('.');
        const endContainer = info.endNode.split('.').slice(0, -1).join('.');
        const esGermana = startContainer === endContainer && startContainer === contenidorPare;

        console.log(`Connexió: ${info.startNode} -> ${info.endNode}`, { // DEBUG
            startContainer,
            endContainer,
            esGermana,
            contenidorPare
        });

        const directe = info.startNode === nodeDecodificat || info.endNode === nodeDecodificat;
        const esContenidor = info.startNode.startsWith(`${nodeDecodificat}.`) && 
                           info.endNode.startsWith(`${nodeDecodificat}.`);

        if (directe || esGermana || esContenidor) {
            connexions.add(elementConnexio);
            
            [info.startNode, info.endNode].forEach(nomNode => {
                const classeNode = this.codificarBase64(nomNode);
                const node = document.querySelector(`.${CSS.escape(classeNode)}`);
                if (node) {
                    nodesRelacionats.add(node);
                }
            });
        }
    });

    return { 
        connexions: Array.from(connexions), 
        nodesRelacionats: Array.from(nodesRelacionats) 
    };
}

    resaltar(node) {
        const classeOriginal = Array.from(node.classList).find(c => this.esBase64Valid(c));
        if (!classeOriginal) return;

        const nodeDecodificat = this.decodificarBase64(classeOriginal);
        const elementsAMostrar = new Set([node]);
        const esContenidor = node.classList.contains('diagram-container');

        // 1. Obtenir connexions directes
        const { connexions, nodesRelacionats } = this.obtenirConnexionsRelacionades(nodeDecodificat);
        connexions.forEach(c => elementsAMostrar.add(c));
        nodesRelacionats.forEach(n => elementsAMostrar.add(n));

        // 2. Si és contenidor:
        if (esContenidor) {
            // a) Afegir TOTS els descendents
            const descendents = this.obtenirDescendents(classeOriginal);
            descendents.forEach(d => {
                const element = document.querySelector(`.${CSS.escape(d)}`);
                if (element) elementsAMostrar.add(element);
            });

            // b) Obtenir connexions de tota la jerarquia
            const { connexions: connexionsJerarquia } = 
                this.obtenirConnexionsRelacionades(nodeDecodificat, { includeDescendants: true });
            connexionsJerarquia.forEach(c => elementsAMostrar.add(c));
        }

        // 3. Aplicar canvis
        document.querySelectorAll('.diagram-node, .diagram-connection').forEach(el => {
            el.classList.toggle('hidden', !elementsAMostrar.has(el));
        });

        // DEBUG
        // console.log('Elements visibles:', Array.from(elementsAMostrar)
        //     .map(el => this.decodificarBase64(Array.from(el.classList)[0])));
    }

  // __________________________________________EL QUE VE A CONTINUACIÓ ESTÀ BASTANT BÉ DIRIA____________________________________
  
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
    console.log("Element codificat:", str);
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
