import { memo } from 'react';

import EliteEdge from './EliteEdge';

/**
 * Componente wrapper seguro para EliteEdge
 * Proporciona validación y valores por defecto para evitar errores de referencia
 */
const SafeEdgeWrapper = (properties) => {
  // Asegurar que todas las propiedades requeridas estén disponibles
  const safeProperties = {
    // Resto de propiedades que puedan llegar
    ...properties,
    // Propiedades básicas con valores por defecto
    id: properties.id || `edge-${Math.random().toString(36).slice(2, 11)}`,
    source: properties.source || '',
    target: properties.target || '',
    sourceX: properties.sourceX || 0,
    sourceY: properties.sourceY || 0,
    targetX: properties.targetX || 0,
    targetY: properties.targetY || 0,
    sourcePosition: properties.sourcePosition || 'bottom',
    targetPosition: properties.targetPosition || 'top',
    style: properties.style || {},
    markerEnd: properties.markerEnd || undefined,
    data: properties.data || {},
    selected: Boolean(properties.selected),
    label: properties.label || '',
    sourceHandle: properties.sourceHandle || undefined,
    targetHandle: properties.targetHandle || undefined,
    className: properties.className || '',
  };

  // Intentar renderizar EliteEdge con propiedades seguras
  try {
    return <EliteEdge {...safeProperties} />;
  } catch {
    // Renderizar una arista básica en caso de error
    return (
      <g>
        <path
          d={`M${safeProperties.sourceX},${safeProperties.sourceY} L${safeProperties.targetX},${safeProperties.targetY}`}
          stroke='#ff00cc'
          strokeWidth='3'
          fill='none'
        />
      </g>
    );
  }
};

export default memo(SafeEdgeWrapper);
