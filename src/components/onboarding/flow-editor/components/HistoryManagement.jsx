import { useCallback } from 'react';

// Hook para la gestión del historial de acciones en el editor de flujos
export const useHistoryManagement = (historyProperties) => {
  const { historyState, setStatusMessage } = historyProperties;
  const { undo, redo, canUndo, canRedo } = historyState;

  /**
   * Deshace la última acción
   */
  const handleUndo = useCallback(() => {
    if (canUndo()) {
      undo();
      setStatusMessage('Acciu00f3n deshecha');
    }
  }, [undo, canUndo, setStatusMessage]);

  /**
   * Rehace la última acción deshecha
   */
  const handleRedo = useCallback(() => {
    if (canRedo()) {
      redo();
      setStatusMessage('Acciu00f3n rehecha');
    }
  }, [redo, canRedo, setStatusMessage]);

  /**
   * Registra eventos de teclado para atajos de historial
   */
  const registerKeyboardShortcuts = useCallback(
    (keyboardEvent) => {
      // Ignorar eventos si el foco estu00e1 en un campo de entrada
      if (
        keyboardEvent.target.tagName === 'INPUT' ||
        keyboardEvent.target.tagName === 'TEXTAREA' ||
        keyboardEvent.target.isContentEditable
      ) {
        return;
      }

      // Atajos de teclado para deshacer/rehacer
      if (keyboardEvent.ctrlKey || keyboardEvent.metaKey) {
        if (keyboardEvent.key === 'z') {
          keyboardEvent.preventDefault();
          if (keyboardEvent.shiftKey) {
            handleRedo();
          } else {
            handleUndo();
          }
        } else if (keyboardEvent.key === 'y') {
          keyboardEvent.preventDefault();
          handleRedo();
        }
      }
    },
    [handleUndo, handleRedo],
  );

  return {
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
    registerKeyboardShortcuts,
  };
};
