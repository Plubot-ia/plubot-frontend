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
      localStorage.setItem(backupKey, JSON.stringify(nodes));
    } catch (e) {}
  };
  
  // Función para recuperar nodos de respaldo
  const restoreNodesFromBackup = () => {
    const flowStoreState = useFlowStore.getState();
    const plubotId = flowStoreState.plubotId;

    if (!plubotId) {
      return null;
    }
    try {
      const backupKey = `plubot-nodes-emergency-backup-${plubotId}`;

      const backup = localStorage.getItem(backupKey);
      if (backup) {
        try {
          const nodes = JSON.parse(backup);
          if (Array.isArray(nodes) && nodes.length > 0) {

            return nodes;
          }
        } catch (error) {
          return null;
        }
      }
    } catch (e) {}
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
            const options = args[2] || {};
            const nodes = prevState.nodes || [];

            // Caso 1: Se permite el reseteo explícitamente a través de una opción.
            // Esta es la nueva forma robusta para que el cargador de flujos reinicie el estado.
            if (options.allowResetFromLoader === true) {

              return originalResetFlow(...args);
            }

            // Caso 2: El reseteo no es forzado, se aplican las protecciones.
            // Si hay nodos en el editor, se bloquea para prevenir pérdida de datos.
            if (nodes.length > 0) {

              return prevState; // Bloquear el reseteo
            }
            
            // Caso 3: No hay nodos, por lo que el reseteo es seguro.

            return originalResetFlow(...args);
          }
        }));
        

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

          } else {

          }

          if (currentNodes.length === 0 && lastNodes.length > 0 && !emergencyBackupForThisFlowExists) {
            // currentState.setNodes(lastNodes); // <--- COMENTADO PARA EVITAR RESTAURACIÓN AUTOMÁTICA
          } else if (currentNodes.length === 0 && lastNodes.length > 0 && emergencyBackupForThisFlowExists) {}

        } catch (e) {}
      }, 5000); // Verificar cada 5 segundos
      

      
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
          

        } catch (e) {}
      };
    }
  } catch (error) {}
  
  // Devolver función de limpieza vacía si algo falló
  return () => {};
};

export default preventFlowReset;
