import PropTypes from 'prop-types';
import React, { memo, useEffect, useRef } from 'react';
import './ContextMenu.css';

/**
 * Componente de menú contextual para nodos
 *
 * @component
 * @param {Object} props - Propiedades del componente
 * @param {Array} props.items - Elementos del menú
 * @param {Function} props.onClose - Función para cerrar el menú
 * @returns {React.ReactElement} Componente ContextMenu
 */
const ContextMenu = memo(({ items, onClose }) => {
  const menuRef = useRef(null);

  // Cerrar el menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Cerrar el menú al presionar Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="context-menu"
      role="menu"
      aria-label="Menú contextual"
    >
      {items.map((item) => (
        <button
          key={item.id}
          className={`context-menu__item ${item.disabled ? 'context-menu__item--disabled' : ''}`}
          onClick={() => {
            if (!item.disabled && typeof item.onClick === 'function') {
              item.onClick();
              onClose();
            }
          }}
          disabled={item.disabled}
          role="menuitem"
          aria-disabled={item.disabled}
          tabIndex={0}
        >
          {item.icon && (
            <span className="context-menu__item-icon">
              {typeof item.icon === 'string' ? (
                <svg className="context-menu__icon" aria-hidden="true">
                  <use xlinkHref={`#icon-${item.icon}`} />
                </svg>
              ) : (
                item.icon
              )}
            </span>
          )}
          <span className="context-menu__item-label">{item.label}</span>
          {item.shortcut && (
            <span className="context-menu__item-shortcut">{item.shortcut}</span>
          )}
        </button>
      ))}
    </div>
  );
});

ContextMenu.displayName = 'ContextMenu';

ContextMenu.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
      onClick: PropTypes.func,
      disabled: PropTypes.bool,
      shortcut: PropTypes.string,
    }),
  ).isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ContextMenu;
