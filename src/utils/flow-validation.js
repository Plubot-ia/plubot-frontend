import { NODE_TYPES, NODE_DEFAULT_SIZES } from './node-config.js';

export const getNodeSize = (nodeType) => {
  if (Object.prototype.hasOwnProperty.call(NODE_DEFAULT_SIZES, nodeType)) {
    // El uso de hasOwnProperty previene la inyección de objetos, por lo que esta
    // advertencia de seguridad es un falso positivo en este contexto.
    // eslint-disable-next-line security/detect-object-injection
    return NODE_DEFAULT_SIZES[nodeType];
  }
  return { width: 120, height: 50 };
};

const explorePathRecursive = (
  nodeId,
  { nodes, edges, currentPath, visitedNodes, routes, cycles, analysis },
) => {
  if (visitedNodes.has(nodeId)) {
    const cycleStartIndex = currentPath.indexOf(nodeId);
    const cycle = [...currentPath.slice(cycleStartIndex), nodeId];
    cycles.push(cycle);
    routes.push([...currentPath, `${nodeId} (ciclo)`]);
    return;
  }

  currentPath.push(nodeId);
  visitedNodes.add(nodeId);

  const currentNode = nodes.find((node) => node.id === nodeId);
  const outgoingEdges = edges.filter((edge) => edge.source === nodeId);

  if (outgoingEdges.length === 0) {
    routes.push([...currentPath]);
    if (currentNode.type === NODE_TYPES.end) {
      analysis.completeRoutes++;
    } else {
      analysis.incompleteRoutes++;
    }
  } else {
    for (const edge of outgoingEdges) {
      explorePathRecursive(edge.target, {
        nodes,
        edges,
        currentPath: [...currentPath],
        visitedNodes: new Set(visitedNodes),
        routes,
        cycles,
        analysis,
      });
    }
  }
};

/**
 * Valida un nodo según su tipo específico
 * @param {Object} node - El nodo a validar
 * @param {Array} errors - Lista de errores
 * @param {Array} warnings - Lista de advertencias
 * @param {string} severity - Severidad actual
 * @returns {string} - La severidad actualizada
 */
const validateStartNode = (node, warnings) => {
  if (!node.data.label) {
    warnings.push('Nodo de inicio sin etiqueta descriptiva');
    return 'warning';
  }
  return 'none';
};

const validateEndNode = (node, warnings) => {
  if (!node.data.label) {
    warnings.push('Nodo final sin etiqueta descriptiva');
    return 'warning';
  }
  return 'none';
};

const validateMessageNode = (node, errors, warnings) => {
  if (
    !node.data.message ||
    typeof node.data.message !== 'string' ||
    node.data.message.trim() === ''
  ) {
    errors.push('Mensaje vacío o inválido en nodo de mensaje');
    return 'error';
  }
  if (node.data.message.length > 500) {
    warnings.push('Mensaje excede el límite de 500 caracteres');
    return 'warning';
  }
  return 'none';
};

const validateDecisionNode = (node, errors) => {
  if (
    !node.data.conditions ||
    !Array.isArray(node.data.conditions) ||
    node.data.conditions.length === 0
  ) {
    errors.push('Nodo de decisión sin condiciones definidas');
    return 'error';
  }
  for (const condition of node.data.conditions) {
    if (
      !condition.expression ||
      typeof condition.expression !== 'string' ||
      condition.expression.trim() === ''
    ) {
      errors.push('Condición con expresión inválida o vacía');
      return 'error';
    }
    if (!condition.targetNode || typeof condition.targetNode !== 'string') {
      errors.push('Condición sin nodo de destino válido');
      return 'error';
    }
  }
  return 'none';
};

const validateActionNode = (node, errors) => {
  if (!node.data.actionType || typeof node.data.actionType !== 'string') {
    errors.push('Tipo de acción no definido en nodo de acción');
    return 'error';
  }
  if (!node.data.params || typeof node.data.params !== 'object') {
    errors.push('Parámetros no definidos en nodo de acción');
    return 'error';
  }
  return 'none';
};

const validateApiNode = (node, errors) => {
  if (
    !node.data.url ||
    typeof node.data.url !== 'string' ||
    !node.data.url.startsWith('https://')
  ) {
    errors.push('URL de API inválida o insegura (debe ser HTTPS)');
    return 'error';
  }
  if (!node.data.method || !['GET', 'POST', 'PUT', 'DELETE'].includes(node.data.method)) {
    errors.push('Método HTTP no válido en nodo de API');
    return 'error';
  }
  return 'none';
};

const validateInputNode = (node, errors) => {
  if (!node.data.inputType || typeof node.data.inputType !== 'string') {
    errors.push('Tipo de entrada no definido en nodo de entrada');
    return 'error';
  }
  if (
    !node.data.variableName ||
    typeof node.data.variableName !== 'string' ||
    node.data.variableName.trim() === ''
  ) {
    errors.push('Nombre de variable no definido en nodo de entrada');
    return 'error';
  }
  return 'none';
};

