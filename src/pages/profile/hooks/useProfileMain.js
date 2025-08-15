import { useMemo, useCallback } from 'react';

import { powers } from '@/data/powers';

/**
 * Hook personalizado para gestionar la lógica de ProfileMain.jsx
 * @param {object} user - El objeto de usuario.
 * @param {Function} setActiveTab - Función para cambiar la pestaña activa.
 * @param {Function} toggleSectionExpansion - Función para expandir/colapsar secciones.
 * @returns {object} - Un objeto con los datos calculados y los manejadores de eventos.
 */
export const useProfileMain = (user, setActiveTab, toggleSectionExpansion) => {
  const getPowerDetails = useCallback((powerId) => {
    const power = powers.find((p) => p.id === powerId);
    return power
      ? {
          title: power.title,
          icon: power.icon,
          description: power.description,
        }
      : { title: powerId, icon: '⚡', description: 'Desconocido' };
  }, []);

  const userStats = useMemo(() => {
    if (!user) return { totalPlubots: 0, totalPowers: 0, activePowers: 0 };

    const totalPlubots = user.plubots ? user.plubots.length : 0;
    const totalPowers = powers.length;
    const activePowers = user.powers ? user.powers.length : 0;

    return { totalPlubots, totalPowers, activePowers };
  }, [user]);

  const powerPercentage = useMemo(() => {
    return userStats.totalPowers > 0
      ? Math.round((userStats.activePowers / userStats.totalPowers) * 100)
      : 0;
  }, [userStats.activePowers, userStats.totalPowers]);

  const handleViewPlubots = useCallback(() => {
    setActiveTab('plubots');
  }, [setActiveTab]);

  const handleViewPowers = useCallback(() => {
    setActiveTab('powers');
  }, [setActiveTab]);

  const handleKeyDown = useCallback(
    (event, section) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleSectionExpansion(section);
      }
    },
    [toggleSectionExpansion],
  );

  return {
    getPowerDetails,
    userStats,
    powerPercentage,
    handleViewPlubots,
    handleViewPowers,
    handleKeyDown,
  };
};
