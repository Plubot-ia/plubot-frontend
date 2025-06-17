/**
 * @file GenericCompactNode.jsx
 * @description Componente genérico para el nivel de detalle COMPACTO (LOD 1).
 *              Renderiza un ícono y una etiqueta/título, optimizado para rendimiento intermedio.
 * @author PLUBOT Team
 * @version 1.0.0
 */

import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { Handle, Position } from 'reactflow';
import GenericNodeIcon from './GenericNodeIcon';
import './lodStyles.css';

const GenericCompactNode = memo(({ data, selected }) => {
  const { nodeType, label, title } = data;

  const displayLabel = title || label || nodeType; // Usa título, luego etiqueta, o el tipo de nodo como fallback
  const truncatedLabel = displayLabel.length > 20 ? `${displayLabel.substring(0, 20)}...` : displayLabel;

  const nodeClasses = [
    'lod-node',
    'lod-node--compact',
    selected ? 'lod-node--selected' : '',
    `lod-node--${nodeType}`
  ].join(' ');

  return (
    <div className={nodeClasses}>
      <Handle type="target" position={Position.Top} className="lod-node__handle" />
      
      <div className="compact-header">
        <GenericNodeIcon nodeType={nodeType} size={16} />
        <h3 className="compact-title">{nodeType.charAt(0).toUpperCase() + nodeType.slice(1)}</h3>
      </div>
      <div className="compact-label">{truncatedLabel}</div>

      <Handle type="source" position={Position.Bottom} className="lod-node__handle" />
    </div>
  );
});

GenericCompactNode.propTypes = {
  data: PropTypes.shape({
    nodeType: PropTypes.string.isRequired,
    label: PropTypes.string,
    title: PropTypes.string,
  }).isRequired,
  selected: PropTypes.bool,
};

export default GenericCompactNode;
