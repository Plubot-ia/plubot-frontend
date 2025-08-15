import PropTypes from 'prop-types';
import { useRef, useEffect } from 'react';

import './ContextMenuComponent.css';

// Subcomponente para cada elemento del menú, mejorando la legibilidad y el aislamiento
const ContextMenuItem = ({ nodeType, onAdd, flowPosition, onClose }) => (
  <div
    className='context-menu-item'
    role='button'
    tabIndex={0}
    onClick={() => {
      onAdd(nodeType.type, flowPosition);
      onClose();
    }}
    onKeyDown={(event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        onAdd(nodeType.type, flowPosition);
        onClose();
      }
    }}
  >
    <span className='context-menu-icon' style={{ color: nodeType.color }}>
      {nodeType.icon}
    </span>
    <span className='context-menu-label'>{nodeType.label}</span>
  </div>
);

ContextMenuItem.propTypes = {
  nodeType: PropTypes.shape({
    type: PropTypes.string.isRequired,
    label: PropTypes.string,
    icon: PropTypes.node,
    color: PropTypes.string,
  }).isRequired,
  onAdd: PropTypes.func.isRequired,
  flowPosition: PropTypes.shape({ x: PropTypes.number, y: PropTypes.number }),
  onClose: PropTypes.func.isRequired,
};

/**
 * Componente para mostrar el menú contextual en el editor de flujos
 */
const ContextMenuComponent = ({ position, onClose, onAddNode, nodeTypes = [] }) => {
  const menuReference = useRef(undefined);

  // Cerrar el menú al hacer clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuReference.current && !menuReference.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    position && (
      <div
        ref={menuReference}
        className='context-menu'
        style={{
          top: position.y,
          left: position.x,
        }}
      >
        <div className='context-menu-header'>Añadir nodo</div>
        <div className='context-menu-items'>
          {nodeTypes.map((type) => (
            <ContextMenuItem
              key={type.type}
              nodeType={type}
              onAdd={onAddNode}
              flowPosition={position.flowPosition}
              onClose={onClose}
            />
          ))}
        </div>
      </div>
    )
  );
};

ContextMenuComponent.propTypes = {
  position: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    flowPosition: PropTypes.shape({
      x: PropTypes.number,
      y: PropTypes.number,
    }),
  }),
  onClose: PropTypes.func.isRequired,
  onAddNode: PropTypes.func.isRequired,
  nodeTypes: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string.isRequired,
      label: PropTypes.string,
      icon: PropTypes.node,
      color: PropTypes.string,
    }),
  ),
};

export default ContextMenuComponent;
