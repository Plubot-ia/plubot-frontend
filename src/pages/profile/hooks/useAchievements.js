import { useState } from 'react';

/**
 * Hook personalizado para gestionar los logros del usuario
 * @returns {Object} - Objeto con estados y funciones para gestionar logros
 */
const useAchievements = () => {
  const [showAchievementUnlocked, setShowAchievementUnlocked] = useState(false);
  const [recentAchievement, setRecentAchievement] = useState();

  /**
   * Muestra un logro desbloqueado por un tiempo determinado
   * @param {Object} achievement - Datos del logro
   * @param {number} [timeout=5000] - Tiempo en ms que se muestra el logro
   */
  const displayAchievement = (achievement, timeout = 5000) => {
    setRecentAchievement(achievement);
    setShowAchievementUnlocked(true);

    setTimeout(() => {
      setShowAchievementUnlocked(false);
    }, timeout);
  };

  return {
    showAchievementUnlocked,
    setShowAchievementUnlocked,
    recentAchievement,
    setRecentAchievement,
    displayAchievement,
  };
};

export default useAchievements;
