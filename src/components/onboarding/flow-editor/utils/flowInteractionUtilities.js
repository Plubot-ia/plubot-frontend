import useFlowStore from '@/stores/use-flow-store';

/**
 * Handles the undo/redo keyboard shortcuts.
 * @param {KeyboardEvent} event - The keyboard event.
 * @param {Function} undo - The undo function.
 * @param {Function} redo - The redo function.
 */
export const handleUndoRedo = (event, undo, redo) => {
  const isMac = navigator.platform.toUpperCase().includes('MAC');
  const metaKey = isMac ? event.metaKey : event.ctrlKey;

  if (!metaKey) {
    return;
  }

  const key = (event.key ?? '').toLowerCase();
  const isZ = key === 'z';
  const isY = key === 'y';

  const handleEvent = (action) => {
    event.preventDefault();
    event.stopPropagation();
    if (typeof action === 'function') {
      action();
    }
  };

  if (isZ) {
    if (event.shiftKey) {
      handleEvent(redo); // Cmd/Ctrl + Shift + Z
    } else {
      handleEvent(undo); // Cmd/Ctrl + Z
    }
  } else if (isY && !isMac) {
    handleEvent(redo); // Ctrl + Y (Windows/Linux)
  }
};

const deleteConnectedEdges = (nodeId, reactFlowInstance) => {
  const flowStore = useFlowStore.getState();
  if (!flowStore || !Array.isArray(flowStore.edges)) return;

  const edgesToRemove = flowStore.edges.filter(
    (edge) => edge && (edge.source === nodeId || edge.target === nodeId),
  );

  if (edgesToRemove.length === 0) return;

  if (reactFlowInstance) {
    reactFlowInstance.deleteElements({ edges: edgesToRemove });
  }

  if (flowStore.onEdgesChange) {
    flowStore.onEdgesChange(edgesToRemove.map((edge) => ({ id: edge.id, type: 'remove' })));
  }

  if (flowStore.setEdges) {
    const remainingEdges = flowStore.edges.filter(
      (edge) => !edgesToRemove.some((removed) => removed.id === edge.id),
    );
    flowStore.setEdges(remainingEdges);
  }
};

const deleteNode = (nodeId, reactFlowInstance) => {
  const flowStore = useFlowStore.getState();
  if (!flowStore) return;

  if (reactFlowInstance) {
    reactFlowInstance.deleteElements({ nodes: [{ id: nodeId }] });
  }

  if (flowStore.onNodesChange) {
    flowStore.onNodesChange([{ id: nodeId, type: 'remove' }]);
  }

  if (flowStore.setNodes && Array.isArray(flowStore.nodes)) {
    const remainingNodes = flowStore.nodes.filter((node) => node && node.id !== nodeId);
    flowStore.setNodes(remainingNodes);
  }
};

/**
 * Handles the deletion of a selected node and its connected edges.
 * @param {Object} selectedNode - The currently selected node.
 * @param {Object} reactFlowInstance - The React Flow instance.
 * @param {Function} setSelectedNode - Function to update the selected node.
 */
export const handleNodeDeletion = (selectedNode, reactFlowInstance, setSelectedNode) => {
  if (!selectedNode) return;

  const { id: nodeId } = selectedNode;

  deleteConnectedEdges(nodeId, reactFlowInstance);
  deleteNode(nodeId, reactFlowInstance);

  if (typeof setSelectedNode === 'function') {
    setSelectedNode(undefined);
  } else {
    const flowStore = useFlowStore.getState();
    if (flowStore && flowStore.setSelectedNode) {
      flowStore.setSelectedNode(undefined);
    }
  }
};
