class InteractiveSVG {
  constructor() {
    this.containerMap = new Map();
    this.parentMap = new Map();
    this.initialized = false;
  }

  init() {
    try {
      this.addStyles();
      this.processSVG();
      this.attachEventListeners();
      this.initialized = true;
      console.log('Interactive SVG initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Interactive SVG:', error);
      this.cleanup();
    }
  }

  cleanup() {
    document.querySelectorAll('.diagram-node, .diagram-container').forEach(node => {
      node.removeEventListener('mouseover', this.handleMouseOver);
      node.removeEventListener('mouseout', this.handleMouseOut);
    });
    this.containerMap.clear();
    this.parentMap.clear();
    this.initialized = false;
  }

  addStyles() {
    const styleId = 'interactive-svg-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .interactive-svg-hidden { 
        opacity: 0.2; 
        transition: opacity 0.3s ease; 
      }
      .interactive-svg-node, 
      .interactive-svg-container, 
      .interactive-svg-connection { 
        transition: opacity 0.3s ease; 
      }
    `;
    document.head.appendChild(style);
  }

  processSVG() {
    const svgContainer = document.querySelector('.contenidor-svg');
    if (!svgContainer) {
      throw new Error('SVG container not found');
    }

    const elements = svgContainer.querySelectorAll('g');
    if (elements.length === 0) {
      console.warn('No SVG groups found for processing');
      return;
    }

    elements.forEach(element => {
      if (!element.classList || element.classList.length === 0) return;

      // Use the first valid class that matches our criteria
      let className = Array.from(element.classList).find(cls => 
        cls && this.isValidIdentifier(cls)
      );
      if (!className) return;

      let decoded;
      try {
        decoded = this.decodeIdentifier(className);
      } catch (error) {
        console.warn(`Skipping element with invalid identifier ${className}:`, error);
        return;
      }

      const elementType = decoded.startsWith('(') ? 'connection' : 'node';
      const shortName = this.getShortName(decoded);
      const parentName = this.getParentName(decoded);

      if (elementType === 'connection') {
        element.classList.add('interactive-svg-connection');
        this.processConnection(className, decoded);
      } else {
        element.classList.add('interactive-svg-node');
        this.processNode(className, shortName, parentName);
      }
    });

    this.markContainers();
  }

  processConnection(className, decoded) {
    try {
      const parsed = this.parseConnectionID(className);
      if (!parsed) return;

      // Store connection endpoints for quick lookup during highlighting
      if (!this.containerMap.has(parsed.startNode)) {
        this.containerMap.set(parsed.startNode, { nodes: [], connections: [] });
      }
      if (!this.containerMap.has(parsed.endNode)) {
        this.containerMap.set(parsed.endNode, { nodes: [], connections: [] });
      }

      this.containerMap.get(parsed.startNode).connections.push(className);
      this.containerMap.get(parsed.endNode).connections.push(className);
    } catch (error) {
      console.error(`Error processing connection ${className}:`, error);
    }
  }

  processNode(className, shortName, parentName) {
    if (parentName) {
      const encodedParentName = this.encodeIdentifier(parentName);
      this.parentMap.set(shortName, encodedParentName);

      if (!this.containerMap.has(encodedParentName)) {
        this.containerMap.set(encodedParentName, { nodes: [], connections: [] });
      }
      this.containerMap.get(encodedParentName).nodes.push(shortName);
    }
  }

  markContainers() {
    this.containerMap.forEach((_, containerID) => {
      const containerElement = document.querySelector(`.contenidor-svg g.${CSS.escape(containerID)}`);
      if (containerElement) {
        containerElement.classList.add('interactive-svg-container');
      }
    });
  }

  attachEventListeners() {
    this.handleMouseOver = this.handleMouseOver.bind(this);
    this.handleMouseOut = this.handleMouseOut.bind(this);

    document.querySelectorAll('.interactive-svg-node, .interactive-svg-container').forEach(node => {
      node.addEventListener('mouseover', this.handleMouseOver);
      node.addEventListener('mouseout', this.handleMouseOut);
      node.addEventListener('touchstart', this.handleMouseOver, { passive: true });
    });
  }

  handleMouseOver(event) {
    if (!this.initialized) return;
    const target = event.currentTarget;
    const className = Array.from(target.classList).find(cls => 
      cls && this.isValidIdentifier(cls)
    );
    if (className) {
      this.highlightNode(className);
    }
  }

  handleMouseOut() {
    if (!this.initialized) return;
    this.resetHighlight();
  }

  highlightNode(nodeClass) {
    if (!this.containerMap.size || !this.parentMap.size) {
      console.warn('Diagram data not initialized');
      return;
    }

    const neighbors = new Set([nodeClass]);
    const visibleConnections = new Set();

    // Find all child nodes recursively
    const addChildrenRecursively = (parentClass) => {
      const container = this.containerMap.get(parentClass);
      if (!container) return;

      container.nodes.forEach(child => {
        if (!neighbors.has(child)) {
          neighbors.add(child);
          addChildrenRecursively(child);
        }
      });

      container.connections.forEach(conn => {
        visibleConnections.add(conn);
      });
    };

    addChildrenRecursively(nodeClass);

    // Find all parent nodes
    let currentNode = nodeClass;
    while (this.parentMap.has(currentNode)) {
      currentNode = this.parentMap.get(currentNode);
      neighbors.add(currentNode);
    }

    // Find all related connections
    document.querySelectorAll('.interactive-svg-connection').forEach(connection => {
      const connectionClass = Array.from(connection.classList).find(cls => 
        cls && this.isValidIdentifier(cls)
      );
      if (!connectionClass) return;

      const parsed = this.parseConnectionID(connectionClass);
      if (!parsed) return;

      if (
        parsed.startNode === nodeClass ||
        parsed.endNode === nodeClass ||
        neighbors.has(parsed.startNode) ||
        neighbors.has(parsed.endNode)
      ) {
        visibleConnections.add(connectionClass);
        neighbors.add(parsed.startNode);
        neighbors.add(parsed.endNode);
      }
    });

    // Apply visibility changes
    this.setElementsVisibility('.interactive-svg-node, .interactive-svg-container', neighbors);
    this.setElementsVisibility('.interactive-svg-connection', visibleConnections);
  }

  setElementsVisibility(selector, visibleSet) {
    document.querySelectorAll(selector).forEach(element => {
      const elementClass = Array.from(element.classList).find(cls => 
        cls && this.isValidIdentifier(cls)
      );
      if (elementClass) {
        element.classList.toggle('interactive-svg-hidden', !visibleSet.has(elementClass));
      }
    });
  }

  resetHighlight() {
    document.querySelectorAll('.interactive-svg-hidden').forEach(element => {
      element.classList.remove('interactive-svg-hidden');
    });
  }

  // Helper methods
  isValidIdentifier(str) {
    try {
      return str && str === this.encodeIdentifier(this.decodeIdentifier(str));
    } catch (e) {
      return false;
    }
  }

  encodeIdentifier(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }

  decodeIdentifier(str) {
    return decodeURIComponent(escape(atob(str)));
  }

  getShortName(decodedID) {
    return decodedID.includes('.') 
      ? this.encodeIdentifier(decodedID.split('.').pop())
      : this.encodeIdentifier(decodedID);
  }

  getParentName(decodedID) {
    if (!decodedID.includes('.')) return null;
    return decodedID.split('.').slice(0, -1).join('.');
  }

  parseConnectionID(base64ID) {
    try {
      const decodedID = this.decodeIdentifier(base64ID);
      const match = decodedID.match(/^\((.*?)\)(?:\[\d+\])?$/);
      if (!match) return null;

      const connectionMatch = match[1].match(/(.+?)\s*(->|<-|--|→|←|↔)\s*(.+)/);
      if (!connectionMatch) return null;

      return {
        startNode: this.encodeIdentifier(connectionMatch[1].trim()),
        endNode: this.encodeIdentifier(connectionMatch[3].trim()),
        connectionType: connectionMatch[2].trim()
      };
    } catch (e) {
      console.error('Error parsing connection ID:', e);
      return null;
    }
  }
}

// Initialize the interactive SVG
document.addEventListener('DOMContentLoaded', () => {
  const interactiveSVG = new InteractiveSVG();
  interactiveSVG.init();

  // Make available for debugging if needed
  window.interactiveSVG = interactiveSVG;
});
