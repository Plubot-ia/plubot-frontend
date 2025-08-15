import { useEffect } from 'react';

const useProfileEffects = ({
  setIsLoaded,
  setRecentAchievement,
  setShowAchievementUnlocked,
  setAnimateBadges,
  dailyRewardAvailable,
  setPulsatingElements,
  setRecentActivities,
}) => {
  // Efecto de inicialización y carga
  useEffect(() => {
    const loadingTimeout = setTimeout(() => setIsLoaded(true), 300);
    const achievementTimeout = setTimeout(() => {
      setRecentAchievement({
        title: '¡Explorador Digital!',
        description: 'Has explorado todas las secciones de tu perfil',
        icon: '🏆',
      });
      setShowAchievementUnlocked(true);
    }, 2000);
    const badgeAnimationTimeout = setTimeout(() => setAnimateBadges(true), 1500);

    return () => {
      clearTimeout(loadingTimeout);
      clearTimeout(achievementTimeout);
      clearTimeout(badgeAnimationTimeout);
    };
  }, [setIsLoaded, setRecentAchievement, setShowAchievementUnlocked, setAnimateBadges]);

  // Efecto para manejar la recompensa diaria
  useEffect(() => {
    if (dailyRewardAvailable) {
      setPulsatingElements((previous) => [...new Set([...previous, 'daily-reward'])]);
    }
  }, [dailyRewardAvailable, setPulsatingElements]);

  // Efecto para generar actividades recientes (simulado)
  useEffect(() => {
    const activities = [
      {
        id: 1,
        text: 'Gané 50 PluCoins en el Coliseo',
        time: 'hace 5 minutos',
        icon: '⚔️',
      },
      {
        id: 2,
        text: 'Mi Plubot "Atención al Cliente" alcanzó el nivel 5',
        time: 'hace 2 horas',
        icon: '🤖',
      },
      {
        id: 3,
        text: 'Desbloqueé el poder "Respuesta Rápida"',
        time: 'ayer',
        icon: '⚡️',
      },
    ];
    setRecentActivities(activities);
  }, [setRecentActivities]);
};

export default useProfileEffects;
