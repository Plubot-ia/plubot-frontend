/**
 * Utilidades para la recuperación y persistencia de aristas en ReactFlow
 * Diseñado para resolver el problema de aristas que desaparecen
 */
import { fixAllEdgeHandles, nodesExistInDOM } from './handleFixer';

/**
 * Recupera aristas desde localStorage usando múltiples formatos de clave
 * @param {string} plubotId - ID del plubot
 * @returns {Array} - Aristas recuperadas o array vacío
 */
// Variable para controlar la frecuencia de recuperación
let lastRecoveryAttempt = 0;
const recoveryThrottleMs = 60_000; // Limitar a una recuperación cada 60 segundos

/**
 * Intenta parsear aristas desde localStorage con un key específico
 * @param {string} key - Clave de localStorage
 * @returns {Array} Aristas parseadas o array vacío
 */
function tryParseEdgesFromStorage(key) {
  try {
    const storedData = localStorage.getItem(key);
    if (!storedData) return [];

    const parsedEdges = JSON.parse(storedData);
    return Array.isArray(parsedEdges) && parsedEdges.length > 0 ? parsedEdges : [];
  } catch {
    return [];
  }
}

/**
 * Verifica si una arista es válida
 * @param {Object} edge - Arista a validar
 * @returns {boolean} True si la arista es válida
 */
function isValidEdge(edge) {
  return edge && edge.id && edge.source && edge.target;
}

/**
 * Verifica si debe continuar con la recuperación basándose en throttling
 * @returns {boolean} True si puede continuar
 */
function canContinueRecovery() {
  const now = Date.now();
  if (now - lastRecoveryAttempt < recoveryThrottleMs) {
    return false;
  }
  lastRecoveryAttempt = now;
  return true;
}

export const recoverEdgesFromLocalStorage = (plubotId) => {
  if (!plubotId) return [];
  if (!canContinueRecovery()) return [];

  try {
    // Intentar con clave genérica primero
    let recoveredEdges = tryParseEdgesFromStorage('plubot-flow-edges');

    // Si no hay resultados, intentar con clave específica
    if (recoveredEdges.length === 0) {
      recoveredEdges = tryParseEdgesFromStorage(`plubot-edges-${plubotId}`);
    }

    // Procesar aristas si se encontraron
    if (recoveredEdges.length > 0) {
      const filteredEdges = recoveredEdges.filter((edge) => isValidEdge(edge));
      return fixAllEdgeHandles(filteredEdges);
    }

    return [];
  } catch {
    return [];
  }
};

/**
 * Guarda aristas en localStorage usando múltiples formatos de clave para mayor compatibilidad
 * @param {string} plubotId - ID del plubot
 * @param {Array} edges - Aristas a guardar
 */
// Variable para controlar la frecuencia de guardado
let lastSaveAttempt = 0;
const saveThrottleMs = 10_000; // Limitar a un guardado cada 10 segundos

export const saveEdgesToLocalStorage = (plubotId, edges) => {
  if (!plubotId || !edges || !Array.isArray(edges)) return;

  // Limitar la frecuencia de guardado
  const now = Date.now();
  if (now - lastSaveAttempt < saveThrottleMs) {
    // No mostrar mensaje para evitar spam en la consola
    return;
  }

  lastSaveAttempt = now;

  try {
    // Filtrar aristas cuyos nodos no existen en el DOM
    const validEdges = edges.filter((edge) => {
      const exists = nodesExistInDOM(edge);
      if (!exists && edge && edge.id) {
        // Log de arista inválida disponible para debugging
      }
      return exists;
    });

    if (validEdges.length !== edges.length) {
      // Se encontraron aristas inválidas - serán filtradas
    }

    // Corregir los handles de las aristas válidas antes de guardarlas
    const fixedEdges = fixAllEdgeHandles(validEdges);

    // Convertir a JSON
    const edgesJSON = JSON.stringify(fixedEdges);

    // Guardar en ambos formatos para mayor compatibilidad
    localStorage.setItem(`plubot-edges-${plubotId}`, edgesJSON);
    localStorage.setItem('plubot-flow-edges', edgesJSON);
    localStorage.setItem('plubot-flow-edges-timestamp', Date.now().toString());
  } catch {
    // En caso de error con la corrección, intentar guardar las aristas originales
    try {
      const edgesJSON = JSON.stringify(edges);
      localStorage.setItem(`plubot-edges-${plubotId}`, edgesJSON);
    } catch {
      // Error al guardar aristas como fallback
    }
  }
};

