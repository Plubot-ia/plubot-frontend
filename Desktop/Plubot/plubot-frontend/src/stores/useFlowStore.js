import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { applyNodeChanges, applyEdgeChanges, addEdge } from 'reactflow';
import { NODE_TYPES, EDGE_TYPES, EDGE_COLORS } from '@/utils/nodeConfig';
import useTrainingStore from './useTrainingStore';
import flowService, { generateId } from '@/services/flowService';

// Función para generar IDs únicos (ahora usa el servicio de flujo)
const generateNodeId = (type = 'node') => generateId(type);

// Estado inicial
const initialState = {
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  selectedNode: null,
  selectedEdge: null,
  isUltraMode: false,
  isSaving: false,
  lastSaved: null,
  flowName: 'Flujo sin título',
  plubotId: null,
  previousState: null,
  history: {
    past: [],
    future: [],
    maxHistory: 100,
  },
  nodeStyles: {
    start: { backgroundColor: '#4CAF50' },
    end: { backgroundColor: '#F44336' },
    default: { backgroundColor: '#2196F3' },
    selected: { border: '2px solid #FFC107' },
    hovered: { boxShadow: '0 0 10px rgba(0,0,0,0.2)' },
  },
};

// Helper para manejar el historial
const updateHistory = (state, newState) => {
  const { past, future, maxHistory } = state.history;
  
  // Si estamos deshaciendo/rehaciendo, no actualizamos el historial
  if (state.isUndoing || state.isRedoing) {
    return { ...state, isUndoing: false, isRedoing: false };
  }
  
  // Limitar el tamaño del historial
  const newPast = [...past, { nodes: state.nodes, edges: state.edges, viewport: state.viewport }];
  if (newPast.length > maxHistory) {
    newPast.shift();
  }
  
  return {
    ...state,
    ...newState,
    history: {
      ...state.history,
      past: newPast,
      future: [], // Limpiar el futuro al hacer un nuevo cambio
    },
    lastUpdated: Date.now(),
  };
};

