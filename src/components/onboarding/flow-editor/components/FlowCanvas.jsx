/**
 * FlowCanvas.jsx
 * Extracted UI rendering logic from FlowMain
 * Handles ReactFlow canvas and all its children components
 */

import PropTypes from 'prop-types';
import React, { useEffect, useRef } from 'react';
import ReactFlow, { Controls } from 'reactflow';
import 'reactflow/dist/style.css';

import { useEdgeTimingFix } from '../hooks/useEdgeTimingFix';
import BackgroundScene from '../ui/BackgroundScene';
import { MIN_ZOOM, MAX_ZOOM } from '../utils/flow-extents';

import EdgeContextMenu from './menus/EdgeContextMenu';
import NodeContextMenu from './menus/NodeContextMenu';
import MiniMapWrapper from './MiniMapWrapper';

// Helper function to create ReactFlow initialization handler
const createOnInitHandler = (
  reactFlowInstanceReference,
  setReactFlowInstanceFromStore,
  externalSetReactFlowInstance,
  reactFlowInstanceRef,
) => {
  return (instance) => {
    reactFlowInstanceReference.current = instance;
    reactFlowInstanceRef.current = instance;
    if (globalThis.window !== undefined) {
      globalThis.reactFlowInstance = instance;
    }
    setReactFlowInstanceFromStore(instance);

    if (typeof externalSetReactFlowInstance === 'function') {
      externalSetReactFlowInstance(instance);
    }
  };
};

// Helper function to get ReactFlow props configuration
const getReactFlowProps = (options) => {
  const {
    nodesWithLOD,
    edgesWithLOD,
    nodeTypes,
    edgeTypes,
    eventHandlers,
    minZoom,
    onInitHandler,
    handlesReady,
  } = options;
  const {
    handlePaneClick,
    onNodesChange,
    handleEdgesChange,
    handleConnect,
    handleDrop,
    handleDragOver,
    handleNodeClick,
    handleEdgeClick,
    onNodeDragStop,
    handleEdgeUpdate,
    onNodeContextMenu,
    onEdgeContextMenu,
    onNodeDragStart,
    onNodeDrag,
    onEdgeUpdateStart,
    onEdgeUpdateEnd,
    onNodesDelete,
    onEdgesDelete,
    onSelectionChange,
    isValidConnection,
  } = eventHandlers ?? {};

  return {
    nodes: nodesWithLOD,
    edges: handlesReady || edgesWithLOD.length === 0 ? edgesWithLOD : [], // Solo suprimir edges si hay edges y handles no están listos
    nodeTypes,
    edgeTypes,
    onPaneClick: handlePaneClick,
    onNodesChange,
    onEdgesChange: handleEdgesChange,
    onConnect: handleConnect,
    onInit: onInitHandler,
    onDrop: handleDrop,
    onDragOver: handleDragOver,
    onNodeClick: handleNodeClick,
    onEdgeClick: handleEdgeClick,
    onNodeDragStop,
    onEdgeUpdate: handleEdgeUpdate,
    onNodeContextMenu,
    onEdgeContextMenu,
    onNodeDragStart,
    onNodeDrag,
    onEdgeUpdateStart,
    onEdgeUpdateEnd,
    onNodesDelete,
    onEdgesDelete,
    onSelectionChange,
    fitView: false,
    snapToGrid: false,
    snapGrid: [15, 15],
    deleteKeyCode: ['Backspace', 'Delete'],
    multiSelectionKeyCode: ['Control', 'Meta'],
    selectionKeyCode: 'Shift',
    panActivationKeyCode: 'Space',
    zoomActivationKeyCode: 'Meta',
    connectionRadius: 75,
    maxZoom: MAX_ZOOM,
    minZoom,
    // defaultViewport removed to allow automatic centering via fitView
    nodeExtent: [
      [-50_000, -50_000],
      [50_000, 50_000],
    ],
    translateExtent: [
      [-50_000, -50_000],
      [50_000, 50_000],
    ],
    proOptions: { hideAttribution: true },
    className: 'flow-main-canvas',
    onlyRenderVisibleElements: false,
    isValidConnection,
    fitViewOptions: { padding: 0.2, includeHiddenNodes: true },
    autoPanOnConnect: false,
    autoPanOnNodeDrag: false,
    attributionPosition: 'bottom-right',
    elementsSelectable: true,
    defaultEdgeOptions: { zIndex: 0 },
    nodesDraggable: true,
    nodesConnectable: true,
    panOnScroll: false,
    zoomOnScroll: true,
    zoomOnPinch: true,
    panOnDrag: true,
    preventScrolling: true,
    zoomOnDoubleClick: true,
    style: {
      width: '100%',
      height: '100%',
      position: 'relative',
      background: 'transparent',
    },
  };
};

// Helper component for Performance Monitor
const PerformanceMonitor = ({ fpsRef, isUltraMode }) => {
  if (typeof process === 'undefined' || import.meta.env.MODE !== 'development') {
    return;
  }

  return (
    <div className='perf-monitor'>
      FPS: {fpsRef.current.toFixed(1)}
      {fpsRef.current < 30 && !isUltraMode && (
        <span className='perf-warning'> | Activar Ultra</span>
      )}
    </div>
  );
};

PerformanceMonitor.propTypes = {
  fpsRef: PropTypes.shape({
    current: PropTypes.number,
  }).isRequired,
  isUltraMode: PropTypes.bool.isRequired,
};

