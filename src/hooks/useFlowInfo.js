import { useFlowMeta, useFlowNodesEdges } from '@/stores/selectors';

export const useFlowInfo = ({ propertiesFlowName, getVisibleNodeCount }) => {
  const { flowName: flowNameFromStore } = useFlowMeta();
  const { nodes, edges } = useFlowNodesEdges();

  const displayFlowName =
    propertiesFlowName || flowNameFromStore || 'Flujo sin título';

  const nodeCount = getVisibleNodeCount
    ? getVisibleNodeCount()
    : nodes.filter((node) => node && !node.hidden && !node.deleted).length;

  const edgeCount = Array.isArray(edges)
    ? edges.filter(
        (edge, index, self) =>
          index ===
          self.findIndex(
            (edgeItem) =>
              edgeItem.source === edge.source &&
              edgeItem.target === edge.target,
          ),
      ).length
    : 0;

  return { displayFlowName, nodeCount, edgeCount, nodes, edges };
};
