import { NODE_TYPES, NODE_DEFAULT_SIZES } from './nodeConfig';

export const getNodeSize = (nodeType) => {
  return NODE_DEFAULT_SIZES[nodeType] || { width: 120, height: 50 };
};

/**
 * Valida un nodo con verificaciones mejoradas y reparación automática
 * @param {Object} node - El nodo a validar
 * @returns {Object} - Resultado de validación con información detallada
 */
export const validateNode = (node) => {
  const errors = [];
  const warnings = [];
  let severity = 'none'; // none, warning, error

  if (!node || typeof node !== 'object') {
    return {
      valid: false,
      errors: ['Nodo no es un objeto válido'],
      warnings: [],
      severity: 'error',
      fixable: false,
    };
  }

  // Validación de ID
  if (!node.id || typeof node.id !== 'string') {
    errors.push('ID de nodo inválido o faltante');
    severity = 'error';
  }

  // Validación de tipo
  if (!node.type || typeof node.type !== 'string') {
    errors.push('Tipo de nodo inválido o faltante');
    severity = 'error';
  } else if (!Object.values(NODE_TYPES).includes(node.type)) {
    errors.push(`Tipo de nodo desconocido: ${node.type}`);
    severity = 'error';
  }

  // Validación de posición
  if (!node.position || typeof node.position !== 'object') {
    errors.push('Posición de nodo inválida o faltante');
    node.position = { x: 0, y: 0 };
    severity = 'error';
  } else {
    if (typeof node.position.x !== 'number' || isNaN(node.position.x)) {
      errors.push('Posición X inválida');
      node.position.x = 0;
      severity = 'error';
    }
    if (typeof node.position.y !== 'number' || isNaN(node.position.y)) {
      errors.push('Posición Y inválida');
      node.position.y = 0;
      severity = 'error';
    }
  }

  // Validación de datos
  if (!node.data || typeof node.data !== 'object') {
    errors.push('Datos de nodo inválidos o faltantes');
    node.data = { label: 'Nodo sin etiqueta' };
    severity = 'error';
  } else {
    // Validación específica por tipo de nodo
    switch (node.type) {
      case NODE_TYPES.start:
        if (!node.data.label) {
          warnings.push('Nodo de inicio sin etiqueta descriptiva');
          severity = severity === 'error' ? 'error' : 'warning';
        }
        break;

      case NODE_TYPES.end:
        if (!node.data.label) {
          warnings.push('Nodo de fin sin etiqueta descriptiva');
          severity = severity === 'error' ? 'error' : 'warning';
        }
        break;

      case NODE_TYPES.message:
        if (!node.data.message) {
          errors.push('Nodo de mensaje sin contenido');
          severity = 'error';
        } else if (node.data.message.length < 5) {
          warnings.push('Mensaje muy corto, considera añadir más detalles');
          severity = severity === 'error' ? 'error' : 'warning';
        }
        break;

      case NODE_TYPES.decision:
        if (!node.data.question) {
          errors.push('Nodo de decisión sin pregunta');
          severity = 'error';
        }
        if (!Array.isArray(node.data.outputs) || node.data.outputs.length < 2) {
          errors.push('El nodo de decisión debe tener al menos dos opciones');
          severity = 'error';
        }
        break;

      case NODE_TYPES.action:
        if (!node.data.actionType) {
          errors.push('Nodo de acción sin tipo de acción');
          severity = 'error';
        }
        if (!node.data.actionConfig) {
          warnings.push('Nodo de acción sin configuración detallada');
          severity = severity === 'error' ? 'error' : 'warning';
        }
        break;

      case NODE_TYPES.option:
        if (!node.data.condition) {
          errors.push('Nodo de opción sin condición');
          severity = 'error';
        }
        if (!node.data.parentDecisionId) {
          warnings.push('Nodo de opción sin referencia a decisión padre');
          severity = severity === 'error' ? 'error' : 'warning';
        }
        break;

      default:
        if (!node.data.label) {
          warnings.push('Nodo sin etiqueta descriptiva');
          severity = severity === 'error' ? 'error' : 'warning';
        }
    }
  }

  // Validación de dimensiones
  const nodeSize = getNodeSize(node.type);
  if (!node.width || typeof node.width !== 'number' || isNaN(node.width)) {
    warnings.push('Ancho de nodo inválido o faltante');
    node.width = nodeSize.width;
    severity = severity === 'error' ? 'error' : 'warning';
  } else if (node.width < nodeSize.width * 0.5) {
    warnings.push(`Ancho de nodo demasiado pequeño (mínimo recomendado: ${nodeSize.width}px)`);
    severity = severity === 'error' ? 'error' : 'warning';
  }

  if (!node.height || typeof node.height !== 'number' || isNaN(node.height)) {
    warnings.push('Alto de nodo inválido o faltante');
    node.height = nodeSize.height;
    severity = severity === 'error' ? 'error' : 'warning';
  } else if (node.height < nodeSize.height * 0.5) {
    warnings.push(`Alto de nodo demasiado pequeño (mínimo recomendado: ${nodeSize.height}px)`);
    severity = severity === 'error' ? 'error' : 'warning';
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    severity,
    fixable: errors.length > 0 || warnings.length > 0,
    node,
  };
};

