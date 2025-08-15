import { useEffect, useState, useCallback } from 'react';

const XP_STEPS = [50, 100]; // Dos checkpoints por artículo
const XP_PER_STEP = 25; // Reducido para hacer XP más difícil
const LEVEL_THRESHOLDS = [0, 1000, 3000, 6000, 10_000, 15_000, 25_000, 40_000, 60_000]; // Umbrales más altos

const calculateLevel = (xp) => {
  const currentLevel = LEVEL_THRESHOLDS.findIndex((threshold, index) => {
    const isLastLevel = index === LEVEL_THRESHOLDS.length - 1;
    return xp >= threshold && (isLastLevel || xp < LEVEL_THRESHOLDS[index + 1]);
  });
  return currentLevel === -1 ? 0 : currentLevel;
};

const showNotification = (message) => {
  const notification = document.createElement('div');
  // Estilos para la notificación de subida de nivel.
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #00e0ff;
    color: #121212;
    padding: 10px 20px;
    border-radius: 5px;
    box-shadow: 0 0 10px rgba(0, 224, 255, 0.8);
    z-index: 1000;
    font-family: 'Orbitron', sans-serif;
    animation: slideIn 0.5s ease-out, fadeOut 0.5s 2s ease-in forwards;
  `;
  notification.textContent = message;
  document.body.append(notification);
  setTimeout(() => notification.remove(), 2500);
};

const useReadingXP = (postId) => {
  const [awardedSteps, setAwardedSteps] = useState(() => {
    const saved = JSON.parse(localStorage.getItem(`xp_awarded_${postId}`)) ?? [];
    return saved;
  });

  const [xpGained, setXpGained] = useState(0);
  const [level, setLevel] = useState(() => {
    const totalXP = Number.parseInt(localStorage.getItem('plubot_xp_total') ?? '0', 10);
    return calculateLevel(totalXP);
  });

  const addXPToGlobal = useCallback(
    (amount) => {
      const previousXP = Number.parseInt(localStorage.getItem('plubot_xp_total') ?? '0', 10);
      const newXP = previousXP + amount;
      localStorage.setItem('plubot_xp_total', newXP);

      // Actualizar nivel
      const newLevel = calculateLevel(newXP);

      if (newLevel > level) {
        setLevel(newLevel);
        showNotification(`¡Subiste al Nivel ${newLevel}!`);
      }
    },
    [level],
  );

  useEffect(() => {
    // Verificar si el artículo ya fue completado completamente
    const isPostCompleted = JSON.parse(localStorage.getItem(`xp_completed_${postId}`)) ?? false;
    if (isPostCompleted) {
      return; // No se crea el observer, no se necesita limpieza.
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const percent = Number.parseInt(entry.target.dataset.percent, 10);
            if (!awardedSteps.includes(percent)) {
              const newSteps = [...awardedSteps, percent];
              setAwardedSteps(newSteps);
              localStorage.setItem(`xp_awarded_${postId}`, JSON.stringify(newSteps));
              setXpGained((previous) => previous + XP_PER_STEP);
              addXPToGlobal(XP_PER_STEP);

              // Marcar artículo como completado si se alcanza el 100%
              if (percent === 100) {
                localStorage.setItem(`xp_completed_${postId}`, JSON.stringify(true));
              }
            }
          }
        }
      },
      { threshold: 0.8 },
    );

    for (const step of XP_STEPS) {
      const element = document.querySelector(`[data-percent='${step}']`);
      if (element) observer.observe(element);
    }

    return () => observer.disconnect();
  }, [awardedSteps, postId, addXPToGlobal]);

  return { xpGained, level };
};

export default useReadingXP;
