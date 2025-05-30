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
  const { removeNode, duplicateDecisionNode, updateNode } = useFlowStore(state => ({ removeNode: state.removeNode, duplicateDecisionNode: state.duplicateDecisionNode, updateNode: state.updateNode }));
  
  if (!selectedNode) return null;
  
  const handleRemove = () => {
    removeNode(selectedNode.id);
    onClose();
  };
  
  const handleDuplicate = () => {
    if (selectedNode.type === 'decision' && duplicateDecisionNode) {
      duplicateDecisionNode(selectedNode.id);
    } else {
      console.warn(`Duplicate action not implemented for node type: ${selectedNode.type}`);
      // O, si quieres una duplicación genérica simple (copia superficial de datos y nueva posición):
      // const { id, type, position, data } = selectedNode;
      // const newNode = {
      //   id: `${type}-${generateId()}`,
      //   type,
      //   position: { x: position.x + 20, y: position.y + 20 },
      //   data: { ...data }, // Copia superficial
      // };
      // useFlowStore.getState().addNode(newNode);
    }
    onClose();
  };
  
  const handleEdit = () => {
    // Si esta función no está disponible en tu sistema, puedes implementarla
    // en useFlowStore o manejarla de otra forma
    if (updateNode) {
      // Asumimos que el estado de edición se maneja a través de una propiedad en 'data'
      // o directamente en el nodo si la estructura lo permite.
      // Esto es un ejemplo, la estructura exacta de 'data' puede variar.
      const currentData = selectedNode.data || {};
      updateNode(selectedNode.id, { ...selectedNode, data: { ...currentData, isEditing: true } });
      console.log(`Set node ${selectedNode.id} to editing mode.`);
    } else {
      console.warn('updateNode function not available in store for editing.');
    }
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
