import PropTypes from 'prop-types';
import React, { useState, useEffect, useCallback } from 'react';

import { powers as allPowersData } from '@/data/powers';
import axiosInstance from '@/utils/axios-config.js';

import AddPowerForm from './AddPowerForm';
import PowerItem from './PowerItem';

const getPowerDetails = (powerId) => {
  const power = allPowersData.find((p) => p.id === powerId);
  return power
    ? { title: power.title, icon: power.icon, description: power.description }
    : { title: powerId, icon: '⚡', description: 'Desconocido' };
};

/**
 * Componente que gestiona la sección de poderes del usuario
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.user - Datos del usuario
 * @param {Function} props.updateProfile - Función para actualizar los datos del usuario
 * @param {Function} props.showNotification - Función para mostrar notificaciones
 * @param {Function} props.navigate - Función de navegación
 */
const PowersSection = ({ user, updateProfile, showNotification, navigate }) => {
  const [powerAnimations, setPowerAnimations] = useState({});

  const activateAnimation = useCallback((key) => {
    setPowerAnimations((previous) => ({
      ...previous,
      // eslint-disable-next-line security/detect-object-injection
      [key]: { ...previous[key], active: true },
    }));
  }, []);

  useEffect(() => {
    if (user && Array.isArray(user.powers)) {
      const animations = {};
      for (const [index, power] of user.powers.entries()) {
        if (power) {
          // eslint-disable-next-line security/detect-object-injection
          animations[power] = { delay: index * 300, active: false };
        }
      }
      setPowerAnimations(animations);

      const timeouts = Object.keys(animations).map((key, index) =>
        setTimeout(() => activateAnimation(key), index * 300 + 500),
      );

      return () => {
        for (const timeoutId of timeouts) {
          clearTimeout(timeoutId);
        }
      };
    }
  }, [user, activateAnimation]);

  const handleAddPower = async (newPowerId) => {
    if (!newPowerId) {
      showNotification('Por favor, selecciona un poder.', 'error');
      return;
    }

    try {
      showNotification('Adquiriendo poder...', 'info');
      const response = await axiosInstance.post('auth/profile/powers', {
        powerId: newPowerId,
      });

      if (response.data.status === 'success') {
        updateProfile({ ...user, powers: response.data.powers });
        showNotification('¡Poder adquirido con éxito!', 'success');
        setPowerAnimations((previous) => ({
          ...previous,
          [newPowerId]: { delay: 0, active: true },
        }));
      } else {
        showNotification(
          response.data.message || 'Error al agregar el poder',
          'error',
        );
      }
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('access_token');
        showNotification(
          'Sesión expirada. Por favor, inicia sesión nuevamente.',
          'error',
        );
        navigate('/login');
      } else {
        showNotification(
          `Error al agregar el poder: ${error.message}`,
          'error',
        );
      }
    }
  };

  const handleRemovePower = async (powerId) => {
    try {
      showNotification('Desactivando poder...', 'info');
      const response = await axiosInstance.delete('auth/profile/powers', {
        data: { powerId },
      });

      if (response.data.status === 'success') {
        setPowerAnimations((previous) => ({
          ...previous,
          // eslint-disable-next-line security/detect-object-injection
          [powerId]: { ...previous[powerId], active: false, removing: true },
        }));

        setTimeout(() => {
          updateProfile({ ...user, powers: response.data.powers });
          showNotification('Poder eliminado correctamente', 'success');
        }, 800);
      } else {
        showNotification(
          response.data.message || 'Error al eliminar el poder',
          'error',
        );
      }
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('access_token');
        showNotification(
          'Sesión expirada. Por favor, inicia sesión nuevamente.',
          'error',
        );
        navigate('/login');
      } else {
        showNotification(
          `Error al eliminar el poder: ${error.message}`,
          'error',
        );
      }
    }
  };

  return (
    <div className='profile-section powers-section'>
      <h3 className='profile-section-title'>PODERES</h3>
      <div className='powers-grid full'>
        {Array.isArray(user?.powers) && user.powers.length > 0 ? (
          user.powers.map((powerId) => (
            <PowerItem
              key={powerId}
              power={powerId}
              powerDetails={getPowerDetails(powerId)}
              // eslint-disable-next-line security/detect-object-injection
              animation={powerAnimations[powerId]}
              onRemove={handleRemovePower}
            />
          ))
        ) : (
          <div className='empty-state'>
            <div className='empty-icon'>⚡</div>
            <p>No tienes poderes asignados.</p>
          </div>
        )}
      </div>

      <AddPowerForm
        onAddPower={handleAddPower}
        existingPowers={user?.powers || []}
      />
    </div>
  );
};

PowersSection.displayName = 'PowersSection';

PowersSection.propTypes = {
  user: PropTypes.shape({
    powers: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  updateProfile: PropTypes.func.isRequired,
  showNotification: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
};

export default PowersSection;
