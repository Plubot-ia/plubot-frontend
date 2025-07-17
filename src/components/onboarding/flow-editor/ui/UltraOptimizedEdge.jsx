import PropTypes from 'prop-types';
import React, { memo, useMemo } from 'react';
import { getBezierPath } from 'reactflow';

/**
 * UltraOptimizedEdge - Versión ultra optimizada de un borde para el modo de alto rendimiento
 * @version 1.0.0
 * @author Cascade AI
 */
const UltraOptimizedEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
  source,
  target,
  sourceHandleId,
  targetHandleId,
  interactionWidth = 20,
  ...rest
}) => {
  // Calcular la ruta del borde
  const [path] = useMemo(() => {
    const [path, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });

    return [path, labelX, labelY];
  }, [sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition]);

  // Estilo del borde
  const edgeStyle = useMemo(
    () => ({
      stroke: selected ? '#2563eb' : '#94a3b8',
      strokeWidth: selected ? 2 : 1,
      strokeDasharray: 'none',
      fill: 'none',
      ...style,
    }),
    [selected, style],
  );

  // Área de interacción más grande para facilitar la selección
  const interactionPath = useMemo(() => {
    // Crear un área de interacción más ancha alrededor del borde
    return `
      M${sourceX},${sourceY}
      L${targetX},${targetY}
      L${targetX + interactionWidth},${targetY + interactionWidth}
      L${sourceX + interactionWidth},${sourceY + interactionWidth}
      Z
    `;
  }, [sourceX, sourceY, targetX, targetY, interactionWidth]);

  return (
    <>
      {/* Borde visible */}
      <path
        id={id}
        className='react-flow__edge-path'
        d={path}
        style={edgeStyle}
        markerEnd={markerEnd}
      />

      {/* Área de interacción invisible pero más grande */}
      <path
        className='react-flow__edge-interaction'
        d={interactionPath}
        fill='none'
        stroke='transparent'
        strokeWidth={interactionWidth}
        pointerEvents='stroke'
      />

      {/* Punto de conexión de origen */}
      <circle
        cx={sourceX}
        cy={sourceY}
        r={3}
        fill='#fff'
        stroke='#2563eb'
        strokeWidth={1.5}
        className='react-flow__edge-source'
      />

      {/* Punto de conexión de destino */}
      <circle
        cx={targetX}
        cy={targetY}
        r={3}
        fill='#fff'
        stroke='#2563eb'
        strokeWidth={1.5}
        className='react-flow__edge-target'
      />
    </>
  );
};

UltraOptimizedEdge.propTypes = {
  id: PropTypes.string.isRequired,
  sourceX: PropTypes.number.isRequired,
  sourceY: PropTypes.number.isRequired,
  targetX: PropTypes.number.isRequired,
  targetY: PropTypes.number.isRequired,
  sourcePosition: PropTypes.string,
  targetPosition: PropTypes.string,
  style: PropTypes.object,
  markerEnd: PropTypes.string,
  selected: PropTypes.bool,
  source: PropTypes.string.isRequired,
  target: PropTypes.string.isRequired,
  sourceHandleId: PropTypes.string,
  targetHandleId: PropTypes.string,
  interactionWidth: PropTypes.number,
};

UltraOptimizedEdge.displayName = 'UltraOptimizedEdge';

// Usar React.memo para evitar re-renderizados innecesarios
export default memo(
  UltraOptimizedEdge,
  (previousProperties, nextProperties) => {
    // Solo volver a renderizar si estas propiedades cambian
    return (
      previousProperties.sourceX === nextProperties.sourceX &&
      previousProperties.sourceY === nextProperties.sourceY &&
      previousProperties.targetX === nextProperties.targetX &&
      previousProperties.targetY === nextProperties.targetY &&
      previousProperties.sourcePosition === nextProperties.sourcePosition &&
      previousProperties.targetPosition === nextProperties.targetPosition &&
      previousProperties.selected === nextProperties.selected &&
      previousProperties.style === nextProperties.style
    );
  },
);
