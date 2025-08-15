// src/hooks/useUndoRedo.ts
import { useCallback } from 'react';
import type { Edge, Node } from 'reactflow';
import { shallow } from 'zustand/shallow';

import useFlowStore from '@/stores/use-flow-store';

// Define la estructura para una entrada de historial, usando `unknown` para seguridad de tipos.
export interface HistoryEntry {
  [key: string]: unknown;
  type: string;
}

// Define la forma del estado del historial.
interface HistoryState {
  past: HistoryEntry[];
  future: HistoryEntry[];
  maxHistory: number;
}

// Define el segmento del store de Zustand con el que este hook interactúa.
interface UndoRedoStoreSlice {
  history: HistoryState;
  setHistory: (updater: HistoryState | ((history: HistoryState) => HistoryState)) => void;
  undo: () => void;
  redo: () => void;
}

// Define el valor de retorno del hook.
export interface UseUndoRedoReturn {
  addToHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;
}

export const useUndoRedo = (): UseUndoRedoReturn => {
  const selector = useCallback(
    (state: UndoRedoStoreSlice) => ({
      history: state.history,
      setHistory: state.setHistory,
      undoAction: state.undo,
      redoAction: state.redo,
    }),
    [],
  );

  const { history, setHistory, undoAction, redoAction } = useFlowStore(selector, shallow);

  const addToHistory = useCallback(() => {
    if (!history) return;

    const { nodes, edges } = useFlowStore.getState() as {
      nodes: Node[];
      edges: Edge[];
    };
    const entry = { type: 'snapshot', nodes, edges };

    // Clonación profunda para prevenir mutaciones.
    const deepCloneEntry = JSON.parse(JSON.stringify(entry)) as HistoryEntry;

    setHistory((previous) => {
      const updatedPast = [...previous.past, deepCloneEntry].slice(-previous.maxHistory);
      return { ...previous, past: updatedPast, future: [] };
    });
  }, [history, setHistory]);

  const canUndo = useCallback(() => {
    return (useFlowStore.getState() as UndoRedoStoreSlice).history.past.length > 0;
  }, []);

  const canRedo = useCallback(() => {
    return (useFlowStore.getState() as UndoRedoStoreSlice).history.future.length > 0;
  }, []);

  const undo = useCallback(() => {
    undoAction();
  }, [undoAction]);

  const redo = useCallback(() => {
    redoAction();
  }, [redoAction]);

  const clearHistory = useCallback(() => {
    // Uso del operador de coalescencia nula para mayor seguridad.
    setHistory({ past: [], future: [], maxHistory: history?.maxHistory ?? 50 });
  }, [setHistory, history]);

  return { addToHistory, undo, redo, canUndo, canRedo, clearHistory };
};
