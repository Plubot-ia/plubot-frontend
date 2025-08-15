/* eslint-disable import/order */
import React, { useRef, useState, useEffect } from 'react';

import { useRenderTracker } from '@/utils/renderTracker';
import { useEliteMiniMapSelectors } from '../hooks/useEliteStoreSelectors';

import { CustomMinimapPropertyTypes } from './CustomMinimapPropertyTypes.js';
import { sanitizeViewport } from './minimap-sanitizer';
import './CustomMiniMap.css';
/* eslint-enable import/order */

// Helper functions for memo comparison
// OPTIMIZED: Balanced throttle for minimap - doesn't need 100+ FPS
const shouldSkipRenderByThrottle = (throttleMs = 16, isExpanded = false, isDragging = false) => {
  const now = Date.now();

  // BALANCED THROTTLING: Minimap doesn't need ultra-high FPS
  let actualThrottle = throttleMs;
  if (isDragging) {
    // During drag, 30 FPS is smooth enough for minimap
    actualThrottle = 33; // 30 FPS during drag
  } else if (isExpanded) {
    // 20 FPS when expanded and idle
  } else {
    actualThrottle = 100; // 10 FPS when collapsed and idle
  }

  if (!globalThis.customMinimapThrottle) {
    globalThis.customMinimapThrottle = {
      lastRender: 0,
      renderCount: 0,
      lastLog: 0,
    };
  }

  // DIAGNOSTIC: Log render frequency only in development
  const NODE_RENDER_LIMIT = 500; // Use 500 for production performance
  // eslint-disable-next-line no-undef
  if (typeof process !== 'undefined' && process?.env?.NODE_ENV === 'development') {
    globalThis.customMinimapThrottle.renderCount++;
    if (globalThis.customMinimapThrottle.renderCount > NODE_RENDER_LIMIT) {
      globalThis.customMinimapThrottle.renderCount = 0;
    }
    if (now - globalThis.customMinimapThrottle.lastLog > 1000) {
      // Throttle logging removed for production
      globalThis.customMinimapThrottle.renderCount = 0;
      globalThis.customMinimapThrottle.lastLog = now;
    }
    return true;
  }

  if (now - globalThis.customMinimapThrottle.lastRender < actualThrottle) {
    return true;
  }

  globalThis.customMinimapThrottle.lastRender = now;
  return false;
};

const exceedsTolerance = (value1, value2, tolerance) => {
  return Math.abs(value1 - value2) > tolerance;
};

const getViewportValues = (viewport) => ({
  x: viewport?.x ?? 0,
  y: viewport?.y ?? 0,
  zoom: viewport?.zoom || 1,
});

const hasViewportChanged = (
  previousViewport,
  nextViewport,
  positionTolerance = 1, // OPTIMIZED: Reduced tolerance for smoother tracking
  zoomTolerance = 0.01, // OPTIMIZED: More sensitive zoom detection
) => {
  const previous = getViewportValues(previousViewport);
  const next = getViewportValues(nextViewport);

  return (
    exceedsTolerance(previous.x, next.x, positionTolerance) ||
    exceedsTolerance(previous.y, next.y, positionTolerance) ||
    exceedsTolerance(previous.zoom, next.zoom, zoomTolerance)
  );
};

const hasNodePositionChanged = (previousNode, nextNode) => {
  return (
    previousNode.position?.x !== nextNode.position?.x ||
    previousNode.position?.y !== nextNode.position?.y
  );
};

const hasNodeDataChanged = (previousNode, nextNode) => {
  return previousNode.type !== nextNode.type || previousNode.data?.label !== nextNode.data?.label;
};

const hasNodesChanged = (previousNodes, nextNodes) => {
  if (previousNodes?.length !== nextNodes?.length) {
    return true;
  }

  if (!previousNodes || !nextNodes) {
    return false;
  }

  const previousNodesMap = new Map();
  for (const node of previousNodes) {
    previousNodesMap.set(node.id, node);
  }

  for (const nextNode of nextNodes) {
    const previousNode = previousNodesMap.get(nextNode.id);

    if (!previousNode) {
      return true;
    }

    if (
      hasNodePositionChanged(previousNode, nextNode) ||
      hasNodeDataChanged(previousNode, nextNode)
    ) {
      return true;
    }
  }

  return false;
};

