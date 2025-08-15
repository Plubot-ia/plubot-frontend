import { shallow } from 'zustand/shallow';

import useFlowStore from '@/stores/use-flow-store';
import useTrainingStore from '@/stores/use-training-store';

// --- Constantes y Fallbacks Seguros ---
// eslint-disable-next-line no-empty-function
const noop = () => {}; // Función "no operation" para acciones no disponibles.
const defaultArray = []; // Array vacío para nodos/aristas.

// --- Selectores del Store de Flujo (useFlowStore) ---

/**
 * Construye el objeto de metadatos del flujo desde el estado
 * @param {Object} state - Estado del store
 * @returns {Object} Objeto con metadatos del flujo
 */
function _buildFlowMetaData(state) {
  return {
    plubotId: state.plubotId ?? undefined,
    flowName: state.flowName ?? '',
    isLoaded: state.isLoaded ?? false,
    loadError: state.loadError ?? false,
    isUltraMode: state.isUltraMode ?? false,
    lastSaved: state.lastSaved ?? undefined,
  };
}

/**
 * Construye el objeto de acciones del flujo desde el estado
 * @param {Object} state - Estado del store
 * @returns {Object} Objeto con acciones del flujo
 */
function _buildFlowMetaActions(state) {
  return {
    setFlowName: state.setFlowName || noop,
    setPlubotId: state.setPlubotId || noop,
    resetFlow: state.resetFlow || noop,
    toggleUltraMode: state.toggleUltraMode || noop,
    getVisibleNodeCount: state.getVisibleNodeCount || (() => 0),
    saveFlow: state.saveFlow || noop,
    fitView: state.fitView || noop,
    loadFlow: state.loadFlow || noop,
  };
}

/**
 * Hook para acceder a los metadatos del flujo y acciones principales.
 * Lee todos los datos y acciones desde la raíz del estado.
 */
export const useFlowMeta = () =>
  useFlowStore(
    (state) => ({
      ..._buildFlowMetaData(state),
      ..._buildFlowMetaActions(state),
    }),
    shallow,
  );

/**
 * Construye el objeto de datos de nodos y aristas desde el estado
 * @param {Object} state - Estado del store
 * @returns {Object} Objeto con datos de nodos y aristas
 */
function _buildNodesEdgesData(state) {
  return {
    nodes: state.nodes ?? defaultArray,
    edges: state.edges ?? defaultArray,
    selectedNode: state.selectedNode ?? undefined,
    selectedEdge: state.selectedEdge ?? undefined,
  };
}

/**
 * Construye acciones básicas de nodos desde el estado
 * @param {Object} state - Estado del store
 * @returns {Object} Objeto con acciones básicas de nodos
 */
function _buildBasicNodeActions(state) {
  return {
    onNodesChange: state.onNodesChange || noop,
    setNodes: state.setNodes || noop,
    setSelectedNode: state.setSelectedNode || noop,
    removeNode: state.removeNode || noop,
  };
}

/**
 * Construye acciones de manipulación de nodos desde el estado
 * @param {Object} state - Estado del store
 * @returns {Object} Objeto con acciones de manipulación de nodos
 */
function _buildNodeManipulationActions(state) {
  return {
    duplicateDecisionNode: state.duplicateDecisionNode || noop,
    duplicateNode: state.duplicateNode || noop,
    updateNode: state.updateNode || noop,
    updateNodeData: state.updateNodeData || noop,
  };
}

/**
 * Construye acciones de aristas desde el estado
 * @param {Object} state - Estado del store
 * @returns {Object} Objeto con acciones de aristas
 */
function _buildEdgeActions(state) {
  return {
    onEdgesChange: state.onEdgesChange || noop,
    onConnect: state.onConnect || noop,
    setEdges: state.setEdges || noop,
    getVisibleEdgeCount: state.getVisibleEdgeCount || (() => 0),
    backupEdgesToLocalStorage: state.backupEdgesToLocalStorage || noop,
  };
}

