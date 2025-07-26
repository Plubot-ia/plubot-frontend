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

    set({ history: { ...history, past: newPast, future: [] }, ...updates });
  },
  undo: () => {
    const { history } = get();
    if (history.past.length === 0) return;

    const newFuture = [
      { nodes: get().nodes, edges: get().edges },
      ...history.future,
    ];
    const newPast = [...history.past];
    const present = newPast.pop();

    set({
      ...present,
      history: { ...history, past: newPast, future: newFuture },
      isUndoing: true,
      isRedoing: false,
    });
  },
  redo: () => {
    const { history } = get();
    if (history.future.length === 0) return;

    const newPast = [
      ...history.past,
      { nodes: get().nodes, edges: get().edges },
    ];
    const newFuture = [...history.future];
    const present = newFuture.shift();

    set({
      ...present,
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
