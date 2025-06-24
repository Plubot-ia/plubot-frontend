import { useState, useEffect, useRef } from 'react';

import useAuthStore from '@/stores/useAuthStore';

/**
 * Hook personalizado para gestionar los datos del perfil del usuario
 * @returns {Object} - Objeto con estados y funciones para gestionar el perfil
 */
const useProfileData = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [energyLevel, setEnergyLevel] = useState(0);
  const [dailyRewardAvailable, setDailyRewardAvailable] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);

  // Identificadores únicos
  const profileId = useRef(
    (Math.random().toString(36).substring(2, 8) + Math.random().toString(36).substring(2, 8)).toUpperCase(),
  );
  const terminalId = useRef(
    (Math.random() + 1).toString(36).substring(2, 7).toUpperCase(),
  );

  // Obtener usuario y estado del store de autenticación
  const { user, profile } = useAuthStore();

  // Sincronizar estados con el store de autenticación
  useEffect(() => {
    if (profile) {
      setIsLoading(profile.isLoading || false);
      setIsLoaded(profile.isLoaded || false);

      // Si hay un valor de energía en el perfil, usarlo
      if (profile.energyLevel !== undefined) {
        setEnergyLevel(profile.energyLevel);
      }

      // Si hay información sobre la recompensa diaria, usarla
      if (profile.dailyRewardAvailable !== undefined) {
        setDailyRewardAvailable(profile.dailyRewardAvailable);
      }

      // Si hay actividades recientes, usarlas
      if (profile.recentActivities && Array.isArray(profile.recentActivities)) {
        setRecentActivities(profile.recentActivities);
      }
    }
  }, [profile]);

  // Actualizar nivel de energía cuando cambia el usuario
  useEffect(() => {
    if (user && Array.isArray(user.plubots)) {
      const energy = Math.min(user.plubots.length * 20, 100);
      setEnergyLevel(energy);
    } else {
      setEnergyLevel(0);
    }
  }, [user]);

  return {
    isLoading,
    setIsLoading,
    isLoaded,
    setIsLoaded,
    energyLevel,
    setEnergyLevel,
    dailyRewardAvailable,
    setDailyRewardAvailable,
    recentActivities,
    setRecentActivities,
    profileId,
    terminalId,
  };
};

export default useProfileData;
