/**
 * flowImportExportHelpers.js
 * Helper functions for import/export functionality in FlowMain
 * Extracted for better code organization and reduced function complexity
 *
 * @version 1.0.0
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Handles the logic for exporting flow data to a JSON file.
 * @param {Function} onSave - Function to save the flow before exporting.
 * @param {Array} nodes - The current nodes.
 * @param {Array} edges - The current edges.
 * @param {string} flowId - The ID of the flow.
 * @param {object} plubotInfo - Information about the Plubot.
 */
export const handleFlowExport = async ({ onSave, nodes, edges, flowId, plubotInfo }) => {
  if (typeof onSave === 'function') {
    try {
      await onSave({ isManual: true });
    } catch {
      // Decide if you want to proceed even if save fails
    }
  }
  try {
    const exportData = {
      nodes: nodes ?? [],
      edges: edges ?? [],
      metadata: {
        exportDate: new Date().toISOString(),
        flowId,
        plubotName: plubotInfo?.name || 'Mi Chatbot',
      },
    };
    const jsonString = JSON.stringify(exportData, undefined, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flujo-${
      plubotInfo?.name || 'plubot'
    }-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch {
    // Error handled silently
  }
};

/**
 * Handles the logic for importing flow data from a JSON file.
 * @param {object} data - The imported data.
 * @param {Function} startTransition - React's startTransition.
 * @param {Function} setNodes - Function to update nodes.
 * @param {Function} setEdges - Function to update edges.
 * @param {Function} externalCloseModal - Function to close the modal.
 */
export const handleFlowImport = ({
  data,
  startTransition,
  setNodes,
  setEdges,
  externalCloseModal,
}) => {
  if (!data?.nodes || !data?.edges) return;

  startTransition(() => {
    try {
      const newNodes = data.nodes.map((node) => ({ ...node, id: uuidv4() }));
      const nodeIdMap = new Map(
        // eslint-disable-next-line security/detect-object-injection
        data.nodes.map((node, index) => [node.id, newNodes[index].id]),
      );
      const newEdges = data.edges
        .filter((edge) => nodeIdMap.has(edge.source) && nodeIdMap.has(edge.target))
        .map((edge) => ({
          ...edge,
          id: uuidv4(),
          source: nodeIdMap.get(edge.source),
          target: nodeIdMap.get(edge.target),
        }));

      setNodes(newNodes);
      setEdges(newEdges);

      if (typeof externalCloseModal === 'function') {
        externalCloseModal('importExportModal');
      } else {
        globalThis.dispatchEvent(
          new CustomEvent('plubot-close-modal', {
            detail: { modal: 'importExportModal' },
          }),
        );
      }
    } catch {
      // Error handled silently
    }
  });
};

/**
 * Creates a new node object by duplicating an existing one.
 * @param {object} nodeToDuplicate - The node to duplicate.
 * @returns {object} The new duplicated node.
 */
export const createDuplicatedNode = (nodeToDuplicate) => ({
  id: uuidv4(),
  type: nodeToDuplicate.type,
  position: {
    x: nodeToDuplicate.position.x + 40,
    y: nodeToDuplicate.position.y + 40,
  },
  data: structuredClone(nodeToDuplicate.data),
});
