/**
 * Extracted components for OptionsMenu to reduce complexity
 */
import { Check } from 'lucide-react';
import PropTypes from 'prop-types';
import React from 'react';

export const MenuHeader = ({ title, onClose }) => (
  <div
    style={{
      padding: '12px 16px',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}
  >
    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>{title}</h3>
    {onClose && (
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          padding: '4px',
        }}
      >
        ×
      </button>
    )}
  </div>
);

MenuHeader.propTypes = {
  title: PropTypes.string.isRequired,
  onClose: PropTypes.func,
};

export const MenuItem = ({ icon: Icon, label, onClick, disabled, variant = 'default' }) => {
  const baseStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    borderRadius: '6px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background-color 0.2s',
    opacity: disabled ? 0.5 : 1,
    color: variant === 'danger' ? '#ef4444' : 'inherit',
    width: '100%',
    background: 'none',
    border: 'none',
    textAlign: 'left',
  };

  return (
    <button style={baseStyle} onClick={disabled ? undefined : onClick} disabled={disabled}>
      {Icon && <Icon size={16} />}
      <span>{label}</span>
    </button>
  );
};

MenuItem.propTypes = {
  icon: PropTypes.elementType,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  variant: PropTypes.oneOf(['default', 'danger']),
};

export const MenuSection = ({ children, title }) => (
  <div style={{ padding: '8px 0' }}>
    {title && (
      <div
        style={{
          padding: '4px 12px',
          fontSize: '11px',
          fontWeight: 600,
          opacity: 0.6,
          textTransform: 'uppercase',
        }}
      >
        {title}
      </div>
    )}
    {children}
  </div>
);

MenuSection.propTypes = {
  children: PropTypes.node,
  title: PropTypes.string,
};

export const MenuDivider = () => (
  <div
    style={{
      borderTop: '1px solid rgba(255,255,255,0.1)',
      margin: '8px 0',
    }}
  />
);

export const NotificationBadge = ({ message, visible }) => {
  if (!visible) return;

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'rgba(16, 185, 129, 0.9)',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        pointerEvents: 'none',
        zIndex: 1000,
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <Check size={16} />
      <span>{message}</span>
    </div>
  );
};

NotificationBadge.propTypes = {
  message: PropTypes.string.isRequired,
  visible: PropTypes.bool,
};
