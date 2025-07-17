/**
 * Sistema de cachu00e9 inteligente para operaciones de flujo
 * Mejora significativamente el rendimiento de carga y guardado
 * 1. Guarda informaciu00f3n de posicionamiento de nodos para reutilizarla
 * 2. Implementa un sistema de caducidad para datos antiguos
 * 3. Reduce operaciones de guardado redundantes
 */

const CACHE_VERSION = '1.0.0';
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 du00edas en milisegundos
const POSITION_CACHE_KEY = 'plubot_node_positions_cache';
const FLOW_SAVE_DEBOUNCE = 2000; // 2 segundos de debounce para guardar
const FLOW_SIZE_THRESHOLD = 20; // Umbral de nodos para activar cacheo

/**
 * Gestiona el cachu00e9 de posiciones de nodos
 * Esto evita que los nodos "salten" al cargar un flujo guardado
 */
export const nodePositionCache = {
  /**
   * Guarda las posiciones de los nodos en cache
   * @param {string} flowId - ID del flujo
   * @param {Array} nodes - Array de nodos con posiciones
   */
  savePositions: (flowId, nodes) => {
    if (!flowId || !nodes || nodes.length < FLOW_SIZE_THRESHOLD) return;

    try {
      // Leer cache existente
      const cachedData = localStorage.getItem(POSITION_CACHE_KEY) || '{}';
      const cache = JSON.parse(cachedData);

      // Extraer solo los datos relevantes de posicionamiento de cada nodo
      const positionData = nodes.map((node) => ({
        id: node.id,
        type: node.type,
        position: node.position,
        // Guardar algunos datos de estilo pero no el contenido completo
        style: node.style
          ? { width: node.style.width, height: node.style.height }
          : undefined,
      }));

      // Actualizar cache con timestamp para control de caducidad
      cache[flowId] = {
        timestamp: Date.now(),
        version: CACHE_VERSION,
        nodeCount: nodes.length,
        positions: positionData,
      };

      // Limpiar entradas antiguas (mu00e1s de 7 du00edas)
      const now = Date.now();
      for (const key of Object.keys(cache)) {
        if (cache[key].timestamp && now - cache[key].timestamp > CACHE_EXPIRY) {
          delete cache[key];
        }
      }

      // Guardar cache actualizado
      localStorage.setItem(POSITION_CACHE_KEY, JSON.stringify(cache));
    } catch {
      // No se pudo guardar en caché, continuar silenciosamente.
    }
  },

  /**
   * Recupera las posiciones de nodos guardadas
   * @param {string} flowId - ID del flujo
   * @returns {Array|undefined} - Array de datos de posición o undefined si no hay cache
   */
  getPositions: (flowId) => {
    if (!flowId) return;

    try {
      const cachedData = localStorage.getItem(POSITION_CACHE_KEY);
      if (!cachedData) return;

      const cache = JSON.parse(cachedData);
      const flowCache = cache[flowId];

      // Verificar si la cache existe y es válida
      if (!flowCache || flowCache.version !== CACHE_VERSION) return;

      // Verificar si la cache ha caducado
      if (Date.now() - flowCache.timestamp > CACHE_EXPIRY) {
        delete cache[flowId];
        localStorage.setItem(POSITION_CACHE_KEY, JSON.stringify(cache));
        return;
      }

      return flowCache.positions;
    } catch {
      // No se pudo leer de la caché, continuar silenciosamente.
    }
  },

  /**
   * Aplica posiciones cacheadas a los nodos si están disponibles
   * @param {Array} nodes - Nodos del flujo
   * @param {string} flowId - ID del flujo
   * @returns {Array} - Nodos con posiciones aplicadas o los nodos originales
   */
  applyPositions: (nodes, flowId) => {
    if (!nodes || !flowId) return nodes;

    const cachedPositions = nodePositionCache.getPositions(flowId);
    if (!cachedPositions) return nodes;

    // Crear un mapa para búsqueda rápida
    const positionMap = {};
    for (const item of cachedPositions) {
      positionMap[item.id] = item;
    }

    // Aplicar posiciones cacheadas a nodos existentes
    return nodes.map((node) => {
      const cachedNode = positionMap[node.id];
      if (cachedNode && node.type === cachedNode.type) {
        return {
          ...node,
          position: cachedNode.position,
          style: { ...node.style, ...cachedNode.style },
        };
      }
      return node;
    });
  },
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

      // Detectar si hay cambios significativos comparando con el último estado guardado
      if (flowStateManager.lastSavedState && stateToSave) {
        // Comparar número de nodos y aristas para detección rápida de cambios
        const nodesEqual =
          stateToSave.nodes?.length ===
          flowStateManager.lastSavedState.nodes?.length;
        const edgesEqual =
          stateToSave.edges?.length ===
          flowStateManager.lastSavedState.edges?.length;

        // Si el número es igual, hacer una comparación más profunda de algunas propiedades clave
        if (nodesEqual && edgesEqual) {
          let hasChanges = false;

          // Verificar cambios en nodos (muestreando algunas propiedades clave para rendimiento)
          for (
            let index = 0;
            index < stateToSave.nodes.length && !hasChanges;
            index++
          ) {
            const newNode = stateToSave.nodes[index];
            const oldNode = flowStateManager.lastSavedState.nodes[index];

            if (
              newNode.id !== oldNode.id ||
              newNode.type !== oldNode.type ||
              newNode.position.x !== oldNode.position.x ||
              newNode.position.y !== oldNode.position.y
            ) {
              hasChanges = true;
            }
          }

          // Si no se detectaron cambios, omitir guardado
          if (!hasChanges) {
            flowStateManager.saveTimer = undefined;
            return;
          }
        }
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
      flowStateManager.lastSavedState = structuredClone(
        state || flowStateManager.queuedState,
      );

      // Si el flujo tiene muchos nodos, cachear las posiciones
      const stateToCache = state || flowStateManager.queuedState;
      if (
        stateToCache.nodes?.length >= FLOW_SIZE_THRESHOLD &&
        stateToCache.id
      ) {
        nodePositionCache.savePositions(stateToCache.id, stateToCache.nodes);
      }
    }
  },
};

// Exportar utilidades para gestión de caché del flujo
const flowCacheManager = {
  nodePositionCache,
  flowStateManager,
};

export default flowCacheManager;
