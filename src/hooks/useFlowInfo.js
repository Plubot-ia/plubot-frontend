import { useMemo } from 'react';

import { useFlowMeta } from '@/stores/selectors';
import { useNodeEdgeCountsOptimized } from '@/stores/use-flow-store';

// ELITE OPTIMIZATION: Usar selectores granulares que solo acceden a contadores dedicados
// Esto previene completamente los re-renders al mover nodos
const useNodeEdgeCounts = () => {
  // Usar el selector optimizado que solo accede a los contadores dedicados
  // NO accede a los arrays de nodes/edges, evitando re-renders innecesarios
  const counts = useNodeEdgeCountsOptimized();
  return counts;
};

export const useFlowInfo = ({ propertiesFlowName, getVisibleNodeCount }) => {
  const { flowName: flowNameFromStore } = useFlowMeta();
  const { nodeCount: storeNodeCount, edgeCount } = useNodeEdgeCounts();

  const displayFlowName = propertiesFlowName ?? flowNameFromStore ?? 'Flujo sin título';

  // Usar el contador personalizado si está disponible, sino usar el del store
  const nodeCount = getVisibleNodeCount ? getVisibleNodeCount() : storeNodeCount;

  // IMPORTANTE: No devolver arrays de nodes/edges para evitar renders
  // EpicHeader solo necesita los conteos, no los datos completos
  return useMemo(
    () => ({
      displayFlowName,
      nodeCount,
      edgeCount,
      nodes: [], // Vacío para compatibilidad, pero no causa renders
      edges: [], // Vacío para compatibilidad, pero no causa renders
    }),
    [displayFlowName, nodeCount, edgeCount],
  );
};
