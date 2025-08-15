import { useCallback } from 'react';

import { powers as allPowersData } from '@/data/powers';
import axiosInstance from '@/utils/axios-config.js';

import usePowerAnimations from './usePowerAnimations';

const performAddPower = (newPowerId) =>
  axiosInstance.post('auth/profile/powers', { powerId: newPowerId });

const performRemovePower = (powerId) =>
  axiosInstance.delete('auth/profile/powers', { data: { powerId } });

const handleApiError = (error, showNotification, navigate) => {
  if (error.response?.status === 401) {
    localStorage.removeItem('access_token');
    showNotification('Sesión expirada. Inicia sesión de nuevo.', 'error');
    navigate('/login');
  } else {
    const message = error.response?.data?.message || error.message;
    showNotification(`Error: ${message}`, 'error');
  }
};

const usePowersTab = ({ user, updateProfile, showNotification, navigate }) => {
  const [powerAnimations, setPowerAnimations] = usePowerAnimations(user?.powers);

  const handleAddPower = useCallback(
    async (newPowerId) => {
      if (!newPowerId) {
        showNotification('Por favor, selecciona un poder.', 'error');
        return;
      }
      try {
        const response = await performAddPower(newPowerId);
        if (response.data.status === 'success') {
          updateProfile({ ...user, powers: response.data.powers });
          showNotification('¡Poder adquirido con éxito!', 'success');
          setPowerAnimations((previousMap) => {
            if (newPowerId === '__proto__') {
              return previousMap;
            }
            const newMap = new Map(previousMap);
            newMap.set(newPowerId, { delay: 0, active: true });
            return newMap;
          });
        }
      } catch (error) {
        handleApiError(error, showNotification, navigate);
      }
    },
    [user, updateProfile, showNotification, navigate, setPowerAnimations],
  );

  const handleRemovePower = useCallback(
    async (powerId) => {
      try {
        const response = await performRemovePower(powerId);
        if (response.data.status === 'success') {
          setPowerAnimations((previousMap) => {
            if (powerId === '__proto__' || !previousMap.has(powerId)) {
              return previousMap;
            }
            const newMap = new Map(previousMap);
            const currentAnimation = newMap.get(powerId);
            newMap.set(powerId, { ...currentAnimation, removing: true });
            return newMap;
          });
          setTimeout(() => {
            updateProfile({ ...user, powers: response.data.powers });
            showNotification('Poder eliminado con éxito', 'success');
          }, 800);
        }
      } catch (error) {
        handleApiError(error, showNotification, navigate);
      }
    },
    [user, updateProfile, showNotification, navigate, setPowerAnimations],
  );

  const availablePowers = allPowersData.filter((p) => !user?.powers?.includes(p.id));

  return {
    powerAnimations,
    availablePowers,
    handleAddPower,
    handleRemovePower,
  };
};

export default usePowersTab;
