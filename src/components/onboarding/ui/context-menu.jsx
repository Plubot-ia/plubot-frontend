import React, { useEffect, useRef } from 'react';
import './context-menu.css'; // Opcional: para estilos

const ContextMenu = ({ items, position, onClose }) => {
  const menuRef = useRef(null);

  // Cerrar el menú al hacer clic fuera
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

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{
        position: 'fixed',
        top: position.y,
        left: position.x,
        zIndex: 1000,
      }}
    >
      {items.map((item, index) => (
        <button
          key={index}
          className="context-menu-item"
          onClick={(e) => {
            e.stopPropagation();
            if (!item.disabled) {
              item.action();
              onClose();
            }
          }}
          disabled={item.disabled}
          aria-label={item.label}
        >
          {item.icon && <span className="context-menu-icon">{item.icon}</span>}
          <span className="context-menu-label">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default ContextMenu;