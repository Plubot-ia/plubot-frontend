import { DEFAULT_SOURCE_HANDLE } from '../../../../config/handleConfig';
import EliteEdge from '../../flow-editor/ui/EliteEdge';

/**
 * Procesa un sourceHandle con formato JSON serializado
 * @param {string} sourceHandle - Handle a procesar
 * @returns {Object} Objeto con sourceHandle y targetHandle normalizados
 */
function _processJsonSourceHandle(sourceHandle) {
  if (typeof sourceHandle === 'string' && sourceHandle.startsWith('|||{')) {
    try {
      // Extraer el JSON después del prefijo '|||'
      const jsonString = sourceHandle.slice(3);
      const handleData = JSON.parse(jsonString);

      return {
        sourceHandle: handleData.sourceHandle || DEFAULT_SOURCE_HANDLE,
        targetHandle: handleData.targetHandle ?? undefined,
      };
    } catch {
      return { sourceHandle: DEFAULT_SOURCE_HANDLE, targetHandle: undefined };
    }
  }
  return { sourceHandle, targetHandle: undefined };
}

/**
 * Ajusta las propiedades de posición para handles múltiples
 * @param {string} sourceHandleId - ID del handle fuente
 * @param {number} sourceX - Posición X original
 * @returns {Object} Objeto con sourceHandle y sourceX ajustados
 */
function _adjustHandlePosition(sourceHandleId, sourceX) {
  if (!sourceHandleId) {
    return { sourceHandle: undefined, sourceX };
  }

  // Ajustar posición para handles múltiples en nodos de decisión
  const nodeWidth = 150; // Ancho estándar de los nodos
  const outputIndex = Number.parseInt(sourceHandleId.split('-')[1], 10) ?? 0;
  const offsetX = (outputIndex - 0.5) * (nodeWidth / 2);

  // Ajustar sourceX si está definido
  const adjustedSourceX = typeof sourceX === 'number' ? sourceX + offsetX : sourceX;

  return {
    sourceHandle: sourceHandleId,
    sourceX: adjustedSourceX,
  };
}

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
  const { sourceHandleId, sourceHandle, sourceX, id, source, target, data, ...restProperties } =
    properties;

  // Crear un objeto de propiedades ajustadas
  const adjustedProperties = { ...restProperties };

  // Procesar sourceHandle si tiene formato JSON serializado
  const { sourceHandle: processedSourceHandle, targetHandle: processedTargetHandle } =
    _processJsonSourceHandle(sourceHandle);

  // Si hay un targetHandle procesado, agregarlo a las props ajustadas
  if (processedTargetHandle) {
    adjustedProperties.targetHandle = processedTargetHandle;
  }

  // Ajustar posición y handle basado en sourceHandleId
  const { sourceHandle: adjustedSourceHandle, sourceX: adjustedSourceX } = _adjustHandlePosition(
    sourceHandleId,
    sourceX,
  );

  // Determinar el sourceHandle final: priorizar sourceHandleId si existe
  const finalSourceHandle = adjustedSourceHandle || processedSourceHandle;

  // Aplicar sourceX ajustado si fue modificado
  if (adjustedSourceX !== sourceX) {
    adjustedProperties.sourceX = adjustedSourceX;
  }

  // Asegurarse de que los IDs estén presentes
  adjustedProperties.id = id || `edge-${source}-${target}-${Date.now()}`;
  adjustedProperties.source = source;
  adjustedProperties.target = target;

  // Pasar sourceHandle final
  adjustedProperties.sourceHandle = finalSourceHandle;

  // Pasar data si existe
  if (data) {
    adjustedProperties.data = data;
  }

  // Usar EliteEdge para el renderizado con propiedades normalizadas
  return <EliteEdge {...adjustedProperties} />;
};

export default CustomEdge;
