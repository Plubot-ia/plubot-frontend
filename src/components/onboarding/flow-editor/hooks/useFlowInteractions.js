import { useCallback, useEffect, useState } from 'react';
import { useReactFlow } from 'reactflow';

import useFlowStore from '@/stores/use-flow-store';

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
  const [contextMenu, setContextMenu] = useState(null);
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
          } else if (
            !event.metaKey &&
            event.ctrlKey &&
            typeof undo === 'function'
          )
            undo();
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
              const edgesToRemove = flowStore.edges.filter(
                (edge) =>
                  edge && (edge.source === nodeId || edge.target === nodeId),
              );
              if (edgesToRemove.length > 0) {
                if (reactFlowInstance) {
                  for (const edge of edgesToRemove) {
                    try {
                      reactFlowInstance.deleteElements({ edges: [edge] });
                    } catch {
                      /* Silently fail */
                    }
                  }
                }
                if (flowStore.onEdgesChange) {
                  try {
                    flowStore.onEdgesChange(
                      edgesToRemove.map((edge) => ({
                        id: edge.id,
                        type: 'remove',
                      })),
                    );
                  } catch {
                    /* Silently fail */
                  }
                }
                if (flowStore.setEdges) {
                  try {
                    const remainingEdges = flowStore.edges.filter(
                      (edge) =>
                        edge &&
                        !(edge.source === nodeId || edge.target === nodeId),
                    );
                    flowStore.setEdges(remainingEdges);
                  } catch {
                    /* Silently fail */
                  }
                }
              }
            }
          } catch {
            /* Silently fail */
          }

          try {
            if (typeof removeNode === 'function') {
              removeNode(nodeId);
            }
            if (reactFlowInstance) {
              try {
                reactFlowInstance.deleteElements({ nodes: [{ id: nodeId }] });
              } catch {
                /* Silently fail */
              }
            }
            const flowStore = useFlowStore.getState();
            if (flowStore) {
              if (flowStore.onNodesChange) {
                try {
                  flowStore.onNodesChange([{ id: nodeId, type: 'remove' }]);
                } catch {
                  /* Silently fail */
                }
              }
              if (flowStore.setNodes && Array.isArray(flowStore.nodes)) {
                try {
                  const remainingNodes = flowStore.nodes.filter(
                    (node) => node && node.id !== nodeId,
                  );
                  flowStore.setNodes(remainingNodes);
                } catch {
                  /* Silently fail */
                }
              }
            }
          } catch {
            /* Silently fail */
          }

          if (typeof setSelectedNode === 'function') {
            setSelectedNode(undefined);
          } else {
            const flowStore = useFlowStore.getState();
            if (flowStore && flowStore.setSelectedNode) {
              flowStore.setSelectedNode(undefined);
            }
          }
        } catch {
          /* Silently fail */
        }
      }
    },
    [
      selectedNode,
      removeNode,
      removeConnectedEdges,
      setSelectedNode,
      undo,
      redo,
      reactFlowInstance,
    ],
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
    setContextMenu(null);
  }, []);

  const handlePaneClick = useCallback(() => {
    try {
      if (typeof setSelectedNode === 'function') {
        setSelectedNode(undefined);
      } else {
        const flowStore = useFlowStore.getState();
        if (flowStore && typeof flowStore.setSelectedNode === 'function') {
          flowStore.setSelectedNode(undefined);
        }
      }
    } catch {
      /* Silently fail */
    }
    closeContextMenu();
  }, [setSelectedNode, closeContextMenu]);

  const handleNodeClick = useCallback(
    (event, node) => {
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
      } catch {
        /* Silently fail */
      }
      closeContextMenu();
    },
    [setSelectedNode, closeContextMenu],
  );

  useEffect(() => {
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
