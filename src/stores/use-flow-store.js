/**
 * @typedef {import('reactflow').Node} Node
 * @typedef {import('reactflow').Edge} Edge
 * @typedef {import('reactflow').Viewport} Viewport
 * @typedef {import('reactflow').ReactFlowInstance} ReactFlowInstance
 * @typedef {import('reactflow').NodeChange} NodeChange
 * @typedef {import('reactflow').EdgeChange} EdgeChange
 * @typedef {import('reactflow').Connection} Connection
 */

/**
 * @typedef {object} FlowState
 * @property {ReactFlowInstance | undefined} reactFlowInstance
 * @property {Node[]} nodes
 * @property {Edge[]} edges
 * @property {Viewport} viewport
 * @property {string | undefined} selectedNode
 * @property {string | undefined} selectedEdge
 * @property {boolean} isUltraMode
 * @property {boolean} isSaving
 * @property {Date | undefined} lastSaved
 * @property {string | undefined} plubotId
 * @property {string} flowName
 * @property {boolean} isLoaded
 * @property {boolean} loadError
 * @property {boolean} isUndoing
 * @property {boolean} isRedoing
 * @property {boolean} shouldMoveToCenter
 * @property {boolean} autoArrange
 * @property {boolean} isBackupLoaded
 * @property {boolean} hasChanges
 * @property {{templateSelector: boolean, embedModal: boolean, importExportModal: boolean}} modals
 * @property {{nodes: Node[], edges: Edge[], name: string}} previousState
 * @property {{past: object[], future: object[], maxHistory: number}} history
 * @property {boolean} contextMenuVisible
 * @property {{x: number, y: number}} contextMenuPosition
 * @property {string | undefined} contextMenuNodeId
 * @property {any[]} contextMenuItems
 * @property {boolean} isNodeBeingDragged
 * @property {{FULL: number, COMPACT: number}} lodThresholds
 * @property {{FULL: number, COMPACT: number}} defaultLodThresholds
 */

/**
 * @typedef {object} FlowActions
 * @property {(plubotId: string, flowName: string, options?: object) => void} resetFlow
 * @property {(enable?: boolean, userInitiated?: boolean) => void} toggleUltraMode
 * @property {(updates: object, forceHistory?: boolean) => void} _createHistoryEntry
 * @property {(isDragging: boolean) => void} setIsNodeBeingDragged
 * @property {(instance: ReactFlowInstance) => void} setReactFlowInstance
 * @property {(thresholds: {FULL: number, COMPACT: number}) => void} setLodThresholds
 * @property {(x: number, y: number, nodeId: string, items: any[]) => void} showContextMenu
 * @property {() => void} hideContextMenu
 * @property {(changes: NodeChange[]) => void} onNodesChange
 * @property {(nodes: Node[]) => void} setNodes
 * @property {(changes: EdgeChange[]) => void} onEdgesChange
 * @property {(nodeType: string, position: {x: number, y: number}, userData?: object) => Node} _createNodeFromPalette
 * @property {(decisionNode: Node) => void} _initializeDecisionNodeWithOptions
 * @property {(nodeData: string | object, position?: {x: number, y: number}, userData?: object) => Node} addNode
 * @property {(id: string, dataToUpdate: object) => void} updateNode
 * @property {(nodeIdToDuplicate: string) => void} duplicateNode
 * @property {(nodeIdToDelete: string | string[]) => void} deleteNode
 * @property {(nodeId: string, newQuestion: string) => void} updateDecisionNodeQuestion
 */

/**
 * @typedef {FlowState & FlowActions} FlowStore
 */

import isEqual from 'fast-deep-equal';
import { debounce } from 'lodash';
import { applyNodeChanges, applyEdgeChanges, addEdge } from 'reactflow';
import { persist } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { createWithEqualityFn } from 'zustand/traditional';

// Importar componentes y servicios

import { toggleUltraMode as toggleUltraModeManager } from '@/components/onboarding/flow-editor/ui/UltraModeManager';
import { preventNodeStacking } from '@/components/onboarding/flow-editor/utils/fix-node-positions';
import { sanitizeFlowState } from '@/components/onboarding/flow-editor/utils/flow-sanitizer';
import { flowStateManager } from '@/components/onboarding/flow-editor/utils/flowCacheManager';
import {
  validateNodePositions,
  sanitizeEdgePaths,
} from '@/components/onboarding/flow-editor/utils/node-position-validator';
import {
  getConnectorColor,
  getConditionType,
} from '@/components/onboarding/nodes/decisionnode/DecisionNode.types.js';
import flowService, { generateId } from '@/services/flowService';
import logger from '@/services/loggerService';
import { NODE_TYPES, NODE_LABELS } from '@/utils/node-config.js';

import customZustandStorage from './customZustandStorage';

// Configuración para dimensiones mínimas de nodos
const NODE_CONFIG = {
  MIN_WIDTH: 150,
  MIN_HEIGHT: 100,
};

const MAX_HISTORY_LENGTH = 50; // Definir la constante para el historial

