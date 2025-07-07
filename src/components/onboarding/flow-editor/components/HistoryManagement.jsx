import PropTypes from 'prop-types';
import React, { useCallback } from 'react';

/**
 * Componente para la gestiu00f3n del historial de acciones en el editor de flujos
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.historyState - Estado y funciones para gestionar el historial
 * @param {Function} props.setStatusMessage - Funciu00f3n para establecer mensajes de estado
 */
const HistoryManagement = ({ historyState, setStatusMessage }) => {
  const { undo, redo, canUndo, canRedo } = historyState;

  /**
   * Deshace la u00faltima acciu00f3n
   */
  const handleUndo = useCallback(() => {
    if (canUndo()) {
      undo();
      setStatusMessage('Acciu00f3n deshecha');
    }
  }, [undo, canUndo, setStatusMessage]);

  /**
   * Rehace la u00faltima acciu00f3n deshecha
   */
  const handleRedo = useCallback(() => {
    if (canRedo()) {
      redo();
      setStatusMessage('Acciu00f3n rehecha');
    }
  }, [redo, canRedo, setStatusMessage]);

  // Este componente no renderiza nada, solo proporciona funcionalidad
};

HistoryManagement.propTypes = {
  historyState: PropTypes.shape({
    undo: PropTypes.func.isRequired,
    redo: PropTypes.func.isRequired,
    canUndo: PropTypes.func.isRequired,
    canRedo: PropTypes.func.isRequired,
  }).isRequired,
  setStatusMessage: PropTypes.func.isRequired,
};

export default HistoryManagement;

// Exportar las funciones para usar directamente
export const useHistoryManagement = (properties) => {
  const { historyState, setStatusMessage } = properties;
  const { undo, redo, canUndo, canRedo } = historyState;

  /**
   * Deshace la u00faltima acciu00f3n
   */
  const handleUndo = useCallback(() => {
    if (canUndo()) {
      undo();
      setStatusMessage('Acciu00f3n deshecha');
    }
  }, [undo, canUndo, setStatusMessage]);

  /**
   * Rehace la u00faltima acciu00f3n deshecha
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
    (event) => {
      // Ignorar eventos si el foco estu00e1 en un campo de entrada
      if (
        event.target.tagName === 'INPUT' ||
        event.target.tagName === 'TEXTAREA' ||
        event.target.isContentEditable
      ) {
        return;
      }

      // Atajos de teclado para deshacer/rehacer
      if (event.ctrlKey || event.metaKey) {
        if (event.key === 'z') {
          event.preventDefault();
          if (event.shiftKey) {
            handleRedo();
          } else {
            handleUndo();
          }
        } else if (event.key === 'y') {
          event.preventDefault();
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
