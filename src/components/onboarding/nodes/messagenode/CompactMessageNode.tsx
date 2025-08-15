/**
 * @file CompactMessageNode.tsx
 * @description Componente para el nivel de detalle COMPACTO del MessageNode.
 * @author PLUBOT Team
 * @version 1.1.0
 * @description_of_changes Se ha refactorizado para eliminar el acceso directo al store de Zustand (antipatrón). Ahora, todos los datos se reciben exclusivamente a través de `props`, garantizando un flujo de datos unidireccional y predecible, y previniendo el renderizado de datos obsoletos.
 */

import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

import type { MessageType } from './MessageNodeIcon';
import { MessageNodeIcon } from './MessageNodeIcon';
import './MessageNode.css';

const typeToTitle = (type?: MessageType): string => {
  const titles: Record<string, string> = {
    system: 'Sistema',
    user: 'Usuario',
    assistant: 'Asistente',
    error: 'Error',
    warning: 'Advertencia',
    info: 'Información',
    success: 'Éxito',
  };

  return titles[type ?? ''] ?? 'Mensaje';
};

// Helper para obtener estilos dinámicos del nodo
function _getNodeStyle(messageType?: MessageType) {
  const isSystem = messageType === 'system';

  const systemStyle = {
    background: 'linear-gradient(145deg, rgba(59, 7, 100, 0.8), rgba(59, 7, 100, 1))',
    border: '1px solid rgba(37, 99, 235, 0.5)',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
  };

  const otherStyle = {
    background: 'linear-gradient(145deg, rgba(23, 37, 84, 0.8), rgba(23, 37, 84, 1))',
    border: '1px solid rgba(37, 99, 235, 0.5)',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
  };

  return {
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center' as const,
    width: 178,
    height: 58,
    paddingTop: '8px',
    paddingBottom: '8px',
    paddingLeft: '8px',
    paddingRight: '2px', // PADDING DERECHO MÍNIMO PARA SIMETRÍA REAL
    borderRadius: '12px',
    ...(isSystem ? systemStyle : otherStyle),
  };
}

// Helper para renderizar header del nodo
function _renderNodeHeader(messageType?: MessageType, title?: string) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between', // Distribuir espacio entre elementos
        marginBottom: '4px',
        marginRight: '0px', // Sin margen derecho para maximizar espacio
        paddingRight: '2px', // Padding mínimo para evitar que el tooltip toque el borde
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <MessageNodeIcon type={messageType} />
        <h3
          style={{
            marginLeft: '8px',
            fontSize: '14px',
            fontWeight: 'bold',
            color: 'white',
            margin: 0,
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </h3>
      </div>
      {/* Espacio mínimo para iconos adicionales como tooltip - pegado al contenido */}
      <div style={{ minWidth: '4px' }} />
    </div>
  );
}

// Helper para renderizar contenido del mensaje
function _renderNodeContent(truncatedMessage?: string) {
  return (
    <div
      style={{
        fontSize: '12px',
        color: 'rgba(255, 255, 255, 0.8)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        marginLeft: '24px', // Alinear con el título (8px del icono + 8px del marginLeft + 8px adicional para alineación)
        marginRight: '0px', // Sin margen derecho para maximizar el uso del espacio
        paddingRight: '2px', // Padding mínimo para evitar que el texto toque el borde
      }}
    >
      {truncatedMessage ?? ' '}
    </div>
  );
}

interface CompactMessageNodeData {
  messageType?: MessageType;
  message?: string;
  title?: string;
}

interface CompactMessageNodeProps {
  data: CompactMessageNodeData;
  selected?: boolean;
  _isConnectable?: boolean;
}

// El componente ahora es más puro, dependiendo únicamente de sus props.
const CompactMessageNode = memo<CompactMessageNodeProps>(
  ({ data, selected, _isConnectable = true }) => {
    // Los datos se obtienen directamente de las props, la única fuente de verdad.
    const { messageType, message, title: customTitle } = data;

    const title = customTitle ?? typeToTitle(messageType);
    const truncatedMessage =
      message?.length && message.length > 30 ? `${message.slice(0, 30)}...` : message;

    const nodeClasses = [
      'message-node',
      'message-node--compact',
      'message-node--ultra-performance', // Apply ultra-performance styling for compact mode
      selected ? 'message-node--selected' : '',
      selected ? 'message-node--selected-style' : '',
    ]
      .filter(Boolean)
      .join(' ');

    const nodeStyle = _getNodeStyle(messageType);

    return (
      <div className={nodeClasses} style={nodeStyle}>
        {/* Handle de entrada - centrado en la parte superior */}
        <Handle
          type='target'
          position={Position.Top}
          id='input'
          isConnectable
          className='message-node__handle message-node__handle--target'
          aria-label='Punto de conexión de entrada'
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          {_renderNodeHeader(messageType, title)}
          {_renderNodeContent(truncatedMessage)}
        </div>

        {/* Handle de salida - centrado en la parte inferior */}
        <Handle
          type='source'
          position={Position.Bottom}
          id='output'
          isConnectable
          className='message-node__handle message-node__handle--source'
          aria-label='Punto de conexión de salida'
        />
      </div>
    );
  },
);

CompactMessageNode.displayName = 'CompactMessageNode';

// Se elimina la prop 'id' de propTypes ya que no se utiliza.
export default memo(CompactMessageNode);