// Helper function to check if edges have changed
const hasEdgesChanged = (previousEdges, nextEdges) => {
  if (previousEdges?.length !== nextEdges?.length) {
    return true;
  }

  if (!previousEdges || !nextEdges) {
    return false;
  }

  // Create a map for quick lookup
  const previousEdgesMap = new Map();
  for (const edge of previousEdges) {
    previousEdgesMap.set(edge.id, edge);
  }

  // Check each edge for changes
  for (const nextEdge of nextEdges) {
    const previousEdge = previousEdgesMap.get(nextEdge.id);

    if (!previousEdge) {
      return true; // New edge added
    }

    // Check if edge properties changed
    if (
      previousEdge.source !== nextEdge.source ||
      previousEdge.target !== nextEdge.target ||
      previousEdge.sourceHandle !== nextEdge.sourceHandle ||
      previousEdge.targetHandle !== nextEdge.targetHandle ||
      JSON.stringify(previousEdge.data) !== JSON.stringify(nextEdge.data)
    ) {
      return true;
    }
  }

  return false;
};

// Importar helpers externos para reducir tamaño
import { useMinimapColors } from './minimapColorsConfig.js';
import {
  createMinimapCore,
  createContainerProps,
  renderExpandedLabels,
  renderCollapsedIcon,
  createDrawMiniMap,
  createEmptyStateConfig,
  useValidationCallbacks,
  useEventHandlers,
  useExpandedLabelsComponent,
  useShouldShowEmptyState,
  useMinimapState,
  useMinimapDimensions,
  useMinimapData,
  useValidEdges,
  useMinimapViewport,
  useValidNodes,
  useDiagramBounds,
  useMinimapCore,
  useDrawMiniMapComplete,
  useMinimapUIElements,
  useMinimapConfigs,
} from './minimapCore.jsx';
import { createMinimapEventHandlers } from './minimapEventHandlers';
import { renderEdges, renderNodes, renderViewportIndicator } from './minimapHelpers.js';
import {
  filterAndSanitizeNodes,
  calculateDiagramBounds,
  validateDiagramBounds,
} from './minimapValidationHelpers.js';
import { renderConditionalMinimap } from './renderConditionalMinimap';

// OPTIMIZED: Dynamic viewport updates with aggressive throttling during drag
const useThrottledViewport = (viewport, _delay = 16, isExpanded = false) => {
  // Much more aggressive throttling: 200ms during drag (5 FPS), 50ms normally (20 FPS)
  const actualDelay = isExpanded ? 200 : 100;

  const [throttledViewport, setThrottledViewport] = useState(viewport);
  const lastUpdateRef = useRef(0);
  const lastViewportRef = useRef(viewport);
  const timeoutRef = useRef(undefined);
  const pendingUpdateRef = useRef(false);

  useEffect(() => {
    // Check if this is a significant change (zoom or large pan)
    const isSignificantChange =
      Math.abs(viewport.zoom - lastViewportRef.current.zoom) > 0.05 || // More tolerance for zoom
      Math.abs(viewport.x - lastViewportRef.current.x) > 50 || // More tolerance for pan
      Math.abs(viewport.y - lastViewportRef.current.y) > 50;

    const now = performance.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;

    // Only update if significant change OR enough time has passed
    if (isSignificantChange || timeSinceLastUpdate >= actualDelay) {
      // Clear any pending update
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = undefined;
      }

      // Update immediately for significant changes
      if (isSignificantChange) {
        setThrottledViewport(viewport);
        lastViewportRef.current = viewport;
        lastUpdateRef.current = now;
        pendingUpdateRef.current = false;
      } else if (!pendingUpdateRef.current) {
        // Schedule update for minor changes
        pendingUpdateRef.current = true;
        timeoutRef.current = setTimeout(() => {
          setThrottledViewport(viewport);
          lastViewportRef.current = viewport;
          lastUpdateRef.current = performance.now();
          pendingUpdateRef.current = false;
        }, actualDelay);
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = undefined;
      }
    };
  }, [viewport, actualDelay]);

  return throttledViewport;
};

