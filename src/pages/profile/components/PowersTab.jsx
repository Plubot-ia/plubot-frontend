import PropTypes from 'prop-types';
import React from 'react';

import { powers as allPowersData } from '@/data/powers';

import usePowersTab from '../hooks/usePowersTab';

import AddPowerForm from './AddPowerForm';
import PowerItem from './PowerItem';

const getPowerDetails = (powerId) => {
  const power = allPowersData.find((p) => p.id === powerId);
  return power
    ? { title: power.title, icon: power.icon, description: power.description }
    : { title: powerId, icon: '⚡', description: 'Desconocido' };
};

const PowersTab = ({ user, updateProfile, showNotification, navigate }) => {
  const { powerAnimations, handleAddPower, handleRemovePower } = usePowersTab({
    user,
    updateProfile,
    showNotification,
    navigate,
  });

  if (!user || !Array.isArray(user.powers)) {
    return (
      <div className='powers-tab-container'>
        <h2>Gestionar Poderes</h2>
        <p>Cargando información de poderes...</p>
      </div>
    );
  }

  return (
    <div className='powers-tab-container'>
      <h2>Gestionar Poderes</h2>
      <p>Activa y desactiva los poderes que has desbloqueado.</p>

      <AddPowerForm existingPowers={user.powers} onAddPower={handleAddPower} />

      <div className='powers-grid'>
        {user?.powers?.map((powerId) => {
          const powerDetails = getPowerDetails(powerId);
          if (powerId === '__proto__') {
            return;
          }
          const animation = powerAnimations.get(powerId) ?? {};
          return (
            <PowerItem
              key={powerId}
              powerId={powerId}
              powerDetails={powerDetails}
              animation={animation}
              onRemove={handleRemovePower}
            />
          );
        })}
      </div>

      {user.powers.length === 0 && (
        <div className='empty-state'>
          <p>No tienes poderes activos. ¡Adquiere uno para empezar!</p>
        </div>
      )}
    </div>
  );
};

PowersTab.propTypes = {
  user: PropTypes.object.isRequired,
  updateProfile: PropTypes.func.isRequired,
  showNotification: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
};

export default PowersTab;
