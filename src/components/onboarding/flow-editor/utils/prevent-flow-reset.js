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
    if (!nodes || !Array.isArray(nodes) || nodes.length === 0) return;
    
    try {
      localStorage.setItem('plubot-nodes-emergency-backup', JSON.stringify(nodes));
      console.log(`[preventFlowReset] Respaldo de emergencia guardado: ${nodes.length} nodos`);
    } catch (e) {
      console.error('[preventFlowReset] Error al guardar respaldo de emergencia:', e);
    }
  };
  
  // Función para recuperar nodos de respaldo
  const restoreNodesFromBackup = () => {
    try {
      const backup = localStorage.getItem('plubot-nodes-emergency-backup');
      if (backup) {
        const nodes = JSON.parse(backup);
        if (Array.isArray(nodes) && nodes.length > 0) {
          console.log(`[preventFlowReset] Recuperados ${nodes.length} nodos del respaldo de emergencia`);
          return nodes;
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
            // Validar que no se estén eliminando todos los nodos sin razón
            const callStack = new Error().stack || '';
            const currentNodes = prevState.nodes || [];
            
            // Si hay nodos actuales, pero los nuevos son un array vacío o nulo
            if (currentNodes.length > 0 && (!newNodes || (Array.isArray(newNodes) && newNodes.length === 0))) {
              // Si no viene de un contexto legítimo para eliminar nodos
              if (!callStack.includes('TrainingScreen') && !callStack.includes('deleteNode')) {
                console.warn('[preventFlowReset] Intento de eliminar todos los nodos bloqueado');
                // Guardar respaldo de emergencia
                backupNodesToLocalStorage(currentNodes);
                return; // No hacer nada, preservar nodos actuales
              }
            }
            
            // En caso normal, permitir la operación
            if (Array.isArray(newNodes) && newNodes.length > 0) {
              lastNodes = [...newNodes]; // Guardar copia de seguridad en memoria
              // Solo guardar respaldo si hay más de 3 nodos (para no sobrecargar localStorage)
              if (newNodes.length > 3) {
                backupNodesToLocalStorage(newNodes);
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
            console.log(`[preventFlowReset] Checking for emergency backup. Plubot ID: ${currentPlubotId}, Key: ${emergencyBackupKey}, Found: ${emergencyBackupForThisFlowExists}`);
          } else {
            console.log('[preventFlowReset] No currentPlubotId in store, cannot check for specific emergency backup.');
          }

          if (currentNodes.length === 0 && lastNodes.length > 0 && !emergencyBackupForThisFlowExists) {
            console.warn(`[preventFlowReset] RESTAURACIÓN AUTOMÁTICA (desde lastNodes). Key '${emergencyBackupKey}' not found or no Plubot ID. Nodes desaparecidos.`);
            currentState.setNodes(lastNodes);
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
