import { create } from 'zustand';

import { persist, createJSONStorage } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import customZustandStorage from './customZustandStorage';
import { applyNodeChanges, applyEdgeChanges, addEdge } from 'reactflow';
import { preventNodeStacking } from '../components/onboarding/flow-editor/utils/fix-node-positions';
import { debounce } from 'lodash';
import { validateNodePositions, sanitizeEdgePaths } from '../components/onboarding/flow-editor/utils/node-position-validator';
import { ensureEdgesAreVisible } from '../components/onboarding/flow-editor/utils/edgeFixUtil.js';
import { NODE_TYPES, EDGE_TYPES, EDGE_COLORS, NODE_LABELS } from '@/utils/nodeConfig';
import { toggleUltraMode as toggleUltraModeManager } from '@/components/onboarding/flow-editor/ui/UltraModeManager';

// Configuración para dimensiones mínimas de nodos
const NODE_CONFIG = {
  MIN_WIDTH: 150,
  MIN_HEIGHT: 100
};

const MAX_HISTORY_LENGTH = 50; // Definir la constante para el historial

import useTrainingStore from './useTrainingStore';
import flowService, { generateId } from '@/services/flowService';
import { getConnectorColor, CONDITION_TYPES, getConditionType } from '../components/onboarding/nodes/decisionnode/DecisionNode.types.js';
import { nodePositionCache, flowStateManager } from '@/components/onboarding/flow-editor/utils/flowCacheManager';
// Importar el sistema de persistencia para respaldo adicional
import { saveLocalBackup } from '@/components/onboarding/flow-editor/utils/persistenceManager';

// Función para generar IDs únicos (ahora usa el servicio de flujo)
const generateNodeId = (type = 'node') => generateId(type);

// Estado inicial
const initialState = {
  reactFlowInstance: null, // Added for storing React Flow instance
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  selectedNode: null,
  selectedEdge: null,
  isUltraMode: false, // Siempre falso para evitar problemas de renderizado
  isSaving: false,
  lastSaved: null,
  plubotId: null,
  flowName: 'Flujo sin título',
  isLoaded: false, // Nuevo flag para indicar si el flujo actual está cargado
  isUndoing: false,
  isRedoing: false,
  shouldMoveToCenter: false,
  autoArrange: false,
  isBackupLoaded: false,
  hasChanges: false,
  // Estado para modales
  modals: {
    templateSelector: false,
    embedModal: false,
    importExportModal: false
  },
  // Historial y estado previo
  previousState: {
    nodes: [],
    edges: [],
    name: 'Flujo sin título',
  },
  history: {
    past: [],
    future: [],
    maxHistory: MAX_HISTORY_LENGTH,
  },
  // Estado para el menú contextual global
  contextMenuVisible: false,
  contextMenuPosition: { x: 0, y: 0 },
  contextMenuNodeId: null,
  contextMenuItems: [],
  isNodeBeingDragged: false, // Flag to indicate if a node is currently being dragged
};

const useFlowStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      // Guardián del historial: única función para actualizar estado y decidir si guardar en el historial.
      _setStateWithHistoryCheck: (updates) => {
        set(state => {
          const snapshot = {
              nodes: state.nodes,
              edges: state.edges,
              viewport: state.viewport,
          };

          // Comprobar si hay cambios estructurales
          const nodesChanged = 'nodes' in updates && JSON.stringify(state.nodes) !== JSON.stringify(updates.nodes);
          const edgesChanged = 'edges' in updates && JSON.stringify(state.edges) !== JSON.stringify(updates.edges);

          if (!nodesChanged && !edgesChanged) {
              return { ...state, ...updates }; // Sin cambios estructurales, solo actualizar estado
          }

          // Cambio estructural detectado: actualizar historial
          return {
              ...state,
              ...updates,
              history: {
                  ...state.history,
                  past: [...state.history.past, snapshot].slice(-MAX_HISTORY_LENGTH),
                  future: [], // Limpiar futuro en nueva acción
              },
              hasChanges: true, // Un cambio estructural implica que hay cambios sin guardar
          };
        });
      },

      // Action to set node dragging state
      setIsNodeBeingDragged: (isDragging) => set({ isNodeBeingDragged: isDragging }),

      // Action to set the React Flow instance
      setReactFlowInstance: (instance) => set({ reactFlowInstance: instance }),

      // Acciones para el menú contextual global - implementación mejorada
      showContextMenu: (x, y, nodeId, items) => {
        console.log('[FlowStore] showContextMenu:', { x, y, nodeId, items });
        
        // Usar setTimeout para asegurar que el estado se actualice correctamente
        // Esto evita problemas de timing con ReactFlow
        setTimeout(() => {
          // La lógica de añadir/quitar listeners de clic global ahora se delega
          // al componente ContextMenu.jsx a través de su prop onClose, que llamará a hideContextMenu.
          set({
            contextMenuVisible: true,
            contextMenuPosition: { x, y },
            contextMenuNodeId: nodeId,
            contextMenuItems: items,
            selectedNode: nodeId, // Seleccionar el nodo al abrir el menú contextual
          });
        }, 0);
      },
      hideContextMenu: () => {
        console.log('[FlowStore] hideContextMenu');
        set({ 
          contextMenuVisible: false,
          contextMenuPosition: { x: 0, y: 0 }, // Resetear a valores iniciales consistentes
          contextMenuItems: [],    // Resetear a valores iniciales consistentes
          contextMenuNodeId: null, // Resetear el nodeId
        });
      },
      
      // Acciones de nodos
      // Sistema avanzado para manejo de nodos con optimización de rendimiento
      onNodesChange: (changes) => {
        const { nodes: currentNodes, _setStateWithHistoryCheck } = get();

        const isSelectionChange = changes.every(c => c.type === 'select');
        const isDrag = changes.some(c => c.type === 'position');
        
        const newNodes = applyNodeChanges(changes, currentNodes);

        // Cambios de selección y arrastres intermedios solo actualizan el estado, sin historial.
        if (isSelectionChange || (isDrag && changes.some(c => c.dragging))) {
          set({ nodes: newNodes });
          return;
        }

        // Arrastre finalizado, dimensiones, etc., usan el guardián para registrar historial.
        _setStateWithHistoryCheck({
          nodes: newNodes,
          isUndoing: false,
          isRedoing: false,
        });
      },
      
      // Implementación de setNodes para compatibilidad con componentes
      setNodes: (nodes) => {
        // Si se pasa una función, evaluarla con los nodos actuales
        if (typeof nodes === 'function') {
          const currentNodes = get().nodes;
          const nodesResult = nodes(currentNodes);
          // Aplicar validación de posiciones y luego prevenir stacking
          const validatedNodes = validateNodePositions(nodesResult);
          const stackedFixedNodes = preventNodeStacking(validatedNodes);
          
          // Sanear paths de aristas en el siguiente ciclo de renderizado
          sanitizeEdgePaths();
          
          set({
            nodes: stackedFixedNodes,
            isUndoing: false,
            isRedoing: false,
          });
        } else {
          // Si se pasan los nodos directamente
          // Aplicar validación de posiciones y luego prevenir stacking
          const validatedNodes = validateNodePositions(nodes);
          const stackedFixedNodes = preventNodeStacking(validatedNodes);
          
          // Sanear paths de aristas en el siguiente ciclo de renderizado
          sanitizeEdgePaths();
          
          set({
            nodes: stackedFixedNodes,
            isUndoing: false,
            isRedoing: false,
          });
        }
      },
      
      // Acción para manejar cambios en las aristas
      onEdgesChange: async (changes) => { // Made async
        const currentEdges = get().edges;
        const currentIsUltraMode = get().isUltraMode;
        const appliedEdges = applyEdgeChanges(changes, currentEdges);
        
        try {
          // Llamar a ensureEdgesAreVisible después de aplicar los cambios de React Flow
          // y antes de hacer el 'set' final en el store.
          const visibleEdges = await ensureEdgesAreVisible(appliedEdges, currentIsUltraMode);
          set({
            edges: visibleEdges, // Usar las aristas procesadas por ensureEdgesAreVisible
            isUndoing: false,
            isRedoing: false,
            hasChanges: true,
          });
        } catch (error) {
          console.error('[FlowStore onEdgesChange] Error al asegurar la visibilidad de las aristas:', error);
          // Fallback: si ensureEdgesAreVisible falla, al menos aplicar los cambios básicos.
          set({
            edges: appliedEdges, // Usar las aristas solo con applyEdgeChanges
            isUndoing: false,
            isRedoing: false,
            hasChanges: true,
          });
        }
      },
      
      addNode: (nodeData, position, userData) => {
        console.log('[FlowStore] addNode llamado con:', { nodeData, position, userData });
        
        // CASO 1: Llamada desde NodePalette - el primer parámetro es solo el tipo (string)
        if (typeof nodeData === 'string') {
          console.log('[FlowStore] Detectada llamada desde NodePalette con tipo:', nodeData);
          
          // El tipo viene como primer argumento
          const nodeType = nodeData;
          console.log(`[FlowStore DEBUG] addNode (from Palette). nodeType: ${nodeType}, NODE_LABELS[nodeType] as seen by FlowStore: ${NODE_LABELS[nodeType]}, received userData:`, userData);
          
          // Validar que sea un tipo válido según NODE_TYPES
          if (Object.values(NODE_TYPES).includes(nodeType)) {
            console.log(`[FlowStore] Añadiendo nodo de tipo: ${nodeType}`);
            
            // Generar ID único para el nodo
            const nodeId = `${nodeType}-${Math.random().toString(36).substring(2, 10)}`;
            
            // Obtener la etiqueta predeterminada basada en el tipo
            let defaultLabel = nodeType.charAt(0).toUpperCase() + nodeType.slice(1);
            // Intentar usar NODE_LABELS si está disponible
            try {
              if (NODE_LABELS && NODE_LABELS[nodeType]) {
                defaultLabel = NODE_LABELS[nodeType];
              }
            } catch (err) {
              console.warn(`[FlowStore] Error al obtener etiqueta para ${nodeType}:`, err.message);
            }
            
            // Contador para asignar posiciones escalonadas y evitar que los nodos se apilen
            const nodeCount = get().nodes.length;
            
            // Crear objeto de nodo completo con protección contra errores
            const newNode = {
              id: nodeId,
              type: nodeType,  // Importante: este es el tipo que ReactFlow utiliza
              // Distribuir los nodos en el canvas para evitar solapamiento
              position: position || { 
                x: 100 + (nodeCount % 3) * 200, // 3 columnas 
                y: 100 + Math.floor(nodeCount / 3) * 150 // Espaciado vertical de filas
              },
              data: {
                id: nodeId,
                label: (userData && userData.label) || defaultLabel,
                // Log para ver qué etiqueta se está asignando finalmente
                _debug_final_label_components: { userLabel: (userData && userData.label), defaultLabelFromStore: defaultLabel },
                nodeType: nodeType,  // Guardamos también el tipo para compatibilidad
                ...(userData || {})
              }
            };
            
            // Inicializar conditions para DecisionNode
            if (newNode.type === NODE_TYPES.decision && newNode.data) {
              if (Array.isArray(newNode.data.outputs) && newNode.data.outputs.length > 0) {
                // Si 'outputs' array existe y no está vacío, transformarlo
                newNode.data.conditions = newNode.data.outputs.map(output => {
                  const id = generateNodeId('condition'); // Usar el generador de ID del store
                  return (typeof output === 'string') ? { id, text: output } :
                         (output.id && typeof output.text !== 'undefined') ? output : { id, text: String(output) };
                });
              } else if (!Array.isArray(newNode.data.conditions) || newNode.data.conditions.length === 0) {
                // Si 'outputs' no es un array válido O 'conditions' no es un array válido (o está vacío),
                // inicializar con conditions predeterminadas.
                newNode.data.conditions = [
                  {
                    id: `cond-${newNode.id}-default-yes`,
                    text: 'Sí',
                    condition: 'true',
                    color: getConnectorColor('Sí', 0),
                  },
                  {
                    id: `cond-${newNode.id}-default-no`,
                    text: 'No',
                    condition: 'false',
                    color: getConnectorColor('No', 1),
                  },
                ];
              }
              // Opcional: delete newNode.data.outputs; // Para evitar redundancia si se prefiere
            }

            // Añadir el nodo y sus nodos de opción/aristas de forma atómica
            set(state => {
              const decisionNode = newNode;
              const conditions = decisionNode.data.conditions || [];
              const isUltra = state.isUltraMode || decisionNode.data.isUltraPerformanceMode;

              const newOptionNodes = conditions.map((condition, index) => ({
                id: `option-${decisionNode.id}-${condition.id}`,
                type: 'option',
                position: { x: decisionNode.position.x + (index - (conditions.length - 1) / 2) * 250, y: decisionNode.position.y + 200 },
                data: {
                  sourceNode: decisionNode.id,
                  conditionId: condition.id,
                  text: condition.text,
                  instruction: condition.text,
                  isUltraPerformanceMode: isUltra,
                  parentNode: undefined,
                  color: condition.color, // Color consistente desde la creación
                  lastUpdated: new Date().toISOString(),
                },
                draggable: true,
                deletable: true,
              }));

              const newEdges = conditions.map(condition => ({
                id: `edge-${decisionNode.id}-${condition.id}`,
                source: decisionNode.id,
                target: `option-${decisionNode.id}-${condition.id}`,
                sourceHandle: `output-${condition.id}`,
                targetHandle: 'target',
                type: 'eliteEdge',
                animated: true,
                style: { stroke: condition.color, strokeWidth: 2 },
              }));

              const allNodes = [...state.nodes, decisionNode, ...newOptionNodes];
              const stackedFixedNodes = preventNodeStacking(allNodes);

              return {
                ...state,
                nodes: stackedFixedNodes,
                edges: [...state.edges, ...newEdges],
                hasChanges: true,
              };
            });
            
            return newNode;
          }
        }
        // CASO 2: Llamada con objeto completo (original)
        else {
          // CORRECCIÓN CRÍTICA: Preservar el tipo de nodo original
          // Detectar tipo en múltiples ubicaciones posibles para máxima compatibilidad
          let nodeType;
          
          // DEBUG: Imprimir datos de entrada para identificar el problema
          console.log('[FlowStore] addNode datos recibidos:', JSON.stringify(nodeData, null, 2));
          
          // 1. Prioridad máxima: Si hay nodeInfo con type, usarlo (caso específico del NodePalette)
          if (nodeData.nodeInfo && nodeData.nodeInfo.type) {
            nodeType = nodeData.nodeInfo.type;
            console.log('[FlowStore] Usando tipo del nodeInfo:', nodeType);
          }
          // 2. Segunda prioridad: Si hay un nodeType explícito en data, usarlo
          else if (nodeData.data && nodeData.data.nodeType) {
            nodeType = nodeData.data.nodeType;
          }
          // 3. Tercera prioridad: Si hay un nodeType a nivel raíz, usarlo
          else if (nodeData.nodeType) {
            nodeType = nodeType;
          }
          // 4. Cuarta prioridad: Usar el tipo estándar
          else if (nodeData.type && nodeData.type !== 'defaultNode') {
            nodeType = nodeData.type;
          }
          // 5. Última opción: Si no hay nada válido, usar un valor fallback seguro
          else {
            nodeType = 'message';
            console.warn('[FlowStore] No se detectó tipo de nodo válido, usando message como fallback');
          }
          // IMPORTANTE: Normalizar tipos para asegurar consistencia con el sistema de nodos
          if (typeof nodeType === 'string') {
            // Convertir a minúsculas para comparación case-insensitive
            const typeLower = nodeType.toLowerCase();
            
            // Mapeo exacto para respetar tipos específicos
            if (typeLower.includes('start')) {
              nodeType = 'start';
            } else if (typeLower.includes('end')) {
              nodeType = 'end';
            } else if (typeLower.includes('message')) {
              nodeType = 'message';
            } else if (typeLower.includes('decision')) {
              nodeType = 'decision';
            } else if (typeLower.includes('action')) {
              nodeType = 'action';
            } else if (typeLower.includes('option')) {
              nodeType = 'option';
            } else if (typeLower.includes('http') || typeLower.includes('request')) {
              nodeType = 'httpRequestNode';
            } else if (typeLower.includes('power')) {
              nodeType = 'powerNode';
            }
          }
          
          console.log(`[FlowStore] Añadiendo nodo de tipo: ${nodeType}`, nodeData);
          
          // Obtener propiedades específicas del tipo si existen
          let nodeSpecificProps = {};
          
          // Generar un nuevo nodo con el tipo correcto
          // IMPORTANTE: usar el nodeType normalizado para 'type'
          const newNode = {
            id: nodeData.id || `${nodeType}-${Math.random().toString(36).substring(2, 10)}`,
            type: nodeType, // Este es el tipo que ReactFlow utiliza para renderizar
            position: nodeData.position || { x: 100, y: 100 },
            data: {
              ...(nodeData.data || {}),
              nodeType: nodeType, // Asegurar que nodeType esté disponible en data
              label: nodeData.label || nodeData.data?.label || NODE_LABELS[nodeType] || nodeType,
              ...nodeSpecificProps
            }
          };
          
          // Añadir el nodo al estado
          set((state) => {
            const allNodesWithNew = [...state.nodes, newNode];
            const stackedFixedNodes = preventNodeStacking(allNodesWithNew);
            return { nodes: stackedFixedNodes };
          });
          
          return newNode;
        }
        
        // Obtener propiedades específicas del tipo si existen
        let nodeSpecificProps = {};
        
        // Validar contra NODE_TYPES para integridad del sistema
        try {
          const validTypes = Object.values(NODE_TYPES);
          
          // Verificación de seguridad pero SIN cambiar el tipo a message - CRÍTICO
          if (!validTypes.includes(nodeType)) {
            console.warn(`[FlowStore] Tipo de nodo no estándar: ${nodeType}, pero se respetará su tipo original.`);
          }
        } catch (error) {
          console.error(`[FlowStore] Error al validar tipo de nodo ${nodeType}:`, error);
          // No cambiamos el tipo, solo registramos el error
        }
        
        const newNode = {
          id: nodeData.id || generateNodeId(nodeType),
          position: nodeData.position || { x: 100, y: 100 },
          type: nodeType, // Garantizamos que se utilice el tipo correcto
          data: {
            label: nodeData.label || 'Nuevo nodo',
            nodeType: nodeType, // Duplicamos el tipo en data para asegurar consistencia
            ...(nodeData.data || {}),
          },
          style: {
            ...nodeSpecificProps,
            ...(nodeData.style || {}),
          },
        };
        
        set(state => {
          // Creamos primero la nueva entrada de historial
          const historyEntry = { 
            nodes: [...state.nodes], 
            edges: [...state.edges], 
            viewport: {...state.viewport} 
          };
          
          return {
            nodes: [...state.nodes, newNode],
            history: {
              past: [...state.history.past, historyEntry],
              future: [],
              maxHistory: state.history.maxHistory,
            },
          };
        });
        
        // Validación post-creación
        setTimeout(() => {
          const currentState = get();
          const addedNode = currentState.nodes.find(n => n.id === newNode.id);
          if (addedNode && addedNode.type !== nodeType) {
            console.error(`[FlowStore] Error crítico: El tipo de nodo ${nodeType} no se aplicó correctamente`);  
          }
        }, 0);
        
        return newNode;
      },
      
      updateNode: (id, dataToUpdate) => { // Renombrado 'data' a 'dataToUpdate' para claridad
        set(state => ({
          nodes: state.nodes.map(node => {
            if (node.id === id) {
              // Crear una nueva copia del data existente del nodo
              const newNodeData = { ...node.data };

              // Iterar sobre las propiedades de dataToUpdate
              for (const key in dataToUpdate) {
                if (Object.prototype.hasOwnProperty.call(dataToUpdate, key)) {
                  if (key === 'variables' && Array.isArray(dataToUpdate[key])) {
                    // Si la clave es 'variables' y es un array, asegurar una nueva referencia de array
                    newNodeData[key] = [...dataToUpdate[key]];
                    console.log(`[FlowStore updateNode ${id}] Update for key '${key}'. New array created:`, JSON.parse(JSON.stringify(newNodeData[key])));
                  } else {
                    // Para otras propiedades, simplemente asignar
                    newNodeData[key] = dataToUpdate[key];
                  }
                }
              }
              
              return {
                ...node,
                data: newNodeData, // Usar el objeto de datos completamente nuevo
              };
            }
            return node;
          }),
        }));
      },
      
      // Acción para actualizar posiciones y tamaños de nodos
      updateNodeLayout: (id, layout) => {
        set(state => ({
          nodes: state.nodes.map(node => {
            if (node.id === id) {
              return {
                ...node,
                position: layout.position || node.position,
                style: {
                  ...node.style,
                  ...(layout.style || {}),
                  width: layout.width || node.style?.width,
                  height: layout.height || node.style?.height,
                }
              };
            }
            return node;
          })
        }));
      },
      duplicateNode: (nodeIdToDuplicate) => {
        const { nodes } = get();
        const originalNode = nodes.find(node => node.id === nodeIdToDuplicate);

        if (!originalNode) {
          console.error(`[FlowStore] Nodo original no encontrado para duplicar: ${nodeIdToDuplicate}`);
          return;
        }

        const position = {
          x: (originalNode.position?.x || 0) + 20,
          y: (originalNode.position?.y || 0) + 20,
        };
        
        const generateShortId = () => Math.random().toString(36).substring(2, 9);

        const newNodeId = `${originalNode.type || 'node'}-${generateShortId()}`;
        
        const originalLabel = originalNode.data && originalNode.data.label ? originalNode.data.label : (originalNode.type || 'Nodo');

        const baseNodeProperties = { ...originalNode };
        delete baseNodeProperties.id;
        delete baseNodeProperties.selected;
        delete baseNodeProperties.dragging;
        delete baseNodeProperties.position;
        delete baseNodeProperties.data;
        
        const newNode = {
          ...baseNodeProperties,
          id: newNodeId,
          position,
          data: {
            ...(originalNode.data || {}),
            label: `${originalLabel} (Copia)`
          },
          selected: false,
          dragging: false,
        };

        set(state => ({
          nodes: [...state.nodes, newNode],
        }));
        console.log(`[FlowStore] Nodo duplicado: ${originalNode.id} -> ${newNode.id}`, newNode);
      },

