import { toggleUltraMode as toggleUltraModeManager } from '@/components/onboarding/flow-editor/ui/UltraModeManager';

export const createUISlice = (set, get) => ({
  reactFlowInstance: undefined,
  viewport: { x: 0, y: 0, zoom: 1 },
  selectedNode: undefined,
  selectedEdge: undefined,
  isUltraMode: false,
  shouldMoveToCenter: false,
  autoArrange: false,
  modals: {
    templateSelector: false,
    embedModal: false,
    importExportModal: false,
  },
  contextMenuVisible: false,
  contextMenuPosition: { x: 0, y: 0 },
  contextMenuNodeId: undefined,
  contextMenuItems: [],
  isNodeBeingDragged: false,
  lodThresholds: { FULL: 0.3, COMPACT: 0.15 },
  defaultLodThresholds: { FULL: 0.3, COMPACT: 0.15 },

  setReactFlowInstance: (instance) => set({ reactFlowInstance: instance }),
  toggleUltraMode: (enable, userInitiated = true) => {
    const currentState = get().isUltraMode;
    const newState = enable === undefined ? !currentState : enable;
    if (newState === currentState) return;
    toggleUltraModeManager(newState, userInitiated);
    set({ isUltraMode: newState });
  },
  setIsNodeBeingDragged: (isDragging) => set({ isNodeBeingDragged: isDragging }),
  setLodThresholds: (thresholds) => set({ lodThresholds: thresholds }),
  showContextMenu: ({ x, y, nodeId, items }) => {
    setTimeout(() => {
      set({
        contextMenuVisible: true,
        contextMenuPosition: { x, y },
        contextMenuNodeId: nodeId,
        contextMenuItems: items,
        selectedNode: nodeId,
      });
    }, 0);
  },
  hideContextMenu: () => {
    set({
      contextMenuVisible: false,
      contextMenuPosition: { x: 0, y: 0 },
      contextMenuItems: [],
      contextMenuNodeId: undefined,
    });
  },
  selectNode: (nodeId) => set({ selectedNode: nodeId, selectedEdge: undefined }),
  selectEdge: (edgeId) => set({ selectedEdge: edgeId, selectedNode: undefined }),
  clearSelection: () => set({ selectedNode: undefined, selectedEdge: undefined }),
  centerNodes: () => set({ shouldMoveToCenter: true }),
  toggleAutoArrange: () => set((state) => ({ autoArrange: !state.autoArrange })),
  setViewport: (viewport) => set({ viewport }),
  openModal: (modalName) =>
    set((state) => {
      if (Object.prototype.hasOwnProperty.call(state.modals, modalName)) {
        return { modals: { ...state.modals, [modalName]: true } };
      }
      return {};
    }),
  closeModal: (modalName) =>
    set((state) => {
      if (Object.prototype.hasOwnProperty.call(state.modals, modalName)) {
        return { modals: { ...state.modals, [modalName]: false } };
      }
      return {};
    }),
});
