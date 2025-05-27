import React, { useRef, useEffect } from 'react';
import './ContextMenuComponent.css';

/**
 * Componente para mostrar el menú contextual en el editor de flujos
 * @param {Object} position - Posición del menú contextual
 * @param {Function} onClose - Función para cerrar el menú
 * @param {Function} onAddNode - Función para añadir un nuevo nodo
 * @param {Array} nodeTypes - Tipos de nodos disponibles
 */
const ContextMenuComponent = ({ position, onClose, onAddNode, nodeTypes = [] }) => {
  const menuRef = useRef(null);

  // Cerrar el menú al hacer clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Si no hay posición, no mostrar el menú
  if (!position) return null;

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{
        top: position.y,
        left: position.x,
      }}
    >
      <div className="context-menu-header">Añadir nodo</div>
      <div className="context-menu-items">
        {nodeTypes.map((type) => (
          <div
            key={type.type}
            className="context-menu-item"
            onClick={() => {
              onAddNode(type.type, position.flowPosition);
              onClose();
            }}
          >
            <span className="context-menu-icon" style={{ color: type.color }}>
              {type.icon}
            </span>
            <span className="context-menu-label">{type.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContextMenuComponent;