deleteNode: (nodeIdToDelete) => {
        console.log(`[FlowStore] Attempting to delete node: ${nodeIdToDelete}`);
        set((state) => {
          const nodeExists = state.nodes.some(node => node.id === nodeIdToDelete);
          if (!nodeExists) {
            console.warn(`[FlowStore] Node ${nodeIdToDelete} not found for deletion.`);
            return state; // No cambiar el estado si el nodo no existe
          }
      
          const nodes = state.nodes.filter((node) => node.id !== nodeIdToDelete);
          const edges = state.edges.filter(
            (edge) => edge.source !== nodeIdToDelete && edge.target !== nodeIdToDelete
          );
      
          let newSelectedNode = state.selectedNode;
          if (state.selectedNode === nodeIdToDelete) {
            newSelectedNode = null;
          }
      
          // Si el menú contextual está visible para el nodo que se elimina, ocultarlo.
          let newContextMenuVisible = state.contextMenuVisible;
          let newContextMenuNodeId = state.contextMenuNodeId;
          let newContextMenuItems = state.contextMenuItems;
          let newContextMenuPosition = state.contextMenuPosition;
      
          if (state.contextMenuNodeId === nodeIdToDelete) {
            newContextMenuVisible = false;
            newContextMenuNodeId = null;
            newContextMenuItems = []; // Limpiar items
            newContextMenuPosition = { x: 0, y: 0 }; // Resetear posición
          }
          
          // TODO: Considerar la integración con el sistema de historial (undo/redo)
          // Ejemplo: get().addHistoryChange({ nodes: state.nodes, edges: state.edges, viewport: state.viewport });
      
          console.log(`[FlowStore] Node ${nodeIdToDelete} and its edges deleted. New node count: ${nodes.length}, New edge count: ${edges.length}`);
          return {
            ...state, 
            nodes,
            edges,
            selectedNode: newSelectedNode,
            contextMenuVisible: newContextMenuVisible,
            contextMenuNodeId: newContextMenuNodeId,
            contextMenuItems: newContextMenuItems,
            contextMenuPosition: newContextMenuPosition,
            hasChanges: true,
          };
        });
      },

      /**
       * Elimina un nodo asegurando que no reaparezca y mantiene la integridad del estado
       * @param {string} nodeId - ID del nodo a eliminar
       * @returns {Object} Estado resultante tras la eliminación
       */
      removeNode: (nodeId) => {
        // Capturar y guardar el estado previo para historia e integridad de datos

        const { nodes, edges, plubotId } = get();
        
        console.log(`[FlowStore] Eliminando nodo: ${nodeId}`);
        
        // Validación pre-eliminación
        if (!nodes.some(node => node.id === nodeId)) {
          console.warn(`[FlowStore] Intento de eliminar un nodo inexistente: ${nodeId}`);
          return { success: false, message: 'El nodo no existe' };
        }
        
        // Encontrar aristas conectadas al nodo para eliminarlas
        const connectedEdges = edges.filter(
          edge => edge.source === nodeId || edge.target === nodeId
        );
        
        const connectedEdgeIds = connectedEdges.map(edge => edge.id);
        
        if (connectedEdgeIds.length > 0) {
          console.log(`[FlowStore] Eliminando ${connectedEdgeIds.length} aristas relacionadas`);
        }
        
        // Aplicar la operación de eliminación con control de integridad
        const stateUpdate = state => {
          // Crear una copia profunda para el historial antes de la modificación
          const historyEntry = {
            nodes: JSON.parse(JSON.stringify(state.nodes)),
            edges: JSON.parse(JSON.stringify(state.edges)),
            viewport: {...state.viewport}
          };
          
          const newState = {
            nodes: state.nodes.filter(node => node.id !== nodeId),
            edges: state.edges.filter(edge => 
              edge.source !== nodeId && edge.target !== nodeId
            ),
            history: {
              past: [...state.history.past, historyEntry],
              future: [],
              maxHistory: state.history.maxHistory,
            },
            previousState: {
              // Actualizar el estado previo para que no recupere los nodos eliminados
              nodes: state.nodes.filter(node => node.id !== nodeId),
              edges: state.edges.filter(edge => 
                edge.source !== nodeId && edge.target !== nodeId
              ),
              name: state.flowName
            }
          };
          
          return newState;
        };
        
        set(stateUpdate);
        
        // Validación post-eliminación y persistencia para evitar reaparición
        setTimeout(() => {
          const currentState = get();
          
          // Verificar que el nodo realmente se eliminó
          if (currentState.nodes.some(node => node.id === nodeId)) {
            console.error(`[FlowStore] Error crítico: No se pudo eliminar el nodo ${nodeId}`);
          } else {
            console.log(`[FlowStore] Nodo ${nodeId} eliminado correctamente`);
            
            // Guardar el estado en localStorage como respaldo adicional
            // para evitar recuperación no deseada
            if (plubotId) {
              try {
                localStorage.setItem(`plubot-flow-${plubotId}-deleted-nodes`, 
                  JSON.stringify([...JSON.parse(localStorage.getItem(`plubot-flow-${plubotId}-deleted-nodes`) || '[]'), nodeId])
                );
              } catch (error) {
                console.warn('[FlowStore] No se pudo guardar la lista de nodos eliminados', error);
              }
            }
          }
        }, 0);
        
        return { success: true, message: 'Nodo eliminado correctamente' };
      },
      
      // Acciones específicas para DecisionNode
      updateDecisionNodeQuestion: (nodeId, newQuestion) => {
        const { updateNode } = get();
        updateNode(nodeId, { question: newQuestion });
      },

      addDecisionNodeCondition: (nodeId, newConditionText = 'Nueva Opción') => {
        set(state => {
          const updatedNodes = state.nodes.map(node => {
            if (node.id === nodeId && node.type === 'decision') {
              const existingConditions = node.data.conditions || [];
              const newIndex = existingConditions.length;

              // Cirugía 1/3: El color se determina por el índice para asegurar unicidad, no por el texto.
              const newColor = getConnectorColor('default', newIndex);

              const newCondition = {
                id: generateId('condition'),
                text: newConditionText,
                type: getConditionType(newConditionText), // Se mantiene para el ícono
                color: newColor, // Usar el color persistente y único
              };

              return {
                ...node,
                data: {
                  ...node.data,
                  conditions: [...existingConditions, newCondition],
                },
              };
            }
            return node;
          });
          return { nodes: updatedNodes, hasChanges: true };
        });
        get().generateOptionNodes(nodeId);
      },

      updateDecisionNodeConditionText: (nodeId, conditionId, newText) => {
        set(state => {
          const updatedNodes = state.nodes.map(node => {
            if (node.id === nodeId && node.type === 'decision') {
              const updatedConditions = node.data.conditions.map(cond => {
                if (cond.id === conditionId) {
                  // Cirugía 3/3: Al actualizar el texto, el color NO se recalcula. Se mantiene el original.
                  return { 
                    ...cond, 
                    text: newText,
                    type: getConditionType(newText), // El tipo sí puede cambiar (para el ícono)
                  };
                }
                return cond;
              });
              return { ...node, data: { ...node.data, conditions: updatedConditions } };
            }
            return node;
          });
          return { nodes: updatedNodes, hasChanges: true };
        });
        // Re-generamos los nodos de opción para que reflejen el nuevo texto
        get().generateOptionNodes(nodeId);
      },

      deleteDecisionNodeCondition: (nodeId, conditionIdToDelete) => {
        const { nodes, removeNode: storeRemoveNodeInternal } = get();
        let optionNodeIdToDelete = null;

        const updatedNodes = nodes.map(node => {
          if (node.id === nodeId && node.type === NODE_TYPES.decision) {
            const oldConditions = node.data.conditions || [];
            const newConditions = oldConditions.filter(cond => cond.id !== conditionIdToDelete);
            
            const optionNode = nodes.find(n => 
              n.type === NODE_TYPES.option &&
              n.data &&
              n.data.sourceNode === nodeId &&
              n.data.sourceConditionId === conditionIdToDelete
            );
            if (optionNode) {
              optionNodeIdToDelete = optionNode.id;
            }
            
            return {
              ...node,
              data: {
                ...node.data,
                conditions: newConditions,
                handleIds: newConditions.map(cond => `output-${cond.id}`),
              }
            };
          }
          return node;
        });

        set({ nodes: updatedNodes, hasChanges: true });

        if (optionNodeIdToDelete) {
          storeRemoveNodeInternal(optionNodeIdToDelete);
        }
      },

      moveDecisionNodeCondition: (nodeId, conditionId, direction) => {
        set((state) => {
          const newNodes = state.nodes.map((node) => {
            if (node.id === nodeId && node.type === NODE_TYPES.decision) {
              const conditions = [...(node.data.conditions || [])];
              const index = conditions.findIndex(c => c.id === conditionId);
              
              if (index === -1) return node;

              let newConditions = [...conditions];
              if (direction === 'up' && index > 0) {
                [newConditions[index - 1], newConditions[index]] = [newConditions[index], newConditions[index - 1]];
              } else if (direction === 'down' && index < newConditions.length - 1) {
                [newConditions[index], newConditions[index + 1]] = [newConditions[index + 1], newConditions[index]];
              }
              return { ...node, data: { ...node.data, conditions: newConditions } };
            }
            return node;
          });
          return { nodes: newNodes, hasChanges: true };
        });
      },

      toggleDecisionNodeFeature: (nodeId, featureName, enabled) => {
        const { updateNode } = get();
        updateNode(nodeId, { [featureName]: enabled });
      },

      // Acciones específicas para OptionNode
      generateOptionNodes: (nodeId) => {
        set(state => {
          const decisionNode = state.nodes.find(n => n.id === nodeId);
          if (!decisionNode || !decisionNode.data) {
            console.warn(`[generateOptionNodes] DecisionNode con id ${nodeId} no encontrado.`);
            return state;
          }

          const conditions = decisionNode.data.conditions || [];
          const isUltra = state.isUltraMode || decisionNode.data.isUltraPerformanceMode;

          // 1. Crear un mapa del estado deseado para nodos y aristas
          const targetOptionNodes = new Map();
          conditions.forEach((condition, index) => {
            const optionNodeId = `option-${nodeId}-${condition.id}`;
            targetOptionNodes.set(optionNodeId, {
              id: optionNodeId,
              type: 'option',
              data: {
                sourceNode: nodeId,
                conditionId: condition.id,
                text: condition.text,
                instruction: condition.text,
                isUltraPerformanceMode: isUltra,
                parentNode: undefined,
                color: condition.color,
                lastUpdated: new Date().toISOString(),
              },
              draggable: true,
              deletable: true,
              // La posición se manejará por separado para preservar la ubicación manual
            });
          });

          const targetEdges = new Map();
          conditions.forEach(condition => {
            const edgeId = `edge-${nodeId}-${condition.id}`;
            targetEdges.set(edgeId, {
              id: edgeId,
              source: nodeId,
              target: `option-${nodeId}-${condition.id}`,
              sourceHandle: `output-${condition.id}`,
              targetHandle: 'target',
              type: 'eliteEdge',
              animated: !isUltra,
              style: { stroke: condition.color, strokeWidth: 2 },
            });
          });

          // 2. Procesar nodos: actualizar, mantener o eliminar
          const newNodes = [];
          const existingOptionNodeIdsInState = new Set();

          state.nodes.forEach(node => {
            // Si es un OptionNode del DecisionNode actual
            if (node.data?.sourceNode === nodeId) {
              existingOptionNodeIdsInState.add(node.id);
              // Si todavía existe en el estado deseado, se actualiza y se mantiene
              if (targetOptionNodes.has(node.id)) {
                const targetNodeData = targetOptionNodes.get(node.id).data;
                newNodes.push({ ...node, data: { ...node.data, ...targetNodeData } });
              }
              // Si no, se elimina (no se añade a newNodes)
            } else {
              // No es un OptionNode de este DecisionNode, se mantiene
              newNodes.push(node);
            }
          });

          // 3. Añadir nodos completamente nuevos
          targetOptionNodes.forEach((targetNode, id) => {
            if (!existingOptionNodeIdsInState.has(id)) {
              const index = conditions.findIndex(c => `option-${nodeId}-${c.id}` === id);
              const newNode = {
                ...targetNode,
                position: { x: decisionNode.position.x + (index - (conditions.length - 1) / 2) * 250, y: decisionNode.position.y + 200 },
              };
              newNodes.push(newNode);
            }
          });

          // 4. Procesar aristas de manera similar
          const newEdges = state.edges.filter(edge => {
            // Mantener todas las aristas que NO salgan del DecisionNode actual
            if (edge.source !== nodeId) return true;
            // Mantener las aristas del DecisionNode que todavía son válidas
            return targetEdges.has(edge.id);
          }).map(edge => {
            // Actualizar las aristas que se mantienen
            if (targetEdges.has(edge.id)) {
              return { ...edge, ...targetEdges.get(edge.id) };
            }
            return edge;
          });

          const existingEdgeIdsInState = new Set(state.edges.map(e => e.id));
          targetEdges.forEach((targetEdge, id) => {
            if (!existingEdgeIdsInState.has(id)) {
              newEdges.push(targetEdge);
            }
          });

          return {
            ...state,
            nodes: newNodes,
            edges: newEdges,
            hasChanges: true,
          };
        });
      },

      updateOptionNodeData: (nodeId, data) => {
        set(state => {
          const nodes = state.nodes;
          const optionNode = nodes.find(n => n.id === nodeId);

          if (!optionNode) {
            console.warn(`[updateOptionNodeData] OptionNode with id ${nodeId} not found.`);
            return state;
          }

          const newText = data.instruction;
          const parentNodeId = optionNode.data.sourceNode;
          const conditionId = optionNode.data.sourceConditionId;

          let newNodes = nodes.map(node => {
            if (node.id === nodeId) {
              const updatedData = {
                ...node.data,
                ...data,
                lastUpdated: new Date().toISOString(),
              };
              if (typeof newText !== 'undefined') {
                updatedData.text = newText;
              }
              return { ...node, data: updatedData };
            }
            return node;
          });

          if (parentNodeId && conditionId && typeof newText !== 'undefined') {
            newNodes = newNodes.map(node => {
              if (node.id === parentNodeId && node.type === 'decision') {
                const newConditions = (node.data.conditions || []).map(cond => {
                  if (cond.id === conditionId) {
                    return { ...cond, text: newText };
                  }
                  return cond;
                });
                return { ...node, data: { ...node.data, conditions: newConditions } };
              }
              return node;
            });
          }

          return { nodes: newNodes, hasChanges: true };
        });
      },

      updateNodeData: (nodeId, data) => {
        set(state => ({
          nodes: state.nodes.map(node =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, ...data }, lastUpdated: new Date().toISOString() }
              : node
          ),
          hasChanges: true,
        }));
      },
      
      // Acciones específicas para ActionNode
      updateActionNodeDescription: (nodeId, description) => {
        const { updateNode } = get();
        updateNode(nodeId, { description });
      },
      
      updateActionNodeType: (nodeId, actionType) => {
        const { updateNode } = get();
        const node = get().nodes.find(n => n.id === nodeId);
        if (node && node.data) {
          // Determinar parámetros predeterminados según el tipo de acción
          let defaultParameters = {};
          switch (actionType) {
            case 'sendEmail':
              defaultParameters = { to: '', cc: '', subject: '', template: 'welcome', body: '' };
              break;
            case 'saveData':
              defaultParameters = { key: '', value: '', dataType: 'string', storage: 'session' };
              break;
            case 'sendNotification':
              defaultParameters = { message: '', type: 'info', duration: 5 };
              break;
            case 'apiCall':
              defaultParameters = { url: '', method: 'GET', headers: '', body: '' };
              break;
            case 'transformData':
              defaultParameters = { inputVariable: '', transformation: 'uppercase', formula: '', outputVariable: '' };
              break;
            case 'conditional':
              defaultParameters = { variable: '', operator: 'equal', value: '' };
              break;
            case 'delay':
              defaultParameters = { duration: 1, unit: 'seconds' };
              break;
            case 'webhook':
              defaultParameters = { endpoint: '', event: '', secretKey: '' };
              break;
            default:
              defaultParameters = {};
          }
          
          // Mantener los parámetros actuales que coincidan con los predeterminados
          const currentParameters = node.data.parameters || {};
          const mergedParameters = { ...defaultParameters };
          
          // Solo conservar los parámetros que son relevantes para el nuevo tipo de acción
          Object.keys(mergedParameters).forEach(key => {
            if (currentParameters[key] !== undefined) {
              mergedParameters[key] = currentParameters[key];
            }
          });
          
          updateNode(nodeId, { 
            actionType, 
            parameters: mergedParameters,
            lastModified: new Date().toISOString() 
          });
        }
      },
      
      updateActionNodeParameters: (nodeId, parameters) => {
        const { updateNode } = get();
        const node = get().nodes.find(n => n.id === nodeId);
        if (node && node.data) {
          const currentParameters = node.data.parameters || {};
          updateNode(nodeId, { 
            parameters: { ...currentParameters, ...parameters },
            lastModified: new Date().toISOString()
          });
        }
      },
      
      updateActionNodeStatus: (nodeId, status) => {
        const { updateNode } = get();
        updateNode(nodeId, { status });
      },
      
      toggleActionNodeCollapsed: (nodeId, isCollapsed) => {
        const { updateNode } = get();
        updateNode(nodeId, { isCollapsed });
      },

      // Acciones de aristas
      onConnect: (connection) => {
        const { nodes, edges, isUltraMode } = get();
        const sourceNode = nodes.find(n => n.id === connection.source);

        // --- GUARDA DE SEGURIDAD ---
        // Previene que onConnect cree aristas desde un DecisionNode.
        // La creación de OptionNodes y sus aristas se gestiona de forma declarativa
        // por generateOptionNodes, que se activa al añadir una nueva condición.
        // Esto evita el conflicto y la duplicación de aristas/nodos.
        if (sourceNode && sourceNode.type === NODE_TYPES.decision) {
          console.warn(
            '[FlowStore onConnect] Conexión manual desde DecisionNode interceptada y prevenida. ' +
            'Use el menú contextual "Agregar Opción" para asegurar la creación canónica de nodos y aristas.'
          );
          return; // Detiene la ejecución para evitar conflictos.
        }

        // Lógica estándar para el resto de conexiones
        const newEdge = {
          ...connection,
          id: `e-${connection.source}${connection.sourceHandle || ''}-${connection.target}${connection.targetHandle || ''}-${generateId('edge')}`,
          type: EDGE_TYPES.elite,
          animated: !isUltraMode,
          style: { stroke: EDGE_COLORS.default, strokeWidth: 2 },
          data: {
            ...connection.data,
            sourceType: sourceNode?.type,
            targetType: nodes.find(n => n.id === connection.target)?.type,
            plubotId: get().plubotId,
          },
        };

        set(state => ({
          edges: addEdge(newEdge, state.edges),
          hasChanges: true,
        }));
      },

      updateEdge: (id, data) => {
        set(state => ({
          edges: state.edges.map(edge => {
            if (edge.id === id) {
              return { ...edge, ...data };
            }
            return edge;
          }),
        }));
      },
      
      removeEdge: (edgeId) => {
        set(state => ({
          edges: state.edges.filter(edge => edge.id !== edgeId),
        }));
      },
      
      // Acciones de aristas
      setEdges: (edgesUpdater) => {
        set((state) => {
          try {
            const currentEdges = state.edges;
            const newEdges = typeof edgesUpdater === 'function' ? edgesUpdater(currentEdges) : edgesUpdater;

            if (!Array.isArray(newEdges)) {
              console.warn('[FlowStore setEdges] Updated edges is not an array. Aborting.', { newEdges });
              return state;
            }
            
            // This logic was part of the original implementation and is preserved.
            // It ensures edges have a default type and style.
            const processedEdges = newEdges.map(edge => ({
              ...edge,
              type: edge.type || EDGE_TYPES.ELITE_EDGE,
              animated: edge.animated !== undefined ? edge.animated : (edge.type !== EDGE_TYPES.PLACEHOLDER),
              style: edge.style || { stroke: EDGE_COLORS.default, strokeWidth: 2 },
            }));

            if (JSON.stringify(currentEdges) === JSON.stringify(processedEdges)) {
              return state; // No changes, prevent re-render
            }

            // Add previous state to history
            const newHistoryPast = state.history.past || [];
            if (newHistoryPast.length === 0 || 
                (JSON.stringify(newHistoryPast[newHistoryPast.length - 1].edges) !== JSON.stringify(currentEdges) || 
                 JSON.stringify(newHistoryPast[newHistoryPast.length - 1].nodes) !== JSON.stringify(state.nodes))) {
              newHistoryPast.push({ nodes: [...state.nodes], edges: [...currentEdges], viewport: state.viewport });
            }
            
            return {
              ...state,
              edges: processedEdges,
              history: {
                ...state.history,
                past: newHistoryPast.slice(-MAX_HISTORY_LENGTH),
                future: [],
              },
              isUndoing: false,
              isRedoing: false,
              hasChanges: true,
            };
          } catch (error) {
            console.error("Error in setEdges:", error);
            return state; // Return original state on error to prevent crashes
          }
        });
      },
      
      // Seleccionar nodos o aristas
      selectNode: (nodeId) => {
        set({ 
          selectedNode: nodeId,
          selectedEdge: null // Deseleccionar arista si hay alguna
        });
      },
      
      selectEdge: (edgeId) => {
        set({ 
          selectedEdge: edgeId,
          selectedNode: null // Deseleccionar nodo si hay alguno
        });
      },
      
      clearSelection: () => {
        set({ 
          selectedNode: null,
          selectedEdge: null 
        });
      },
      
      // Acción para establecer el plubotId
      setPlubotId: (id) => set({ plubotId: id }),
      
      // Cambio de nombre
      setFlowName: (name) => {
        set({ flowName: name });
      },
      
      // Toggle modo ultra rendimiento - solo por interacción del usuario
      toggleUltraMode: () => {
        // Usar el valor anterior para invertirlo
        const newUltraMode = !get().isUltraMode;
        
        // Primero actualizar el estado en el store
        set({ isUltraMode: newUltraMode });
        
        // Luego llamar a la función del UltraModeManager con userInitiated=true
        // para indicar que este cambio fue explicitamente por el usuario
        toggleUltraModeManager(newUltraMode, true);
      },
      
      // Centrar nodos en el viewport
      centerNodes: () => {
        set({ shouldMoveToCenter: true });
        setTimeout(() => {
          set({ shouldMoveToCenter: false });
        }, 100); // Reset flag después de ser consumido
      },
      
      // Toggle autoarrange
      toggleAutoArrange: () => {
        set(state => ({ autoArrange: !state.autoArrange }));
      },
      
      // Setear viewport
      setViewport: (viewport) => {
        set({ viewport });
      },
      
      // Eliminar las aristas desconectadas
      cleanUpEdges: () => {
        const { edges } = get();
        // Filtrar aristas válidas (con source y target definidos)
        return edges.filter(edge => 
          edge.source && edge.target && 
          edge.source.length > 0 && edge.target.length > 0
        );
      },
      
      // Gestión de modales
      openModal: (modalName) => {
        if (!modalName) return;
        
        set(state => ({
          modals: {
            ...state.modals,
            [modalName]: true
          }
        }));
      },
      
      closeModal: (modalName) => {
        if (!modalName) return;
        
        set(state => ({
          modals: {
            ...state.modals,
            [modalName]: false
          }
        }));
      },
      
      // Estado de backup
      setBackupLoaded: (loaded) => set({ isBackupLoaded: loaded }),
      setHasChanges: (hasChanges) => set({ hasChanges }),
      
      // Sistema de respaldo con debounce para optimizar rendimiento
      backupState: debounce((plubotId, nodes, edges) => {
        if (!plubotId) return;
        try {
          const backupData = { nodes, edges, timestamp: Date.now() };
          localStorage.setItem(`plubot-backup-${plubotId}`, JSON.stringify(backupData));
          console.log(`[FlowStore] Backup debounced para plubot ${plubotId}`);
        } catch (e) {
          console.error('[FlowStore] Error al crear respaldo local:', e);
        }
      }, 1000, { leading: false, trailing: true }), // Debounce de 1 segundo
      
      restoreFromBackup: (plubotId) => {
        if (!plubotId) return null;
        
        try {
          const backupJson = localStorage.getItem(`plubot-backup-${plubotId}`);
          if (!backupJson) return null;
          
          return JSON.parse(backupJson);
        } catch (e) {
          console.error('[FlowStore] Error al recuperar respaldo:', e);
          return null;
        }
      },
      
      backupEdges: (plubotId, edges) => {
        if (!plubotId || !edges) return;
        try {
          localStorage.setItem(`plubot-edges-${plubotId}`, JSON.stringify(edges));
        } catch (e) {}
      },
      
      backupNodes: (plubotId, nodes) => {
        if (!plubotId || !nodes) return;
        try {
          localStorage.setItem(`plubot-nodes-${plubotId}`, JSON.stringify(nodes));
        } catch (e) {}
      },
      
      // Acciones de historial
      setHistory: (updater) => {
        set((state) => {
          const newHistory = typeof updater === 'function' ? updater(state.history) : { ...state.history, ...updater };
          return {
            history: { ...state.history, ...newHistory },
          };
        });
      },
      undo: () => {
        set((state) => {
          const { past, future, maxHistory } = state.history;
          if (past.length === 0) return state; // nada que deshacer

          const isSameSnapshot = (a, b) => {
            return (
              JSON.stringify(a.nodes) === JSON.stringify(b.nodes) &&
              JSON.stringify(a.edges) === JSON.stringify(b.edges) &&
              JSON.stringify(a.viewport) === JSON.stringify(b.viewport)
            );
          };

          // Snapshot actual
          const currentSnap = {
            nodes: state.nodes,
            edges: state.edges,
            viewport: state.viewport,
          };

          // Remover duplicados al final del pasado
          let newPast = [...past];
          while (newPast.length > 0 && isSameSnapshot(newPast[newPast.length - 1], currentSnap)) {
            newPast.pop();
          }

          if (newPast.length === 0) return state; // no hay un estado distinto al cual volver

          const previous = newPast[newPast.length - 1];

          return {
            ...state,
            nodes: previous.nodes,
            edges: previous.edges,
            viewport: previous.viewport,
            isUndoing: true,
            history: {
              ...state.history,
              past: newPast.slice(0, -1),
              future: [currentSnap, ...future].slice(0, maxHistory),
            },
          };
        });
      },

      redo: () => {
        set((state) => {
          const { future, past, maxHistory } = state.history;
          if (future.length === 0) return state; // nada que rehacer

          const isSameSnapshot = (a, b) => {
            return (
              JSON.stringify(a.nodes) === JSON.stringify(b.nodes) &&
              JSON.stringify(a.edges) === JSON.stringify(b.edges) &&
              JSON.stringify(a.viewport) === JSON.stringify(b.viewport)
            );
          };

          const currentSnap = {
            nodes: state.nodes,
            edges: state.edges,
            viewport: state.viewport,
          };

          // Saltar duplicados al comienzo del futuro
          let newFuture = [...future];
          while (newFuture.length > 0 && isSameSnapshot(newFuture[0], currentSnap)) {
            newFuture.shift();
          }

          if (newFuture.length === 0) return state; // nada distinto adelante

          const next = newFuture[0];

          return {
            ...state,
            nodes: next.nodes,
            edges: next.edges,
            viewport: next.viewport,
            isRedoing: true,
            history: {
              ...state.history,
              past: [...past, currentSnap].slice(-maxHistory),
              future: newFuture.slice(1),
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
            }
          });
        }, 500);
      },
      
      // Resetear al estado inicial
      reset: () => {
        set({
          ...initialState,
          history: {
            past: [],
            future: [],
            maxHistory: 50,
          }
        });
      },
      
      // Resetear solo los nodos y aristas manteniendo el resto del estado
      // Útil para cambiar de un Plubot a otro sin perder configuraciones
      resetFlow: (plubotIdToSet, flowNameToSet, options = {}) => { 
        console.log(`[FlowStore] resetFlow ENTERED. ID: ${plubotIdToSet}, Name: ${flowNameToSet}, Opts:`, options);
        
        const currentPlubotId = get().plubotId;
        console.log(`[FlowStore] resetFlow: currentPlubotId = ${currentPlubotId}`);

        const shouldAttemptLoad = (!options.skipLoad && plubotIdToSet && plubotIdToSet !== get().plubotId) || 
                                  (plubotIdToSet && options.skipLoad === false);
        console.log(`[FlowStore] resetFlow: shouldAttemptLoad = ${shouldAttemptLoad}`);

        if (shouldAttemptLoad) {
          console.log(`[FlowStore] resetFlow: INSIDE shouldAttemptLoad block. Attempting to get loadFlow.`);
          let loadFlowFn;
          try {
            loadFlowFn = get().loadFlow;
            console.log(`[FlowStore] resetFlow: get().loadFlow retrieved. Type: ${typeof loadFlowFn}, Exists: ${!!loadFlowFn}`);
          } catch (e) {
            console.error(`[FlowStore] resetFlow: ERROR during get().loadFlow access:`, e);
            set({
              nodes: [],
              edges: [],
              flowName: flowNameToSet || 'Flujo sin título',
              plubotId: plubotIdToSet,
              viewport: initialState.viewport,
              history: { past: [], future: [], maxHistory: 50 },
              selectedNode: null,
              selectedEdge: null,
              hasChanges: false,
              isLoaded: true, // Estado de carga completado
            });
            return;
          }

          if (typeof loadFlowFn === 'function') {
            console.log(`[FlowStore] resetFlow: loadFlowFn IS a function. Calling for ID: ${plubotIdToSet}`);
            loadFlowFn(plubotIdToSet)
              .then(() => {
                console.log(`[FlowStore] resetFlow: loadFlowFn(${plubotIdToSet}) .then() reached.`);
                // loadFlow ya debería haber establecido el flowName desde el backend.
                // Solo aseguramos que plubotIdToSet esté correctamente en el store si es diferente.
                if (plubotIdToSet && get().plubotId !== plubotIdToSet) {
                  set({ plubotId: plubotIdToSet });
                }
                // NO sobrescribir get().flowName con flowNameToSet aquí si loadFlow tuvo éxito,
                // ya que loadFlow obtiene el nombre autoritativo del backend.
                console.log(`[FlowStore] Carga de datos completada para ${plubotIdToSet} después de resetFlow. Nombre actual en store (debería ser de loadFlow): ${get().flowName}`);
              })
              .catch(error => {
                console.error(`[FlowStore] resetFlow: loadFlowFn(${plubotIdToSet}) .catch() reached:`, error);
                // loadFlow también tiene un catch que actualiza el estado.
                // Aquí, nos aseguramos de que, si ese catch falló o si llegamos aquí por otra razón,
                // el estado se resetea de forma segura con el flowNameToSet como fallback.
                set({
                  nodes: [],
                  edges: [],
                  flowName: flowNameToSet || `Error al cargar ${plubotIdToSet}`, // Usar flowNameToSet como fallback principal en error de carga
                  plubotId: plubotIdToSet,
                  viewport: initialState.viewport,
                  isSaving: false,
                  lastSaved: null,
                  hasChanges: false, 
                  history: { past: [], future: [], maxHistory: 50 },
                  selectedNode: null,
                  selectedEdge: null,
                  isLoaded: true, // Estado de carga completado
                });
              });
          } else {
            console.error(`[FlowStore] resetFlow: loadFlowFn is NOT a function. Type: ${typeof loadFlowFn}. Reseteando a vacío.`);
            set({
              nodes: [],
              edges: [],
              flowName: flowNameToSet || 'Flujo sin título',
              plubotId: plubotIdToSet,
              viewport: initialState.viewport,
              history: { past: [], future: [], maxHistory: 50 },
              selectedNode: null,
              selectedEdge: null,
              hasChanges: false,
              isLoaded: true, // Estado de carga completado
            });
          }
        } else {
          console.log(`[FlowStore] resetFlow: SKIPPING load. Applying base state for ID: ${plubotIdToSet}`);
          set({
            nodes: options.nodes || [],
            edges: options.edges || [],
            flowName: flowNameToSet || 'Flujo sin título',
            plubotId: plubotIdToSet,
            viewport: initialState.viewport,
            history: { past: [], future: [], maxHistory: 50 },
            selectedNode: null,
            selectedEdge: null,
            hasChanges: false,
            isLoaded: true, // Estado de carga completado
          });
        }

        // Doble verificación para asegurar que el nombre y el ID del plubot estén seteados
        // al final de resetFlow, si se proporcionaron.
        if (flowNameToSet) {
          const currentStoreName = get().flowName;
          // Solo actualizar con flowNameToSet si el nombre actual es el inicial por defecto,
          // o un nombre genérico de error que loadFlow podría haber puesto si falló en obtener uno específico,
          // o si el nombre actual es simplemente el plubotId (otro fallback de loadFlow).
          const isDefaultOrGenericError = 
            currentStoreName === initialState.flowName || 
            currentStoreName === `Flujo de ${plubotIdToSet}` || // Fallback de loadFlow
            currentStoreName === `Nuevo Flujo para ${plubotIdToSet}` || // Fallback de loadFlow para datos no válidos
            currentStoreName === `Error al cargar ${plubotIdToSet}`; // Fallback de loadFlow en error

          if (isDefaultOrGenericError && currentStoreName !== flowNameToSet) {
            console.log(`[FlowStore] resetFlow: Final check - Current name ('${currentStoreName}') is default/error/generic. Updating with flowNameToSet ('${flowNameToSet}').`);
            set({ flowName: flowNameToSet });
          } else if (currentStoreName !== flowNameToSet) {
            console.log(`[FlowStore] resetFlow: Final check - Current name ('${currentStoreName}') is specific (likely from backend via loadFlow). Not overwriting with flowNameToSet ('${flowNameToSet}').`);
          }
        }

        if (plubotIdToSet && get().plubotId !== plubotIdToSet) {
          console.log(`[FlowStore] resetFlow: Final check - Ensuring plubotId is set to ${plubotIdToSet}`);
          set({ plubotId: plubotIdToSet });
        }
        console.log(`[FlowStore] resetFlow EXITED for ID: ${plubotIdToSet}`);
      },
      
      // Sistema de guardado optimizado con caché inteligente
      saveFlow: async () => {
        // Solo permitir guardar si no hay un guardado en progreso
        if (get().isSaving) {
          console.log('[FlowStore] Guardado ya en progreso, usando sistema de cola inteligente');
          // En lugar de ignorar la solicitud, la ponemos en cola
          const state = {
            nodes: get().nodes,
            edges: get().edges,
            flowName: get().flowName,
            id: get().plubotId
          };
          
          flowStateManager.queueSave(state, (queuedState) => {
            // Esta función se ejecutará después del periodo de debounce
            get().saveFlowImmediately(queuedState);
          });
          
          return { 
            success: true, 
            message: 'Guardado puesto en cola inteligente' 
          };
        }
        
        // Establecer estado de guardado
        set({ isSaving: true });
        
        try {
          const { nodes, edges, flowName, plubotId } = get();
          
          if (!plubotId) {
            set({ isSaving: false });
            return { 
              success: false, 
              message: 'ID de plubot no definido, imposible guardar.' 
            };
          }
          
          // Usar el sistema de gestión de estado para evitar guardados redundantes
          const stateToSave = { nodes, edges, flowName, id: plubotId };
          const shouldSave = flowStateManager.queueSave(stateToSave, (queuedState) => {
            // Esta función se ejecutará después del periodo de debounce
            get().saveFlowImmediately(queuedState);
          });
        
          if (!shouldSave) {
            // El sistema detectó que no hay cambios significativos
            set({ isSaving: false });
            return { 
              success: true, 
              message: 'No hay cambios significativos que guardar' 
            };
          }
          
          // Crear respaldo local en localStorage (seguridad adicional)
          // para evitar recuperación no deseada
          try {
            localStorage.setItem(`plubot-flow-backup-${plubotId}`, JSON.stringify({
              nodes,
              edges,
              name: flowName || 'Flujo sin título',
              timestamp: new Date().toISOString()
            }));
            console.log('[FlowStore] Respaldo local creado exitosamente');
          } catch (storageError) {
            console.warn('[FlowStore] Error al crear respaldo local:', storageError);
          }
          
          return { 
            success: true, 
            message: 'Guardado programado con optimización adaptativa' 
          };
        } catch (error) {
          console.error('[FlowStore] Error crítico al programar guardado:', error);
          set({ isSaving: false });
          
          return {
            success: false,
            message: 'Error crítico: ' + (error.message || 'Error desconocido')
          };
        }
      },
      
      // Función interna para guardar inmediatamente sin pasar por el sistema de cola
      saveFlowImmediately: async (state) => {
        if (!state) {
          console.error('[FlowStore] No hay estado para guardar');
          return { success: false, message: 'No hay estado para guardar' };
        }
        
        try {
          console.log(`[FlowStore] Guardando flujo: ${state.flowName} (ID: ${state.id})`);
          
          // Utilizar flowService para guardar
          const result = await flowService.saveFlow(state.id, {
            name: state.flowName,
            nodes: state.nodes,
            edges: state.edges
          });
          
          // Actualizar estado después de guardado exitoso
          if (result.status === 'success') {
            set({ 
              isSaving: false, 
              lastSaved: new Date().toISOString(),
              // Actualizar estado previo para comparaciones futuras
              previousState: {
                nodes: state.nodes,
                edges: state.edges,
                name: state.flowName
              }
            });
            console.log('[FlowStore] Flujo guardado exitosamente:', result.message);
            
            // Actualizar caché de posiciones para carga rápida en el futuro
            nodePositionCache.savePositions(state.id, state.nodes);
          } else {
            set({ isSaving: false });
            console.error('[FlowStore] Error al guardar el flujo:', result.message);
          }
          
          return result;
        } catch (error) {
          console.error('[FlowStore] Error crítico al guardar el flujo:', error);
          set({ isSaving: false });
          
          return {
            success: false,
            message: 'Error crítico al guardar: ' + (error.message || 'Error desconocido')
          };
        }
      },
      
      // Nueva acción para cargar datos de un flujo específico
      loadFlow: async (plubotId) => {
        if (!plubotId) {
          console.warn('[FlowStore] loadFlow llamado sin plubotId. Reseteando a estado vacío.');
          get().reset(); // Resetea al estado inicial completo
          return;
        }
        console.log(`[FlowStore] Iniciando carga de flujo para Plubot ID: ${plubotId}`);
        set({ isSaving: true, plubotId: plubotId, hasChanges: false }); // Marcar como cargando, setear ID y resetear cambios

        try {
          const flowData = await flowService.loadFlow(plubotId);
          console.log(`[FlowStore] loadFlow: Received flowData for plubotId ${plubotId}. Name: ${flowData?.name || 'N/A'}, Nodes: ${flowData?.nodes?.length || 0}, Edges: ${flowData?.edges?.length || 0}`);
          console.log(`[FlowStore] loadFlow: Data is valid. Setting flowName to: '${flowData.name || `Flujo de ${plubotId}`}'`);
          if (flowData && typeof flowData === 'object') {
            console.log(`[FlowStore] loadFlow: Data is valid. Setting flowName to: '${flowData.name || `Flujo de ${plubotId}`}'`);
            
            const nodes = Array.isArray(flowData.nodes) ? flowData.nodes : [];
            const edges = Array.isArray(flowData.edges) ? flowData.edges : [];
            const flowName = flowData.name || `Flujo de ${plubotId}`;
            const viewport = flowData.viewport || initialState.viewport;

            const validatedNodes = validateNodePositions(nodes);
            const finalNodes = preventNodeStacking(validatedNodes);
            
            set({
              nodes: finalNodes,
              edges: edges,
              flowName: flowName,
              plubotId: plubotId,
              viewport: viewport,
              isSaving: false,
              lastSaved: new Date().toISOString(),
              hasChanges: false, // Un flujo recién cargado no tiene cambios no guardados
              history: { past: [], future: [], maxHistory: 50 }, // Resetear historial
              selectedNode: null,
              selectedEdge: null,
              isLoaded: true, // Estado de carga completado
            });
            
            // Después de cargar los nodos y aristas base, generar/actualizar
            // los OptionNodes y sus aristas para cada DecisionNode.
            const currentNodes = get().nodes; 
            currentNodes.forEach(node => {
              if (node.type === NODE_TYPES.decision) {
                console.log(`[FlowStore loadFlow] Llamando a generateOptionNodes para DecisionNode ID: ${node.id} después de la carga.`);
                get().generateOptionNodes(node.id);
              }
            });

            const finalEdgesAfterOptionGeneration = get().edges;
            console.log(`[FlowStore loadFlow] Estado final de ARISTAS después de generateOptionNodes. Total: ${finalEdgesAfterOptionGeneration.length}`);
            finalEdgesAfterOptionGeneration.forEach(edge => {
              if (edge.source.startsWith('decision-') || edge.target.startsWith('option-')) {
                console.log(`[FlowStore loadFlow] Arista Decision/Option: ID=${edge.id}, Source=${edge.source}, Target=${edge.target}, Type=${edge.type}, Animated=${edge.animated}`);
              }
            });

            // Opcional: Llamar a cleanUpEdges o sanitizeEdgePaths si es necesario después de generar las aristas de OptionNode
            // Ejemplo: setTimeout(() => get().cleanUpEdges(), 0);
            // Por ahora, nos enfocamos en la generación de las aristas de OptionNode.
            // Si sanitizeEdgePaths sigue siendo relevante, puede reincorporarse.
            // Considera que generateOptionNodes ya añade/actualiza aristas.
            // setTimeout(() => sanitizeEdgePaths(), 0); // Comentado temporalmente para aislar el efecto de generateOptionNodes

            console.log(`[FlowStore] Flujo ${plubotId} cargado y estado actualizado, OptionNodes y sus aristas generados/actualizados.`);
          } else {
            console.warn(`[FlowStore] No se encontraron datos válidos o estructura incorrecta para Plubot ID ${plubotId}. Datos recibidos:`, flowData, `Reseteando a un flujo vacío con ese ID.`);
            set({
              nodes: [], 
              edges: [],
              flowName: `Nuevo Flujo para ${plubotId}`,
              plubotId: plubotId,
              viewport: initialState.viewport,
              isSaving: false,
              lastSaved: null,
              hasChanges: false, 
              history: { past: [], future: [], maxHistory: 50 },
              selectedNode: null,
              selectedEdge: null,
              isLoaded: true, // Estado de carga completado
            });
          }
        } catch (error) {
          console.error(`[FlowStore] Error cargando el flujo ${plubotId}:`, error);
          set({ 
            isSaving: false,
            nodes: [], 
            edges: [],
            flowName: `Error al cargar ${plubotId}`,
            plubotId: plubotId,
            viewport: initialState.viewport,
            lastSaved: null,
            hasChanges: false,
            history: { past: [], future: [], maxHistory: MAX_HISTORY_LENGTH },
            selectedNode: null,
            selectedEdge: null,
            isLoaded: true, 
          });
        }
      }, // Fin de loadFlow

    }), // Fin del objeto de acciones (set, get) => ({...})
    { // Inicio del objeto de configuración de persist
      name: 'flow-editor-store',
      storage: createJSONStorage(() => customZustandStorage),
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        viewport: state.viewport,
        isUltraMode: state.isUltraMode,
        flowName: state.flowName,
        plubotId: state.plubotId,
        lastSaved: state.lastSaved,
        isLoaded: state.isLoaded,
      }),
    } // Fin del objeto de configuración de persist
  ) // Fin de persist()
); // Fin de create()

