/**
 * prevent-flow-reset.js
 *
 * SOLUCIÓN DEFINITIVA que previene que el flujo se resetee automáticamente
 * y evita la pérdida de nodos en el editor de flujos.
 */

// Importar directamente el store (importación estática)
import useFlowStore from '@/stores/use-flow-store';

/**
 * Previene el reseteo automático del flujo y la pérdida de nodos
 * @returns {Function} Función de limpieza
 */
// Función para guardar nodos en localStorage como respaldo
const backupNodesToLocalStorage = (nodes) => {
  const flowStoreState = useFlowStore.getState();
  const { plubotId } = flowStoreState;

  if (!nodes || !Array.isArray(nodes) || nodes.length === 0) return;

  try {
    const backupKey = `plubot-nodes-emergency-backup-${plubotId}`;
    localStorage.setItem(backupKey, JSON.stringify(nodes));
  } catch {}
};

// Función para recuperar nodos de respaldo
const restoreNodesFromBackup = () => {
  const flowStoreState = useFlowStore.getState();
  const { plubotId } = flowStoreState;

  if (!plubotId) {
    return;
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
      } catch {}
    }
  } catch {}
};

// Helper function to create resetFlow protection
const _createResetFlowProtection = (flowStore, originalResetFlow) => {
  return (...arguments_) => {
    const previousState = flowStore.getState();
    const options = arguments_[2] ?? {};
    const nodes = previousState.nodes ?? [];

    // Caso 1: Se permite el reseteo explícitamente a través de una opción.
    if (options.allowResetFromLoader === true) {
      return originalResetFlow(...arguments_);
    }

    // Caso 2: El reseteo no es forzado, se aplican las protecciones.
    if (nodes.length > 0) {
      return previousState; // Bloquear el reseteo
    }

    // Caso 3: No hay nodos, por lo que el reseteo es seguro.
    return originalResetFlow(...arguments_);
  };
};

/**
 * Determina si se debe activar la protección contra reseteo de nodos.
 * @param {Array} currentNodes - Nodos actuales del store
 * @param {Array} newNodes - Nuevos nodos a establecer
 * @param {string} callStack - Stack trace de la llamada
 * @returns {boolean} true si se debe activar la protección
 */
const _shouldActivateProtection = (currentNodes, newNodes, callStack) => {
  return (
    currentNodes.length > 0 &&
    (!newNodes || (Array.isArray(newNodes) && newNodes.length === 0)) &&
    !callStack.includes('TrainingScreen') &&
    !callStack.includes('deleteNode')
  );
};

/**
 * Procesa nuevos nodos válidos actualizando memoria y backup.
 * @param {Array} newNodes - Nuevos nodos a procesar
 * @param {Array} lastNodes - Array de referencia para la memoria
 */
const _processValidNodes = (newNodes, lastNodes) => {
  if (Array.isArray(newNodes) && newNodes.length > 0) {
    lastNodes.splice(0, lastNodes.length, ...newNodes);
    if (newNodes.length > 3) {
      backupNodesToLocalStorage(newNodes);
    }
  }
};

// Helper function to create setNodes protection
const _createSetNodesProtection = (flowStore, originalSetNodes, lastNodes) => {
  return (newNodes) => {
    const callStack = new Error('Getting call stack').stack ?? '';
    const storeState = flowStore.getState();
    const currentNodes = storeState.nodes ?? [];

    if (_shouldActivateProtection(currentNodes, newNodes, callStack)) {
      backupNodesToLocalStorage(currentNodes);
      return;
    }

    _processValidNodes(newNodes, lastNodes);

    return originalSetNodes(newNodes);
  };
};

// Helper function to create emergency recovery
const _createEmergencyRecovery = (originalSetNodes, lastNodes) => {
  return () => {
    const flowStore = useFlowStore;
    const currentNodes = flowStore.getState().nodes ?? [];

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
  };
};

// Helper function to setup interval checker
const _setupIntervalChecker = (flowStore, lastNodes) => {
  return setInterval(() => {
    try {
      const currentState = flowStore.getState();
      const currentNodes = currentState.nodes ?? [];
      const currentPlubotId = currentState.plubotId;

      let emergencyBackupForThisFlowExists = false;
      if (currentPlubotId) {
        const emergencyBackupKey = `plubot-nodes-emergency-backup-${currentPlubotId}`;
        emergencyBackupForThisFlowExists = Boolean(localStorage.getItem(emergencyBackupKey));
      }

      if (currentNodes.length === 0 && lastNodes.length > 0 && !emergencyBackupForThisFlowExists) {
        // Restauración automática comentada para evitar conflictos
      }
    } catch {}
  }, 5000);
};

// Helper function to create cleanup function
const _createCleanupFunction = ({
  checkInterval,
  flowStore,
  originalResetFlow,
  originalSetNodes,
}) => {
  return () => {
    try {
      clearInterval(checkInterval);

      if (originalResetFlow) {
        flowStore.setState({ resetFlow: originalResetFlow });
      }
      if (originalSetNodes) {
        flowStore.setState({ setNodes: originalSetNodes });
      }
    } catch {}
  };
};

export const preventFlowReset = () => {
  // Referencias originales a las funciones
  let originalResetFlow;
  let originalSetNodes;
  const lastNodes = [];

  try {
    // Accedemos directamente al store
    const flowStore = useFlowStore;

    if (flowStore && flowStore.getState) {
      const state = flowStore.getState();

      // 1. Proteger la función resetFlow
      if (typeof state.resetFlow === 'function') {
        originalResetFlow = state.resetFlow;
        const resetFlowProtection = _createResetFlowProtection(flowStore, originalResetFlow);
        flowStore.setState({ resetFlow: resetFlowProtection });
      }

      // 2. Proteger la función setNodes
      if (typeof state.setNodes === 'function') {
        originalSetNodes = state.setNodes;
        const setNodesProtection = _createSetNodesProtection(
          flowStore,
          originalSetNodes,
          lastNodes,
        );
        flowStore.setState({ setNodes: setNodesProtection });
      }

      // 3. Añadir función de recuperación de emergencia al store
      const emergencyRecovery = _createEmergencyRecovery(originalSetNodes, lastNodes);
      flowStore.setState({ recoverNodesEmergency: emergencyRecovery });

      // 4. Configurar un intervalo para verificar si los nodos desaparecieron
      const checkInterval = _setupIntervalChecker(flowStore, lastNodes);

      // Devolver función de limpieza
      return _createCleanupFunction({
        checkInterval,
        flowStore,
        originalResetFlow,
        originalSetNodes,
      });
    }
  } catch {}
};

export default preventFlowReset;
