/**
 * Sistema de caché inteligente para operaciones de flujo
 * Mejora significativamente el rendimiento de carga y guardado
 * 1. Guarda información de posicionamiento de nodos para reutilizarla
 * 2. Implementa un sistema de caducidad para datos antiguos
 * 3. Reduce operaciones I/O mediante detección de cambios reales
 */

const FLOW_CACHE_EXPIRY_HOURS = 72; // 3 días de validez
const FLOW_SIZE_THRESHOLD = 10; // Cachear flujos con más de 10 nodos
const FLOW_SAVE_DEBOUNCE = 2000; // 2 segundos de debounce para guardado

/**
 * Helper para verificar si una entrada de cache ha expirado
 * Reduce el anidamiento y mejora la legibilidad
 * @param {string} key - Clave de localStorage a verificar
 * @param {number} cutoffTime - Tiempo límite para considerar entrada como expirada
 * @returns {boolean} true si la entrada debe ser eliminada
 */
const _shouldRemoveCacheEntry = (key, cutoffTime) => {
  if (!key?.startsWith('flow_positions_')) return false;

  const cached = localStorage.getItem(key);
  if (!cached) return false;

  try {
    const cacheData = JSON.parse(cached);
    return cacheData.timestamp < cutoffTime;
  } catch {
    return true; // Eliminar entradas con JSON inválido
  }
};

// Sistema de caché de posiciones de nodos
export const nodePositionCache = {
  /**
   * Guarda las posiciones de los nodos en cache
   * @param {string} flowId - ID del flujo
   * @param {Array} nodes - Array de nodos con posiciones
   */
  savePositions(flowId, nodes) {
    if (!flowId || !nodes?.length) return;

    try {
      const cacheData = {
        positions: nodes.map((node) => ({
          id: node.id,
          x: node.position?.x ?? 0,
          y: node.position?.y ?? 0,
          type: node.type,
        })),
        timestamp: Date.now(),
        nodeCount: nodes.length,
      };

      const cacheKey = `flow_positions_${flowId}`;
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));

      // Limpiar entradas caducadas periódicamente
      this._cleanExpiredEntries();
    } catch {
      // Silenciar errores de localStorage para evitar bloqueos
    }
  },

  /**
   * Recupera las posiciones de nodos guardadas
   * @param {string} flowId - ID del flujo
   * @returns {Array|undefined} - Array de datos de posición o undefined si no hay cache
   */
  getPositions(flowId) {
    if (!flowId) return;

    try {
      const cacheKey = `flow_positions_${flowId}`;
      const cached = localStorage.getItem(cacheKey);

      if (!cached) return;

      const cacheData = JSON.parse(cached);
      const hoursOld = (Date.now() - cacheData.timestamp) / (1000 * 60 * 60);

      // Verificar si la cache ha caducado
      if (hoursOld > FLOW_CACHE_EXPIRY_HOURS) {
        localStorage.removeItem(cacheKey);
        return;
      }

      return cacheData.positions;
    } catch {}
  },

  /**
   * Aplica posiciones cacheadas a los nodos si están disponibles
   * @param {Array} nodes - Nodos del flujo
   * @param {string} flowId - ID del flujo
   * @returns {Array} - Nodos con posiciones aplicadas o los nodos originales
   */
  applyPositions(nodes, flowId) {
    const cachedPositions = this.getPositions(flowId);

    if (!cachedPositions || !nodes?.length) return nodes;

    // Aplicar posiciones cacheadas donde coincidan los IDs
    const positionMap = new Map(cachedPositions.map((pos) => [pos.id, { x: pos.x, y: pos.y }]));

    return nodes.map((node) => {
      const cachedPos = positionMap.get(node.id);
      if (cachedPos && node.type === cachedPositions.find((p) => p.id === node.id)?.type) {
        return {
          ...node,
          position: cachedPos,
        };
      }
      return node;
    });
  },

  /**
   * Limpia entradas de cache caducadas
   * @private
   */
  _cleanExpiredEntries() {
    try {
      const keysToRemove = [];
      const cutoffTime = Date.now() - FLOW_CACHE_EXPIRY_HOURS * 60 * 60 * 1000;

      for (let index = 0; index < localStorage.length; index++) {
        const key = localStorage.key(index);
        if (_shouldRemoveCacheEntry(key, cutoffTime)) {
          keysToRemove.push(key);
        }
      }

      for (const key of keysToRemove) localStorage.removeItem(key);
    } catch {
      // Silenciar errores de localStorage
    }
  },
};

/**
 * Helper para comparar longitudes de arrays de nodos y aristas
 * @param {Object} newState - Nuevo estado a comparar
 * @param {Object} oldState - Estado anterior guardado
 * @returns {boolean} true si las longitudes son iguales, false en caso contrario
 */
const _compareArrayLengths = (newState, oldState) => {
  const nodesEqual = newState.nodes?.length === oldState.nodes?.length;
  const edgesEqual = newState.edges?.length === oldState.edges?.length;
  return nodesEqual && edgesEqual;
};

/**
 * Helper para comparar propiedades individuales de nodos
 * @param {Array} newNodes - Array de nodos nuevos
 * @param {Array} oldNodes - Array de nodos anteriores
 * @returns {boolean} true si los nodos son iguales, false si hay diferencias
 */
