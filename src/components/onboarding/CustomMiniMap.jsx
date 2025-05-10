import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import './CustomMiniMap.css';

const CustomMiniMap = ({ nodes, edges, isExpanded, toggleMiniMap, setByteMessage, dimensionsUpdated, viewport }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
  
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

  // Normalización del tamaño de los nodos para el minimapa
  const normalizeNodeSize = (nodeType) => {
    return isExpanded 
      ? { width: 16, height: 12 } 
      : { width: 3, height: 3 };
  };

  // Filtrar nodos y bordes válidos
  const validNodes = useMemo(() => {
    return nodes.filter((node) => node.position && node.id).map((node) => {
      const nodeSize = normalizeNodeSize(node.type);
      return {
        ...node,
        minimapWidth: nodeSize.width,
        minimapHeight: nodeSize.height,
        width: node.width || 150,
        height: node.height || 50,
      };
    });
  }, [nodes, isExpanded]);

  const validEdges = useMemo(() => {
    return edges.filter((edge) => edge.source && edge.target);
  }, [edges]);

  // Cálculo de límites del diagrama con centrado
  const diagramBounds = useMemo(() => {
    if (validNodes.length === 0) return null;
    
    const bounds = {
      minX: Infinity,
      maxX: -Infinity,
      minY: Infinity,
      maxY: -Infinity,
    };

    validNodes.forEach((node) => {
      bounds.minX = Math.min(bounds.minX, node.position.x);
      bounds.maxX = Math.max(bounds.maxX, node.position.x + node.width);
      bounds.minY = Math.min(bounds.minY, node.position.y);
      bounds.maxY = Math.max(bounds.maxY, node.position.y + node.height);
    });

    const diagramWidth = bounds.maxX - bounds.minX;
    const diagramHeight = bounds.maxY - bounds.minY;
    const centerX = bounds.minX + diagramWidth / 2;
    const centerY = bounds.minY + diagramHeight / 2;

    const margin = Math.max(30, Math.min(diagramWidth, diagramHeight) * 0.1);
    bounds.minX = centerX - (diagramWidth / 2 + margin);
    bounds.maxX = centerX + (diagramWidth / 2 + margin);
    bounds.minY = centerY - (diagramHeight / 2 + margin);
    bounds.maxY = centerY + (diagramHeight / 2 + margin);

    return { ...bounds, centerX, centerY };
  }, [validNodes]);

  // Manejo de interacciones con el minimapa
  const handleMouseDown = useCallback((e) => {
    if (!isExpanded || !viewport || !diagramBounds) return;
    
    e.stopPropagation();
    setIsDragging(true);
    setLastPosition({ x: e.clientX, y: e.clientY });
  }, [isExpanded, viewport, diagramBounds]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !viewport || !diagramBounds || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const bounds = canvas.getBoundingClientRect();
    
    const deltaX = e.clientX - lastPosition.x;
    const deltaY = e.clientY - lastPosition.y;
    
    const availableWidth = width - padding * 2;
    const availableHeight = height - padding * 2;
    const diagramWidth = diagramBounds.maxX - diagramBounds.minX;
    const diagramHeight = diagramBounds.maxY - diagramBounds.minY;
    
    const scaleX = availableWidth / diagramWidth;
    const scaleY = availableHeight / diagramHeight;
    const scale = Math.min(scaleX, scaleY);
    
    const diagramDeltaX = (deltaX / scale) * viewport.zoom;
    const diagramDeltaY = (deltaY / scale) * viewport.zoom;
    
    if (viewport && viewport.setViewport) {
      viewport.setViewport({
        x: viewport.x - diagramDeltaX,
        y: viewport.y - diagramDeltaY,
        zoom: viewport.zoom
      });
    }
    
    setLastPosition({ x: e.clientX, y: e.clientY });
  }, [isDragging, lastPosition, viewport, diagramBounds, width, height, padding]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Función para dibujar el minimapa
  const drawMiniMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !diagramBounds) {
      if (validNodes.length === 0) {
        setByteMessage('⚠️ No se encontraron nodos válidos para el minimapa.');
      }
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(18, 18, 40, 0.8)';
    ctx.fillRect(0, 0, width, height);
    
    const availableWidth = width - padding * 2;
    const availableHeight = height - padding * 2;
    
    const diagramWidth = diagramBounds.maxX - diagramBounds.minX;
    const diagramHeight = diagramBounds.maxY - diagramBounds.minY;
    
    const scaleX = availableWidth / diagramWidth;
    const scaleY = availableHeight / diagramHeight;
    const scale = Math.min(scaleX, scaleY);
    
    const offsetX = padding + (availableWidth - (diagramWidth * scale)) / 2;
    const offsetY = padding + (availableHeight - (diagramHeight * scale)) / 2;

    // Calcular el centro del área visible en el lienzo principal
    const viewportCenterX = (window.innerWidth / 2 - (viewport?.x || 0)) / (viewport?.zoom || 1);
    const viewportCenterY = (window.innerHeight / 2 - (viewport?.y || 0)) / (viewport?.zoom || 1);

    // Mapear el centro del lienzo principal al centro del minimapa
    const minimapCenterX = width / 2;
    const minimapCenterY = height / 2;

    // Transformaciones ajustadas para mantener el centro fijo
    const transformX = (x) => {
      // Posición relativa al centro del diagrama
      const relativeX = x - diagramBounds.centerX;
      // Ajustar posición para centrar el diagrama en el minimapa
      const adjustedX = relativeX * scale + minimapCenterX;
      return adjustedX;
    };
    const transformY = (y) => {
      // Posición relativa al centro del diagrama
      const relativeY = y - diagramBounds.centerY;
      // Ajustar posición para centrar el diagrama en el minimapa
      const adjustedY = relativeY * scale + minimapCenterY;
      return adjustedY;
    };

    validEdges.forEach((edge) => {
      const sourceNode = validNodes.find((node) => node.id === edge.source);
      const targetNode = validNodes.find((node) => node.id === edge.target);

      if (sourceNode && targetNode) {
        const sourceX = transformX(sourceNode.position.x + sourceNode.width / 2);
        const sourceY = transformY(sourceNode.position.y + sourceNode.height / 2);
        const targetX = transformX(targetNode.position.x + targetNode.width / 2);
        const targetY = transformY(targetNode.position.y + targetNode.height / 2);

        const controlPointX = (sourceX + targetX) / 2;
        const controlPointY = (sourceY + targetY) / 2;
        const curveFactor = 0.2;
        const dx = targetX - sourceX;
        const dy = targetY - sourceY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (isExpanded && dist > 20) {
          const midX = (sourceX + targetX) / 2;
          const midY = (sourceY + targetY) / 2;
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
      }
    });

    validNodes.forEach((node) => {
      const nodeX = transformX(node.position.x);
      const nodeY = transformY(node.position.y);
      
      const nodeWidth = node.minimapWidth * scale * 1.2;
      const nodeHeight = node.minimapHeight * scale * 1.2;
      
      const centerX = nodeX + (node.width * scale) / 2;
      const centerY = nodeY + (node.height * scale) / 2;
      
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
      const vpLeft = transformX(viewportCenterX - (window.innerWidth / 2) / (viewport.zoom));
      const vpTop = transformY(viewportCenterY - (window.innerHeight / 2) / (viewport.zoom));
      const vpWidth = (window.innerWidth / viewport.zoom) * scale;
      const vpHeight = (window.innerHeight / viewport.zoom) * scale;
      
      const radius = 3;
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
      const scaleBarLength = 30;
      const realDistance = Math.round(scaleBarLength / scale);
      
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
    }
  }, [validNodes, validEdges, diagramBounds, isExpanded, width, height, padding, nodeRadius, setByteMessage, viewport]);

  useEffect(() => {
    if (canvasRef.current) {
      drawMiniMap();
    }
  }, [drawMiniMap, dimensionsUpdated, viewport?.x, viewport?.y, viewport?.zoom]);

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

  if (validNodes.length === 0) {
    return (
      <div className={`ts-custom-minimap-container ${isExpanded ? 'expanded' : 'collapsed'}`} onClick={toggleMiniMap}>
        <div className="ts-minimap-empty">
          <p>Sin nodos</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`ts-custom-minimap-container ${isExpanded ? 'expanded' : 'collapsed'} ${isDragging ? 'dragging' : ''}`}
      onClick={isDragging ? null : toggleMiniMap}
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