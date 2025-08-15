/**
 * @file GenericCompactNode.jsx
 * @description Componente genérico para el nivel de detalle COMPACTO (LOD 1).
 *              Renderiza un ícono y una etiqueta/título, optimizado para rendimiento intermedio.
 * @author PLUBOT Team
 * @version 1.0.0
 */

import PropTypes from 'prop-types';
import { memo } from 'react';
import { Handle, Position } from 'reactflow';

import GenericNodeIcon from './GenericNodeIcon';
import './lodStyles.css';

const arePropertiesEqual = (previousProperties, nextProperties) => {
  // Comparación superficial (shallow) del objeto 'data'.
  // Esto es crucial porque el hook de virtualización crea nuevos objetos 'data'
  // en cada render, pero su contenido a menudo no cambia. La comparación de referencia (===) fallaría.
  const previousDataKeys = Object.keys(previousProperties.data);
  if (previousDataKeys.length !== Object.keys(nextProperties.data).length) {
    return false;
  }

  for (const key of previousDataKeys) {
    // eslint-disable-next-line security/detect-object-injection -- key from controlled iteration over object keys
    if (previousProperties.data[key] !== nextProperties.data[key]) {
      return false;
    }
  }

  // Solo re-renderizar si 'data', 'selected' o 'isConnectable' cambian.
  return (
    previousProperties.selected === nextProperties.selected &&
    previousProperties.isConnectable === nextProperties.isConnectable
  );
};

const GenericCompactNodeComponent = ({ data, selected, isConnectable }) => {
  const { nodeType, label, title } = data;

  const displayLabel = title || label || nodeType; // Usa título, luego etiqueta, o el tipo de nodo como fallback
  const truncatedLabel =
    displayLabel.length > 20 ? `${displayLabel.slice(0, 20)}...` : displayLabel;

  const nodeClasses = [
    'lod-node',
    'lod-node--compact',
    selected ? 'lod-node--selected' : '',
    `lod-node--${nodeType}`,
  ].join(' ');

  return (
    <div className={nodeClasses}>
      <Handle
        type='target'
        position={Position.Top}
        id='input'
        className='lod-node__handle'
        isConnectable={isConnectable}
      />

      <div className='compact-header'>
        <GenericNodeIcon nodeType={nodeType} size={16} />
        <h3 className='compact-title'>{nodeType.charAt(0).toUpperCase() + nodeType.slice(1)}</h3>
      </div>
      <div className='compact-label'>{truncatedLabel}</div>

      <Handle
        type='source'
        position={Position.Bottom}
        id='default'
        className='lod-node__handle'
        isConnectable={isConnectable}
      />
    </div>
  );
};

GenericCompactNodeComponent.propTypes = {
  data: PropTypes.shape({
    nodeType: PropTypes.string.isRequired,
    label: PropTypes.string,
    title: PropTypes.string,
  }).isRequired,
  selected: PropTypes.bool,
  isConnectable: PropTypes.bool,
};

const GenericCompactNode = memo(GenericCompactNodeComponent, arePropertiesEqual);

GenericCompactNode.displayName = 'GenericCompactNode';

GenericCompactNode.propTypes = GenericCompactNodeComponent.propTypes;

export default GenericCompactNode;