const validateFileNode = (node, errors) => {
  if (!node.data.filePath || typeof node.data.filePath !== 'string') {
    errors.push('Ruta de archivo no definida en nodo de archivo');
    return 'error';
  }
  return 'none';
};

const validateFunctionNode = (node, errors) => {
  if (!node.data.functionName || typeof node.data.functionName !== 'string') {
    errors.push('Nombre de función no definido en nodo de función');
    return 'error';
  }
  return 'none';
};

const validateIntegrationNode = (node, errors) => {
  if (!node.data.service || typeof node.data.service !== 'string') {
    errors.push('Servicio no definido en nodo de integración');
    return 'error';
  }
  return 'none';
};

const validateNoteNode = (node, warnings) => {
  if (!node.data.text || typeof node.data.text !== 'string' || node.data.text.trim() === '') {
    warnings.push('Nota vacía');
    return 'warning';
  }
  return 'none';
};

const validateSubflowNode = (node, errors) => {
  if (!node.data.subflowId || typeof node.data.subflowId !== 'string') {
    errors.push('ID de subflujo no definido');
    return 'error';
  }
  return 'none';
};

const validateDelayNode = (node, errors) => {
  if (typeof node.data.delay !== 'number' || node.data.delay <= 0) {
    errors.push('Tiempo de espera inválido en nodo de retraso');
    return 'error';
  }
  return 'none';
};

const validateSwitchNode = (node, errors) => {
  if (!node.data.variable || typeof node.data.variable !== 'string') {
    errors.push('Variable no definida en nodo switch');
    return 'error';
  }
  if (!node.data.cases || !Array.isArray(node.data.cases) || node.data.cases.length === 0) {
    errors.push('Casos no definidos en nodo switch');
    return 'error';
  }
  return 'none';
};

const nodeValidators = {
  [NODE_TYPES.start]: (node, errors, warnings) => validateStartNode(node, warnings),
  [NODE_TYPES.end]: (node, errors, warnings) => validateEndNode(node, warnings),
  [NODE_TYPES.message]: (node, errors, warnings) => validateMessageNode(node, errors, warnings),
  [NODE_TYPES.decision]: (node, errors) => validateDecisionNode(node, errors),
  [NODE_TYPES.action]: (node, errors) => validateActionNode(node, errors),
  [NODE_TYPES.api]: (node, errors) => validateApiNode(node, errors),
  [NODE_TYPES.input]: (node, errors) => validateInputNode(node, errors),
  [NODE_TYPES.file]: (node, errors) => validateFileNode(node, errors),
  [NODE_TYPES.function]: (node, errors) => validateFunctionNode(node, errors),
  [NODE_TYPES.integration]: (node, errors) => validateIntegrationNode(node, errors),
  [NODE_TYPES.note]: (node, errors, warnings) => validateNoteNode(node, warnings),
  [NODE_TYPES.subflow]: (node, errors) => validateSubflowNode(node, errors),
  [NODE_TYPES.delay]: (node, errors) => validateDelayNode(node, errors),
  [NODE_TYPES.switch]: (node, errors) => validateSwitchNode(node, errors),
};

const validateNodeByType = ({ node, errors, warnings, severity }) => {
  const validator = nodeValidators[node.type];
  let updatedSeverity = severity;

  if (validator) {
    const validationResult = validator(node, errors, warnings);
    if (validationResult === 'error') {
      updatedSeverity = 'error';
    } else if (validationResult === 'warning' && updatedSeverity !== 'error') {
      updatedSeverity = 'warning';
    }
  } else {
    warnings.push(`Tipo de nodo '${node.type}' no reconocido, validación omitida.`);
    if (updatedSeverity !== 'error') {
      updatedSeverity = 'warning';
    }
  }

  return updatedSeverity;
};

/**
 * Valida un nodo con verificaciones mejoradas y reparación automática
 * @param {Object} node - El nodo a validar
 * @returns {Object} - Resultado de validación con información detallada
 */
const validateNodeStructure = (node, errors) => {
  let hasError = false;
  if (!node.id || typeof node.id !== 'string') {
    errors.push('ID de nodo inválido o faltante');
    hasError = true;
  }
  if (!node.type || typeof node.type !== 'string') {
    errors.push('Tipo de nodo inválido o faltante');
    hasError = true;
  } else if (!Object.values(NODE_TYPES).includes(node.type)) {
    errors.push(`Tipo de nodo desconocido: ${node.type}`);
    hasError = true;
  }
  if (!node.data || typeof node.data !== 'object') {
    errors.push('Datos de nodo inválidos o faltantes');
    node.data = { label: 'Nodo sin etiqueta' }; // Fix
    hasError = true;
  }
  return hasError ? 'error' : 'none';
};

