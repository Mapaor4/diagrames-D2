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
        console.log('Elements visibles:', Array.from(elementsAMostrar)
            .map(el => this.decodificarBase64(Array.from(el.classList)[0])));
    }
