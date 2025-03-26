// Opacity transition (global style)
var style = document.createElementNS("http://www.w3.org/2000/svg", "style");
style.textContent = `
    .hidden { opacity: 0.2; transition: opacity 0.3s; }
    .diagram-node, .diagram-connection { transition: opacity 0.3s; }
`;
document.currentScript.parentElement.appendChild(style);

// Make the SVG more readable (classes and IDs)
function processSVG() {
    document.querySelectorAll("g").forEach(element => {
        let className = element.getAttribute("class");
        if (!className || className === "shape" || className == "semestre" || className == "invisible") return; // ADD CLASSES YOU WANT TO IGNORE!!!!

        // Change base64 class to ID
        element.setAttribute("id", className);

        // If it starts with parentesis '(' it's a connection, if not it's probably a node
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

        // We check if our node is at the beggining or end of this current connection
        if (parsed.startNode === nodeId || parsed.endNode === nodeId) {
            visibleConnections.add(connectionId);
            connectionTypes.add(parsed.connectionType);
            // If it is present, it means the other node is a neighbor
            neighbors.add(parsed.startNode);
            neighbors.add(parsed.endNode);
            // Note: with this we'll have our node also present in the nighbor set. That is actually good, because it simplifies the visibilty condition.
        }
    });
    console.log("Selected node:", nodeId, " | ", "Neighbors:", neighbors, " | ", "Connection types:", connectionTypes);

    document.querySelectorAll(".diagram-node").forEach(node => {
        const id = node.getAttribute("id");
        if (!neighbors.has(id)) {
            node.classList.add("hidden"); // If it's not a neighbor, it must be hidden.
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
    // We extract from the encoded base64 Connection ID the main 3 important things:
    // 1. Initial node 2. Final node 3. Connection type
    // Later on for cases with more arrows between the same nodes. This needs to be changed to store the number of the arrow as well.
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

document.addEventListener("DOMContentLoaded", () => {
    processSVG();
    document.querySelectorAll(".diagram-node").forEach(node => {
        // Check if a node is hovered over
        node.addEventListener("mouseover", function() { highlightNode(this.id); });
        node.addEventListener("mouseout", function() { resetHighlight(); });
    });
});