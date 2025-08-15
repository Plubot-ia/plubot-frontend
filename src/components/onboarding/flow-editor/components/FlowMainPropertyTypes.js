/**
 * FlowMainPropTypes.js
 * PropTypes definition for FlowMain component
 * Extracted for better code organization and reduced file complexity
 *
 * @version 1.0.0
 */

import PropTypes from 'prop-types';

/**
 * PropertyTypes definition for FlowMain component
 */
export const FlowMainPropertyTypes = {
  project: PropTypes.object,
  onSave: PropTypes.func,
  reactFlowInstance: PropTypes.object,
  setReactFlowInstance: PropTypes.func,
  nodes: PropTypes.array,
  edges: PropTypes.array,
  onEdgesChange: PropTypes.func,
  onConnect: PropTypes.func,
  onNodeClick: PropTypes.func,
  onPaneClick: PropTypes.func,
  onEdgeClick: PropTypes.func,
  onNodeDragStop: PropTypes.func,
  onNodeDragStart: PropTypes.func,
  onNodesDelete: PropTypes.func,
  onEdgesDelete: PropTypes.func,
  onSelectionChange: PropTypes.func,
  onNodeDrag: PropTypes.func,
  onDragOver: PropTypes.func,
  onDrop: PropTypes.func,
  onEdgeUpdate: PropTypes.func,
  onEdgeUpdateStart: PropTypes.func,
  onEdgeUpdateEnd: PropTypes.func,
  nodeTypes: PropTypes.object,
  edgeTypes: PropTypes.object,
  validConnectionsHandles: PropTypes.func,
  closeModal: PropTypes.func,
  showEmbedModal: PropTypes.bool,
  showImportExportModal: PropTypes.bool,
  minZoom: PropTypes.number,
};
