const MAX_HISTORY_LENGTH = 50;

export const historySlice = (set, get) => ({
  setHistory: (updater) =>
    set((state) => ({
      history: typeof updater === 'function' ? updater(state.history) : updater,
    })),
  history: {
    past: [],
    future: [],
    maxHistory: MAX_HISTORY_LENGTH,
  },
  isUndoing: false,
  isRedoing: false,

  _createHistoryEntry: (updates) => {
    const { history, nodes, edges } = get();
    const lastState = history.past.at(-1);

    if (
      lastState &&
      JSON.stringify(updates.nodes) === JSON.stringify(lastState.nodes) &&
      JSON.stringify(updates.edges) === JSON.stringify(lastState.edges)
    ) {
      return;
    }

    const newPast = [...history.past, { nodes, edges }];
    if (newPast.length > MAX_HISTORY_LENGTH) {
      newPast.shift();
    }

    // Actualizar contadores si se incluyen nodos o edges
    const finalUpdates = { ...updates };
    if (updates.nodes) {
      const visibleNodeCount = updates.nodes.filter((n) => !n.hidden && !n.deleted).length;
      finalUpdates.nodeCount = visibleNodeCount;
    }
    if (updates.edges) {
      const visibleEdgeCount = updates.edges.filter((edge) => !edge.hidden && !edge.deleted).length;
      finalUpdates.edgeCount = visibleEdgeCount;
    }

    set({ history: { ...history, past: newPast, future: [] }, ...finalUpdates });
  },
  undo: () => {
    const { history } = get();
    if (history.past.length === 0) return;

    const newFuture = [{ nodes: get().nodes, edges: get().edges }, ...history.future];
    const newPast = [...history.past];
    const present = newPast.pop();

    // Actualizar contadores al hacer undo
    const finalPresent = { ...present };
    if (present.nodes) {
      const visibleNodeCount = present.nodes.filter((n) => !n.hidden && !n.deleted).length;
      finalPresent.nodeCount = visibleNodeCount;
    }
    if (present.edges) {
      const visibleEdgeCount = present.edges.filter((edge) => !edge.hidden && !edge.deleted).length;
      finalPresent.edgeCount = visibleEdgeCount;
    }

    set({
      ...finalPresent,
      history: { ...history, past: newPast, future: newFuture },
      isUndoing: true,
      isRedoing: false,
    });
  },
  redo: () => {
    const { history } = get();
    if (history.future.length === 0) return;

    const newPast = [...history.past, { nodes: get().nodes, edges: get().edges }];
    const newFuture = [...history.future];
    const present = newFuture.shift();

    // Actualizar contadores al hacer redo
    const finalPresent = { ...present };
    if (present.nodes) {
      const visibleNodeCount = present.nodes.filter((n) => !n.hidden && !n.deleted).length;
      finalPresent.nodeCount = visibleNodeCount;
    }
    if (present.edges) {
      const visibleEdgeCount = present.edges.filter((edge) => !edge.hidden && !edge.deleted).length;
      finalPresent.edgeCount = visibleEdgeCount;
    }

    set({
      ...finalPresent,
      history: { ...history, past: newPast, future: newFuture },
      isUndoing: false,
      isRedoing: true,
    });
  },
  clearHistory: () => {
    set({
      history: {
        ...get().history,
        past: [],
        future: [],
      },
    });
  },
  canUndo: () => get().history.past.length > 0,
  canRedo: () => get().history.future.length > 0,
});
