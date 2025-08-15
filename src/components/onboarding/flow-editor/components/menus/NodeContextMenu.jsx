import PropTypes from 'prop-types';
import { useEffect, useRef } from 'react';
import { shallow } from 'zustand/shallow';

import useFlowStore from '@/stores/use-flow-store';

const handleMouseEnter = (event) => {
  event.currentTarget.style.backgroundColor = 'rgba(0, 190, 255, 0.15)';
  event.currentTarget.style.color = '#67e8f9';
};

const handleMouseLeave = (event) => {
  event.currentTarget.style.backgroundColor = 'transparent';
  event.currentTarget.style.color = '#e2e8f0';
};

// Constantes de estilos para el menú contextual
const MENU_STYLES = {
  menu: {
    position: 'absolute',
    zIndex: 10_000,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
    borderRadius: '8px',
    padding: '6px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#e2e8f0',
    minWidth: '180px',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 16px',
    cursor: 'pointer',
    transition: 'background-color 0.2s, color 0.2s',
    fontSize: '14px',
    borderRadius: '6px',
  },
  icon: {
    marginRight: '10px',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
  },
};

const NodeContextMenu = ({ position, onClose }) => {
  const menuReference = useRef();
  const { contextMenuItems } = useFlowStore(
    (state) => ({
      contextMenuItems: state.contextMenuItems,
    }),
    shallow,
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuReference.current && !menuReference.current.contains(event.target)) {
        onClose();
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  if (!contextMenuItems || contextMenuItems.length === 0) {
    return;
  }

  const menuStyle = {
    ...MENU_STYLES.menu,
    left: `${position.x}px`,
    top: `${position.y}px`,
  };

  return (
    <div ref={menuReference} style={menuStyle}>
      {contextMenuItems.map((item, index) => {
        const handleAction = () => {
          if (item.action) {
            item.action();
          }
          onClose();
        };

        return (
          <div
            key={item.label || index}
            style={MENU_STYLES.menuItem}
            onClick={handleAction}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleAction();
              }
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            role='menuitem'
            tabIndex={0}
          >
            {item.icon && <span style={MENU_STYLES.icon}>{item.icon}</span>}
            <span>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
};

NodeContextMenu.propTypes = {
  position: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};

export default NodeContextMenu;
