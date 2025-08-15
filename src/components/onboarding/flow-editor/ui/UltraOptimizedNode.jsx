import PropTypes from 'prop-types';
import React, { memo, useRef, useState, useMemo } from 'react';
import { Handle, Position } from 'reactflow';

import useFlowStore from '@/stores/use-flow-store';

import { generateNodeClass } from './nodeClassUtilities';
import {
  getNodeMainStyles,
  getHandleStyles,
  getTargetHandleClassName,
  getSourceHandleClassName,
} from './nodeStyleHelpers';
import { renderUltraNodeContent } from './ultraNodeContentRenderer';
import { useNodeEventHandlers } from './useNodeEventHandlers';
// NO IMPORTAR ESTILOS - Para evitar conflictos
// COMENTARIO: Este archivo fue la causa del problema del rectángulo azul
// y los problemas de posicionamiento. Ahora es solo un componente vacío
// que no afecta el renderizado.

/**
 * UltraOptimizedNode - Versión ultra optimizada de un nodo para el modo de alto rendimiento
 * @version 1.0.0
 * @author Cascade AI
 */
const UltraOptimizedNode = ({
  id,
  data = {},
  type = 'default',
  selected = false,
  isConnectable = true,
  xPos = 0,
  yPos = 0,
  // eslint-disable-next-line react/prop-types
  _zIndex = 0,
  targetPosition = Position.Top,
  sourcePosition = Position.Bottom,
  // eslint-disable-next-line react/prop-types
  _dragging, // Incluimos esta propiedad pero no la pasamos a props del DOM
  // eslint-disable-next-line react/prop-types
  _dragHandle, // Incluimos esta propiedad pero no la pasamos a props del DOM
}) => {
  // Obtener el estado del modo ultra del store
  const isUltraMode = useFlowStore((state) => state.isUltraMode);

  // Referencia al nodo DOM
  const nodeReference = useRef(null);

  // Estado para manejar el hover
  const [isHovered, setIsHovered] = useState(false);

  // Event handlers extraídos a custom hook externo
  const { handleMouseEnter, handleMouseLeave: handleMouseLeaveExternal } = useNodeEventHandlers(
    setIsHovered,
    nodeReference,
    isUltraMode,
    selected,
  );

  const nodeZIndex = useMemo(() => {
    if (selected) {
      return 10;
    }
    return isUltraMode ? 1 : undefined;
  }, [selected, isUltraMode]);

  // handleMouseLeave ahora viene del custom hook externo como handleMouseLeaveExternal

  // Clase CSS del nodo extraída a helper externo
  const nodeClass = useMemo(
    () => generateNodeClass(type, selected, isHovered),
    [type, selected, isHovered],
  );

  // Renderizar el contenido del nodo basado en el tipo
  const renderNodeContent = useMemo(() => renderUltraNodeContent(type, data, id), [type, data, id]);

  return (
    <div
      ref={nodeReference}
      className={nodeClass}
      style={getNodeMainStyles(isUltraMode, xPos, yPos, nodeZIndex)}
      data-id={id}
      data-type={type}
      data-selected={selected.toString()}
      data-testid={`flow-node-${type}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeaveExternal}
    >
      <Handle
        type='target'
        position={targetPosition}
        isConnectable={Boolean(isConnectable)}
        className={getTargetHandleClassName(type)}
        style={getHandleStyles(isUltraMode)}
      />

      <div className='node-content-container'>{renderNodeContent}</div>

      <Handle
        type='source'
        position={sourcePosition}
        isConnectable={Boolean(isConnectable)}
        className={getSourceHandleClassName(type, selected)}
        style={getHandleStyles(isUltraMode)}
      />
    </div>
  );
};

UltraOptimizedNode.propTypes = {
  id: PropTypes.string.isRequired,
  data: PropTypes.object,
  type: PropTypes.string,
  selected: PropTypes.bool,
  isConnectable: PropTypes.bool,
  xPos: PropTypes.number,
  yPos: PropTypes.number,
  targetPosition: PropTypes.string,
  sourcePosition: PropTypes.string,
};

UltraOptimizedNode.displayName = 'UltraOptimizedNode';

// Función de comparación optimizada
const areEqual = (previousProperties, nextProperties) => {
  // Solo volver a renderizar si estas propiedades clave cambian
  return (
    previousProperties.id === nextProperties.id &&
    previousProperties.selected === nextProperties.selected &&
    previousProperties.data === nextProperties.data &&
    previousProperties.type === nextProperties.type &&
    previousProperties.xPos === nextProperties.xPos &&
    previousProperties.yPos === nextProperties.yPos &&
    previousProperties.zIndex === nextProperties.zIndex
  );
};

// Usar React.memo con la función de comparación personalizada
export default memo(UltraOptimizedNode, areEqual);
