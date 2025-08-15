/**
 * @file MemoryPreview.tsx
 * @description Componente de vista previa para MemoryNode
 */

import React from 'react';

import { MEMORY_ACTIONS } from './constants';
import type { MemoryPreviewProps } from './types';
import { formatPreviewValue } from './utils';

/**
 * Componente de vista previa del nodo de memoria
 */
const MemoryPreview: React.FC<MemoryPreviewProps> = ({
  action,
  key: memoryKey,
  value,
  description,
}) => {
  // eslint-disable-next-line security/detect-object-injection
  const actionConfig = MEMORY_ACTIONS[action];

  return (
    <div
      className='memory-preview'
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '12px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        minHeight: '60px',
      }}
    >
      {/* Header con acción */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          fontWeight: 600,
          color: actionConfig.color,
        }}
      >
        <span style={{ fontSize: '18px' }}>{actionConfig.icon}</span>
        <span>{actionConfig.label}</span>
      </div>

      {/* Información de la clave */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '13px',
          color: '#495057',
        }}
      >
        <span style={{ fontWeight: 500 }}>Clave:</span>
        <code
          style={{
            backgroundColor: '#e9ecef',
            padding: '2px 6px',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '12px',
          }}
        >
          {memoryKey || 'sin definir'}
        </code>
      </div>

      {/* Valor (solo para action="set") */}
      {action === 'set' && value && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            color: '#495057',
          }}
        >
          <span style={{ fontWeight: 500 }}>Valor:</span>
          <span
            style={{
              backgroundColor: '#e7f5ff',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '12px',
              maxWidth: '150px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {formatPreviewValue(value, 20)}
          </span>
        </div>
      )}

      {/* Descripción */}
      {description && (
        <div
          style={{
            fontSize: '11px',
            color: '#6c757d',
            fontStyle: 'italic',
            marginTop: '4px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {description}
        </div>
      )}
    </div>
  );
};

export default React.memo(MemoryPreview);
