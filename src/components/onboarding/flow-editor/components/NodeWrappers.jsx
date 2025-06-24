import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

import { POWER_COLORS } from '@/utils/nodeConfig';

/**
 * Componente que envuelve los nodos personalizados y agrega handles
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.node - Datos del nodo
 * @param {React.ReactNode} props.children - Contenido del nodo
 * @param {Array} props.inputs - Tipos de entradas del nodo
 * @param {Array} props.outputs - Tipos de salidas del nodo
 */
const NodeWrapper = memo(({ node, children, inputs = [], outputs = [] }) => {
  return (
    <div className="custom-node-wrapper">
      {/* Handles de entrada */}
      {inputs.map((type, index) => (
        <Handle
          key={`input-${type}-${index}`}
          type="target"
          position={Position.Left}
          id={type}
          style={{
            top: `${20 + (index * 20)}px`,
            background: POWER_COLORS[type] || '#555',
            width: '12px',
            height: '12px',
          }}
        />
      ))}

      {/* Contenido del nodo */}
      {children}

      {/* Handles de salida */}
      {outputs.map((type, index) => (
        <Handle
          key={`output-${type}-${index}`}
          type="source"
          position={Position.Right}
          id={type}
          style={{
            top: `${20 + (index * 20)}px`,
            background: POWER_COLORS[type] || '#555',
            width: '12px',
            height: '12px',
          }}
        />
      ))}
    </div>
  );
});

/**
 * Componente que envuelve los nodos de tipo trigger
 */
const TriggerNodeWrapper = memo(({ node, children, outputs = [] }) => {
  return (
    <div className="trigger-node-wrapper">
      {/* Contenido del nodo */}
      {children}

      {/* Handles de salida */}
      {outputs.map((type, index) => (
        <Handle
          key={`output-${type}-${index}`}
          type="source"
          position={Position.Bottom}
          id={type}
          style={{
            left: `${50 + (index * 30 - outputs.length * 15)}%`,
            bottom: '-6px',
            background: POWER_COLORS[type] || '#555',
            width: '12px',
            height: '12px',
          }}
        />
      ))}
    </div>
  );
});

/**
 * Componente que envuelve los nodos de tipo action
 */
const ActionNodeWrapper = memo(({ node, children, inputs = [] }) => {
  return (
    <div className="action-node-wrapper">
      {/* Handles de entrada */}
      {inputs.map((type, index) => (
        <Handle
          key={`input-${type}-${index}`}
          type="target"
          position={Position.Top}
          id={type}
          style={{
            left: `${50 + (index * 30 - inputs.length * 15)}%`,
            top: '-6px',
            background: POWER_COLORS[type] || '#555',
            width: '12px',
            height: '12px',
          }}
        />
      ))}

      {/* Contenido del nodo */}
      {children}
    </div>
  );
});

export { NodeWrapper, TriggerNodeWrapper, ActionNodeWrapper };
