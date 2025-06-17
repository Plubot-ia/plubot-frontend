/**
 * @file GenericMiniNode.jsx
 * @description Componente genérico para el nivel de detalle MÍNIMO (LOD 2).
 *              Renderiza un ícono basado en el tipo de nodo, optimizado para máximo rendimiento.
 * @author PLUBOT Team
 * @version 1.0.0
 */

import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { Handle, Position } from 'reactflow';
import GenericNodeIcon from './GenericNodeIcon';
import './lodStyles.css'; // Usaremos un CSS dedicado para los estilos LOD

const GenericMiniNode = memo(({ data, selected }) => {
  const { nodeType } = data;

  const nodeClasses = [
    'lod-node',
    'lod-node--mini',
    selected ? 'lod-node--selected' : '',
    `lod-node--${nodeType}` // Clase específica para el tipo de nodo
  ].join(' ');

  return (
    <div className={nodeClasses}>
      <Handle type="target" position={Position.Top} className="lod-node__handle" />
      <GenericNodeIcon nodeType={nodeType} size={20} />
      <Handle type="source" position={Position.Bottom} className="lod-node__handle" />
    </div>
  );
});

GenericMiniNode.propTypes = {
  data: PropTypes.shape({
    nodeType: PropTypes.string.isRequired,
  }).isRequired,
  selected: PropTypes.bool,
};

export default GenericMiniNode;
