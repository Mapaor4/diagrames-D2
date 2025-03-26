function attachSVGEvents() {
    var style = document.createElementNS("http://www.w3.org/2000/svg", "style");
    style.textContent = `
        .hidden { opacity: 0.2; transition: opacity 0.3s; }
        .diagram-node, .diagram-connection { transition: opacity 0.3s; }
    `;
    document.querySelector(".contenidor-svg svg").appendChild(style);

    // Processem l’SVG per assignar classes correctes
    processSVG();

    // Assignem els events hover als nodes de l’SVG
    document.querySelectorAll(".diagram-node, .diagram-container").forEach(node => {
        node.addEventListener("mouseover", function() {
            highlightNode(this.classList[0]);
        });
        node.addEventListener("mouseout", function() {
            resetHighlight();
        });
    });
}

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
        }
    });
}




function collectAllDescendants(containerID, descendants = new Set()) {
    const direct = window.containerDescendants?.get(containerID);
    if (!direct) return descendants;

    for (let child of direct) {
        if (!descendants.has(child)) {
            descendants.add(child);
            collectAllDescendants(child, descendants);
        }
    }
    return descendants;
}

function highlightNode(nodeClass) {
    let neighbors = new Set([nodeClass]);
    let visibleConnections = new Set();
    let connectionTypes = new Set();

    const allRelevantContainers = collectAllDescendants(nodeClass);
    allRelevantContainers.add(nodeClass); // Incloure el contenidor arrel també

    for (let containerID of allRelevantContainers) {
        const container = window.diagramContainers?.get(containerID);
        if (container) {
            container.nodes.forEach(n => neighbors.add(n));
            container.connections.forEach(c => visibleConnections.add(c));
        }
    }

    document.querySelectorAll(".diagram-connection").forEach(connection => {
        let connectionClass = connection.classList[0];
        let parsed = parseConnectionID(connectionClass);
        if (!parsed) return;

        if (
            parsed.startNode === nodeClass ||
            parsed.endNode === nodeClass ||
            neighbors.has(parsed.startNode) ||
            neighbors.has(parsed.endNode)
        ) {
            visibleConnections.add(connectionClass);
            connectionTypes.add(parsed.connectionType);
            neighbors.add(parsed.startNode);
            neighbors.add(parsed.endNode);
        }
    });

    document.querySelectorAll(".diagram-node, .diagram-container").forEach(node => {
        const className = node.classList[0];
        if (!neighbors.has(className)) {
            node.classList.add("hidden");
        } else {
            node.classList.remove("hidden");
        }
    });

    document.querySelectorAll(".diagram-connection").forEach(connection => {
        const className = connection.classList[0];
        if (!visibleConnections.has(className)) {
            connection.classList.add("hidden");
        } else {
            connection.classList.remove("hidden");
        }
    });
}

function resetHighlight() {
    document.querySelectorAll(".diagram-node, .diagram-connection, .diagram-container").forEach(element => {
        element.classList.remove("hidden");
    });
}

function parseConnectionID(base64ID) {
    try {
        const decodedID = atob(base64ID);
        const match = decodedID.match(/^\((.*?)\)\[\d+\]$/);
        if (!match) return null;

        const connectionMatch = match[1].match(/(.+?) (.+?) (.+)/);
        if (!connectionMatch) return null;

        const startNode = connectionMatch[1];
        const connectionType = connectionMatch[2];
        const endNode = connectionMatch[3];

        return {
            startNode: btoa(startNode),
            endNode: btoa(endNode),
            connectionType: connectionType
        };
    } catch (e) {
        return null;
    }
}
