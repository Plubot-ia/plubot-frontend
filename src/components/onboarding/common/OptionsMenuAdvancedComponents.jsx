/**
 * Components for OptionsMenuAdvanced
 */
import { Search, CheckCircle } from 'lucide-react';
import PropTypes from 'prop-types';
import React from 'react';

// Tab button component
export const TabButton = ({ tab, activeTab, setActiveTab, icon: Icon, label }) => (
  <button
    type='button'
    className={`tab-button ${activeTab === tab ? 'active' : ''}`}
    onClick={() => setActiveTab(tab)}
    style={{
      padding: '8px 16px',
      background: activeTab === tab ? 'rgba(0, 195, 255, 0.1)' : 'transparent',
      border: 'none',
      color: activeTab === tab ? '#00c3ff' : '#fff',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      borderRadius: '4px',
      transition: 'all 0.2s',
    }}
  >
    <Icon size={16} />
    <span>{label}</span>
  </button>
);

TabButton.propTypes = {
  tab: PropTypes.string.isRequired,
  activeTab: PropTypes.string.isRequired,
  setActiveTab: PropTypes.func.isRequired,
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
};

// Search bar component
export const SearchBar = ({ searchQuery, onSearch, searchInputRef }) => (
  <div
    style={{
      position: 'relative',
      marginBottom: '16px',
    }}
  >
    <Search
      size={16}
      style={{
        position: 'absolute',
        left: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        color: '#999',
      }}
    />
    <input
      ref={searchInputRef}
      type='text'
      placeholder='Buscar nodos... (⌘K)'
      value={searchQuery}
      onChange={(event) => onSearch(event.target.value)}
      style={{
        width: '100%',
        padding: '8px 12px 8px 36px',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '4px',
        color: '#fff',
        fontSize: '14px',
      }}
    />
  </div>
);

SearchBar.propTypes = {
  searchQuery: PropTypes.string.isRequired,
  onSearch: PropTypes.func.isRequired,
  searchInputRef: PropTypes.object,
};

// Action button component
export const ActionButton = ({ icon: Icon, label, onClick, disabled, variant = 'default' }) => {
  const variants = {
    default: {
      background: 'transparent',
      color: '#fff',
      hoverBg: 'rgba(255, 255, 255, 0.1)',
    },
    danger: {
      background: 'transparent',
      color: '#ff4444',
      hoverBg: 'rgba(255, 68, 68, 0.1)',
    },
    success: {
      background: 'transparent',
      color: '#44ff44',
      hoverBg: 'rgba(68, 255, 68, 0.1)',
    },
  };

  let style;
  switch (variant) {
    case 'primary': {
      style = variants.primary;
      break;
    }
    case 'danger': {
      style = variants.danger;
      break;
    }
    case 'success': {
      style = variants.success;
      break;
    }
    default: {
      style = variants.default;
      break;
    }
  }
  if (!style) return;

  return (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '10px 16px',
        background: style.background,
        border: 'none',
        color: disabled ? '#666' : style.color,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        borderRadius: '4px',
        transition: 'all 0.2s',
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={(event) => {
        if (!disabled) {
          event.currentTarget.style.background = style.hoverBg;
        }
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.background = style.background;
      }}
    >
      <Icon size={16} />
      <span>{label}</span>
    </button>
  );
};

ActionButton.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  variant: PropTypes.oneOf(['default', 'danger', 'success']),
};

// Stats card component
export const StatsCard = ({ label, value, icon: Icon, color = '#00c3ff' }) => (
  <div
    style={{
      padding: '12px',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '8px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
      <Icon size={14} style={{ color }} />
      <span style={{ fontSize: '12px', color: '#999' }}>{label}</span>
    </div>
    <div style={{ fontSize: '18px', fontWeight: 'bold', color }}>{value}</div>
  </div>
);

StatsCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.elementType.isRequired,
  color: PropTypes.string,
};

// Recent actions list component
export const RecentActionsList = ({ recentActions }) => (
  <div>
    <h4 style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>Acciones Recientes</h4>
    {recentActions.length > 0 ? (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {recentActions.map((action) => (
          <li
            key={action}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              color: '#ccc',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <CheckCircle size={12} style={{ color: '#44ff44' }} />
            {action}
          </li>
        ))}
      </ul>
    ) : (
      <p style={{ fontSize: '12px', color: '#666' }}>No hay acciones recientes</p>
    )}
  </div>
);

RecentActionsList.propTypes = {
  recentActions: PropTypes.arrayOf(PropTypes.string).isRequired,
};

// Tab content wrapper
export const TabContent = ({ children, isActive }) => (
  <div
    style={{
      display: isActive ? 'block' : 'none',
      animation: isActive ? 'fadeIn 0.2s' : 'none',
    }}
  >
    {children}
  </div>
);

TabContent.propTypes = {
  children: PropTypes.node.isRequired,
  isActive: PropTypes.bool.isRequired,
};
