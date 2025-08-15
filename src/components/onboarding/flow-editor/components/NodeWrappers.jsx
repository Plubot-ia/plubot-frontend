import PropTypes from 'prop-types';
import { memo } from 'react';
import { Handle, Position } from 'reactflow';

import { EDGE_COLORS } from '@/utils/node-config.js';

const getEdgeColor = (type) => {
  // By checking if the provided type is a known, safe key in our hardcoded
  // EDGE_COLORS object, we prevent any potential object injection vulnerability.
  if (Object.keys(EDGE_COLORS).includes(type)) {
    // eslint-disable-next-line security/detect-object-injection
    return EDGE_COLORS[type]; // Safe access after validation
  }
  return '#555'; // Return a default color if the type is not valid
};

/**
 * Componente que envuelve los nodos personalizados y agrega handles
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.node - Datos del nodo
 * @param {React.ReactNode} props.children - Contenido del nodo
 * @param {Array} props.inputs - Tipos de entradas del nodo
 * @param {Array} props.outputs - Tipos de salidas del nodo
 */
const NodeWrapper = memo(({ children, inputs = [], outputs = [] }) => {
  return (
    <div className='custom-node-wrapper'>
      {/* Handles de entrada */}
      {inputs.map((type, index) => (
        <Handle
          key={`input-${type}`}
          type='target'
          position={Position.Left}
          id={type}
          style={{
            top: `${20 + index * 20}px`,
            background: getEdgeColor(type),
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
          key={`output-${type}`}
          type='source'
          position={Position.Right}
          id={type}
          style={{
            top: `${20 + index * 20}px`,
            background: getEdgeColor(type),
            width: '12px',
            height: '12px',
          }}
        />
      ))}
    </div>
  );
});

NodeWrapper.displayName = 'NodeWrapper';

NodeWrapper.propTypes = {
  children: PropTypes.node.isRequired,
  inputs: PropTypes.array,
  outputs: PropTypes.array,
};

/**
 * Componente que envuelve los nodos de tipo trigger
 */
const TriggerNodeWrapper = memo(({ children, outputs = [] }) => {
  return (
    <div className='trigger-node-wrapper'>
      {/* Contenido del nodo */}
      {children}

      {/* Handles de salida */}
      {outputs.map((type, index) => (
        <Handle
          key={`output-${type}`}
          type='source'
          position={Position.Bottom}
          id={type}
          style={{
            left: `${50 + (index * 30 - outputs.length * 15)}%`,
            bottom: '-6px',
            background: getEdgeColor(type),
            width: '12px',
            height: '12px',
          }}
        />
      ))}
    </div>
  );
});

TriggerNodeWrapper.displayName = 'TriggerNodeWrapper';

TriggerNodeWrapper.propTypes = {
  children: PropTypes.node.isRequired,
  outputs: PropTypes.array,
};

/**
 * Componente que envuelve los nodos de tipo action
 */
const ActionNodeWrapper = memo(({ children, inputs = [] }) => {
  return (
    <div className='action-node-wrapper'>
      {/* Handles de entrada */}
      {inputs.map((type, index) => (
        <Handle
          key={`input-${type}`}
          type='target'
          position={Position.Top}
          id={type}
          style={{
            left: `${50 + (index * 30 - inputs.length * 15)}%`,
            top: '-6px',
            background: getEdgeColor(type),
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

ActionNodeWrapper.displayName = 'ActionNodeWrapper';

ActionNodeWrapper.propTypes = {
  children: PropTypes.node.isRequired,
  inputs: PropTypes.array,
};

export { NodeWrapper, TriggerNodeWrapper, ActionNodeWrapper };
