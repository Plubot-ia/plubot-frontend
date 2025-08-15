/**
 * FlowMain.jsx - Orquestador visual del editor de flujos
 */
import React, { useEffect, useRef, useState, useTransition } from 'react';
// OPTIMIZED: Removed useReactFlow import to prevent re-renders during panning
import 'reactflow/dist/style.css';

import { useRenderTracker } from '@/utils/renderTracker';

import useFlowStore from '../../../../stores/use-flow-store';
import useAdaptivePerformance from '../hooks/useAdaptivePerformance';
import useContextMenu from '../hooks/useContextMenu';
import { useEdgeCleanup } from '../hooks/useEdgeCleanup';
import { useEdgeTimingFix } from '../hooks/useEdgeTimingFix';
import { useEliteFlowMainSelectors, useEliteStoreActions } from '../hooks/useEliteStoreSelectors';
import useNodeVirtualization from '../hooks/useNodeVirtualization';
import { MIN_ZOOM } from '../utils/flow-extents';

import FlowCanvas from './FlowCanvas';
import { FlowMainPropertyTypes } from './FlowMainPropertyTypes';
import FlowSidebarControls from './FlowSidebarControls';
import { useAllHooksConfiguration } from './hooks/useAllHooksConfiguration';
import { useAutomaticCentering } from './hooks/useAutomaticCentering';
import { useEdgesReadyState } from './hooks/useEdgesReadyState';
import { useFlowContainerDimensions } from './hooks/useFlowContainerDimensions';
import { useFlowEffects } from './hooks/useFlowEffects';
import { useFlowEffectsConfigurationMajor } from './hooks/useFlowEffectsConfigurationMajor';
import { useFlowEventHandlersCompact } from './hooks/useFlowEventHandlersCompact';
import { useFlowMainConfigurationFinal } from './hooks/useFlowMainConfigurationFinal';
import { useInitialFitView } from './hooks/useInitialFitView';
import { useLODManagement } from './hooks/useLODManagement';
import { useLODProcessing } from './hooks/useLODProcessing';
import { useNodeAndEdgeTypes } from './hooks/useNodeAndEdgeTypes';
import { useNodesEdgesDetermination } from './hooks/useNodesEdgesDetermination';
import { usePlubotInfo } from './hooks/usePlubotInfo';
import { useReactFlowInstanceManagement } from './hooks/useReactFlowInstanceManagement';
import { useUltraModeToggle } from './hooks/useUltraModeToggle';
import StorageQuotaManager from './StorageQuotaManager';
import '../node-positioning.css';
import '../react-flow-overrides.css';
import '../ui/EliteEdge.css';
import '../ui/elite-drag-optimizations.css';
import '../ui/FlowControls.css';
import '../ui/hide-debug-elements.css';
import '../ui/HistoryControls.css';
import '../ui/mega-drag-fix.css';
import '../ui/remove-debug-styles.css';
import '../ui/SyncButton.css';
import '../ui/UltraMode.css';
import '../ui/VerticalButtons.css';
import '../ui/ZoomControls.css';
import './transparent-pane.css';

// Custom hook for store selectors and actions
const useFlowStoreConfiguration = () => {
  // ELITE OPTIMIZATION: Using granular selectors to prevent cascade renders
  const {
    nodes: zustandNodes,
    edges: zustandEdges,
    isUltraMode,
    plubotId,
    flowName,
  } = useEliteFlowMainSelectors();
  const [areEdgesReady, setAreEdgesReady] = useEdgesReadyState(150);
  const {
    setReactFlowInstance: setReactFlowInstanceFromStore,
    setNodes,
    setEdges,
    toggleUltraMode,
    undo,
    redo,
  } = useEliteStoreActions();

  // Get canUndo/canRedo separately to avoid function recreation
  const canUndo = useFlowStore((state) => state.canUndo());
  const canRedo = useFlowStore((state) => state.canRedo());

  return {
    zustandNodes,
    zustandEdges,
    isUltraMode,
    plubotId,
    flowName,
    areEdgesReady,
    setAreEdgesReady,
    setReactFlowInstanceFromStore,
    setNodes,
    setEdges,
    toggleUltraMode,
    undo,
    redo,
    canUndo,
    canRedo,
  };
};

