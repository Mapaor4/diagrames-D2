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
    
    processarSVG() { 
      const svg = document.querySelector('.contenidor-svg svg');
      if (!svg) throw new Error('No es troba el SVG');
  
      svg.querySelectorAll('g').forEach(g => { 
        g.classList.remove('diagram-node', 'diagram-connection', 'diagram-container');
      });
  
      svg.querySelectorAll('g').forEach(g => {
        const style = g.getAttribute('style');
        if (style && /opacity\s*:\s*0(\.0+)?\s*(;|$)/.test(style)) {
            return;
        }

        const classesToIgnore = ['invisible', 'ignore', 'background', 'llegenda', 'titol'];
        const hasIgnoredClass = Array.from(g.classList).some(cls => classesToIgnore.includes(cls));
        if (hasIgnoredClass) return;
          
        const classeOriginal = Array.from(g.classList).find(c => this.esBase64Valid(c));
        if (!classeOriginal) return;
  
        const decodificat = this.decodificarBase64(classeOriginal);
        
        if (decodificat.includes(".(")) {
            this.passarARutaAbsoluta(decodificat);
            const infoConnexio = this.parsejarConnexio(decodificat);
            g.classList.add('diagram-connection', 'internal-connection');
            this.connexionsMap.set(classeOriginal, infoConnexio);
        } else { 
            if(decodificat.startsWith('(')) {
                const infoConnexio = this.parsejarConnexio(decodificat);
                g.classList.add('diagram-connection');
                this.connexionsMap.set(classeOriginal, infoConnexio);
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
        }
      });
  
      this.marcarContenidors();
    }
  
    reiniciar() {
      document.querySelectorAll('.hidden').forEach(el => el.classList.remove('hidden'));
    }
  
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
        return btoa(encodeURIComponent(str));
    }
  }
  
  function attachSVGEvents() {
    new InteractiveSVG().init();
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.contenidor-svg svg')) {
      new InteractiveSVG().init();
    }
  });