// Hook consolidado para setup inicial
const useMinimapSetup = (props) => {
  const {
    nodes: propertyNodes,
    edges: propertyEdges,
    isExpanded: propertyIsExpanded,
    viewport: propertyViewport,
    isUltraMode: propertyIsUltraMode,
    toggleMiniMap,
  } = props;

  // RENDER TRACKING
  useRenderTracker('CustomMiniMap');

  // Throttled viewport with aggressive throttling to prevent excessive renders
  const throttledViewport = useThrottledViewport(propertyViewport, undefined, propertyIsExpanded); // Uses optimized delays from hook

  // ELITE OPTIMIZATION: Use granular selectors for minimap-specific data
  const {
    nodePositions,
    edges: storeEdges,
    selectedNodeId,
    isNodeBeingDragged,
  } = useEliteMiniMapSelectors();

  // Convert nodePositions Map to nodes array for compatibility
  const storeNodes = React.useMemo(() => {
    if (!nodePositions) return [];
    return [...nodePositions.entries()].map(([id, pos]) => ({
      id,
      position: { x: pos.x, y: pos.y },
      width: pos.width,
      height: pos.height,
      selected: id === selectedNodeId,
    }));
  }, [nodePositions, selectedNodeId]);

  // Process minimap data
  const minimapDataConfig = React.useMemo(
    () => ({
      propertyNodes,
      propertyEdges,
      storeNodes,
      storeEdges,
    }),
    [propertyNodes, propertyEdges, storeNodes, storeEdges],
  );
  const { nodes, edges } = useMinimapData(minimapDataConfig);

  // Viewport and refs
  const viewport = useMinimapViewport(throttledViewport, sanitizeViewport);
  const canvasReference = useRef();
  const containerReference = useRef();

  // State management
  const minimapState = useMinimapState(propertyIsExpanded);
  const { width, height, padding } = useMinimapDimensions(minimapState.isExpanded);
  const { nodeColors, edgeColors } = useMinimapColors();

  // Validation
  const validNodes = useValidNodes(nodes, filterAndSanitizeNodes);
  const validEdges = useValidEdges(edges);
  const { calculateDiagramBounds: calcDiagramBounds } = useValidationCallbacks({
    _calculateDiagramBounds: calculateDiagramBounds,
    _validateDiagramBounds: validateDiagramBounds,
  });
  const diagramBounds = useDiagramBounds(validNodes, calcDiagramBounds);

  return {
    viewport,
    canvasReference,
    containerReference,
    minimapState,
    width,
    height,
    padding,
    nodeColors,
    edgeColors,
    validNodes,
    validEdges,
    diagramBounds,
    propertyIsUltraMode,
    toggleMiniMap,
    isNodeBeingDragged, // CRITICAL: Pass drag state for throttling
  };
};

// Usar helper functions externas - reduce 140 líneas masivamente

/**
 * Componente CustomMiniMap - Minimapa optimizado para ReactFlow
 * Versión completamente revisada y optimizada para eliminar código redundante
 */
// Hook para configuración de eventos y core
const useMinimapHandlers = ({
  minimapState,
  viewport,
  diagramBounds,
  containerReference,
  toggleMiniMap,
  canvasReference,
  width,
  height,
  padding,
}) => {
  const {
    isExpanded,
    isDragging,
    setIsDragging,
    lastPosition,
    setLastPosition,
    setIsExpanded,
    setHasError,
  } = minimapState;

  const eventHandlerConfig = React.useMemo(
    () => ({
      isExpanded,
      containerReference,
      setIsDragging,
      setLastPosition,
      isDragging,
      lastPosition,
      viewport,
      diagramBounds,
      validateDiagramBounds,
      setIsExpanded,
      toggleMiniMap,
      createMinimapEventHandlers,
    }),
    [
      isExpanded,
      containerReference,
      isDragging,
      lastPosition,
      viewport,
      diagramBounds,
      setIsExpanded,
      setIsDragging,
      setLastPosition,
      toggleMiniMap,
    ],
  );

  const eventHandlers = useEventHandlers(eventHandlerConfig);

  const coreConfig = React.useMemo(
    () => ({
      canvasReference,
      width,
      height,
      padding,
      diagramBounds,
      isExpanded,
      createMinimapCoreFunction: createMinimapCore,
      renderEdges,
      renderNodes,
      renderViewportIndicator,
      setHasError,
      createDrawMinimapFunction: createDrawMiniMap,
    }),
    [canvasReference, width, height, padding, diagramBounds, isExpanded, setHasError],
  );

  const { drawMiniMapFunction } = useMinimapCore(coreConfig);

  return { eventHandlers, drawMiniMapFunction };
};