/**
 * Analiza las rutas del flujo para detectar problemas y optimizaciones
 * @param {Array} nodes - Lista de nodos
 * @param {Array} edges - Lista de aristas
 * @returns {Object} - Análisis detallado del flujo
 */
export const analyzeFlowRoutes = (nodes, edges) => {
  const startNodes = nodes.filter((node) => node.type === NODE_TYPES.start);
  const analysis = {
    totalRoutes: 0,
    completeRoutes: 0,
    incompleteRoutes: 0,
    longestRoute: { length: 0, path: [] },
    orphanedNodes: [],
    deadEndNodes: [],
    pathsByStartNode: {},
    cycles: [],
    complexity: 0,
  };

  // Identificar nodos huérfanos y callejones sin salida
  analysis.orphanedNodes = nodes
    .filter((node) => node.type !== NODE_TYPES.start && !edges.some((edge) => edge.target === node.id))
    .map((node) => node.id);

  analysis.deadEndNodes = nodes
    .filter((node) => node.type !== NODE_TYPES.end && !edges.some((edge) => edge.source === node.id))
    .map((node) => node.id);

  // Calcular complejidad del flujo
  analysis.complexity = edges.length / (nodes.length || 1);

  // Analizar rutas desde cada nodo de inicio
  startNodes.forEach((startNode) => {
    const routes = [];
    const cycles = [];

    const explorePath = (currentNodeId, currentPath = [], visitedNodes = new Set()) => {
      if (visitedNodes.has(currentNodeId)) {
        // Detectar ciclo
        const cycleStartIndex = currentPath.indexOf(currentNodeId);
        const cycle = currentPath.slice(cycleStartIndex).concat(currentNodeId);
        cycles.push(cycle);
        routes.push([...currentPath, `${currentNodeId} (ciclo)`]);
        return;
      }

      currentPath.push(currentNodeId);
      visitedNodes.add(currentNodeId);

      const currentNode = nodes.find((node) => node.id === currentNodeId);
      const outgoingEdges = edges.filter((edge) => edge.source === currentNodeId);

      if (outgoingEdges.length === 0) {
        routes.push([...currentPath]);
        if (currentNode.type !== NODE_TYPES.end) {
          analysis.incompleteRoutes++;
        } else {
          analysis.completeRoutes++;
        }
      } else {
        outgoingEdges.forEach((edge) => {
          explorePath(edge.target, [...currentPath], new Set(visitedNodes));
        });
      }
    };

    explorePath(startNode.id);

    // Guardar rutas y ciclos
    analysis.pathsByStartNode[startNode.id] = routes;
    analysis.cycles = analysis.cycles.concat(cycles);
    analysis.totalRoutes += routes.length;

    // Actualizar ruta más larga
    const longestRoute = routes.reduce(
      (longest, current) => (current.length > longest.length ? current : longest),
      [],
    );

    if (longestRoute.length > analysis.longestRoute.length) {
      analysis.longestRoute = { length: longestRoute.length, path: longestRoute };
    }
  });

  return analysis;
};

