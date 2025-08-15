import { useCallback, useRef } from 'react';

/**
 * Hook personalizado para manejar el historial de cambios en el editor
 * @param {Object} options - Opciones de configuración
 * @param {number} [options.maxHistory=100] - Número máximo de entradas en el historial
 * @returns {Object} - Métodos para manejar el historial
 */
const useHistory = ({ maxHistory = 100 } = {}) => {
  const history = useRef([]);
  const historyIndex = useRef(-1);
  const isUndoRedo = useRef(false);

  /**
   * Agrega una nueva entrada al historial
   * @param {Object} state - Estado a guardar en el historial
   */
  const addToHistory = useCallback(
    (state) => {
      if (isUndoRedo.current) {
        isUndoRedo.current = false;
        return;
      }

      // Eliminar cualquier estado futuro (si se deshizo y luego se hizo un cambio nuevo)
      if (historyIndex.current < history.current.length - 1) {
        history.current = history.current.slice(0, historyIndex.current + 1);
      }

      // Agregar el nuevo estado al historial
      history.current.push(structuredClone(state));

      // Limitar el tamaño del historial
      if (history.current.length > maxHistory) {
        history.current.shift();
      }

      // Siempre actualizar el índice para que apunte al nuevo estado
      historyIndex.current = history.current.length - 1;
    },
    [maxHistory],
  );

  /**
   * Deshace el último cambio
   * @returns {Object|null} - Estado anterior o null si no hay más cambios para deshacer
   */
  const undo = useCallback(() => {
    if (historyIndex.current <= 0) {
      return;
    }

    isUndoRedo.current = true;
    historyIndex.current -= 1;
    return history.current[historyIndex.current];
  }, []);

  /**
   * Rehace el último cambio deshecho
   * @returns {Object|null} - Estado siguiente o null si no hay más cambios para rehacer
   */
  const redo = useCallback(() => {
    if (historyIndex.current >= history.current.length - 1) {
      return;
    }

    isUndoRedo.current = true;
    historyIndex.current += 1;
    return history.current[historyIndex.current];
  }, []);

  /**
   * Limpia el historial
   */
  const clearHistory = useCallback(() => {
    history.current = [];
    historyIndex.current = -1;
  }, []);

  /**
   * Verifica si se puede deshacer
   * @returns {boolean} - true si se puede deshacer, false en caso contrario
   */
  const canUndo = useCallback(() => historyIndex.current > 0, []);

  /**
   * Verifica si se puede rehacer
   * @returns {boolean} - true si se puede rehacer, false en caso contrario
   */
  const canRedo = useCallback(() => historyIndex.current < history.current.length - 1, []);

  return {
    addToHistory,
    undo,
    redo,
    clearHistory,
    canUndo,
    canRedo,
    getCurrentState: () => history.current[historyIndex.current],
    getHistory: () => ({
      history: [...history.current],
      index: historyIndex.current,
      canUndo: historyIndex.current > 0,
      canRedo: historyIndex.current < history.current.length - 1,
    }),
  };
};

export default useHistory;
