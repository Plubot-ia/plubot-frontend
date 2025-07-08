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
const CustomEdge = (properties) => {
  // Extraer propiedades relevantes
  const {
    sourceHandleId,
    sourceHandle,
    sourceX,
    id,
    source,
    target,
    data,
    ...restProperties
  } = properties;

  // Crear un objeto de propiedades ajustadas
  const adjustedProperties = { ...restProperties };

  // Normalizar sourceHandle: priorizar sourceHandleId si existe
  let normalizedSourceHandle = sourceHandle;

  // Procesar sourceHandle si tiene formato JSON serializado
  if (typeof sourceHandle === 'string' && sourceHandle.startsWith('|||{')) {
    try {
      // Extraer el JSON después del prefijo '|||'
      const jsonString = sourceHandle.slice(3);
      const handleData = JSON.parse(jsonString);

      // Usar el sourceHandle interno
      normalizedSourceHandle = handleData.sourceHandle || 'default';

      // Si hay un targetHandle en los datos, pasarlo a las props ajustadas
      if (handleData.targetHandle) {
        adjustedProperties.targetHandle = handleData.targetHandle;
      }
    } catch {
      normalizedSourceHandle = 'default';
    }
  }

  // Si hay un sourceHandleId, usarlo y ajustar la posición X
  if (sourceHandleId) {
    normalizedSourceHandle = sourceHandleId;

    // Ajustar posición para handles múltiples en nodos de decisión
    const nodeWidth = 150; // Ancho estándar de los nodos
    const outputIndex = Number.parseInt(sourceHandleId.split('-')[1], 10) || 0;
    const offsetX = (outputIndex - 0.5) * (nodeWidth / 2);

    // Ajustar sourceX si está definido
    if (typeof sourceX === 'number') {
      adjustedProperties.sourceX = sourceX + offsetX;
    }
  }

  // Asegurarse de que los IDs estén presentes
  adjustedProperties.id = id || `edge-${source}-${target}-${Date.now()}`;
  adjustedProperties.source = source;
  adjustedProperties.target = target;

  // Pasar sourceHandle normalizado
  adjustedProperties.sourceHandle = normalizedSourceHandle;

  // Pasar data si existe
  if (data) {
    adjustedProperties.data = data;
  }

  // Usar EliteEdge para el renderizado con propiedades normalizadas
  return <EliteEdge {...adjustedProperties} />;
};

export default CustomEdge;