const validateNodePosition = (node, errors) => {
  let hasError = false;
  if (!node.position || typeof node.position !== 'object') {
    errors.push('Posición de nodo inválida o faltante');
    node.position = { x: 0, y: 0 }; // Fix
    return 'error';
  }
  if (typeof node.position.x !== 'number' || Number.isNaN(node.position.x)) {
    errors.push('Posición X inválida');
    node.position.x = 0; // Fix
    hasError = true;
  }
  if (typeof node.position.y !== 'number' || Number.isNaN(node.position.y)) {
    errors.push('Posición Y inválida');
    node.position.y = 0; // Fix
    hasError = true;
  }
  return hasError ? 'error' : 'none';
};

const validateNodeConnections = (node, errors, warnings) => {
  if (node.type === NODE_TYPES.decision) {
    if (!node.data.outputs || node.data.outputs.length === 0) {
      errors.push('Nodo de decisión sin conexiones de salida definidas');
      return 'error';
    }
    const uniqueOutputs = new Set(node.data.outputs.map((out) => out.id));
    if (uniqueOutputs.size !== node.data.outputs.length) {
      warnings.push('Conexiones de salida duplicadas en nodo de decisión');
      return 'warning';
    }
  }
  return 'none';
};

const validateNodeAppearance = (node, warnings) => {
  let hasWarning = false;
  if (node.width && typeof node.width !== 'number') {
    warnings.push('Ancho de nodo inválido');
    delete node.width; // Fix
    hasWarning = true;
  }
  if (node.height && typeof node.height !== 'number') {
    warnings.push('Alto de nodo inválido');
    delete node.height; // Fix
    hasWarning = true;
  }
  return hasWarning ? 'warning' : 'none';
};

const validateNodeState = (node, warnings) => {
  let hasWarning = false;
  if (node.selected !== undefined && typeof node.selected !== 'boolean') {
    warnings.push('Estado de selección inválido');
    delete node.selected; // Fix
    hasWarning = true;
  }
  if (node.dragging !== undefined && typeof node.dragging !== 'boolean') {
    warnings.push('Estado de arrastre inválido');
    delete node.dragging; // Fix
    hasWarning = true;
  }
  return hasWarning ? 'warning' : 'none';
};

export const validateNode = (node) => {
  if (!node || typeof node !== 'object') {
    return {
      valid: false,
      errors: ['Nodo no es un objeto válido'],
      warnings: [],
      severity: 'error',
      fixable: false,
    };
  }

  const errors = [];
  const warnings = [];
  let severity = 'none';

  const updateSeverity = (newSeverity) => {
    if (newSeverity === 'error') {
      severity = 'error';
    } else if (newSeverity === 'warning' && severity !== 'error') {
      severity = 'warning';
    }
  };

  updateSeverity(validateNodeStructure(node, errors));
  updateSeverity(validateNodePosition(node, errors));
  updateSeverity(validateNodeByType({ node, errors, warnings, severity }));
  updateSeverity(validateNodeConnections(node, errors, warnings));
  updateSeverity(validateNodeAppearance(node, warnings));
  updateSeverity(validateNodeState(node, warnings));

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    severity,
    fixable: errors.some((error) => error.includes('inválido') || error.includes('faltante')),
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
    .filter(
      (node) => !edges.some((edge) => edge.target === node.id) && node.type !== NODE_TYPES.start,
    )
    .map((node) => node.id);

  analysis.deadEndNodes = nodes
    .filter(
      (node) => !edges.some((edge) => edge.source === node.id) && node.type !== NODE_TYPES.end,
    )
    .map((node) => node.id);

  // Calcular complejidad del flujo
  analysis.complexity = edges.length / (nodes.length || 1);

  // Analizar rutas desde cada nodo de inicio
  for (const startNode of startNodes) {
    const routes = [];
    const cycles = [];

    explorePathRecursive(startNode.id, {
      nodes,
      edges,
      currentPath: [],
      visitedNodes: new Set(),
      routes,
      cycles,
      analysis,
    });

    // Guardar rutas y ciclos
    analysis.pathsByStartNode[startNode.id] = routes;
    analysis.cycles = [...analysis.cycles, ...cycles];
    analysis.totalRoutes += routes.length;

    // Actualizar ruta más larga
    let longestRoute = [];
    for (const route of routes) {
      if (route.length > longestRoute.length) {
        longestRoute = route;
      }
    }

    if (longestRoute.length > analysis.longestRoute.length) {
      analysis.longestRoute = {
        length: longestRoute.length,
        path: longestRoute,
      };
    }
  }

  return analysis;
};

// Helper: Verificar nodos esenciales (start/end)
function _checkEssentialNodes(nodes, suggestions) {
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
}

