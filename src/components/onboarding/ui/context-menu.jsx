import PropTypes from 'prop-types';
import React from 'react';

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

// Moved outside the component to prevent recreation on each render
const handleMouseEnter = (event) => {
  event.currentTarget.style.backgroundColor = 'rgba(0, 190, 255, 0.15)';
  event.currentTarget.style.color = '#67e8f9';
};

const handleMouseLeave = (event) => {
  event.currentTarget.style.backgroundColor = 'transparent';
  event.currentTarget.style.color = '#e2e8f0';
};

const MenuItem = ({ item, onSelect }) => {
  const handleItemClick = (event) => {
    event.stopPropagation();
    if (!item.disabled) {
      onSelect();
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      handleItemClick(event);
    }
  };

  return (
    <div
      style={menuItemStyle}
      onClick={handleItemClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role='menuitem'
      tabIndex={0}
      aria-disabled={item.disabled}
    >
      {item.icon && <span style={iconStyle}>{item.icon}</span>}
      <span>{item.label}</span>
    </div>
  );
};

MenuItem.propTypes = {
  item: PropTypes.shape({
    label: PropTypes.string.isRequired,
    icon: PropTypes.node,
    disabled: PropTypes.bool,
  }).isRequired,
  onSelect: PropTypes.func.isRequired,
};

const Menu = React.forwardRef(({ items, position, onClose }, reference) => {
  const menuStyle = {
    position: 'fixed',
    top: `${position.y}px`,
    left: `${position.x}px`,
    zIndex: 10_000,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
    borderRadius: '8px',
    padding: '6px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#e2e8f0',
    minWidth: '180px',
  };

  const handleSelect = (item) => {
    item.action();
    if (onClose) {
      onClose();
    }
  };

  return (
    <div
      ref={reference}
      style={menuStyle}
      role='menu'
      tabIndex={-1}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      {items.map((item, index) => (
        <MenuItem
          key={item.label ? `menu-item-${item.label}-${index}` : `menu-item-${index}`}
          item={item}
          onSelect={() => handleSelect(item)}
        />
      ))}
    </div>
  );
});

Menu.displayName = 'Menu';

Menu.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
  position: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
  }).isRequired,
  onClose: PropTypes.func,
};

Menu.defaultProps = {
  // eslint-disable-next-line no-empty-function
  onClose: () => {},
};

import useContextMenu from './hooks/useContextMenu';

const ContextMenu = React.forwardRef(
  ({ items, position, onClose, options, children }, reference) => {
    const isContextMenuMode = Boolean(position);
    const { showMenu, menuPosition, menuReference, handleContextMenu, handleClose } =
      useContextMenu(isContextMenuMode, onClose, options);

    const setReferences = (element) => {
      menuReference.current = element;
      if (reference) {
        if (typeof reference === 'function') {
          reference(element);
        } else {
          reference.current = element;
        }
      }
    };

    if (isContextMenuMode) {
      if (!items || items.length === 0 || !position) {
        return;
      }
      return <Menu ref={setReferences} items={items} position={position} onClose={handleClose} />;
    }

    return (
      <div
        onContextMenu={handleContextMenu}
        style={{
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          width: '100%',
          height: '100%',
        }}
      >
        {children}
        {showMenu && (
          <Menu ref={setReferences} items={options} position={menuPosition} onClose={handleClose} />
        )}
      </div>
    );
  },
);

ContextMenu.displayName = 'ContextMenu';

ContextMenu.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object),
  position: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
  }),
  onClose: PropTypes.func,
  options: PropTypes.arrayOf(PropTypes.object),
  children: PropTypes.node,
};

ContextMenu.defaultProps = {
  items: [],
  position: undefined,
  // eslint-disable-next-line no-empty-function
  onClose: () => {},
  options: [],
  children: undefined,
};

export default ContextMenu;
