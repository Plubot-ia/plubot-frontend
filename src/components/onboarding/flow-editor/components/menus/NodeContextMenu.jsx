import React from 'react';
import useFlowStore from '@/stores/useFlowStore';
import { FiEdit, FiTrash2, FiCopy, FiLink } from 'react-icons/fi';

/**
 * Menú contextual para nodos del flujo
 * @param {Object} props - Propiedades
 * @param {Object} props.position - Posición {x, y} donde mostrar el menú
 * @param {Function} props.onClose - Función para cerrar el menú
 */
const NodeContextMenu = ({ position, onClose }) => {
  const selectedNode = useFlowStore(state => state.nodes.find(n => n.id === state.selectedNode));
  const { removeNode, duplicateNode } = useFlowStore();
  
  if (!selectedNode) return null;
  
  const handleRemove = () => {
    removeNode(selectedNode.id);
    onClose();
  };
  
  const handleDuplicate = () => {
    duplicateNode && duplicateNode(selectedNode.id);
    onClose();
  };
  
  const handleEdit = () => {
    // Si esta función no está disponible en tu sistema, puedes implementarla
    // en useFlowStore o manejarla de otra forma
    // editNode && editNode(selectedNode.id);
    onClose();
  };
  
  const menuStyle = {
    position: 'absolute',
    left: `${position.x}px`,
    top: `${position.y}px`,
    zIndex: 10000,
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
    <div className="node-context-menu" style={menuStyle}>
      <div 
        className="menu-item edit-item"
        style={menuItemStyle}
        onClick={handleEdit}
      >
        <FiEdit style={iconStyle} /> Editar Nodo
      </div>
      
      <div 
        className="menu-item duplicate-item"
        style={menuItemStyle}
        onClick={handleDuplicate}
      >
        <FiCopy style={iconStyle} /> Duplicar Nodo
      </div>
      
      <div 
        className="menu-item delete-item"
        style={menuItemStyle}
        onClick={handleRemove}
      >
        <FiTrash2 style={iconStyle} /> Eliminar Nodo
      </div>
    </div>
  );
};

export default NodeContextMenu;
