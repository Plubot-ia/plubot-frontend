/**
 * Handle Stabilizer - Sistema de estabilización de handles y edges
 * Previene coordenadas fantasma y pérdida de referencias durante cambios de LOD
 */

// Cache de posiciones válidas de nodos
const nodePositionCache = new Map();

// Cache de handles registrados
const registeredHandles = new Map();

// Umbral para detectar coordenadas inválidas
const INVALID_COORD_THRESHOLD = 2000;

/**
 * Función helper para estabilizar edges con validación
 */
function createStabilizeWithValidation(nodeId, lastValidPos) {
  return (edges) => edges.map((edge) => _stabilizeEdgeWithValidation(edge, nodeId, lastValidPos));
}

/**
 * Función helper para estabilizar posiciones de edges
 */
function createStabilizePosition(nodeId, lastValidPos) {
  return (edges) => edges.map((edge) => _stabilizeEdgePosition(edge, nodeId, lastValidPos));
}

/**
 * Valida si una posición es válida (no es fantasma)
 */
export function isValidPosition(x, y) {
  return (
    !Number.isNaN(x) &&
    !Number.isNaN(y) &&
    Math.abs(x) < INVALID_COORD_THRESHOLD &&
    Math.abs(y) < INVALID_COORD_THRESHOLD
  );
}

/**
 * Obtiene la última posición válida conocida de un nodo
 */
export function getLastValidPosition(nodeId) {
  return nodePositionCache.get(nodeId) || { x: 0, y: 0 };
}

/**
 * Actualiza la posición de un nodo si es válida
 */
export function updateNodePosition(nodeId, x, y) {
  if (isValidPosition(x, y)) {
    nodePositionCache.set(nodeId, { x, y });
    return true;
  }
  return false;
}

/**
 * Registra los handles de un nodo
 */
export function registerNodeHandles(nodeId, handles) {
  if (handles && handles.length > 0) {
    registeredHandles.set(nodeId, {
      handles: [...handles],
      timestamp: Date.now(),
    });
  }
}

/**
 * Obtiene los handles registrados de un nodo
 */
export function getRegisteredHandles(nodeId) {
  const entry = registeredHandles.get(nodeId);
  return entry ? entry.handles : [];
}

/**
 * Limpia los datos de un nodo
 */
export function cleanupNode(nodeId) {
  nodePositionCache.delete(nodeId);
  registeredHandles.delete(nodeId);
}

/**
 * Helper: Estabiliza una edge individual corrigiendo coordenadas fantasma
 */
function _stabilizeEdgeWithValidation(edge, nodeId, lastValidPos) {
  if (edge.source === nodeId || edge.target === nodeId) {
    const edgeData = edge.data ?? {};
    let needsUpdate = false;
    const updatedData = { ...edgeData };

    // Validar coordenadas del source
    if (
      edge.source === nodeId &&
      edgeData.sourceX &&
      !isValidPosition(edgeData.sourceX, edgeData.sourceY)
    ) {
      updatedData.sourceX = lastValidPos.x;
      updatedData.sourceY = lastValidPos.y;
      needsUpdate = true;
    }

    // Validar coordenadas del target
    if (
      edge.target === nodeId &&
      edgeData.targetX &&
      !isValidPosition(edgeData.targetX, edgeData.targetY)
    ) {
      updatedData.targetX = lastValidPos.x;
      updatedData.targetY = lastValidPos.y;
      needsUpdate = true;
    }

    if (needsUpdate) {
      return {
        ...edge,
        data: {
          ...updatedData,
          _stabilized: Date.now(),
        },
      };
    }
  }
  return edge;
}

/**
 * Helper: Estabiliza posiciones de edge si son inválidas
 */
