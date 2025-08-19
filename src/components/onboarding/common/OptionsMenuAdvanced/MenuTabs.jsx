import { Activity, BarChart3, Settings, Command } from 'lucide-react';
import PropTypes from 'prop-types';
import React from 'react';

export const MenuTabs = ({ activeTab, setActiveTab }) => (
  <div className='menu-tabs'>
    <button
      className={`tab-button ${activeTab === 'actions' ? 'active' : ''}`}
      onClick={() => setActiveTab('actions')}
      aria-label='Actions tab'
    >
      <Command size={16} />
      <span>Acciones</span>
    </button>
    <button
      className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
      onClick={() => setActiveTab('analytics')}
      aria-label='Analytics tab'
    >
      <BarChart3 size={16} />
      <span>Analítica</span>
    </button>
    <button
      className={`tab-button ${activeTab === 'tools' ? 'active' : ''}`}
      onClick={() => setActiveTab('tools')}
      aria-label='Tools tab'
    >
      <Activity size={16} />
      <span>Herramientas</span>
    </button>
    <button
      className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
      onClick={() => setActiveTab('settings')}
      aria-label='Settings tab'
    >
      <Settings size={16} />
      <span>Ajustes</span>
    </button>
  </div>
);

MenuTabs.propTypes = {
  activeTab: PropTypes.string.isRequired,
  setActiveTab: PropTypes.func.isRequired,
};
