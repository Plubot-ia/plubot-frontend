/**
 * prevent-flow-reset.js
 * 
 * SOLUCIÓN DEFINITIVA que previene que el flujo se resetee automáticamente
 * y evita la pérdida de nodos en el editor de flujos.
 */

// Importar directamente el store (importación estática)
import useFlowStore from '@/stores/useFlowStore';

/**
 * Previene el reseteo automático del flujo y la pérdida de nodos
 * @returns {Function} Función de limpieza
 */
export const preventFlowReset = () => {
  // Referencias originales a las funciones
  let originalResetFlow = null;
  let originalSetNodes = null;
  let lastNodes = [];
  
  // Función para guardar nodos en localStorage como respaldo
  const backupNodesToLocalStorage = (nodes) => {
    const flowStoreState = useFlowStore.getState();
    const plubotId = flowStoreState.plubotId;

    if (!nodes || !Array.isArray(nodes) || nodes.length === 0) return;
    
    try {
      const backupKey = `plubot-nodes-emergency-backup-${plubotId}`;
      console.log(`[preventFlowReset] Attempting to save emergency backup. Key: ${backupKey}, Nodes count: ${nodes.length}`);
      localStorage.setItem(backupKey, JSON.stringify(nodes));
      console.log(`[preventFlowReset] Emergency backup saved successfully for plubotId: ${plubotId}`);
    } catch (e) {
      console.error(`[preventFlowReset] Error saving emergency backup for plubotId: ${plubotId}`, e);
    }
  };
  
  // Función para recuperar nodos de respaldo
  const restoreNodesFromBackup = () => {
    const flowStoreState = useFlowStore.getState();
    const plubotId = flowStoreState.plubotId;

    if (!plubotId) {
      console.warn('[preventFlowReset] No plubotId provided to restoreNodesFromBackup.');
      return null;
    }
    try {
      const backupKey = `plubot-nodes-emergency-backup-${plubotId}`;
      console.log(`[preventFlowReset] Emergency backup found for plubotId: ${plubotId}. Restoring...`);
      const backup = localStorage.getItem(backupKey);
      if (backup) {
        try {
          const nodes = JSON.parse(backup);
          if (Array.isArray(nodes) && nodes.length > 0) {
            console.log(`[preventFlowReset] Recuperados ${nodes.length} nodos del respaldo de emergencia para ${plubotId} desde ${backupKey}`);
            return nodes;
          }
        } catch (error) {
          console.error(`[preventFlowReset] Error parsing emergency backup for plubotId: ${plubotId}`, error);
          return null;
        }
      }
    } catch (e) {
      console.error('[preventFlowReset] Error al recuperar respaldo de emergencia:', e);
    }
    return null;
  };
  
  try {
    // Accedemos directamente al store
    const flowStore = useFlowStore;
    
    if (flowStore && flowStore.getState) {
      const state = flowStore.getState();
      
      // 1. Proteger la función resetFlow
      if (typeof state.resetFlow === 'function') {
        originalResetFlow = state.resetFlow;
        
        flowStore.setState((prevState) => ({
          resetFlow: (...args) => {
            // BLOQUEAR TODOS LOS RESETEOS independientemente de dónde vengan
            const callStack = new Error().stack || '';
            const nodes = prevState.nodes || [];
            
            // BLOQUEO AGRESIVO: Si viene de TrainingScreen.jsx, SIEMPRE bloquear
            if (callStack.includes('TrainingScreen.jsx')) {
              console.log('[preventFlowReset] \u26A0\uFE0F BLOQUEANDO reseteo desde TrainingScreen');
              return prevState; // Mantener el estado actual sin importar nada
            }
            
            // PROTECCIÓN ADICIONAL: Si hay nodos, nunca permitir reseteo
            if (nodes.length > 0) {
              console.log('[preventFlowReset] Bloqueando reseteo con', nodes.length, 'nodos existentes');
              // NO PERMITIR RESETEO si hay nodos existentes
              return prevState; // Mantener el estado actual
            }
            
            // Solo permitir reseteo si no hay nodos y no viene de TrainingScreen
            console.log('[preventFlowReset] Permitido reseteo legítimo desde:', callStack.split('\n')[2] || 'desconocido');
            return originalResetFlow(...args);
          }
        }));
        
        console.log('[preventFlowReset] Protección para resetFlow instalada');
      }
      
      // 2. Proteger la función setNodes
      if (typeof state.setNodes === 'function') {
        originalSetNodes = state.setNodes;
        
        flowStore.setState((prevState) => ({
          setNodes: (newNodes) => {
            const callStack = new Error().stack || '';
            // MODIFICADO: Obtener nodos y plubotId del estado MÁS RECIENTE del store
            const storeState = flowStore.getState();
            const currentNodes = storeState.nodes || [];
            const currentPlubotId = storeState.plubotId;
            
            if (currentNodes.length > 0 && (!newNodes || (Array.isArray(newNodes) && newNodes.length === 0))) {
              if (!callStack.includes('TrainingScreen') && !callStack.includes('deleteNode')) {
                console.warn('[preventFlowReset] Intento de eliminar todos los nodos bloqueado');
                backupNodesToLocalStorage(currentNodes); // Guardar los nodos *antes* de la eliminación
                return;
              }
            }
            
            if (Array.isArray(newNodes) && newNodes.length > 0) {
              lastNodes = [...newNodes];
              if (newNodes.length > 3) {
                // MODIFICADO: Obtener plubotId del estado MÁS RECIENTE también aquí por consistencia
                const freshPlubotIdForBackup = flowStore.getState().plubotId;
                backupNodesToLocalStorage(newNodes); // Guardar los nodos *antes* de la eliminación
              }
            }
            
            return originalSetNodes(newNodes);
          }
        }));
        
        console.log('[preventFlowReset] Protección para setNodes instalada');
      }
      
      // 3. Añadir función de recuperación de emergencia al store
      flowStore.setState((prevState) => ({
        recoverNodesEmergency: () => {
          const currentNodes = prevState.nodes || [];
          const currentPlubotId = prevState.plubotId;
          
          // Solo recuperar si no hay nodos actualmente
          if (currentNodes.length === 0) {
            // Intentar recuperar de la memoria primero
            if (lastNodes.length > 0) {
              console.log(`[preventFlowReset] Recuperando ${lastNodes.length} nodos de memoria`);
              originalSetNodes(lastNodes);
              return true;
            }
            
            // Si no hay en memoria, intentar desde localStorage
            const backupNodes = restoreNodesFromBackup();
            if (backupNodes) {
              originalSetNodes(backupNodes);
              return true;
            }
          }
          
          return false;
        }
      }));
      
      // 4. Configurar un intervalo para verificar si los nodos desaparecieron
      const checkInterval = setInterval(() => {
        try {
          const currentState = flowStore.getState();
          const currentNodes = currentState.nodes || [];
          const currentPlubotId = currentState.plubotId;
          
          let emergencyBackupForThisFlowExists = false;
          let emergencyBackupKey = '';

          if (currentPlubotId) {
            emergencyBackupKey = `plubot-nodes-emergency-backup-${currentPlubotId}`;
            emergencyBackupForThisFlowExists = localStorage.getItem(emergencyBackupKey) !== null;
            // console.log(`[preventFlowReset] Checking for emergency backup. Plubot ID: ${currentPlubotId}, Key: ${emergencyBackupKey}, Found: ${emergencyBackupForThisFlowExists}`);
          } else {
            // console.log('[preventFlowReset] No currentPlubotId in store, cannot check for specific emergency backup.');
          }

          if (currentNodes.length === 0 && lastNodes.length > 0 && !emergencyBackupForThisFlowExists) {
            console.warn(`[preventFlowReset] Nodos desaparecidos. Key '${emergencyBackupKey}' no encontrada (o no hay Plubot ID). NO SE RESTAURARÁ AUTOMÁTICAMENTE desde lastNodes.`);
            // currentState.setNodes(lastNodes); // <--- COMENTADO PARA EVITAR RESTAURACIÓN AUTOMÁTICA
          } else if (currentNodes.length === 0 && lastNodes.length > 0 && emergencyBackupForThisFlowExists) {
            console.log(`[preventFlowReset] Nodos desaparecidos, pero Key '${emergencyBackupKey}' existe. TrainingScreen.jsx gestionará.`);
          }
        } catch (e) {
          console.error('[preventFlowReset] Error en verificación automática:', e);
        }
      }, 5000); // Verificar cada 5 segundos
      
      console.log('[preventFlowReset] Sistema de protección completo instalado');
      
      // Devolver función de limpieza
      return () => {
        try {
          // Detener el intervalo de verificación
          clearInterval(checkInterval);
          
          // Restaurar funciones originales
          if (originalResetFlow) {
            flowStore.setState({ resetFlow: originalResetFlow });
          }
          if (originalSetNodes) {
            flowStore.setState({ setNodes: originalSetNodes });
          }
          
          console.log('[preventFlowReset] Sistema de protección desactivado');
        } catch (e) {
          console.error('[preventFlowReset] Error al restaurar funciones originales:', e);
        }
      };
    }
  } catch (error) {
    console.error('[preventFlowReset] Error al configurar protección:', error);
  }
  
  // Devolver función de limpieza vacía si algo falló
  return () => {};
};

export default preventFlowReset;
