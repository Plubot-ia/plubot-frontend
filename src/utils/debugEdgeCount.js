// Debug utility to check edge count discrepancy
export const debugEdgeCount = () => {
  // Try to get the store from window
  if (globalThis.window === undefined) return;

  // Look for the store in different possible locations
  const possibleStores = [
    globalThis.window.useFlowStore?.getState?.(),
    globalThis.window.__REACT_FLOW_STORE__?.getState?.(),
    globalThis.window.flowStore?.getState?.(),
  ];

  const store = possibleStores.find((s) => s && s.edges);

  if (!store) {
    return;
  }

  const edges = store.edges || [];
  const visibleEdges = edges.filter((edge) => !edge.hidden && !edge.deleted);

  // Check for duplicates by ID
  const edgeIds = edges.map((edge) => edge.id);
  const uniqueIds = new Set(edgeIds);
  if (edgeIds.length !== uniqueIds.size) {
    const duplicates = edgeIds.filter((id, index) => edgeIds.indexOf(id) !== index);
    return { hasDuplicates: true, duplicates };
  }

  // Check for duplicate source-target pairs
  const connections = edges.map((edge) => `${edge.source}->${edge.target}`);
  const uniqueConnections = new Set(connections);
  if (connections.length !== uniqueConnections.size) {
    const duplicateConnections = connections.filter((c, index) => connections.indexOf(c) !== index);
    return { hasDuplicateConnections: true, duplicateConnections };
  }

  return { edges, visibleEdges, edgeCount: store.edgeCount, nodeCount: store.nodeCount };
};

// Auto-expose to window for debugging
if (globalThis.window !== undefined) {
  globalThis.debugEdgeCount = debugEdgeCount;
}
