import React, { useEffect, useRef } from 'react';
import useFlowStore from '@/stores/useFlowStore';
import { shallow } from 'zustand/shallow';
import { FiEdit, FiTrash2, FiCopy } from 'react-icons/fi';

const NodeContextMenu = ({ position, onClose }) => {
  const menuRef = useRef(null);
  const { contextMenuItems } = useFlowStore(
    (state) => ({
      contextMenuItems: state.contextMenuItems,
    }),
    shallow
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
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
    return null;
  }

  const menuStyle = {
    position: 'absolute',
    left: `${position.x}px`,
    top: `${position.y}px`,
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
    <div ref={menuRef} style={menuStyle}>
      {contextMenuItems.map((item, index) => (
        <div
          key={item.label || index}
          style={menuItemStyle}
          onClick={() => {
            if (item.action) {
              item.action();
            }
            onClose();
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          role="menuitem"
          tabIndex={0}
        >
          {item.icon && <span style={iconStyle}>{item.icon}</span>}
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
};

export default NodeContextMenu;
