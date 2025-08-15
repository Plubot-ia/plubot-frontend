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

/**
 * Verifica si un handle es inválido
 * @param {*} handle - Handle a verificar
 * @returns {boolean} True si el handle es inválido
 */
function _isInvalidHandle(handle) {
  // Detectar handles undefined (valor JavaScript), null, y cadenas inválidas
  return (
    handle === null ||
    handle === undefined ||
    handle === 'undefined' ||
    handle === 'null' ||
    handle === ''
  );
}

/**
 * Verifica si un nodo requiere arista eliteEdge
 * @param {string} nodeType - Tipo del nodo
 * @returns {boolean} True si requiere eliteEdge
 */
function _requiresEliteEdge(nodeType) {
  return nodeType === 'decision' || nodeType === 'option';
}

/**
 * Sanitiza una arista eliminando handles inválidos y forzando tipos apropiados
 * @param {Object} edge - Arista a sanitizar
 * @param {Map} nodeTypes - Mapa de tipos de nodos por ID
 * @returns {Object} Arista sanitizada
 */
function _sanitizeEdgeInStore(edge, nodeTypes) {
  const newEdge = { ...edge };

  // REGLA CLAVE: Eliminar handles inválidos en todas sus formas.
  if (_isInvalidHandle(edge.sourceHandle)) {
    delete newEdge.sourceHandle;
  }
  if (_isInvalidHandle(edge.targetHandle)) {
    delete newEdge.targetHandle;
  }

  // REGLA DE TIPO: Forzar 'eliteEdge' para nodos complejos.
  const sourceType = nodeTypes.get(edge.source);
  const targetType = nodeTypes.get(edge.target);
  if (_requiresEliteEdge(sourceType) || _requiresEliteEdge(targetType)) {
    newEdge.type = 'eliteEdge';
  }

  return newEdge;
}

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
const _sanitizeFlowState = (flowData) => {
  if (!flowData || typeof flowData !== 'object') {
    return { nodes: [], edges: [] };
  }

  const sanitizedNodes = (flowData.nodes ?? []).map((node) =>
    createSanitizedObject(node, ALLOWED_NODE_PROPERTIES),
  );

  const sanitizedEdges = (flowData.edges ?? []).map((edge) =>
    createSanitizedObject(edge, ALLOWED_EDGE_PROPERTIES),
  );

  return {
    ...flowData,
    nodes: sanitizedNodes,
    edges: sanitizedEdges,
  };
};

const _MAX_HISTORY_LENGTH = 50;

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
          nodeCount: 0, // Resetear contador de nodos
          edgeCount: 0, // Resetear contador de edges
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
        Object.fromEntries(Object.entries(state).filter(([key]) => PERSISTED_KEYS.includes(key))),
      merge: (persistedState, currentState) => {
        // Primero, una sanitización básica para filtrar propiedades no deseadas.
        const basicSanitizedState = createSanitizedObject(persistedState, PERSISTED_KEYS);

        // Ahora, la sanitización profunda y específica para las aristas.
        if (basicSanitizedState.edges && Array.isArray(basicSanitizedState.edges)) {
          const nodeTypes = new Map(
            (basicSanitizedState.nodes ?? []).map((node) => [node.id, node.type]),
          );

          basicSanitizedState.edges = basicSanitizedState.edges.map((edge) =>
            _sanitizeEdgeInStore(edge, nodeTypes),
          );
        }

        // SINCRONIZACIÓN CRÍTICA: Inicializar contadores basados en el estado hidratado
        if (basicSanitizedState.nodes && Array.isArray(basicSanitizedState.nodes)) {
          const visibleNodeCount = basicSanitizedState.nodes.filter(
            (n) => !n.hidden && !n.deleted,
          ).length;
          basicSanitizedState.nodeCount = visibleNodeCount;
        }

        if (basicSanitizedState.edges && Array.isArray(basicSanitizedState.edges)) {
          try {
            const visibleEdgeCount = basicSanitizedState.edges.filter(
              (edge) => !edge.hidden && !edge.deleted,
            ).length;
            basicSanitizedState.edgeCount = visibleEdgeCount;
          } catch {
            // Error calculating edge count - continue without it
          }
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

export const useNode = (id) => useFlowStore((state) => state.nodes.find((node) => node.id === id));

export const useEdge = (id) => useFlowStore((state) => state.edges.find((edge) => edge.id === id));

export const useConnectedEdges = (nodeId) =>
  useFlowStore((state) =>
    state.edges.filter((edge) => edge.source === nodeId || edge.target === nodeId),
  );

export const useSelectedNode = () => {
  const selectedId = useFlowStore((s) => s.selectedNode);
  return useFlowStore((s) => s.nodes.find((n) => n.id === selectedId));
};

export const useIsNodeSelected = (nodeId) => useFlowStore((s) => s.selectedNode === nodeId);

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

// ========================================
// SELECTORES GRANULARES OPTIMIZADOS
// ========================================
// Estos selectores solo acceden a los contadores dedicados, no a los arrays completos
// Esto previene re-renders innecesarios cuando cambian las posiciones de los nodos

/**
 * Hook optimizado para obtener solo el contador de nodos visibles
 * NO causa re-renders al mover nodos, solo al agregar/eliminar
 */
export const useNodeCount = () => useFlowStore((state) => state.nodeCount || 0);

/**
 * Hook optimizado para obtener solo el contador de edges visibles
 * NO causa re-renders al mover nodos, solo al agregar/eliminar edges
 */
export const useEdgeCount = () => useFlowStore((state) => state.edgeCount || 0);

/**
 * Hook combinado para obtener ambos contadores de forma optimizada
 * Usa shallow comparison para evitar re-renders innecesarios
 */
export const useNodeEdgeCountsOptimized = () => {
  return useFlowStore(
    (state) => ({
      nodeCount: state.nodeCount || 0,
      edgeCount: state.edgeCount || 0,
    }),
    // Comparación superficial: solo re-renderiza si cambian los contadores
    (previous, next) =>
      previous.nodeCount === next.nodeCount && previous.edgeCount === next.edgeCount,
  );
};

export default useFlowStore;
