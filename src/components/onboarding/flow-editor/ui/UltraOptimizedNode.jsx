import PropTypes from 'prop-types';
import React, { memo, useRef, useState, useMemo, useCallback } from 'react';
import { Handle, Position } from 'reactflow';

import useFlowStore from '@/stores/use-flow-store';
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
  zIndex = 0,
  targetPosition = Position.Top,
  sourcePosition = Position.Bottom,
  dragging, // Incluimos esta propiedad pero no la pasamos a props del DOM
  dragHandle, // Incluimos esta propiedad pero no la pasamos a props del DOM
}) => {
  // Obtener el estado del modo ultra del store
  const isUltraMode = useFlowStore((state) => state.isUltraMode);

  // Referencia al nodo DOM
  const nodeReference = useRef(null);

  // Estado para manejar el hover
  const [isHovered, setIsHovered] = useState(false);

  // Manejadores de eventos de hover optimizados
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    if (!nodeReference.current) return;

    const node = nodeReference.current;
    if (isUltraMode) {
      node.style.borderColor = '#2563eb';
      node.style.boxShadow = '0 0 0 1px rgba(37, 99, 235, 0.5)';
      node.style.zIndex = '20';
    } else {
      node.classList.add('hover');
    }
  }, [isUltraMode]);

  const nodeZIndex = useMemo(() => {
    if (selected) {
      return 10;
    }
    return isUltraMode ? 1 : undefined;
  }, [selected, isUltraMode]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    if (!nodeReference.current) return;

    const node = nodeReference.current;
    if (isUltraMode) {
      node.style.borderColor = selected ? '#2563eb' : '#94a3b8';
      node.style.boxShadow = 'none';
      node.style.zIndex = selected ? '10' : '1';
    } else {
      node.classList.remove('hover');
    }
  }, [isUltraMode, selected]);

  // Determinar la clase CSS basada en el tipo de nodo
  const nodeClass = useMemo(() => {
    // Mapeo directo de tipos a sus clases CSS originales
    const nodeTypeMapping = {
      start: 'start-node',
      end: 'end-node',
      message: 'message-node',
      decision: 'decision-node',
      action: 'action-node',
      option: 'option-node',
      HTTP_REQUEST_NODE: 'httprequest-node',
      WEBHOOK_NODE: 'webhook-node',
      DATABASE_NODE: 'database-node',
      AI_NODE: 'ai-node',
      NLP_NODE: 'nlp-node',
      COMPLEX_CONDITION_NODE: 'complex-condition-node',
      POWER_NODE: 'power-node',
      default: 'message-node',
      defaultNode: 'message-node',
    };

    let nodeTypeClass;

    // Usar el mapeo existente si existe
    if (nodeTypeMapping[type]) {
      nodeTypeClass = nodeTypeMapping[type];
    } else {
      // Si no existe en el mapeo, intentar convertir el tipo a un formato válido
      try {
        nodeTypeClass = `${type.toLowerCase().replaceAll(/[_\s]+/g, '-')}-node`;
      } catch {
        // Si hay cualquier error (tipo nulo, indefinido, etc), usar un tipo por defecto
        nodeTypeClass = 'message-node';
      }
    }

    return `react-flow__node ${nodeTypeClass} ${selected ? 'selected' : ''} ${isHovered ? 'hover' : ''}`;
  }, [type, selected, isHovered]);

  // Renderizar el contenido del nodo basado en el tipo
  const renderNodeContent = useMemo(() => {
    switch (type) {
      case 'start': {
        return (
          <div className='node-content start-node-content'>
            <div className='node-title'>Inicio</div>
            <div className='node-description'>
              Flujo: {data.flowName || 'Sin nombre'}
            </div>
          </div>
        );
      }
      case 'end': {
        return (
          <div className='node-content end-node-content'>
            <div className='node-title'>Fin</div>
            <div className='node-description'>Finalizar flujo</div>
          </div>
        );
      }
      case 'message': {
        return (
          <div className='node-content message-node-content'>
            <div className='node-title'>Mensaje</div>
            <div className='node-description'>
              {data.message?.slice(0, 30) || 'Nuevo mensaje'}...
            </div>
          </div>
        );
      }
      case 'decision': {
        return (
          <div className='node-content decision-node-content'>
            <div className='node-title'>Decisión</div>
            <div className='node-description'>
              {data.condition || 'Sin condición'}
            </div>
          </div>
        );
      }
      case 'action': {
        return (
          <div className='node-content action-node-content'>
            <div className='node-title'>Acción</div>
            <div className='node-description'>
              {data.action || 'Nueva acción'}
            </div>
          </div>
        );
      }
      case 'option': {
        return (
          <div className='node-content option-node-content'>
            <div className='node-title'>Opción</div>
            <div className='node-description'>
              {data.option || 'Nueva opción'}
            </div>
          </div>
        );
      }
      case 'HTTP_REQUEST_NODE': {
        return (
          <div className='node-content httprequest-node-content'>
            <div className='node-title'>HTTP Request</div>
            <div className='node-description'>
              {data.url || 'Nueva petición HTTP'}
            </div>
          </div>
        );
      }
      case 'POWER_NODE': {
        return (
          <div className='node-content power-node-content'>
            <div className='node-title'>Power Node</div>
            <div className='node-description'>
              {data.name || 'Nodo Avanzado'}
            </div>
          </div>
        );
      }
      case 'default':
      case 'defaultNode': {
        return (
          <div className='node-content message-node-content'>
            <div className='node-title'>Nodo Base</div>
            <div className='node-description'>{data.label || 'Nodo Base'}</div>
          </div>
        );
      }

      default: {
        // Caso por defecto mejorado para usar un estilo de alguna clase existente
        const cssType = type
          ? type.toLowerCase().replaceAll(/[_\s]+/g, '-')
          : 'message';
        const displayType = type ? type.replaceAll(/[_\s]+/g, ' ') : 'Nodo';

        return (
          <div className={`node-content ${cssType}-node-content`}>
            <div className='node-title'>{displayType}</div>
            <div className='node-description'>
              {data.label || `${displayType} ${id.slice(0, 6)}`}
            </div>
          </div>
        );
      }
    }
  }, [type, data, id]);

  return (
    <div
      ref={nodeReference}
      className={nodeClass}
      style={{
        // Usar estilos específicos para cada modo y evitar elementos fantasma
        transform: isUltraMode ? `translate(${xPos}px, ${yPos}px)` : undefined,
        position: isUltraMode ? 'absolute' : undefined,
        zIndex: nodeZIndex,
        transition: isUltraMode ? 'none' : undefined,
        willChange: isUltraMode ? 'transform' : undefined,
        // Evitar renderizado de elementos innecesarios
        pointerEvents: 'all',
        userSelect: 'none',
        // Eliminar estilo adicional que pueda causar el recuadro fantasma
        outlineColor: 'transparent',
        outlineWidth: 0,
        outline: 'none',
      }}
      data-id={id}
      data-type={type}
      data-selected={selected.toString()}
      data-testid={`flow-node-${type}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Handle
        type='target'
        position={targetPosition}
        isConnectable={Boolean(isConnectable)}
        className={`node-handle target-handle ${type && typeof type === 'string' ? type.toLowerCase().replaceAll(/[_\s]+/g, '-') : 'default'}-target-handle`}
        style={{
          opacity: isUltraMode ? 0.5 : 1,
          transition: isUltraMode ? 'none' : undefined,
          pointerEvents: 'all',
        }}
      />

      <div className='node-content-container'>{renderNodeContent}</div>

      <Handle
        type='source'
        position={sourcePosition}
        isConnectable={Boolean(isConnectable)}
        className={`node-handle source-handle ${type && typeof type === 'string' ? type.toLowerCase().replaceAll(/[_\s]+/g, '-') : 'default'}-source-handle ${selected ? 'selected' : ''}`}
        style={{
          opacity: isUltraMode ? 0.5 : 1,
          transition: isUltraMode ? 'none' : undefined,
          pointerEvents: 'all',
        }}
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
  zIndex: PropTypes.number,
  targetPosition: PropTypes.string,
  sourcePosition: PropTypes.string,
  dragging: PropTypes.bool,
  dragHandle: PropTypes.string,
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
