/**
 * @file edgeHandleMigrationClean.js
 * @description Utilidad limpia para migrar edges con sourceHandle inconsistentes
 */

/**
 * Verifica si un sourceHandle tiene formato correcto
 * @param {*} sourceHandle - Handle a verificar
 * @returns {boolean} True si tiene formato correcto
 */
const hasCorrectFormat = (sourceHandle) => {
  return sourceHandle && typeof sourceHandle === 'string' && sourceHandle.startsWith('output-');
};

/**
 * Verifica si un sourceHandle es inválido
 * @param {*} sourceHandle - Handle a verificar
 * @returns {boolean} True si es inválido
 */
const isInvalidHandle = (sourceHandle) => {
  return (
    sourceHandle === undefined ||
    sourceHandle === null ||
    sourceHandle === 'null' ||
    sourceHandle === ''
  );
};

/**
 * Extrae conditionId del target de un edge
 * @param {string} target - Target del edge
 * @returns {string|undefined} ConditionId extraído
 */
const extractFromTarget = (target) => {
  if (!target || typeof target !== 'string') {
    return;
  }
  const parts = target.split('-');
  return parts[2];
};

/**
 * Extrae conditionId del ID de un edge
 * @param {string} edgeId - ID del edge
 * @returns {string|undefined} ConditionId extraído
 */
const extractFromEdgeId = (edgeId) => {
  if (!edgeId || typeof edgeId !== 'string') {
    return;
  }
  const parts = edgeId.split('-');
  return parts[2];
};

/**
 * Extrae conditionId usando múltiples estrategias
 * @param {Object} edge - Edge del cual extraer
 * @returns {string|undefined} ConditionId extraído
 */
const extractConditionId = (edge) => {
  const { sourceHandle, target, id } = edge;

  // Caso 1: sourceHandle es ID directo
  if (sourceHandle && typeof sourceHandle === 'string' && !sourceHandle.startsWith('output-')) {
    return sourceHandle;
  }

  // Caso 2: extraer del target
  const fromTarget = extractFromTarget(target);
  if (fromTarget) {
    return fromTarget;
  }

  // Caso 3: extraer del edge ID
  return extractFromEdgeId(id);
};

/**
 * Procesa un edge individual
 * @param {Object} edge - Edge a procesar
 * @param {Map} nodeMap - Mapa de nodos
 * @returns {Object} Edge migrado
 */
const processEdge = (edge, nodeMap) => {
  const migratedEdge = { ...edge };
  const sourceNode = nodeMap.get(edge.source);

  // Solo procesar edges de nodos de decisión
  if (!sourceNode || sourceNode.type !== 'decision') {
    return migratedEdge;
  }

  const { sourceHandle } = edge;

  // Si ya tiene formato correcto, no hacer nada
  if (hasCorrectFormat(sourceHandle)) {
    return migratedEdge;
  }

  // Extraer conditionId
  const conditionId = extractConditionId(edge);

  if (conditionId) {
    migratedEdge.sourceHandle = `output-${conditionId}`;
  } else if (isInvalidHandle(sourceHandle)) {
    delete migratedEdge.sourceHandle;
  }

  return migratedEdge;
};

/**
 * Migra edges para corregir sourceHandle inconsistentes
 * @param {Array} edges - Array de edges a migrar
 * @param {Array} nodes - Array de nodos para contexto
 * @returns {Array} Array de edges migrados
 */
export const migrateEdgeHandles = (edges, nodes) => {
  if (!edges || !Array.isArray(edges)) {
    return [];
  }

  // Crear mapa de nodos por ID
  const nodeMap = new Map();
  if (nodes && Array.isArray(nodes)) {
    for (const node of nodes) {
      nodeMap.set(node.id, node);
    }
  }

  return edges.map((edge) => processEdge(edge, nodeMap));
};
