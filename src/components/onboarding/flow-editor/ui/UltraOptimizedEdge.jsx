import PropTypes from 'prop-types';
import React, { memo, useMemo } from 'react';
import { getBezierPath } from 'reactflow';

// Utility functions for edge calculations
const calculateBezierPath = ({
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
}) => {
  const [bezierPath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  return [bezierPath, labelX, labelY];
};

const createEdgeStyle = (selected, style) => ({
  stroke: selected ? '#2563eb' : '#94a3b8',
  strokeWidth: selected ? 2 : 1,
  strokeDasharray: 'none',
  fill: 'none',
  ...style,
});

const createInteractionPath = ({ sourceX, sourceY, targetX, targetY, interactionWidth }) => `
  M${sourceX},${sourceY}
  L${targetX},${targetY}
  L${targetX + interactionWidth},${targetY + interactionWidth}
  L${sourceX + interactionWidth},${sourceY + interactionWidth}
  Z
`;

const createConnectionCircle = (cx, cy, className) => (
  <circle
    cx={cx}
    cy={cy}
    r={3}
    fill='#fff'
    stroke='#2563eb'
    strokeWidth={1.5}
    className={className}
  />
);

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
  // eslint-disable-next-line react/prop-types
  _source,
  // eslint-disable-next-line react/prop-types
  _target,
  // eslint-disable-next-line react/prop-types
  _sourceHandleId,
  // eslint-disable-next-line react/prop-types
  _targetHandleId,
  interactionWidth = 20,
  ..._rest
}) => {
  // Calcular la ruta del borde
  const [path] = useMemo(
    () =>
      calculateBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
      }),
    [sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition],
  );

  // Estilo del borde
  const edgeStyle = useMemo(() => createEdgeStyle(selected, style), [selected, style]);

  // Área de interacción más grande para facilitar la selección
  const interactionPath = useMemo(
    () =>
      createInteractionPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        interactionWidth,
      }),
    [sourceX, sourceY, targetX, targetY, interactionWidth],
  );

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

      {/* Puntos de conexión */}
      {createConnectionCircle(sourceX, sourceY, 'react-flow__edge-source')}
      {createConnectionCircle(targetX, targetY, 'react-flow__edge-target')}
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
export default memo(UltraOptimizedEdge, (previousProperties, nextProperties) => {
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
});