// Crear el store de Flow
const useFlowStore = create(
  persist(
    (set, get) => ({
      // Estado inicial
      nodes: [],
      edges: [],
      selectedNode: null,
      selectedEdge: null,
      history: {
        past: [],
        future: [],
        maxHistory: 100,
      },
      isUltraMode: false,
      lastSaved: null,
      flowName: 'Flujo sin título',
      setFlowName: (name) => {
        const newName = name || 'Flujo sin título';
        console.log('[FlowStore] Actualizando nombre del flujo:', newName);
        
        // Actualizar el estado de manera síncrona
        set({ 
          flowName: newName,
          lastUpdated: Date.now()
        });
        
        // Forzar una actualización adicional después de un breve retraso
        // para asegurar que los componentes se actualicen correctamente
        setTimeout(() => {
          const currentState = get();
          if (currentState.flowName !== newName) {
            console.warn('[FlowStore] El nombre no se actualizó correctamente, forzando actualización...');
            set({ 
              flowName: newName,
              forceUpdate: Date.now() // Forzar actualización de componentes
            });
          }
        }, 100);
        
        return newName;
      },
      
      onNodesChange: (changes) => {
        set(state => {
          const newNodes = applyNodeChanges(changes, state.nodes);
          return updateHistory(state, { nodes: newNodes });
        });
      },
      
      addNode: (nodeType, position, data = {}) => {
        const nodeId = generateNodeId(nodeType);
        const validNodeType = Object.values(NODE_TYPES).includes(nodeType) ? nodeType : NODE_TYPES.message;
        
        const newNode = {
          id: nodeId,
          type: validNodeType,
          position,
          data: { ...data },
          selected: false,
          dragging: false,
        };
        
        set(state => updateHistory(state, {
          nodes: [...state.nodes, newNode],
          selectedNode: newNode,
          selectedEdge: null,
        }));
        
        return newNode;
      },
      
      updateNode: (id, updates) => {
        set(state => ({
          nodes: state.nodes.map(node => 
            node.id === id ? { ...node, ...updates } : node
          ),
          selectedNode: state.selectedNode?.id === id 
            ? { ...state.selectedNode, ...updates } 
            : state.selectedNode,
        }));
      },
      
      removeNode: (id) => {
        set(state => updateHistory(state, {
          nodes: state.nodes.filter(node => node.id !== id),
          edges: state.edges.filter(
            edge => edge.source !== id && edge.target !== id
          ),
          selectedNode: state.selectedNode?.id === id ? null : state.selectedNode,
          selectedEdge: state.selectedEdge?.source === id || state.selectedEdge?.target === id 
            ? null 
            : state.selectedEdge,
        }));
      },
      
      // Acciones para nodos
      setNodes: (nodes) => set(state => updateHistory(state, { nodes })),
      
      // Acciones para aristas
      setEdges: (edges) => set(state => updateHistory(state, { edges })),
      
      onEdgesChange: (changes) => {
        set(state => {
          const newEdges = applyEdgeChanges(changes, state.edges);
          return updateHistory(state, { edges: newEdges });
        });
      },
      
      onConnect: (connection) => {
        const { source, target, sourceHandle, targetHandle } = connection;
        const { edges } = get();
        
        // Verificar si la conexión ya existe
        const edgeExists = edges.some(
          edge => edge.source === source && 
                 edge.target === target &&
                 edge.sourceHandle === sourceHandle && 
                 edge.targetHandle === targetHandle
        );
        
        if (edgeExists) return null;
        
        const newEdge = {
          id: `edge-${source}-${target}-${Date.now()}`,
          source,
          target,
          sourceHandle: sourceHandle || 'default',
          targetHandle: targetHandle || 'default',
          type: 'default', // Usar el tipo de arista por defecto que definimos en useEdgeTypes
          animated: true,
          style: { stroke: EDGE_COLORS.DEFAULT },
          data: { type: 'default' }
        };
        
        set(state => updateHistory(state, {
          edges: addEdge(newEdge, state.edges),
          selectedEdge: newEdge,
        }));
        
        return newEdge;
      },
      
      updateEdge: (id, updates) => {
        set(state => ({
          edges: state.edges.map(edge => 
            edge.id === id ? { ...edge, ...updates } : edge
          ),
          selectedEdge: state.selectedEdge?.id === id 
            ? { ...state.selectedEdge, ...updates } 
            : state.selectedEdge,
        }));
      },
      
      removeEdge: (id) => {
        set(state => updateHistory(state, {
          edges: state.edges.filter(edge => edge.id !== id),
          selectedEdge: state.selectedEdge?.id === id ? null : state.selectedEdge,
        }));
      },
      
      // Acciones para la vista
      setViewport: (viewport) => set({ viewport }),
      
      // Acciones de selección
      setSelectedNode: (node) => set({ 
        selectedNode: node,
        selectedEdge: null,
      }),
      
      setSelectedEdge: (edge) => set({ 
        selectedEdge: edge,
        selectedNode: null,
      }),
      
      clearSelection: () => set({ 
        selectedNode: null, 
        selectedEdge: null 
      }),
      
      // Acciones de rendimiento
      toggleUltraMode: () => set(state => ({
        isUltraMode: !state.isUltraMode
      })),
      
      loadFlow: (plubotId) => {
        set({ isSaving: true });
        
        return flowService.loadFlow(plubotId)
          .then(flowData => {
            // Actualizar el estado con los datos cargados
            set({
              nodes: flowData.nodes || [],
              edges: flowData.edges || [],
              flowName: flowData.name || 'Flujo sin título',
              plubotId,
              isSaving: false,
              lastSaved: new Date().toISOString(),
              // Guardar el estado actual como estado anterior para comparaciones futuras
              previousState: { nodes: flowData.nodes || [], edges: flowData.edges || [] }
            });
            
            return {
              success: true,
              message: 'Flujo cargado correctamente',
              timestamp: new Date().toISOString(),
            };
          })
          .catch(error => {
            set({ isSaving: false });
            console.error('Error al cargar el flujo:', error);
            return {
              success: false,
              message: 'Error al cargar el flujo: ' + (error.message || 'Error desconocido'),
              timestamp: new Date().toISOString(),
            };
          });
      },
      
      saveFlow: () => {
        const state = get();
        const { nodes, edges, flowName, plubotId, previousState } = state;
        
        // Si no hay ID de plubot, no podemos guardar
        if (!plubotId) {
          console.error('No se puede guardar el flujo: ID de plubot no definido');
          return Promise.resolve({
            success: false,
            message: 'No se puede guardar el flujo: ID de plubot no definido',
            timestamp: new Date().toISOString(),
          });
        }
        
        // Marcar como guardando
        set({ isSaving: true });
        
        // Estado actual para enviar
        const currentState = { nodes, edges, name: flowName };
        
        // Usar el servicio de flujo para guardar con actualizaciones incrementales
        return flowService.saveFlow(plubotId, currentState, previousState)
          .then(response => {
            // Actualizar estado
            set({
              isSaving: false,
              lastSaved: new Date().toISOString(),
              // Actualizar el estado anterior para la próxima comparación
              previousState: { ...currentState }
            });
            
            return {
              success: true,
              message: 'Flujo guardado correctamente',
              timestamp: new Date().toISOString(),
            };
          })
          .catch(error => {
            set({ isSaving: false });
            console.error('Error al guardar el flujo:', error);
            return {
              success: false,
              message: 'Error al guardar el flujo: ' + (error.message || 'Error desconocido'),
              timestamp: new Date().toISOString(),
            };
          });
      },
      
      // Función para obtener el conteo preciso de aristas visibles (usada por EpicHeader)
      getVisibleEdgeCount: () => {
        const { edges } = get();
        // Filtrar aristas válidas (con source y target definidos)
        return edges.filter(edge => 
          edge.source && 
          edge.target && 
          edge.source !== 'undefined' && 
          edge.target !== 'undefined'
        ).length;
      },
      
      // Función para obtener el conteo preciso de nodos visibles (usada por EpicHeader)
      getVisibleNodeCount: () => {
        const { nodes } = get();
        // Filtrar nodos válidos (con posición y tipo definidos)
        return nodes.filter(node => 
          node.position && 
          node.type && 
          !node.hidden
        ).length;
      },
      
      // Acciones de historial
      undo: () => {
        set(state => {
          const { past, future } = state.history;
          if (past.length === 0) return state;
          
          const previous = past[past.length - 1];
          const newPast = past.slice(0, -1);
          
          return {
            ...state,
            nodes: previous.nodes,
            edges: previous.edges,
            viewport: previous.viewport,
            isUndoing: true,
            history: {
              ...state.history,
              past: newPast,
              future: [
                { nodes: state.nodes, edges: state.edges, viewport: state.viewport },
                ...future
              ].slice(0, state.history.maxHistory),
            },
          };
        });
      },
      
      redo: () => {
        set(state => {
          const { future } = state.history;
          if (future.length === 0) return state;
          
          const next = future[0];
          const newFuture = future.slice(1);
          
          return {
            ...state,
            nodes: next.nodes,
            edges: next.edges,
            viewport: next.viewport,
            isRedoing: true,
            history: {
              ...state.history,
              past: [
                ...state.history.past,
                { nodes: state.nodes, edges: state.edges, viewport: state.viewport }
              ].slice(-state.history.maxHistory),
              future: newFuture,
            },
          };
        });
      },
      
      canUndo: () => get().history.past.length > 0,
      canRedo: () => get().history.future.length > 0,
      
      // Acciones de persistencia
      saveState: () => {
        set({ isSaving: true });
        // Simular guardado asíncrono
        setTimeout(() => {
          set({ 
            isSaving: false, 
            lastSaved: new Date().toISOString(),
            history: {
              ...get().history,
              past: [], // Limpiar historial después de guardar
              future: [],
            },
          });
        }, 500);
      },
      
      // Resetear al estado inicial
      reset: () => set({
        ...initialState,
        history: {
          past: [],
          future: [],
          maxHistory: initialState.history.maxHistory,
        }
      }),
      
      // Establecer el ID del plubot
      setPlubotId: (id) => set({ plubotId: id }),
      
      // Listar copias de seguridad disponibles
      listBackups: () => {
        const { plubotId } = get();
        
        if (!plubotId) {
          return Promise.resolve([]);
        }
        
        return flowService.listBackups(plubotId);
      },
      
      // Restaurar una copia de seguridad
      restoreBackup: (backupId) => {
        const { plubotId } = get();
        set({ isSaving: true });
        
        if (!plubotId) {
          set({ isSaving: false });
          return Promise.resolve({
            success: false,
            message: 'No se puede restaurar: ID de plubot no definido',
          });
        }
        
        return flowService.restoreBackup(plubotId, backupId)
          .then(response => {
            // Recargar el flujo después de restaurar
            return get().loadFlow(plubotId);
          })
          .catch(error => {
            set({ isSaving: false });
            console.error('Error al restaurar la copia de seguridad:', error);
            return {
              success: false,
              message: 'Error al restaurar: ' + (error.message || 'Error desconocido'),
            };
          });
      },
    }),
    {
      name: 'flow-editor-store',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        viewport: state.viewport,
        isUltraMode: state.isUltraMode,
      }),
    }
  )
);

// Exportar selectores y acciones para facilitar su uso
export const useNode = (id) => 
  useFlowStore(useCallback((state) => 
    state.nodes.find(node => node.id === id), [id]));

export const useEdge = (id) => 
  useFlowStore(useCallback((state) => 
    state.edges.find(edge => edge.id === id), [id]));

export const useConnectedEdges = (nodeId) => 
  useFlowStore(useCallback((state) => 
    state.edges.filter(edge => 
      edge.source === nodeId || edge.target === nodeId
    ), [nodeId]));

// Hook personalizado para obtener solo la información necesaria del nodo seleccionado
export const useSelectedNode = () => 
  useFlowStore(useCallback((state) => {
    if (!state.selectedNode) return null;
    return state.nodes.find(n => n.id === state.selectedNode?.id) || null;
  }, []));

// Hook para verificar si un nodo está seleccionado (optimizado)
export const useIsNodeSelected = (nodeId) => 
  useFlowStore(useCallback((state) => 
    state.selectedNode?.id === nodeId, [nodeId]));

// Exportar el store por defecto
export default useFlowStore;
