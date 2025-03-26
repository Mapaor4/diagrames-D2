function processSVG() {
    const containerMap = new Map();
    const containerDescendants = new Map();
    const ignoredClasses = new Set(["shape", "invisible", "semestre", "emplenar-fila"]);

    // Primer pas: analitzar i classificar els elements
    document.querySelectorAll(".contenidor-svg g").forEach(element => {
        const classList = element.classList;
        if (!classList || [...ignoredClasses].some(cls => classList.contains(cls))) return;

        const className = classList[0];
        if (!className) return;

        const decoded = atob(className);

        if (decoded.includes(".")) {
            const parts = decoded.split(".");
            for (let i = 1; i < parts.length; i++) {
                const parentID = parts.slice(0, i).join(".");
                const childID = parts.slice(0, i + 1).join(".");
                const encodedParentID = btoa(parentID);
                const encodedChildID = btoa(childID);

                if (!containerDescendants.has(encodedParentID)) {
                    containerDescendants.set(encodedParentID, new Set());
                }
                containerDescendants.get(encodedParentID).add(encodedChildID);
            }

            const parentID = parts[0];
            const encodedParentID = btoa(parentID);

            if (!containerMap.has(encodedParentID)) {
                containerMap.set(encodedParentID, { nodes: [], connections: [] });
            }

            const localName = parts.at(-1); // Nom curt: última part
            if (localName.startsWith("(")) {
                containerMap.get(encodedParentID).connections.push(className);
            } else {
                containerMap.get(encodedParentID).nodes.push(className);
            }
        }
    });

    // Segon pas: aplicar classes als nodes i connexions
    document.querySelectorAll(".contenidor-svg g").forEach(element => {
        const classList = element.classList;
        if (!classList || [...ignoredClasses].some(cls => classList.contains(cls))) return;

        const className = classList[0];
        if (!className) return;

        const decoded = atob(className);
        const localName = decoded.split(".").pop();

        if (localName.startsWith("(")) {
            element.classList.add("diagram-connection");
        } else {
            element.classList.add("diagram-node");
        }
    });

    // Tercer pas: aplicar la classe "diagram-container" als contenidors vàlids
    containerMap.forEach((data, encodedParentID) => {
        if (data.nodes.length > 0 || data.connections.length > 0) {
            const containerElement = document.querySelector(`.contenidor-svg g.${CSS.escape(encodedParentID)}`);
            if (containerElement) {
                containerElement.classList.add("diagram-container");
            }
        } else {
            // Si és un contenidor buit (sense nodes ni connexions), també li afegim la classe
            const containerElement = document.querySelector(`.contenidor-svg g.${CSS.escape(encodedParentID)}`);
            if (containerElement) {
                containerElement.classList.add("diagram-container");
            }
        }
    });
}
