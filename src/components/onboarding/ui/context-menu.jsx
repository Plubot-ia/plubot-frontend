import React, { useEffect, useRef, useState } from 'react';
import './context-menu.css'; // Opcional: para estilos

/**
 * Componente de menú contextual flexible
 * Puede funcionar como menú contextual posicionado o como wrapper para elementos
 * @param {Object} props - Propiedades del componente
 * @param {Array} [props.items] - Elementos del menú (para uso como menú contextual)
 * @param {Object} [props.position] - Posición del menú (para uso como menú contextual)
 * @param {Function} [props.onClose] - Función para cerrar el menú (para uso como menú contextual)
 * @param {Array} [props.options] - Opciones del menú (para uso como wrapper)
 * @param {React.ReactNode} [props.children] - Contenido hijo (para uso como wrapper)
 */
const ContextMenu = ({ items, position, onClose, options, children }) => {
  const menuRef = useRef(null);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  // Determinar el modo de uso del componente
  const isContextMenuMode = !!position;

  // Cerrar el menú al hacer clic fuera
  useEffect(() => {
    if (isContextMenuMode && onClose) {
      const handleClickOutside = (event) => {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
          onClose();
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isContextMenuMode, onClose]);

  // Manejador para el menú contextual en modo wrapper
  const handleContextMenu = (e) => {
    if (!isContextMenuMode && options && options.length > 0) {
      e.preventDefault();
      setMenuPosition({ x: e.clientX, y: e.clientY });
      setShowMenu(true);
    }
  };

  // Cerrar el menú contextual en modo wrapper
  const handleCloseMenu = () => {
    setShowMenu(false);
  };

  // Renderizar el menú contextual
  const renderMenu = () => {
    const menuItems = isContextMenuMode ? items : options;
    const pos = isContextMenuMode ? position : menuPosition;
    
    if (!menuItems || menuItems.length === 0 || !pos) return null;
    
    return (
      <div
        ref={menuRef}
        className="context-menu"
        style={{
          position: 'fixed',
          top: pos.y,
          left: pos.x,
          zIndex: 1000,
        }}
      >
        {menuItems.map((item, index) => (
          <button
            key={index}
            className="context-menu-item"
            onClick={(e) => {
              e.stopPropagation();
              if (!item.disabled) {
                item.action();
                isContextMenuMode ? onClose && onClose() : handleCloseMenu();
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

  // Si es modo menú contextual, solo renderizar el menú
  if (isContextMenuMode) {
    return renderMenu();
  }

  // Si es modo wrapper, renderizar los hijos y el menú si está visible
  return (
    <div onContextMenu={handleContextMenu}>
      {children}
      {showMenu && renderMenu()}
    </div>
  );
};

export default ContextMenu;