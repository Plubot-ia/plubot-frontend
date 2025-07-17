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
  const { id, source, target, sourceHandle, targetHandle, label, type, style } =
    edge;

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
  const oldData = normalizedOld.data || {};
  const newData = normalizedNew.data || {};

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
  if (
    normalizedOld.source !== normalizedNew.source ||
    normalizedOld.target !== normalizedNew.target ||
    normalizedOld.sourceHandle !== normalizedNew.sourceHandle ||
    normalizedOld.targetHandle !== normalizedNew.targetHandle
  ) {
    return true;
  }

  // Comparar etiqueta
  if (normalizedOld.label !== normalizedNew.label) {
    return true;
  }

  // Comparar tipo
  if (normalizedOld.type !== normalizedNew.type) {
    return true;
  }

  // Comparar estilos relevantes
  if (normalizedOld.style && normalizedNew.style) {
    if (
      normalizedOld.style.strokeWidth !== normalizedNew.style.strokeWidth ||
      normalizedOld.style.stroke !== normalizedNew.style.stroke
    ) {
      return true;
    }
  } else if (
    (normalizedOld.style && !normalizedNew.style) ||
    (!normalizedOld.style && normalizedNew.style)
  ) {
    return true;
  }

  return false;
};

/**
 * Calcula las diferencias entre dos estados de flujo
 * @param {Object} prevState - Estado anterior {nodes, edges}
 * @param {Object} currentState - Estado actual {nodes, edges}
 * @returns {Object} Cambios detectados entre estados
 */
export const calculateFlowDiff = (previousState, currentState) => {
  const previousNodes = previousState?.nodes || [];
  const currentNodes = currentState?.nodes || [];
  const previousEdges = previousState?.edges || [];
  const currentEdges = currentState?.edges || [];

  // Crear mapas para buscar elementos por ID
  const previousNodesMap = new Map(
    previousNodes.map((node) => [node.id, node]),
  );
  const currentNodesMap = new Map(currentNodes.map((node) => [node.id, node]));
  const previousEdgesMap = new Map(
    previousEdges.map((edge) => [edge.id, edge]),
  );
  const currentEdgesMap = new Map(currentEdges.map((edge) => [edge.id, edge]));

  // Detectar cambios en nodos
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

  // Detectar cambios en aristas
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

  // Calcular estadisticas
  const stats = {
    total: {
      nodes: currentNodes.length,
      edges: currentEdges.length,
    },
    changes: {
      nodesCreated: nodesToCreate.length,
      nodesUpdated: nodesToUpdate.length,
      nodesDeleted: nodesToDelete.length,
      edgesCreated: edgesToCreate.length,
      edgesUpdated: edgesToUpdate.length,
      edgesDeleted: edgesToDelete.length,
    },
  };

  // Crear resumen final
  return {
    // Datos para la API
    nodes_to_create: nodesToCreate,
    nodes_to_update: nodesToUpdate,
    nodes_to_delete: nodesToDelete,
    edges_to_create: edgesToCreate,
    edges_to_update: edgesToUpdate,
    edges_to_delete: edgesToDelete,
    // Estadisticas adicionales
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

/**
 * Valida un flujo en busca de problemas o configuraciones incorrectas
 * @param {Object} flow - Flujo a validar {nodes, edges}
 * @returns {Object} Resultado de validaciu00f3n con errores y advertencias
 */
export const validateFlow = (flow) => {
  if (!flow) return { valid: false, errors: ['Flujo indefinido'] };

  const { nodes = [], edges = [] } = flow;
  const errors = [];
  const warnings = [];

  // 1. Validar que exista al menos un nodo de inicio y uno de fin
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

  // 2. Validar que todos los nodos estn conectados
  const connectedNodes = new Set();

  for (const edge of edges) {
    connectedNodes.add(edge.source);
    connectedNodes.add(edge.target);
  }

  const disconnectedNodes = nodes.filter(
    (node) =>
      !connectedNodes.has(node.id) &&
      node.type !== 'start' &&
      node.type !== 'end',
  );

  if (disconnectedNodes.length > 0) {
    warnings.push(
      `Hay ${disconnectedNodes.length} nodos desconectados en el flujo`,
    );
  }

  // 3. Validar nodos sin salidas (excepto nodos de fin)
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

  // 4. Validar nodos de decisiu00f3n con suficientes salidas
  const decisionNodes = nodes.filter((node) => node.type === 'decision');

  for (const node of decisionNodes) {
    const outgoingEdges = edges.filter((edge) => edge.source === node.id);
    if (outgoingEdges.length < 2) {
      warnings.push(
        `El nodo de decisión "${node.data?.label || node.id}" ` +
          'tiene menos de 2 salidas',
      );
    }
  }

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
