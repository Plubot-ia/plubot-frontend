// src/hooks/useUndoRedo.ts
// Implementación básica conectada al store de flujo
import { useCallback } from 'react';
import useFlowStore from '@/stores/useFlowStore';
import { shallow } from 'zustand/shallow';

export interface HistoryEntry {
  type: string;
  [key: string]: any;
}

export interface UseUndoRedoReturn {
  addToHistory: (entry: HistoryEntry) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clearHistory: () => void;
}

export const useUndoRedo = (): UseUndoRedoReturn => {
  const {
    history,
    setHistory,
    isUndoing,
    isRedoing
  } = useFlowStore(
    (state) => ({
      history: state.history || { past: [], future: [], maxHistory: 50 },
      setHistory: state.setHistory,
      isUndoing: state.isUndoing || false,
      isRedoing: state.isRedoing || false
    }),
    shallow
  );

  const addToHistory = useCallback((entry: HistoryEntry) => {
    if (isUndoing || isRedoing) return;
    
    setHistory({
      past: [...history.past, entry],
      future: [],
      maxHistory: history.maxHistory
    });
  }, [history, setHistory, isUndoing, isRedoing]);

  const canUndo = useCallback(() => {
    return (history.past && history.past.length > 0) || false;
  }, [history]);

  const canRedo = useCallback(() => {
    return (history.future && history.future.length > 0) || false;
  }, [history]);

  const undo = useCallback(() => {
    if (!history.past || history.past.length === 0) return;
    
    const lastState = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, -1);
    
    useFlowStore.setState({
      history: {
        past: newPast,
        future: [ ...(history.future || []), { nodes: useFlowStore.getState().nodes, edges: useFlowStore.getState().edges, viewport: useFlowStore.getState().viewport } ],
        maxHistory: history.maxHistory
      },
      isUndoing: true,
      isRedoing: false
    });
  }, [history]);

  const redo = useCallback(() => {
    if (!history.future || history.future.length === 0) return;
    
    const nextState = history.future[history.future.length - 1];
    const newFuture = history.future.slice(0, -1);
    
    useFlowStore.setState({
      history: {
        past: [ ...(history.past || []), { nodes: useFlowStore.getState().nodes, edges: useFlowStore.getState().edges, viewport: useFlowStore.getState().viewport } ],
        future: newFuture,
        maxHistory: history.maxHistory
      },
      isUndoing: false,
      isRedoing: true
    });
  }, [history]);

  const clearHistory = useCallback(() => {
    setHistory({
      past: [],
      future: [],
      maxHistory: history.maxHistory
    });
  }, [history, setHistory]);

  return {
    addToHistory,
    undo,
    redo,
    canUndo: canUndo(),
    canRedo: canRedo(),
    clearHistory
  };
};
