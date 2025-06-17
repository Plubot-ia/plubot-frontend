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
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;
}

export const useUndoRedo = (): UseUndoRedoReturn => {
  const selector = useCallback((state: any) => ({
    history: state.history,
    setHistory: state.setHistory,
    undoAction: state.undo,
    redoAction: state.redo,
  }), []);

  const { history, setHistory, undoAction, redoAction } = useFlowStore(selector, shallow);

  // Añadir nuevo snapshot
  const addToHistory = useCallback((entry: HistoryEntry) => {
    if (!history) return;
    const deepCloneEntry = JSON.parse(JSON.stringify(entry));
    setHistory((prev: any) => {
      const updatedPast = [...prev.past, deepCloneEntry].slice(-prev.maxHistory);
      return { ...prev, past: updatedPast, future: [] };
    });
  }, [history, setHistory]);

  const canUndo = () => useFlowStore.getState().history.past.length > 0;
  const canRedo = () => useFlowStore.getState().history.future.length > 0;

  const undo = useCallback(() => {
    undoAction();
  }, [undoAction]);

  const redo = useCallback(() => {
    redoAction();
  }, [redoAction]);

  const clearHistory = useCallback(() => {
    setHistory({ past: [], future: [], maxHistory: history?.maxHistory || 50 });
  }, [setHistory, history]);

  return { addToHistory, undo, redo, canUndo, canRedo, clearHistory };
};
