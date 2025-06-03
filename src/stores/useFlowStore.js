import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import customZustandStorage from './customZustandStorage';
import { applyNodeChanges, applyEdgeChanges, addEdge } from 'reactflow';
import { preventNodeStacking } from '../components/onboarding/flow-editor/utils/fix-node-positions';
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
    undoStack: [],
    redoStack: [],
    maxHistory: MAX_HISTORY_LENGTH,
  },
  // Estado para el menú contextual global
  contextMenuVisible: false,
  contextMenuPosition: { x: 0, y: 0 },
  contextMenuNodeId: null,
  contextMenuItems: [],
};

const useFlowStore = create(
  persist(
    (set, get) => ({
      ...initialState,

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
        const currentNodes = get().nodes;

        // Determine the nature of changes
        const isActualDragEnd = changes.some(change => 
          change.type === 'position' && 
          change.dragging === false && 
          currentNodes.find(n => n.id === change.id)?.dragging === true
        );
        const isSelectionChange = changes.every(c => c.type === 'select');
        const isDimensionsChange = changes.every(c => c.type === 'dimensions');

        const newNodesApplied = applyNodeChanges(changes, currentNodes);
        let finalNodes = newNodesApplied;

        // Condition for when heavy processing (validation, stacking, sanitizing) should occur
        // Needs processing if it's an actual drag end, OR if the changes are not purely selection/dimension changes.
        // This covers intermediate drags, add/remove, programmatic position/data changes as well.
        const needsProcessing = isActualDragEnd || (!isSelectionChange && !isDimensionsChange);

        if (needsProcessing) {
          // Validate positions first
          const validatedNodes = validateNodePositions(newNodesApplied);
          // Then prevent stacking
          finalNodes = preventNodeStacking(validatedNodes);
          // And sanitize edge paths
          sanitizeEdgePaths(); 
        } else {
          // If no heavy processing is needed, finalNodes remains newNodesApplied.
          // This path is taken for pure selection or pure dimension changes (that are not a drag end).
        }
        
        set({
          nodes: finalNodes,
          isUndoing: false, // Reset undo/redo flags on any change
          isRedoing: false,
          hasChanges: true, // Mark that there are changes
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
                const defaultNodeOutputs = ['Sí', 'No']; // Usar defaults directamente
                newNode.data.conditions = defaultNodeOutputs.map(text => ({
                  id: generateNodeId('condition'),
                  text: text
                }));
              }
              // Opcional: delete newNode.data.outputs; // Para evitar redundancia si se prefiere
            }

            // Añadir el nodo al estado
            set((state) => {
              const allNodesWithNew = [...state.nodes, newNode];
              const stackedFixedNodes = preventNodeStacking(allNodesWithNew);
              return { nodes: stackedFixedNodes };
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

      addDecisionNodeCondition: (nodeId, newConditionText) => {
        console.log(`[FlowStore addDecisionNodeCondition ENTER] nodeId: ${nodeId}, newConditionText: ${newConditionText}`);
        set((state) => {
          const newNodes = state.nodes.map((node) => {
            if (node.id === nodeId && node.type === NODE_TYPES.decision) {
              console.log(`[FlowStore addDecisionNodeCondition MID-UPDATE node: ${node.id}] node.data.conditions:`, JSON.stringify(node.data.conditions));
              const newCondition = { id: generateNodeId('condition'), text: newConditionText };
              const currentConditions = Array.isArray(node.data.conditions) ? node.data.conditions : [];
              console.log(`[FlowStore addDecisionNodeCondition MID-UPDATE node: ${node.id}] newCondition:`, JSON.stringify(newCondition), `currentConditions array:`, JSON.stringify(currentConditions));
              const updatedConditions = [...currentConditions, newCondition];
              console.log(`[FlowStore addDecisionNodeCondition POST-UPDATE node: ${node.id}] final node.data.conditions to be set:`, JSON.stringify(updatedConditions));
              return {
                ...node,
                data: {
                  ...node.data,
                  conditions: updatedConditions,
                  handleIds: updatedConditions.map(cond => `output-${cond.id}`),
                },
              };
            }
            return node;
          });
          return { nodes: newNodes, hasChanges: true };
        });
      },

      updateDecisionNodeConditionText: (nodeId, conditionId, newText) => {
        set((state) => {
          const newNodes = state.nodes.map((node) => {
            if (node.id === nodeId && node.type === NODE_TYPES.decision) {
              const updatedConditions = (node.data.conditions || []).map(cond =>
                cond.id === conditionId ? { ...cond, text: newText } : cond
              );
              return {
                ...node,
                data: { ...node.data, conditions: updatedConditions },
              };
            }
            return node;
          });
          return { nodes: newNodes, hasChanges: true };
        });
      },

      deleteDecisionNodeCondition: (nodeId, conditionIdToDelete) => {
        const { nodes, removeNode: storeRemoveNodeInternal } = get();
        let optionNodeIdToDelete = null;

        const updatedNodes = nodes.map(node => {
          if (node.id === nodeId && node.type === NODE_TYPES.decision) {
            const oldConditions = node.data.conditions || [];
            const newConditions = oldConditions.filter(cond => cond.id !== conditionIdToDelete);
            
            const optionNode = nodes.find(n => 
              n.data?.sourceNode === nodeId && 
              n.data?.sourceConditionId === conditionIdToDelete && 
              n.type === NODE_TYPES.option
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
      updateOptionNodeInstruction: (nodeId, newInstruction) => {
        const { updateNode } = get();
        updateNode(nodeId, { instruction: newInstruction, lastUpdated: new Date().toISOString() });
      },
      
      updateOptionNodeData: (nodeId, data) => {
        const { updateNode } = get();
        updateNode(nodeId, { ...data, lastUpdated: new Date().toISOString() });
      },
      
      // Acciones específicas para MessageNode
      updateMessageNodeContent: (nodeId, message) => {
        const { updateNode } = get();
        updateNode(nodeId, { message, lastUpdated: new Date().toISOString() });
      },
      
      updateMessageNodeType: (nodeId, type) => {
        const { updateNode } = get();
        updateNode(nodeId, { type, lastUpdated: new Date().toISOString() });
      },
      
      updateMessageNodeData: (nodeId, data) => {
        const { updateNode } = get();
        updateNode(nodeId, { ...data, lastUpdated: new Date().toISOString() });
      },
      
      addMessageNodeVariable: (nodeId, variable) => {
        set(state => {
          const nodes = state.nodes.map(node => {
            if (node.id === nodeId) {
              const variables = node.data.variables || [];
              return {
                ...node,
                data: {
                  ...node.data,
                  variables: [...variables, variable],
                  lastUpdated: new Date().toISOString()
                }
              };
            }
            return node;
          });
          
          return { ...state, nodes, hasChanges: true };
        });
      },
      
      updateMessageNodeVariable: (nodeId, index, updatedVariable) => {
        set(state => {
          const nodes = state.nodes.map(node => {
            if (node.id === nodeId && node.data.variables) {
              const variables = [...node.data.variables];
              if (index >= 0 && index < variables.length) {
                variables[index] = updatedVariable;
              }
              
              return {
                ...node,
                data: {
                  ...node.data,
                  variables,
                  lastUpdated: new Date().toISOString()
                }
              };
            }
            return node;
          });
          
          return { ...state, nodes, hasChanges: true };
        });
      },
      
      deleteMessageNodeVariable: (nodeId, index) => {
        set(state => {
          const nodes = state.nodes.map(node => {
            if (node.id === nodeId && node.data.variables) {
              const variables = node.data.variables.filter((_, i) => i !== index);
              
              return {
                ...node,
                data: {
                  ...node.data,
                  variables,
                  lastUpdated: new Date().toISOString()
                }
              };
            }
            return node;
          });
          
          return { ...state, nodes, hasChanges: true };
        });
      },
      
      // Acciones específicas para EndNode
      updateEndNodeLabel: (nodeId, label) => {
        const { updateNode } = get();
        updateNode(nodeId, { 
          label, 
          lastUpdated: new Date().toISOString() 
        });
      },
      
      updateEndNodeData: (nodeId, data) => {
        const { updateNode } = get();
        updateNode(nodeId, { 
          ...data, 
          lastUpdated: new Date().toISOString() 
        });
      },
      
      toggleEndNodeCollapse: (nodeId, isCollapsed) => {
        const { updateNode } = get();
        updateNode(nodeId, { isCollapsed });
      },
      
      addEndNodeVariable: (nodeId, variable) => {
        set(state => {
          const nodes = state.nodes.map(node => {
            if (node.id === nodeId) {
              const variables = node.data.variables || [];
              return {
                ...node,
                data: {
                  ...node.data,
                  variables: [...variables, variable],
                  lastUpdated: new Date().toISOString()
                }
              };
            }
            return node;
          });
          
          return { ...state, nodes, hasChanges: true };
        });
      },
      
      updateEndNodeVariable: (nodeId, index, value) => {
        set(state => {
          const nodes = state.nodes.map(node => {
            if (node.id === nodeId && node.data.variables) {
              const variables = [...node.data.variables];
              if (index >= 0 && index < variables.length) {
                variables[index] = value;
              }
              
              return {
                ...node,
                data: {
                  ...node.data,
                  variables,
                  lastUpdated: new Date().toISOString()
                }
              };
            }
            return node;
          });
          
          return { ...state, nodes, hasChanges: true };
        });
      },
      
      removeEndNodeVariable: (nodeId, index) => {
        set(state => {
          const nodes = state.nodes.map(node => {
            if (node.id === nodeId && node.data.variables) {
              const variables = node.data.variables.filter((_, i) => i !== index);
              
              return {
                ...node,
                data: {
                  ...node.data,
                  variables,
                  lastUpdated: new Date().toISOString()
                }
              };
            }
            return node;
          });
          
          return { ...state, nodes, hasChanges: true };
        });
      },
      
      resizeEndNode: (nodeId, width, height) => {
        set(state => {
          const nodes = state.nodes.map(node => {
            if (node.id === nodeId) {
              return {
                ...node,
                width: Math.max(width, NODE_CONFIG.MIN_WIDTH || 150),
                height: Math.max(height, NODE_CONFIG.MIN_HEIGHT || 100)
              };
            }
            return node;
          });
          
          return { ...state, nodes, hasChanges: true };
        });
      },
      
      navigateToSourceNode: (optionNodeId) => {
        const state = get();
        const optionNode = state.nodes.find(n => n.id === optionNodeId);
        
        if (!optionNode || !optionNode.data || !optionNode.data.sourceNode) {
          console.warn('No se pudo encontrar el nodo fuente para este nodo de opción');
          return null;
        }
        
        const sourceNodeId = optionNode.data.sourceNode;
        const sourceNodeExists = state.nodes.some(n => n.id === sourceNodeId);
        
        if (!sourceNodeExists) {
          console.warn(`El nodo fuente ${sourceNodeId} ya no existe en el flujo`);
          return null;
        }
        
        // Deseleccionar todos los nodos y seleccionar solo el nodo fuente
        state.setNodes(nds =>
          nds.map(n => ({
            ...n,
            selected: n.id === sourceNodeId,
          }))
        );
        
        return sourceNodeId;
      },
      
      updateDecisionNodeData: (nodeId, data) => {
        const { updateNode } = get();
        updateNode(nodeId, { ...data, lastModified: new Date().toISOString() });
      },
      
      generateOptionNodes: (nodeId) => {
    console.log(`[generateOptionNodes ENTERED] for DecisionNode ID: ${nodeId}`);
    set((state) => {
      const decisionNode = state.nodes.find(node => node.id === nodeId && node.type === NODE_TYPES.decision);
      console.log(`[generateOptionNodes] DecisionNode (${nodeId}) found in state:`, decisionNode ? decisionNode.id : 'NOT FOUND', 'Conditions:', decisionNode ? JSON.stringify(decisionNode.data.conditions) : 'N/A');
      if (!decisionNode) return state;
      
      const conditions = decisionNode.data.conditions || [];
      // Si no hay condiciones, aún podríamos necesitar limpiar OptionNodes huérfanos.
      if (conditions.length === 0) {
        const optionNodesToRemove = state.nodes.filter(n =>
          n.type === NODE_TYPES.option && 
          n.data && 
          n.data.sourceNode === nodeId
        );
        if (optionNodesToRemove.length > 0) {
          const optionNodeIdsToRemove = optionNodesToRemove.map(n => n.id);
          const remainingNodes = state.nodes.filter(n => !optionNodeIdsToRemove.includes(n.id));
          const remainingEdges = state.edges.filter(e => 
            !(optionNodeIdsToRemove.includes(e.target) && e.source === nodeId) && 
            !(optionNodeIdsToRemove.includes(e.source)) 
          );
          console.log(`[generateOptionNodes ${nodeId}] No conditions, removing ${optionNodesToRemove.length} orphan OptionNodes.`);
          return { nodes: remainingNodes, edges: remainingEdges, hasChanges: true };
        }
        console.log(`[generateOptionNodes ${nodeId}] No conditions and no orphan OptionNodes to remove.`);
        return state; // No conditions and no orphans to remove
      }
      
      const parentPosition = {
        x: Math.round(decisionNode.position.x),
        y: Math.round(decisionNode.position.y)
      };
      const parentWidth = decisionNode.width || 250; 
      const parentHeight = decisionNode.height || 50; 
      
      let updatedNodes = [...state.nodes];
      let updatedEdges = [...state.edges];
      
      const OPTION_NODE_WIDTH = 150;
      const OPTION_NODE_HEIGHT = 70; // Estimación, ajustar si es necesario
      const HORIZONTAL_SPACING_FROM_PARENT_EDGE = 30;
      const HORIZONTAL_SPACING_BETWEEN_DEFAULTS = 20;
      const VERTICAL_SPACING_FROM_PARENT_BOTTOM = 120;
      const VERTICAL_OFFSET_FOR_NO = 40; // Para que "No" esté más abajo

      let defaultConditionXStart = parentPosition.x + parentWidth + HORIZONTAL_SPACING_FROM_PARENT_EDGE;

      conditions.forEach((conditionObj, index) => {
        console.log(`[generateOptionNodes ${nodeId}] Processing condition (idx ${index}):`, conditionObj, 'Searching for OptionNode ID:', conditionObj.optionNodeId);
        const conditionType = getConditionType(conditionObj.text);

        let xPos, yPos;
        const decisionNodeBottomY = parentPosition.y + parentHeight;
        const decisionNodeCenterX = parentPosition.x + parentWidth / 2;

        if (conditionType === CONDITION_TYPES.TRUE) {
          xPos = parentPosition.x - OPTION_NODE_WIDTH - HORIZONTAL_SPACING_FROM_PARENT_EDGE;
          yPos = decisionNodeBottomY + VERTICAL_SPACING_FROM_PARENT_BOTTOM;
        } else if (conditionType === CONDITION_TYPES.FALSE) {
          xPos = decisionNodeCenterX - (OPTION_NODE_WIDTH / 2);
          yPos = decisionNodeBottomY + VERTICAL_SPACING_FROM_PARENT_BOTTOM + VERTICAL_OFFSET_FOR_NO;
        } else { // CONDITION_TYPES.DEFAULT
          xPos = defaultConditionXStart;
          yPos = decisionNodeBottomY + VERTICAL_SPACING_FROM_PARENT_BOTTOM;
          defaultConditionXStart += OPTION_NODE_WIDTH + HORIZONTAL_SPACING_BETWEEN_DEFAULTS;
        }

        const optionPosition = {
          x: Math.round(xPos),
          y: Math.round(yPos),
        };
        
        let existingNode = null;
        if (conditionObj.optionNodeId) {
          existingNode = updatedNodes.find(
            node => node.id === conditionObj.optionNodeId && node.type === NODE_TYPES.option
          );
        }
        console.log(`[generateOptionNodes ${nodeId}] Found existing OptionNode by ID ${conditionObj.optionNodeId}:`, existingNode ? existingNode.id : 'NOT FOUND');
        
        const sourceHandleId = `output-${conditionObj.id}`; 

        if (existingNode) {
          const nodeNeedsUpdate =
            existingNode.data.label !== conditionObj.text ||
            Math.round(existingNode.position.x) !== Math.round(optionPosition.x) ||
            Math.round(existingNode.position.y) !== Math.round(optionPosition.y) ||
            existingNode.data.conditionIndex !== index ||
            existingNode.data.sourceNode !== nodeId ||
            existingNode.data.sourceConditionId !== conditionObj.id ||
            existingNode.data.parentHandleColor !== getConnectorColor(conditionObj.text, index); // Comparar también el color

              if (nodeNeedsUpdate) {
            updatedNodes = updatedNodes.map(node =>
              node.id === existingNode.id
              ? {
                  ...node,
                  data: {
                      ...node.data,
                      label: conditionObj.text,
                      sourceNode: nodeId,
                      sourceConditionId: conditionObj.id,
                      conditionIndex: index,
                      parentHandleColor: getConnectorColor(conditionObj.text, index),
                      isUltraPerformanceMode: decisionNode.data.isUltraPerformanceMode || false,
                      sourceDecisionNode: nodeId, // Asegurar que estos también estén
                      conditionId: conditionObj.id // Asegurar que estos también estén
                      },
                      position: optionPosition,
                    }
                  : node
                );
              }

              const edgeId = `edge-${nodeId}-${sourceHandleId}-to-${existingNode.id}`;
              let existingEdge = updatedEdges.find(e => e.id === edgeId);
              if (!existingEdge) { 
                existingEdge = updatedEdges.find(e => e.source === nodeId && e.target === existingNode.id && e.sourceHandle === sourceHandleId);
              }
              
              if (existingEdge) {
                const edgeNeedsUpdate = existingEdge.animated !== !(decisionNode.data.isUltraPerformanceMode || state.isUltraMode || false); // state.isUltraModeGlobal no existe, usar state.isUltraMode
                if (edgeNeedsUpdate) {
                  updatedEdges = updatedEdges.map(e => e.id === existingEdge.id ? { ...e, animated: !(decisionNode.data.isUltraPerformanceMode || state.isUltraMode || false) } : e);
                }
              } else {
                console.log(`[generateOptionNodes ${nodeId}] Edge for existing OptionNode ${existingNode.id} not found. Attempting to create.`);
                const newEdgeParams = {
                  id: edgeId,
                  source: nodeId,
                  target: existingNode.id,
                  sourceHandle: sourceHandleId,
                  targetHandle: 'target', // Asumimos 'target' como ID del handle de destino del OptionNode
                  type: 'elite-edge',
                  animated: !(decisionNode.data.isUltraPerformanceMode || state.isUltraMode || false),
                };
                const previousEdgesLength = updatedEdges.length;
                updatedEdges = addEdge(newEdgeParams, updatedEdges);
                console.log(`[generateOptionNodes ${nodeId}] Edge for existing OptionNode ${existingNode.id}. Prev Edges: ${previousEdgesLength}, New Edges: ${updatedEdges.length}. Edge Added: ${updatedEdges.length > previousEdgesLength}`, newEdgeParams);
              }

            } else { // Crear nuevo OptionNode
          const newOptionNodeId = conditionObj.optionNodeId || generateNodeId('option');

          const newOptionNode = {
            id: newOptionNodeId,
            type: NODE_TYPES.option,
            position: optionPosition,
            data: {
                label: conditionObj.text,
                sourceNode: nodeId,
                sourceConditionId: conditionObj.id,
                conditionIndex: index,
                parentHandleColor: getConnectorColor(conditionObj.text, index),
                isUltraPerformanceMode: decisionNode.data.isUltraPerformanceMode || false,
                    sourceDecisionNode: nodeId,
                    conditionId: conditionObj.id
                },
                draggable: true,
                selectable: true,
                connectable: true,
              };
              updatedNodes.push(newOptionNode);
              console.log(`[generateOptionNodes ${nodeId}] Created NEW OptionNode ${newOptionNodeId}:`, JSON.stringify(newOptionNode.data));

              const newEdgeParams = {
                id: `edge-${nodeId}-${sourceHandleId}-to-${newOptionNodeId}`,
                source: nodeId,
                target: newOptionNodeId,
                sourceHandle: sourceHandleId,
                targetHandle: 'target', // Asumimos 'target'
                type: 'elite-edge',
                animated: !(decisionNode.data.isUltraPerformanceMode || state.isUltraMode || false), // Consistencia con otras aristas
              };
              console.log(`[generateOptionNodes ${nodeId}] Attempting to create NEW edge for new OptionNode ${newOptionNodeId}:`, JSON.stringify(newEdgeParams));
              const previousEdgesLength = updatedEdges.length;
              updatedEdges = addEdge(newEdgeParams, updatedEdges);
              console.log(`[generateOptionNodes ${nodeId}] NEW edge for new OptionNode ${newOptionNodeId}. Prev Edges: ${previousEdgesLength}, New Edges: ${updatedEdges.length}. Edge Added: ${updatedEdges.length > previousEdgesLength}`);
              
              // Actualizar la condición en el DecisionNode para que apunte a este nuevo OptionNode.
              // Esta lógica ya estaba y es correcta.
              if (!conditionObj.optionNodeId || conditionObj.optionNodeId !== newOptionNodeId) {
            const decisionNodeInUpdatedArray = updatedNodes.find(n => n.id === nodeId); // Buscar en el array que estamos modificando
            if (decisionNodeInUpdatedArray) {
                const updatedNodeConditions = decisionNodeInUpdatedArray.data.conditions.map(cond => 
                  cond.id === conditionObj.id ? { ...cond, optionNodeId: newOptionNodeId } : cond
                );
                // Actualizar el nodo DecisionNode dentro de updatedNodes
                updatedNodes = updatedNodes.map(n => 
                  n.id === nodeId ? { ...n, data: { ...n.data, conditions: updatedNodeConditions } } : n
                );
            }
          }
        }
      });

          const currentConditionOptionNodeIds = conditions.map(c => c.optionNodeId).filter(Boolean);
          
          const optionNodesToRemove = state.nodes.filter(n =>
            n.type === NODE_TYPES.option && 
            n.data && 
            n.data.sourceNode === nodeId && 
            !currentConditionOptionNodeIds.includes(n.id) 
          );

          if (optionNodesToRemove.length > 0) {
            const optionNodeIdsToRemove = optionNodesToRemove.map(n => n.id);
            console.log(`[generateOptionNodes ${nodeId}] Removing ${optionNodesToRemove.length} orphan OptionNodes:`, optionNodeIdsToRemove);
            updatedNodes = updatedNodes.filter(n => !optionNodeIdsToRemove.includes(n.id));
            updatedEdges = updatedEdges.filter(e => 
              !(optionNodeIdsToRemove.includes(e.target) && e.source === nodeId) && 
              !(optionNodeIdsToRemove.includes(e.source)) 
            );
          }
          
          // Comprobación de cambios más robusta para evitar re-renders innecesarios
          const nodesChanged = state.nodes.length !== updatedNodes.length || 
                             !state.nodes.every((node, index) => {
                               if (index >= updatedNodes.length) return false; // Longitudes diferentes
                               // Comparación más profunda si es necesario, por ahora JSON.stringify es un proxy
                               return JSON.stringify(node) === JSON.stringify(updatedNodes[index]);
                             });
          const edgesChanged = state.edges.length !== updatedEdges.length ||
                             !state.edges.every((edge, index) => {
                               if (index >= updatedEdges.length) return false;
                               return JSON.stringify(edge) === JSON.stringify(updatedEdges[index]);
                             });


          // console.log(`[generateOptionNodes ${nodeId}] FINAL CHECK before commit: state.nodes.length=${state.nodes.length}, updatedNodes.length=${updatedNodes.length}`);
          // console.log(`[generateOptionNodes ${nodeId}] FINAL CHECK before commit: state.edges.length=${state.edges.length}, updatedEdges.length=${updatedEdges.length}`);
          // console.log(`[generateOptionNodes ${nodeId}] FINAL updatedEdges to commit:`, JSON.stringify(updatedEdges.map(e => ({id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle}))));

          if (nodesChanged || edgesChanged) {
            console.log(`[generateOptionNodes ${nodeId}] Committing changes. Nodes count: ${updatedNodes.length}, Edges count: ${updatedEdges.length}`);
            return { ...state, nodes: updatedNodes, edges: updatedEdges, lastNodeIdUpdated: nodeId, timestamp: Date.now() };
          } else {
            console.log(`[generateOptionNodes ${nodeId}] No effective changes to commit to state.`);
            return state; // Explicitly return current state if no changes
          }
      
      console.log(`[generateOptionNodes EXIT ${nodeId}] Final counts - Nodes:`, updatedNodes.length, 'Edges:', updatedEdges.length);
      return state; 
    });

  },
      updateStartNodeHandlePosition: (nodeId, position) => {
        const { updateNode } = get();
        updateNode(nodeId, { handlePosition: position });
      },

      toggleStartNodeFeature: (nodeId, featureName, enabled) => {
        const { updateNode } = get();
        const node = get().nodes.find(n => n.id === nodeId);
        if (node && node.data) {
          updateNode(nodeId, { [featureName]: enabled });
        }
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
        console.log('[FlowStore onConnect] Iniciando onConnect. Parámetros de conexión:', JSON.stringify(connection, null, 2)); // LOG 1

        const { nodes, edges } = get();
        
        // Evitar conexiones duplicadas o auto-conexiones
        const isDuplicate = edges.some(
          e => e.source === connection.source && e.target === connection.target && e.sourceHandle === connection.sourceHandle && e.targetHandle === connection.targetHandle
        );
        
        const isSelfConnection = connection.source === connection.target;
        
        if (isDuplicate || isSelfConnection) {
          console.warn('[FlowStore onConnect] Conexión no permitida:', 
            isDuplicate ? 'Duplicada' : 'Auto-conexión',
            'Conexión problemática:', JSON.stringify(connection, null, 2)
          );
          return;
        }
        
        // Personalizar la arista según el tipo de nodos conectados
        const sourceNode = nodes.find(n => n.id === connection.source);
        const targetNode = nodes.find(n => n.id === connection.target);
        
        if (!sourceNode || !targetNode) {
          console.error('[FlowStore onConnect] No se encontró sourceNode o targetNode. Source:', connection.source, 'Target:', connection.target); // LOG 2
          return;
        }

        // --- INICIO LÓGICA MEJORADA PARA CONEXIONES DECISIONNODE-OPTIONNODE ---
        let isAutoManagedConnectionAttempt = false;
        let useCanonicalId = null;

        if (
          sourceNode.type === NODE_TYPES.decision &&
          targetNode.type === NODE_TYPES.option &&
          targetNode.data?.sourceNode === sourceNode.id &&
          connection.sourceHandle &&
          targetNode.data?.sourceConditionId &&
          connection.sourceHandle === `output-${targetNode.data.sourceConditionId}`
        ) {
          isAutoManagedConnectionAttempt = true;
          const canonicalEdgeId = `edge-${sourceNode.id}-${connection.sourceHandle}-to-${targetNode.id}`;
          const existingCanonicalEdge = edges.find(e => e.id === canonicalEdgeId);

          if (existingCanonicalEdge) {
            console.log(`[FlowStore onConnect] Intento de conexión manual para una arista ya gestionada automáticamente (ID: ${canonicalEdgeId}). Conexión ignorada.`);
            return; // Prevenir la adición de una nueva arista
          } else {
            console.warn(`[FlowStore onConnect] La arista gestionada automáticamente (ID: ${canonicalEdgeId}) faltaba. Se creará ahora mediante conexión manual usando el ID canónico.`);
            useCanonicalId = canonicalEdgeId;
            // Pre-configurar propiedades en el objeto 'connection' para que 'customConnection' las herede
            connection.id = canonicalEdgeId;
            connection.type = 'elite-edge'; // Asegurar tipo elite-edge
            connection.animated = !(sourceNode.data.isUltraPerformanceMode || get().isUltraPerformanceModeGlobal || false);
            connection.targetHandle = null; // Asegurar targetHandle null para consistencia con generateOptionNodes
            connection.data = {
              ...(connection.data || {}),
              plubotId: get().plubotId,
              sourceType: sourceNode.type,
              targetType: targetNode.type,
            };
          }
        }
        // --- FIN LÓGICA MEJORADA ---
        
        // Evitar conexiones duplicadas o auto-conexiones (lógica original, útil para otros casos)
        const isDuplicateAfterCheck = !useCanonicalId && edges.some(
          e => e.source === connection.source && e.target === connection.target && e.sourceHandle === connection.sourceHandle && e.targetHandle === (useCanonicalId ? null : connection.targetHandle) // Considerar targetHandle null para canónicas
        );
        
        const isSelfConnectionAfterCheck = connection.source === connection.target;
        
        if (isDuplicateAfterCheck || isSelfConnectionAfterCheck) {
          console.warn('[FlowStore onConnect] Conexión no permitida:', 
            isDuplicateAfterCheck ? 'Duplicada' : 'Auto-conexión',
            'Conexión problemática:', JSON.stringify(connection, null, 2)
          );
          return;
        }
        
        // Personalizar la arista según el tipo de nodos conectados
        const customConnection = {
          ...connection, // Hereda ID, type, animated, data, targetHandle si fueron pre-configurados
          id: useCanonicalId || connection.id || `e-${connection.source}${connection.sourceHandle || ''}-${connection.target}${connection.targetHandle || ''}-${Math.random().toString(36).substring(2, 9)}`,
          type: 'elite-edge', // Forzar siempre elite-edge aquí
          animated: typeof connection.animated !== 'undefined' ? connection.animated : !(sourceNode.data.isUltraPerformanceMode || get().isUltraPerformanceModeGlobal || false),
          style: { stroke: EDGE_COLORS.default, strokeWidth: 2 }, // Estilo base, ajustar si EDGE_COLORS.defaultStyle existe
          targetHandle: useCanonicalId ? null : connection.targetHandle, // Asegurar targetHandle si es canónica
          data: {
            ...(connection.data || {}),
            sourceType: sourceNode.type,
            targetType: targetNode.type,
            plubotId: get().plubotId, // Asegurar plubotId
          },
        };
        
        console.log('[FlowStore onConnect] Arista personalizada creada (customConnection):', JSON.stringify(customConnection, null, 2)); // LOG 3

        set(state => {
          const newEdges = addEdge(customConnection, state.edges);
          console.log('[FlowStore onConnect] Intentando actualizar estado. Número de aristas antes:', state.edges.length, 'Número de aristas después:', newEdges.length); // LOG 4
          if (newEdges.length === state.edges.length && state.edges.every(e => e.id !== customConnection.id)) {
            console.warn('[FlowStore onConnect] addEdge no añadió la arista. ¿Quizás ya existe una arista que conecta los mismos handles o es inválida para addEdge? Arista:', JSON.stringify(customConnection, null, 2));
            console.warn('[FlowStore onConnect] Aristas existentes:', JSON.stringify(state.edges.map(e => ({id: e.id, s:e.source,sh:e.sourceHandle,t:e.target,th:e.targetHandle})), null, 2));
          }
          return {
            ...state, // Asegurar que el resto del estado se mantiene
            edges: newEdges,
            history: {
              ...state.history,
              past: [...(state.history.past || []), { nodes: state.nodes, edges: state.edges, viewport: state.viewport }],
              future: [],
            },
            hasChanges: true,
          };
        });
        console.log('[FlowStore onConnect] Finalizado onConnect para:', JSON.stringify(connection, null, 2)); // LOG 5
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
      setEdges: async (newEdgesInput) => { 
        let resolvedEdges = newEdgesInput; 

        try {
          console.log('[FlowStore setEdges] Attempting to set edges. Received (raw):', newEdgesInput);

          // Check if newEdgesInput is a Promise and await it
          if (newEdgesInput && typeof newEdgesInput.then === 'function') {
            console.log('[FlowStore setEdges] Input is a Promise, awaiting it...');
            resolvedEdges = await newEdgesInput;
            console.log('[FlowStore setEdges] Promise resolved to (type, isArray, length):', typeof resolvedEdges, Array.isArray(resolvedEdges), resolvedEdges?.length);
          }

          if (resolvedEdges !== undefined && resolvedEdges !== null) {
            // Log solo una porción si es muy largo para evitar sobrecargar la consola
            const loggableEdges = JSON.stringify(resolvedEdges);
            console.log('[FlowStore setEdges] Setting edges (stringified, first 200 chars):', loggableEdges.substring(0, 200) + (loggableEdges.length > 200 ? '...' : ''));
          } else {
            console.log('[FlowStore setEdges] Resolved to undefined or null for newEdges.');
          }
        } catch (e) {
          console.error('[FlowStore setEdges] Error during logging or resolving newEdgesInput:', e, '\nRaw newEdgesInput:', newEdgesInput);
          // If awaiting the promise failed, or logging failed.
          // Ensure resolvedEdges is an array for the next step, or an empty one if resolution failed badly.
          if (!(Array.isArray(resolvedEdges))) {
            console.warn('[FlowStore setEdges] Fallback: resolvedEdges is not an array after potential await/error. Setting to empty array to prevent crashes.');
            resolvedEdges = [];
          }
        }

        set((state) => {
          // Ensure resolvedEdges is always an array for safety, though it should be by now.
          const validatedEdges = Array.isArray(resolvedEdges) ? resolvedEdges : [];
          
          const processedEdges = validatedEdges.map(edge => ({
            ...edge,
            type: edge.type || EDGE_TYPES.ELITE_EDGE, // Default to EliteEdge if type is missing
            animated: edge.animated !== undefined ? edge.animated : (edge.type !== EDGE_TYPES.PLACEHOLDER), // Default animated unless placeholder
            style: edge.style || { stroke: EDGE_COLORS.default, strokeWidth: 2 }, // Default style
          }));
          
          if (JSON.stringify(state.edges) === JSON.stringify(processedEdges)) {
            // console.log('[FlowStore setEdges] No actual change in edges, skipping state update to prevent unnecessary re-renders.');
            return state; // No change, return current state
          }

          // Push current state to history if edges actually changed
          const newHistoryPast = state.history.past || [];
          if (newHistoryPast.length === 0 || 
              (JSON.stringify(newHistoryPast[newHistoryPast.length - 1].edges) !== JSON.stringify(state.edges) || 
               JSON.stringify(newHistoryPast[newHistoryPast.length - 1].nodes) !== JSON.stringify(state.nodes))) {
            newHistoryPast.push({ nodes: [...state.nodes], edges: [...state.edges], viewport: state.viewport });
          }
          
          return {
            ...state,
            edges: processedEdges,
            history: {
              ...state.history,
              past: newHistoryPast.slice(-MAX_HISTORY_LENGTH), // Limit history size
              future: [], // Clear future on new change
            },
            isUndoing: false,
            isRedoing: false,
            hasChanges: true, // Mark that there are changes
          };
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
      
      // Sistema de respaldo
      backupState: (plubotId, nodes, edges) => {
        if (!plubotId) return;
        
        try {
          const backupData = { nodes, edges, timestamp: Date.now() };
          localStorage.setItem(`plubot-backup-${plubotId}`, JSON.stringify(backupData));
        } catch (e) {
          console.error('[FlowStore] Error al crear respaldo local:', e);
        }
      },
      
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
      undo: () => {
        const { history } = get();
        const { past, future } = history;
        if (past.length === 0) return;
        
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
      },
      
      redo: () => {
        const { history } = get();
        const { future } = history;
        if (future.length === 0) return;
        
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
              history: { undoStack: [], redoStack: [], maxHistory: 50 },
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
                  history: { undoStack: [], redoStack: [], maxHistory: 50 },
                  selectedNode: null,
                  selectedEdge: null,
                  hasChanges: false,
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
              history: { undoStack: [], redoStack: [], maxHistory: 50 },
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
            history: { undoStack: [], redoStack: [], maxHistory: 50 },
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
              history: { undoStack: [], redoStack: [], maxHistory: 50 }, // Resetear historial
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
              history: { undoStack: [], redoStack: [], maxHistory: 50 },
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
            history: { undoStack: [], redoStack: [], maxHistory: MAX_HISTORY_LENGTH },
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

export default useFlowStore;
