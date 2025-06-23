import { createWithEqualityFn } from 'zustand/traditional';
import { persist, createJSONStorage } from 'zustand/middleware';

import { shallow } from 'zustand/shallow';
import isEqual from 'fast-deep-equal';
import customZustandStorage from './customZustandStorage';
import { applyNodeChanges, applyEdgeChanges, addEdge } from 'reactflow';
import { preventNodeStacking } from '../components/onboarding/flow-editor/utils/fix-node-positions';
import { debounce } from 'lodash';
import { validateNodePositions, sanitizeEdgePaths } from '../components/onboarding/flow-editor/utils/node-position-validator';
import { sanitizeFlowState } from '../components/onboarding/flow-editor/utils/flow-sanitizer';

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
  isUltraMode: false,
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

  // Umbrales de LOD para control dinámico
  lodThresholds: {
    FULL: 0.3,
    COMPACT: 0.15,
  },
  // Guardar los umbrales por defecto para poder restaurarlos
  defaultLodThresholds: {
    FULL: 0.3,
    COMPACT: 0.15,
  },
};

/**
 * Guardián del historial: única función para actualizar estado y decidir si guardar en el historial.
 * @param {object} updates - Objeto con las actualizaciones de estado (ej. { nodes: newNodes }).
 * @param {boolean} [forceHistory=false] - Si es true, fuerza la creación de una entrada en el historial.
 */
const _resetFlowAction = (set, get) => (flow, plubotId, options = {}) => {
  const { nodes, edges, viewport, name } = flow;
  const { allowResetFromLoader = false } = options;

  if (!allowResetFromLoader && get().nodes.length > 0) {
    console.warn('[preventFlowReset] Reset bloqueado para prevenir pérdida de datos.');
    return;
  }

  set(
    {
      nodes: nodes || [],
      edges: edges || [],
      viewport: viewport || null,
      flowName: name || get().flowName,
      plubotId: plubotId !== undefined ? plubotId : get().plubotId,
      isFlowLoaded: true,
      history: { past: [], future: [] },
    },
    true, // Reemplazar estado
    'resetFlow'
  );
};

