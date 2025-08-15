import { useEffect } from 'react';

/**
 * Hook para manejar atajos de teclado (undo, redo, save).
 * @param {object} params - Parámetros del hook.
 * @param {Function} params.onUndo - Callback para la acción de deshacer.
 * @param {Function} params.onRedo - Callback para la acción de rehacer.
 * @param {Function} params.onSave - Callback para la acción de guardar.
 */
const useKeyboardShortcuts = ({ onUndo, onRedo, onSave }) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      const isModifierKeyPressed = event.ctrlKey || event.metaKey;

      if (!isModifierKeyPressed) {
        return;
      }

      switch (event.key) {
        case 'z': {
          if (event.shiftKey) {
            event.preventDefault();
            onRedo();
          } else {
            event.preventDefault();
            onUndo();
          }
          break;
        }
        case 's': {
          event.preventDefault();
          onSave();
          break;
        }
        default: {
          break;
        }
      }
    };

    globalThis.addEventListener('keydown', handleKeyDown);

    return () => {
      globalThis.removeEventListener('keydown', handleKeyDown);
    };
  }, [onUndo, onRedo, onSave]);
};

export default useKeyboardShortcuts;