const _compareNodeProperties = (newNodes, oldNodes) => {
  // Verificar cambios en nodos (muestreando propiedades clave)
  for (const [index, newNode] of newNodes.entries()) {
    // eslint-disable-next-line security/detect-object-injection -- index controlled by for loop bounds
    const oldNode = oldNodes[index];

    if (
      newNode.id !== oldNode.id ||
      newNode.type !== oldNode.type ||
      newNode.position.x !== oldNode.position.x ||
      newNode.position.y !== oldNode.position.y
    ) {
      return false; // Hay cambios, no omitir guardado
    }
  }
  return true; // No se detectaron cambios
};

// Sistema de ahorro de ancho de banda y operaciones I/O
export const flowStateManager = {
  lastSavedState: undefined,
  saveTimer: undefined,
  queuedState: undefined,

  /**
   * Procesa un cambio de estado para guardado eficiente
   * Implementa debounce y detección de cambios reales
   * @param {Object} state - Estado del flujo a guardar
   * @param {Function} saveFunction - Función para guardar el estado
   * @returns {boolean} - true si el guardado se programó, false si se detectó redundancia
   */
  queueSave: (state, saveFunction) => {
    if (!state || !saveFunction) return false;

    // Guardar el último estado para comparación
    flowStateManager.queuedState = state;

    // Si ya hay un guardado programado, no hacer nada más
    if (flowStateManager.saveTimer) return true;

    // Programar guardado con debounce
    flowStateManager.saveTimer = setTimeout(() => {
      const stateToSave = flowStateManager.queuedState;

      // Verificar si hay cambios significativos antes de guardar
      if (shouldSkipSave(stateToSave)) {
        flowStateManager.saveTimer = undefined;
        return;
      }

      // Ejecutar el guardado real
      saveFunction(stateToSave);

      // Actualizar referencia al último estado guardado
      flowStateManager.lastSavedState = structuredClone(stateToSave);
      flowStateManager.saveTimer = undefined;

      // Si el flujo tiene muchos nodos, cachear las posiciones
      if (stateToSave.nodes?.length >= FLOW_SIZE_THRESHOLD && stateToSave.id) {
        nodePositionCache.savePositions(stateToSave.id, stateToSave.nodes);
      }
    }, FLOW_SAVE_DEBOUNCE);

    return true;
  },

  /**
   * Cancela cualquier guardado pendiente
   */
  cancelPendingSave: () => {
    if (flowStateManager.saveTimer) {
      clearTimeout(flowStateManager.saveTimer);
      flowStateManager.saveTimer = undefined;
    }
  },

  /**
   * Ejecuta un guardado inmediato, cancelando cualquier debounce
   * @param {Object} state - Estado del flujo a guardar
   * @param {Function} saveFunction - Función para guardar el estado
   */
  saveImmediately: (state, saveFunction) => {
    flowStateManager.cancelPendingSave();
    saveFunction(state || flowStateManager.queuedState);

    // Actualizar referencia al último estado guardado
    if (state || flowStateManager.queuedState) {
      flowStateManager.lastSavedState = structuredClone(state || flowStateManager.queuedState);

      // Si el flujo tiene muchos nodos, cachear las posiciones
      const stateToCache = state || flowStateManager.queuedState;
      if (stateToCache.nodes?.length >= FLOW_SIZE_THRESHOLD && stateToCache.id) {
        nodePositionCache.savePositions(stateToCache.id, stateToCache.nodes);
      }
    }
  },
};

/**
 * Helper: Validar estados básicos
 */
function _validateStatesForComparison(currentState, lastState) {
  return !(!lastState || !currentState);
}

// Helper: Verificar cambios estructurales
function _hasStructuralChanges(currentState, lastState) {
  return (
    currentState.nodes?.length !== lastState.nodes?.length ||
    currentState.edges?.length !== lastState.edges?.length
  );
}

// Helper: Verificar cambios significativos en nodos
function _hasSignificantNodeChanges(currentState, lastState) {
  return (
    currentState.nodes &&
    lastState.nodes &&
    !_compareNodeProperties(currentState.nodes, lastState.nodes)
  );
}

/**
 * Determina si se debe omitir el guardado basado en cambios menores
 * Evita guardados innecesarios cuando solo cambian posiciones o propiedades menores
 * @param {Object} currentState - Estado actual del flujo
 * @returns {boolean} true si se debe omitir el guardado, false si debe proceder
 */
function shouldSkipSave(currentState) {
  const lastState = flowStateManager.lastSavedState;

  // Validaciones básicas
  if (!_validateStatesForComparison(currentState, lastState)) {
    return false; // Siempre guardar si no hay estado previo
  }

  // Verificar cambios estructurales
  if (_hasStructuralChanges(currentState, lastState)) {
    return false; // Cambios estructurales significativos
  }

  // Verificar cambios en longitudes usando helper existente
  if (!_compareArrayLengths(currentState, lastState)) {
    return false; // Cambios en longitudes
  }

  // Verificar cambios significativos en nodos
  return !_hasSignificantNodeChanges(currentState, lastState);
}
