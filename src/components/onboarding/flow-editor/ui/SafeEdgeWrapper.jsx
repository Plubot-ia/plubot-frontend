import React, { memo } from 'react';

import EliteEdge from './EliteEdge';

/**
 * Componente wrapper seguro para EliteEdge
 * Proporciona validación y valores por defecto para evitar errores de referencia
 */
const SafeEdgeWrapper = (props) => {
  // Asegurar que todas las propiedades requeridas estén disponibles
  const safeProps = {
    // Propiedades básicas con valores por defecto
    id: props.id || `edge-${Math.random().toString(36).substr(2, 9)}`,
    source: props.source || '',
    target: props.target || '',
    sourceX: props.sourceX || 0,
    sourceY: props.sourceY || 0,
    targetX: props.targetX || 0,
    targetY: props.targetY || 0,
    sourcePosition: props.sourcePosition || 'bottom',
    targetPosition: props.targetPosition || 'top',
    style: props.style || {},
    markerEnd: props.markerEnd || undefined,
    data: props.data || {},
    selected: Boolean(props.selected),
    label: props.label || '',
    sourceHandle: props.sourceHandle || null,
    targetHandle: props.targetHandle || null,
    className: props.className || '',
    // Resto de propiedades que puedan llegar
    ...props,
  };

  // Intentar renderizar EliteEdge con propiedades seguras
  try {
    return <EliteEdge {...safeProps} />;
  } catch (error) {
    // Renderizar una arista básica en caso de error
    return (
      <g>
        <path
          d={`M${safeProps.sourceX},${safeProps.sourceY} L${safeProps.targetX},${safeProps.targetY}`}
          stroke="#ff00cc"
          strokeWidth="3"
          fill="none"
        />
      </g>
    );
  }
};

export default memo(SafeEdgeWrapper);
