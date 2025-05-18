import { useCallback, useEffect, useState } from 'react';
import { useReactFlow } from 'reactflow';
import { DELETE_KEYS } from '../utils/flowEditorConstants';

/**
 * Hook personalizado para gestionar las interacciones del usuario con el editor de flujos
 * @param {Function} removeNode - Funciu00f3n para eliminar un nodo
 * @param {Function} removeConnectedEdges - Funciu00f3n para eliminar aristas conectadas a un nodo
 * @param {Object} selectedNode - Nodo seleccionado actualmente
 * @param {Function} setSelectedNode - Funciu00f3n para actualizar el nodo seleccionado
 * @param {Function} undo - Funciu00f3n para deshacer
 * @param {Function} redo - Funciu00f3n para rehacer
 * @returns {Object} - Mu00e9todos y estado para gestionar interacciones
 */
const useFlowInteractions = ({
  removeNode,
  removeConnectedEdges,
  selectedNode,
  setSelectedNode,
  undo,
  redo,
}) => {
  // Estado para el menu00fa contextual
  const [contextMenu, setContextMenu] = useState(null);
  
  // Acceso a la instancia de ReactFlow
  const reactFlowInstance = useReactFlow();

  /**
   * Maneja el evento de teclado para eliminar nodos o deshacer/rehacer
   */
  const handleKeyDown = useCallback((event) => {
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
          redo();
        } else {
          undo();
        }
      } else if (event.key === 'y') {
        event.preventDefault();
        redo();
      }
    }

    // Eliminar nodo seleccionado
    if (DELETE_KEYS.includes(event.key) && selectedNode) {
      event.preventDefault();
      removeConnectedEdges(selectedNode.id);
      removeNode(selectedNode.id);
      setSelectedNode(null);
    }
  }, [selectedNode, removeNode, removeConnectedEdges, setSelectedNode, undo, redo]);

  /**
   * Maneja el clic derecho para mostrar menu00fa contextual
   */
  const handleContextMenu = useCallback((event) => {
    // Prevenir menu00fa contextual por defecto
    event.preventDefault();
    
    // Obtener posiciu00f3n del clic
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
  }, [reactFlowInstance]);

  /**
   * Cierra el menu00fa contextual
   */
  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  /**
   * Maneja el clic en el fondo para deseleccionar nodos
   */
  const handlePaneClick = useCallback(() => {
    setSelectedNode(null);
    closeContextMenu();
  }, [setSelectedNode, closeContextMenu]);

  /**
   * Maneja la selecciu00f3n de un nodo
   */
  const handleNodeClick = useCallback((event, node) => {
    event.stopPropagation();
    setSelectedNode(node);
    closeContextMenu();
  }, [setSelectedNode, closeContextMenu]);

  // Registrar eventos de teclado
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    contextMenu,
    handleContextMenu,
    closeContextMenu,
    handlePaneClick,
    handleNodeClick,
  };
};

export default useFlowInteractions;