// Helper para crear metadatos de forma segura, previniendo inyección de objetos.
const createSafeMetadata = (userData) => {
  if (!userData || typeof userData !== 'object') {
    return {};
  }
  // Lista blanca de propiedades permitidas.
  const allowedProperties = new Set([
    'label',
    'description',
    'icon',
    'customData',
  ]);
  const safeMetadata = Object.create(null);

  for (const key in userData) {
    if (
      Object.prototype.hasOwnProperty.call(userData, key) &&
      allowedProperties.has(key)
    ) {
      // The key is validated by the allowlist, so this assignment is safe.
      // eslint-disable-next-line security/detect-object-injection
      safeMetadata[key] = userData[key];
    }
  }
  return safeMetadata;
};

// Importar el sistema de persistencia para respaldo adicional

// Module-level variables to manage the position validation logic (integrated from patch)
let positionValidatorInterval;
let positionValidatorObserver;

// Función para generar IDs únicos (ahora usa el servicio de flujo)
const generateNodeId = (type = 'node') => generateId(type);

// Estado inicial
const initialState = {
  reactFlowInstance: undefined, // Added for storing React Flow instance
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  selectedNode: undefined,
  selectedEdge: undefined,
  isUltraMode: false,
  isSaving: false,
  lastSaved: undefined,
  plubotId: undefined,
  flowName: 'Flujo sin título',
  isLoaded: false, // Nuevo flag para indicar si el flujo actual está cargado
  loadError: false, // Flag para rastrear errores de carga
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
    importExportModal: false,
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
  contextMenuNodeId: undefined,
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
 * Reinicia el estado del flujo con los datos proporcionados.
 * @param {object} flow - El objeto de flujo que contiene nodos, aristas, etc.
 * @param {string} plubotId - El ID del plubot asociado.
 * @param {object} [options] - Opciones adicionales para el reseteo.
 */

// Crear el store de flujo con persistencia
const useFlowStore = createWithEqualityFn(
  persist(
    /** @type {import('zustand').StateCreator<FlowStore>} */
    (set, get) => ({
      ...initialState,

      setHasChanges: (hasChanges) => set({ hasChanges }),

      resetFlow: (plubotId, flowName, options = {}) =>
        set((state) => ({
          ...state,
          present: {
            ...initialState,
            plubotId,
            flowName: flowName || initialState.flowName,
            isLoaded: !options.skipLoad,
          },
        })),

      /**
       * Activa/desactiva el modo de ultra rendimiento.
       * Esta es la ÚNICA fuente de verdad para el estado de ultra-mode.
       * Sincroniza el estado de Zustand con el gestor de DOM (UltraModeManager).
       * @param {boolean} [enable] - Si se proporciona, fuerza el estado. Si no, lo invierte.
       * @param {boolean} [userInitiated=true] - Indica si el cambio fue iniciado por el
       * usuario para guardar su preferencia.
       */
      toggleUltraMode: (enable, userInitiated = true) => {
        const currentState = get().isUltraMode;
        const newState = enable === undefined ? !currentState : enable;

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
       * Guardián del historial: única función para actualizar estado y decidir si guardar
       * en el historial.
       * @param {object} updates - Objeto con las actualizaciones de estado
       * (ej. { nodes: newNodes }).
       * @param {boolean} [forceHistory=false] - Si es true, fuerza la creación de una
       * entrada en el historial.
       */
      _createHistoryEntry: (updates) => {
        const { history } = get();

        // Optimización: no guardar si no hay cambios reales
        const lastState = history.past.at(-1);
        if (
          lastState &&
          isEqual(updates.nodes, lastState.nodes) &&
          isEqual(updates.edges, lastState.edges)
        ) {
          return; // No hay cambios detectables, no se crea entrada en el historial
        }

        set((state) => ({
          history: {
            ...state.history,
            past: [
              ...state.history.past,
              { nodes: state.nodes, edges: state.edges },
            ],
            future: [], // Un nuevo estado borra el futuro
          },
          ...updates,
        }));
      },

      // Action to set node dragging state
      setIsNodeBeingDragged: (isDragging) =>
        set({ isNodeBeingDragged: isDragging }),

      // Action to set the React Flow instance
      setReactFlowInstance: (instance) => {
        // Si la instancia ya existe, no hacemos nada para evitar re-renders innecesarios.
        if (get().reactFlowInstance) return;

        set({ reactFlowInstance: instance });

        // Iniciar la validación periódica de posiciones de nodos (lógica del patch integrada)
        if (instance) {
          // Limpiar cualquier intervalo o observador anterior
          if (positionValidatorInterval)
            clearInterval(positionValidatorInterval);
          if (positionValidatorObserver) positionValidatorObserver.disconnect();

          // Configurar un intervalo para sanitizar paths de aristas periódicamente
          positionValidatorInterval = setInterval(() => {
            if (!get().isNodeBeingDragged) {
              sanitizeEdgePaths();
            }
          }, 2000);

          // Configurar un observador para cambios en el DOM que podrían afectar las aristas
          const observer = new MutationObserver(() => {
            if (!get().isNodeBeingDragged) {
              sanitizeEdgePaths();
            }
          });

          const reactFlowElement = document.querySelector('.react-flow');
          if (reactFlowElement) {
            observer.observe(reactFlowElement, {
              childList: true,
              subtree: true,
            });
            positionValidatorObserver = observer;
          }

          // Registrar limpieza al cerrar/recargar la página
          // Usamos un listener único para evitar añadir múltiples
          if (!globalThis.cleanupAttached) {
            window.addEventListener('beforeunload', () => {
              if (positionValidatorInterval)
                clearInterval(positionValidatorInterval);
              if (positionValidatorObserver)
                positionValidatorObserver.disconnect();
            });
            globalThis.cleanupAttached = true;
          }
        }
      },

      // Acción para actualizar los umbrales de LOD dinámicamente
      setLodThresholds: (thresholds) => set({ lodThresholds: thresholds }),

      // Acciones para el menú contextual global - implementación mejorada
      showContextMenu: (x, y, nodeId, items) => {
        // Usar setTimeout para asegurar que el estado se actualice correctamente
        // Esto evita problemas de timing con ReactFlow
        setTimeout(() => {
          // La lógica de añadir/quitar listeners de clic global ahora se delega
          // que llamará a hideContextMenu a través de la prop onClose del componente.
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
          contextMenuItems: [], // Resetear a valores iniciales consistentes
          contextMenuNodeId: undefined, // Resetear el nodeId
        });
      },

      // Acciones de nodos
      // Sistema avanzado para manejo de nodos con optimización de rendimiento
      onNodesChange: (changes) => {
        const { nodes: currentNodes, _createHistoryEntry } = get();

        const isSelectionChange = changes.every((c) => c.type === 'select');
        const isDrag = changes.some((c) => c.type === 'position' && c.dragging);

        const newNodes = applyNodeChanges(changes, currentNodes);

        // Para selección o arrastre intermedio, solo actualizamos el estado sin crear historial.
        if (isSelectionChange || isDrag) {
          set({ nodes: newNodes });
          return;
        }

        // Para cambios estructurales (arrastre final, etc.), creamos una entrada de historial.
        _createHistoryEntry({
          nodes: newNodes,
          isUndoing: false,
          isRedoing: false,
        });
      },

      // Implementación de setNodes para compatibilidad con componentes, ahora con rendimiento
      // optimizado y consistencia de historial.
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
        set((state) => ({
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
        // The key 'nodeType' is validated via hasOwnProperty, making this a safe access.

        const defaultLabel = Object.prototype.hasOwnProperty.call(
          NODE_LABELS,
          nodeType,
        )
          ? // The key is validated with hasOwnProperty, making this access safe.
            // eslint-disable-next-line security/detect-object-injection
            NODE_LABELS[nodeType]
          : nodeType;

        const newNode = {
          id: nodeId,
          type: nodeType,
          position: position || {
            x: 100 + (nodes.length % 3) * 200,
            y: 100 + Math.floor(nodes.length / 3) * 150,
          },
          data: {
            id: nodeId,
            label: userData?.label || defaultLabel,
            nodeType,
            // Anidar todos los datos de usuario dentro de metadata para mantener la consistencia.
            metadata: createSafeMetadata(userData),
          },
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
        if (
          !Array.isArray(decisionNode.data.conditions) ||
          decisionNode.data.conditions.length === 0
        ) {
          decisionNode.data.conditions = [
            {
              id: generateId('condition'),
              text: 'Sí',
              condition: 'true',
              color: getConnectorColor('Sí', 0),
            },
            {
              id: generateId('condition'),
              text: 'No',
              condition: 'false',
              color: getConnectorColor('No', 1),
            },
          ];
        }

        const { conditions } = decisionNode.data;
        const isUltra = isUltraMode || decisionNode.data.isUltraPerformanceMode;

        const newOptionNodes = conditions.map((condition, index) => ({
          id: `option-${decisionNode.id}-${condition.id}`,
          type: 'option',
          position: {
            x:
              decisionNode.position.x +
              (index - (conditions.length - 1) / 2) * 250,
            y: decisionNode.position.y + 200,
          },
          data: {
            sourceNode: decisionNode.id,
            conditionId: condition.id,
            text: condition.text,
            isUltraPerformanceMode: isUltra,
            color: condition.color,
          },
        }));

        const newEdges = conditions.map((condition) => ({
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
        if (typeof nodeData === 'object' && nodeData !== undefined) {
          // Asumimos que _createNodeFromObject existe y devuelve el nodo.
          return get()._createNodeFromObject(nodeData);
        }

        // Si los datos de entrada no son válidos, no se crea ningún nodo.
        // Devolver undefined explícitamente para cumplir con la regla 'consistent-return'.
      },

      updateNode: (id, dataToUpdate) => {
        get().setNodes(
          get().nodes.map((node) => {
            if (node.id === id) {
              // Crear un nuevo nodo para asegurar la inmutabilidad y la detección de cambios.
              const newNode = {
                ...node,
                data: { ...node.data, ...dataToUpdate },
              };
              // Si se actualizan las condiciones, reasignar los source handles.
              if (dataToUpdate.conditions) {
                newNode.data.conditions = dataToUpdate.conditions.map(
                  (condition, index) => ({
                    ...condition,
                    sourceHandle: `${id}-condition-${index}`,
                  }),
                );
              }
              return newNode;
            }
            return node;
          }),
        );
      },
      duplicateNode: (nodeIdToDuplicate) => {
        const { nodes, _createHistoryEntry } = get();
        const originalNode = nodes.find(
          (node) => node.id === nodeIdToDuplicate,
        );

        if (!originalNode) {
          return;
        }

        const position = {
          x: (originalNode.position?.x || 0) + 20,
          y: (originalNode.position?.y || 0) + 20,
        };

        const newNodeId = generateId(originalNode.type || 'node');

        const originalLabel =
          originalNode.data?.label || originalNode.type || 'Nodo';

        const newNode = {
          ...originalNode,
          id: newNodeId,
          selected: false,
          dragging: false,
          position,
          data: {
            ...originalNode.data,
            label: `${originalLabel} (Copia)`,
          },
        };

        _createHistoryEntry({ nodes: [...nodes, newNode] });
      },

      /**
       * Elimina un nodo y sus aristas asociadas de forma atómica, creando una entrada
       * en el historial.
       * Esta es la única función autorizada para eliminar nodos.
       * @param {string | string[]} nodeIdToDelete - El ID o array de IDs de los nodos a eliminar.
       */
      deleteNode: (nodeIdToDelete) => {
        const { nodes, edges, _createHistoryEntry } = get();
        const idsToDelete = Array.isArray(nodeIdToDelete)
          ? nodeIdToDelete
          : [nodeIdToDelete];

        if (idsToDelete.length === 0) return;

        const nodesToDelete = new Set(idsToDelete);

        const newNodes = nodes.filter((node) => !nodesToDelete.has(node.id));
        const newEdges = edges.filter(
          (edge) =>
            !nodesToDelete.has(edge.source) && !nodesToDelete.has(edge.target),
        );

        // Si no se eliminó nada, no actualizamos el estado ni el historial.
        if (
          newNodes.length === nodes.length &&
          newEdges.length === edges.length
        ) {
          return;
        }

        _createHistoryEntry({ nodes: newNodes, edges: newEdges });

        // Limpiar selección si el nodo eliminado estaba seleccionado.
        if (nodesToDelete.has(get().selectedNode)) {
          set({ selectedNode: undefined });
        }
      },

      // Acciones específicas para DecisionNode
      updateDecisionNodeQuestion: (nodeId, newQuestion) => {
        const { updateNode } = get();
        updateNode(nodeId, { question: newQuestion });
      },

      addDecisionNodeCondition: (nodeId, newConditionText = 'Nueva Opción') => {
        set((state) => {
          const updatedNodes = state.nodes.map((node) => {
            if (node.id === nodeId && node.type === 'decision') {
              const existingConditions = node.data.conditions || [];
              const newIndex = existingConditions.length;

              // El color se determina por el índice para asegurar unicidad, no por el texto.
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
        const { nodes, generateOptionNodes } = get();

        const updatedNodes = nodes.map((node) => {
          if (node.id !== nodeId || node.type !== 'decision') {
            return node;
          }

          const updatedConditions = node.data.conditions.map((condition) => {
            if (condition.id !== conditionId) {
              return condition;
            }
            return {
              ...condition,
              text: newText,
              type: getConditionType(newText),
            };
          });

          return {
            ...node,
            data: { ...node.data, conditions: updatedConditions },
          };
        });

        set({ nodes: updatedNodes, hasChanges: true });
        generateOptionNodes(nodeId);
      },

      deleteDecisionNodeCondition: (nodeId, conditionIdToDelete) => {
        const { nodes, removeNode: storeRemoveNodeInternal } = get();
        let optionNodeIdToDelete;

        const updatedNodes = nodes.map((node) => {
          if (node.id === nodeId && node.type === NODE_TYPES.decision) {
            const oldConditions = node.data.conditions || [];
            const newConditions = oldConditions.filter(
              (condition) => condition.id !== conditionIdToDelete,
            );

            const optionNode = nodes.find(
              (n) =>
                n.type === NODE_TYPES.option &&
                n.data &&
                n.data.sourceNode === nodeId &&
                n.data.sourceConditionId === conditionIdToDelete,
            );
            if (optionNode) {
              optionNodeIdToDelete = optionNode.id;
            }

            return {
              ...node,
              data: {
                ...node.data,
                conditions: newConditions,
                handleIds: newConditions.map((cond) => `output-${cond.id}`),
              },
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
        const { nodes, _createHistoryEntry, edges } = get();
        const targetNode = nodes.find((n) => n.id === nodeId);
        if (!targetNode || !targetNode.data.conditions) return;

        const conditions = [...targetNode.data.conditions];

        const currentIndex = conditions.findIndex(
          (condition) => condition.id === conditionId,
        );
        if (currentIndex === -1) return;

        const newIndex =
          direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (newIndex < 0 || newIndex >= conditions.length) return;

        // Mover el elemento de forma segura usando splice para evitar advertencias.
        const [movedCondition] = conditions.splice(currentIndex, 1);
        conditions.splice(newIndex, 0, movedCondition);

        // Re-asignar source handles para mantener la consistencia con la nueva posición
        const updatedConditions = conditions.map((condition, index) => ({
          ...condition,
          sourceHandle: `${nodeId}-condition-${index}`,
        }));

        const updatedNodes = nodes.map((currentNode) =>
          currentNode.id === nodeId
            ? {
                ...currentNode,
                data: { ...currentNode.data, conditions: updatedConditions },
              }
            : currentNode,
        );

        _createHistoryEntry({ nodes: updatedNodes, edges });
      },

      toggleDecisionNodeFeature: (nodeId, featureName, enabled) => {
        // Whitelist of allowed features to prevent object injection vulnerabilities.
        const ALLOWED_FEATURES = ['enableMarkdown', 'enableVariables'];
        if (ALLOWED_FEATURES.includes(featureName)) {
          const { updateNode } = get();
          updateNode(nodeId, { [featureName]: enabled });
        } else {
          logger.error(
            `Security: Attempted to toggle an invalid feature: "${featureName}"`,
          );
        }
      },

      // Acciones específicas para OptionNode
      generateOptionNodes: (nodeId) => {
        set((state) => {
          const decisionNode = state.nodes.find((node) => node.id === nodeId);
          if (!decisionNode || !decisionNode.data) {
            return state;
          }

          const conditions = decisionNode.data.conditions || [];
          const isUltra =
            state.isUltraMode || decisionNode.data.isUltraPerformanceMode;

          // 1. Crear un mapa del estado deseado para nodos y aristas
          const targetOptionNodes = new Map();
          for (const condition of conditions) {
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
          }

          const targetEdges = new Map();
          for (const condition of conditions) {
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
          }

          // 2. Procesar nodos: actualizar, mantener o eliminar
          const newNodes = [];
          const existingOptionNodeIdsInState = new Set();

          for (const node of state.nodes) {
            // Si es un OptionNode del DecisionNode actual
            if (node.data?.sourceNode === nodeId) {
              existingOptionNodeIdsInState.add(node.id);
              // Si todavía existe en el estado deseado, se actualiza y se mantiene
              if (targetOptionNodes.has(node.id)) {
                const targetNodeData = targetOptionNodes.get(node.id).data;
                newNodes.push({
                  ...node,
                  data: { ...node.data, ...targetNodeData },
                });
              }
              // Si no, se elimina (no se añade a newNodes)
            } else {
              // No es un OptionNode de este DecisionNode, se mantiene
              newNodes.push(node);
            }
          }

          // 3. Añadir nodos completamente nuevos
          for (const [id, targetNode] of targetOptionNodes.entries()) {
            if (!existingOptionNodeIdsInState.has(id)) {
              const index = conditions.findIndex(
                (condition) => `option-${nodeId}-${condition.id}` === id,
              );
              const newNode = {
                ...targetNode,
                position: {
                  x:
                    decisionNode.position.x +
                    (index - (conditions.length - 1) / 2) * 250,
                  y: decisionNode.position.y + 200,
                },
              };
              newNodes.push(newNode);
            }
          }

          // 4. Procesar aristas de manera similar
          const newEdges = state.edges
            .filter((edge) => {
              // Mantener todas las aristas que NO salgan del DecisionNode actual
              if (edge.source !== nodeId) return true;
              // Mantener las aristas del DecisionNode que todavía son válidas
              return targetEdges.has(edge.id);
            })
            .map((edge) => {
              // Actualizar las aristas que se mantienen
              if (targetEdges.has(edge.id)) {
                return { ...edge, ...targetEdges.get(edge.id) };
              }
              return edge;
            });

          const existingEdgeIdsInState = new Set(
            state.edges.map((edge) => edge.id),
          );
          for (const [id, targetEdge] of targetEdges.entries()) {
            if (!existingEdgeIdsInState.has(id)) {
              newEdges.push(targetEdge);
            }
          }

          return {
            ...state,
            nodes: newNodes,
            edges: newEdges,
            hasChanges: true,
          };
        });
      },

      updateNodeData: (nodeId, data) => {
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === nodeId
              ? {
                  ...node,
                  data: { ...node.data, ...data },
                  lastUpdated: new Date().toISOString(),
                }
              : node,
          ),
          hasChanges: true,
        }));
      },

      setNodeEditing: (nodeId, isEditing) => {
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === nodeId
              ? {
                  ...node,
                  data: { ...node.data, isEditing },
                  lastUpdated: new Date().toISOString(),
                }
              : node,
          ),
          hasChanges: true,
        }));
      },

      updateOptionNodeText: (nodeId, newText, data) => {
        set((state) => {
          const { parentNodeId, conditionId } = data;

          let newNodes = state.nodes.map((node) => {
            if (node.id === nodeId) {
              const updatedData = {
                ...node.data,
                text: newText,
                lastUpdated: new Date().toISOString(),
              };
              return { ...node, data: updatedData };
            }
            return node;
          });

          if (parentNodeId && conditionId && newText !== undefined) {
            newNodes = newNodes.map((node) => {
              if (node.id === parentNodeId && node.type === 'decision') {
                const newConditions = (node.data.conditions || []).map(
                  (condition) => {
                    if (condition.id === conditionId) {
                      return { ...condition, text: newText };
                    }
                    return condition;
                  },
                );
                return {
                  ...node,
                  data: { ...node.data, conditions: newConditions },
                };
              }
              return node;
            });
          }

          return { nodes: newNodes, hasChanges: true };
        });
      },

      // Acciones específicas para ActionNode
      updateActionNodeDescription: (nodeId, description) => {
        const { updateNode } = get();
        updateNode(nodeId, { description });
      },

      updateActionNodeType: (nodeId, actionType) => {
        const { updateNode } = get();
        const node = get().nodes.find((n) => n.id === nodeId);
        if (node && node.data) {
          // Determinar parámetros predeterminados según el tipo de acción
          let defaultParameters = {};
          switch (actionType) {
            case 'sendEmail': {
              defaultParameters = {
                to: '',
                cc: '',
                subject: '',
                template: 'welcome',
                body: '',
              };
              break;
            }
            case 'saveData': {
              defaultParameters = {
                key: '',
                value: '',
                dataType: 'string',
                storage: 'session',
              };
              break;
            }
            case 'sendNotification': {
              defaultParameters = {
                message: '',
                type: 'info',
                duration: 5,
              };
              break;
            }
            case 'apiCall': {
              defaultParameters = {
                url: '',
                method: 'GET',
                headers: '',
                body: '',
              };
              break;
            }
            case 'transformData': {
              defaultParameters = {
                inputVariable: '',
                transformation: 'uppercase',
                formula: '',
                outputVariable: '',
              };
              break;
            }
            case 'conditional': {
              defaultParameters = {
                variable: '',
                operator: 'equal',
                value: '',
              };
              break;
            }
            case 'delay': {
              defaultParameters = {
                duration: 1,
                unit: 'seconds',
              };
              break;
            }
            case 'webhook': {
              defaultParameters = {
                endpoint: '',
                event: '',
                secretKey: '',
              };
              break;
            }
            default: {
              defaultParameters = {};
            }
          }

          // Mantener los parámetros actuales que coincidan con los predeterminados
          const currentParameters = node.data.parameters || {};
          const mergedParameters = { ...defaultParameters };

          // Usar una whitelist de claves predeterminadas para prevenir la inyección de objetos.
          const allowedKeys = Object.keys(defaultParameters);

          for (const key of allowedKeys) {
            if (Object.prototype.hasOwnProperty.call(currentParameters, key)) {
              // The 'key' is validated against a whitelist, making this assignment safe.
              // eslint-disable-next-line security/detect-object-injection
              mergedParameters[key] = currentParameters[key];
            }
          }

          updateNode(nodeId, {
            actionType,
            parameters: mergedParameters,
            lastModified: new Date().toISOString(),
          });
        }
      },

      updateActionNodeParameters: (nodeId, parameters) => {
        const { updateNode } = get();
        const node = get().nodes.find((n) => n.id === nodeId);
        if (node && node.data) {
          const currentParameters = node.data.parameters || {};
          updateNode(nodeId, {
            parameters: { ...currentParameters, ...parameters },
            lastModified: new Date().toISOString(),
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
        const { nodes, edges, isUltraMode, _createHistoryEntry } = get();

        // --- VALIDACIÓN CRÍTICA ---
        // Asegurarse de que los nodos de origen y destino existen en nuestro estado
        // antes de intentar crear la arista. Esto previene el warning de React Flow
        // "Couldn't create edge for source handle".
        const sourceNodeExists = nodes.some(
          (node) => node.id === connection.source,
        );
        const targetNodeExists = nodes.some(
          (node) => node.id === connection.target,
        );

        if (!sourceNodeExists || !targetNodeExists) {
          logger.warn(
            `No se encontró el nodo de origen o destino en el store.`,
            { connection },
          );
          return; // Detener la ejecución si los nodos no existen
        }

        // Asegurar que los handles de conexión siempre tengan un valor por defecto.
        const safeConnection = {
          ...connection,
          sourceHandle: connection.sourceHandle || 'output',
          targetHandle: connection.targetHandle || 'default',
        };

        const sourceNode = nodes.find(
          (node) => node.id === safeConnection.source,
        );

        // --- GUARDA DE SEGURIDAD ---
        // Previene que onConnect cree aristas desde un DecisionNode.
        if (sourceNode && sourceNode.type === NODE_TYPES.decision) {
          return;
        }

        const newEdge = {
          ...safeConnection,
          id: `e-${safeConnection.source}${safeConnection.sourceHandle || ''}-${safeConnection.target}${safeConnection.targetHandle || ''}-${generateId(
            'edge',
          )}`,
          type: 'elite',
          animated: !isUltraMode,
          style: { stroke: '#6D6D6D', strokeWidth: 2 }, // Color por defecto
          data: {
            ...safeConnection.data,
            sourceType: sourceNode?.type,
            targetType: nodes.find((node) => node.id === safeConnection.target)
              ?.type,
            plubotId: get().plubotId,
          },
        };

        const newEdges = addEdge(newEdge, edges);
        _createHistoryEntry({ nodes, edges: newEdges });
      },

      updateEdge: (id, data) => {
        set((state) => ({
          edges: state.edges.map((edge) => {
            if (edge.id === id) {
              return { ...edge, ...data };
            }
            return edge;
          }),
        }));
      },

      removeEdge: (edgeId) => {
        set((state) => ({
          edges: state.edges.filter((edge) => edge.id !== edgeId),
        }));
      },

      // Acciones de aristas
      setEdges: (newEdges) => {
        const { nodes, edges: currentEdges, _createHistoryEntry } = get();

        // Lógica mejorada para extraer aristas de forma robusta y legible.
        let edgesArray;
        if (Array.isArray(newEdges)) {
          edgesArray = newEdges;
        } else if (newEdges && Array.isArray(newEdges.edges)) {
          edgesArray = newEdges.edges;
        } else {
          edgesArray = [];
        }

        // Comparar para evitar entradas de historial innecesarias.
        if (isEqual(currentEdges, edgesArray)) {
          return;
        }

        _createHistoryEntry({ nodes, edges: edgesArray });
      },

      // Seleccionar nodos o aristas
      selectNode: (nodeId) => {
        set({
          selectedNode: nodeId,
          selectedEdge: undefined, // Deseleccionar arista si hay alguna
        });
      },

      selectEdge: (edgeId) => {
        set({
          selectedEdge: edgeId,
          selectedNode: undefined, // Deseleccionar nodo si hay alguno
        });
      },

      clearSelection: () => {
        set({
          selectedNode: undefined,
          selectedEdge: undefined,
        });
      },

      // Acción para establecer el plubotId
      setPlubotId: (id) => set({ plubotId: id }),

      // Cambio de nombre
      setFlowName: (name) => {
        set({ flowName: name });
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
        set((state) => ({ autoArrange: !state.autoArrange }));
      },

      // Setear viewport
      setViewport: (viewport) => {
        set({ viewport });
      },

      // Eliminar las aristas desconectadas
      cleanUpEdges: () => {
        const { nodes, edges, _createHistoryEntry } = get();
        const nodeIds = new Set(nodes.map((node) => node.id));

        const cleanedEdges = edges.filter(
          (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target),
        );

        if (!isEqual(edges, cleanedEdges)) {
          _createHistoryEntry({ nodes, edges: cleanedEdges });
        }
      },

      // Gestión de modales
      openModal: (modalName) => {
        if (!modalName) return;

        set((state) => ({
          modals: {
            ...state.modals,
            [modalName]: true,
          },
        }));
      },

      closeModal: (modalName) => {
        if (!modalName) return;

        set((state) => ({
          modals: {
            ...state.modals,
            [modalName]: false,
          },
        }));
      },

      // Estado de backup
      setBackupLoaded: (loaded) => set({ isBackupLoaded: loaded }),
      setHasChanges: (hasChanges) => set({ hasChanges }),

      // Sistema de respaldo con debounce para optimizar rendimiento
      backupState: debounce(
        (plubotId, nodes, edges) => {
          if (!plubotId) return;
          try {
            const backupData = { nodes, edges, timestamp: Date.now() };
            localStorage.setItem(
              `plubot-backup-${plubotId}`,
              JSON.stringify(backupData),
            );
          } catch {
            /* Silenced: Local storage can fail in private browsing mode */
          }
        },
        1000,
        { leading: false, trailing: true },
      ), // Debounce de 1 segundo

      restoreFromBackup: (plubotId) => {
        if (!plubotId) return;

        try {
          const backupJson = localStorage.getItem(`plubot-backup-${plubotId}`);
          if (!backupJson) {
            logger.warn(`No se encontró el backup con ID: ${plubotId}`);
            return;
          }
          return JSON.parse(backupJson);
        } catch {
          // Silenced error
        }
      },

      backupEdges: (plubotId, edges) => {
        if (!plubotId || !edges) return;
        try {
          localStorage.setItem(
            `plubot-edges-${plubotId}`,
            JSON.stringify(edges),
          );
        } catch {
          /* Silenced: Local storage can fail in private browsing mode */
        }
      },

      backupNodes: (plubotId, nodes) => {
        if (!plubotId || !nodes) return;
        try {
          localStorage.setItem(
            `plubot-nodes-${plubotId}`,
            JSON.stringify(nodes),
          );
        } catch {
          /* Silenced: Local storage can fail in private browsing mode */
        }
      },

      // Acciones de historial
      setHistory: (updater) => {
        set((state) => {
          const newHistory =
            typeof updater === 'function'
              ? updater(state.history)
              : { ...state.history, ...updater };
          return {
            history: { ...state.history, ...newHistory },
          };
        });
      },
      undo: () => {
        set((state) => {
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
        set((state) => {
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
            },
          });
        }, 500);
      },

      _saveFlowToServer: async (flowState) => {
        const { id: plubotId, nodes, edges, flowName } = flowState;

        if (!plubotId) {
          return;
        }

        try {
          const stateForApi = { nodes, edges, name: flowName };
          const result = await flowService.saveFlow(plubotId, stateForApi);

          set({
            isSaving: false,
            lastSaved: result.timestamp || new Date().toISOString(),
            hasChanges: false,
          });
        } catch (error) {
          logger.error(`Failed to save flow for plubotId ${plubotId}`, error);
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
          const shouldSave = flowStateManager.queueSave(
            stateToSave,
            (queuedState) => {
              get()._saveFlowToServer(queuedState);
            },
          );

          if (!shouldSave) {
            set({ isSaving: false });
          }
        } catch (error) {
          logger.error('Error queuing flow save:', error);
          set({ isSaving: false });
        }
      },

      _processAndValidateFlowData: (flowData) => {
        if (!flowData || typeof flowData !== 'object') {
          return;
        }
        // La sanitización ya ocurrió en `loadFlow`. Aquí solo validamos.
        const nodes = Array.isArray(flowData.nodes) ? flowData.nodes : [];
        const edges = Array.isArray(flowData.edges) ? flowData.edges : [];
        const viewport = flowData.viewport || initialState.viewport;

        const validatedNodes = validateNodePositions(nodes);
        const finalNodes = preventNodeStacking(validatedNodes);

        return { nodes: finalNodes, edges, viewport };
      },

      loadFlow: async (plubotId) => {
        if (!plubotId) {
          set({ isLoaded: false });
          return;
        }
        set({ isSaving: true, isLoaded: false, loadError: false });
        try {
          const flowData = await flowService.loadFlow(plubotId);
          const sanitizedData = sanitizeFlowState(
            flowData || { nodes: [], edges: [] },
          );
          const processedData =
            get()._processAndValidateFlowData(sanitizedData);

          if (processedData) {
            set({
              ...processedData,
              plubotId,
              flowName: sanitizedData.name || `Flujo de ${plubotId}`,
              isSaving: false,
              isLoaded: true,
              hasChanges: false,
              lastSaved: new Date().toISOString(),
              history: { past: [], future: [], maxHistory: MAX_HISTORY_LENGTH },
              selectedNode: undefined,
              selectedEdge: undefined,
            });

            for (const node of get().nodes) {
              if (node.type === NODE_TYPES.decision) {
                get().generateOptionNodes(node.id);
              }
            }
          } else {
            set({
              nodes: [],
              edges: [],
              flowName: `Nuevo Flujo para ${plubotId}`,
              plubotId,
              viewport: initialState.viewport,
              isSaving: false,
              isLoaded: true,
              hasChanges: false,
              lastSaved: undefined,
              history: { past: [], future: [], maxHistory: MAX_HISTORY_LENGTH },
              selectedNode: undefined,
              selectedEdge: undefined,
            });
          }
        } catch (error) {
          logger.error('Error completo al cargar el flujo:', {
            plubotId,
            error,
            stack: error ? error.stack : 'N/A',
          });
          get().resetFlow(undefined, 'Flujo sin título');
          set({
            flowName: `Error al cargar ${plubotId}`,
            plubotId,
            isLoaded: true,
            loadError: true,
          });
        }
      },
    }),
    {
      name: 'plubot-flow-storage-v5',
      storage: customZustandStorage,
      partialize: (state) => ({
        nodes: state.present.nodes,
        edges: state.present.edges,
        plubotId: state.present.plubotId,
        flowName: state.present.flowName,
        isUltraMode: state.present.isUltraMode,
        lastSaved: state.present.lastSaved,
      }),

      /**
       * Fusiona el estado persistido con el estado inicial del store.
       * Esta función es CRÍTICA para prevenir que las funciones del store
       * sean sobreescritas con `undefined` durante la rehidratación. También
       * debe ser compatible con `temporal`.
       */
      merge: (persistedState, currentState) => {
        // `persistedState` es el objeto de `partialize`.
        // `currentState` es el estado completo, incluyendo la estructura de `temporal`.
        const sanitizedState = persistedState
          ? sanitizeFlowState(persistedState)
          : {};

        // Creamos una copia del estado "presente" para no mutar el original.
        const newPresentState = { ...currentState.present };

        // Lista blanca de claves permitidas para la fusión segura.
        // Estas claves deben coincidir con las definidas en `partialize`.
        const allowedKeys = [
          'nodes',
          'edges',
          'plubotId',
          'flowName',
          'isUltraMode',
          'lastSaved',
        ];

        // Fusión segura utilizando la lista blanca de claves.
        for (const key of allowedKeys) {
          // Solo se fusionan las claves que existen en el estado sanitizado
          // y cuyo valor en el estado actual no es una función.
          if (
            Object.prototype.hasOwnProperty.call(sanitizedState, key) &&
            // La clave (`key`) proviene de una lista blanca (`allowedKeys`),
            // por lo que no hay riesgo de inyección.
            // eslint-disable-next-line security/detect-object-injection
            typeof newPresentState[key] !== 'function'
          ) {
            // La clave (`key`) proviene de una lista blanca (`allowedKeys`),
            // por lo que no hay riesgo de inyección.
            // eslint-disable-next-line security/detect-object-injection
            newPresentState[key] = sanitizedState[key];
          }
        }

        // Devolvemos el estado completo, con el `present` actualizado.
        return { ...currentState, present: newPresentState };
      },

      /**
       * Callback que se ejecuta una vez que la rehidratación ha finalizado.
       */
      onFinishHydration: () => {
        logger.info(
          'Zustand store [useFlowStore] has been successfully hydrated.',
        );
      },
    },
  ), // Fin de persist()
  shallow,
); // Fin de createWithEqualityFn()

// Selectores optimizados para el store
export const useNode = (id) =>
  useFlowStore((state) => state.nodes.find((node) => node.id === id));

export const useEdge = (id) =>
  useFlowStore((state) => state.edges.find((edge) => edge.id === id));

export const useConnectedEdges = (nodeId) =>
  useFlowStore((state) =>
    state.edges.filter(
      (edge) => edge.source === nodeId || edge.target === nodeId,
    ),
  );

export const useSelectedNode = () =>
  useFlowStore((state) =>
    state.selectedNode
      ? state.nodes.find((n) => n.id === state.selectedNode)
      : undefined,
  );

export const useIsNodeSelected = (nodeId) =>
  useFlowStore((state) => state.selectedNode === nodeId);

// Selectores granulares para optimización de rendimiento

/**
 * Hook optimizado para obtener los datos de un nodo específico.
 * Se suscribe únicamente a los cambios de ese nodo.
 * @param {string} id - El ID del nodo.
 * @returns {object|undefined} Los datos del nodo o undefined si no se encuentra.
 */
export const useNodeData = (id) => {
  return useFlowStore((state) => {
    const node = state.nodes.find((n) => n.id === id);
    return node ? node.data : undefined;
  }, shallow);
};

/**
 * Hook optimizado para obtener las acciones relacionadas con los nodos de decisión.
 * Las acciones son estables, y 'shallow' previene re-renders innecesarios.
 * @returns {object} Un objeto con todas las acciones para nodos de decisión.
 */
export const useDecisionNodeActions = () => {
  return useFlowStore(
    (state) => ({
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
    }),
    shallow,
  );
};

export default useFlowStore;