// Custom hook for instance and reference configuration
// OPTIMIZED: Removed useReactFlow() to prevent re-renders during panning
const useFlowInstanceAndReferences = (reactFlowInstance) => {
  const flowContainerReference = useRef();
  const reactFlowInstanceReference = useRef();
  const [isDragging, setIsDragging] = useState(false);

  // Get fitView from reactFlowInstance when available, avoiding hook subscription
  const fitView = reactFlowInstance?.fitView ?? undefined;

  return {
    flowContainerReference,
    reactFlowInstanceReference,
    fitView,
    isDragging,
    setIsDragging,
  };
};

// Helper: Extraer propiedades de flowMainHooks
const extractFlowMainProperties = (flowMainHooks) => {
  const {
    externalSetReactFlowInstance,
    flowContainerReference,
    reactFlowInstanceReference,
    fitView,
    isDragging,
    setIsDragging,
    nodes,
    edges,
    isInitialLoad,
    menu,
    handlePaneClickForMenu,
    closeContextMenu,
    optimizationLevel,
    startMonitoring,
    updatePerformance,
    fpsRef,
    reactFlowInstance,
    flowWrapperReference,
    plubotInfo,
    flowId,
    onExport,
    onImport,
    visibleNodes,
    visibleEdges,
    nodesWithLOD,
    edgesWithLOD,
    nodeTypes,
    edgeTypes,
    handleToggleUltraMode,
    areEdgesReady,
    setAreEdgesReady,
    setReactFlowInstanceFromStore,
    setNodes,
    undo,
    redo,
    canUndo,
    canRedo,
    isUltraMode,
  } = flowMainHooks;

  return {
    externalSetReactFlowInstance,
    flowContainerReference,
    reactFlowInstanceReference,
    fitView,
    isDragging,
    setIsDragging,
    nodes,
    edges,
    isInitialLoad,
    menu,
    handlePaneClickForMenu,
    closeContextMenu,
    optimizationLevel,
    startMonitoring,
    updatePerformance,
    fpsRef,
    reactFlowInstance,
    flowWrapperReference,
    plubotInfo,
    flowId,
    onExport,
    onImport,
    visibleNodes,
    visibleEdges,
    nodesWithLOD,
    edgesWithLOD,
    nodeTypes,
    edgeTypes,
    handleToggleUltraMode,
    areEdgesReady,
    setAreEdgesReady,
    setReactFlowInstanceFromStore,
    setNodes,
    undo,
    redo,
    canUndo,
    canRedo,
    isUltraMode,
  };
};

