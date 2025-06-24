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
      const positionData = nodes.map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        // Guardar algunos datos de estilo pero no el contenido completo
        style: node.style ? { width: node.style.width, height: node.style.height } : undefined,
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
      Object.keys(cache).forEach(key => {
        if (cache[key].timestamp && (now - cache[key].timestamp > CACHE_EXPIRY)) {
          delete cache[key];
        }
      });

      // Guardar cache actualizado
      localStorage.setItem(POSITION_CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      // No se pudo guardar en caché, continuar silenciosamente.
    }
  },

  /**
   * Recupera las posiciones de nodos guardadas
   * @param {string} flowId - ID del flujo
   * @returns {Array|null} - Array de datos de posiciu00f3n o null si no hay cache
   */
  getPositions: (flowId) => {
    if (!flowId) return null;

    try {
      const cachedData = localStorage.getItem(POSITION_CACHE_KEY);
      if (!cachedData) return null;

      const cache = JSON.parse(cachedData);
      const flowCache = cache[flowId];

      // Verificar si la cache existe y es vu00e1lida
      if (!flowCache || flowCache.version !== CACHE_VERSION) return null;

      // Verificar si la cache ha caducado
      if (Date.now() - flowCache.timestamp > CACHE_EXPIRY) {
        delete cache[flowId];
        localStorage.setItem(POSITION_CACHE_KEY, JSON.stringify(cache));
        return null;
      }

      return flowCache.positions;
    } catch (error) {
      // No se pudo leer de la caché, continuar silenciosamente.
      return null;
    }
  },

  /**
   * Aplica posiciones cacheadas a los nodos si estu00e1n disponibles
   * @param {Array} nodes - Nodos del flujo
   * @param {string} flowId - ID del flujo
   * @returns {Array} - Nodos con posiciones aplicadas o los nodos originales
   */
  applyPositions: (nodes, flowId) => {
    if (!nodes || !flowId) return nodes;

    const cachedPositions = nodePositionCache.getPositions(flowId);
    if (!cachedPositions) return nodes;

    // Crear un mapa para bu00fasqueda ru00e1pida
    const positionMap = {};
    cachedPositions.forEach(item => {
      positionMap[item.id] = item;
    });

    // Aplicar posiciones cacheadas a nodos existentes
    return nodes.map(node => {
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
  lastSavedState: null,
  saveTimer: null,
  queuedState: null,

  /**
   * Procesa un cambio de estado para guardado eficiente
   * Implementa debounce y detecciu00f3n de cambios reales
   * @param {Object} state - Estado del flujo a guardar
   * @param {Function} saveFunction - Funciu00f3n para guardar el estado
   * @returns {boolean} - true si el guardado se programu00f3, false si se detectu00f3 redundancia
   */
  queueSave: (state, saveFunction) => {
    if (!state || !saveFunction) return false;

    // Guardar el u00faltimo estado para comparaciu00f3n
    flowStateManager.queuedState = state;

    // Si ya hay un guardado programado, no hacer nada mu00e1s
    if (flowStateManager.saveTimer) return true;

    // Programar guardado con debounce
    flowStateManager.saveTimer = setTimeout(() => {
      const stateToSave = flowStateManager.queuedState;

      // Detectar si hay cambios significativos comparando con el u00faltimo estado guardado
      if (flowStateManager.lastSavedState && stateToSave) {
        // Comparar nu00famero de nodos y aristas para deteccciu00f3n ru00e1pida de cambios
        const nodesEqual = stateToSave.nodes?.length === flowStateManager.lastSavedState.nodes?.length;
        const edgesEqual = stateToSave.edges?.length === flowStateManager.lastSavedState.edges?.length;

        // Si el nu00famero es igual, hacer una comparaciu00f3n mu00e1s profunda de algunas propiedades clave
        if (nodesEqual && edgesEqual) {
          let hasChanges = false;

          // Verificar cambios en nodos (muestreando algunas propiedades clave para rendimiento)
          for (let i = 0; i < stateToSave.nodes.length && !hasChanges; i++) {
            const newNode = stateToSave.nodes[i];
            const oldNode = flowStateManager.lastSavedState.nodes[i];

            if (newNode.id !== oldNode.id ||
                newNode.type !== oldNode.type ||
                newNode.position.x !== oldNode.position.x ||
                newNode.position.y !== oldNode.position.y) {
              hasChanges = true;
            }
          }

          // Si no se detectaron cambios, omitir guardado
          if (!hasChanges) {
            flowStateManager.saveTimer = null;
            return;
          }
        }
      }

      // Ejecutar el guardado real
      saveFunction(stateToSave);

      // Actualizar referencia al u00faltimo estado guardado
      flowStateManager.lastSavedState = JSON.parse(JSON.stringify(stateToSave));
      flowStateManager.saveTimer = null;

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
      flowStateManager.saveTimer = null;
    }
  },

  /**
   * Ejecuta un guardado inmediato, cancelando cualquier debounce
   * @param {Object} state - Estado del flujo a guardar
   * @param {Function} saveFunction - Funciu00f3n para guardar el estado
   */
  saveImmediately: (state, saveFunction) => {
    flowStateManager.cancelPendingSave();
    saveFunction(state || flowStateManager.queuedState);

    // Actualizar referencia al u00faltimo estado guardado
    if (state || flowStateManager.queuedState) {
      flowStateManager.lastSavedState = JSON.parse(JSON.stringify(state || flowStateManager.queuedState));

      // Si el flujo tiene muchos nodos, cachear las posiciones
      const stateToCache = state || flowStateManager.queuedState;
      if (stateToCache.nodes?.length >= FLOW_SIZE_THRESHOLD && stateToCache.id) {
        nodePositionCache.savePositions(stateToCache.id, stateToCache.nodes);
      }
    }
  },
};

// Exportar utilidades para gestiu00f3n de cachu00e9 del flujo
export default {
  nodePositionCache,
  flowStateManager,
};