// Helper component for Context Menus
const ContextMenus = ({ menu, closeContextMenu, eventHandlers }) => {
  if (!menu) return;

  const { handleNodesDelete, handleEdgesDelete, handleDuplicateNode, handleEditNode } =
    eventHandlers;

  if (menu.type === 'node') {
    return (
      <NodeContextMenu
        nodeId={menu.id}
        position={{ x: menu.left, y: menu.top }}
        onClose={closeContextMenu}
        onDelete={handleNodesDelete}
        onDuplicate={handleDuplicateNode}
        onEdit={handleEditNode}
      />
    );
  }

  if (menu.type === 'edge') {
    return (
      <EdgeContextMenu
        edgeId={menu.id}
        position={{ x: menu.left, y: menu.top }}
        onClose={closeContextMenu}
        onDelete={handleEdgesDelete}
      />
    );
  }
};

ContextMenus.propTypes = {
  menu: PropTypes.shape({
    type: PropTypes.string,
    id: PropTypes.string,
    left: PropTypes.number,
    top: PropTypes.number,
    data: PropTypes.any,
  }),
  closeContextMenu: PropTypes.func.isRequired,
  eventHandlers: PropTypes.shape({
    handleNodesDelete: PropTypes.func,
    handleEdgesDelete: PropTypes.func,
    handleDuplicateNode: PropTypes.func,
    handleEditNode: PropTypes.func,
  }).isRequired,
};

/**
 * FlowCanvas component - handles ReactFlow rendering and UI
 */
const FlowCanvas = ({
  // Node and edge data
  nodesWithLOD,
  edgesWithLOD,
  nodeTypes,
  edgeTypes,

  // Event handlers
  eventHandlers,

  // ReactFlow configuration
  minZoom = MIN_ZOOM,
  reactFlowInstanceReference,
  setReactFlowInstanceFromStore,
  externalSetReactFlowInstance,

  // UI state
  isUltraMode,
  visibleNodes,
  visibleEdges,
  menu,
  closeContextMenu,

  // Performance monitoring
  fpsRef,
  optimizationLevel,

  // Container references
  flowWrapperReference,
}) => {
  const { handlesReady } = useEdgeTimingFix();
  const previousEdgesLengthRef = useRef(0);
  const reactFlowInstanceRef = useRef(null);

  const onInitHandler = createOnInitHandler(
    reactFlowInstanceReference,
    setReactFlowInstanceFromStore,
    externalSetReactFlowInstance,
    reactFlowInstanceRef,
  );

  useEffect(() => {
    if (reactFlowInstanceRef.current && edgesWithLOD.length !== previousEdgesLengthRef.current) {
      const instance = reactFlowInstanceRef.current;
      if (edgesWithLOD.length > previousEdgesLengthRef.current) {
        instance.setEdges(edgesWithLOD);
      }
      previousEdgesLengthRef.current = edgesWithLOD.length;
    }
  }, [edgesWithLOD]);

  const reactFlowProps = getReactFlowProps({
    nodesWithLOD,
    edgesWithLOD,
    nodeTypes,
    edgeTypes,
    eventHandlers,
    minZoom,
    onInitHandler,
    handlesReady,
  });

  return (
    <div
      className='flow-main-container'
      ref={flowWrapperReference}
      style={{ width: '100%', height: '100%' }}
    >
      <ReactFlow {...reactFlowProps}>
        <div
          className='ts-background-scene-container'
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: -5,
          }}
        >
          <BackgroundScene isUltraMode={isUltraMode} />
        </div>

        <div className='flow-minimap-container bottom-left'>
          <MiniMapWrapper
            nodes={visibleNodes}
            edges={visibleEdges}
            isExpanded={false}
            isUltraMode={isUltraMode}
            viewport={{}}
            setByteMessage={() => {
              // Placeholder for byte message handler
            }}
          />
        </div>

        <Controls
          showInteractive={false}
          showFitView={false}
          showZoom={false}
          style={{ zIndex: 9999 }}
        />

        <PerformanceMonitor fpsRef={fpsRef} isUltraMode={isUltraMode} />
        <ContextMenus
          menu={menu}
          closeContextMenu={closeContextMenu}
          eventHandlers={eventHandlers}
        />

        {/* Optimization Indicator */}
        {optimizationLevel !== 'none' && (
          <div className={`optimization-indicator ${optimizationLevel}`}>
            MODO {optimizationLevel.toUpperCase()}
          </div>
        )}
      </ReactFlow>
    </div>
  );
};

FlowCanvas.propTypes = {
  nodesWithLOD: PropTypes.array.isRequired,
  edgesWithLOD: PropTypes.array.isRequired,
  nodeTypes: PropTypes.object.isRequired,
  edgeTypes: PropTypes.object.isRequired,
  eventHandlers: PropTypes.object.isRequired,
  minZoom: PropTypes.number,
  reactFlowInstanceReference: PropTypes.object.isRequired,
  setReactFlowInstanceFromStore: PropTypes.func.isRequired,
  externalSetReactFlowInstance: PropTypes.func,
  isUltraMode: PropTypes.bool.isRequired,
  visibleNodes: PropTypes.array.isRequired,
  visibleEdges: PropTypes.array.isRequired,
  menu: PropTypes.object,
  closeContextMenu: PropTypes.func.isRequired,
  fpsRef: PropTypes.object.isRequired,
  optimizationLevel: PropTypes.string.isRequired,
  flowWrapperReference: PropTypes.oneOfType([PropTypes.object, PropTypes.func]).isRequired,
};

export default FlowCanvas;
