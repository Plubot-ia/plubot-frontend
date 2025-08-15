/**
 * Core functions para CustomMiniMap.jsx
 * Extraídas para reducir tamaño de función principal
 */
import React, { useMemo, useCallback, useEffect, useState } from 'react';

/**
 * Crea las funciones de setup y canvas para el minimap
 */
export const createMinimapCore = ({
  canvasReference,
  width,
  height,
  padding,
  diagramBounds,
  isExpanded,
}) => {
  const setupCanvas = () => {
    if (!canvasReference.current || !diagramBounds) {
      return;
    }

    // CRÍTICO: En modo colapsado, limpiar canvas pero no dibujar
    if (!isExpanded) {
      const canvas = canvasReference.current;
      if (canvas) {
        const context = canvas.getContext('2d');
        if (context) {
          context.clearRect(0, 0, width, height);
        }
      }
      return; // No retornar context para evitar dibujo
    }

    const canvas = canvasReference.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = width;
    canvas.height = height;

    // Clear canvas and draw background
    context.clearRect(0, 0, width, height);
    context.fillStyle = 'rgba(15, 20, 25, 0.8)';
    context.fillRect(0, 0, width, height);

    // Draw border
    context.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    context.lineWidth = 1;
    context.strokeRect(0, 0, width, height);

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';

    return context;
  };

  const calculateScaleAndDimensions = () => {
    const diagramWidth = Math.max(diagramBounds.maxX - diagramBounds.minX, 1);
    const diagramHeight = Math.max(diagramBounds.maxY - diagramBounds.minY, 1);
    const scaleX = (width - 2 * padding) / diagramWidth;
    const scaleY = (height - 2 * padding) / diagramHeight;
    const scale = Math.min(scaleX, scaleY);

    return {
      diagramWidth,
      diagramHeight,
      scaleX,
      scaleY,
      scale,
    };
  };

  return {
    setupCanvas,
    calculateScaleAndDimensions,
  };
};

/**
 * Renderiza el estado vacío/error del minimap
 */
export const renderEmptyState = ({ isExpanded, hasError, handleToggle, handleResetClick }) => {
  const containerClassName = `ts-custom-minimap-container ${
    isExpanded ? 'expanded' : 'collapsed'
  } ${hasError ? 'error' : ''}`;

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggle();
    }
  };

  return {
    containerClassName,
    handleKeyDown,
    renderExpandedLabels: () => (
      <div className='ts-minimap-labels'>
        <span className='ts-minimap-title'>Vista general</span>
        {hasError && (
          <button
            type='button'
            className='ts-minimap-reset'
            onClick={handleResetClick}
            aria-label='Reiniciar minimapa'
          >
            ⟲
          </button>
        )}
      </div>
    ),
    renderCollapsedIcon: () => (
      <div className='ts-minimap-icon' aria-label='Minimapa'>
        📍
      </div>
    ),
  };
};

/**
 * Custom hook para manejar la creación de core helpers del minimapa
 */
export const useCoreHelpers = ({
  canvasReference,
  width,
  height,
  padding,
  diagramBounds,
  isExpanded,
  createMinimapCoreFunction,
}) => {
  const coreHelpers = useMemo(
    () =>
      createMinimapCoreFunction({
        canvasReference,
        width,
        height,
        padding,
        diagramBounds,
        isExpanded,
      }),
    [canvasReference, width, height, padding, diagramBounds, isExpanded, createMinimapCoreFunction],
  );

  return coreHelpers;
};

/**
 * Custom hook para manejar la creación de drawMiniMapFunction del minimapa
 */
export const useDrawMiniMapFunction = ({
  setupCanvas,
  calculateScaleAndDimensions,
  diagramBounds,
  padding,
  renderEdges,
  renderNodes,
  renderViewportIndicator,
  setHasError,
  createDrawMinimapFunction,
}) => {
  const drawMiniMapFunction = useMemo(
    () =>
      createDrawMinimapFunction({
        setupCanvas,
        calculateScaleAndDimensions,
        diagramBounds,
        padding,
        renderEdges,
        renderNodes,
        renderViewportIndicator,
        setHasError,
      }),
    [
      setupCanvas,
      calculateScaleAndDimensions,
      diagramBounds,
      padding,
      renderEdges,
      renderNodes,
      renderViewportIndicator,
      setHasError,
      createDrawMinimapFunction,
    ],
  );

  return drawMiniMapFunction;
};

