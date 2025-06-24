/**
 * Utilidad para corregir los handles de las aristas
 * 
 * Este archivo contiene funciones para asegurar que los handles de las aristas
 * sean consistentes entre el frontend y el backend.
 */

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
  } catch (error) {
    return false;
  }
};

/**
 * Obtiene un handle válido para un nodo
 * @param {string} nodeId - ID del nodo
 * @param {string} preferredHandle - Handle preferido
 * @returns {string} - Handle válido a usar
 */
const getValidHandle = (nodeId, preferredHandle) => {
  if (isValidHandle(nodeId, preferredHandle)) {
    return preferredHandle;
  }
  
  // Si el handle preferido no es válido, buscar cualquier handle disponible
  try {
    const nodeElement = document.querySelector(`[data-id="${nodeId}"]`);
    if (!nodeElement) return 'default';
    
    const handles = nodeElement.querySelectorAll('[data-handleid]');
    if (handles.length > 0) {
      return handles[0].getAttribute('data-handleid');
    }
  } catch (error) {}
  
  return 'default';
};

/**
 * Normaliza los handles de una arista para asegurar compatibilidad
 * OPTIMIZADO: Elimina logs excesivos y mejora eficiencia
 * @param {Object} edge - La arista a normalizar
 * @returns {Object|null} - La arista con handles normalizados o null si no es válida
 */
export const normalizeEdgeHandles = (edge) => {
  // Validación eficiente sin logs excesivos
  if (!edge || !edge.id || !edge.source || !edge.target) {
    // Solo loguear en desarrollo y sin volcado de datos completo
    if (process.env.NODE_ENV === 'development') {

    }
    return null;
  }

  // Optimización: Si ya tiene los handles correctos, devolver la misma referencia
  // Esto evita crear objetos innecesarios y mejora rendimiento
  if (edge.sourceHandle && edge.targetHandle) {
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
  
  // Eliminar log excesivo para mejorar rendimiento
  // Solo loguear en desarrollo y con nivel de detalle bajo
  if (process.env.NODE_ENV === 'development' && Math.random() < 0.05) { // Solo 5% de las veces

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
  const fixedEdges = edges.map(edge => normalizeEdgeHandles(edge)).filter(Boolean);
  
  // Si se perdieron aristas en el proceso, registrarlo

  
  return fixedEdges;
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
    const currentEdges = rfInstance.getEdges() || [];
    
    if (currentEdges.length === 0) {

      return;
    }
    
    // Filtrar aristas cuyos nodos existen en el DOM
    const validEdges = currentEdges.filter(edge => {
      const exists = nodesExistInDOM(edge);
      if (!exists) {
        return null; // Ignorar esta arista
      }
      return exists;
    });
    
    if (validEdges.length !== currentEdges.length) {

    }
    
    // Forzar explicitamente el uso de handles 'default' para todas las aristas
    const forcedEdges = validEdges.map(edge => ({
      ...edge,
      sourceHandle: 'default',
      targetHandle: 'default'
    }));
    
    // Actualizar las aristas en ReactFlow
    rfInstance.setEdges(forcedEdges);
    

    
    // Emitir un evento para notificar que se actualizaron las aristas
    document.dispatchEvent(new CustomEvent('edges-updated', { 
      detail: { 
        count: forcedEdges.length,
        timestamp: Date.now(),
        forcedHandles: true
      } 
    }));
    
    // Emitir un evento adicional para forzar la actualización visual de las aristas
    document.dispatchEvent(new CustomEvent('elite-edge-update-required', { 
      detail: { 
        allEdges: true,
        timestamp: Date.now(),
        forced: true,
        fixedHandles: true,
        validEdgesOnly: true
      } 
    }));
    
    // Programar una segunda actualización después de un breve retraso
    // para asegurar que los cambios se apliquen correctamente
    setTimeout(() => {
      rfInstance.setEdges(forcedEdges);
    }, 100);
  } catch (error) {}
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
  if (edge.sourceHandle === undefined || edge.sourceHandle === null) {
    edge.sourceHandle = 'default';
  } else {
    edge.sourceHandle = String(edge.sourceHandle);
  }
  
  if (edge.targetHandle === undefined || edge.targetHandle === null) {
    edge.targetHandle = 'default';
  } else {
    edge.targetHandle = String(edge.targetHandle);
  }
  
  // Verificar que los nodos existan en el DOM
  const sourceExists = document.querySelector(`[data-id="${edge.source}"]`) !== null;
  const targetExists = document.querySelector(`[data-id="${edge.target}"]`) !== null;
  
  if (!sourceExists || !targetExists) {
    return false;
  }
  
  return true;
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
  
  return !!sourceExists && !!targetExists;
};

/**
 * Corrige las aristas antes de enviarlas al backend
 * @param {Array} edges - Aristas a corregir
 * @returns {Array} - Aristas corregidas
 */
export const prepareEdgesForBackend = (edges) => {
  if (!edges || !Array.isArray(edges)) return [];
  
  return edges.map(edge => {
    if (!edge) return null;
    
    // Crear una copia para no modificar el original
    const preparedEdge = { ...edge };
    
    // Asegurar que sourceHandle y targetHandle tengan valores válidos
    preparedEdge.sourceHandle = preparedEdge.sourceHandle || 'default';
    preparedEdge.targetHandle = preparedEdge.targetHandle || 'default';
    
    // Guardar los IDs originales para referencia
    preparedEdge.sourceOriginal = preparedEdge.sourceOriginal || preparedEdge.source;
    preparedEdge.targetOriginal = preparedEdge.targetOriginal || preparedEdge.target;
    
    return preparedEdge;
  }).filter(Boolean);
};

/**
 * Corrige las aristas recibidas del backend
 * @param {Array} edges - Aristas recibidas del backend
 * @returns {Array} - Aristas corregidas
 */
export const processEdgesFromBackend = (edges) => {
  if (!edges || !Array.isArray(edges)) return [];
  
  return edges.map(edge => {
    if (!edge) return null;
    
    // Crear una copia para no modificar el original
    const processedEdge = { ...edge };
    
    // Asegurar que sourceHandle y targetHandle tengan valores válidos
    processedEdge.sourceHandle = processedEdge.sourceHandle || 'default';
    processedEdge.targetHandle = processedEdge.targetHandle || 'default';
    
    // Asegurar que type sea 'default' si no está definido
    processedEdge.type = processedEdge.type || 'default';
    
    return processedEdge;
  }).filter(Boolean);
};
