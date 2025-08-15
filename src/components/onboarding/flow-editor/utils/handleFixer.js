/**
 * Utilidad para corregir los handles de las aristas
 *
 * Este archivo contiene funciones para asegurar que los handles de las aristas
 * sean consistentes entre el frontend y el backend.
 */

import {
  normalizeSourceHandle,
  DEFAULT_SOURCE_HANDLE,
  DEFAULT_TARGET_HANDLE,
} from '../../../../config/handleConfig';

/**
 * Verifica si un handle es válido para un nodo
 * @param {string} nodeId - ID del nodo
 * @param {string} handleId - ID del handle a verificar
 * @returns {boolean} - true si el handle es válido
 */
const isValidHandle = (nodeId, handleId) => {
  if (!nodeId || !handleId) return false;

  try {
    // Buscar el nodo en el DOM
    const nodeElement = document.querySelector(`[data-id="${nodeId}"]`);
    if (!nodeElement) return false;

    // Verificar si el handle existe en el nodo
    const handleElement = nodeElement.querySelector(`[data-handleid="${handleId}"]`);
    return handleElement !== null;
  } catch {
    return false;
  }
};

/**
 * Obtiene un handle válido para un nodo
 * @param {string} nodeId - ID del nodo
 * @param {string} preferredHandle - Handle preferido
 * @returns {string} - Handle válido a usar
 */
const _getValidHandle = (nodeId, preferredHandle) => {
  if (isValidHandle(nodeId, preferredHandle)) {
    return preferredHandle;
  }

  // Si el handle preferido no es válido, buscar cualquier handle disponible
  try {
    const nodeElement = document.querySelector(`[data-id="${nodeId}"]`);
    if (!nodeElement) return DEFAULT_SOURCE_HANDLE;

    const handles = nodeElement.querySelectorAll('[data-handleid]');
    if (handles.length > 0) {
      return handles[0].dataset.handleid;
    }
  } catch {}

  return DEFAULT_SOURCE_HANDLE;
};

/**
 * Valida que una arista tenga las propiedades esenciales.
 * @param {Object} edge - La arista a validar.
 * @returns {boolean} - true si la arista es válida.
 */
function isValidEdge(edge) {
  return edge && edge.id && edge.source && edge.target;
}

/**
 * Verifica si una arista ya tiene handles completos.
 * @param {Object} edge - La arista a verificar.
 * @returns {boolean} - true si tiene ambos handles.
 */
function hasCompleteHandles(edge) {
  return edge.sourceHandle && edge.targetHandle;
}

/**
 * Normaliza los handles de una arista para asegurar compatibilidad
 * OPTIMIZADO: Elimina logs excesivos y mejora eficiencia
 * @param {Object} edge - La arista a normalizar
 * @returns {Object|null} - La arista con handles normalizados o null si no es válida
 */
export const normalizeEdgeHandles = (edge) => {
  // Validación eficiente sin logs excesivos
  if (!isValidEdge(edge)) {
    return;
  }

  // Optimización: Si ya tiene los handles correctos, devolver la misma referencia
  // Esto evita crear objetos innecesarios y mejora rendimiento
  if (hasCompleteHandles(edge)) {
    return edge;
  }

  // Crear nuevo objeto solo cuando sea necesario
  const newEdge = { ...edge };

  // Asignar handles por defecto solo cuando faltan
  if (!newEdge.sourceHandle) newEdge.sourceHandle = 'output';
  if (!newEdge.targetHandle) newEdge.targetHandle = 'input';

  // Si es una arista de bucle (source = target), asegurar handles diferentes
  if (newEdge.source === newEdge.target && newEdge.sourceHandle === newEdge.targetHandle) {
    newEdge.targetHandle = `${newEdge.targetHandle}-alt`;
  }

  return newEdge;
};

/**
 * Corrige los handles de todas las aristas en un array
 * @param {Array} edges - Array de aristas a corregir
 * @returns {Array} - Array de aristas con handles corregidos
 */
export const fixAllEdgeHandles = (edges) => {
  if (!edges || !Array.isArray(edges)) {
    return [];
  }

  // Normalizar todas las aristas y filtrar las nulas
  const fixedEdges = edges.map((edge) => normalizeEdgeHandles(edge)).filter(Boolean);

  // Si se perdieron aristas en el proceso, registrarlo

  return fixedEdges;
};

/**
 * Verifica si una arista tiene handles válidos
 * @param {Object} edge - La arista a verificar
 * @returns {boolean} - true si la arista tiene handles válidos
 */