const CustomMiniMapComponent = React.memo(
  (props) => {
    // Use consolidated setup hook
    const {
      viewport,
      canvasReference,
      containerReference,
      minimapState,
      width,
      height,
      padding,
      nodeColors,
      edgeColors,
      validNodes,
      validEdges,
      diagramBounds,
      propertyIsUltraMode,
      toggleMiniMap,
      isNodeBeingDragged, // CRITICAL: Get drag state from store
    } = useMinimapSetup(props);

    // Destructure state from minimapState
    const {
      isDragging,
      canvasReady,
      setCanvasReady,
      isExpanded,
      hasError,
      setHasError,
      setIsExpanded,
    } = minimapState;

    // Use handlers hook
    const { eventHandlers, drawMiniMapFunction } = useMinimapHandlers({
      minimapState,
      viewport,
      diagramBounds,
      containerReference,
      toggleMiniMap,
      canvasReference,
      width,
      height,
      padding,
    });

    const { handleToggle } = eventHandlers;

    // APPLE-LEVEL: Skip renders aggressively during drag
    const shouldSkipRender = React.useMemo(() => {
      return shouldSkipRenderByThrottle(16, isExpanded, isNodeBeingDragged);
    }, [isExpanded, isNodeBeingDragged]);

    // OPTIMIZED: Throttle draw operations to reduce render frequency
    const drawConfig = React.useMemo(
      () => ({
        drawMiniMapFunction,
        validNodes,
        validEdges,
        isExpanded,
        width,
        height,
        viewport,
        nodeColors,
        edgeColors,
        propertyIsUltraMode,
        canvasReference,
        canvasReady,
        setCanvasReady,
        shouldSkipRender, // Pass throttle flag to draw hook
      }),
      [
        drawMiniMapFunction,
        validNodes,
        validEdges,
        isExpanded,
        width,
        height,
        viewport,
        nodeColors,
        edgeColors,
        propertyIsUltraMode,
        canvasReference,
        canvasReady,
        setCanvasReady,
        shouldSkipRender,
      ],
    );

    // Use the draw hook normally (it will handle throttling internally)
    useDrawMiniMapComplete(drawConfig);

    // Usar hook ultra-final consolidado para UI elements - reduce 7+ líneas ULTRA-FINALES
    const { collapsedIconComponent } = useMinimapUIElements({
      containerReference,
      isExpanded,
      toggleMiniMap,
      eventHandlers,
      renderCollapsedIcon,
    });

    // Hook ultra-final consolidado para configs - reduce 8+ líneas ULTRA-FINALES
    const { emptyStateConfig, containerProps } = useMinimapConfigs({
      isExpanded,
      hasError,
      handleToggle,
      setHasError,
      setIsExpanded,
      createEmptyStateConfigFunction: createEmptyStateConfig,
      containerReference,
      isDragging,
      createContainerPropsFunction: createContainerProps,
    });

    // Hooks consolidados finales
    const expandedLabelsComponent = useExpandedLabelsComponent({
      isDragging,
      renderExpandedLabelsFunction: renderExpandedLabels,
    });
    const shouldShowEmptyState = useShouldShowEmptyState({
      hasError,
      validNodes,
    });

    // Usar helper externo para renderizado condicional completo - reduce 18 líneas
    return renderConditionalMinimap({
      shouldShowEmptyState,
      emptyStateConfig,
      hasError,
      isExpanded,
      containerProps,
      canvasReference,
      width,
      height,
      expandedLabelsComponent,
      collapsedIconComponent,
    });
  },
  (previousProps, nextProps) => {
    // OPTIMIZED: Dynamic throttling based on expansion state
    if (shouldSkipRenderByThrottle(16, nextProps.isExpanded)) {
      return true; // Skip render (props are "equal")
    }

    // Check for function reference changes
    if (previousProps.toggleMiniMap !== nextProps.toggleMiniMap) {
      return false;
    }

    // Check for primitive changes
    if (
      previousProps.isExpanded !== nextProps.isExpanded ||
      previousProps.isUltraMode !== nextProps.isUltraMode
    ) {
      return false;
    }

    // Check viewport changes with tolerance
    if (hasViewportChanged(previousProps.viewport, nextProps.viewport)) {
      return false;
    }

    // Check for node changes
    if (hasNodesChanged(previousProps.nodes, nextProps.nodes)) {
      return false;
    }

    // Check edges for changes - return true if edges are the same
    return previousProps.edges?.length === nextProps.edges?.length;
  },
);

