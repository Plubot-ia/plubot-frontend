/**
 * @file CompactMessageNode.jsx
 * @description Componente para el nivel de detalle COMPACTO del MessageNode.
 * @author PLUBOT Team
 * @version 1.1.0
 * @description_of_changes Se ha refactorizado para eliminar el acceso directo al store de Zustand (antipatrón). Ahora, todos los datos se reciben exclusivamente a través de `props`, garantizando un flujo de datos unidireccional y predecible, y previniendo el renderizado de datos obsoletos.
 */

import PropTypes from 'prop-types';
import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

import { MessageNodeIcon } from './MessageNodeIcon';
import './MessageNode.css';

const typeToTitle = (type) => {
  const titles = {
    system: 'Sistema',
    user: 'Usuario',
    assistant: 'Asistente',
    error: 'Error',
    warning: 'Advertencia',
    info: 'Información',
    success: 'Éxito',
  };
  // eslint-disable-next-line security/detect-object-injection
  return titles[type] || 'Mensaje';
};

// Helper para obtener estilos dinámicos del nodo
function _getNodeStyle(messageType) {
  const isSystem = messageType === 'system';

  const systemStyle = {
    background:
      'linear-gradient(145deg, rgba(59, 7, 100, 0.8), rgba(59, 7, 100, 1))',
    border: '1px solid rgba(37, 99, 235, 0.5)',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
  };

  const otherStyle = {
    background:
      'linear-gradient(145deg, rgba(23, 37, 84, 0.8), rgba(23, 37, 84, 1))',
    border: '1px solid rgba(37, 99, 235, 0.5)',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
  };

  return {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    width: 178,
    height: 58,
    padding: '8px',
    borderRadius: '12px',
    ...(isSystem ? systemStyle : otherStyle),
  };
}

// Helper para renderizar header del nodo
function _renderNodeHeader(messageType, title) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
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
  );
}

// Helper para renderizar contenido del mensaje
function _renderNodeContent(truncatedMessage) {
  return (
    <div
      style={{
        fontSize: '12px',
        color: 'rgba(255, 255, 255, 0.8)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {truncatedMessage || ' '}
    </div>
  );
}

// El componente ahora es más puro, dependiendo únicamente de sus props.
const CompactMessageNode = memo(({ data, selected }) => {
  // Los datos se obtienen directamente de las props, la única fuente de verdad.
  const { messageType, message, title: customTitle } = data;

  const title = customTitle || typeToTitle(messageType);
  const truncatedMessage =
    message?.length > 30 ? `${message.slice(0, 30)}...` : message;

  const nodeClasses = [
    'message-node',
    'message-node--compact',
    selected ? 'message-node--selected-style' : '',
  ].join(' ');

  const nodeStyle = _getNodeStyle(messageType);

  return (
    <div className={nodeClasses} style={nodeStyle}>
      <Handle
        type='target'
        position={Position.Top}
        className='message-node__handle'
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

      <Handle
        type='source'
        position={Position.Bottom}
        className='message-node__handle'
      />
    </div>
  );
});

CompactMessageNode.propTypes = {
  data: PropTypes.shape({
    messageType: PropTypes.string,
    message: PropTypes.string,
    title: PropTypes.string,
  }).isRequired,
  selected: PropTypes.bool,
};

CompactMessageNode.displayName = 'CompactMessageNode';

// Se elimina la prop 'id' de propTypes ya que no se utiliza.
export default memo(CompactMessageNode);