const hasValidHandles = (edge) => {
  if (!edge) {
    return false;
  }

  // Verificar que la arista tenga los campos mínimos requeridos
  if (!edge.id) {
    return false;
  }

  if (!edge.source || !edge.target) {
    return false;
  }

  // Convertir a string para asegurar consistencia
  edge.source = String(edge.source);
  edge.target = String(edge.target);

  // Asegurar que los handles sean strings
  edge.sourceHandle =
    edge.sourceHandle === undefined || edge.sourceHandle === null
      ? 'default'
      : String(edge.sourceHandle);

  edge.targetHandle =
    edge.targetHandle === undefined || edge.targetHandle === null
      ? 'default'
      : String(edge.targetHandle);

  // Verificar que los nodos existan en el DOM
  const sourceExists = document.querySelector(`[data-id="${edge.source}"]`) !== null;
  const targetExists = document.querySelector(`[data-id="${edge.target}"]`) !== null;

  return sourceExists && targetExists;
};

/**
 * Verifica si los nodos de una arista existen en el DOM
 * @param {Object} edge - La arista a verificar
 * @returns {boolean} - true si ambos nodos existen
 */
export const nodesExistInDOM = (edge) => {
  if (!edge || !edge.source || !edge.target) return false;

  // Verificar si los nodos existen en el DOM
  const sourceExists = document.querySelector(`.react-flow__node[data-id="${edge.source}"]`);
  const targetExists = document.querySelector(`.react-flow__node[data-id="${edge.target}"]`);

  return Boolean(sourceExists) && Boolean(targetExists);
};

/**
 * Fuerza la actualización visual de las aristas en ReactFlow
 * @param {Object} rfInstance - Instancia de ReactFlow
 */
export const forceEdgesUpdate = (rfInstance) => {
  if (!rfInstance) {
    return;
  }

  try {
    // Obtener las aristas actuales
    const currentEdges = rfInstance.getEdges() ?? [];

    if (currentEdges.length === 0) {
      return;
    }

    // Filtrar aristas cuyos nodos existen en el DOM
    const validEdges = currentEdges.filter(
      (edge) => nodesExistInDOM(edge) && hasValidHandles(edge),
    );
    if (validEdges.length === 0) return;

    // Forzar explicitamente el uso de handles por defecto para todas las aristas
    const forcedEdges = validEdges.map((edge) => ({
      ...edge,
      sourceHandle: DEFAULT_SOURCE_HANDLE,
      targetHandle: DEFAULT_TARGET_HANDLE,
    }));

    // Actualizar las aristas en ReactFlow
    rfInstance.setEdges(forcedEdges);

    // Emitir un evento para notificar que se actualizaron las aristas
    document.dispatchEvent(
      new CustomEvent('edges-updated', {
        detail: {
          count: forcedEdges.length,
          timestamp: Date.now(),
          forcedHandles: true,
        },
      }),
    );

    // Emitir un evento adicional para forzar la actualización visual de las aristas
    document.dispatchEvent(
      new CustomEvent('elite-edge-update-required', {
        detail: {
          allEdges: true,
          timestamp: Date.now(),
          forced: true,
          fixedHandles: true,
          validEdgesOnly: true,
        },
      }),
    );

    // Programar una segunda actualización después de un breve retraso
    // para asegurar que los cambios se apliquen correctamente
    setTimeout(() => {
      rfInstance.setEdges(forcedEdges);
    }, 100);
  } catch {}
};

/**
 * Corrige las aristas antes de enviarlas al backend
 * @param {Array} edges - Aristas a corregir
 * @returns {Array} - Aristas corregidas
 */
export const prepareEdgesForBackend = (edges) => {
  if (!edges || !Array.isArray(edges)) return [];

  return edges
    .map((edge) => {
      if (!edge) return;

      // Crear una copia para no modificar el original
      const preparedEdge = { ...edge };

      // Asegurar que sourceHandle y targetHandle tengan valores válidos
      preparedEdge.sourceHandle = normalizeSourceHandle(preparedEdge.sourceHandle);
      preparedEdge.targetHandle = preparedEdge.targetHandle || DEFAULT_TARGET_HANDLE;

      // Guardar los IDs originales para referencia
      preparedEdge.sourceOriginal = preparedEdge.sourceOriginal || preparedEdge.source;
      preparedEdge.targetOriginal = preparedEdge.targetOriginal || preparedEdge.target;

      return preparedEdge;
    })
    .filter(Boolean);
};

/**
 * Corrige las aristas recibidas del backend
 * @param {Array} edges - Aristas recibidas del backend
 * @returns {Array} - Aristas corregidas
 */
export const processEdgesFromBackend = (edges) => {
  if (!edges || !Array.isArray(edges)) return [];

  return edges
    .map((edge) => {
      if (!edge) return;

      // Crear una copia para no modificar el original
      const processedEdge = { ...edge };

      // Asegurar que sourceHandle y targetHandle tengan valores válidos
      processedEdge.sourceHandle = normalizeSourceHandle(processedEdge.sourceHandle);
      processedEdge.targetHandle = processedEdge.targetHandle || DEFAULT_TARGET_HANDLE;

      // Asegurar que type sea 'default' si no está definido
      processedEdge.type = processedEdge.type || 'default';

      return processedEdge;
    })
    .filter(Boolean);
};
