import { useCallback, useEffect, useState } from 'react';
import { useReactFlow } from 'reactflow';

import useFlowStore from '@/stores/use-flow-store';

// Helper: Manejar selección de nodos con fallback a store
function _handleNodeSelection(node, setSelectedNode) {
  try {
    if (typeof setSelectedNode === 'function') {
      setSelectedNode(node);
    } else {
      const flowStore = useFlowStore.getState();
      if (flowStore && typeof flowStore.setSelectedNode === 'function') {
        flowStore.setSelectedNode(node);
      }
    }
  } catch {
    /* Silently fail */
  }
}

// Helper: Configurar event listeners para teclado
function _setupEventListeners(handleKeyDown, handleKeyUp) {
  const options = { capture: true };
  globalThis.addEventListener('keydown', handleKeyDown, options);
  document.addEventListener('keydown', handleKeyDown, options);
  globalThis.addEventListener('keyup', handleKeyUp, options);
  document.addEventListener('keyup', handleKeyUp, options);

  return () => {
    globalThis.removeEventListener('keydown', handleKeyDown, options);
    document.removeEventListener('keydown', handleKeyDown, options);
    globalThis.removeEventListener('keyup', handleKeyUp, options);
    document.removeEventListener('keyup', handleKeyUp, options);
  };
}

import { DELETE_KEYS } from '../utils/flowEditorConstants';
import {
  handleNodeDeletion,
  handleUndoRedo,
} from '../utils/flowInteractionUtilities';

/**
 * Hook personalizado para gestionar las interacciones del usuario con el editor de flujos.
 * @param {Object} selectedNode - Nodo seleccionado actualmente.
 * @param {Function} setSelectedNode - Funciu00f3n para actualizar el nodo seleccionado.
 * @param {Function} undo - Funciu00f3n para deshacer.
 * @param {Function} redo - Funciu00f3n para rehacer.
 * @returns {Object} - Mu00e9todos y estado para gestionar interacciones.
 */
const useFlowInteractions = ({ selectedNode, setSelectedNode, undo, redo }) => {
  const [contextMenu, setContextMenu] = useState();
  const reactFlowInstance = useReactFlow();

  const handleKeyDown = useCallback(
    (event) => {
      if (
        event.target.tagName === 'INPUT' ||
        event.target.tagName === 'TEXTAREA' ||
        event.target.isContentEditable
      ) {
        return;
      }

      handleUndoRedo(event, undo, redo);

      if (DELETE_KEYS.includes(event.key)) {
        event.preventDefault();
        handleNodeDeletion(selectedNode, reactFlowInstance, setSelectedNode);
      }
    },
    [selectedNode, setSelectedNode, undo, redo, reactFlowInstance],
  );

  const handleKeyUp = useCallback((event) => {
    if (event.ctrlKey || event.metaKey) {
      const key = event.key.toLowerCase();
      if (key === 'z' || key === 'y') {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation?.();
      }
    }
  }, []);

  const handleContextMenu = useCallback(
    (event) => {
      event.preventDefault();
      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        flowPosition: position,
      });
    },
    [reactFlowInstance],
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu(undefined);
  }, []);

  const handlePaneClick = useCallback(() => {
    _handleNodeSelection(undefined, setSelectedNode);
    closeContextMenu();
  }, [setSelectedNode, closeContextMenu]);

  const handleNodeClick = useCallback(
    (event, node) => {
      if (!node) return;
      event.stopPropagation();
      _handleNodeSelection(node, setSelectedNode);
      closeContextMenu();
    },
    [setSelectedNode, closeContextMenu],
  );

  useEffect(() => {
    return _setupEventListeners(handleKeyDown, handleKeyUp);
  }, [handleKeyDown, handleKeyUp]);

  return {
    contextMenu,
    handleContextMenu,
    closeContextMenu,
    handlePaneClick,
    handleNodeClick,
  };
};

export default useFlowInteractions;