/**
 * Genera sugerencias inteligentes para mejorar el flujo
 * @param {Array} nodes - Lista de nodos
 * @param {Array} edges - Lista de aristas
 * @returns {Array} - Lista de sugerencias con acciones
 */
export const generateNodeSuggestions = (nodes, edges) => {
  const suggestions = [];

  // Verificar nodos esenciales
  if (!nodes.some((node) => node.type === NODE_TYPES.start)) {
    suggestions.push({
      description: 'Falta nodo de inicio en el flujo',
      action: {
        type: 'ADD_NODE',
        payload: {
          type: NODE_TYPES.start,
          position: { x: 100, y: 100 },
          data: { label: 'Inicio' },
        },
      },
      severity: 'error',
    });
  }

  if (!nodes.some((node) => node.type === NODE_TYPES.end)) {
    suggestions.push({
      description: 'Falta nodo de finalización en el flujo',
      action: {
        type: 'ADD_NODE',
        payload: {
          type: NODE_TYPES.end,
          position: { x: 500, y: 500 },
          data: { label: 'Fin' },
        },
      },
      severity: 'error',
    });
  }

  // Verificar nodos huérfanos
  const orphanedNodes = nodes.filter(
    (node) => node.type !== NODE_TYPES.start && !edges.some((edge) => edge.target === node.id),
  );

  if (orphanedNodes.length > 0) {
    suggestions.push({
      description: `${orphanedNodes.length} nodo(s) sin conexiones de entrada`,
      action: {
        type: 'HIGHLIGHT_NODES',
        payload: { nodeIds: orphanedNodes.map((n) => n.id) },
      },
      severity: 'warning',
    });
  }

  // Verificar nodos sin salidas
  const deadEndNodes = nodes.filter(
    (node) => node.type !== NODE_TYPES.end && !edges.some((edge) => edge.source === node.id),
  );

  if (deadEndNodes.length > 0) {
    suggestions.push({
      description: `${deadEndNodes.length} nodo(s) sin conexiones de salida`,
      action: {
        type: 'HIGHLIGHT_NODES',
        payload: { nodeIds: deadEndNodes.map((n) => n.id) },
      },
      severity: 'warning',
    });
  }

  // Verificar decisiones sin opciones suficientes
  const decisionNodes = nodes.filter((node) => node.type === NODE_TYPES.decision);
  decisionNodes.forEach((node) => {
    const outgoingEdges = edges.filter((edge) => edge.source === node.id);
    if (outgoingEdges.length < 2) {
      suggestions.push({
        description: `Nodo de decisión "${node.data.label || node.id}" con menos de 2 salidas`,
        action: {
          type: 'HIGHLIGHT_NODE',
          payload: { nodeId: node.id },
        },
        severity: 'warning',
      });
    }
  });

  // Verificar rutas incompletas
  const startNodes = nodes.filter((node) => node.type === NODE_TYPES.start);
  const endNodes = nodes.filter((node) => node.type === NODE_TYPES.end);

  if (startNodes.length > 0 && endNodes.length > 0) {
    const { incompleteRoutes } = analyzeFlowRoutes(nodes, edges);

    if (incompleteRoutes > 0) {
      suggestions.push({
        description: `${incompleteRoutes} ruta(s) no terminan en un nodo final`,
        action: {
          type: 'ANALYZE_FLOW',
          payload: { detailed: true },
        },
        severity: 'warning',
      });
    }
  }

  return suggestions;
};

