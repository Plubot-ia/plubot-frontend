import { useEffect } from 'react';

import useFlowStore from '@/stores/use-flow-store';
import { NODE_TYPES } from '@/utils/node-config.js';

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
      setFlowName: setFlowNameFromStore,
      setNodes,
      setEdges,
    } = useFlowStore.getState();

    if (
      plubotIdFromUrl &&
      (!currentIsLoadedInStore || plubotIdFromUrl !== currentPlubotIdInStore)
    ) {
      setNodes([]);
      setEdges([]);
      setFlowNameFromStore('Cargando...');

      const targetFlowName = plubotData?.name || `Plubot ${plubotIdFromUrl}`;
      useFlowStore.getState().resetFlow(plubotIdFromUrl, targetFlowName, {
        skipLoad: false,
        allowResetFromLoader: true,
      });
    } else if (
      plubotIdFromUrl === currentPlubotIdInStore &&
      currentIsLoadedInStore &&
      (!currentNodesInStore || currentNodesInStore.length === 0)
    ) {
      setNodes(initialNodes);
      setEdges(initialEdges);

      const decisionNodesInDefault = initialNodes.filter(
        (n) => n.type === NODE_TYPES.decision,
      );
      for (const decisionNode of decisionNodesInDefault) {
        useFlowStore.getState().generateOptionNodes(decisionNode.id);
      }
    } else if (
      plubotIdFromUrl === currentPlubotIdInStore &&
      currentIsLoadedInStore &&
      currentNodesInStore &&
      currentNodesInStore.length > 0
    ) {
      // La sincronización del nombre se gestiona en un efecto dedicado.
    } else if (!plubotIdFromUrl) {
      useFlowStore.getState().resetFlow(undefined, 'Flujo sin título', {
        skipLoad: true,
        allowResetFromLoader: true,
      });
    }
  }, [plubotIdFromUrl, plubotData?.name, initialNodes, initialEdges]);

  // Efecto dedicado exclusivamente a sincronizar el nombre del Plubot
  // Se ejecuta solo cuando el nombre en plubotData cambia, desacoplando esta lógica.
  useEffect(() => {
    const { flowName: currentFlowNameInStore, setFlowName: setFlowNameAction } =
      useFlowStore.getState();
    const newName = plubotData?.name;

    if (newName && newName !== currentFlowNameInStore) {
      setFlowNameAction(newName);
    }
  }, [plubotData?.name]);
}
