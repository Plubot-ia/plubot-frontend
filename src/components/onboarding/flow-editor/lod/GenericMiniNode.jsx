/**
 * @file GenericMiniNode.jsx
 * @description Componente genérico para el nivel de detalle MÍNIMO (LOD 2).
 *              Renderiza un ícono basado en el tipo de nodo, optimizado para máximo rendimiento.
 * @author PLUBOT Team
 * @version 1.0.0
 */

import PropTypes from 'prop-types';
import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

import GenericNodeIcon from './GenericNodeIcon';
import './lodStyles.css'; // Usaremos un CSS dedicado para los estilos LOD

const arePropsEqual = (prevProps, nextProps) => {
  // Comparación superficial (shallow) del objeto 'data'.
  // Esto es crucial porque el hook de virtualización crea nuevos objetos 'data'
  // en cada render, pero su contenido a menudo no cambia. La comparación de referencia (===) fallaría.
  const prevDataKeys = Object.keys(prevProps.data);
  if (prevDataKeys.length !== Object.keys(nextProps.data).length) {
    return false;
  }

  for (const key of prevDataKeys) {
    if (prevProps.data[key] !== nextProps.data[key]) {
      return false;
    }
  }

  // Solo re-renderizar si 'data' o 'selected' cambian. Se ignoran cambios de posición
  // (xPos, yPos) y de arrastre (dragging), ya que son manejados por el transform de React Flow
  // y no afectan la apariencia interna del MiniNode.
  return prevProps.selected === nextProps.selected;
};

const GenericMiniNode = memo(({ data, selected }) => {
  const { nodeType } = data;

  const nodeClasses = [
    'lod-node',
    'lod-node--mini',
    selected ? 'lod-node--selected' : '',
    `lod-node--${nodeType}`, // Clase específica para el tipo de nodo
  ].join(' ');

  return (
    <div className={nodeClasses}>
      <Handle type="target" position={Position.Top} className="lod-node__handle" />
      <GenericNodeIcon nodeType={nodeType} size={20} />
      <Handle type="source" position={Position.Bottom} className="lod-node__handle" />
    </div>
  );
}, arePropsEqual);

GenericMiniNode.displayName = 'GenericMiniNode';

GenericMiniNode.propTypes = {
  data: PropTypes.shape({
    nodeType: PropTypes.string.isRequired,
  }).isRequired,
  selected: PropTypes.bool,
};

export default GenericMiniNode;
