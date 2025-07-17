import PropTypes from 'prop-types';
import React from 'react';
/**
 * Componente para las pestañas de navegación del perfil
 * @param {Object} props - Propiedades del componente
 * @param {string} props.activeTab - Pestaña actualmente activa
 * @param {Function} props.setActiveTab - Función para cambiar la pestaña activa
 */
const ProfileTabs = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'profile', label: 'PERFIL' },
    { id: 'plubots', label: 'PLUBOTS' },
    { id: 'powers', label: 'PODERES' },
    { id: 'activity', label: 'ACTIVIDAD' },
    { id: 'integrations', label: 'INTEGRACIONES' },
    { id: 'backup', label: 'RESPALDO' },
  ];

  return (
    <div className='profile-tabs'>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`profile-tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

ProfileTabs.propTypes = {
  activeTab: PropTypes.string.isRequired,
  setActiveTab: PropTypes.func.isRequired,
};

export default React.memo(ProfileTabs);
