import { useEffect } from 'react';
import useFlowStore from '@/stores/useFlowStore';
import { NODE_TYPES } from '@/utils/nodeConfig';

/**
 * Hook responsable de sincronizar el estado de useFlowStore con el plubotId de la URL
 * Reemplaza el efecto masivo existente en TrainingScreen.
 *
 * @param {Object} params
 * @param {string|null} params.plubotIdFromUrl - ID extraído de la URL o null
 * @param {Object} params.plubotData - Datos obtenidos vía contexto (puede ser null)
 * @param {Array} params.initialNodes - Nodos por defecto para flujos vacíos
 * @param {Array} params.initialEdges - Aristas por defecto para flujos vacíos
 */
export default function usePlubotLoader({ plubotIdFromUrl, plubotData, initialNodes, initialEdges }) {
  const {
    plubotId,
    flowName,
    isLoaded,
    nodes,
    resetFlow,
    setNodes,
    setEdges,
    setFlowName,
  } = useFlowStore(state => ({
    plubotId: state.plubotId,
    flowName: state.flowName,
    isLoaded: state.isLoaded,
    nodes: state.nodes,
    resetFlow: state.resetFlow,
    setNodes: state.setNodes,
    setEdges: state.setEdges,
    setFlowName: state.setFlowName,
  }));

  useEffect(() => {
    const storeState = useFlowStore.getState();
    const currentPlubotIdInStore = storeState.plubotId;
    const currentFlowNameInStore = storeState.flowName;
    const currentNodesInStore = storeState.nodes;
    const currentIsLoadedInStore = storeState.isLoaded;
    const setFlowNameFromStore = storeState.setFlowName;

    // Caso 1: Debemos cargar o ID cambió
    if (plubotIdFromUrl && (!currentIsLoadedInStore || plubotIdFromUrl !== currentPlubotIdInStore)) {
      const targetFlowName = plubotData?.name || `Plubot ${plubotIdFromUrl}`;
      try {
        window.__allowResetFromTrainingScreenForNewPlubot = true;
        resetFlow(plubotIdFromUrl, targetFlowName, { skipLoad: false });
      } finally {
        window.__allowResetFromTrainingScreenForNewPlubot = false;
      }
    }
    // Caso 2: Correcto pero vacío
    else if (
      plubotIdFromUrl === currentPlubotIdInStore &&
      currentIsLoadedInStore &&
      (!currentNodesInStore || currentNodesInStore.length === 0)
    ) {
      setNodes(initialNodes);
      setEdges(initialEdges);

      // Generar OptionNodes para DecisionNodes por defecto
      const decisionNodesInDefault = initialNodes.filter(n => n.type === NODE_TYPES.decision);
      decisionNodesInDefault.forEach(decisionNode => {
        useFlowStore.getState().generateOptionNodes(decisionNode.id);
      });

      const genericEmptyNamePattern = `Nuevo Flujo para ${plubotIdFromUrl}`;
      const errorNamePattern = `Error al cargar ${plubotIdFromUrl}`;
      const currentStoreFlowName = storeState.flowName;

      if (
        currentStoreFlowName === 'Flujo sin título' ||
        currentStoreFlowName === genericEmptyNamePattern ||
        currentStoreFlowName === errorNamePattern ||
        (plubotData?.name && currentStoreFlowName !== plubotData.name)
      ) {
        const newNameForEmpty = plubotData?.name || `Plubot ${plubotIdFromUrl}`;
        if (currentStoreFlowName !== newNameForEmpty) setFlowName(newNameForEmpty);
      }
    }
    // Caso 3: Cargado y con contenido
    else if (
      plubotIdFromUrl === currentPlubotIdInStore &&
      currentIsLoadedInStore &&
      currentNodesInStore &&
      currentNodesInStore.length > 0
    ) {
      if (plubotData?.name && plubotData.name !== currentFlowNameInStore) {
        setFlowNameFromStore(plubotData.name);
      }
    }
    // Caso 4: Sin ID
    else if (!plubotIdFromUrl) {
      try {
        window.__allowResetFromTrainingScreenForNewPlubot = true;
        resetFlow(null, 'Flujo sin título', { skipLoad: true });
      } finally {
        window.__allowResetFromTrainingScreenForNewPlubot = false;
      }
    }
  }, [plubotIdFromUrl, plubotData, isLoaded, nodes.length, flowName]);
}
