/**
 * Event handlers para CustomMiniMap.jsx
 * Extraídos para reducir tamaño de función principal
 */
import { calculateViewportMovement } from './minimapHelpers';

/**
 * Crea los event handlers para el minimap
 */
export const createMinimapEventHandlers = ({
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
}) => {
  const handleMouseDown = (event) => {
    if (!isExpanded) return;
    if (!containerReference.current) return;

    const boundingRect = containerReference.current.getBoundingClientRect();
    const x = event.clientX - boundingRect.left;
    const y = event.clientY - boundingRect.top;

    setIsDragging(true);
    setLastPosition({ x, y });
    event.stopPropagation();
  };

  const handleMouseMove = (event) => {
    if (!isDragging || !isExpanded || !viewport?.setViewport) return;
    if (!containerReference.current) return;

    try {
      const boundingRect = containerReference.current.getBoundingClientRect();
      const x = event.clientX - boundingRect.left;
      const y = event.clientY - boundingRect.top;

      const deltaX = x - lastPosition.x;
      const deltaY = y - lastPosition.y;

      if (!validateDiagramBounds(diagramBounds)) {
        return;
      }

      const { newX, newY } = calculateViewportMovement(
        { deltaX, deltaY },
        { diagramBounds, viewport },
      );

      viewport.setViewport({ x: newX, y: newY, zoom: viewport.zoom });
      setLastPosition({ x, y });
    } catch {
      // Error manejado silenciosamente
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleToggle = () => {
    setIsExpanded((previous) => !previous);
    if (toggleMiniMap) toggleMiniMap();
  };

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleToggle,
  };
};

/**
 * Crea las funciones de configuración del canvas
 */
export const createCanvasHelpers = ({ canvasReference, width, height, padding, diagramBounds }) => {
  const setupCanvas = () => {
    if (!canvasReference.current) return;

    const canvas = canvasReference.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = width;
    canvas.height = height;

    context.clearRect(0, 0, width, height);
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
