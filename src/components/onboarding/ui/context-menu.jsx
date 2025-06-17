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
const ContextMenu = React.forwardRef(({ items, position, onClose, options, children }, ref) => {
  const localMenuRef = useRef(null); // Renamed for clarity and for internal use
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  // Callback ref to assign to both localMenuRef and the forwarded ref
  const setRefs = (element) => {
    localMenuRef.current = element;
    if (ref) {
      if (typeof ref === 'function') {
        ref(element);
      } else {
        ref.current = element;
      }
    }
  };

  // Determinar el modo de uso del componente
  const isContextMenuMode = !!position;

  // Cerrar el menú al hacer clic fuera - implementación mejorada
  useEffect(() => {
    if (isContextMenuMode && onClose) {
      // Cerrar el menú al hacer clic fuera o con la tecla Escape
      const handleClickOutside = (event) => {
        // Si el menú existe y el clic fue fuera del menú
        if (localMenuRef.current && !localMenuRef.current.contains(event.target)) {
          onClose();
        }
      };
      
      const handleKeyDown = (event) => {
        if (event.key === 'Escape') {
          onClose();
        }
      };
      
      // Usar mousedown para capturar cualquier clic en cualquier parte del documento
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
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

    // Añadir un offset pequeño para que el menú aparezca cerca del cursor pero no justo debajo
    // Esto mejora la experiencia de usuario al evitar clics accidentales
    const menuOffset = { x: 0, y: 0 };
    
    return (
      <div
        ref={setRefs} // Use the callback ref here
        className="context-menu"
        style={{
          position: 'fixed',
          top: pos.y + menuOffset.y,
          left: pos.x + menuOffset.x,
          zIndex: 1000,
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
          borderRadius: '4px',
          backgroundColor: 'white',
          padding: '5px 0',
        }}
        onClick={(e) => e.stopPropagation()} // Evitar que clics dentro del menú lo cierren
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
    <div 
      onContextMenu={handleContextMenu}
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        flexGrow: 1, 
        width: '100%', 
        height: '100%' 
      }}
    >
      {children}
      {showMenu && renderMenu()}
    </div>
  );
});

export default ContextMenu;