function _stabilizeEdgePosition(edge, nodeId, lastValidPos) {
  if (edge.source === nodeId || edge.target === nodeId) {
    const edgeData = edge.data ?? {};

    // Si detectamos coordenadas inválidas, usar la última válida
    if (edgeData.sourceX && !isValidPosition(edgeData.sourceX, edgeData.sourceY)) {
      return {
        ...edge,
        data: {
          ...edgeData,
          sourceX: lastValidPos.x,
          sourceY: lastValidPos.y,
          _stabilized: true,
        },
      };
    }

    if (edgeData.targetX && !isValidPosition(edgeData.targetX, edgeData.targetY)) {
      return {
        ...edge,
        data: {
          ...edgeData,
          targetX: lastValidPos.x,
          targetY: lastValidPos.y,
          _stabilized: true,
        },
      };
    }
  }
  return edge;
}

/**
 * Estabiliza las edges conectadas a un nodo
 * Previene saltos a coordenadas fantasma y pérdida de conexiones
 */
export function stabilizeNodeEdges(nodeId, getEdges, setEdges, updateNodeInternals) {
  // Obtener la última posición válida conocida
  const lastValidPos = getLastValidPosition(nodeId);

  // Guardar información de edges conectadas antes de actualizar
  const connectedEdges = getEdges().filter(
    (edge) => edge.source === nodeId || edge.target === nodeId,
  );

  // Actualizar internals primero
  updateNodeInternals(nodeId);

  // Doble pase de estabilización para asegurar reconexión
  requestAnimationFrame(() => {
    // Primer pase: actualizar internals nuevamente
    updateNodeInternals(nodeId);

    // Segundo pase: verificar y reconectar edges
    requestAnimationFrame(() => {
      const currentEdges = getEdges();
      const stillConnected = currentEdges.filter(
        (edge) => edge.source === nodeId || edge.target === nodeId,
      );

      // Si perdimos edges, intentar reconectarlas
      if (stillConnected.length < connectedEdges.length) {
        // Forzar actualización de internals para reconectar
        updateNodeInternals(nodeId);

        // Validar y corregir posiciones fantasma usando helper
        setEdges(createStabilizeWithValidation(nodeId, lastValidPos));
      } else {
        // Solo estabilizar posiciones si es necesario usando helper
        setEdges(createStabilizePosition(nodeId, lastValidPos));
      }
    });
  });
}

/**
 * Hook para estabilización automática de handles
 */
export function useHandleStabilization(nodeId, nodeRef, lodLevel, dependencies = {}) {
  const { updateNodeInternals, getEdges, setEdges } = dependencies;
  const stabilizationTimer = { current: undefined };

  // Efecto de estabilización
  const stabilize = () => {
    if (stabilizationTimer.current) {
      clearTimeout(stabilizationTimer.current);
    }

    stabilizationTimer.current = setTimeout(() => {
      if (nodeRef?.current) {
        const rect = nodeRef.current.getBoundingClientRect();

        // Solo actualizar si la posición es válida
        if (isValidPosition(rect.x, rect.y)) {
          updateNodePosition(nodeId, rect.x, rect.y);
        }

        // Registrar handles
        const handles = nodeRef.current.querySelectorAll('.react-flow__handle');
        if (handles.length > 0) {
          const handleData = [...handles].map((h) => ({
            id: h.dataset.handleid ?? '',
            type: h.dataset.handletype,
            position: h.dataset.handlepos,
          }));
          registerNodeHandles(nodeId, handleData);
        }

        // Estabilizar edges si es necesario
        if (updateNodeInternals && getEdges && setEdges) {
          stabilizeNodeEdges(nodeId, getEdges, setEdges, updateNodeInternals);
        }
      }
    }, 10);
  };

  return { stabilize, cleanup: () => cleanupNode(nodeId) };
}

const handleStabilizerConfig = {
  isValidPosition,
  getLastValidPosition,
  updateNodePosition,
  registerNodeHandles,
  getRegisteredHandles,
  cleanupNode,
  stabilizeNodeEdges,
  useHandleStabilization,
};

export default handleStabilizerConfig;
