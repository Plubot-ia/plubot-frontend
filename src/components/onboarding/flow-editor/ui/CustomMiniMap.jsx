import PropTypes from 'prop-types';
import { useRef, useEffect, useState, useCallback, useMemo } from 'react';

import { useFlowNodesEdges } from '@/stores/selectors';

import './CustomMiniMap.css';
// Importar el sanitizador para prevenir errores con valores no finitos
import {
  sanitizeViewport,
  sanitizeBounds,
  sanitizeNode,
  sanitizeNumber,
} from './minimap-sanitizer';

/**
 * Helper para validar si un nodo tiene posición y dimensiones válidas
 * @param {Object} node - Nodo a validar
 * @returns {boolean} True si el nodo es válido
 */
const _isValidNode = (node) => {
  if (
    !node ||
    !node.position ||
    !Number.isFinite(node.position.x) ||
    !Number.isFinite(node.position.y)
  ) {
    return false;
  }
  return (
    node &&
    node.position &&
    typeof node.position.x === 'number' &&
    typeof node.position.y === 'number' &&
    !Number.isNaN(node.position.x) &&
    !Number.isNaN(node.position.y)
  );
};

/**
 * Helper para filtrar y sanitizar nodos válidos
 * @param {Array} nodes - Lista de nodos
 * @returns {Array} Lista de nodos válidos y sanitizados
 */
const _filterAndSanitizeNodes = (nodes) => {
  if (!nodes || !Array.isArray(nodes)) return [];

  return nodes
    .filter((node) => _isValidNode(node))
    .map((node) => sanitizeNode(node));
};

/**
 * Helper para calcular los límites del diagrama
 * @param {Array} nodeList - Lista de nodos válidos
 * @returns {Object} Límites del diagrama con centro calculado
 */
const _calculateDiagramBounds = (nodeList) => {
  if (!nodeList || nodeList.length === 0) {
    return {
      minX: 0,
      maxX: 100,
      minY: 0,
      maxY: 100,
      centerX: 50,
      centerY: 50,
    };
  }

  try {
    const bounds = {
      minX: Infinity,
      maxX: -Infinity,
      minY: Infinity,
      maxY: -Infinity,
    };

    for (const node of nodeList) {
      const nodeX = sanitizeNumber(node.position.x, 0);
      const nodeY = sanitizeNumber(node.position.y, 0);
      const nodeWidth = sanitizeNumber(node.width, 150);
      const nodeHeight = sanitizeNumber(node.height, 40);

      bounds.minX = Math.min(bounds.minX, nodeX);
      bounds.maxX = Math.max(bounds.maxX, nodeX + nodeWidth);
      bounds.minY = Math.min(bounds.minY, nodeY);
      bounds.maxY = Math.max(bounds.maxY, nodeY + nodeHeight);
    }

    if (bounds.minX === bounds.maxX) {
      bounds.minX -= 50;
      bounds.maxX += 50;
    }
    if (bounds.minY === bounds.maxY) {
      bounds.minY -= 50;
      bounds.maxY += 50;
    }

    const diagramWidth = bounds.maxX - bounds.minX;
    const diagramHeight = bounds.maxY - bounds.minY;
    const centerX = bounds.minX + diagramWidth / 2;
    const centerY = bounds.minY + diagramHeight / 2;

    const margin = Math.max(30, Math.min(diagramWidth, diagramHeight) * 0.1);
    bounds.minX = centerX - (diagramWidth / 2 + margin);
    bounds.maxX = centerX + (diagramWidth / 2 + margin);
    bounds.minY = centerY - (diagramHeight / 2 + margin);
    bounds.maxY = centerY + (diagramHeight / 2 + margin);

    return sanitizeBounds({ ...bounds, centerX, centerY });
  } catch {
    return {
      minX: 0,
      maxX: 100,
      minY: 0,
      maxY: 100,
      centerX: 50,
      centerY: 50,
    };
  }
};

// Helper: Validar tipos de coordenadas
const _hasValidCoordinateTypes = (bounds) => {
  return (
    typeof bounds.minX === 'number' &&
    typeof bounds.maxX === 'number' &&
    typeof bounds.minY === 'number' &&
    typeof bounds.maxY === 'number'
  );
};

