/**
 * Utilidades para optimizar y mejorar el manejo de flujos en el editor.
 * Proporciona funciones para normalizar, comparar y optimizar flujos.
 */

/**
 * Normaliza un nodo para su comparaciu00f3n eficiente
 * @param {Object} node - Nodo a normalizar
 * @returns {Object} Nodo normalizado
 */
const normalizeNode = (node) => {
  const { id, type, position, data } = node;

  // Estructura normalizada para comparaciu00f3n eficiente
  return {
    id,
    type,
    position: {
      x: Math.round(position.x),
      y: Math.round(position.y),
    },
    data: {
      ...data,
      // Filtrar propiedades virtuales o de RenderInfo que no persistimos
      _renderInfo: undefined,
      isVisible: undefined,
      detailLevel: undefined,
      renderDetail: undefined,
    },
  };
};

/**
 * Normaliza una arista para su comparaciu00f3n eficiente
 * @param {Object} edge - Arista a normalizar
 * @returns {Object} Arista normalizada
 */
const normalizeEdge = (edge) => {
  const { id, source, target, sourceHandle, targetHandle, label, type, style } = edge;

  // Estructura normalizada para comparaciu00f3n eficiente
  return {
    id,
    source,
    target,
    sourceHandle,
    targetHandle,
    label,
    type,
    // Normalizar estilos relevantes si existen
    style: style
      ? {
          strokeWidth: style.strokeWidth,
          stroke: style.stroke,
        }
      : undefined,
  };
};

/**
 * Detecta cambios entre dos nodos
 * @param {Object} oldNode - Nodo original
 * @param {Object} newNode - Nodo modificado
 * @returns {boolean} true si hay cambios, false en caso contrario
 */
export const hasNodeChanged = (oldNode, newNode) => {
  if (!oldNode || !newNode) return true;

  const normalizedOld = normalizeNode(oldNode);
  const normalizedNew = normalizeNode(newNode);

  // Comparar posiciones con umbral de tolerancia para evitar actualizaciones innecesarias
  const positionChanged =
    Math.abs(normalizedOld.position.x - normalizedNew.position.x) > 1 ||
    Math.abs(normalizedOld.position.y - normalizedNew.position.y) > 1;

  if (positionChanged) return true;

  // Comparar tipo
  if (normalizedOld.type !== normalizedNew.type) return true;

  // Comparar datos relevantes
  const oldData = normalizedOld.data ?? {};
  const newData = normalizedNew.data ?? {};

  // Comparar propiedades comunes para diferentes tipos de nodos
  const commonProperties = ['label', 'message', 'options', 'conditions'];

  for (const property of commonProperties) {
    // La variable `property` proviene de una lista blanca (allowlist) predefinida,
    // lo que garantiza que el acceso a las propiedades del objeto es seguro.
    if (
      // eslint-disable-next-line security/detect-object-injection
      JSON.stringify(oldData[property]) !== JSON.stringify(newData[property])
    ) {
      return true;
    }
  }

  return false;
};

// Helper: Comparar conexiones de aristas
function _compareEdgeConnections(normalizedOld, normalizedNew) {
  return (
    normalizedOld.source !== normalizedNew.source ||
    normalizedOld.target !== normalizedNew.target ||
    normalizedOld.sourceHandle !== normalizedNew.sourceHandle ||
    normalizedOld.targetHandle !== normalizedNew.targetHandle
  );
}

// Helper: Comparar propiedades básicas de aristas
function _compareEdgeProperties(normalizedOld, normalizedNew) {
  return normalizedOld.label !== normalizedNew.label || normalizedOld.type !== normalizedNew.type;
}

// Helper: Comparar estilos de aristas
function _compareEdgeStyles(normalizedOld, normalizedNew) {
  if (normalizedOld.style && normalizedNew.style) {
    return (
      normalizedOld.style.strokeWidth !== normalizedNew.style.strokeWidth ||
      normalizedOld.style.stroke !== normalizedNew.style.stroke
    );
  }
  return (
    (normalizedOld.style && !normalizedNew.style) || (!normalizedOld.style && normalizedNew.style)
  );
}

/**
 * Detecta cambios entre dos aristas
 * @param {Object} oldEdge - Arista original
 * @param {Object} newEdge - Arista modificada
 * @returns {boolean} true si hay cambios, false en caso contrario
 */
export const hasEdgeChanged = (oldEdge, newEdge) => {
  if (!oldEdge || !newEdge) return true;

  const normalizedOld = normalizeEdge(oldEdge);
  const normalizedNew = normalizeEdge(newEdge);

  // Comparar conexiones
  if (_compareEdgeConnections(normalizedOld, normalizedNew)) {
    return true;
  }

  // Comparar propiedades básicas
  if (_compareEdgeProperties(normalizedOld, normalizedNew)) {
    return true;
  }

  // Comparar estilos
  return _compareEdgeStyles(normalizedOld, normalizedNew);
};

