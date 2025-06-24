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
  const setFlowName = useFlowStore(state => state.setFlowName);

  useEffect(() => {
    // Se obtiene el estado más reciente directamente desde el store para evitar bucles de dependencia.
    const {
      plubotId: currentPlubotIdInStore,
      flowName: currentFlowNameInStore,
      nodes: currentNodesInStore,
      isLoaded: currentIsLoadedInStore,
      setFlowName: setFlowNameFromStore,
      setNodes,
      setEdges,
    } = useFlowStore.getState();

    // Caso 1: Debemos cargar o ID cambió
    if (plubotIdFromUrl && (!currentIsLoadedInStore || plubotIdFromUrl !== currentPlubotIdInStore)) {
      // Limpieza explícita del estado del flujo anterior para prevenir la "fuga" de nodos/aristas.
      // Este es el fix crítico: asegura que el lienzo esté vacío antes de cargar el nuevo flujo.

      setNodes([]);
      setEdges([]);
      setFlowNameFromStore('Cargando...'); // Nombre temporal mientras carga

      const targetFlowName = plubotData?.name || `Plubot ${plubotIdFromUrl}`;
      useFlowStore.getState().resetFlow(plubotIdFromUrl, targetFlowName, { skipLoad: false, allowResetFromLoader: true });
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
      const currentStoreFlowName = currentFlowNameInStore;

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
        useFlowStore.getState().setFlowName(plubotData.name);
      }
    }
    // Caso 4: Sin ID
    else if (!plubotIdFromUrl) {
      useFlowStore.getState().resetFlow(null, 'Flujo sin título', { skipLoad: true, allowResetFromLoader: true });
    }
  }, [plubotIdFromUrl, plubotData?.name, initialNodes, initialEdges, setFlowName]);
}