// Helper: Validar que las coordenadas no sean NaN
const _hasValidCoordinateValues = (bounds) => {
  return (
    !Number.isNaN(bounds.minX) &&
    !Number.isNaN(bounds.maxX) &&
    !Number.isNaN(bounds.minY) &&
    !Number.isNaN(bounds.maxY)
  );
};

// Helper: Validar lógica de límites
const _hasValidBoundsLogic = (bounds) => {
  return bounds.minX < bounds.maxX && bounds.minY < bounds.maxY;
};

/**
 * Helper para validar límites del diagrama
 * @param {Object} bounds - Límites del diagrama a validar
 * @returns {boolean} True si los límites son válidos
 */
const _validateDiagramBounds = (bounds) => {
  if (!bounds) return false;

  return (
    _hasValidCoordinateTypes(bounds) &&
    _hasValidCoordinateValues(bounds) &&
    _hasValidBoundsLogic(bounds)
  );
};

/**
 * Componente CustomMiniMap - Minimapa optimizado para ReactFlow
 * Versión completamente revisada y optimizada para eliminar código redundante
 */
const CustomMiniMap = ({
  nodes: propertyNodes,
  edges: propertyEdges,
  isExpanded: propertyIsExpanded,
  toggleMiniMap,
  viewport: propertyViewport,
  isUltraMode: propertyIsUltraMode,
}) => {
  // Configuraciones del minimapa - definidas a nivel de componente

  // Obtener datos del store o usar los proporcionados por props
  // Obtener datos del store usando selectores granulares
  const { nodes: storeNodes, edges: storeEdges } = useFlowNodesEdges();

  // Preferir props sobre store (para mayor flexibilidad)
  const nodes = useMemo(
    () => (propertyNodes?.length ? propertyNodes : storeNodes || []),
    [propertyNodes, storeNodes],
  );
  const edges = useMemo(
    () => (propertyEdges?.length ? propertyEdges : storeEdges || []),
    [propertyEdges, storeEdges],
  );

  // Sanitizar el viewport para evitar valores NaN o Infinity
  const viewport = sanitizeViewport(
    propertyViewport || { x: 0, y: 0, zoom: 1 },
  );
  const canvasReference = useRef();
  const containerReference = useRef();
  const [isDragging, setIsDragging] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
  const [isExpanded, setIsExpanded] = useState(propertyIsExpanded || false);
  const [hasError, setHasError] = useState(false);

  // Función para alternar expansión
  const handleToggle = useCallback(() => {
    setIsExpanded((previous) => !previous);
    if (toggleMiniMap) toggleMiniMap();
  }, [toggleMiniMap]);

  // Configuraciones del minimapa
  const width = isExpanded ? 180 : 45;
  const height = isExpanded ? 180 : 45;
  const padding = isExpanded ? 12 : 5;

  // Mapa de colores para nodos y conexiones
  const nodeColors = useMemo(
    () => ({
      start: '#4facfe',
      end: '#ff6b6b',
      message: '#5139b3',
      decision: '#feca57',
      action: '#a55eea',
      option: '#48dbfb',
    }),
    [],
  );

  const edgeColors = useMemo(
    () => ({
      default: '#00e0ff',
      success: '#00ff9d',
      warning: '#ffb700',
      danger: '#ff2e5b',
    }),
    [],
  );

  // Filtrar nodos sin posición o dimensiones válidas y sanitizar sus valores
  const validNodes = useMemo(() => _filterAndSanitizeNodes(nodes), [nodes]);

  const validEdges = useMemo(() => {
    if (!edges || !Array.isArray(edges)) return [];

    return edges.filter((edge) => edge && edge.source && edge.target);
  }, [edges]);

  // Usar helper externo para calcular límites del diagrama
  const calculateDiagramBounds = useCallback((nodeList) => {
    return _calculateDiagramBounds(nodeList);
  }, []);

  // Cálculo de límites del diagrama con centrado
  const diagramBounds = useMemo(
    () => calculateDiagramBounds(validNodes),
    [validNodes, calculateDiagramBounds],
  );

  // Manejo de interacciones con el minimapa
  const handleMouseDown = useCallback(
    (event) => {
      if (!isExpanded) return; // Solo permitir interacción cuando esté expandido
      if (!containerReference.current) return; // Validación de seguridad

      const boundingRect = containerReference.current.getBoundingClientRect();
      const x = event.clientX - boundingRect.left;
      const y = event.clientY - boundingRect.top;

      setIsDragging(true);
      setLastPosition({ x, y });
      event.stopPropagation(); // Evitar que se cierre el minimapa
    },
    [isExpanded],
  );

  // Usar helper externo para validar límites del diagrama
  const validateDiagramBounds = useCallback((bounds) => {
    return _validateDiagramBounds(bounds);
  }, []);

  // Helper function to calculate viewport movement
  const calculateViewportMovement = useCallback(
    ({ deltaX, deltaY }, { diagramBounds: bounds, viewport: vp }) => {
      const diagramWidth = Math.max(bounds.maxX - bounds.minX, 1);
      const diagramHeight = Math.max(bounds.maxY - bounds.minY, 1);
      const scale = Math.min(
        (width - 2 * padding) / diagramWidth,
        (height - 2 * padding) / diagramHeight,
      );

      const movementScale = scale * vp.zoom;

      const newX = sanitizeNumber(vp.x - deltaX / movementScale, vp.x);
      const newY = sanitizeNumber(vp.y - deltaY / movementScale, vp.y);

      return { newX, newY };
    },
    [width, height, padding],
  );

  const handleMouseMove = useCallback(
    (event) => {
      if (!isDragging || !isExpanded || !viewport?.setViewport) return;
      if (!containerReference.current) return;

      try {
        const boundingRect = containerReference.current.getBoundingClientRect();
        const x = event.clientX - boundingRect.left;
        const y = event.clientY - boundingRect.top;

        const deltaX = x - lastPosition.x;
        const deltaY = y - lastPosition.y;

        if (!validateDiagramBounds(diagramBounds)) {
          setIsDragging(false);
          return;
        }

        const { newX, newY } = calculateViewportMovement(
          { deltaX, deltaY },
          { diagramBounds, viewport },
        );

        viewport.setViewport({
          x: newX,
          y: newY,
          zoom: viewport.zoom,
        });

        setLastPosition({ x, y });
      } catch {
        setIsDragging(false);
      }

      event.stopPropagation();
    },
    [
      isDragging,
      isExpanded,
      lastPosition,
      viewport,
      diagramBounds,
      validateDiagramBounds,
      calculateViewportMovement,
    ],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Helper function to set up canvas for drawing
  const setupCanvas = useCallback(() => {
    if (!canvasReference.current || !diagramBounds) {
      return;
    }

    if (!isExpanded) {
      const canvas = canvasReference.current;
      if (canvas) {
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, width, height);
      }
      return;
    }

    const canvas = canvasReference.current;
    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    // Clear canvas and draw background
    context.clearRect(0, 0, width, height);
    context.fillStyle = 'rgba(15, 20, 25, 0.8)';
    context.fillRect(0, 0, width, height);

    // Draw border
    context.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    context.lineWidth = 1;
    context.strokeRect(0, 0, width, height);

    return context;
  }, [isExpanded, width, height, diagramBounds]);

  // Helper function to calculate scale and dimensions
  const calculateScaleAndDimensions = useCallback(() => {
    const availableWidth = width - padding * 2;
    const availableHeight = height - padding * 2;
    const diagramWidth = Math.max(diagramBounds.maxX - diagramBounds.minX, 1);
    const diagramHeight = Math.max(diagramBounds.maxY - diagramBounds.minY, 1);
    const scaleX = availableWidth / diagramWidth;
    const scaleY = availableHeight / diagramHeight;
    const scale = Math.min(scaleX, scaleY);

    return {
      availableWidth,
      availableHeight,
      diagramWidth,
      diagramHeight,
      scale,
    };
  }, [width, height, padding, diagramBounds]);

  // Helper function to calculate edge positions
  const calculateEdgePositions = useCallback(
    ({ sourceNode, targetNode }, { transformX, transformY }) => {
      const sourceX = transformX(
        sourceNode.position.x + (sourceNode.width || 100) / 2,
      );
      const sourceY = transformY(
        sourceNode.position.y + (sourceNode.height || 40) / 2,
      );
      const targetX = transformX(
        targetNode.position.x + (targetNode.width || 100) / 2,
      );
      const targetY = transformY(
        targetNode.position.y + (targetNode.height || 40) / 2,
      );

      const dx = targetX - sourceX;
      const dy = targetY - sourceY;
      const distribution = Math.hypot(dx, dy);

      return { sourceX, sourceY, targetX, targetY, dx, dy, distribution };
    },
    [],
  );

  // Helper function to draw edge path
  const drawEdgePath = useCallback(
    (context, positions) => {
      const { sourceX, sourceY, targetX, targetY, dx, dy, distribution } =
        positions;

      if (isExpanded && distribution > 20) {
        const midX = (sourceX + targetX) / 2;
        const midY = (sourceY + targetY) / 2;
        const curveFactor = 0.2;
        const nx = (-dy / distribution) * curveFactor * distribution;
        const ny = (dx / distribution) * curveFactor * distribution;

        context.beginPath();
        context.moveTo(sourceX, sourceY);
        context.quadraticCurveTo(midX + nx, midY + ny, targetX, targetY);
      } else {
        context.beginPath();
        context.moveTo(sourceX, sourceY);
        context.lineTo(targetX, targetY);
      }
    },
    [isExpanded],
  );

  // Helper function to draw edge arrow
  const drawEdgeArrow = useCallback(
    (context, positions, edgeColor) => {
      const { targetX, targetY, dx, dy, distribution } = positions;

      if (isExpanded && distribution > 10) {
        const arrowSize = 4;
        const angle = Math.atan2(dy, dx);

        context.beginPath();
        context.moveTo(targetX, targetY);
        context.lineTo(
          targetX - arrowSize * Math.cos(angle - Math.PI / 6),
          targetY - arrowSize * Math.sin(angle - Math.PI / 6),
        );
        context.lineTo(
          targetX - arrowSize * Math.cos(angle + Math.PI / 6),
          targetY - arrowSize * Math.sin(angle + Math.PI / 6),
        );
        context.closePath();
        context.fillStyle = edgeColor;
        context.fill();
      }
    },
    [isExpanded],
  );

  // Helper function to draw edges
  const drawEdges = useCallback(
    (context, transformX, transformY) => {
      for (const edge of validEdges) {
        if (!edge.source || !edge.target) continue;

        const sourceNode = validNodes.find((n) => n.id === edge.source);
        const targetNode = validNodes.find((n) => n.id === edge.target);
        if (!sourceNode || !targetNode) continue;

        const positions = calculateEdgePositions(
          { sourceNode, targetNode },
          { transformX, transformY },
        );

        drawEdgePath(context, positions);

        const edgeColor = edgeColors[edge.type] || edgeColors.default;
        context.strokeStyle = isExpanded ? edgeColor : `${edgeColor}99`;
        context.lineWidth = isExpanded ? 1.5 : 0.8;

        if (edge.animated) {
          context.setLineDash([2, 2]);
        } else {
          context.setLineDash([]);
        }

        context.stroke();
        drawEdgeArrow(context, positions, edgeColor);
      }
    },
    [
      validEdges,
      validNodes,
      isExpanded,
      edgeColors,
      calculateEdgePositions,
      drawEdgePath,
      drawEdgeArrow,
    ],
  );

  // Función principal para dibujar el minimapa
  const drawMiniMap = useCallback(() => {
    try {
      const context = setupCanvas();
      if (!context) {
        return;
      }

      const { scale } = calculateScaleAndDimensions();

      // Crear transformadores de coordenadas inline
      const transformX = (x) => (x - diagramBounds.minX) * scale + padding;
      const transformY = (y) => (y - diagramBounds.minY) * scale + padding;

      // Dibujar aristas usando helper function
      drawEdges(context, transformX, transformY);

      // Dibujar nodos inline con colores por tipo
      for (const node of validNodes) {
        const x = transformX(node.position.x);
        const y = transformY(node.position.y);
        const nodeWidth = (node.width || 100) * scale;
        const nodeHeight = (node.height || 40) * scale;

        // Usar colores predefinidos del nivel superior
        context.fillStyle = nodeColors[node.type] || '#6B7280';
        context.fillRect(x, y, nodeWidth, nodeHeight);
      }

      // Dibujar viewport inline si está expandido
      if (isExpanded && viewport) {
        const viewportX = transformX(-viewport.x / viewport.zoom);
        const viewportY = transformY(-viewport.y / viewport.zoom);
        const viewportWidth = (width / viewport.zoom) * scale;
        const viewportHeight = (height / viewport.zoom) * scale;

        context.strokeStyle = '#FF6B6B';
        context.lineWidth = 2;
        context.strokeRect(viewportX, viewportY, viewportWidth, viewportHeight);
      }
    } catch {
      setHasError(true);
    }
  }, [
    validNodes,
    diagramBounds,
    isExpanded,
    width,
    height,
    viewport,
    nodeColors,
    drawEdges,
    calculateScaleAndDimensions,
    setupCanvas,
    padding,
  ]);

  useEffect(() => {
    try {
      if (canvasReference.current) {
        drawMiniMap();
        if (!canvasReady) setCanvasReady(true);
      }
    } catch {}
  }, [drawMiniMap, canvasReady, viewport?.x, viewport?.y, viewport?.zoom]);

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
  }, [handleMouseDown, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    // Reset error state when expanded state changes
    setHasError(false);
  }, [isExpanded]);

  // Helper function to render empty/error state
  const renderEmptyState = useCallback(() => {
    const containerClassName = `ts-custom-minimap-container ${isExpanded ? 'expanded' : 'collapsed'} ${hasError ? 'error' : ''}`;

    const handleKeyDown = (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleToggle();
      }
    };

    const handleResetClick = (event_) => {
      event_.stopPropagation();
      setHasError(false);
      setIsExpanded(false);
    };

    return (
      <div
        className={containerClassName}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        role='button'
        tabIndex='0'
      >
        <div className='ts-minimap-empty'>
          <p>{hasError ? 'Error en minimapa' : 'Sin nodos'}</p>
          {hasError && isExpanded && (
            <button className='ts-minimap-reset' onClick={handleResetClick}>
              Reiniciar
            </button>
          )}
        </div>
      </div>
    );
  }, [hasError, isExpanded, handleToggle]);

  // Nota: Condición de error/validación se maneja en el render final para evitar violar reglas de hooks

  // Helper function to render container props
  const getContainerProps = useCallback(() => {
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
  }, [containerReference, isExpanded, isDragging, handleToggle]);

  // Helper function to render expanded labels
  const renderExpandedLabels = useCallback(
    () => (
      <div className='ts-minimap-labels'>
        <div className='ts-minimap-title'>Minimapa</div>
        {!isDragging && (
          <div className='ts-minimap-hint'>Clic para colapsar</div>
        )}
        {isDragging && (
          <div className='ts-minimap-hint active'>Arrastrando...</div>
        )}
      </div>
    ),
    [isDragging],
  );

  // Helper function to render collapsed icon
  const renderCollapsedIcon = useCallback(
    () => (
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
    ),
    [],
  );

  // Si hay un error en el componente o no hay nodos válidos, mostrar estado vacío
  if (hasError || !validNodes || validNodes.length === 0) {
    return renderEmptyState();
  }

  return (
    <div {...getContainerProps()}>
      <canvas
        ref={canvasReference}
        width={width}
        height={height}
        className='ts-minimap-canvas'
      />
      {isExpanded && renderExpandedLabels()}
      {!isExpanded && renderCollapsedIcon()}
    </div>
  );
};

CustomMiniMap.propTypes = {
  nodes: PropTypes.array,
  edges: PropTypes.array,
  isExpanded: PropTypes.bool,
  toggleMiniMap: PropTypes.func,

  viewport: PropTypes.object,
  isUltraMode: PropTypes.bool,
};

export default CustomMiniMap;