// Helper: Crear mapas para búsqueda eficiente por ID
function _createElementMaps({ previousNodes, currentNodes, previousEdges, currentEdges }) {
  return {
    previousNodesMap: new Map(previousNodes.map((node) => [node.id, node])),
    currentNodesMap: new Map(currentNodes.map((node) => [node.id, node])),
    previousEdgesMap: new Map(previousEdges.map((edge) => [edge.id, edge])),
    currentEdgesMap: new Map(currentEdges.map((edge) => [edge.id, edge])),
  };
}

// Helper: Detectar cambios en nodos
function _detectNodeChanges({ currentNodes, previousNodes, previousNodesMap, currentNodesMap }) {
  const nodesToCreate = [];
  const nodesToUpdate = [];
  const nodesToDelete = [];

  // Nodos nuevos o modificados
  for (const node of currentNodes) {
    const previousNode = previousNodesMap.get(node.id);
    if (!previousNode) {
      nodesToCreate.push(node);
    } else if (hasNodeChanged(previousNode, node)) {
      nodesToUpdate.push(node);
    }
  }

  // Nodos eliminados
  for (const node of previousNodes) {
    if (!currentNodesMap.has(node.id)) {
      nodesToDelete.push(node.id);
    }
  }

  return { nodesToCreate, nodesToUpdate, nodesToDelete };
}

// Helper: Detectar cambios en aristas
function _detectEdgeChanges({ currentEdges, previousEdges, previousEdgesMap, currentEdgesMap }) {
  const edgesToCreate = [];
  const edgesToUpdate = [];
  const edgesToDelete = [];

  // Aristas nuevas o modificadas
  for (const edge of currentEdges) {
    const previousEdge = previousEdgesMap.get(edge.id);
    if (!previousEdge) {
      edgesToCreate.push(edge);
    } else if (hasEdgeChanged(previousEdge, edge)) {
      edgesToUpdate.push(edge);
    }
  }

  // Aristas eliminadas
  for (const edge of previousEdges) {
    if (!currentEdgesMap.has(edge.id)) {
      edgesToDelete.push(edge.id);
    }
  }

  return { edgesToCreate, edgesToUpdate, edgesToDelete };
}

// Helper: Calcular estadísticas de cambios
function _calculateChangeStats({ currentNodes, currentEdges, nodeChanges, edgeChanges }) {
  return {
    total: {
      nodes: currentNodes.length,
      edges: currentEdges.length,
    },
    changes: {
      nodesCreated: nodeChanges.nodesToCreate.length,
      nodesUpdated: nodeChanges.nodesToUpdate.length,
      nodesDeleted: nodeChanges.nodesToDelete.length,
      edgesCreated: edgeChanges.edgesToCreate.length,
      edgesUpdated: edgeChanges.edgesToUpdate.length,
      edgesDeleted: edgeChanges.edgesToDelete.length,
    },
  };
}

/**
 * Calcula las diferencias entre dos estados de flujo
 * @param {Object} prevState - Estado anterior {nodes, edges}
 * @param {Object} currentState - Estado actual {nodes, edges}
 * @returns {Object} Cambios detectados entre estados
 */
export const calculateFlowDiff = (previousState, currentState) => {
  const previousNodes = previousState?.nodes ?? [];
  const currentNodes = currentState?.nodes ?? [];
  const previousEdges = previousState?.edges ?? [];
  const currentEdges = currentState?.edges ?? [];

  // Crear mapas para búsqueda eficiente
  const maps = _createElementMaps({
    previousNodes,
    currentNodes,
    previousEdges,
    currentEdges,
  });

  // Detectar cambios en nodos
  const nodeChanges = _detectNodeChanges({
    currentNodes,
    previousNodes,
    previousNodesMap: maps.previousNodesMap,
    currentNodesMap: maps.currentNodesMap,
  });

  // Detectar cambios en aristas
  const edgeChanges = _detectEdgeChanges({
    currentEdges,
    previousEdges,
    previousEdgesMap: maps.previousEdgesMap,
    currentEdgesMap: maps.currentEdgesMap,
  });

  // Calcular estadísticas
  const stats = _calculateChangeStats({
    currentNodes,
    currentEdges,
    nodeChanges,
    edgeChanges,
  });

  // Crear resumen final
  return {
    // Datos para la API
    nodes_to_create: nodeChanges.nodesToCreate,
    nodes_to_update: nodeChanges.nodesToUpdate,
    nodes_to_delete: nodeChanges.nodesToDelete,
    edges_to_create: edgeChanges.edgesToCreate,
    edges_to_update: edgeChanges.edgesToUpdate,
    edges_to_delete: edgeChanges.edgesToDelete,
    // Estadísticas adicionales
    stats,
  };
};

/**
 * Optimiza un flujo para aumentar su rendimiento
 * @param {Object} flow - Flujo a optimizar {nodes, edges}
 * @returns {Object} Flujo optimizado {nodes, edges}
 */
