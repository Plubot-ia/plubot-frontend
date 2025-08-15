/**
 * @file MiniMessageNode.tsx
 * @description Componente para el nivel de detalle MÍNIMO del MessageNode.
 * @author PLUBOT Team
 * @version 1.1.0
 * @description_of_changes Se ha refactorizado para eliminar el acceso directo al store de Zustand (antipatrón). Ahora, todos los datos se reciben exclusivamente a través de `props`, garantizando un flujo de datos unidireccional y predecible.
 */

import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

import type { MessageType } from './MessageNodeIcon';
import { MessageNodeIcon } from './MessageNodeIcon';
import './MessageNode.css';

interface MiniMessageNodeData {
  messageType?: MessageType;
}

interface MiniMessageNodeProps {
  data: MiniMessageNodeData;
  selected?: boolean;
  _isConnectable?: boolean;
}

const MiniMessageNode = memo<MiniMessageNodeProps>(({ data, selected, _isConnectable = true }) => {
  const { messageType } = data;

  const nodeClasses = [
    'message-node',
    'message-node--mini',
    'message-node--ultra-performance', // Apply ultra-performance styling for mini mode
    selected ? 'message-node--selected' : '',
    selected ? 'message-node--selected-style' : '',
  ]
    .filter(Boolean)
    .join(' ');

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
    background: 'linear-gradient(145deg, rgba(59, 7, 100, 0.8), rgba(59, 7, 100, 1))',
    border: '1px solid rgba(37, 99, 235, 0.5)',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
  };

  const otherStyle = {
    background: 'linear-gradient(145deg, rgba(23, 37, 84, 0.8), rgba(23, 37, 84, 1))',
    border: '1px solid rgba(37, 99, 235, 0.5)',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
  };

  const nodeStyle = {
    ...baseStyle,
    ...(isSystem ? systemStyle : otherStyle),
  };

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

      <MessageNodeIcon type={messageType} isUltraPerformanceMode />

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
});

MiniMessageNode.displayName = 'MiniMessageNode';

export default memo(MiniMessageNode);
