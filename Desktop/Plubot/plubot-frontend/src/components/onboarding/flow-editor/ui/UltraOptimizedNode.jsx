import React, { memo, useMemo, useRef, useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import useFlowStore from '@/stores/useFlowStore';

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
  ...rest
}) => {
  // Obtener el estado del modo ultra del store
  const isUltraMode = useFlowStore(state => state.isUltraMode);

  // Referencia al nodo DOM
  const nodeRef = useRef(null);
  
  // Estado para manejar el hover
  const [isHovered, setIsHovered] = React.useState(false);

  // Determinar el estilo base del nodo (sin hover)
  const baseNodeStyle = useMemo(() => {
    const style = {
      // Posicionamiento controlado por React Flow
      position: 'absolute',
      left: `${xPos}px`,
      top: `${yPos}px`,
      width: 'auto',
      height: 'auto',
      // Estilos visuales
      padding: '8px 12px',
      borderRadius: '4px',
      border: `2px solid ${selected ? '#2563eb' : '#94a3b8'}`,
      backgroundColor: '#ffffff',
      color: '#1e293b',
      fontSize: '12px',
      fontWeight: 500,
      minWidth: '120px',
      // Optimizaciones de rendimiento
      willChange: isUltraMode ? 'left, top' : 'auto',
      contain: 'content',
      zIndex: selected ? 10 : 1,
      // Mejorar renderizado
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
      // Asegurar que no haya transiciones que causen parpadeo
      transition: 'none',
      // Aplicar estilos personalizados (si los hay)
      ...data.style,
    };

    return style;
  }, [selected, data.style, xPos, yPos, isUltraMode]);
  
  // Manejadores de eventos de hover optimizados
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    if (!nodeRef.current) return;
    
    const node = nodeRef.current;
    if (isUltraMode) {
      node.style.borderColor = '#2563eb';
      node.style.boxShadow = '0 0 0 1px rgba(37, 99, 235, 0.5)';
      node.style.zIndex = '20';
    } else {
      node.classList.add('hover');
    }
  }, [isUltraMode]);
  
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    if (!nodeRef.current) return;
    
    const node = nodeRef.current;
    if (isUltraMode) {
      node.style.borderColor = selected ? '#2563eb' : '#94a3b8';
      node.style.boxShadow = 'none';
      node.style.zIndex = selected ? '10' : '1';
    } else {
      node.classList.remove('hover');
    }
  }, [isUltraMode, selected]);

  // Estilo del título del nodo
  const titleStyle = useMemo(() => ({
    margin: '0 0 4px 0',
    paddingBottom: '4px',
    borderBottom: '1px solid #e2e8f0',
    fontSize: '11px',
    fontWeight: 600,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    color: selected ? '#2563eb' : '#475569',
  }), [selected]);

  // Renderizar el contenido del nodo basado en el tipo
  const renderNodeContent = useMemo(() => {
    switch (type) {
      case 'start':
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={titleStyle}>Inicio</div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>Flujo: {data.flowName || 'Sin nombre'}</div>
          </div>
        );
      case 'end':
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={titleStyle}>Fin</div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>Finalizar flujo</div>
          </div>
        );
      case 'message':
        return (
          <div>
            <div style={titleStyle}>Mensaje</div>
            <div style={{ fontSize: '10px', color: '#475569' }}>
              {data.message?.substring(0, 30) || 'Nuevo mensaje'}...
            </div>
          </div>
        );
      case 'decision':
        return (
          <div>
            <div style={titleStyle}>Decisión</div>
            <div style={{ fontSize: '10px', color: '#475569' }}>
              {data.condition || 'Sin condición'}
            </div>
          </div>
        );
      default:
        return (
          <div>
            <div style={titleStyle}>{type}</div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>ID: {id.substring(0, 6)}</div>
          </div>
        );
    }
  }, [type, data, id, titleStyle]);

  // Usar useMemo para combinar estilos solo cuando sea necesario
  const nodeStyle = useMemo(() => ({
    ...baseNodeStyle,
    // Aplicar estilos de hover directamente en el estilo base
    ':hover': !isUltraMode ? {
      borderColor: '#2563eb',
      boxShadow: '0 0 0 1px rgba(37, 99, 235, 0.5)',
      zIndex: 10,
    } : {}
  }), [baseNodeStyle, isUltraMode]);
  return (
    <div
      ref={nodeRef}
      className={`react-flow__node ${selected ? 'selected' : ''} ${isHovered ? 'hover' : ''}`}
      style={isUltraMode ? baseNodeStyle : nodeStyle}
      data-id={id}
      data-type={type}
      data-selected={selected}
      data-testid={`flow-node-${type}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...rest}
    >
      <Handle 
        type="target" 
        position={targetPosition} 
        isConnectable={isConnectable}
        style={{
          opacity: isUltraMode ? 0.5 : 1,
          transition: isUltraMode ? 'none' : 'opacity 0.15s ease',
          width: '8px',
          height: '8px',
          background: '#94a3b8',
          pointerEvents: 'all',
        }}
      />
      
      <div style={{
        position: 'relative',
        zIndex: 1,
        pointerEvents: 'auto',
      }}>
        {renderNodeContent}
      </div>
      
      <Handle
        type="source"
        position={sourcePosition}
        isConnectable={isConnectable}
        style={{
          width: '8px',
          height: '8px',
          background: selected ? '#2563eb' : '#94a3b8',
          opacity: isUltraMode ? 0.5 : 1,
          transition: isUltraMode ? 'none' : 'opacity 0.15s ease',
          pointerEvents: 'all',
        }}
      />
    </div>
  );
};

// Función de comparación optimizada
const areEqual = (prevProps, nextProps) => {
  // Solo volver a renderizar si estas propiedades clave cambian
  return (
    prevProps.id === nextProps.id &&
    prevProps.selected === nextProps.selected &&
    prevProps.data === nextProps.data &&
    prevProps.type === nextProps.type &&
    prevProps.xPos === nextProps.xPos &&
    prevProps.yPos === nextProps.yPos &&
    prevProps.zIndex === nextProps.zIndex
  );
};

// Usar React.memo con la función de comparación personalizada
export default memo(UltraOptimizedNode, areEqual);