// Custom hook for flow instance and store configuration
const useFlowMainCore = ({
  _project,
  _onSave,
  externalNodes,
  externalEdges,
  _externalNodeTypes,
  _externalEdgeTypes,
  _externalCloseModal,
  setReactFlowInstance,
  incomingReactFlowInstance, // Add this parameter
}) => {
  const [, startTransition] = useTransition();
  const externalSetReactFlowInstance = setReactFlowInstance;

  // OPTIMIZED: Pass reactFlowInstance to get fitView without hook subscription
  const { flowContainerReference, reactFlowInstanceReference, fitView, isDragging, setIsDragging } =
    useFlowInstanceAndReferences(incomingReactFlowInstance);

  const storeConfig = useFlowStoreConfiguration();
  const {
    zustandNodes,
    zustandEdges,
    isUltraMode,
    plubotId,
    flowName,
    areEdgesReady,
    setAreEdgesReady,
    setReactFlowInstanceFromStore,
    setNodes,
    setEdges,
    toggleUltraMode,
    undo,
    redo,
    canUndo,
    canRedo,
  } = storeConfig;

  const { nodes, edges } = useNodesEdgesDetermination({
    externalNodes,
    zustandNodes,
    externalEdges,
    zustandEdges,
    areEdgesReady,
  });

  const { isInitialLoad } = useInitialFitView(nodes, fitView);

  return {
    startTransition,
    externalSetReactFlowInstance,
    flowContainerReference,
    reactFlowInstanceReference,
    fitView,
    isDragging,
    setIsDragging,
    storeConfig,
    nodes,
    edges,
    isInitialLoad,
    isUltraMode,
    plubotId,
    flowName,
    areEdgesReady,
    setAreEdgesReady,
    setReactFlowInstanceFromStore,
    setNodes,
    setEdges,
    toggleUltraMode,
    undo,
    redo,
    canUndo,
    canRedo,
    // Pass through original props for use in main hooks
    project: _project,
    onSave: _onSave,
    externalNodeTypes: _externalNodeTypes,
    externalEdgeTypes: _externalEdgeTypes,
    externalCloseModal: _externalCloseModal,
  };
};