/**
 * Custom hook para manejar la creación de drawMiniMap useCallback del minimapa
 */
export const useDrawMiniMap = ({
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
}) => {
  const drawMiniMap = useCallback(() => {
    drawMiniMapFunction({
      validNodes,
      validEdges,
      isExpanded,
      width,
      height,
      viewport,
      nodeColors,
      edgeColors,
      propertyIsUltraMode,
    });
  }, [
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
  ]);

  return drawMiniMap;
};

/**
 * Custom hook para manejar el useEffect de drawMiniMap del minimapa
 */
export const useDrawMiniMapEffect = ({
  canvasReference,
  drawMiniMap,
  canvasReady,
  setCanvasReady,
  viewport,
  isExpanded,
}) => {
  // Use requestAnimationFrame for smoother updates
  useEffect(() => {
    if (!canvasReference.current) return;

    let animationFrameId;

    const performDraw = () => {
      try {
        if (canvasReference.current) {
          drawMiniMap();
          if (!canvasReady && setCanvasReady) {
            setCanvasReady(true);
          }
        }
      } catch {}
    };

    // Use RAF for smoother rendering, especially in expanded mode
    if (isExpanded) {
      // Debounce drawing in expanded mode to reduce CPU load
      animationFrameId = requestAnimationFrame(performDraw);
    } else {
      // Direct draw for collapsed mode (smaller canvas)
      performDraw();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [
    drawMiniMap,
    canvasReady,
    viewport?.x,
    viewport?.y,
    viewport?.zoom,
    setCanvasReady,
    canvasReference,
    isExpanded,
  ]);
};

/**
 * Custom hook para manejar la creación de emptyStateConfig del minimapa
 */
export const useEmptyStateConfig = ({
  isExpanded,
  hasError,
  handleToggle,
  setHasError,
  setIsExpanded,
  createEmptyStateConfigFunction,
}) => {
  const emptyStateConfig = useMemo(
    () =>
      createEmptyStateConfigFunction({
        isExpanded,
        hasError,
        handleToggle,
        setHasError,
        setIsExpanded,
      }),
    [
      isExpanded,
      hasError,
      handleToggle,
      setHasError,
      setIsExpanded,
      createEmptyStateConfigFunction,
    ],
  );

  return emptyStateConfig;
};

/**
 * Custom hook para manejar la creación de containerProps del minimapa
 */
export const useContainerProps = ({
  containerReference,
  isExpanded,
  isDragging,
  handleToggle,
  createContainerPropsFunction,
}) => {
  const containerProps = useMemo(
    () =>
      createContainerPropsFunction({
        containerReference,
        isExpanded,
        isDragging,
        handleToggle,
      }),
    [containerReference, isExpanded, isDragging, handleToggle, createContainerPropsFunction],
  );

  return containerProps;
};

/**
 * Custom hook para manejar la creación de expandedLabelsComponent del minimapa
 */
export const useExpandedLabelsComponent = ({ isDragging, renderExpandedLabelsFunction }) => {
  const expandedLabelsComponent = useMemo(
    () => renderExpandedLabelsFunction({ isDragging }),
    [isDragging, renderExpandedLabelsFunction],
  );

  return expandedLabelsComponent;
};

/**
 * Custom hook masivo para operaciones core del minimapa
 */
export const useMinimapCore = ({
  canvasReference,
  width,
  height,
  padding,
  diagramBounds,
  isExpanded,
  createMinimapCoreFunction,
  _setupCanvas,
  _calculateScaleAndDimensions,
  renderEdges,
  renderNodes,
  renderViewportIndicator,
  setHasError,
  createDrawMinimapFunction,
}) => {
  // Core helpers
  const coreHelpers = useCoreHelpers({
    canvasReference,
    width,
    height,
    padding,
    diagramBounds,
    isExpanded,
    createMinimapCoreFunction,
  });

  const { setupCanvas: coreSetupCanvas, calculateScaleAndDimensions: coreCalculateScale } =
    coreHelpers;

  // DrawMiniMapFunction
  const drawMiniMapFunction = useDrawMiniMapFunction({
    setupCanvas: coreSetupCanvas,
    calculateScaleAndDimensions: coreCalculateScale,
    diagramBounds,
    padding,
    renderEdges,
    renderNodes,
    renderViewportIndicator,
    setHasError,
    createDrawMinimapFunction,
  });

  return {
    coreHelpers,
    setupCanvas: coreSetupCanvas,
    calculateScaleAndDimensions: coreCalculateScale,
    drawMiniMapFunction,
  };
};

/**
 * Custom hook final consolidado para drawMiniMap completo (drawMiniMap + Effect)
 */
export const useDrawMiniMapComplete = ({
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
  shouldSkipRender, // APPLE-LEVEL: Throttle flag
}) => {
  // Usar custom hook para drawMiniMap
  const drawMiniMap = useDrawMiniMap({
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
  });

  // Usar custom hook para useEffect drawMiniMap
  useDrawMiniMapEffect({
    canvasReference,
    drawMiniMap,
    canvasReady,
    isExpanded,
    shouldSkipRender, // Pass throttle flag
  });

  return { drawMiniMap };
};

/**
 * Hook personalizado para manejar event listeners del minimapa
 */
export const useMinimapEventListeners = ({
  containerReference,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
}) => {
  useEffect(() => {
    const container = containerReference.current;
    if (!container) return;

    container.addEventListener('mousedown', handleMouseDown);
    globalThis.addEventListener('mousemove', handleMouseMove);
    globalThis.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      globalThis.removeEventListener('mousemove', handleMouseMove);
      globalThis.removeEventListener('mouseup', handleMouseUp);
    };
  }, [containerReference, handleMouseDown, handleMouseMove, handleMouseUp]);
};

/**
 * Hook ultra-final consolidado para configs (emptyStateConfig + containerProps)
 */
export const useMinimapConfigs = ({
  isExpanded,
  hasError,
  handleToggle,
  setHasError,
  setIsExpanded,
  createEmptyStateConfigFunction,
  containerReference,
  isDragging,
  createContainerPropsFunction,
}) => {
  // Usar custom hook para empty state config
  const emptyStateConfig = useEmptyStateConfig({
    isExpanded,
    hasError,
    handleToggle,
    setHasError,
    setIsExpanded,
    createEmptyStateConfigFunction,
  });

  // Usar custom hook para container props
  const containerProps = useContainerProps({
    containerReference,
    isExpanded,
    isDragging,
    handleToggle,
    createContainerPropsFunction,
  });

  return { emptyStateConfig, containerProps };
};

/**
 * Custom hook ultra-final consolidado para UI elements (event listeners + collapsed icon)
 */
export const useMinimapUIElements = ({
  containerReference,
  _isExpanded,
  _toggleMiniMap,
  eventHandlers,
  renderCollapsedIcon,
}) => {
  // Usar hook externo para event listeners
  useMinimapEventListeners({
    containerReference,
    handleMouseDown: eventHandlers.handleMouseDown,
    handleMouseMove: eventHandlers.handleMouseMove,
    handleMouseUp: eventHandlers.handleMouseUp,
  });

  // Usar custom hook para collapsed icon component
  const collapsedIconComponent = useMemo(
    () => renderCollapsedIcon && renderCollapsedIcon(),
    [renderCollapsedIcon],
  );

  return { collapsedIconComponent };
};

/**
 * Custom hook para collapsed icon component
 */
export const useCollapsedIconComponent = (renderCollapsedIcon) => {
  const collapsedIconComponent = useMemo(() => renderCollapsedIcon(), [renderCollapsedIcon]);
  return collapsedIconComponent;
};

/**
 * Custom hook para resetear estado de error cuando cambia isExpanded
 */
export const useErrorStateReset = (isExpanded, setHasError) => {
  useEffect(() => {
    // Reset error state when expanded state changes
    setHasError(false);
  }, [isExpanded, setHasError]);
};

/**
 * Custom hook para calcular límites del diagrama
 */
export const useDiagramBounds = (validNodes, calcDiagramBounds) => {
  const diagramBounds = useMemo(
    () => calcDiagramBounds(validNodes),
    [validNodes, calcDiagramBounds],
  );
  return diagramBounds;
};

/**
 * Custom hook para procesar nodos válidos del minimapa
 */
export const useValidNodes = (nodes, filterAndSanitizeNodes) => {
  const validNodes = useMemo(() => filterAndSanitizeNodes(nodes), [nodes, filterAndSanitizeNodes]);
  return validNodes;
};

/**
 * Custom hook para procesar viewport sanitizado del minimapa
 */
export const useMinimapViewport = (propertyViewport, sanitizeViewport) => {
  // Sanitizar el viewport para evitar valores NaN o Infinity
  const viewport = sanitizeViewport(propertyViewport || { x: 0, y: 0, zoom: 1 });

  return viewport;
};

/**
 * Custom hook para procesar aristas válidas del minimapa
 */
export const useValidEdges = (edges) => {
  const validEdges = useMemo(() => {
    if (!edges || !Array.isArray(edges)) return [];
    return edges.filter((edge) => edge && edge.source && edge.target);
  }, [edges]);

  return validEdges;
};

/**
 * Custom hook para procesar datos de nodos y aristas del minimapa
 */
export const useMinimapData = ({ propertyNodes, propertyEdges, storeNodes, storeEdges }) => {
  // Preferir props sobre store (para mayor flexibilidad)
  const nodes = useMemo(
    () => (propertyNodes?.length ? propertyNodes : (storeNodes ?? [])),
    [propertyNodes, storeNodes],
  );

  const edges = useMemo(
    () => (propertyEdges?.length ? propertyEdges : (storeEdges ?? [])),
    [propertyEdges, storeEdges],
  );

  return { nodes, edges };
};

/**
 * Custom hook para configuraciones de dimensiones del minimapa
 */
export const useMinimapDimensions = (isExpanded) => {
  const width = isExpanded ? 180 : 45;
  const height = isExpanded ? 180 : 45;
  const padding = isExpanded ? 12 : 5;

  return { width, height, padding };
};

/**
 * Custom hook para manejar el estado del minimapa
 */
export const useMinimapState = (propertyIsExpanded) => {
  const [isDragging, setIsDragging] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
  const [isExpanded, setIsExpanded] = useState(propertyIsExpanded ?? false);
  const [hasError, setHasError] = useState(false);

  return {
    isDragging,
    setIsDragging,
    canvasReady,
    setCanvasReady,
    lastPosition,
    setLastPosition,
    isExpanded,
    setIsExpanded,
    hasError,
    setHasError,
  };
};

/**
 * Custom hook para determinar si debe mostrar estado vacío del minimapa
 */
export const useShouldShowEmptyState = ({ hasError, validNodes }) => {
  const shouldShowEmptyState = useMemo(
    () => hasError || !validNodes || validNodes.length === 0,
    [hasError, validNodes],
  );

  return shouldShowEmptyState;
};

/**
 * Custom hook para manejar la creación de event handlers del minimapa
 */
export const useEventHandlers = ({
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
}) => {
  const eventHandlers = useMemo(
    () =>
      createMinimapEventHandlers({
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
      }),
    [
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
    ],
  );

  return eventHandlers;
};

/**
 * Custom hook para los callbacks de validación del minimapa
 */
export const useValidationCallbacks = ({ _calculateDiagramBounds, _validateDiagramBounds }) => {
  const calculateDiagramBounds = useCallback(
    (nodeList) => _calculateDiagramBounds(nodeList),
    [_calculateDiagramBounds],
  );

  const validateDiagramBounds = useCallback(
    (bounds) => _validateDiagramBounds(bounds),
    [_validateDiagramBounds],
  );

  return { calculateDiagramBounds, validateDiagramBounds };
};

/**
 * Crea la configuración del estado vacío del minimapa
 */
export const createEmptyStateConfig = ({
  isExpanded,
  hasError,
  handleToggle,
  setHasError,
  setIsExpanded,
}) => {
  return renderEmptyState({
    isExpanded,
    hasError,
    handleToggle,
    handleResetClick: (event_) => {
      event_.stopPropagation();
      setHasError(false);
      setIsExpanded(false);
    },
  });
};

/**
 * Crea la función drawMiniMap para el minimapa
 */
export const createDrawMiniMap = ({
  setupCanvas,
  calculateScaleAndDimensions,
  diagramBounds,
  padding,
  renderEdges,
  renderNodes,
  renderViewportIndicator,
  setHasError,
}) => {
  return ({
    validNodes,
    validEdges,
    isExpanded,
    width,
    height,
    viewport,
    nodeColors,
    edgeColors,
    propertyIsUltraMode,
  }) => {
    try {
      const context = setupCanvas();
      if (!context) return;

      // Performance optimizations for expanded mode
      if (isExpanded) {
        // Disable expensive operations for better performance
        context.imageSmoothingEnabled = false;
        context.imageSmoothingQuality = 'low';

        // Use willReadFrequently hint for better performance
        if (context.canvas) {
          context.canvas.style.willChange = 'transform';
        }
      } else {
        // Better quality for collapsed mode (smaller canvas)
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
      }

      const { scale, scaleX, scaleY } = calculateScaleAndDimensions();
      const transformX = (x) => (x - diagramBounds.minX) * scale + padding;
      const transformY = (y) => (y - diagramBounds.minY) * scale + padding;
      const transforms = { transformX, transformY, scaleX, scaleY };

      // Save context state for better performance
      context.save();

      // Usar helpers externos para rendering
      renderEdges({
        context,
        validEdges,
        validNodes,
        transforms,
        edgeColors,
        isExpanded,
        isUltraMode: propertyIsUltraMode,
      });

      renderNodes({
        context,
        validNodes,
        transforms,
        nodeColors,
        isExpanded,
        isUltraMode: propertyIsUltraMode,
      });

      // Restore context before viewport indicator
      context.restore();

      renderViewportIndicator({
        context,
        viewport,
        diagramBounds,
        canvasRect: {
          padding,
          drawWidth: width - 2 * padding,
          drawHeight: height - 2 * padding,
        },
        isExpanded,
        isUltraMode: propertyIsUltraMode,
      });
    } catch {
      setHasError(true);
    }
  };
};

/**
 * Renderiza el icono colapsado del minimapa con SVG
 */
export const renderCollapsedIcon = () => (
  <div
    className='ts-minimap-icon'
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '4px',
    }}
  >
    <svg
      width='10'
      height='10'
      viewBox='0 0 12 12'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <circle cx='2' cy='2' r='1.5' fill='#888888' />
      <circle cx='6' cy='2' r='1.5' fill='#AAAAAA' />
      <circle cx='10' cy='2' r='1.5' fill='#888888' />
      <circle cx='2' cy='6' r='1.5' fill='#AAAAAA' />
      <circle cx='6' cy='6' r='1.5' fill='#CCCCCC' />
      <circle cx='10' cy='6' r='1.5' fill='#AAAAAA' />
      <circle cx='2' cy='10' r='1.5' fill='#888888' />
      <circle cx='6' cy='10' r='1.5' fill='#AAAAAA' />
      <circle cx='10' cy='10' r='1.5' fill='#888888' />
    </svg>
    <svg
      width='16'
      height='16'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <path
        d='M15 3H21V9'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M9 21H3V15'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M21 3L14 10'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M3 21L10 14'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  </div>
);

