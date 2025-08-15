import { useCallback, useRef } from 'react';

export const useFlowInteractions = (flowStore, history, optimization) => {
  const lastSavedState = useRef(null);

  const handleSave = useCallback(() => {
    const currentState = {
      nodes: flowStore.nodes,
      edges: flowStore.edges,
      viewport: flowStore.viewport,
    };

    if (JSON.stringify(lastSavedState.current) !== JSON.stringify(currentState)) {
      flowStore.setSaving(true);

      setTimeout(() => {
        lastSavedState.current = currentState;
        flowStore.setSaving(false);
        flowStore.setLastSaved(new Date().toISOString());

        if (flowStore.onSave) {
          flowStore.onSave(currentState);
        }
      }, 500);
    }
  }, [flowStore]);

  const handleConnect = useCallback(
    (parameters) => {
      const newEdge = flowStore.addEdge(parameters);
      if (newEdge) {
        history.addToHistory({
          nodes: flowStore.nodes,
          edges: [...flowStore.edges, newEdge],
          viewport: flowStore.viewport,
        });
      }
      optimization.markActivity();
    },
    [flowStore, history, optimization],
  );

  const resetState = useCallback(() => {
    flowStore.setNodes([]);
    flowStore.setEdges([]);
    flowStore.setViewport({ x: 0, y: 0, zoom: 1 });
    history.clearHistory();
    optimization.toggleUltraMode(false);
  }, [flowStore, history, optimization]);

  return { handleSave, handleConnect, resetState };
};
