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
    document.querySelectorAll(".diagram-node").forEach(node => {
        node.addEventListener("mouseover", function() {
            highlightNode(this.classList[0]); // Primer valor de classList és l'identificador en base64
        });
        node.addEventListener("mouseout", function() {
            resetHighlight();
        });
    });
}

function processSVG() {
    document.querySelectorAll(".contenidor-svg g").forEach(element => {
        let className = element.getAttribute("class");
        if (!className || className === "shape" || className == "semestre" || className == "invisible") return;

        const validPrefixes = ["KA", "KB", "KC", "KD", "KE", "KF", "KG", "KH", "KI", "KJ", "KK", "KL", "KM", "KN", "KO", "KP"];
        if (validPrefixes.some(prefix => className.startsWith(prefix))) {
            element.classList.add("diagram-connection");
        } else {
            element.classList.add("diagram-node");
        }
    });
}

function highlightNode(nodeClass) {
    let neighbors = new Set([nodeClass]);
    let visibleConnections = new Set();
    let connectionTypes = new Set();

    document.querySelectorAll(".diagram-connection").forEach(connection => {
        let connectionClass = connection.classList[0]; // Primer valor = identificador únic
        let parsed = parseConnectionID(connectionClass);
        if (!parsed) return;

        if (parsed.startNode === nodeClass || parsed.endNode === nodeClass) {
            visibleConnections.add(connectionClass);
            connectionTypes.add(parsed.connectionType);
            neighbors.add(parsed.startNode);
            neighbors.add(parsed.endNode);
        }
    });

    document.querySelectorAll(".diagram-node").forEach(node => {
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
