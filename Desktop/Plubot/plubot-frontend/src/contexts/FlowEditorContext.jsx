import React, { createContext, useContext, useMemo, useCallback, useEffect, useRef } from 'react';
import { useFlowStore } from '@/stores/useFlowStore';
import useFlowOptimization from '@/hooks/useFlowOptimization';
import useHistory from '@/hooks/useHistory';
import { NODE_TYPES, EDGE_TYPES } from '@/utils/nodeConfig';

// Crear el contexto
const FlowEditorContext = createContext();

/**
 * Proveedor de contexto para el editor de flujos
 * Maneja el estado global, historial y optimizaciones
 */
export const FlowEditorProvider = ({ children }) => {
  // Usar el store de Zustand
  const flowStore = useFlowStore();
  
  // Configurar historial
  const history = useHistory({
    maxHistory: 100,
  });

  // Configurar optimizaciones de rendimiento
  const optimization = useFlowOptimization({
    enabled: true,
    throttle: 32,
    idleTimeout: 2000,
  });

  // Referencia para el último estado guardado
  const lastSavedState = useRef(null);

  // Efecto para manejar el historial de cambios
  useEffect(() => {
    // Guardar el estado inicial en el historial
    history.addToHistory({
      nodes: flowStore.nodes,
      edges: flowStore.edges,
      viewport: flowStore.viewport,
    });
    
    // Configurar atajos de teclado para deshacer/rehacer
    const handleKeyDown = (e) => {
      // Ctrl+Z o Cmd+Z para deshacer
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        const state = history.undo();
        if (state) {
          flowStore.setNodes(state.nodes);
          flowStore.setEdges(state.edges);
          if (state.viewport) {
            flowStore.setViewport(state.viewport);
          }
        }
      }
      
      // Ctrl+Shift+Z o Cmd+Shift+Z para rehacer
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        const state = history.redo();
        if (state) {
          flowStore.setNodes(state.nodes);
          flowStore.setEdges(state.edges);
          if (state.viewport) {
            flowStore.setViewport(state.viewport);
          }
        }
      }
      
      // Ctrl+S o Cmd+S para guardar
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flowStore, history]);

  // Función para aplicar cambios a los nodos
  const applyNodeChanges = useCallback((changes, nodes) => {
    return nodes.map(node => {
      const change = changes.find(c => c.id === node.id);
      if (!change) return node;
      
      switch (change.type) {
        case 'select':
          return { ...node, selected: change.selected };
        case 'position':
          return {
            ...node,
            position: change.position || node.position,
            dragging: change.dragging !== undefined ? change.dragging : node.dragging,
          };
        case 'dimensions':
          return {
            ...node,
            width: change.dimensions?.width || node.width,
            height: change.dimensions?.height || node.height,
          };
        default:
          return node;
      }
    });
  }, []);

  // Función para aplicar cambios a las aristas
  const applyEdgeChanges = useCallback((changes, edges) => {
    return edges
      .filter(edge => !changes.some(c => c.type === 'remove' && c.id === edge.id))
      .map(edge => {
        const change = changes.find(c => c.id === edge.id);
        if (!change) return edge;
        
        switch (change.type) {
          case 'select':
            return { ...edge, selected: change.selected };
          case 'update':
            return { ...edge, ...change.updates };
          default:
            return edge;
        }
      });
  }, []);

  // Función para manejar cambios en los nodos
  const handleNodesChange = useCallback((changes) => {
    flowStore.setNodes(prevNodes => {
      const newNodes = applyNodeChanges(changes, prevNodes);
      
      // Agregar al historial si hay cambios significativos
      const significantChanges = changes.filter(change => 
        change.type === 'position' && change.dragging === false
      );
      
      if (significantChanges.length > 0) {
        history.addToHistory({
          nodes: newNodes,
          edges: flowStore.edges,
          viewport: flowStore.viewport,
        });
      }
      
      return newNodes;
    });
    
    // Marcar actividad para optimizaciones de rendimiento
    optimization.markActivity();
  }, [flowStore, history, optimization, applyNodeChanges]);

  // Función para manejar cambios en las aristas
  const handleEdgesChange = useCallback((changes) => {
    flowStore.setEdges(prevEdges => {
      const newEdges = applyEdgeChanges(changes, prevEdges);
      
      // Agregar al historial si hay cambios
      if (changes.some(change => change.type === 'remove')) {
        history.addToHistory({
          nodes: flowStore.nodes,
          edges: newEdges,
          viewport: flowStore.viewport,
        });
      }
      
      return newEdges;
    });
    
    // Marcar actividad para optimizaciones de rendimiento
    optimization.markActivity();
  }, [flowStore, history, optimization, applyEdgeChanges]);

  // Función para manejar conexiones
  const handleConnect = useCallback((params) => {
    const newEdge = flowStore.addEdge(params);
    if (newEdge) {
      history.addToHistory({
        nodes: flowStore.nodes,
        edges: [...flowStore.edges, newEdge],
        viewport: flowStore.viewport,
      });
    }
    optimization.markActivity();
  }, [flowStore, history, optimization]);

  // Función para manejar el guardado
  const handleSave = useCallback(() => {
    const currentState = {
      nodes: flowStore.nodes,
      edges: flowStore.edges,
      viewport: flowStore.viewport,
    };
    
    // Solo guardar si hay cambios
    if (JSON.stringify(lastSavedState.current) !== JSON.stringify(currentState)) {
      flowStore.setSaving(true);
      
      // Simular guardado asíncrono
      setTimeout(() => {
        lastSavedState.current = currentState;
        flowStore.setSaving(false);
        flowStore.setLastSaved(new Date().toISOString());
        
        // Notificar éxito
        if (flowStore.onSave) {
          flowStore.onSave(currentState);
        }
      }, 500);
    }
  }, [flowStore]);

  // Función para restablecer el estado
  const resetState = useCallback(() => {
    flowStore.setNodes([]);
    flowStore.setEdges([]);
    flowStore.setViewport({ x: 0, y: 0, zoom: 1 });
    history.clearHistory();
    optimization.toggleUltraMode(false);
  }, [flowStore, history, optimization]);

  // Valor del contexto
  const contextValue = useMemo(() => ({
    // Estado
    ...flowStore,
    
    // Historial
    canUndo: history.canUndo(),
    canRedo: history.canRedo(),
    
    // Optimizaciones
    isIdle: optimization.isIdle,
    isUltraMode: optimization.isUltraMode,
    
    // Métodos
    onNodesChange: handleNodesChange,
    onEdgesChange: handleEdgesChange,
    onConnect: handleConnect,
    onSave: handleSave,
    onReset: resetState,
    onUndo: history.undo,
    onRedo: history.redo,
    toggleUltraMode: optimization.toggleUltraMode,
    markActivity: optimization.markActivity,
    runOnNextFrame: optimization.runOnNextFrame,
    
    // Utilidades
    debounce: optimization.debounce,
    throttle: optimization.throttle,
    startPerfMeasure: optimization.startPerfMeasure,
    endPerfMeasure: optimization.endPerfMeasure,
    getPerfMeasures: optimization.getPerfMeasures,
  }), [
    flowStore,
    history,
    optimization,
    handleNodesChange,
    handleEdgesChange,
    handleConnect,
    handleSave,
    resetState,
  ]);

  return (
    <FlowEditorContext.Provider value={contextValue}>
      {children}
    </FlowEditorContext.Provider>
  );
};

/**
 * Hook personalizado para acceder al contexto del editor de flujos
 */
export const useFlowEditor = () => {
  const context = useContext(FlowEditorContext);
  if (!context) {
    throw new Error('useFlowEditor debe usarse dentro de un FlowEditorProvider');
  }
  return context;
};

export default FlowEditorContext;
