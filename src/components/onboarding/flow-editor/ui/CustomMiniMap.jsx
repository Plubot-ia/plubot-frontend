import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import useFlowStore from '@/stores/useFlowStore';
import './CustomMiniMap.css';
// Importar el sanitizador para prevenir errores con valores no finitos
import { sanitizeViewport, sanitizeBounds, sanitizeNode, sanitizeNumber } from './minimap-sanitizer';

/**
 * Componente CustomMiniMap - Minimapa optimizado para ReactFlow
 * Versión completamente revisada y optimizada para eliminar código redundante
 */
const CustomMiniMap = ({ 
  nodes: propNodes, 
  edges: propEdges, 
  isExpanded: propIsExpanded,
  toggleMiniMap,
  setByteMessage: propSetByteMessage,
  viewport: propViewport,
  isUltraMode: propIsUltraMode
}) => {
  // Configuraciones del minimapa - definidas a nivel de componente

  // Obtener datos del store o usar los proporcionados por props
  const {
    nodes: storeNodes,
    edges: storeEdges,
    isUltraMode: storeIsUltraMode,
  } = useFlowStore(state => ({
    nodes: state.nodes,
    edges: state.edges,
    isUltraMode: state.isUltraMode,
  }));
  
  // Preferir props sobre store (para mayor flexibilidad)
  const nodes = propNodes?.length ? propNodes : storeNodes || [];
  const edges = propEdges?.length ? propEdges : storeEdges || [];
  const isUltraMode = propIsUltraMode !== undefined ? propIsUltraMode : storeIsUltraMode;
  // Sanitizar el viewport para evitar valores NaN o Infinity
  const viewport = sanitizeViewport(propViewport || { x: 0, y: 0, zoom: 1 });
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [canvasReady, setCanvasReady] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
  const [isExpanded, setIsExpanded] = useState(propIsExpanded || false);
  
  // Función segura para mostrar mensajes
  const setByteMessage = propSetByteMessage || (msg => console.log('[CustomMiniMap]', msg));
  
  // Función para alternar expansión
  const handleToggle = useCallback(() => {
    setIsExpanded(prev => !prev);
    if (toggleMiniMap) toggleMiniMap();
  }, [toggleMiniMap]);
  
  // Configuraciones del minimapa
  const width = isExpanded ? 180 : 45;
  const height = isExpanded ? 180 : 45;
  const padding = isExpanded ? 12 : 5;
  const nodeRadius = isExpanded ? 4 : 2;

  // Mapa de colores para nodos y conexiones
  const nodeColors = {
    start: '#4facfe',
    end: '#ff6b6b',
    message: '#54d7a3',
    decision: '#feca57',
    action: '#a55eea',
    option: '#48dbfb',
  };

  const edgeColors = {
    default: '#00e0ff',
    success: '#00ff9d',
    warning: '#ffb700',
    danger: '#ff2e5b',
  };

  // Tamaños fijos para los nodos en el minimapa según su estado
  const getNodeSize = (nodeType) => {
    // Si es un nodo de inicio o fin, ligeramente más grande
    if (nodeType === 'start' || nodeType === 'end') {
      return isExpanded ? { width: 18, height: 14 } : { width: 4, height: 4 };
    }
    // Tamaño estándar para otros tipos de nodo
    return isExpanded ? { width: 16, height: 12 } : { width: 3, height: 3 };
  };

  // Filtrar nodos sin posición o dimensiones válidas y sanitizar sus valores
  const validNodes = useMemo(() => {
    if (!nodes || !Array.isArray(nodes)) return [];
    
    return nodes.filter(node => {
      return node && 
             node.position && 
             typeof node.position.x === 'number' && 
             typeof node.position.y === 'number' &&
             !isNaN(node.position.x) &&
             !isNaN(node.position.y) &&
             isFinite(node.position.x) &&
             isFinite(node.position.y);
    }).map(node => sanitizeNode(node));
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
        centerY: 50
      };
    }
    
    try {
      const bounds = {
        minX: Infinity,
        maxX: -Infinity,
        minY: Infinity,
        maxY: -Infinity,
      };
  
      validNodes.forEach((node) => {
        // Asegurarse de que todas las coordenadas son números finitos
        const nodeX = sanitizeNumber(node.position.x, 0);
        const nodeY = sanitizeNumber(node.position.y, 0);
        const nodeWidth = sanitizeNumber(node.width, 150);
        const nodeHeight = sanitizeNumber(node.height, 40);
        
        bounds.minX = Math.min(bounds.minX, nodeX);
        bounds.maxX = Math.max(bounds.maxX, nodeX + nodeWidth);
        bounds.minY = Math.min(bounds.minY, nodeY);
        bounds.maxY = Math.max(bounds.maxY, nodeY + nodeHeight);
      });
  
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
    } catch (error) {
      console.error('[CustomMiniMap] Error al calcular límites del diagrama:', error);
      // Devolver bounds predeterminados en caso de error
      return {
        minX: 0,
        maxX: 100,
        minY: 0,
        maxY: 100,
        centerX: 50,
        centerY: 50
      };
    }
  }, [validNodes]);

  // Manejo de interacciones con el minimapa
  const handleMouseDown = useCallback((e) => {
    if (!isExpanded) return; // Solo permitir interacción cuando esté expandido
    if (!containerRef.current) return; // Validación de seguridad

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDragging(true);
    setLastPosition({ x, y });
    e.stopPropagation(); // Evitar que se cierre el minimapa
  }, [isExpanded]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !isExpanded || !viewport?.setViewport) return;
    if (!containerRef.current) return; // Validación de seguridad

    try {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const dx = x - lastPosition.x;
      const dy = y - lastPosition.y;
      
      // Validar que diagramBounds tenga valores válidos
      if (!diagramBounds || 
          typeof diagramBounds.minX !== 'number' || 
          typeof diagramBounds.maxX !== 'number' ||
          typeof diagramBounds.minY !== 'number' || 
          typeof diagramBounds.maxY !== 'number' ||
          isNaN(diagramBounds.minX) || isNaN(diagramBounds.maxX) ||
          isNaN(diagramBounds.minY) || isNaN(diagramBounds.maxY)) {
        console.error('[CustomMiniMap] Bounds inválidos detectados durante arrastre');
        return;
      }
      
      // Calcular la cantidad de desplazamiento en coordenadas del flujo
      // Prevenir divisiones por cero
      const diagramWidth = Math.max(diagramBounds.maxX - diagramBounds.minX, 1);
      const diagramHeight = Math.max(diagramBounds.maxY - diagramBounds.minY, 1);
      const scale = Math.min(
        (width - 2 * padding) / diagramWidth,
        (height - 2 * padding) / diagramHeight
      );
      
      // Sanitizar valores antes de aplicar al viewport
      const newX = sanitizeNumber(viewport.x - dx / viewport.zoom / scale, viewport.x);
      const newY = sanitizeNumber(viewport.y - dy / viewport.zoom / scale, viewport.y);
      
      // Aplicar el movimiento del viewport en la dirección contraria al arrastre
      viewport.setViewport({
        x: newX,
        y: newY,
        zoom: viewport.zoom
      });
      
      setLastPosition({ x, y });
    } catch (error) {
      console.error('[CustomMiniMap] Error durante arrastre:', error);
      // Liberar el arrastre en caso de error
      setIsDragging(false);
    }
    
    e.stopPropagation();
  }, [isDragging, isExpanded, lastPosition, viewport, width, height, padding, diagramBounds]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Función principal para dibujar el minimapa
  const drawMiniMap = useCallback(() => {
    if (!canvasRef.current || !diagramBounds) {
      console.log('[CustomMiniMap] No se puede dibujar: canvas o bounds no disponibles');
      return;
    }

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('[CustomMiniMap] No se pudo obtener el contexto 2D del canvas');
        return;
      }
      
      // Sanitizar los bounds para evitar errores de cálculo
      const bounds = sanitizeBounds(diagramBounds);

      // Limpiar canvas
      ctx.clearRect(0, 0, width, height);
      
      // Dibujar fondo
      ctx.fillStyle = 'rgba(15, 20, 25, 0.8)';
      ctx.fillRect(0, 0, width, height);
      
      // Dibujar borde protector del canvas
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, width, height);
      
      const availableWidth = width - padding * 2;
      const availableHeight = height - padding * 2;
      
      const diagramWidth = Math.max(diagramBounds.maxX - diagramBounds.minX, 1); // Evitar división por cero
      const diagramHeight = Math.max(diagramBounds.maxY - diagramBounds.minY, 1); // Evitar división por cero
      
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
        const diagramCenter = axis === 'x' ? diagramBounds.centerX : diagramBounds.centerY;
        
        // Validación de entrada
        if (typeof coord !== 'number' || isNaN(coord) || !isFinite(coord)) {
          return center;
        }
        
        // Transformación relativa al centro
        return (coord - diagramCenter) * scale + center;
      };
      
      // Funciones específicas para cada eje
      const transformX = (x) => transformCoord(x, 'x');
      const transformY = (y) => transformCoord(y, 'y');

      // Dibujar aristas
      validEdges.forEach((edge) => {
        if (!edge.source || !edge.target) return;

        const sourceNode = validNodes.find((n) => n.id === edge.source);
        const targetNode = validNodes.find((n) => n.id === edge.target);

        if (!sourceNode || !targetNode) return;

        const sourceX = transformX(sourceNode.position.x + (sourceNode.width || 100) / 2);
        const sourceY = transformY(sourceNode.position.y + (sourceNode.height || 40) / 2);
        const targetX = transformX(targetNode.position.x + (targetNode.width || 100) / 2);
        const targetY = transformY(targetNode.position.y + (targetNode.height || 40) / 2);

        // Calcular la distancia para determinar si usar curvas
        const dx = targetX - sourceX;
        const dy = targetY - sourceY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (isExpanded && dist > 20) {
          // Para conexiones largas, usar curvas Bezier para mejor visualización
          const midX = (sourceX + targetX) / 2;
          const midY = (sourceY + targetY) / 2;
          // Factor de curvatura proporcional a la distancia
          const curveFactor = 0.2;
          const nx = -dy / dist * curveFactor * dist;
          const ny = dx / dist * curveFactor * dist;
          
          ctx.beginPath();
          ctx.moveTo(sourceX, sourceY);
          ctx.quadraticCurveTo(midX + nx, midY + ny, targetX, targetY);
        } else {
          ctx.beginPath();
          ctx.moveTo(sourceX, sourceY);
          ctx.lineTo(targetX, targetY);
        }

        const edgeColor = edgeColors[edge.type] || edgeColors.default;
        ctx.strokeStyle = isExpanded ? edgeColor : `${edgeColor}99`;
        ctx.lineWidth = isExpanded ? 1.5 : 0.8;

        if (edge.animated) {
          ctx.setLineDash([2, 2]);
        } else {
          ctx.setLineDash([]);
        }

        ctx.stroke();
        ctx.setLineDash([]);

        if (isExpanded) {
          const angle = Math.atan2(targetY - sourceY, targetX - sourceX);
          const arrowSize = 4;
          
          ctx.beginPath();
          ctx.moveTo(targetX, targetY);
          ctx.lineTo(
            targetX - arrowSize * Math.cos(angle - Math.PI / 6),
            targetY - arrowSize * Math.sin(angle - Math.PI / 6)
          );
          ctx.lineTo(
            targetX - arrowSize * Math.cos(angle + Math.PI / 6),
            targetY - arrowSize * Math.sin(angle + Math.PI / 6)
          );
          ctx.closePath();
          ctx.fillStyle = edgeColor;
          ctx.fill();
        }
      });
      
      // Dibujar nodos
      validNodes.forEach((node) => {
        const nodeX = transformX(node.position.x);
        const nodeY = transformY(node.position.y);
        
        const nodeWidth = node.width ? node.width * scale : 30 * scale;
        const nodeHeight = node.height ? node.height * scale : 20 * scale;
        
        const centerX = nodeX + (nodeWidth / 2);
        const centerY = nodeY + (nodeHeight / 2);
        
        const nodeColor = nodeColors[node.type] || '#ff00ff';

        if (isExpanded) {
          const radius = Math.min(4, Math.max(2, nodeWidth * 0.2));
          
          ctx.beginPath();
          ctx.moveTo(centerX - nodeWidth/2 + radius, centerY - nodeHeight/2);
          ctx.lineTo(centerX + nodeWidth/2 - radius, centerY - nodeHeight/2);
          ctx.quadraticCurveTo(centerX + nodeWidth/2, centerY - nodeHeight/2, centerX + nodeWidth/2, centerY - nodeHeight/2 + radius);
          ctx.lineTo(centerX + nodeWidth/2, centerY + nodeHeight/2 - radius);
          ctx.quadraticCurveTo(centerX + nodeWidth/2, centerY + nodeHeight/2, centerX + nodeWidth/2 - radius, centerY + nodeHeight/2);
          ctx.lineTo(centerX - nodeWidth/2 + radius, centerY + nodeHeight/2);
          ctx.quadraticCurveTo(centerX - nodeWidth/2, centerY + nodeHeight/2, centerX - nodeWidth/2, centerY + nodeHeight/2 - radius);
          ctx.lineTo(centerX - nodeWidth/2, centerY - nodeHeight/2 + radius);
          ctx.quadraticCurveTo(centerX - nodeWidth/2, centerY - nodeHeight/2, centerX - nodeWidth/2 + radius, centerY - nodeHeight/2);
          ctx.closePath();
        
          const gradient = ctx.createLinearGradient(
            centerX - nodeWidth/2, 
            centerY - nodeHeight/2, 
            centerX + nodeWidth/2, 
            centerY + nodeHeight/2
          );
          gradient.addColorStop(0, nodeColor + 'CC');
          gradient.addColorStop(1, nodeColor + '99');
          ctx.fillStyle = gradient;
          ctx.fill();
          
          ctx.strokeStyle = nodeColor;
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(centerX - nodeWidth/2 + radius, centerY - nodeHeight/2);
          ctx.lineTo(centerX + nodeWidth/2 - radius, centerY - nodeHeight/2);
          ctx.quadraticCurveTo(centerX + nodeWidth/2, centerY - nodeHeight/2, centerX + nodeWidth/2, centerY - nodeHeight/2 + radius);
          ctx.strokeStyle = nodeColor + 'FF';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          if (node.data?.label && nodeWidth > 10) {
            const maxLength = Math.floor(nodeWidth / 2);
            let label = node.data.label;
            if (label.length > maxLength) {
              label = label.substring(0, maxLength) + '...';
            }

            const fontSize = Math.max(6, Math.min(9, nodeWidth / 4));
            ctx.font = `bold ${fontSize}px Rajdhani`;
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, centerX, centerY);
          }
        } else {
          // Versión simple para modo no expandido (puntos pequeños)
          const nodeRadius = Math.max(2, Math.min(nodeWidth, nodeHeight) / 2);
          
          ctx.beginPath();
          ctx.arc(centerX, centerY, nodeRadius, 0, 2 * Math.PI);
          
          const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, nodeRadius);
          gradient.addColorStop(0, nodeColor);
          gradient.addColorStop(1, nodeColor + '80');
          ctx.fillStyle = gradient;
          ctx.fill();
          
          ctx.strokeStyle = '#ffffff50';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
    });

    if (isExpanded && viewport) {
      // Ajustar el rectángulo del viewport para que se mueva correctamente
      const vpLeft = transformX(viewport.x);
      const vpTop = transformY(viewport.y);
      
      // Calcular dimensiones del viewport en el minimapa
      const vpWidth = (window.innerWidth / viewport.zoom) * scale;
      const vpHeight = (window.innerHeight / viewport.zoom) * scale;
      const radius = 3; // Radio para las esquinas redondeadas
      
      // Dibujar un rectángulo con esquinas redondeadas para el viewport
      ctx.beginPath();
      ctx.moveTo(vpLeft + radius, vpTop);
      ctx.lineTo(vpLeft + vpWidth - radius, vpTop);
      ctx.arcTo(vpLeft + vpWidth, vpTop, vpLeft + vpWidth, vpTop + radius, radius);
      ctx.lineTo(vpLeft + vpWidth, vpTop + vpHeight - radius);
      ctx.arcTo(vpLeft + vpWidth, vpTop + vpHeight, vpLeft + vpWidth - radius, vpTop + vpHeight, radius);
      ctx.lineTo(vpLeft + radius, vpTop + vpHeight);
      ctx.arcTo(vpLeft, vpTop + vpHeight, vpLeft, vpTop + vpHeight - radius, radius);
      ctx.lineTo(vpLeft, vpTop + radius);
      ctx.arcTo(vpLeft, vpTop, vpLeft + radius, vpTop, radius);
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 2]);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fill();
      ctx.setLineDash([]);
    }

    if (isExpanded) {
      try {
        const scaleBarLength = 30;
        // Asegurar que scale sea un número válido y no sea cero
        const safeScale = (typeof scale === 'number' && scale !== 0 && isFinite(scale)) ? scale : 1;
        const realDistance = Math.round(scaleBarLength / safeScale);
        
        const scaleY = height - 12;
        
        ctx.beginPath();
        ctx.moveTo(width - 50, scaleY + 1);
        ctx.lineTo(width - 50 + scaleBarLength, scaleY + 1);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(width - 50, scaleY);
        ctx.lineTo(width - 50 + scaleBarLength, scaleY);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(width - 50, scaleY - 3);
        ctx.lineTo(width - 50, scaleY + 3);
        ctx.moveTo(width - 50 + scaleBarLength, scaleY - 3);
        ctx.lineTo(width - 50 + scaleBarLength, scaleY + 3);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.font = 'bold 8px Rajdhani';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(`${realDistance}px`, width - 50 + scaleBarLength / 2, scaleY - 5);
      } catch (error) {
        console.error('[CustomMiniMap] Error dibujando barra de escala:', error);
      }
    }
    } catch (error) {
      console.error('[CustomMiniMap] Error al dibujar el minimapa:', error);
    }
  }, [validNodes, validEdges, diagramBounds, isExpanded, width, height, padding, nodeRadius, setByteMessage, viewport]);

  useEffect(() => {
    try {
      if (canvasRef.current) {
        drawMiniMap();
        if (!canvasReady) setCanvasReady(true);
      }
    } catch (error) {
      console.error('[CustomMiniMap] Error en effect de dibujado:', error);
    }
  }, [drawMiniMap, canvasReady, viewport?.x, viewport?.y, viewport?.zoom]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp]);

  // Estado para capturar errores de renderizado
  const [hasError, setHasError] = useState(false);
  
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
        <div className="ts-minimap-empty">
          <p>{hasError ? 'Error en minimapa' : 'Sin nodos'}</p>
          {hasError && isExpanded && (
            <button 
              className="ts-minimap-reset" 
              onClick={(e) => {
                e.stopPropagation();
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
      ref={containerRef}
      className={`ts-custom-minimap-container ${isExpanded ? 'expanded' : 'collapsed'} ${isDragging ? 'dragging' : ''}`}
      onClick={isDragging ? null : handleToggle}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="ts-minimap-canvas"
      />
      {isExpanded && (
        <div className="ts-minimap-labels">
          <div className="ts-minimap-title">Minimapa</div>
          {!isDragging && <div className="ts-minimap-hint">Clic para colapsar</div>}
          {isDragging && <div className="ts-minimap-hint active">Arrastrando...</div>}
        </div>
      )}
      {!isExpanded && (
        <div className="ts-minimap-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 3H21V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 21H3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 3L14 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 21L10 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}
    </div>
  );
};

export default CustomMiniMap;