CustomMiniMapComponent.displayName = 'CustomMiniMapComponent';

CustomMiniMapComponent.propTypes = CustomMinimapPropertyTypes;

// APPLE-LEVEL OPTIMIZATION: Smooth real-time updates with smart memoization
// HYPER-INTELLIGENT MINIMAP OPTIMIZATION
const minimapRenderTiming = {
  lastRender: 0,
  lastViewport: undefined,
  renderCount: 0,
};

// Helper functions to reduce complexity
const shouldUpdateForCriticalChanges = (previousProps, nextProps, now) => {
  if (previousProps.isExpanded !== nextProps.isExpanded) {
    minimapRenderTiming.lastRender = now;
    return true;
  }

  if (previousProps.width !== nextProps.width || previousProps.height !== nextProps.height) {
    minimapRenderTiming.lastRender = now;
    return true;
  }

  if (previousProps.padding !== nextProps.padding) {
    minimapRenderTiming.lastRender = now;
    return true;
  }

  return false;
};

const shouldUpdateForViewport = (previousProps, nextProps, timeSinceLastRender, now) => {
  const viewportChanged = hasViewportChanged(previousProps.viewport, nextProps.viewport, 2, 0.02);
  if (!viewportChanged) return false;

  const throttleTime = nextProps.isExpanded ? 33 : 100;
  if (timeSinceLastRender < throttleTime) {
    return false; // Skip this render
  }
  minimapRenderTiming.lastRender = now;
  return true;
};

const checkNodesStructurallyChanged = (previousNodes, nextNodes) => {
  if (previousNodes?.length !== nextNodes?.length) return true;

  return previousNodes?.some(
    (node, index) =>
      // eslint-disable-next-line security/detect-object-injection
      node.id !== nextNodes[index]?.id ||
      // eslint-disable-next-line security/detect-object-injection
      node.type !== nextNodes[index]?.type,
  );
};

const shouldUpdateForNodeMovement = (previousProps, nextProps, timeSinceLastRender, now) => {
  const hasNodeMovement = previousProps.nodes?.some((node, index) => {
    // eslint-disable-next-line security/detect-object-injection
    const nextNode = nextProps.nodes[index];
    if (!nextNode) return false;
    return hasNodePositionChanged(node, nextNode);
  });

  if (!hasNodeMovement) return false;

  const throttleTime = nextProps.isExpanded ? 50 : 100;
  if (timeSinceLastRender < throttleTime) {
    return false; // Skip this render
  }
  minimapRenderTiming.lastRender = now;
  return true;
};

const CustomMiniMapOptimized = React.memo(CustomMiniMapComponent, (previousProps, nextProps) => {
  const now = Date.now();
  const timeSinceLastRender = now - minimapRenderTiming.lastRender;

  // Critical prop changes - always re-render
  if (shouldUpdateForCriticalChanges(previousProps, nextProps, now)) {
    return false;
  }

  // INTELLIGENT VIEWPORT THROTTLING
  if (shouldUpdateForViewport(previousProps, nextProps, timeSinceLastRender, now)) {
    return false;
  }

  // NODE CHANGES - Check structural changes only
  if (checkNodesStructurallyChanged(previousProps.nodes, nextProps.nodes)) {
    minimapRenderTiming.lastRender = now;
    return false;
  }

  // NODE POSITION CHANGES - Throttle aggressively
  if (shouldUpdateForNodeMovement(previousProps, nextProps, timeSinceLastRender, now)) {
    return false;
  }

  // EDGE CHANGES - Only structural
  if (hasEdgesChanged(previousProps.edges, nextProps.edges)) {
    minimapRenderTiming.lastRender = now;
    return false;
  }

  // Skip render - no significant changes
  return true;
});

CustomMiniMapOptimized.displayName = 'CustomMiniMapOptimized';

// Export the optimized component
export default CustomMiniMapOptimized;
