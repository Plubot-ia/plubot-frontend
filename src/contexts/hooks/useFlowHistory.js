import { useCallback, useEffect } from 'react';

import useHistory from '@/hooks/useHistory';

export const useFlowHistory = (flowStore) => {
  const history = useHistory({
    maxHistory: 100,
  });

  const addToHistory = useCallback(() => {
    history.addToHistory({
      nodes: flowStore.nodes,
      edges: flowStore.edges,
      viewport: flowStore.viewport,
    });
  }, [history, flowStore.nodes, flowStore.edges, flowStore.viewport]);

  const handleUndo = useCallback(() => {
    const state = history.undo();
    if (state) {
      flowStore.setNodes(state.nodes);
      flowStore.setEdges(state.edges);
      if (state.viewport) {
        flowStore.setViewport(state.viewport);
      }
    }
  }, [history, flowStore]);

  const handleRedo = useCallback(() => {
    const state = history.redo();
    if (state) {
      flowStore.setNodes(state.nodes);
      flowStore.setEdges(state.edges);
      if (state.viewport) {
        flowStore.setViewport(state.viewport);
      }
    }
  }, [history, flowStore]);

  useEffect(() => {
    addToHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { history, handleUndo, handleRedo, addToHistory };
};
