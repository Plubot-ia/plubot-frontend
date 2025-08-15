/**
 * aiFlowHelpers.js
 * Utilidades para analizar y optimizar flujos conversacionales en Plubot.
 */

/**
 * Analiza la estructura del flujo conversacional para identificar problemas.
 * @param {Array} nodes - Lista de nodos del flujo.
 * @returns {Object} - Objeto con mensaje descriptivo y categoría.
 */
export const analyzeFlowStructure = (nodes, edges) => {
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return {
      message: 'El flujo está vacío. Añade nodos para comenzar.',
      category: 'Error',
    };
  }

  // Contar tipos de nodos
  const nodeTypesCount = Object.create(null);
  for (const node of nodes) {
    nodeTypesCount[node.type] = (nodeTypesCount[node.type] ?? 0) + 1;
  }

  // Validar presencia de nodos críticos
  if (!nodeTypesCount.start) {
    return {
      message: 'Falta un nodo de inicio. Todo flujo debe comenzar con un nodo "start".',
      category: 'Error',
    };
  }
  if (nodeTypesCount.start > 1) {
    return {
      message: 'Se detectaron múltiples nodos de inicio. Un flujo debe tener solo un nodo "start".',
      category: 'Error',
    };
  }
  if (!nodeTypesCount.end) {
    return {
      message: 'Falta un nodo de fin. Todo flujo debe terminar con al menos un nodo "end".',
      category: 'Error',
    };
  }

  // Verificar nodos desconectados (sin conexiones, pero no aplica a start/end)
  const hasIsolatedNodes = nodes.some((node) => {
    const isRegularNode = node.type !== 'start' && node.type !== 'end';
    if (!isRegularNode) {
      return false;
    }
    const isConnected = edges.some((edge) => edge.source === node.id || edge.target === node.id);
    return !isConnected;
  });
  if (hasIsolatedNodes) {
    return {
      message:
        'Se encontraron nodos desconectados. Conecta todos los nodos para formar un flujo coherente.',
      category: 'Advertencia',
    };
  }

  // Análisis de complejidad
  const totalNodes = nodes.length;
  if (totalNodes < 3) {
    return {
      message:
        'El flujo es muy simple. Considera añadir nodos de decisión o acción para mayor interactividad.',
      category: 'Sugerencia',
    };
  }

  return {
    message: `Análisis completado: ${totalNodes} nodos detectados. La estructura parece válida.`,
    category: 'Info',
  };
};

// Helper: Validar datos de entrada
function _validateInputData(nodes, edges) {
  if (!Array.isArray(nodes) || !Array.isArray(edges)) {
    return {
      message: 'Datos inválidos. Asegúrate de proporcionar nodos y bordes válidos.',
      category: 'Error',
    };
  }
}

// Helper: Encontrar nodos sin conexiones salientes
function _findDeadEndNodes(nodes, connections) {
  const deadEnds = nodes.filter((node) => node.type !== 'end' && !connections[node.id]?.length);
  if (deadEnds.length > 0) {
    return {
      message: `Se encontraron nodos sin conexiones salientes (${deadEnds
        .map((n) => n.data.label)
        .join(', ')}). Añade conexiones para continuar el flujo.`,
      category: 'Advertencia',
    };
  }
}

// Helper: Analizar nodos de decisión y balance
function _analyzeDecisionNodes(nodes) {
  const decisionNodes = nodes.filter((node) => node.type === 'decision');
  if (decisionNodes.length === 0 && nodes.length > 5) {
    return {
      message:
        'No hay nodos de decisión. Añade nodos de tipo "decision" para crear flujos más interactivos.',
      category: 'Sugerencia',
    };
  }

  // Find the first decision node with unbalanced branches.
  const unbalancedNode = decisionNodes.find((node) => {
    const { branchA, branchB } = node.data.branchMetrics ?? {};
    return Boolean(branchA && branchB && Math.abs(branchA - branchB) > 50);
  });

  if (unbalancedNode) {
    return {
      message: [
        `El nodo "${unbalancedNode.data.label}" tiene ramas desbalanceadas. `,
        'Considere ajustar las condiciones.',
      ].join(''),
      category: 'Sugerencia',
    };
  }
}

// Helper: Verificar tasa de éxito de nodos de acción
function _checkActionNodeSuccess(nodes) {
  const actionNodes = nodes.filter((node) => node.type === 'action' && node.data.successRate < 80);
  if (actionNodes.length > 0) {
    return {
      message: [
        `El nodo "${actionNodes[0].data.label}" tiene una tasa de éxito baja. `,
        'Recomiendo revisar la acción.',
      ].join(''),
      category: 'Advertencia',
    };
  }
}

// Helper: Detectar caminos largos sin nodos de mensaje
function _detectLongPathsWithoutMessages(nodes, connections) {
  const visited = new Set();
  const dfs = (nodeId, depth, hasMessage) => {
    if (depth > 5 && !hasMessage) {
      return true; // Camino largo sin mensaje
    }
    const node = nodes.find((n) => n.id === nodeId);
    if (!node || visited.has(nodeId)) return false;
    visited.add(nodeId);
    const isMessage = node.type === 'message';
    // `connections` is a safe, prototype-less object, and nodeId is a controlled value.
    // eslint-disable-next-line security/detect-object-injection
    const neighbors = connections[nodeId] ?? [];
    for (const neighbor of neighbors) {
      if (dfs(neighbor, depth + 1, hasMessage || isMessage)) {
        return true;
      }
    }
    visited.delete(nodeId);
    return false;
  };

  const startNode = nodes.find((n) => n.type === 'start');
  if (startNode && dfs(startNode.id, 0, false)) {
    return {
      message:
        'Se detectó un camino largo sin nodos de mensaje. Añade nodos de tipo "message" para mejorar la interacción.',
      category: 'Sugerencia',
    };
  }
}

/**
 * Sugiere optimizaciones para el flujo conversacional basado en nodos y bordes.
 * @param {Array} nodes - Lista de nodos del flujo.
 * @param {Array} edges - Lista de bordes del flujo.
 * @returns {Object|null} - Objeto con sugerencia y categoría, o null si no hay sugerencias.
 */
export const suggestNodeOptimizations = (nodes, edges) => {
  // Validar datos de entrada
  const validationError = _validateInputData(nodes, edges);
  if (validationError) return validationError;

  // Crear un mapa de conexiones para análisis eficiente
  const connections = Object.create(null);
  for (const edge of edges) {
    if (!connections[edge.source]) {
      connections[edge.source] = [];
    }
    connections[edge.source].push(edge.target);
  }

  // Verificar nodos sin conexiones salientes
  const deadEndError = _findDeadEndNodes(nodes, connections);
  if (deadEndError) return deadEndError;

  // Analizar nodos de decisión
  const decisionError = _analyzeDecisionNodes(nodes);
  if (decisionError) return decisionError;

  // Verificar nodos de acción
  const actionError = _checkActionNodeSuccess(nodes);
  if (actionError) return actionError;

  // Verificar caminos largos sin mensajes
  const pathError = _detectLongPathsWithoutMessages(nodes, connections);
  if (pathError) return pathError;

  // No se devuelve nada explícitamente si no hay sugerencias, pero se asegura un retorno consistente.
  return {
    message: '',
    category: '',
  };
};