// Helper: Verificar nodos huérfanos
function _checkOrphanedNodes(nodes, edges, suggestions) {
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
}

// Helper: Verificar nodos sin salidas
function _checkDeadEndNodes(nodes, edges, suggestions) {
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
}

// Helper: Verificar nodos de decisión
function _checkDecisionNodes(nodes, edges, suggestions) {
  const decisionNodes = nodes.filter((node) => node.type === NODE_TYPES.decision);
  for (const node of decisionNodes) {
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
  }
}

// Helper: Verificar rutas incompletas
function _checkIncompleteRoutes(nodes, edges, suggestions) {
  const startNodes = nodes.filter((node) => node.type === NODE_TYPES.start);
  const endNodes = nodes.filter((node) => node.type === NODE_TYPES.end);

  if (startNodes.length > 0 && endNodes.length > 0) {
    const analysis = analyzeFlowRoutes(nodes, edges);

    if (analysis.incompleteRoutes > 0) {
      suggestions.push({
        description: `Hay ${analysis.incompleteRoutes} ruta(s) que no terminan en un nodo final`,
        action: {
          type: 'ANALYZE_FLOW',
          payload: { detailed: true },
        },
        severity: 'warning',
      });
    }

    if (analysis.orphanedNodes.length > 0) {
      suggestions.push({
        description: `Hay ${analysis.orphanedNodes.length} nodo(s) sin conexiones de entrada`,
        action: {
          type: 'HIGHLIGHT_NODES',
          payload: { nodeIds: analysis.orphanedNodes },
        },
        severity: 'warning',
      });
    }

    if (analysis.deadEndNodes.length > 0) {
      suggestions.push({
        description: `Hay ${analysis.deadEndNodes.length} nodo(s) sin conexiones de salida`,
        action: {
          type: 'HIGHLIGHT_NODES',
          payload: { nodeIds: analysis.deadEndNodes },
        },
        severity: 'warning',
      });
    }
  }
}

/**
 * Genera sugerencias inteligentes para mejorar el flujo
 * @param {Array} nodes - Lista de nodos
 * @param {Array} edges - Lista de aristas
 * @returns {Array} - Lista de sugerencias con acciones
 */
export const generateNodeSuggestions = (nodes, edges) => {
  const suggestions = [];

  // Verificar nodos esenciales
  _checkEssentialNodes(nodes, suggestions);

  // Verificar nodos huérfanos
  _checkOrphanedNodes(nodes, edges, suggestions);

  // Verificar nodos sin salidas
  _checkDeadEndNodes(nodes, edges, suggestions);

  // Verificar nodos de decisión
  _checkDecisionNodes(nodes, edges, suggestions);

  // Verificar rutas incompletas
  _checkIncompleteRoutes(nodes, edges, suggestions);

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

  let severity = 'none';
  if (issues.length > 0) {
    severity = 'error';
  } else if (warnings.length > 0) {
    severity = 'warning';
  }

  return {
    valid: issues.length === 0,
    issues,
    warnings,
    severity,
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
  const levels = new Map(); // Usar Map para evitar problemas de seguridad y mejorar la semántica.

  // Asignar niveles a los nodos
  const assignLevels = (nodeId, level = 0) => {
    // Guarda de seguridad para prevenir prototype pollution y asegurar la integridad del índice.
    if (typeof level !== 'number' || !Number.isInteger(level) || level < 0) {
      return;
    }

    const node = nodeMap.get(nodeId);

    // Si el nodo ya tiene un nivel asignado y es menor o igual al actual, no hacer nada
    if (node.level !== -1 && node.level <= level) {
      return;
    }

    // Asignar nivel
    node.level = level;

    // Asegurarse de que el nivel existe en el Map
    if (!levels.has(level)) {
      levels.set(level, []);
    }

    // Añadir nodo al nivel si no está ya
    const levelNodes = levels.get(level);
    if (!levelNodes.includes(nodeId)) {
      levelNodes.push(nodeId);
    }

    // Procesar nodos conectados
    const outgoingEdges = edges.filter((edge) => edge.source === nodeId);
    for (const edge of outgoingEdges) {
      assignLevels(edge.target, level + 1);
    }
  };

  // Comenzar asignación desde nodos de inicio
  for (const node of startNodes) {
    assignLevels(node.id);
  }

  // Asignar columnas dentro de cada nivel
  for (const levelNodes of levels.values()) {
    for (const [columnIndex, nodeId] of levelNodes.entries()) {
      nodeMap.get(nodeId).column = columnIndex;
    }
  }

  // Calcular nuevas posiciones
  const HORIZONTAL_SPACING = 250;
  const VERTICAL_SPACING = 150;

  const optimizedNodes = [...nodeMap.values()].map((node) => {
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
