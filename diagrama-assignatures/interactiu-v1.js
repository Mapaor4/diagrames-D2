class InteractiveSVG {
  // ___________________________________EL SEGÜENT FUNCIONA BÉ:____________________________________
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

  
  // _____________________________A PARTIR D'AQUÍ NO TANT:______________________________ 

  processarSVG() { // FALTA DETECTAR BÉ LES CONNEXIONS GERMANES!!!!!!!!!!!!!!!!!!!!!!1
    const svg = document.querySelector('.contenidor-svg svg');
    if (!svg) throw new Error('No es troba el SVG');

    svg.querySelectorAll('g').forEach(g => {
      g.classList.remove('diagram-node', 'diagram-connection', 'diagram-container');
    });

    svg.querySelectorAll('g').forEach(g => {
      const classeOriginal = Array.from(g.classList).find(c => this.esBase64Valid(c));
      if (!classeOriginal) return;

      const decodificat = this.decodificarBase64(classeOriginal);
      console.log("Element descodificat:", descodificat);

      /* LÒGICA A SEGUIR: 
      1. Si l'identificador té un punt '.' quedar-se amb la part de darrera l'últim punt
      2. Si aquesta última expressió comença per parèntesis -> és connexió
      3. Si no, és node.
      
      */
      
      if (decodificat.startsWith('(')) {  // EL PROBLEMA ESTÀ AQUÍ
        console.log("Connexio descodificada (TROBADA):", descodificat);
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
        console.log('Node registrat:', { classe: classeOriginal, decodificat });
      }
    });

    this.marcarContenidors();
  }

  parsejarConnexio(decodificat) { // SEMBLA FUNCIONAR. Tot i així més endavant provar amb noms raros amb parentesis, guions i comes com "Hola-bon(dia), no?"
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

  // _________________________________HI HA ALGUN PETIT ERROR. LES CONNEXIONS DE DESCENDENTS NO SEMPRE ES MOSTREN________________________
  // Nota: més endavant fer les dues versions d'aquesta funció: mostrant les connexions dels descendents i sense mostrar-les.
  obtenirConnexionsRelacionades(nodeDecodificat, options = {}) {
        const { includeDescendants = false } = options;
        const connexions = new Set();
        const nodesRelacionats = new Set();

        this.connexionsMap.forEach((info, classeConnexio) => {
            const elementConnexio = document.querySelector(`.${CSS.escape(classeConnexio)}`);
            if (!elementConnexio) return;

            // 1. Connexions directes del node
            const directe = info.startNode === nodeDecodificat || info.endNode === nodeDecodificat;

            // 2. Connexions de descendents (si s'habilita)
            const esDescendent = includeDescendants && (
                info.startNode.startsWith(`${nodeDecodificat}.`) || 
                info.endNode.startsWith(`${nodeDecodificat}.`)
            );

            // 3. Connexions internes entre fills del node
            const esConnexioInterna = !includeDescendants && 
                info.startNode.split('.')[0] === nodeDecodificat.split('.')[0] &&
                info.endNode.split('.')[0] === nodeDecodificat.split('.')[0];

            if (directe || esDescendent || esConnexioInterna) {
                connexions.add(elementConnexio);
                
                // Afegir nodes relacionats
                [info.startNode, info.endNode].forEach(nomNode => {
                    const classeNode = this.codificarBase64(nomNode);
                    const node = document.querySelector(`.${CSS.escape(classeNode)}`);
                    if (node) nodesRelacionats.add(node);
                });
            }
        });

        return { 
            connexions: Array.from(connexions), 
            nodesRelacionats: Array.from(nodesRelacionats) 
        };
    }

    resaltar(node) { // DIRIA QUE ESTÀ BÉ PERÒ POTSER S'HA DE CANVIAR ALGUNA COSA
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
        console.log('Elements visibles:', Array.from(elementsAMostrar)
            .map(el => this.decodificarBase64(Array.from(el.classList)[0])));
    }

  
  // ____________________TOT EL QUE QUEDA FUNCIONA PERFECTAMENT:______________________

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
