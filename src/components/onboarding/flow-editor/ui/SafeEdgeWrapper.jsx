import { memo } from 'react';

import EliteEdge from './EliteEdge';

// Helpers para reducir complejidad del SafeEdgeWrapper
const _generateRandomId = () => {
  // Use crypto.randomUUID() for truly unique and secure ID generation
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `edge-${crypto.randomUUID()}`;
  }
  // Fallback determinístico para entornos sin crypto.randomUUID
  return `edge-${Date.now()}-${(Date.now() % 1_000_000).toString(36)}`;
};

const _createSafeProperties = (properties) => {
  // Valores por defecto consolidados para reducir complejidad
  const defaults = {
    id: _generateRandomId(),
    source: '',
    target: '',
    sourceX: 0,
    sourceY: 0,
    targetX: 0,
    targetY: 0,
    sourcePosition: 'bottom',
    targetPosition: 'top',
    style: {},
    data: {},
    selected: false,
    label: '',
    className: '',
  };

  return {
    ...defaults,
    ...properties,
    selected: Boolean(properties.selected),
  };
};

const _renderFallbackEdge = (safeProperties) => (
  <g>
    <path
      d={`M${safeProperties.sourceX},${safeProperties.sourceY} L${safeProperties.targetX},${safeProperties.targetY}`}
      stroke='#ff00cc'
      strokeWidth='3'
      fill='none'
    />
  </g>
);

/**
 * Componente wrapper seguro para EliteEdge
 * Proporciona validación y valores por defecto para evitar errores de referencia
 */
const SafeEdgeWrapper = (properties) => {
  // Crear propiedades seguras con valores por defecto
  const safeProperties = _createSafeProperties(properties);

  // Intentar renderizar EliteEdge con propiedades seguras
  try {
    return <EliteEdge {...safeProperties} />;
  } catch {
    // Renderizar una arista básica en caso de error
    return _renderFallbackEdge(safeProperties);
  }
};

// Helper function to check coordinate changes
const hasSignificantCoordinateChange = (previousProps, nextProps) => {
  const COORDINATE_TOLERANCE = 15; // Higher tolerance for smooth drag

  const coordinates = [
    { prev: previousProps.sourceX ?? 0, next: nextProps.sourceX ?? 0 },
    { prev: previousProps.sourceY ?? 0, next: nextProps.sourceY ?? 0 },
    { prev: previousProps.targetX ?? 0, next: nextProps.targetX ?? 0 },
    { prev: previousProps.targetY ?? 0, next: nextProps.targetY ?? 0 },
  ];

  return coordinates.some(({ prev, next }) => Math.abs(prev - next) > COORDINATE_TOLERANCE);
};

// ULTRA PERFORMANCE OPTIMIZATION: Custom memo comparison for drag operations
const SafeEdgeWrapperOptimized = memo(SafeEdgeWrapper, (previousProps, nextProps) => {
  // Critical identity checks - always re-render if these change
  const hasIdentityChange =
    previousProps.id !== nextProps.id ||
    previousProps.source !== nextProps.source ||
    previousProps.target !== nextProps.target;

  if (hasIdentityChange) {
    return false; // Re-render
  }

  // Selection state changes - important for UX
  if (previousProps.selected !== nextProps.selected) {
    return false; // Re-render
  }

  // Only re-render for significant coordinate changes
  return !hasSignificantCoordinateChange(previousProps, nextProps);
});

export default SafeEdgeWrapperOptimized;
