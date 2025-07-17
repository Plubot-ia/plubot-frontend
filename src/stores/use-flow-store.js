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
 * @property {(changes: EdgeChange[]) => void} onEdgesChange
 */

/**
 * @typedef {FlowState & FlowActions} FlowStore
 */

import { persist } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { createWithEqualityFn } from 'zustand/traditional';

import { toggleUltraMode as toggleUltraModeManager } from '@/components/onboarding/flow-editor/ui/UltraModeManager';

import { createSanitizedObject } from '../utils/object-sanitizer';

import customZustandStorage from './customZustandStorage';
import { createEdgeSlice } from './slices/edgeSlice';
import { historySlice } from './slices/historySlice';
import { createNodeSlice } from './slices/nodeSlice';
import { createPersistenceSlice } from './slices/persistenceSlice';
import { createUISlice } from './slices/uiSlice';

const noop = () => {
  /* no-op */
};

const PERSISTED_KEYS = [
  'nodes',
  'edges',
  'viewport',
  'flowName',
  'plubotId',
  'isUltraMode',
  'history',
];

// Allowlisted properties for sanitizing flow data loaded from the server
const ALLOWED_NODE_PROPERTIES = [
  'id',
  'type',
  'position',
  'data',
  'width',
  'height',
  'selected',
  'dragging',
  'positionAbsolute',
];
const ALLOWED_EDGE_PROPERTIES = [
  'id',
  'source',
  'target',
  'type',
  'data',
  'label',
  'markerEnd',
  'markerStart',
  'animated',
  'style',
  'selected',
];

/**
 * Sanitizes the entire flow state, especially data coming from a server or storage.
 * @param {object} flowData The raw flow data to sanitize.
 * @returns {object} A sanitized flow data object.
 */
const sanitizeFlowState = (flowData) => {
  if (!flowData || typeof flowData !== 'object') {
    return { nodes: [], edges: [] };
  }

  const sanitizedNodes = (flowData.nodes || []).map((node) =>
    createSanitizedObject(node, ALLOWED_NODE_PROPERTIES),
  );

  const sanitizedEdges = (flowData.edges || []).map((edge) =>
    createSanitizedObject(edge, ALLOWED_EDGE_PROPERTIES),
  );

  return {
    ...flowData,
    nodes: sanitizedNodes,
    edges: sanitizedEdges,
  };
};

const MAX_HISTORY_LENGTH = 50;

const useFlowStore = createWithEqualityFn(
  persist(
    (set, get) => ({
      ...createEdgeSlice(set, get),
      ...createNodeSlice(set, get),
      ...createUISlice(set, get),
      ...historySlice(set, get),
      ...createPersistenceSlice(set, get),

      // Acción para resetear completamente el estado del flujo.
      // Esencial para limpiar el canvas al cambiar de plubot o crear uno nuevo.
      resetFlow: (plubotId, flowName) => {
        get().clearHistory(); // Limpia el historial de acciones
        set({
          nodes: [],
          edges: [],
          viewport: { x: 0, y: 0, zoom: 1 },
          flowName: flowName || 'Flujo sin título',
          plubotId,
          isLoaded: true, // Se considera cargado después de un reseteo
          loadError: false,
          hasChanges: false,
          selectedNode: undefined,
          selectedEdge: undefined,
        });
      },
    }),
    {
      name: 'plubot-flow-storage-v5',
      storage: customZustandStorage,
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) => PERSISTED_KEYS.includes(key)),
        ),
      merge: (persistedState, currentState) => {
        // Primero, una sanitización básica para filtrar propiedades no deseadas.
        const basicSanitizedState = createSanitizedObject(
          persistedState,
          PERSISTED_KEYS,
        );

        // Ahora, la sanitización profunda y específica para las aristas.
        if (
          basicSanitizedState.edges &&
          Array.isArray(basicSanitizedState.edges)
        ) {
          const nodeTypes = new Map(
            (basicSanitizedState.nodes || []).map((node) => [
              node.id,
              node.type,
            ]),
          );

          basicSanitizedState.edges = basicSanitizedState.edges.map((edge) => {
            const newEdge = { ...edge };
            // REGLA CLAVE: Eliminar handles inválidos en todas sus formas.
            if (
              edge.sourceHandle === null ||
              edge.sourceHandle === 'undefined' ||
              edge.sourceHandle === 'null'
            ) {
              delete newEdge.sourceHandle;
            }
            if (
              edge.targetHandle === null ||
              edge.targetHandle === 'undefined' ||
              edge.targetHandle === 'null'
            ) {
              delete newEdge.targetHandle;
            }

            // REGLA DE TIPO: Forzar 'eliteEdge' para nodos complejos.
            const sourceType = nodeTypes.get(edge.source);
            const targetType = nodeTypes.get(edge.target);
            if (
              sourceType === 'decision' ||
              targetType === 'decision' ||
              sourceType === 'option' ||
              targetType === 'option'
            ) {
              newEdge.type = 'eliteEdge';
            }
            return newEdge;
          });
        }

        return { ...currentState, ...basicSanitizedState };
      },
      onFinishHydration: () => {
        const { isUltraMode } = useFlowStore.getState();
        toggleUltraModeManager(isUltraMode, false);
      },
    },
  ),
  shallow,
);

// =================================================================================================
// SELECTORS
// =================================================================================================

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

export const useSelectedNode = () => {
  const selectedId = useFlowStore((s) => s.selectedNode);
  return useFlowStore((s) => s.nodes.find((n) => n.id === selectedId));
};

export const useIsNodeSelected = (nodeId) =>
  useFlowStore((s) => s.selectedNode === nodeId);

export const useNodeData = (id) => {
  return useFlowStore((state) => {
    const node = state.nodes.find((n) => n.id === id);
    return node ? node.data : undefined;
  }, shallow);
};

export const useDecisionNodeActions = () => {
  return useFlowStore(
    (state) => ({
      updateDecisionNodeQuestion: state.updateDecisionNodeQuestion,
      addDecisionNodeCondition: state.addDecisionNodeCondition,
      updateDecisionNodeConditionText: state.updateDecisionNodeConditionText,
      deleteDecisionNodeCondition: state.deleteDecisionNodeCondition,
      // NOTA: Las siguientes acciones no están implementadas aún, pero se mantienen por compatibilidad.
      moveDecisionNodeCondition: state.moveDecisionNodeCondition || noop,
      toggleDecisionNodeFeature: state.toggleDecisionNodeFeature || noop,
    }),
    shallow,
  );
};

export default useFlowStore;
