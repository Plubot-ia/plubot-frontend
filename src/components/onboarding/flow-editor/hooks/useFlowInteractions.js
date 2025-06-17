import { useCallback, useEffect, useState, useRef } from 'react';
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
  // Crear una referencia al store para acceso directo cuando las props fallen
  const useFlowStoreRef = typeof useFlowStore !== 'undefined' ? useFlowStore : null;
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

    // Atajos de teclado para deshacer/rehacer (normalizamos a minúsculas)
    if (event.ctrlKey || event.metaKey) {
      const key = (event.key || '').toLowerCase();
      const isZ = key === 'z' || event.code === 'KeyZ';
      // --- Mac / Safari workaround ---
      // ⌥⌘Z (alt+meta) = Undo
      // ⇧⌘Z (shift+meta) = Redo
      // Ctrl+Z / Ctrl+Y siguen funcionando para Windows/Linux
      if (isZ) {
        event.preventDefault();
        event.stopPropagation();
        if (event.metaKey && event.altKey && !event.shiftKey) {
          // Option+Cmd+Z explicit Undo on Mac
          if (typeof undo === 'function') undo();
          else console.warn('Undo function not available');
        } else if (event.shiftKey && event.metaKey) {
          if (typeof redo === 'function') redo();
          else console.warn('Redo function not available');
        } else if (!event.metaKey && event.ctrlKey) {
          // Ctrl+Z for Windows/Linux
          if (typeof undo === 'function') undo();
          else console.warn('Undo function not available');
        } else {
          // Plain Cmd+Z (Safari back) -> lo ignoramos para no interferir con navegación
          console.debug('Cmd+Z ignorado para evitar navegación del navegador');
        }
      } else if (key === 'y' || event.code === 'KeyY') {
        event.preventDefault();
        event.stopPropagation();
        if (typeof redo === 'function') redo();
        else console.warn('Redo function not available');
      }
    }

    // Eliminar nodo seleccionado - con manejo de errores mejorado y más robusto
    if (DELETE_KEYS.includes(event.key) && selectedNode) {
      try {
        event.preventDefault();
        console.log('[useFlowInteractions] Eliminando nodo:', selectedNode.id);
        
        // Las teclas de eliminación están definidas en la constante importada DELETE_KEYS
        // que incluye: Delete, Backspace, Suprimir, Del, Remove para compatibilidad con diferentes teclados
        
        // Capturar el ID del nodo seleccionado para usarlo incluso si selectedNode cambia
        const nodeId = selectedNode.id;
        const nodeType = selectedNode.type;
        
        console.log(`[useFlowInteractions] Eliminando nodo de tipo '${nodeType}' con ID: ${nodeId}`);
        
        // 1. Eliminar las aristas conectadas primero para evitar referencias rotas
        try {
          // Intentándolo de varias formas para asegurar éxito
          // Primero, intentar con la función proporcionada
          if (typeof removeConnectedEdges === 'function') {
            removeConnectedEdges(nodeId);
          } 
          // Si no funciona, usar el store directamente
          const flowStore = useFlowStore.getState();
          if (flowStore) {
            // Asegurarse de que edges es un array
            if (Array.isArray(flowStore.edges)) {
              // Encontrar todas las aristas conectadas al nodo
              const edgesToRemove = flowStore.edges.filter(edge => 
                edge && (edge.source === nodeId || edge.target === nodeId)
              );
              
              if (edgesToRemove.length > 0) {
                console.log(`[useFlowInteractions] Eliminando ${edgesToRemove.length} aristas conectadas al nodo ${nodeId}`);
                
                // Intentar con ReactFlow directamente
                if (reactFlowInstance) {
                  // Eliminar cada arista individualmente para mayor probabilidad de éxito
                  edgesToRemove.forEach(edge => {
                    try {
                      reactFlowInstance.deleteElements({ edges: [edge] });
                    } catch (e) {
                      console.log(`[useFlowInteractions] Error al eliminar arista ${edge.id} con ReactFlow:`, e);
                    }
                  });
                }
                
                // También intentar con el método de onEdgesChange del store
                if (flowStore.onEdgesChange) {
                  try {
                    flowStore.onEdgesChange(edgesToRemove.map(edge => ({
                      id: edge.id,
                      type: 'remove'
                    })));
                  } catch (e) {
                    console.log('[useFlowInteractions] Error al eliminar aristas con onEdgesChange:', e);
                  }
                }
                
                // Última alternativa: actualizar el estado directamente
                if (flowStore.setEdges) {
                  try {
                    const remainingEdges = flowStore.edges.filter(edge => 
                      edge && !(edge.source === nodeId || edge.target === nodeId)
                    );
                    flowStore.setEdges(remainingEdges);
                  } catch (e) {
                    console.log('[useFlowInteractions] Error al actualizar aristas con setEdges:', e);
                  }
                }
              }
            }
          }
        } catch (edgeError) {
          console.error('[useFlowInteractions] Error al eliminar aristas:', edgeError);
        }
        
        // 2. Eliminar el nodo usando múltiples métodos para asegurar que se elimine
        try {
          // Intentar primero con la función proporcionada
          if (typeof removeNode === 'function') {
            removeNode(nodeId);
          }
          
          // También intentar con ReactFlow directamente
          if (reactFlowInstance) {
            try {
              reactFlowInstance.deleteElements({ nodes: [{ id: nodeId }] });
            } catch (e) {
              console.log('[useFlowInteractions] Error al eliminar nodo con ReactFlow:', e);
            }
          }
          
          // Intentar con el store como última alternativa
          const flowStore = useFlowStore.getState();
          if (flowStore) {
            // Intentar con onNodesChange
            if (flowStore.onNodesChange) {
              try {
                flowStore.onNodesChange([{
                  id: nodeId,
                  type: 'remove'
                }]);
              } catch (e) {
                console.log('[useFlowInteractions] Error al eliminar nodo con onNodesChange:', e);
              }
            }
            
            // Intentar actualizando el estado directamente
            if (flowStore.setNodes && Array.isArray(flowStore.nodes)) {
              try {
                const remainingNodes = flowStore.nodes.filter(node => node && node.id !== nodeId);
                flowStore.setNodes(remainingNodes);
              } catch (e) {
                console.log('[useFlowInteractions] Error al actualizar nodos con setNodes:', e);
              }
            }
          }
        } catch (nodeError) {
          console.error('[useFlowInteractions] Error al eliminar nodo:', nodeError);
        }
        
        // 3. Limpiar la seleccion
        if (typeof setSelectedNode === 'function') {
          setSelectedNode(null);
        } else {
          // Alternativa: usar directamente el store
          const flowStore = useFlowStore.getState();
          if (flowStore && flowStore.setSelectedNode) {
            flowStore.setSelectedNode(null);
          }
        }
        
        console.log('[useFlowInteractions] Nodo eliminado correctamente');
      } catch (error) {
        console.error('[useFlowInteractions] Error al eliminar nodo:', error);
      }
    }
  }, [selectedNode, removeNode, removeConnectedEdges, setSelectedNode, undo, redo]);

  // Safari abre pestaña en keyup, por lo que bloqueamos también allí
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
    // Método seguro para actualizar la selección de nodos
    try {
      if (typeof setSelectedNode === 'function') {
        setSelectedNode(null);
      } else {
        // Alternativa: usar directamente el store
        const flowStore = useFlowStore.getState();
        if (flowStore && typeof flowStore.setSelectedNode === 'function') {
          flowStore.setSelectedNode(null);
        }
      }
    } catch (error) {
      console.warn('[useFlowInteractions] Error al deseleccionar nodos:', error);
    }
    
    closeContextMenu();
  }, [setSelectedNode, closeContextMenu]);

  /**
   * Maneja la selección de un nodo
   */
  const handleNodeClick = useCallback((event, node) => {
    if (!node) return;
    
    event.stopPropagation();
    
    // Método seguro para actualizar la selección de nodos
    try {
      console.log('[useFlowInteractions] Seleccionando nodo:', node.id);
      
      if (typeof setSelectedNode === 'function') {
        setSelectedNode(node);
      } else {
        // Alternativa: usar directamente el store
        const flowStore = useFlowStore.getState();
        if (flowStore && typeof flowStore.setSelectedNode === 'function') {
          flowStore.setSelectedNode(node);
        } else {
          console.warn('[useFlowInteractions] setSelectedNode no está disponible');
        }
      }
    } catch (error) {
      console.error('[useFlowInteractions] Error al seleccionar nodo:', error);
    }
    
    closeContextMenu();
  }, [setSelectedNode, closeContextMenu]);

  // Registrar eventos de teclado
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