/**
 * Valida las conexiones del flujo completo
 * @param {Array} nodes - Lista de nodos
 * @param {Array} edges - Lista de aristas
 * @returns {Object} - Resultado detallado de la validación
 */
export const validateConnections = (nodes, edges) => {
  const issues = [];
  const warnings = [];

  // Verificar nodos esenciales
  if (!nodes.some((n) => n.type === NODE_TYPES.start)) {
    issues.push('No hay nodos de inicio en el flujo');
  }

  if (!nodes.some((n) => n.type === NODE_TYPES.end)) {
    issues.push('No hay nodos de finalización en el flujo');
  }

  // Verificar conexiones
  const startNodes = nodes.filter((node) => node.type === NODE_TYPES.start);
  const endNodes = nodes.filter((node) => node.type === NODE_TYPES.end);

  if (startNodes.length > 0 && endNodes.length > 0) {
    const analysis = analyzeFlowRoutes(nodes, edges);

    if (analysis.incompleteRoutes > 0) {
      warnings.push(`Hay ${analysis.incompleteRoutes} ruta(s) que no terminan en un nodo final`);
    }

    if (analysis.orphanedNodes.length > 0) {
      warnings.push(`Hay ${analysis.orphanedNodes.length} nodo(s) sin conexiones de entrada`);
    }

    if (analysis.deadEndNodes.length > 0) {
      warnings.push(`Hay ${analysis.deadEndNodes.length} nodo(s) sin conexiones de salida`);
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    warnings,
    severity: issues.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'none',
  };
};


/**
 * Optimiza la distribución de nodos para mejorar la legibilidad
 * @param {Array} nodes - Lista de nodos
 * @param {Array} edges - Lista de aristas
 * @returns {Array} - Lista de nodos con posiciones optimizadas
 */
export const optimizeNodeLayout = (nodes, edges) => {
  // Implementación básica de organización por niveles
  const startNodes = nodes.filter((node) => node.type === NODE_TYPES.start);
  const nodeMap = new Map(nodes.map((node) => [node.id, { ...node, level: -1, column: -1 }]));
  const levels = [];

  // Asignar niveles a los nodos
  const assignLevels = (nodeId, level = 0) => {
    const node = nodeMap.get(nodeId);

    // Si el nodo ya tiene un nivel asignado y es menor o igual al actual, no hacer nada
    if (node.level !== -1 && node.level <= level) {
      return;
    }

    // Asignar nivel
    node.level = level;

    // Asegurarse de que el array de niveles tiene suficientes elementos
    while (levels.length <= level) {
      levels.push([]);
    }

    // Añadir nodo al nivel si no está ya
    if (!levels[level].includes(nodeId)) {
      levels[level].push(nodeId);
    }

    // Procesar nodos conectados
    const outgoingEdges = edges.filter((edge) => edge.source === nodeId);
    outgoingEdges.forEach((edge) => {
      assignLevels(edge.target, level + 1);
    });
  };

  // Comenzar asignación desde nodos de inicio
  startNodes.forEach((node) => {
    assignLevels(node.id);
  });

  // Asignar columnas dentro de cada nivel
  levels.forEach((levelNodes) => {
    levelNodes.forEach((nodeId, columnIndex) => {
      nodeMap.get(nodeId).column = columnIndex;
    });
  });

  // Calcular nuevas posiciones
  const HORIZONTAL_SPACING = 250;
  const VERTICAL_SPACING = 150;

  const optimizedNodes = Array.from(nodeMap.values()).map((node) => {
    // Solo actualizar posiciones de nodos con nivel asignado
    if (node.level !== -1) {
      return {
        ...node,
        position: {
          x: node.level * HORIZONTAL_SPACING + 100,
          y: node.column * VERTICAL_SPACING + 100,
        },
      };
    }
    return node;
  });

  return optimizedNodes;
};