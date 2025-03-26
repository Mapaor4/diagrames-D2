function attachSVGEvents() {
    var style = document.createElementNS("http://www.w3.org/2000/svg", "style");
    style.textContent = `
        .hidden { opacity: 0.2; transition: opacity 0.3s; }
        .diagram-node, .diagram-connection { transition: opacity 0.3s; }
    `;
    document.querySelector(".contenidor-svg svg").appendChild(style);

    processSVG();

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
    const parentMap = new Map();
    
    document.querySelectorAll(".contenidor-svg g").forEach(element => {
        let classList = element.classList;
        if (!classList || classList.length === 0) return;
        
        const className = classList[0];
        if (!className) return;
        
        if (!isValidBase64(className)) {
            console.warn(`Classe ignorada (no és base64 vàlid): ${className}`);
            return;
        }
        
        let decoded;
        try {
            decoded = atob(className);
        } catch (error) {
            console.error(`Error descodificant ${className}:`, error);
            return;
        }
        
        let shortName = decoded.includes(".") ? decoded.split(".").pop() : decoded;
        let encodedShortName = btoa(shortName);
        
        let parentName = getParent(decoded);
        if (parentName) {
            let encodedParentName = btoa(parentName);
            parentMap.set(encodedShortName, encodedParentName);
            if (!containerMap.has(encodedParentName)) {
                containerMap.set(encodedParentName, { nodes: [], connections: [] });
            }
            if (decoded.startsWith("(")) {
                containerMap.get(encodedParentName).connections.push(encodedShortName);
            } else {
                containerMap.get(encodedParentName).nodes.push(encodedShortName);
            }
        }

        if (decoded.startsWith("(")) {
            element.classList.add("diagram-connection");
        } else {
            element.classList.add("diagram-node");
        }

        console.log(`Element processat: ${decoded}, Assignat com: ${element.classList.contains("diagram-connection") ? "Connexió" : "Node"}`);
    });
    
    containerMap.forEach((_, containerID) => {
        const containerElement = document.querySelector(`.contenidor-svg g.${CSS.escape(containerID)}`);
        if (!containerElement) return;
        containerElement.classList.add("diagram-container");
    });
    
    window.diagramContainers = containerMap;
    window.parentMap = parentMap;
}

function highlightNode(nodeClass) {
    let neighbors = new Set([nodeClass]);
    let visibleConnections = new Set();
    let connectionTypes = new Set();
    
    function addChildrenRecursively(parentClass) {
        const container = window.diagramContainers?.get(parentClass);
        if (!container) return;
        
        container.nodes.forEach(n => {
            if (!neighbors.has(n)) {
                neighbors.add(n);
                addChildrenRecursively(n);
            }
        });
        container.connections.forEach(c => visibleConnections.add(c));
    }
    
    addChildrenRecursively(nodeClass);
    
    let currentNode = nodeClass;
    while (window.parentMap.has(currentNode)) {
        currentNode = window.parentMap.get(currentNode);
        neighbors.add(currentNode);
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

        return {
            startNode: btoa(connectionMatch[1]),
            endNode: btoa(connectionMatch[3]),
            connectionType: connectionMatch[2]
        };
    } catch (e) {
        return null;
    }
}

function getParent(decodedID) {
    if (!decodedID.includes(".")) return null;
    return decodedID.split(".").slice(0, -1).join(".");
}

function isValidBase64(str) {
    try {
        return btoa(atob(str)) === str;
    } catch (e) {
        return false;
    }
}
