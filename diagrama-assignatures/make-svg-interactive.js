function attachSVGEvents() {
    // Afegim els estils dins l’SVG
    var style = document.createElementNS("http://www.w3.org/2000/svg", "style");
    style.textContent = `
        .hidden { opacity: 0.2; transition: opacity 0.3s; }
        .diagram-node, .diagram-connection { transition: opacity 0.3s; }
    `;
    document.querySelector(".contenidor-svg svg").appendChild(style);

    // Processem l’SVG per assignar classes i IDs correctes
    processSVG();

    // Assignem els events hover als nodes de l’SVG
    document.querySelectorAll(".diagram-node").forEach(node => {
        node.addEventListener("mouseover", function() { highlightNode(this.id); });
        node.addEventListener("mouseout", function() { resetHighlight(); });
    });
}

function processSVG() {
    document.querySelectorAll(".contenidor-svg g").forEach(element => {
        let className = element.getAttribute("class");
        if (!className || className === "shape" || className == "semestre" || className == "invisible") return;

        element.setAttribute("id", className);

        const validPrefixes = ["KA", "KB", "KC", "KD", "KE", "KF", "KG", "KH", "KI", "KJ", "KK", "KL", "KM", "KN", "KO", "KP"];
        if (validPrefixes.some(prefix => className.startsWith(prefix))) {
            element.setAttribute("class", "diagram-connection");
        } else {
            element.setAttribute("class", "diagram-node");
        }
    });
}

function highlightNode(nodeId) {
    let neighbors = new Set([nodeId]);
    let visibleConnections = new Set();
    let connectionTypes = new Set();

    document.querySelectorAll(".diagram-connection").forEach(connection => {
        let connectionId = connection.getAttribute("id");
        let parsed = parseConnectionID(connectionId);
        if (!parsed) return;

        if (parsed.startNode === nodeId || parsed.endNode === nodeId) {
            visibleConnections.add(connectionId);
            connectionTypes.add(parsed.connectionType);
            neighbors.add(parsed.startNode);
            neighbors.add(parsed.endNode);
        }
    });

    document.querySelectorAll(".diagram-node").forEach(node => {
        const id = node.getAttribute("id");
        if (!neighbors.has(id)) {
            node.classList.add("hidden");
        } else {
            node.classList.remove("hidden");
        }
    });

    document.querySelectorAll(".diagram-connection").forEach(connection => {
        const id = connection.getAttribute("id");
        if (!visibleConnections.has(id)) {
            connection.classList.add("hidden");
        } else {
            connection.classList.remove("hidden");
        }
    });
}

function resetHighlight() {
    document.querySelectorAll(".diagram-node, .diagram-connection").forEach(element => {
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
