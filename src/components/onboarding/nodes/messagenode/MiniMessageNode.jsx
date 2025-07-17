/**
 * @file MiniMessageNode.jsx
 * @description Componente para el nivel de detalle MÍNIMO del MessageNode.
 * @author PLUBOT Team
 * @version 1.1.0
 * @description_of_changes Se ha refactorizado para eliminar el acceso directo al store de Zustand (antipatrón). Ahora, todos los datos se reciben exclusivamente a través de `props`, garantizando un flujo de datos unidireccional y predecible.
 */

import PropTypes from 'prop-types';
import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

import { MessageNodeIcon } from './MessageNodeIcon';
import './MessageNode.css';

const MiniMessageNode = memo(({ data, selected }) => {
  const { messageType } = data;

  const nodeClasses = [
    'message-node',
    'message-node--mini',
    selected ? 'message-node--selected-style' : '',
  ].join(' ');

  const isSystem = messageType === 'system';

  const baseStyle = {
    width: 40,
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '12px',
  };

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

  const nodeStyle = {
    ...baseStyle,
    ...(isSystem ? systemStyle : otherStyle),
  };

  return (
    <div className={nodeClasses} style={nodeStyle}>
      <Handle
        type='target'
        position={Position.Top}
        className='message-node__handle'
      />
      <MessageNodeIcon type={messageType} isUltraPerformanceMode />
      <Handle
        type='source'
        position={Position.Bottom}
        className='message-node__handle'
      />
    </div>
  );
});

MiniMessageNode.propTypes = {
  data: PropTypes.shape({
    messageType: PropTypes.string,
  }).isRequired,
  selected: PropTypes.bool,
};

export default memo(MiniMessageNode);
