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
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  const [isExpanded, setIsExpanded] = useState(propertyIsExpanded || false);
  const [hasError, setHasError] = useState(false);

  // Efecto para actualizar el tamaño de la ventana
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setWindowHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Función para alternar expansión
  const handleToggle = useCallback(() => {
    setIsExpanded((previous) => !previous);
    if (toggleMiniMap) toggleMiniMap();
  }, [toggleMiniMap]);

  // Configuraciones del minimapa
  const width = isExpanded ? 180 : 45;
  const height = isExpanded ? 180 : 45;
  const padding = isExpanded ? 12 : 5;
  const nodeRadius = isExpanded ? 4 : 2;

  // Mapa de colores para nodos y conexiones
  const nodeColors = useMemo(
    () => ({
      start: '#4facfe',
      end: '#ff6b6b',
      message: '#54d7a3',
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
  const validNodes = useMemo(() => {
    if (!nodes || !Array.isArray(nodes)) return [];

    return nodes
      .filter((node) => {
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
      })
      .map((node) => sanitizeNode(node));
  }, [nodes]);

  const validEdges = useMemo(() => {
    if (!edges || !Array.isArray(edges)) return [];

    return edges.filter((edge) => edge && edge.source && edge.target);
  }, [edges]);

  // Cálculo de límites del diagrama con centrado
  const diagramBounds = useMemo(() => {
    if (!validNodes || validNodes.length === 0) {
      // Proporcionar bounds predeterminados cuando no hay nodos
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

      for (const node of validNodes) {
        // Asegurarse de que todas las coordenadas son números finitos
        const nodeX = sanitizeNumber(node.position.x, 0);
        const nodeY = sanitizeNumber(node.position.y, 0);
        const nodeWidth = sanitizeNumber(node.width, 150);
        const nodeHeight = sanitizeNumber(node.height, 40);

        bounds.minX = Math.min(bounds.minX, nodeX);
        bounds.maxX = Math.max(bounds.maxX, nodeX + nodeWidth);
        bounds.minY = Math.min(bounds.minY, nodeY);
        bounds.maxY = Math.max(bounds.maxY, nodeY + nodeHeight);
      }

      // Manejar el caso donde todos los nodos están en la misma posición
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

      // Sanitizar los bounds para asegurar que todos los valores son números finitos
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
  }, [validNodes]);

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

  const handleMouseMove = useCallback(
    (event) => {
      if (!isDragging || !isExpanded || !viewport?.setViewport) return;
      if (!containerReference.current) return; // Validación de seguridad

      try {
        const boundingRect = containerReference.current.getBoundingClientRect();
        const x = event.clientX - boundingRect.left;
        const y = event.clientY - boundingRect.top;

        const deltaX = x - lastPosition.x;
        const deltaY = y - lastPosition.y;

        // Validar que diagramBounds tenga valores válidos
        if (
          !diagramBounds ||
          typeof diagramBounds.minX !== 'number' ||
          typeof diagramBounds.maxX !== 'number' ||
          typeof diagramBounds.minY !== 'number' ||
          typeof diagramBounds.maxY !== 'number' ||
          Number.isNaN(diagramBounds.minX) ||
          Number.isNaN(diagramBounds.maxX) ||
          Number.isNaN(diagramBounds.minY) ||
          Number.isNaN(diagramBounds.maxY)
        ) {
          setIsDragging(false);
          return;
        }

        // Calcular la cantidad de desplazamiento en coordenadas del flujo
        // Prevenir divisiones por cero
        const diagramWidth = Math.max(
          diagramBounds.maxX - diagramBounds.minX,
          1,
        );
        const diagramHeight = Math.max(
          diagramBounds.maxY - diagramBounds.minY,
          1,
        );
        const scale = Math.min(
          (width - 2 * padding) / diagramWidth,
          (height - 2 * padding) / diagramHeight,
        );

        const movementScale = scale * viewport.zoom;

        // Sanitizar valores antes de aplicar al viewport
        const newX = sanitizeNumber(
          viewport.x - deltaX / movementScale,
          viewport.x,
        );
        const newY = sanitizeNumber(
          viewport.y - deltaY / movementScale,
          viewport.y,
        );

        // Aplicar el movimiento del viewport en la dirección contraria al arrastre
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
      width,
      height,
      padding,
      diagramBounds,
    ],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Función principal para dibujar el minimapa
  const drawMiniMap = useCallback(() => {
    if (!canvasReference.current || !diagramBounds) {
      return;
    }

    try {
      if (!isExpanded) {
        const canvas = canvasReference.current;
        if (canvas) {
          const context = canvas.getContext('2d');
          // Clear the canvas to ensure it's blank when collapsed and not drawing
          context.clearRect(0, 0, width, height);
        }
        return; // Skip all drawing if collapsed
      }
      const canvas = canvasReference.current;
      const context = canvas.getContext('2d');
      if (!context) {
        return;
      }

      // Sanitizar los bounds para evitar errores de cálculo

      // Limpiar canvas
      context.clearRect(0, 0, width, height);

      // Dibujar fondo
      context.fillStyle = 'rgba(15, 20, 25, 0.8)';
      context.fillRect(0, 0, width, height);

      // Dibujar borde protector del canvas
      context.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      context.lineWidth = 1;
      context.strokeRect(0, 0, width, height);

      const availableWidth = width - padding * 2;
      const availableHeight = height - padding * 2;

      const diagramWidth = Math.max(diagramBounds.maxX - diagramBounds.minX, 1); // Evitar división por cero
      const diagramHeight = Math.max(
        diagramBounds.maxY - diagramBounds.minY,
        1,
      ); // Evitar división por cero

      // Optimizar renderizado basado en cantidad de elementos
      // (usamos directamente isUltraMode para simplificar)

      // Calcular la escala para mapear el diagrama al canvas
      // Calcular la escala para mapear el diagrama completo al canvas
      const scaleX = availableWidth / diagramWidth;
      const scaleY = availableHeight / diagramHeight;
      const scale = Math.min(scaleX, scaleY); // Usar la menor escala para mantener proporciones

      // Centro del minimapa - valores simples para posicionamiento

      // Mapear el centro del lienzo principal al centro del minimapa
      const minimapCenterX = width / 2;
      const minimapCenterY = height / 2;

      /**
       * Funciones de transformación para mapear coordenadas del diagrama al minimapa
       * @param {number} coord - Coordenada a transformar
       * @param {string} axis - Eje ('x' o 'y')
       * @returns {number} - Coordenada transformada en el espacio del minimapa
       */
      const transformCoord = (coord, axis) => {
        // Valores por defecto según el eje
        const center = axis === 'x' ? minimapCenterX : minimapCenterY;
        const diagramCenter =
          axis === 'x' ? diagramBounds.centerX : diagramBounds.centerY;

        // Validación de entrada
        if (
          typeof coord !== 'number' ||
          Number.isNaN(coord) ||
          !Number.isFinite(coord)
        ) {
          return center;
        }

        // Transformación relativa al centro
        return (coord - diagramCenter) * scale + center;
      };

      // Funciones específicas para cada eje
      const transformX = (x) => transformCoord(x, 'x');
      const transformY = (y) => transformCoord(y, 'y');

      // Dibujar aristas
      for (const edge of validEdges) {
        if (!edge.source || !edge.target) continue;

        const sourceNode = validNodes.find((n) => n.id === edge.source);
        const targetNode = validNodes.find((n) => n.id === edge.target);

        if (!sourceNode || !targetNode) continue;

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

        // Calcular la distancia para determinar si usar curvas
        const dx = targetX - sourceX;
        const dy = targetY - sourceY;
        const distribution = Math.hypot(dx, dy);

        if (isExpanded && distribution > 20) {
          // Para conexiones largas, usar curvas Bezier para mejor visualización
          const midX = (sourceX + targetX) / 2;
          const midY = (sourceY + targetY) / 2;
          // Factor de curvatura proporcional a la distancia
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

        const edgeColor = edgeColors[edge.type] || edgeColors.default;
        context.strokeStyle = isExpanded ? edgeColor : `${edgeColor}99`;
        context.lineWidth = isExpanded ? 1.5 : 0.8;

        if (edge.animated) {
          context.setLineDash([2, 2]);
        } else {
          context.setLineDash([]);
        }

        context.stroke();
        context.setLineDash([]);

        if (isExpanded) {
          const angle = Math.atan2(targetY - sourceY, targetX - sourceX);
          const arrowSize = 4;

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
      }

      // Dibujar nodos
      for (const node of validNodes) {
        const nodeX = transformX(node.position.x);
        const nodeY = transformY(node.position.y);

        const nodeWidth = node.width ? node.width * scale : 30 * scale;
        const nodeHeight = node.height ? node.height * scale : 20 * scale;

        const centerX = nodeX + nodeWidth / 2;
        const centerY = nodeY + nodeHeight / 2;

        const nodeColor = nodeColors[node.type] || '#ff00ff';

        if (isExpanded) {
          const radius = Math.min(4, Math.max(2, nodeWidth * 0.2));

          context.beginPath();
          context.moveTo(
            centerX - nodeWidth / 2 + radius,
            centerY - nodeHeight / 2,
          );
          context.lineTo(
            centerX + nodeWidth / 2 - radius,
            centerY - nodeHeight / 2,
          );
          context.quadraticCurveTo(
            centerX + nodeWidth / 2,
            centerY - nodeHeight / 2,
            centerX + nodeWidth / 2,
            centerY - nodeHeight / 2 + radius,
          );
          context.lineTo(
            centerX + nodeWidth / 2,
            centerY + nodeHeight / 2 - radius,
          );
          context.quadraticCurveTo(
            centerX + nodeWidth / 2,
            centerY + nodeHeight / 2,
            centerX + nodeWidth / 2 - radius,
            centerY + nodeHeight / 2,
          );
          context.lineTo(
            centerX - nodeWidth / 2 + radius,
            centerY + nodeHeight / 2,
          );
          context.quadraticCurveTo(
            centerX - nodeWidth / 2,
            centerY + nodeHeight / 2,
            centerX - nodeWidth / 2,
            centerY + nodeHeight / 2 - radius,
          );
          context.lineTo(
            centerX - nodeWidth / 2,
            centerY - nodeHeight / 2 + radius,
          );
          context.quadraticCurveTo(
            centerX - nodeWidth / 2,
            centerY - nodeHeight / 2,
            centerX - nodeWidth / 2 + radius,
            centerY - nodeHeight / 2,
          );
          context.closePath();

          const gradient = context.createLinearGradient(
            centerX - nodeWidth / 2,
            centerY - nodeHeight / 2,
            centerX + nodeWidth / 2,
            centerY + nodeHeight / 2,
          );
          gradient.addColorStop(0, `${nodeColor}CC`);
          gradient.addColorStop(1, `${nodeColor}99`);
          context.fillStyle = gradient;
          context.fill();

          context.strokeStyle = nodeColor;
          context.lineWidth = 1;
          context.stroke();

          context.beginPath();
          context.moveTo(
            centerX - nodeWidth / 2 + radius,
            centerY - nodeHeight / 2,
          );
          context.lineTo(
            centerX + nodeWidth / 2 - radius,
            centerY - nodeHeight / 2,
          );
          context.quadraticCurveTo(
            centerX + nodeWidth / 2,
            centerY - nodeHeight / 2,
            centerX + nodeWidth / 2,
            centerY - nodeHeight / 2 + radius,
          );
          context.strokeStyle = `${nodeColor}FF`;
          context.lineWidth = 1.5;
          context.stroke();

          if (node.data?.label && nodeWidth > 10) {
            const maxLength = Math.floor(nodeWidth / 2);
            let { label } = node.data;
            if (label.length > maxLength) {
              label = `${label.slice(0, Math.max(0, maxLength))}...`;
            }

            const fontSize = Math.max(6, Math.min(9, nodeWidth / 4));
            context.font = `bold ${fontSize}px Rajdhani`;
            context.fillStyle = '#ffffff';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(label, centerX, centerY);
          }
        } else {
          // Versión simple para modo no expandido (puntos pequeños)
          const localNodeRadius = Math.max(
            2,
            Math.min(nodeWidth, nodeHeight) / 2,
          );

          context.beginPath();
          context.arc(centerX, centerY, localNodeRadius, 0, 2 * Math.PI);

          const gradient = context.createRadialGradient(
            centerX,
            centerY,
            0,
            centerX,
            centerY,
            nodeRadius,
          );
          gradient.addColorStop(0, nodeColor);
          gradient.addColorStop(1, `${nodeColor}80`);
          context.fillStyle = gradient;
          context.fill();

          context.strokeStyle = '#ffffff50';
          context.lineWidth = 0.5;
          context.stroke();
        }
      }

      if (isExpanded && viewport) {
        // Ajustar el rectángulo del viewport para que se mueva correctamente
        const vpLeft = transformX(viewport.x);
        const vpTop = transformY(viewport.y);

        // Calcular dimensiones del viewport en el minimapa
        const vpWidth = (windowWidth / viewport.zoom) * scale;
        const vpHeight = (windowHeight / viewport.zoom) * scale;
        const radius = 3; // Radio para las esquinas redondeadas

        // Dibujar un rectángulo con esquinas redondeadas para el viewport
        context.beginPath();
        context.moveTo(vpLeft + radius, vpTop);
        context.lineTo(vpLeft + vpWidth - radius, vpTop);
        context.arcTo(
          vpLeft + vpWidth,
          vpTop,
          vpLeft + vpWidth,
          vpTop + radius,
          radius,
        );
        context.lineTo(vpLeft + vpWidth, vpTop + vpHeight - radius);
        context.arcTo(
          vpLeft + vpWidth,
          vpTop + vpHeight,
          vpLeft + vpWidth - radius,
          vpTop + vpHeight,
          radius,
        );
        context.lineTo(vpLeft + radius, vpTop + vpHeight);
        context.arcTo(
          vpLeft,
          vpTop + vpHeight,
          vpLeft,
          vpTop + vpHeight - radius,
          radius,
        );
        context.lineTo(vpLeft, vpTop + radius);
        context.arcTo(vpLeft, vpTop, vpLeft + radius, vpTop, radius);

        context.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        context.lineWidth = 1.5;
        context.setLineDash([4, 2]);
        context.stroke();
        context.fillStyle = 'rgba(255, 255, 255, 0.1)';
        context.fill();
        context.setLineDash([]);
      }

      if (isExpanded) {
        try {
          const scaleBarLength = 30;
          // Asegurar que scale sea un número válido y no sea cero
          const safeScale =
            typeof scale === 'number' && scale !== 0 && Number.isFinite(scale)
              ? scale
              : 1;
          const realDistance = Math.round(scaleBarLength / safeScale);

          const scaleBarY = height - 12;

          context.beginPath();
          context.moveTo(width - 50, scaleBarY + 1);
          context.lineTo(width - 50 + scaleBarLength, scaleBarY + 1);
          context.strokeStyle = 'rgba(0, 0, 0, 0.5)';
          context.lineWidth = 2;
          context.stroke();

          context.beginPath();
          context.moveTo(width - 50, scaleBarY);
          context.lineTo(width - 50 + scaleBarLength, scaleBarY);
          context.strokeStyle = '#ffffff';
          context.lineWidth = 2;
          context.stroke();

          context.beginPath();
          context.moveTo(width - 50, scaleBarY - 3);
          context.lineTo(width - 50, scaleBarY + 3);
          context.moveTo(width - 50 + scaleBarLength, scaleBarY - 3);
          context.lineTo(width - 50 + scaleBarLength, scaleBarY + 3);
          context.strokeStyle = '#ffffff';
          context.lineWidth = 1;
          context.stroke();

          context.font = 'bold 8px Rajdhani';
          context.fillStyle = '#ffffff';
          context.textAlign = 'center';
          context.fillText(
            `${realDistance}px`,
            width - 50 + scaleBarLength / 2,
            scaleBarY - 5,
          );
        } catch {
          // No hacer nada en caso de error
        }
      }
    } catch {
      setHasError(true);
    }
  }, [
    validNodes,
    validEdges,
    diagramBounds,
    isExpanded,
    width,
    height,
    padding,
    nodeRadius,

    viewport,
    windowWidth,
    windowHeight,
    edgeColors,
    nodeColors,
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

  // Si hay un error en el componente o no hay nodos válidos
  if (hasError || !validNodes || validNodes.length === 0) {
    return (
      <div
        className={`ts-custom-minimap-container ${isExpanded ? 'expanded' : 'collapsed'} ${hasError ? 'error' : ''}`}
        onClick={handleToggle}
      >
        <div className='ts-minimap-empty'>
          <p>{hasError ? 'Error en minimapa' : 'Sin nodos'}</p>
          {hasError && isExpanded && (
            <button
              className='ts-minimap-reset'
              onClick={(event_) => {
                event_.stopPropagation();
                setHasError(false);
                setIsExpanded(false);
              }}
            >
              Reiniciar
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerReference}
      className={`ts-custom-minimap-container ${isExpanded ? 'expanded' : 'collapsed'} ${isDragging ? 'dragging' : ''}`}
      onClick={isDragging ? undefined : handleToggle}
    >
      <canvas
        ref={canvasReference}
        width={width}
        height={height}
        className='ts-minimap-canvas'
      />
      {isExpanded && (
        <div className='ts-minimap-labels'>
          <div className='ts-minimap-title'>Minimapa</div>
          {!isDragging && (
            <div className='ts-minimap-hint'>Clic para colapsar</div>
          )}
          {isDragging && (
            <div className='ts-minimap-hint active'>Arrastrando...</div>
          )}
        </div>
      )}
      {!isExpanded && (
        <div
          className='ts-minimap-icon'
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
          }}
        >
          {/* Icono de cuadrícula para sugerir mapa */}
          <svg
            width='10'
            height='10'
            viewBox='0 0 12 12'
            xmlns='http://www.w3.org/2000/svg'
            aria-hidden='true'
          >
            <circle cx='2' cy='2' r='1.5' fill='#888888' /> {/* Gris oscuro */}
            <circle cx='6' cy='2' r='1.5' fill='#AAAAAA' /> {/* Gris medio */}
            <circle cx='10' cy='2' r='1.5' fill='#888888' />
            <circle cx='2' cy='6' r='1.5' fill='#AAAAAA' />
            <circle cx='6' cy='6' r='1.5' fill='#CCCCCC' /> {/* Gris claro */}
            <circle cx='10' cy='6' r='1.5' fill='#AAAAAA' />
            <circle cx='2' cy='10' r='1.5' fill='#888888' />
            <circle cx='6' cy='10' r='1.5' fill='#AAAAAA' />
            <circle cx='10' cy='10' r='1.5' fill='#888888' />
          </svg>
          {/* Icono de flechas existente para expandir */}
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
      )}
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
