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
const recoveryThrottleMs = 60000; // Limitar a una recuperación cada 60 segundos

export const recoverEdgesFromLocalStorage = (plubotId) => {
  if (!plubotId) return [];
  
  // Limitar la frecuencia de recuperación
  const now = Date.now();
  if (now - lastRecoveryAttempt < recoveryThrottleMs) {
    return [];
  }
  
  lastRecoveryAttempt = now;
  
  try {
    // Intentar primero el formato estándar de localStorage
    let recoveredEdges = [];
    
    // Probar primero con la clave genérica de respaldo
    const genericStoredEdges = localStorage.getItem('plubot-flow-edges');
    if (genericStoredEdges) {
      try {
        const parsedEdges = JSON.parse(genericStoredEdges);
        if (Array.isArray(parsedEdges) && parsedEdges.length > 0) {
          recoveredEdges = parsedEdges;
        }
      } catch (e) {
      }
    }
    
    // Si no se encontraron aristas, intentar con la clave específica del plubot
    if (recoveredEdges.length === 0) {
      const keyFormat = `plubot-edges-${plubotId}`;
      const storedEdges = localStorage.getItem(keyFormat);
      
      if (storedEdges) {
        try {
          const parsedEdges = JSON.parse(storedEdges);
          if (Array.isArray(parsedEdges) && parsedEdges.length > 0) {
            recoveredEdges = parsedEdges;
          }
        } catch (e) {
        }
      }
    }
    
    // Si se encontraron aristas, filtrarlas y corregir sus handles
    if (recoveredEdges.length > 0) {
      // Filtrar aristas válidas (que tengan id, source y target)
      const filteredEdges = recoveredEdges.filter(edge => 
        edge && edge.id && edge.source && edge.target
      );
      
      // Corregir los handles de las aristas filtradas
      const fixedEdges = fixAllEdgeHandles(filteredEdges);
      
      return fixedEdges;
    }
    
    return [];
  } catch (error) {
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
const saveThrottleMs = 10000; // Limitar a un guardado cada 10 segundos

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
    const validEdges = edges.filter(edge => {
      const exists = nodesExistInDOM(edge);
      if (!exists && edge && edge.id) {
      }
      return exists;
    });
    
    if (validEdges.length !== edges.length) {
    }
    
    // Corregir los handles de las aristas válidas antes de guardarlas
    const fixedEdges = fixAllEdgeHandles(validEdges);
    
    // Convertir a JSON
    const edgesJSON = JSON.stringify(fixedEdges);
    
    // Guardar en ambos formatos para mayor compatibilidad
    localStorage.setItem(`plubot-edges-${plubotId}`, edgesJSON);
    localStorage.setItem('plubot-flow-edges', edgesJSON);
    localStorage.setItem('plubot-flow-edges-timestamp', Date.now().toString());
  } catch (error) {
    // En caso de error con la corrección, intentar guardar las aristas originales
    try {
      const edgesJSON = JSON.stringify(edges);
      localStorage.setItem(`plubot-edges-${plubotId}`, edgesJSON);
    } catch (backupError) {
    }
  }
};

/**
 * Fuerza la actualización visual de las aristas
 */
// Variable para controlar la frecuencia de actualizaciones visuales
let lastVisualUpdate = 0;
const visualUpdateThrottleMs = 15000; // Limitar a una actualización cada 15 segundos

export const forceEdgeVisualUpdate = (edges) => {
  // Limitar la frecuencia de actualizaciones
  const now = Date.now();
  if (now - lastVisualUpdate < visualUpdateThrottleMs) {
    return; // Evitar actualizaciones demasiado frecuentes
  }
  
  lastVisualUpdate = now;
  
  // Si se proporcionaron aristas, filtrar las válidas y corregir sus handles antes de emitir el evento
  let fixedHandles = false;
  if (edges && Array.isArray(edges) && edges.length > 0) {
    try {
      // Filtrar aristas cuyos nodos no existen en el DOM
      const validEdges = edges.filter(edge => {
        const exists = nodesExistInDOM(edge);
        if (!exists) {
        }
        return exists;
      });
      
      if (validEdges.length !== edges.length) {
      }
      
      // Intentar corregir los handles de las aristas válidas
      const fixedEdges = fixAllEdgeHandles(validEdges);
      fixedHandles = true;
      
      // Si hay diferencias, emitir un evento para actualizar las aristas en el estado
      if (JSON.stringify(fixedEdges) !== JSON.stringify(edges)) {
        document.dispatchEvent(new CustomEvent('edges-fixed', { 
          detail: { 
            edges: fixedEdges,
            timestamp: now,
            validEdgesOnly: true
          } 
        }));
      }
    } catch (error) {
    }
  }
  
  // Emitir un evento para EliteEdge
  document.dispatchEvent(new CustomEvent('elite-edge-update-required', { 
    detail: { 
      allEdges: true,
      timestamp: now,
      forced: true,
      fixedHandles: fixedHandles
    } 
  }));
  
  // Forzar un repintado del viewport con una ligera transformación
  // pero solo una vez cada 5 segundos
  setTimeout(() => {
    const reactFlowViewport = document.querySelector('.react-flow__viewport');
    if (reactFlowViewport) {
      const transform = reactFlowViewport.style.transform;
      if (transform) {
        // Aplicar una transformación mínima para forzar repintado
        reactFlowViewport.style.transform = `${transform} scale(0.9999)`;
        setTimeout(() => {
          reactFlowViewport.style.transform = transform;
        }, 50);
      }
    }
  }, 100);
};

/**
 * Restaura las aristas desde localStorage y las aplica al estado
 * @param {string} plubotId - ID del plubot
 * @param {Function} setEdges - Función para establecer las aristas
 */
// Variable para controlar la frecuencia de restauración
let lastRestoreAttempt = 0;
const restoreThrottleMs = 30000; // Limitar a una restauración cada 30 segundos

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
    }
    
    return true;
  }
  
  return false;
};