/**
 * Renderiza las etiquetas expandidas del minimapa
 */
export const renderExpandedLabels = ({ isDragging }) => (
  <div className='ts-minimap-labels'>
    <div className='ts-minimap-title'>Minimapa</div>
    {!isDragging && <div className='ts-minimap-hint'>Clic para colapsar</div>}
    {isDragging && <div className='ts-minimap-hint active'>Arrastrando...</div>}
  </div>
);

/**
 * Crea las props del container según el estado de dragging
 */
export const createContainerProps = ({
  containerReference,
  isExpanded,
  isDragging,
  handleToggle,
}) => {
  const baseProps = {
    ref: containerReference,
    className: `ts-custom-minimap-container ${isExpanded ? 'expanded' : 'collapsed'} ${isDragging ? 'dragging' : ''}`,
  };

  if (isDragging) {
    return {
      ...baseProps,
      onClick: undefined,
      onKeyDown: undefined,
      role: undefined,
      tabIndex: -1,
    };
  }

  return {
    ...baseProps,
    onClick: handleToggle,
    onKeyDown: (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleToggle();
      }
    },
    role: 'button',
    tabIndex: 0,
  };
};

/**
 * Crea la función principal de dibujo del minimap
 */
export const createDrawFunction = ({
  setupCanvas,
  calculateScaleAndDimensions,
  diagramBounds,
  padding,
  renderEdges,
  renderNodes,
  renderViewportIndicator,
  setHasError,
}) => {
  return (params) => {
    try {
      const context = setupCanvas();
      if (!context) return;

      const { scale, scaleX, scaleY } = calculateScaleAndDimensions();
      const transformX = (x) => (x - diagramBounds.minX) * scale + padding;
      const transformY = (y) => (y - diagramBounds.minY) * scale + padding;
      const transforms = { transformX, transformY, scaleX, scaleY };

      // Usar helpers externos para rendering
      renderEdges({
        context,
        ...params.edgeParams,
        transforms,
      });

      renderNodes({
        context,
        ...params.nodeParams,
        transforms,
      });

      renderViewportIndicator({
        context,
        ...params.viewportParams,
      });
    } catch {
      setHasError(true);
    }
  };
};
