function attachSVGEvents() {
    const svgContainer = document.querySelector(".contenidor-svg svg");
    if (!svgContainer) return; // Evitem errors si no hi ha SVG

    if (!svgContainer.querySelector("style")) {
        let style = document.createElementNS("http://www.w3.org/2000/svg", "style");
        style.textContent = `
            .hidden { opacity: 0.2; transition: opacity 0.3s; }
            .diagram-node, .diagram-connection { transition: opacity 0.3s; }
        `;
        svgContainer.appendChild(style);
    }

    processSVG();

    document.querySelectorAll(".diagram-node, .diagram-container").forEach(node => {
        node.addEventListener("mouseover", function() {
            if (this.classList.length > 0) highlightNode(this.classList[0]);
        });
        node.addEventListener("mouseout", function() {
            resetHighlight();
        });
    });
}

function processSVG() {
    const containerMap = new Map();
    const ignoredClasses = new Set(["shape", "invisible", "semestre", "emplenar-fila"]);

    document.querySelectorAll(".contenidor-svg g").forEach(element => {
        let classList = element.classList;
        if (!classList || [...ignoredClasses].some(cls => classList.contains(cls))) return;

        const className = classList[0];
        if (!className) return;

        const decoded = safeAtob(className);
        if (!decoded) return;

        if (decoded.includes(".")) {
            const parentID = decoded.split(".")[0];
            const encodedParentID = btoa(parentID);

            if (!containerMap.has(encodedParentID)) {
                containerMap.set(encodedParentID, { nodes: [], connections: [] });
            }

            if (decoded.startsWith("(")) {
                containerMap.get(encodedParentID).connections.push(className);
            } else {
                containerMap.get(encodedParentID).nodes.push(className);
            }
        }

        const validPrefixes = ["KA", "KB", "KC", "KD", "KE", "KF", "KG", "KH", "KI", "KJ", "KK", "KL", "KM", "KN", "KO", "KP"];
        if (validPrefixes.some(prefix => className.startsWith(prefix))) {
            element.classList.add("diagram-connection");
        } else {
            element.classList.add("diagram-node");
        }
    });

    containerMap.forEach((_, containerID) => {
        if (!containerID) return; // Evitem errors amb containerID indefinit
        const containerElement = document.querySelector(`.contenidor-svg g.${CSS.escape(containerID)}`);
        if (!containerElement || [...ignoredClasses].some(cls => containerElement.classList.contains(cls))) return;

        containerElement.classList.add("diagram-container");
    });

    window.diagramContainers = containerMap;
}

function highlightNode(nodeClass) {
    if (!nodeClass) return;

    let neighbors = new Set([nodeClass]);
    let visibleConnections = new Set();
    let connectionTypes = new Set();

    const container = window.diagramContainers?.get(nodeClass);
    if (container) {
        container.nodes.forEach(n => neighbors.add(n));
        container.connections.forEach(c => visibleConnections.add(c));
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
        if (!neighbors.has(node.classList[0])) {
            node.classList.add("hidden");
        } else {
            node.classList.remove("hidden");
        }
    });

    document.querySelectorAll(".diagram-connection").forEach(connection => {
        if (!visibleConnections.has(connection.classList[0])) {
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
    if (!base64ID) return null;

    const decodedID = safeAtob(base64ID);
    if (!decodedID) return null;

    const match = decodedID.match(/^\((.*?)\)\[\d+\]$/);
    if (!match) return null;

    const connectionMatch = match[1].match(/(.+?) (.+?) (.+)/);
    if (!connectionMatch) return null;

    return {
        startNode: btoa(connectionMatch[1]),
        endNode: btoa(connectionMatch[3]),
        connectionType: connectionMatch[2]
    };
}

function safeAtob(str) {
    try {
        return atob(str);
    } catch (e) {
        return null;
    }
}