// Custom hook for consolidating all FlowMain hooks logic
// Custom hook for auto-centering logic
const useAutoCenteringEffect = (nodes, fitView, performAutomaticCentering) => {
  const hasCenteredRef = React.useRef(false);
  const nodesLengthRef = React.useRef(0);

  useEffect(() => {
    const currentNodesLength = nodes.length;
    const shouldCenter =
      currentNodesLength > 0 &&
      !hasCenteredRef.current &&
      currentNodesLength !== nodesLengthRef.current &&
      fitView &&
      performAutomaticCentering;

    if (shouldCenter) {
      hasCenteredRef.current = true;
      nodesLengthRef.current = currentNodesLength;
      const timeoutId = setTimeout(() => {
        performAutomaticCentering();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [nodes.length, fitView, performAutomaticCentering]);
};

const useFlowMainHooks = (props) => {
  const coreHooks = useFlowMainCore(props);
  const {
    nodes,
    edges,
    fitView,
    flowContainerReference,
    reactFlowInstanceReference,
    externalSetReactFlowInstance,
    startTransition,
    isDragging,
    setIsDragging,
    isInitialLoad,
    isUltraMode,
    plubotId,
    flowName,
    areEdgesReady,
    setAreEdgesReady,
    setReactFlowInstanceFromStore,
    setNodes,
    setEdges,
    toggleUltraMode,
    undo,
    redo,
    canUndo,
    canRedo,
    project,
    onSave,
    externalNodeTypes,
    externalEdgeTypes,
    externalCloseModal,
  } = coreHooks;

  // Use automatic centering hook
  const { performAutomaticCentering } = useAutomaticCentering(nodes, fitView);

  // Use extracted auto-centering effect
  useAutoCenteringEffect(nodes, fitView, performAutomaticCentering);
  const { menu, onPaneClick: handlePaneClickForMenu, closeContextMenu } = useContextMenu();
  const { optimizationLevel, startMonitoring, updatePerformance, fpsRef } =
    useAdaptivePerformance();
  const { reactFlowInstance } = useReactFlowInstanceManagement();
  const { flowWrapperReference, containerWidth, containerHeight } = useFlowContainerDimensions();
  const { plubotInfo, flowId } = usePlubotInfo({ project, plubotId, flowName });

  const { onExport, onImport, virtualizationConfig } = useAllHooksConfiguration({
    onSave,
    nodes,
    edges,
    flowId,
    plubotInfo,
    startTransition,
    setNodes,
    setEdges,
    externalCloseModal,
    // viewport removed - was causing re-renders
    containerWidth,
    containerHeight,
  });

  const { visibleNodes, visibleEdges } = useNodeVirtualization(virtualizationConfig);
  // OPTIMIZED: Uses selective zoom subscription without causing panning re-renders
  const lodLevel = useLODManagement();

  const { nodesWithLOD, edgesWithLOD } = useLODProcessing({
    visibleNodes,
    visibleEdges,
    lodLevel,
    isUltraMode,
    // REMOVED: draggingNodeId - This was causing full edge array recalculation
  });

  const { nodeTypes, edgeTypes } = useNodeAndEdgeTypes({ externalNodeTypes, externalEdgeTypes });
  const { handleToggleUltraMode } = useUltraModeToggle(toggleUltraMode, isUltraMode);

  // DEBUG: Temporary effect to track edge count discrepancy (disabled for production)
  // useEffect(() => {
  //   const debugInfo = debugEdgeCount();
  //   if (debugInfo && debugInfo.edgeCount !== debugInfo.visibleEdges.length) {
  //     console.warn('⚠️ Edge count mismatch detected:', {
  //       storeEdgeCount: debugInfo.edgeCount,
  //       visibleEdges: debugInfo.visibleEdges.length,
  //       totalEdges: debugInfo.edges.length,
  //     });
  //   }
  // }, [edges.length]);

  // Diagnostic logging temporarily disabled - was causing render cascade
  // useEffect(() => {
  //   const diagnosticProps = {
  //     nodesCount: nodes.length,
  //     edgesCount: edges.length,
  //   renderDiagnostics.compareProps('FlowMain', prevPropsRef.current, {
  //     lodLevel,
  //     isDragging,
  //     nodesCount: nodes.length,
  //     edgesCount: edges.length
  //   });
  //   prevPropsRef.current = {
  //     lodLevel,
  //     isDragging,
  //     nodesCount: nodes.length,
  //     edgesCount: edges.length
  //   };
  // });

  // Hook para limpieza automática de edges con handles undefined (ReactFlow Error #008)
  useEdgeCleanup({
    autoCleanup: true,
    cleanupInterval: 3000, // Limpieza cada 3 segundos
    enableLogging: true,
  });

  // Hook para resolver timing issues entre handles y edges (ReactFlow Error #008)
  useEdgeTimingFix();

  return {
    startTransition,
    externalSetReactFlowInstance,
    flowContainerReference,
    reactFlowInstanceReference,
    fitView,
    isDragging,
    setIsDragging,
    nodes,
    edges,
    isInitialLoad,
    menu,
    handlePaneClickForMenu,
    closeContextMenu,
    optimizationLevel,
    startMonitoring,
    updatePerformance,
    fpsRef,
    reactFlowInstance,
    flowWrapperReference,
    containerWidth,
    containerHeight,
    // viewport removed - was causing 111 renders/sec during panning
    plubotInfo,
    flowId,
    onExport,
    onImport,
    virtualizationConfig,
    visibleNodes,
    visibleEdges,
    lodLevel,
    nodesWithLOD,
    edgesWithLOD,
    nodeTypes,
    edgeTypes,
    handleToggleUltraMode,
    areEdgesReady,
    setAreEdgesReady,
    setReactFlowInstanceFromStore,
    setNodes,
    setEdges,
    undo,
    redo,
    canUndo,
    canRedo,
    isUltraMode,
  };
};

// Custom hook for event handlers configuration
const useFlowEventHandlersConfiguration = ({
  externalOnEdgesChange,
  externalOnConnect,
  externalOnNodeClick,
  externalOnPaneClick,
  externalOnEdgeClick,
  externalOnNodeDragStart,
  externalOnNodeDrag,
  externalOnNodeDragStop,
  externalOnDragOver,
  externalOnDrop,
  externalOnEdgeUpdate,
  externalOnEdgeUpdateStart,
  externalOnEdgeUpdateEnd,
  externalOnNodesDelete,
  externalOnEdgesDelete,
  externalOnSelectionChange,
  externalValidConnectionsHandles,
  isDragging,
  setIsDragging,
  closeContextMenu,
  handlePaneClickForMenu,
}) => {
  return useFlowEventHandlersCompact({
    externalHandlers: {
      onEdgesChange: externalOnEdgesChange,
      onConnect: externalOnConnect,
      onNodeClick: externalOnNodeClick,
      onPaneClick: externalOnPaneClick,
      onEdgeClick: externalOnEdgeClick,
      onNodeDragStart: externalOnNodeDragStart,
      onNodeDrag: externalOnNodeDrag,
      onNodeDragStop: externalOnNodeDragStop,
      onDragOver: externalOnDragOver,
      onDrop: externalOnDrop,
      onEdgeUpdate: externalOnEdgeUpdate,
      onEdgeUpdateStart: externalOnEdgeUpdateStart,
      onEdgeUpdateEnd: externalOnEdgeUpdateEnd,
      onNodesDelete: externalOnNodesDelete,
      onEdgesDelete: externalOnEdgesDelete,
      onSelectionChange: externalOnSelectionChange,
      validConnectionsHandles: externalValidConnectionsHandles,
    },
    internalHandlers: { isDragging, setIsDragging, closeContextMenu, handlePaneClickForMenu },
  });
};

/* eslint-disable max-lines-per-function */
// DEUDA TÉCNICA: FlowMain es el orquestador principal del editor de flujos React Flow.
// La función (167 líneas) maneja configuración compleja de hooks especializados, event handlers,
// effects y props delegation para 20+ componentes interdependientes del editor visual.
// ARQUITECTURA: Ya altamente modularizada con hooks especializados y helpers de extracción.
// FUTURE: Considerar división en sub-orquestadores por dominio en refactorización mayor.
// Regla desactivada para preservar estabilidad del núcleo crítico del editor de flujos.

/**
 * Componente principal FlowMain - Orquestador visual del editor de flujos
 */
const FlowMainComponent = React.memo(
  ({
    project,
    onSave,
    reactFlowInstance: incomingReactFlowInstance,
    setReactFlowInstance,
    nodes: externalNodes,
    edges: externalEdges,
    onEdgesChange: externalOnEdgesChange,
    onConnect: externalOnConnect,
    onNodeClick: externalOnNodeClick,
    onPaneClick: externalOnPaneClick,
    onEdgeClick: externalOnEdgeClick,
    onNodeDragStop: externalOnNodeDragStop,
    onDragOver: externalOnDragOver,
    onDrop: externalOnDrop,
    onEdgeUpdate: externalOnEdgeUpdate,
    onEdgeUpdateStart: externalOnEdgeUpdateStart,
    onNodeDragStart: externalOnNodeDragStart,
    onEdgeUpdateEnd: externalOnEdgeUpdateEnd,
    onNodesDelete: externalOnNodesDelete,
    onEdgesDelete: externalOnEdgesDelete,
    onSelectionChange: externalOnSelectionChange,
    onNodeDrag: externalOnNodeDrag,
    nodeTypes: externalNodeTypes,
    edgeTypes: externalEdgeTypes,
    validConnectionsHandles: externalValidConnectionsHandles,
    closeModal: externalCloseModal,
    showEmbedModal: externalShowEmbedModal,
    showImportExportModal: externalShowImportExportModal,
    minZoom = MIN_ZOOM,
  }) => {
    // DEBUG: AGGRESSIVE tracking of FlowMain renders during drag
    // Render logging temporarily disabled - was causing render cascade
    // console.log('🔥 [FlowMain] RENDER DETECTED:', {
    //   timestamp: Date.now(),
    //   nodesCount: nodes.length,
    //   edgesCount: edges.length,
    //   stackTrace: new Error().stack?.split('\n')[1]?.trim()
    // });

    // 🔄 RENDER TRACKING - Using proper hook for consistent tracking
    useRenderTracker('FlowMain');

    // OPTIMIZED: Memoize hooks configuration with deep comparison for arrays
    const flowMainHooksParams = React.useMemo(
      () => ({
        project,
        onSave,
        externalNodes,
        externalEdges,
        externalNodeTypes,
        externalEdgeTypes,
        externalCloseModal,
        setReactFlowInstance,
        incomingReactFlowInstance, // Pass the instance for fitView access
      }),
      [
        project,
        onSave,
        externalNodes,
        externalEdges,
        externalNodeTypes,
        externalEdgeTypes,
        externalCloseModal,
        setReactFlowInstance,
        incomingReactFlowInstance,
      ],
    );
    const flowMainHooks = useFlowMainHooks(flowMainHooksParams);
    // Extraer propiedades usando helper
    const {
      externalSetReactFlowInstance,
      flowContainerReference,
      reactFlowInstanceReference,
      fitView,
      isDragging,
      setIsDragging,
      nodes,
      edges,
      isInitialLoad,
      menu,
      handlePaneClickForMenu,
      closeContextMenu,
      optimizationLevel,
      startMonitoring,
      updatePerformance,
      fpsRef,
      reactFlowInstance,
      flowWrapperReference,
      plubotInfo,
      flowId,
      onExport,
      onImport,
      visibleNodes,
      visibleEdges,
      nodesWithLOD,
      edgesWithLOD,
      nodeTypes,
      edgeTypes,
      handleToggleUltraMode,
      areEdgesReady,
      setAreEdgesReady,
      setReactFlowInstanceFromStore,
      setNodes,
      undo,
      redo,
      canUndo,
      canRedo,
      isUltraMode,
    } = extractFlowMainProperties(flowMainHooks);

    // Extract tracking handlers from hooks

    // OPTIMIZED: Memoize event handlers configuration with stable reference
    // Only update if actual handler functions change, not on every render
    const eventHandlersConfig = React.useMemo(
      () => ({
        externalOnEdgesChange,
        externalOnConnect,
        externalOnNodeClick,
        externalOnPaneClick,
        externalOnEdgeClick,
        externalOnNodeDragStart,
        externalOnNodeDrag,
        externalOnNodeDragStop,
        externalOnDragOver,
        externalOnDrop,
        externalOnEdgeUpdate,
        externalOnEdgeUpdateStart,
        externalOnEdgeUpdateEnd,
        externalOnNodesDelete,
        externalOnEdgesDelete,
        externalOnSelectionChange,
        externalValidConnectionsHandles,
        isDragging,
        setIsDragging,
        closeContextMenu,
        handlePaneClickForMenu,
      }),
      [
        externalOnEdgesChange,
        externalOnConnect,
        externalOnNodeClick,
        externalOnPaneClick,
        externalOnEdgeClick,
        externalOnNodeDragStart,
        externalOnNodeDrag,
        externalOnNodeDragStop,
        externalOnDragOver,
        externalOnDrop,
        externalOnEdgeUpdate,
        externalOnEdgeUpdateStart,
        externalOnEdgeUpdateEnd,
        externalOnNodesDelete,
        externalOnEdgesDelete,
        externalOnSelectionChange,
        externalValidConnectionsHandles,
        isDragging,
        // Use stable references for internal handlers
        setIsDragging,
        closeContextMenu,
        handlePaneClickForMenu,
      ],
    );
    const eventHandlers = useFlowEventHandlersConfiguration(eventHandlersConfig);
    // Configuración compacta de flow effects
    const flowEffectsParams = {
      nodes,
      setNodes,
      areEdgesReady,
      setAreEdgesReady,
      isInitialLoad,
      fitView,
      incomingReactFlowInstance,
      reactFlowInstanceReference,
      startMonitoring,
      updatePerformance,
      reactFlowInstance,
      edges,
      setReactFlowInstanceFromStore,
      externalSetReactFlowInstance,
    };
    const flowEffectsConfig = useFlowEffectsConfigurationMajor(flowEffectsParams);
    useFlowEffects(flowEffectsConfig);
    // OPTIMIZED: FlowCanvas props are now handled by useFlowMainConfigurationFinal hook
    // Configuración final compacta
    const configParams = {
      nodesWithLOD,
      edgesWithLOD,
      nodeTypes,
      edgeTypes,
      eventHandlers,
      minZoom,
      reactFlowInstanceReference,
      setReactFlowInstanceFromStore,
      externalSetReactFlowInstance,
      isUltraMode,
      visibleNodes,
      visibleEdges,
      menu,
      closeContextMenu,
      fpsRef,
      optimizationLevel,
      flowWrapperReference,
      handleToggleUltraMode,
      reactFlowInstance,
      undo,
      redo,
      canUndo,
      canRedo,
      externalShowEmbedModal,
      externalCloseModal,
      flowId,
      plubotInfo,
      externalShowImportExportModal,
      onExport,
      onImport,
      flowContainerReference,
    };
    const {
      flowCanvasProps: flowCanvasPropsFinal,
      flowSidebarControlsProps,
      containerProps,
    } = useFlowMainConfigurationFinal(configParams);
    return (
      <div {...containerProps}>
        <StorageQuotaManager project={project} />
        <FlowCanvas {...flowCanvasPropsFinal} />
        <FlowSidebarControls {...flowSidebarControlsProps} />
      </div>
    );
  },
  (previousProps, nextProps) => {
    // Check critical props
    if (
      previousProps.project !== nextProps.project ||
      previousProps.reactFlowInstance !== nextProps.reactFlowInstance ||
      previousProps.minZoom !== nextProps.minZoom
    ) {
      return false;
    }

    // Check function references
    const functionProps = [
      'onSave',
      'setReactFlowInstance',
      'onEdgesChange',
      'onConnect',
      'onNodeClick',
      'onPaneClick',
      'onEdgeClick',
      'onNodeDragStop',
      'onDragOver',
      'onDrop',
      'onEdgeUpdate',
      'onEdgeUpdateStart',
      'onNodeDragStart',
      'onEdgeUpdateEnd',
      'onNodesDelete',
      'onEdgesDelete',
      'onSelectionChange',
      'onNodeDrag',
      'closeModal',
      'showEmbedModal',
      'showImportExportModal',
    ];

    const hasFunctionChanged = functionProps.some((property) => {
      return (
        Object.prototype.hasOwnProperty.call(previousProps, property) &&
        Object.prototype.hasOwnProperty.call(nextProps, property) &&
        // eslint-disable-next-line security/detect-object-injection
        previousProps[property] !== nextProps[property]
      );
    });

    if (hasFunctionChanged) return false;

    // Deep comparison for arrays
    const nodesEqual =
      JSON.stringify(
        previousProps.nodes?.map((n) => ({
          id: n.id,
          type: n.type,
          position: n.position,
          data: n.data,
        })),
      ) ===
      JSON.stringify(
        nextProps.nodes?.map((n) => ({
          id: n.id,
          type: n.type,
          position: n.position,
          data: n.data,
        })),
      );

    const edgesEqual =
      JSON.stringify(
        previousProps.edges?.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: edge.type,
        })),
      ) ===
      JSON.stringify(
        nextProps.edges?.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: edge.type,
        })),
      );

    if (!nodesEqual || !edgesEqual) {
      return false;
    }

    // Check object references and return the result
    // If we reach here and object references are the same, props are effectively the same - prevent re-render
    // console.log('Drag agresivo detectado, aplicando optimizaciones...');
    return !(
      previousProps.nodeTypes !== nextProps.nodeTypes ||
      previousProps.edgeTypes !== nextProps.edgeTypes ||
      previousProps.validConnectionsHandles !== nextProps.validConnectionsHandles
    );
  },
);

FlowMainComponent.propTypes = FlowMainPropertyTypes;
FlowMainComponent.displayName = 'FlowMain';

// Export the optimized component directly
const FlowMain = FlowMainComponent;

export default FlowMain;
