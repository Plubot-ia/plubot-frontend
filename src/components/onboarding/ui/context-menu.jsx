import React, { useEffect, useRef, useState } from 'react';

const ContextMenu = React.forwardRef(({ items, position, onClose, options, children }, ref) => {
  const localMenuRef = useRef(null);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

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

  const isContextMenuMode = !!position;

  useEffect(() => {
    if (isContextMenuMode && onClose) {
      const handleClickOutside = (event) => {
        if (localMenuRef.current && !localMenuRef.current.contains(event.target)) {
          onClose();
        }
      };
      
      const handleKeyDown = (event) => {
        if (event.key === 'Escape') {
          onClose();
        }
      };
      
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isContextMenuMode, onClose]);

  const handleContextMenu = (e) => {
    if (!isContextMenuMode && options && options.length > 0) {
      e.preventDefault();
      setMenuPosition({ x: e.clientX, y: e.clientY });
      setShowMenu(true);
    }
  };

  const handleCloseMenu = () => {
    setShowMenu(false);
  };

  const renderMenu = () => {
    const menuItems = isContextMenuMode ? items : options;
    const pos = isContextMenuMode ? position : menuPosition;
    
    if (!menuItems || menuItems.length === 0 || !pos) return null;

    const menuStyle = {
      position: 'fixed',
      top: `${pos.y}px`,
      left: `${pos.x}px`,
      zIndex: 10000,
      backgroundColor: 'rgba(30, 41, 59, 0.9)',
      backdropFilter: 'blur(8px)',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
      borderRadius: '8px',
      padding: '6px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      color: '#e2e8f0',
      minWidth: '180px',
    };

    const menuItemStyle = {
      display: 'flex',
      alignItems: 'center',
      padding: '10px 16px',
      cursor: 'pointer',
      transition: 'background-color 0.2s, color 0.2s',
      fontSize: '14px',
      borderRadius: '6px',
      backgroundColor: 'transparent',
      color: '#e2e8f0',
    };

    const iconStyle = {
      marginRight: '10px',
      fontSize: '16px',
      display: 'flex',
      alignItems: 'center',
    };

    const handleMouseEnter = (e) => {
      e.currentTarget.style.backgroundColor = 'rgba(0, 190, 255, 0.15)';
      e.currentTarget.style.color = '#67e8f9';
    };

    const handleMouseLeave = (e) => {
      e.currentTarget.style.backgroundColor = 'transparent';
      e.currentTarget.style.color = '#e2e8f0';
    };

    return (
      <div
        ref={setRefs}
        style={menuStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {menuItems.map((item, index) => (
          <div
            key={index}
            style={menuItemStyle}
            onClick={(e) => {
              e.stopPropagation();
              if (!item.disabled) {
                item.action();
                isContextMenuMode ? onClose && onClose() : handleCloseMenu();
              }
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            role="menuitem"
            tabIndex={0}
            aria-disabled={item.disabled}
          >
            {item.icon && <span style={iconStyle}>{item.icon}</span>}
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    );
  };

  if (isContextMenuMode) {
    return renderMenu();
  }

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