export const optimizeFlow = (flow) => {
  if (!flow) return { nodes: [], edges: [] };

  const { nodes = [], edges = [] } = flow;

  // 1. Eliminar nodos desconectados o hu00e9rfanos
  const connectedNodeIds = new Set();

  // Au00f1adir todos los nodos que son origen o destino de alguna arista
  for (const edge of edges) {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  }

  // Siempre mantener el nodo START como "conectado", aunque no tenga conexiones
  for (const node of nodes) {
    if (node.type === 'start') {
      connectedNodeIds.add(node.id);
    }
  }

  // Filtrar nodos conectados o de inicio
  const optimizedNodes = nodes.filter((node) => connectedNodeIds.has(node.id));

  // 2. Optimizar datos de nodos
  const processedNodes = optimizedNodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      // Eliminar datos temporales que no necesitamos persistir
      _renderInfo: undefined,
      isVisible: undefined,
      detailLevel: undefined,
      renderDetail: undefined,
    },
  }));

  // 3. Validar aristas (eliminar las que apuntan a nodos que ya no existen)
  const validNodeIds = new Set(processedNodes.map((node) => node.id));
  const optimizedEdges = edges.filter(
    (edge) => validNodeIds.has(edge.source) && validNodeIds.has(edge.target),
  );

  return {
    nodes: processedNodes,
    edges: optimizedEdges,
    stats: {
      nodesRemoved: nodes.length - processedNodes.length,
      edgesRemoved: edges.length - optimizedEdges.length,
    },
  };
};

// Helper: Validar cantidad de nodos de inicio y fin
function _validateStartEndNodeCounts(nodes, errors, warnings) {
  const startNodes = nodes.filter((node) => node.type === 'start');
  const endNodes = nodes.filter((node) => node.type === 'end');

  if (startNodes.length === 0) {
    errors.push('El flujo debe tener al menos un nodo de inicio');
  }

  if (startNodes.length > 1) {
    warnings.push(
      `El flujo tiene ${startNodes.length} nodos de inicio, lo que puede causar ` +
        'comportamientos inesperados',
    );
  }

  if (endNodes.length === 0) {
    errors.push('El flujo debe tener al menos un nodo de fin');
  }
}

// Helper: Encontrar nodos desconectados
function _findDisconnectedNodes(nodes, edges) {
  const connectedNodes = new Set();

  for (const edge of edges) {
    connectedNodes.add(edge.source);
    connectedNodes.add(edge.target);
  }

  return nodes.filter(
    (node) => !connectedNodes.has(node.id) && node.type !== 'start' && node.type !== 'end',
  );
}

// Helper: Validar nodos sin conexiones de salida
function _validateNodeOutgoingEdges(nodes, edges, warnings) {
  const nodesWithOutgoingEdges = new Set();

  for (const edge of edges) {
    nodesWithOutgoingEdges.add(edge.source);
  }

  const nodesWithoutOutgoingEdges = nodes.filter(
    (node) => node.type !== 'end' && !nodesWithOutgoingEdges.has(node.id),
  );

  if (nodesWithoutOutgoingEdges.length > 0) {
    warnings.push(
      `Hay ${nodesWithoutOutgoingEdges.length} nodos sin conexiones de salida ` +
        '(excepto nodos de fin)',
    );
  }

  return nodesWithoutOutgoingEdges;
}

// Helper: Validar nodos de decisión con suficientes salidas
function _validateDecisionNodeEdges(nodes, edges, warnings) {
  const decisionNodes = nodes.filter((node) => node.type === 'decision');

  for (const node of decisionNodes) {
    const outgoingEdges = edges.filter((edge) => edge.source === node.id);
    if (outgoingEdges.length < 2) {
      warnings.push(
        `El nodo de decisión "${node.data?.label || node.id}" tiene menos de 2 salidas`,
      );
    }
  }
}

/**
 * Valida nodos de inicio y fin en un flujo.
 * @param {Array} nodes - Array de nodos del flujo
 * @param {Array} edges - Array de aristas del flujo
 * @param {Array} errors - Array de errores para agregar mensajes
 * @param {Array} warnings - Array de advertencias para agregar mensajes
 */
const _validateStartEndNodes = ({ nodes, edges, errors, warnings }) => {
  // Validar cantidad de nodos start/end
  _validateStartEndNodeCounts(nodes, errors, warnings);

  // Encontrar nodos desconectados
  const disconnectedNodes = _findDisconnectedNodes(nodes, edges);
  if (disconnectedNodes.length > 0) {
    warnings.push(`Hay ${disconnectedNodes.length} nodos desconectados en el flujo`);
  }

  // Validar nodos sin salidas
  const nodesWithoutOutgoingEdges = _validateNodeOutgoingEdges(nodes, edges, warnings);

  // Validar nodos de decisión
  _validateDecisionNodeEdges(nodes, edges, warnings);

  // Determinar validez general
  const isValid = errors.length === 0;

  return {
    valid: isValid,
    errors,
    warnings,
    stats: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      disconnectedNodes: disconnectedNodes.length,
      nodesWithoutOutgoingEdges: nodesWithoutOutgoingEdges.length,
    },
  };
};
