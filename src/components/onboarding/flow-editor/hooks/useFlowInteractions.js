import { useCallback, useEffect, useState } from 'react';
import { useReactFlow } from 'reactflow';
import { DELETE_KEYS } from '../utils/flowEditorConstants';
import useFlowStore from '@/stores/useFlowStore';

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
  const [contextMenu, setContextMenu] = useState(null);
  const reactFlowInstance = useReactFlow();

  const handleKeyDown = useCallback((event) => {
    if (
      event.target.tagName === 'INPUT' ||
      event.target.tagName === 'TEXTAREA' ||
      event.target.isContentEditable
    ) {
      return;
    }

    if (event.ctrlKey || event.metaKey) {
      const key = (event.key || '').toLowerCase();
      const isZ = key === 'z' || event.code === 'KeyZ';

      if (isZ) {
        event.preventDefault();
        event.stopPropagation();
        if (event.metaKey && event.altKey && !event.shiftKey) {
          if (typeof undo === 'function') undo();
        } else if (event.shiftKey && event.metaKey) {
          if (typeof redo === 'function') redo();
        } else if (!event.metaKey && event.ctrlKey) {
          if (typeof undo === 'function') undo();
        }
      } else if (key === 'y' || event.code === 'KeyY') {
        event.preventDefault();
        event.stopPropagation();
        if (typeof redo === 'function') redo();
      }
    }

    if (DELETE_KEYS.includes(event.key) && selectedNode) {
      try {
        event.preventDefault();
        const nodeId = selectedNode.id;

        try {
          if (typeof removeConnectedEdges === 'function') {
            removeConnectedEdges(nodeId);
          }
          const flowStore = useFlowStore.getState();
          if (flowStore && Array.isArray(flowStore.edges)) {
            const edgesToRemove = flowStore.edges.filter(edge => 
              edge && (edge.source === nodeId || edge.target === nodeId)
            );
            if (edgesToRemove.length > 0) {
              if (reactFlowInstance) {
                edgesToRemove.forEach(edge => {
                  try {
                    reactFlowInstance.deleteElements({ edges: [edge] });
                  } catch (e) { /* Silently fail */ }
                });
              }
              if (flowStore.onEdgesChange) {
                try {
                  flowStore.onEdgesChange(edgesToRemove.map(edge => ({ id: edge.id, type: 'remove' })));
                } catch (e) { /* Silently fail */ }
              }
              if (flowStore.setEdges) {
                try {
                  const remainingEdges = flowStore.edges.filter(edge => 
                    edge && !(edge.source === nodeId || edge.target === nodeId)
                  );
                  flowStore.setEdges(remainingEdges);
                } catch (e) { /* Silently fail */ }
              }
            }
          }
        } catch (edgeError) { /* Silently fail */ }

        try {
          if (typeof removeNode === 'function') {
            removeNode(nodeId);
          }
          if (reactFlowInstance) {
            try {
              reactFlowInstance.deleteElements({ nodes: [{ id: nodeId }] });
            } catch (e) { /* Silently fail */ }
          }
          const flowStore = useFlowStore.getState();
          if (flowStore) {
            if (flowStore.onNodesChange) {
              try {
                flowStore.onNodesChange([{ id: nodeId, type: 'remove' }]);
              } catch (e) { /* Silently fail */ }
            }
            if (flowStore.setNodes && Array.isArray(flowStore.nodes)) {
              try {
                const remainingNodes = flowStore.nodes.filter(node => node && node.id !== nodeId);
                flowStore.setNodes(remainingNodes);
              } catch (e) { /* Silently fail */ }
            }
          }
        } catch (nodeError) { /* Silently fail */ }

        if (typeof setSelectedNode === 'function') {
          setSelectedNode(null);
        } else {
          const flowStore = useFlowStore.getState();
          if (flowStore && flowStore.setSelectedNode) {
            flowStore.setSelectedNode(null);
          }
        }
      } catch (error) { /* Silently fail */ }
    }
  }, [selectedNode, removeNode, removeConnectedEdges, setSelectedNode, undo, redo, reactFlowInstance]);

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

  const handleContextMenu = useCallback((event) => {
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
  }, [reactFlowInstance]);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handlePaneClick = useCallback(() => {
    try {
      if (typeof setSelectedNode === 'function') {
        setSelectedNode(null);
      } else {
        const flowStore = useFlowStore.getState();
        if (flowStore && typeof flowStore.setSelectedNode === 'function') {
          flowStore.setSelectedNode(null);
        }
      }
    } catch (error) { /* Silently fail */ }
    closeContextMenu();
  }, [setSelectedNode, closeContextMenu]);

  const handleNodeClick = useCallback((event, node) => {
    if (!node) return;
    event.stopPropagation();
    try {
      if (typeof setSelectedNode === 'function') {
        setSelectedNode(node);
      } else {
        const flowStore = useFlowStore.getState();
        if (flowStore && typeof flowStore.setSelectedNode === 'function') {
          flowStore.setSelectedNode(node);
        } 
      }
    } catch (error) { /* Silently fail */ }
    closeContextMenu();
  }, [setSelectedNode, closeContextMenu]);

  useEffect(() => {
    const opts = { capture: true };
    window.addEventListener('keydown', handleKeyDown, opts);
    document.addEventListener('keydown', handleKeyDown, opts);
    window.addEventListener('keyup', handleKeyUp, opts);
    document.addEventListener('keyup', handleKeyUp, opts);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, opts);
      document.removeEventListener('keydown', handleKeyDown, opts);
      window.removeEventListener('keyup', handleKeyUp, opts);
      document.removeEventListener('keyup', handleKeyUp, opts);
    };
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