// Selectores optimizados para el store
export const useNode = (id) => 
  useFlowStore(state => state.nodes.find(node => node.id === id));

export const useEdge = (id) => 
  useFlowStore(state => state.edges.find(edge => edge.id === id));

export const useConnectedEdges = (nodeId) => 
  useFlowStore(state => 
    state.edges.filter(edge => 
      edge.source === nodeId || edge.target === nodeId
    )
  );

export const useSelectedNode = () => 
  useFlowStore(state => 
    state.selectedNode ? 
    state.nodes.find(n => n.id === state.selectedNode) : 
    null
  );

export const useIsNodeSelected = (nodeId) => 
  useFlowStore(state => state.selectedNode === nodeId);

// Selectores granulares para optimización de rendimiento

/**
 * Hook optimizado para obtener los datos de un nodo específico.
 * Se suscribe únicamente a los cambios de ese nodo.
 * @param {string} id - El ID del nodo.
 * @returns {object|null} Los datos del nodo o null si no se encuentra.
 */
export const useNodeData = (id) => {
  return useFlowStore(state => {
    const node = state.nodes.find(n => n.id === id);
    return node ? node.data : null;
  }, shallow);
};

/**
 * Hook optimizado para obtener las acciones relacionadas con los nodos de decisión.
 * Las acciones son estables, y 'shallow' previene re-renders innecesarios.
 * @returns {object} Un objeto con todas las acciones para nodos de decisión.
 */
export const useDecisionNodeActions = () => {
  return useFlowStore(state => ({
    updateDecisionNodeQuestion: state.updateDecisionNodeQuestion,
    addDecisionNodeCondition: state.addDecisionNodeCondition,
    updateDecisionNodeConditionText: state.updateDecisionNodeConditionText,
    deleteDecisionNodeCondition: state.deleteDecisionNodeCondition,
    moveDecisionNodeCondition: state.moveDecisionNodeCondition,
    toggleDecisionNodeFeature: state.toggleDecisionNodeFeature,
    updateDecisionNodeData: state.updateDecisionNodeData,
    generateOptionNodes: state.generateOptionNodes,
    duplicateDecisionNode: state.duplicateDecisionNode,
    getNode: state.getNode,
    setNodes: state.setNodes,
    deleteNode: state.deleteNode, // Añadido para completitud
  }), shallow);
};

export default useFlowStore;