const useFlowStore = createWithEqualityFn(
  persist(
    (set, get) => ({
      ...initialState,

      /**
       * Activa/desactiva el modo de ultra rendimiento.
       * Esta es la ÚNICA fuente de verdad para el estado de ultra-mode.
       * Sincroniza el estado de Zustand con el gestor de DOM (UltraModeManager).
       * @param {boolean} [enable] - Si se proporciona, fuerza el estado. Si no, lo invierte.
       * @param {boolean} [userInitiated=true] - Indica si el cambio fue iniciado por el usuario para guardar su preferencia.
       */
      toggleUltraMode: (enable, userInitiated = true) => {
        const currentState = get().isUltraMode;
        const newState = enable !== undefined ? enable : !currentState;

        if (newState === currentState) {
          return;
        }



        // Llamar al gestor del DOM para aplicar/revertir los cambios de estilo y animación.
        // El flag `userInitiated` se preserva para la lógica de guardar preferencias del usuario.
        toggleUltraModeManager(newState, userInitiated);

        // Actualizar el estado en Zustand
        set({ isUltraMode: newState });
      },

      /**
       * Guardián del historial: única función para actualizar estado y decidir si guardar en el historial.
       * @param {object} updates - Objeto con las actualizaciones de estado (ej. { nodes: newNodes }).
       * @param {boolean} [forceHistory=false] - Si es true, fuerza la creación de una entrada en el historial.
       */
      _createHistoryEntry: (updates, forceHistory = false) => {
        set(state => {
          const snapshot = {
            nodes: state.nodes,
            edges: state.edges,
            viewport: state.viewport,
          };

          // La lógica de decidir si se debe guardar o no se mueve fuera de esta función.
          // Esta función ahora SIEMPRE guarda en el historial.
          return {
            ...state,
            ...updates,
            history: {
              ...state.history,
              past: [...state.history.past, snapshot].slice(-MAX_HISTORY_LENGTH),
              future: [], // Limpiar futuro en nueva acción
            },
            hasChanges: true,
          };
        });
      },

      // Action to set node dragging state
      setIsNodeBeingDragged: (isDragging) => set({ isNodeBeingDragged: isDragging }),

      // Action to set the React Flow instance
      setReactFlowInstance: (instance) => set({ reactFlowInstance: instance }),

      // Acción para actualizar los umbrales de LOD dinámicamente
      setLodThresholds: (thresholds) => set({ lodThresholds: thresholds }),

      // Acciones para el menú contextual global - implementación mejorada
      showContextMenu: (x, y, nodeId, items) => {

        
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
        const { nodes: currentNodes, _createHistoryEntry } = get();

        const isSelectionChange = changes.every(c => c.type === 'select');
        const isDrag = changes.some(c => c.type === 'position' && c.dragging);

        const newNodes = applyNodeChanges(changes, currentNodes);

        // Para selección o arrastre intermedio, solo actualizamos el estado sin crear historial.
        if (isSelectionChange || isDrag) {
          set({ nodes: newNodes });
          return;
        }

        // Para cambios estructurales (arrastre final, eliminación, etc.), creamos una entrada de historial.
        _createHistoryEntry({
          nodes: newNodes,
          isUndoing: false,
          isRedoing: false,
        });
      },
      
      // Implementación de setNodes para compatibilidad con componentes, ahora con rendimiento optimizado y consistencia de historial.
      setNodes: (nodes) => {
        const { nodes: currentNodes, _createHistoryEntry } = get();

        // 1. Procesar y validar los nodos entrantes.
        const validatedNodes = validateNodePositions(nodes || []);
        const processedNodes = preventNodeStacking(validatedNodes);

        // 2. Comparación de alto rendimiento para evitar actualizaciones innecesarias.
        if (isEqual(currentNodes, processedNodes)) {
          return; // No hay cambios, no hacer nada.
        }

        // 3. Sanear paths de aristas en el siguiente ciclo de renderizado.
        // Esto se hace como un efecto secundario y no necesita estar en el historial.
        sanitizeEdgePaths();

        // 4. Crear una entrada de historial y actualizar el estado de forma atómica.
        _createHistoryEntry({ nodes: processedNodes });
      },
      
      // Acción para manejar cambios en las aristas
      onEdgesChange: (changes) => {
        set(state => ({
          edges: applyEdgeChanges(changes, state.edges),
          isUndoing: false,
          isRedoing: false,
          hasChanges: true,
        }));
      },
      /**
       * Crea un nodo a partir de un tipo definido en la paleta.
       * @param {string} nodeType - El tipo de nodo a crear (ej. 'decision').
       * @param {{x: number, y: number}} position - La posición del nuevo nodo.
       * @param {object} [userData] - Datos adicionales para el nodo.
       * @returns {object} El nodo recién creado.
       * @private
       */
      _createNodeFromPalette: (nodeType, position, userData) => {
        const { nodes } = get();
        const nodeId = generateNodeId(nodeType);
        const defaultLabel = NODE_LABELS[nodeType] || nodeType;

        const newNode = {
          id: nodeId,
          type: nodeType,
          position: position || { 
            x: 100 + (nodes.length % 3) * 200,
            y: 100 + Math.floor(nodes.length / 3) * 150
          },
          data: {
            id: nodeId,
            label: userData?.label || defaultLabel,
            nodeType: nodeType,
            // Anidar todos los datos de usuario dentro de metadata para mantener la consistencia.
            metadata: { ...(userData || {}) }
          }
        };

        if (newNode.type === NODE_TYPES.decision) {
          get()._initializeDecisionNodeWithOptions(newNode);
        } else {
          get()._createHistoryEntry({ nodes: [...nodes, newNode] });
        }

        return newNode;
      },

      /**
       * Inicializa un DecisionNode con sus nodos de opción y aristas por defecto de forma atómica.
       * @param {object} decisionNode - El nodo de decisión a inicializar.
       * @private
       */
      _initializeDecisionNodeWithOptions: (decisionNode) => {
        const { nodes, edges, isUltraMode, _createHistoryEntry } = get();

        // Asegurar que 'conditions' exista y tenga valores por defecto si es necesario.
        if (!Array.isArray(decisionNode.data.conditions) || decisionNode.data.conditions.length === 0) {
          decisionNode.data.conditions = [
            { id: generateId('condition'), text: 'Sí', condition: 'true', color: getConnectorColor('Sí', 0) },
            { id: generateId('condition'), text: 'No', condition: 'false', color: getConnectorColor('No', 1) },
          ];
        }

        const conditions = decisionNode.data.conditions;
        const isUltra = isUltraMode || decisionNode.data.isUltraPerformanceMode;

        const newOptionNodes = conditions.map((condition, index) => ({
          id: `option-${decisionNode.id}-${condition.id}`,
          type: 'option',
          position: { x: decisionNode.position.x + (index - (conditions.length - 1) / 2) * 250, y: decisionNode.position.y + 200 },
          data: {
            sourceNode: decisionNode.id,
            conditionId: condition.id,
            text: condition.text,
            isUltraPerformanceMode: isUltra,
            color: condition.color,
          },
        }));

        const newEdges = conditions.map(condition => ({
          id: `edge-${decisionNode.id}-${condition.id}`,
          source: decisionNode.id,
          target: `option-${decisionNode.id}-${condition.id}`,
          sourceHandle: `output-${condition.id}`,
          type: 'eliteEdge',
          animated: true,
          style: { stroke: condition.color, strokeWidth: 2 },
        }));

        const allNewNodes = [...nodes, decisionNode, ...newOptionNodes];
        const finalNodes = preventNodeStacking(allNewNodes);
        const finalEdges = [...edges, ...newEdges];

        _createHistoryEntry({ nodes: finalNodes, edges: finalEdges });
      },

      /**
       * Añade un nuevo nodo al flujo. Punto de entrada principal para la creación de nodos.
       * @param {string|object} nodeData - El tipo de nodo (string) o un objeto de nodo completo.
       * @param {{x: number, y: number}} [position] - Posición, requerida si nodeData es string.
       * @param {object} [userData] - Datos adicionales para el nodo.
       * @returns {object} El nodo principal que fue creado.
       */
      addNode: (nodeData, position, userData) => {
        // CASO 1: Creación desde un tipo de nodo (string) usando la paleta.
        if (typeof nodeData === 'string') {
          return get()._createNodeFromPalette(nodeData, position, userData);
        }

        // CASO 2: Creación desde un objeto de nodo completo.
        if (typeof nodeData === 'object' && nodeData !== null) {
          return get()._createNodeFromObject(nodeData);
        }

        return null;
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
      },

      /**
       * Elimina un nodo y sus aristas asociadas de forma atómica, creando una entrada en el historial.
       * Esta es la única función autorizada para eliminar nodos.
       * @param {string | string[]} nodeIdToDelete - El ID o un array de IDs de los nodos a eliminar.
       */
      deleteNode: (nodeIdToDelete) => {
        const { nodes, edges, _createHistoryEntry } = get();
        const idsToDelete = Array.isArray(nodeIdToDelete) ? nodeIdToDelete : [nodeIdToDelete];
        
        if (idsToDelete.length === 0) return;

        const nodesToDelete = new Set(idsToDelete);

        const newNodes = nodes.filter(n => !nodesToDelete.has(n.id));
        const newEdges = edges.filter(e => !nodesToDelete.has(e.source) && !nodesToDelete.has(e.target));

        // Si no se eliminó nada, no actualizamos el estado ni el historial.
        if (newNodes.length === nodes.length && newEdges.length === edges.length) {
          return;
        }

        _createHistoryEntry({ nodes: newNodes, edges: newEdges });

        // Limpiar selección si el nodo eliminado estaba seleccionado.
        if (nodesToDelete.has(get().selectedNode)) {
          set({ selectedNode: null });
        }
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
        // --- DEPURACIÓN Y ROBUSTEZ ---
        // Asegurar que los handles de conexión siempre tengan un valor por defecto.
        // Esto previene el error "Couldn't create edge for source handle id" si un handle es null/undefined.
        const safeConnection = {
          ...connection,
          sourceHandle: connection.sourceHandle || 'output',
          targetHandle: connection.targetHandle || 'default', // 'default' es el handle de entrada genérico
        };

        const { nodes, edges, isUltraMode, _createHistoryEntry } = get();
        const sourceNode = nodes.find(n => n.id === safeConnection.source);

        // --- GUARDA DE SEGURIDAD ---
        // Previene que onConnect cree aristas desde un DecisionNode.
        if (sourceNode && sourceNode.type === 'decision') { // Usamos 'decision' directamente por si NODE_TYPES no está disponible aquí
          return;
        }

        const newEdge = {
          ...safeConnection,
          id: `e-${safeConnection.source}${safeConnection.sourceHandle || ''}-${safeConnection.target}${safeConnection.targetHandle || ''}-${generateId('edge')}`,
          type: 'elite',
          animated: !isUltraMode,
          style: { stroke: '#6D6D6D', strokeWidth: 2 }, // Color por defecto
          data: {
            ...safeConnection.data,
            sourceType: sourceNode?.type,
            targetType: nodes.find(n => n.id === safeConnection.target)?.type,
            plubotId: get().plubotId,
          },
        };
        
        const newEdges = addEdge(newEdge, edges);
        _createHistoryEntry({ nodes, edges: newEdges }, true);
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
      setEdges: (newEdges) => {
        const { nodes, edges: currentEdges, _createHistoryEntry } = get();

        // Parche de robustez: Extraer el array de aristas si se pasa un objeto de estado parcial.
        // Esto previene crashes si una función (ej. drag-and-drop) pasa {nodes, edges} en lugar de solo las aristas.
        const edgesArray = Array.isArray(newEdges) ? newEdges : (newEdges && Array.isArray(newEdges.edges)) ? newEdges.edges : [];

        // Mantener el procesamiento de aristas para asegurar valores por defecto.
        const processedEdges = edgesArray.map(edge => ({
          ...edge,
          type: edge.type || EDGE_TYPES.ELITE_EDGE,
          animated: edge.animated !== undefined ? edge.animated : (edge.type !== EDGE_TYPES.PLACEHOLDER),
          style: edge.style || { stroke: EDGE_COLORS.default, strokeWidth: 2 },
        }));

        // Usar fast-deep-equal para una comparación de alto rendimiento.
        if (isEqual(currentEdges, processedEdges)) {
          return; // No hay cambios, no hacer nada.
        }

        // Crear una entrada de historial y actualizar el estado de forma atómica.
        // _createHistoryEntry se encarga de llamar a set() internamente.
        _createHistoryEntry({ nodes, edges: processedEdges });
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
        } catch (e) {}
      }, 1000, { leading: false, trailing: true }), // Debounce de 1 segundo
      
      restoreFromBackup: (plubotId) => {
        if (!plubotId) return null;
        
        try {
          const backupJson = localStorage.getItem(`plubot-backup-${plubotId}`);
          if (!backupJson) return null;
          
          return JSON.parse(backupJson);
        } catch (e) {
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
        set(state => {
          const { past, future } = state.history;
          if (past.length === 0) return state;

          const currentSnapshot = {
            nodes: state.nodes,
            edges: state.edges,
            viewport: state.viewport,
          };

          const newPast = [...past];
          const previousState = newPast.pop();

          return {
            ...state,
            ...previousState,
            isUndoing: true,
            history: {
              ...state.history,
              past: newPast,
              future: [currentSnapshot, ...future].slice(0, MAX_HISTORY_LENGTH),
            },
          };
        });
      },

      redo: () => {
        set(state => {
          const { past, future } = state.history;
          if (future.length === 0) return state;

          const currentSnapshot = {
            nodes: state.nodes,
            edges: state.edges,
            viewport: state.viewport,
          };

          const newFuture = [...future];
          const nextState = newFuture.shift();

          return {
            ...state,
            ...nextState,
            isRedoing: true,
            history: {
              ...state.history,
              past: [...past, currentSnapshot].slice(-MAX_HISTORY_LENGTH),
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
      
      resetFlow: _resetFlowAction(set, get),
      
      _saveFlowToServer: async (flowState) => {
        const { id: plubotId, nodes, edges, flowName } = flowState;

        if (!plubotId) {
          console.warn('Attempted to save flow without a plubotId.');
          return;
        }

        set({ isSaving: true });

        try {
          const stateForApi = { nodes, edges, name: flowName };
          const result = await flowService.saveFlow(plubotId, stateForApi);
          
          set({
            isSaving: false,
            lastSaved: result.timestamp || new Date().toISOString(),
            hasChanges: false,
          });
        } catch (error) {
          console.error('Failed to save flow:', error);
          set({ isSaving: false });
        }
      },

      saveFlow: async () => {
        if (get().isSaving) {
          return;
        }
      
        set({ isSaving: true });
      
        try {
          const { nodes, edges, flowName, plubotId } = get();
      
          if (!plubotId) {
            set({ isSaving: false });
            return;
          }
      
          const stateToSave = { nodes, edges, flowName, id: plubotId };
          const shouldSave = flowStateManager.queueSave(stateToSave, (queuedState) => {
            get()._saveFlowToServer(queuedState);
          });
      
          if (!shouldSave) {
            set({ isSaving: false });
            return;
          }
      
          return;
        } catch (error) {
          console.error("Error setting up the save operation:", error);
          set({ isSaving: false });
        }
      },

      _processAndValidateFlowData: (flowData) => {
        if (!flowData || typeof flowData !== 'object') {
          return null;
        }
        // La sanitización ya ocurrió en `loadFlow`. Aquí solo validamos.
        const nodes = Array.isArray(flowData.nodes) ? flowData.nodes : [];
        const edges = Array.isArray(flowData.edges) ? flowData.edges : [];
        const viewport = flowData.viewport || initialState.viewport;

        const validatedNodes = validateNodePositions(nodes);
        const finalNodes = preventNodeStacking(validatedNodes);

        return { nodes: finalNodes, edges: edges, viewport };
      },

      loadFlow: async (plubotId) => {
        if (!plubotId) {
          set({ isLoaded: false });
          return;
        }

        set({ isSaving: true, isLoaded: false });

        try {
          const flowDataFromApi = await flowService.loadFlow(plubotId);

          // FORTALEZA DE DOBLE CAPA: Saneamiento en la puerta de entrada de la API.
          const sanitizedData = sanitizeFlowState(flowDataFromApi || { nodes: [], edges: [] });

          const processedData = get()._processAndValidateFlowData(sanitizedData);

          if (processedData) {
            set({
              ...processedData,
              plubotId: plubotId,
              flowName: sanitizedData.name || `Flujo de ${plubotId}`,
              isSaving: false,
              isLoaded: true,
              hasChanges: false,
              lastSaved: new Date().toISOString(),
              history: { past: [], future: [], maxHistory: MAX_HISTORY_LENGTH },
              selectedNode: null,
              selectedEdge: null,
            });

            get().nodes.forEach(node => {
              if (node.type === NODE_TYPES.decision) {
                get().generateOptionNodes(node.id);
              }
            });
          } else {
            set({
              nodes: [],
              edges: [],
              flowName: `Nuevo Flujo para ${plubotId}`,
              plubotId: plubotId,
              viewport: initialState.viewport,
              isSaving: false,
              isLoaded: true,
              hasChanges: false,
              lastSaved: null,
              history: { past: [], future: [], maxHistory: MAX_HISTORY_LENGTH },
              selectedNode: null,
              selectedEdge: null,
            });
          }
        } catch (error) {
          set({
            nodes: [],
            edges: [],
            flowName: `Error al cargar ${plubotId}`,
            plubotId: plubotId,
            viewport: initialState.viewport,
            isSaving: false,
            isLoaded: true,
            hasChanges: false,
            lastSaved: null,
            history: { past: [], future: [], maxHistory: MAX_HISTORY_LENGTH },
            selectedNode: null,
            selectedEdge: null,
          });
        }
      }, // Final de la última acción: loadFlow
    }), // Cierre del objeto de acciones y de la función (set, get),
    { // Objeto de configuración para el middleware 'persist'
      name: 'flow-editor-store',
      storage: customZustandStorage,
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
      /**
       * Hook para interceptar y sanitizar el estado durante la rehidratación desde el almacenamiento.
       * Esta es la defensa principal contra datos heredados (legacy) corruptos.
       */
      merge: (persistedState, currentState) => {
        // `persistedState` es el estado recuperado del storage.
        // Lo saneamos ANTES de que se fusione con el estado actual.
        if (typeof persistedState !== 'object' || persistedState === null) {
          return currentState;
        }
        const sanitizedState = sanitizeFlowState(persistedState);

        // Fusionamos el estado actual con el estado saneado del storage.
        // El estado del storage tiene prioridad.
        return { ...currentState, ...sanitizedState };
      },
    }, // Fin del objeto de configuración de persist
  ), // Fin de persist()
  shallow
); // Fin de createWithEqualityFn()

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