/**
 * Fuerza la actualización visual de las aristas
 */
// Variable para controlar la frecuencia de actualizaciones visuales
let lastVisualUpdate = 0;
const visualUpdateThrottleMs = 15_000; // Limitar a una actualización cada 15 segundos

/**
 * Verifica si debe continuar con la actualización visual basándose en throttling
 * @returns {boolean} True si puede continuar
 */
function canContinueVisualUpdate() {
  const now = Date.now();
  if (now - lastVisualUpdate < visualUpdateThrottleMs) {
    return false;
  }
  lastVisualUpdate = now;
  return true;
}

/**
 * Procesa y corrige aristas válidas
 * @param {Array} edges - Aristas a procesar
 * @param {number} timestamp - Timestamp actual
 * @returns {boolean} True si se corrigieron handles
 */
function processAndFixEdges(edges, timestamp) {
  try {
    const validEdges = edges.filter((edge) => {
      const exists = nodesExistInDOM(edge);
      if (!exists) {
        // Arista inválida detectada - será filtrada
      }
      return exists;
    });

    if (validEdges.length !== edges.length) {
      // Aristas inválidas encontradas - continuando con las válidas
    }

    const fixedEdges = fixAllEdgeHandles(validEdges);

    // Emitir evento si hay cambios
    if (JSON.stringify(fixedEdges) !== JSON.stringify(edges)) {
      document.dispatchEvent(
        new CustomEvent('edges-fixed', {
          detail: {
            edges: fixedEdges,
            timestamp,
            validEdgesOnly: true,
          },
        }),
      );
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Emite evento de actualización para EliteEdge
 * @param {number} timestamp - Timestamp actual
 * @param {boolean} fixedHandles - Si se corrigieron handles
 */
function emitEliteEdgeUpdateEvent(timestamp, fixedHandles) {
  document.dispatchEvent(
    new CustomEvent('elite-edge-update-required', {
      detail: {
        allEdges: true,
        timestamp,
        forced: true,
        fixedHandles,
      },
    }),
  );
}

/**
 * Fuerza repintado del viewport con transformación temporal
 */
function forceViewportRepaint() {
  setTimeout(() => {
    const reactFlowViewport = document.querySelector('.react-flow__viewport');
    if (!reactFlowViewport) return;

    const { transform } = reactFlowViewport.style;
    if (transform) {
      reactFlowViewport.style.transform = `${transform} scale(0.9999)`;
      setTimeout(() => {
        reactFlowViewport.style.transform = transform;
      }, 50);
    }
  }, 100);
}

export const forceEdgeVisualUpdate = (edges) => {
  if (!canContinueVisualUpdate()) return;

  const now = Date.now();
  let fixedHandles = false;

  // Procesar aristas si se proporcionaron
  if (edges && Array.isArray(edges) && edges.length > 0) {
    fixedHandles = processAndFixEdges(edges, now);
  }

  // Emitir evento de actualización
  emitEliteEdgeUpdateEvent(now, fixedHandles);

  // Forzar repintado del viewport
  forceViewportRepaint();
};

/**
 * Restaura las aristas desde localStorage y las aplica al estado
 * @param {string} plubotId - ID del plubot
 * @param {Function} setEdges - Función para establecer las aristas
 */
// Variable para controlar la frecuencia de restauración
let lastRestoreAttempt = 0;
const restoreThrottleMs = 30_000; // Limitar a una restauración cada 30 segundos

export const restoreAndApplyEdges = (plubotId, setEdges) => {
  // Limitar la frecuencia de restauración
  const now = Date.now();
  if (now - lastRestoreAttempt < restoreThrottleMs) {
    return false;
  }

  lastRestoreAttempt = now;

  const recoveredEdges = recoverEdgesFromLocalStorage(plubotId);

  if (recoveredEdges.length > 0) {
    // Verificar si setEdges está disponible
    if (setEdges) {
      // Usar un timeout para dar tiempo al sistema a estabilizarse
      setTimeout(() => {
        setEdges(recoveredEdges);
      }, 100);
    } else {
      // No se requiere recuperación - aristas ya válidas
    }

    return true;
  }

  return false;
};
