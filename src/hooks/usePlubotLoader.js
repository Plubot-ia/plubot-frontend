import { useEffect } from 'react';

import useFlowStore from '@/stores/use-flow-store';
import { NODE_TYPES } from '@/utils/node-config.js';

/**
 * Hook responsable de sincronizar el estado de useFlowStore con el plubotId de la URL.
 * Reemplaza el efecto masivo existente en TrainingScreen.
 *
 * @param {Object} params
 * @param {string|null} params.plubotIdFromUrl - ID extraído de la URL o null.
 * @param {Object} params.plubotData - Datos obtenidos vía contexto (puede ser null).
 * @param {Array} params.initialNodes - Nodos por defecto para flujos vacíos.
 * @param {Array} params.initialEdges - Aristas por defecto para flujos vacíos.
 */
const SCENARIOS = {
  LOAD_NEW_PLUBOT: 'LOAD_NEW_PLUBOT',
  INITIALIZE_EMPTY_FLOW: 'INITIALIZE_EMPTY_FLOW',
  ALREADY_SYNCED: 'ALREADY_SYNCED',
  RESET_TO_UNTITLED: 'RESET_TO_UNTITLED',
  DO_NOTHING: 'DO_NOTHING',
};

/**
 * Determina el escenario de carga a ejecutar basándose en el estado actual de la URL y el store.
 * @returns {string} El escenario a ejecutar.
 */

const determineScenario = ({
  plubotIdFromUrl,
  currentPlubotIdInStore,
  currentIsLoadedInStore,
  currentNodesInStore,
}) => {
  if (plubotIdFromUrl && (!currentIsLoadedInStore || plubotIdFromUrl !== currentPlubotIdInStore)) {
    return SCENARIOS.LOAD_NEW_PLUBOT;
  }
  if (
    plubotIdFromUrl === currentPlubotIdInStore &&
    currentIsLoadedInStore &&
    (!currentNodesInStore || currentNodesInStore.length === 0)
  ) {
    return SCENARIOS.INITIALIZE_EMPTY_FLOW;
  }
  if (
    plubotIdFromUrl === currentPlubotIdInStore &&
    currentIsLoadedInStore &&
    currentNodesInStore?.length > 0
  ) {
    return SCENARIOS.ALREADY_SYNCED;
  }
  if (!plubotIdFromUrl) {
    return SCENARIOS.RESET_TO_UNTITLED;
  }
  return SCENARIOS.DO_NOTHING;
};

const handleLoadNewPlubot = (plubotIdFromUrl, plubotData) => {
  const { setNodes, setEdges, setFlowName, resetFlow } = useFlowStore.getState();
  setNodes([]);
  setEdges([]);
  setFlowName('Cargando...');
  const targetFlowName = plubotData?.name || `Plubot ${plubotIdFromUrl}`;
  resetFlow(plubotIdFromUrl, targetFlowName, {
    skipLoad: false,
    allowResetFromLoader: true,
  });
};

const handleInitializeEmptyFlow = (initialNodes, initialEdges) => {
  const { setNodes, setEdges, generateOptionNodes } = useFlowStore.getState();
  setNodes(initialNodes);
  setEdges(initialEdges);
  const decisionNodes = initialNodes.filter((n) => n.type === NODE_TYPES.decision);
  for (const decisionNode of decisionNodes) {
    generateOptionNodes(decisionNode.id);
  }
};

const handleResetToUntitled = () => {
  useFlowStore.getState().resetFlow(undefined, 'Flujo sin título', {
    skipLoad: true,
    allowResetFromLoader: true,
  });
};

export default function usePlubotLoader({
  plubotIdFromUrl,
  plubotData,
  initialNodes,
  initialEdges,
}) {
  useEffect(() => {
    const {
      plubotId: currentPlubotIdInStore,
      nodes: currentNodesInStore,
      isLoaded: currentIsLoadedInStore,
    } = useFlowStore.getState();

    const scenario = determineScenario({
      plubotIdFromUrl,
      currentPlubotIdInStore,
      currentIsLoadedInStore,
      currentNodesInStore,
    });

    switch (scenario) {
      case SCENARIOS.LOAD_NEW_PLUBOT: {
        handleLoadNewPlubot(plubotIdFromUrl, plubotData);
        break;
      }
      case SCENARIOS.INITIALIZE_EMPTY_FLOW: {
        handleInitializeEmptyFlow(initialNodes, initialEdges);
        break;
      }
      case SCENARIOS.RESET_TO_UNTITLED: {
        handleResetToUntitled();
        break;
      }
      default: {
        // No action needed for these scenarios
        break;
      }
    }
  }, [plubotIdFromUrl, plubotData, initialNodes, initialEdges]);
}
