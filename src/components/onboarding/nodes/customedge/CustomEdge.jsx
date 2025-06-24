import React from 'react';

import EliteEdge from '../../flow-editor/ui/EliteEdge';

/**
 * CustomEdge - Wrapper inteligente para EliteEdge
 * Este componente redirige todas las propiedades a EliteEdge con normalización
 * para mantener un renderizado y estilo consistente de las aristas en toda la aplicación.
 *
 * @version 2.0.0
 * @param {Object} props - Todas las propiedades de la arista
 * @returns {JSX.Element} EliteEdge con las propiedades ajustadas
 */
const CustomEdge = (props) => {
  // Extraer propiedades relevantes
  const {
    sourceHandleId,
    sourceHandle,
    sourceX,
    id,
    source,
    target,
    data,
    ...restProps
  } = props;

  // Crear un objeto de propiedades ajustadas
  const adjustedProps = { ...restProps };

  // Normalizar sourceHandle: priorizar sourceHandleId si existe
  let normalizedSourceHandle = sourceHandle;

  // Procesar sourceHandle si tiene formato JSON serializado
  if (typeof sourceHandle === 'string' && sourceHandle.startsWith('|||{')) {
    try {
      // Extraer el JSON después del prefijo '|||'
      const jsonStr = sourceHandle.substring(3);
      const handleData = JSON.parse(jsonStr);

      // Usar el sourceHandle interno
      normalizedSourceHandle = handleData.sourceHandle || 'default';

      // Si hay un targetHandle en los datos, pasarlo a las props ajustadas
      if (handleData.targetHandle) {
        adjustedProps.targetHandle = handleData.targetHandle;
      }
    } catch (error) {

      normalizedSourceHandle = 'default';
    }
  }

  // Si hay un sourceHandleId, usarlo y ajustar la posición X
  if (sourceHandleId) {
    normalizedSourceHandle = sourceHandleId;

    // Ajustar posición para handles múltiples en nodos de decisión
    const nodeWidth = 150; // Ancho estándar de los nodos
    const outputIndex = parseInt(sourceHandleId.split('-')[1], 10) || 0;
    const offsetX = (outputIndex - 0.5) * (nodeWidth / 2);

    // Ajustar sourceX si está definido
    if (typeof sourceX === 'number') {
      adjustedProps.sourceX = sourceX + offsetX;
    }
  }

  // Asegurarse de que los IDs estén presentes
  adjustedProps.id = id || `edge-${source}-${target}-${Date.now()}`;
  adjustedProps.source = source;
  adjustedProps.target = target;

  // Pasar sourceHandle normalizado
  adjustedProps.sourceHandle = normalizedSourceHandle;

  // Pasar data si existe
  if (data) {
    adjustedProps.data = data;
  }

  // Usar EliteEdge para el renderizado con propiedades normalizadas
  return <EliteEdge {...adjustedProps} />;
};

export default CustomEdge;