import { useCallback } from 'react';

import { NODE_LABELS, getNodeInitialData } from '@/utils/node-config.js';
import { createSanitizedObject } from '@/utils/object-sanitizer';

// Define the properties that are safe to be included from customData
const ALLOWED_CUSTOM_DATA_PROPERTIES = ['id'];

/**
 * Hook para helpers de preparación de datos de nodos
 */
export const useNodeDataHelpers = () => {
  /**
   * Prepara los datos iniciales para un nuevo nodo
   */
  const prepareNodeData = useCallback((type, customData) => {
    // Obtener configuración del tipo de nodo de forma segura
    if (!Object.prototype.hasOwnProperty.call(NODE_LABELS, type)) {
      return;
    }
    // eslint-disable-next-line security/detect-object-injection
    const label = NODE_LABELS[type];

    // Sanitize customData to prevent object injection vulnerabilities
    const sanitizedCustomData = createSanitizedObject(customData, ALLOWED_CUSTOM_DATA_PROPERTIES);

    // Crear datos iniciales para el nodo
    return {
      ...getNodeInitialData(type, label),
      ...sanitizedCustomData,
    };
  }, []);

  /**
   * Ajusta una posición al grid de 15px
   */
  const adjustPositionToGrid = useCallback(
    (position) => ({
      x: Math.round(position.x / 15) * 15,
      y: Math.round(position.y / 15) * 15,
    }),
    [],
  );

  return {
    prepareNodeData,
    adjustPositionToGrid,
  };
};
