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
    console.log(`edgeRecoveryUtil: Recuperación de aristas limitada por frecuencia. Espere ${Math.ceil((recoveryThrottleMs - (now - lastRecoveryAttempt)) / 1000)} segundos.`);
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
          console.log(`edgeRecoveryUtil: Recuperadas ${parsedEdges.length} aristas desde clave genérica`);
        }
      } catch (e) {
        console.error('Error al parsear aristas desde clave genérica:', e);
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
            console.log(`edgeRecoveryUtil: Recuperadas ${parsedEdges.length} aristas desde clave específica`);
          }
        } catch (e) {
          console.error(`Error al parsear aristas desde ${keyFormat}:`, e);
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
      
      console.log(`edgeRecoveryUtil: ${filteredEdges.length} aristas válidas recuperadas, ${fixedEdges.length} con handles corregidos`);
      return fixedEdges;
    }
    
    return [];
  } catch (error) {
    console.error('Error al recuperar aristas desde localStorage:', error);
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
        console.warn(`saveEdgesToLocalStorage: Arista ${edge.id} ignorada porque sus nodos no existen en el DOM`);
      }
      return exists;
    });
    
    if (validEdges.length !== edges.length) {
      console.log(`saveEdgesToLocalStorage: Filtradas ${edges.length - validEdges.length} aristas inválidas antes de guardar`);
    }
    
    // Corregir los handles de las aristas válidas antes de guardarlas
    const fixedEdges = fixAllEdgeHandles(validEdges);
    
    // Convertir a JSON
    const edgesJSON = JSON.stringify(fixedEdges);
    
    // Guardar en ambos formatos para mayor compatibilidad
    localStorage.setItem(`plubot-edges-${plubotId}`, edgesJSON);
    localStorage.setItem('plubot-flow-edges', edgesJSON);
    localStorage.setItem('plubot-flow-edges-timestamp', Date.now().toString());
    
    console.log(`edgeRecoveryUtil: Guardadas ${fixedEdges.length} aristas con handles corregidos en localStorage para plubot ${plubotId}`);
  } catch (error) {
    console.error('Error al guardar aristas en localStorage:', error);
    
    // En caso de error con la corrección, intentar guardar las aristas originales
    try {
      const edgesJSON = JSON.stringify(edges);
      localStorage.setItem(`plubot-edges-${plubotId}`, edgesJSON);
      console.log(`edgeRecoveryUtil: Guardadas ${edges.length} aristas originales (sin corregir) en localStorage para plubot ${plubotId}`);
    } catch (backupError) {
      console.error('Error al guardar aristas originales en localStorage:', backupError);
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
    console.log(`edgeRecoveryUtil: Actualización visual limitada por frecuencia. Espere ${Math.ceil((visualUpdateThrottleMs - (now - lastVisualUpdate)) / 1000)} segundos.`);
    return; // Evitar actualizaciones demasiado frecuentes
  }
  
  lastVisualUpdate = now;
  console.log('edgeRecoveryUtil: Forzando actualización visual de aristas...');
  
  // Si se proporcionaron aristas, filtrar las válidas y corregir sus handles antes de emitir el evento
  let fixedHandles = false;
  if (edges && Array.isArray(edges) && edges.length > 0) {
    try {
      // Filtrar aristas cuyos nodos no existen en el DOM
      const validEdges = edges.filter(edge => {
        const exists = nodesExistInDOM(edge);
        if (!exists) {
          console.warn(`edgeRecoveryUtil: Arista ${edge.id} ignorada durante actualización visual porque sus nodos no existen en el DOM`);
        }
        return exists;
      });
      
      if (validEdges.length !== edges.length) {
        console.log(`edgeRecoveryUtil: Filtradas ${edges.length - validEdges.length} aristas inválidas durante actualización visual`);
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
      console.error('Error al filtrar y corregir handles de aristas durante actualización visual:', error);
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
    console.log(`edgeRecoveryUtil: Restauración de aristas limitada por frecuencia. Espere ${Math.ceil((restoreThrottleMs - (now - lastRestoreAttempt)) / 1000)} segundos.`);
    return false;
  }
  
  lastRestoreAttempt = now;
  
  const recoveredEdges = recoverEdgesFromLocalStorage(plubotId);
  
  if (recoveredEdges.length > 0) {
    console.log(`Aplicando ${recoveredEdges.length} aristas recuperadas`);
    
    // Verificar si setEdges está disponible
    if (setEdges) {
      // Usar un timeout para dar tiempo al sistema a estabilizarse
      setTimeout(() => {
        setEdges(recoveredEdges);
      }, 100);
    } else {
      console.warn('restoreAndApplyEdges: setEdges no está disponible');
    }
    
    return true;
  }
  
  return false;
};
