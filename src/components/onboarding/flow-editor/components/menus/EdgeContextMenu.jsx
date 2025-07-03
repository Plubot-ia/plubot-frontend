import React from 'react';
import { FiEdit, FiTrash2, FiLink } from 'react-icons/fi';

import useFlowStore from '@/stores/use-flow-store';

/**
 * Menu00fa contextual para aristas del flujo
 * @param {Object} props - Propiedades
 * @param {Object} props.position - Posiciu00f3n {x, y} donde mostrar el menu00fa
 * @param {Function} props.onClose - Funciu00f3n para cerrar el menu00fa
 */
const EdgeContextMenu = ({ position, onClose }) => {
  const selectedEdge = useFlowStore((state) =>
    state.edges.find((e) => e.id === state.selectedEdge),
  );
  const { removeEdge, updateEdge } = useFlowStore();

  if (!selectedEdge) return null;

  const handleRemove = () => {
    removeEdge(selectedEdge.id);
    onClose();
  };

  const handleToggleAnimate = () => {
    updateEdge(selectedEdge.id, {
      animated: !selectedEdge.animated,
    });
    onClose();
  };

  const handleStyleChange = (style) => {
    updateEdge(selectedEdge.id, { style });
    onClose();
  };

  const menuStyle = {
    position: 'absolute',
    left: `${position.x}px`,
    top: `${position.y}px`,
    zIndex: 10_000,
    backgroundColor: '#fff',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
    borderRadius: '4px',
    padding: '5px 0',
  };

  const menuItemStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 15px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    fontSize: '14px',
  };

  const iconStyle = {
    marginRight: '8px',
    fontSize: '16px',
  };

  return (
    <div className='edge-context-menu' style={menuStyle}>
      <div
        className='menu-item animate-item'
        style={menuItemStyle}
        onClick={handleToggleAnimate}
      >
        <FiLink style={iconStyle} />
        {selectedEdge.animated
          ? 'Desactivar Animaciu00f3n'
          : 'Activar Animaciu00f3n'}
      </div>

      <div
        className='menu-item delete-item'
        style={menuItemStyle}
        onClick={handleRemove}
      >
        <FiTrash2 style={iconStyle} /> Eliminar Conexiu00f3n
      </div>

      <div
        className='menu-separator'
        style={{ height: '1px', backgroundColor: '#eee', margin: '5px 0' }}
      />

      <div style={{ padding: '5px 15px', fontSize: '12px', color: '#666' }}>
        Estilos de Conexiu00f3n
      </div>

      <div
        className='menu-item style-item'
        style={{ ...menuItemStyle, color: '#3498db' }}
        onClick={() => handleStyleChange({ stroke: '#3498db', strokeWidth: 2 })}
      >
        Azul
      </div>

      <div
        className='menu-item style-item'
        style={{ ...menuItemStyle, color: '#2ecc71' }}
        onClick={() => handleStyleChange({ stroke: '#2ecc71', strokeWidth: 2 })}
      >
        Verde
      </div>

      <div
        className='menu-item style-item'
        style={{ ...menuItemStyle, color: '#e74c3c' }}
        onClick={() => handleStyleChange({ stroke: '#e74c3c', strokeWidth: 2 })}
      >
        Rojo
      </div>
    </div>
  );
};

export default EdgeContextMenu;
