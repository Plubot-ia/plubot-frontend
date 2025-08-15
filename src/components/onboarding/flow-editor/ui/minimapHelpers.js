/**
 * Helpers externos para CustomMiniMap.jsx
 * Extractos de lógica interna para reducir tamaño y complejidad
 */

// Helper para ajustar brillo del color
const adjustColorBrightness = (color, factor) => {
  // Convertir hex a RGB
  const hex = color.replace('#', '');
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);

  // Ajustar brillo
  const newR = Math.min(255, Math.floor(r * factor));
  const newG = Math.min(255, Math.floor(g * factor));
  const newB = Math.min(255, Math.floor(b * factor));

  // Convertir de vuelta a hex
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
};

/**
 * Calcula el movimiento del viewport basado en delta del mouse
 */
export const calculateViewportMovement = ({ deltaX, deltaY }, { diagramBounds, viewport }) => {
  if (!diagramBounds || !viewport) {
    return { newX: 0, newY: 0 };
  }

  const scaleX = diagramBounds.width > 0 ? diagramBounds.width / 180 : 1;
  const scaleY = diagramBounds.height > 0 ? diagramBounds.height / 180 : 1;

  const newX = viewport.x - deltaX * scaleX;
  const newY = viewport.y - deltaY * scaleY;

  return { newX, newY };
};

/**
 * Calcula las posiciones de los edges en el minimap
 */
export const calculateEdgePositions = ({ sourceNode, targetNode }, { transformX, transformY }) => {
  const sourceX = transformX(sourceNode.position.x + (sourceNode.width || 100) / 2);
  const sourceY = transformY(sourceNode.position.y + (sourceNode.height || 40) / 2);
  const targetX = transformX(targetNode.position.x + (targetNode.width || 100) / 2);
  const targetY = transformY(targetNode.position.y + (targetNode.height || 40) / 2);

  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const distribution = Math.hypot(dx, dy);

  return { sourceX, sourceY, targetX, targetY, dx, dy, distribution };
};

/**
 * Dibuja el path de un edge en el canvas con estética mejorada
 */