/**
 * Construye el objeto de acciones de nodos y aristas desde el estado
 * @param {Object} state - Estado del store
 * @returns {Object} Objeto con acciones de nodos y aristas
 */
function _buildNodesEdgesActions(state) {
  return {
    ..._buildBasicNodeActions(state),
    ..._buildNodeManipulationActions(state),
    ..._buildEdgeActions(state),
  };
}

/**
 * Hook para acceder a los nodos, aristas y sus acciones.
 * Garantiza que nodes y edges siempre sean arrays. Lee desde la raíz del estado.
 */
export const useFlowNodesEdges = () =>
  useFlowStore(
    (state) => ({
      ..._buildNodesEdgesData(state),
      ..._buildNodesEdgesActions(state),
    }),
    shallow,
  );

/**
 * Hook para obtener el objeto completo del nodo seleccionado.
 * Devuelve `null` si no hay ningún nodo seleccionado.
 */
export const useSelectedNode = () =>
  useFlowStore((state) => state.nodes?.find((n) => n.id === state.selectedNode) ?? undefined);

/**
 * Hook para obtener el objeto `data` de un nodo específico por su ID.
 * Devuelve `null` si el nodo o sus datos no existen.
 */
export const useNodeData = (id) =>
  useFlowStore((state) => state.nodes?.find((n) => n.id === id)?.data ?? undefined);

/**
 * Hook para obtener información del nodo padre.
 * Devuelve un objeto con valores `null` si no se encuentra el padre.
 */
export const useParentNodeInfo = (id) =>
  useFlowStore((state) => {
    if (!id || !state.edges || !state.nodes) {
      return { sourceNode: undefined, parentHandleColor: undefined };
    }
    const parentEdge = state.edges.find((edge) => edge.target === id);
    if (!parentEdge) return { sourceNode: undefined, parentHandleColor: undefined };

    const parentNode = state.nodes.find((n) => n.id === parentEdge.source);
    if (!parentNode) return { sourceNode: undefined, parentHandleColor: undefined };

    return {
      sourceNode: parentNode.id,
      parentHandleColor: parentNode.data?.color ?? undefined,
    };
  }, shallow);

/**
 * Hook para gestionar el menú contextual.
 * Siempre devuelve un estado y acciones seguras.
 */
export const useContextMenu = () =>
  useFlowStore(
    (state) => ({
      contextMenuVisible: state.contextMenuVisible ?? false,
      contextMenuPosition: state.contextMenuPosition ?? { x: 0, y: 0 },
      contextMenuNodeId: state.contextMenuNodeId ?? undefined,
      contextMenuItems: state.contextMenuItems || defaultArray,
      showContextMenu: state.showContextMenu || noop,
      hideContextMenu: state.hideContextMenu || noop,
    }),
    shallow,
  );

/**
 * Hook para las acciones de deshacer y rehacer.
 */
export const useUndoRedo = () =>
  useFlowStore(
    (state) => ({
      undo: state.undo || noop,
      redo: state.redo || noop,
      canUndo: (state.past?.length ?? 0) > 0,
      canRedo: (state.future?.length ?? 0) > 0,
    }),
    shallow,
  );

// --- Selectores del Store de UI de Training (useTrainingStore) ---

/**
 * Hook para acceder a los flags de la UI.
 * Garantiza que todos los flags tengan un valor booleano por defecto.
 */
export const useUIFlags = () =>
  useTrainingStore(
    (state) => ({
      showSimulation: state.showSimulation ?? false,
      showTemplateSelector: state.showTemplateSelector ?? false,
      showExportMode: state.showExportMode ?? false,
      showConnectionEditor: state.showConnectionEditor ?? false,
      showRouteAnalysis: state.showRouteAnalysis ?? false,
      showVersionHistoryPanel: state.showVersionHistoryPanel ?? false,
      showSuggestionsModal: state.showSuggestionsModal ?? false,
      showEmbedModal: state.showEmbedModal ?? false,
    }),
    shallow,
  );