export const drawEdgePath = (context, positions, isExpanded) => {
  const { sourceX, sourceY, targetX, targetY, dx, dy, distribution } = positions;

  // Curvas más suaves y elegantes
  if (isExpanded && distribution > 15) {
    const midX = (sourceX + targetX) / 2;
    const midY = (sourceY + targetY) / 2;
    const curveFactor = 0.15; // Curva más sutil
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
};

/**
 * Dibuja la flecha de un edge con diseño refinado
 */
export const drawEdgeArrow = (context, positions, edgeColor, isExpanded) => {
  const { targetX, targetY, dx, dy, distribution } = positions;

  if (isExpanded && distribution > 10) {
    const arrowSize = 5; // Flecha ligeramente más grande
    const angle = Math.atan2(dy, dx);

    context.save();
    context.translate(targetX, targetY);
    context.rotate(angle);

    // Flecha con diseño más elegante
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(-arrowSize, -arrowSize / 2.5);
    context.lineTo(-arrowSize * 0.7, 0);
    context.lineTo(-arrowSize, arrowSize / 2.5);
    context.closePath();

    // Gradiente para la flecha
    const gradient = context.createLinearGradient(-arrowSize, 0, 0, 0);
    gradient.addColorStop(0, adjustColorBrightness(edgeColor, 0.8));
    gradient.addColorStop(1, edgeColor);

    context.fillStyle = gradient;
    context.fill();
    context.restore();
  }
};

// Helper para obtener el color de un edge
const getEdgeColor = (edge, edgeColors, isUltraMode) => {
  const edgeType = edge.data?.type || edge.type || 'default';
  if (isUltraMode && edgeColors.ultra) {
    // eslint-disable-next-line security/detect-object-injection
    return edgeColors.ultra[edgeType] || edgeColors.ultra.default;
  }
  // eslint-disable-next-line security/detect-object-injection
  return edgeColors[edgeType] || edgeColors.default;
};

// Helper para configurar el estilo del edge
const setupEdgeStyle = (context, edgeColor, positions, isExpanded) => {
  if (isExpanded) {
    // Crear gradiente para las aristas expandidas
    const gradient = context.createLinearGradient(
      positions.sourceX,
      positions.sourceY,
      positions.targetX,
      positions.targetY,
    );
    gradient.addColorStop(0, adjustColorBrightness(edgeColor, 0.9));
    gradient.addColorStop(0.5, edgeColor);
    gradient.addColorStop(1, adjustColorBrightness(edgeColor, 1.1));

    context.strokeStyle = gradient;
    context.lineWidth = 2.5;
    context.lineCap = 'round';
    context.lineJoin = 'round';
  } else {
    context.strokeStyle = edgeColor;
    context.lineWidth = 1.8;
    context.lineCap = 'round';
  }
};

/**
 * Renderiza todos los edges en el minimap
 */
export const renderEdges = (config) => {
  const { context, validEdges, validNodes, transforms, edgeColors, isExpanded, isUltraMode } =
    config;

  if (!context || !validEdges?.length || !validNodes?.length) return;

  for (const edge of validEdges) {
    const sourceNode = validNodes.find((n) => n.id === edge.source);
    const targetNode = validNodes.find((n) => n.id === edge.target);

    if (!sourceNode || !targetNode) continue;

    const positions = calculateEdgePositions({ sourceNode, targetNode }, transforms);
    const edgeColor = getEdgeColor(edge, edgeColors, isUltraMode);

    // Configurar estilo del edge
    setupEdgeStyle(context, edgeColor, positions, isExpanded);

    context.globalAlpha = isExpanded ? 0.85 : 0.75;

    // Sombra sutil para las aristas (solo en modo expandido)
    if (isExpanded) {
      context.save();
      context.shadowColor = 'rgba(0, 0, 0, 0.15)';
      context.shadowBlur = 2;
      context.shadowOffsetX = 0.5;
      context.shadowOffsetY = 0.5;
    }

    drawEdgePath(context, positions, isExpanded);

    // Restaurar contexto si se aplicó sombra
    if (!isExpanded) {
      context.restore();
    }

    context.stroke();

    if (isExpanded) {
      drawEdgeArrow(context, positions, edgeColor, isExpanded);
    }
  }

  context.globalAlpha = 1;
};

/**
 * Renderiza todos los nodos en el minimap
 */
// Helper para calcular dimensiones de nodo - diseño refinado
const calculateNodeDimensions = (node, transforms, isExpanded) => {
  const baseWidth = node.width || 100;
  const baseHeight = node.height || 40;
  const scale = transforms.scaleX ?? transforms.scale ?? 0.1;

  // Tamaños más refinados y proporcionales
  return isExpanded
    ? {
        width: Math.max(8, Math.min(baseWidth * scale * 0.8, 20)),
        height: Math.max(6, Math.min(baseHeight * scale * 0.8, 15)),
        borderRadius: 2, // Radio de borde para esquinas redondeadas
      }
    : {
        width: 5,
        height: 5,
        borderRadius: 1.5,
      };
};

// Helper para configurar estilo de nodo - estética mejorada
const setupNodeStyle = (context, nodeColor, isUltraMode) => {
  context.fillStyle = nodeColor;
  context.globalAlpha = isUltraMode ? 0.75 : 0.95;
};

// Helper para dibujar nodo con bordes redondeados
const drawRoundedRect = (context, rect) => {
  const { x, y, width, height, radius } = rect;
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
};

export const renderNodes = (config) => {
  const { context, validNodes, transforms, nodeColors, isExpanded, isUltraMode } = config;

  if (!context || !validNodes?.length) return;

  for (const node of validNodes) {
    const x = transforms.transformX(node.position.x);
    const y = transforms.transformY(node.position.y);
    const {
      width: nodeWidth,
      height: nodeHeight,
      borderRadius,
    } = calculateNodeDimensions(node, transforms, isExpanded);

    // Color del nodo con fallback robusto
    const nodeColor = nodeColors?.[node.type] || nodeColors?.default || '#4facfe';

    // OPTIMIZATION: Skip shadows in expanded mode for better performance
    // Shadows are expensive to render and cause significant FPS drops
    // Only apply shadows in collapsed mode where canvas is smaller
    if (!isExpanded) {
      context.save();
      context.shadowColor = 'rgba(0, 0, 0, 0.15)';
      context.shadowBlur = 2;
      context.shadowOffsetX = 1;
      context.shadowOffsetY = 1;
    }

    // Configurar estilo y renderizar nodo con bordes redondeados
    setupNodeStyle(context, nodeColor, isUltraMode);
    drawRoundedRect(context, {
      x,
      y,
      width: nodeWidth,
      height: nodeHeight,
      radius: borderRadius,
    });
    context.fill();

    // Restaurar contexto si se aplicó sombra (en modo colapsado)
    if (!isExpanded) {
      context.restore(); // Quitar sombra para el borde
    }

    // Borde con gradiente sutil para nodos expandidos
    if (isExpanded) {
      // Crear gradiente para el borde
      const gradient = context.createLinearGradient(x, y, x + nodeWidth, y + nodeHeight);
      gradient.addColorStop(0, nodeColor);
      gradient.addColorStop(0.5, adjustColorBrightness(nodeColor, 1.2));
      gradient.addColorStop(1, nodeColor);

      context.strokeStyle = gradient;
      context.lineWidth = 1.5;
      context.globalAlpha = 0.8;
      drawRoundedRect(context, {
        x,
        y,
        width: nodeWidth,
        height: nodeHeight,
        radius: borderRadius,
      });
      context.stroke();

      // Highlight interno para efecto de brillo
      context.globalAlpha = 0.3;
      context.strokeStyle = '#ffffff';
      context.lineWidth = 0.5;
      drawRoundedRect(context, {
        x: x + 1,
        y: y + 1,
        width: nodeWidth - 2,
        height: nodeHeight - 2,
        radius: borderRadius - 0.5,
      });
      context.stroke();
    }
  }

  context.globalAlpha = 1;
};

/**
 * Renderiza el viewport indicator
 */
export const renderViewportIndicator = (config) => {
  const { context, viewport, diagramBounds, canvasRect, isExpanded, isUltraMode } = config;

  if (!context || !viewport || !diagramBounds || !isExpanded) return;

  const indicatorX = canvasRect.padding + Math.max(0, -viewport.x * diagramBounds.scaleX);
  const indicatorY = canvasRect.padding + Math.max(0, -viewport.y * diagramBounds.scaleY);
  const indicatorWidth = Math.min(canvasRect.drawWidth, canvasRect.drawWidth / viewport.zoom);
  const indicatorHeight = Math.min(canvasRect.drawHeight, canvasRect.drawHeight / viewport.zoom);

  // Viewport indicator
  context.strokeStyle = isUltraMode ? 'rgba(227, 23, 227, 0.8)' : '#00e0ff';
  context.lineWidth = 1.5;
  context.globalAlpha = 0.9;
  context.strokeRect(indicatorX, indicatorY, indicatorWidth, indicatorHeight);

  // Viewport fill
  context.fillStyle = isUltraMode ? 'rgba(227, 23, 227, 0.1)' : 'rgba(0, 224, 255, 0.1)';
  context.fillRect(indicatorX, indicatorY, indicatorWidth, indicatorHeight);

  context.globalAlpha = 1;
};
