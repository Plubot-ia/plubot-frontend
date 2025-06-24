import { useEffect, useState } from 'react';

const XP_STEPS = [50, 100]; // Dos checkpoints por artículo
const XP_PER_STEP = 25; // Reducido para hacer XP más difícil
const LEVEL_THRESHOLDS = [0, 1000, 3000, 6000, 10000, 15000, 25000, 40000, 60000]; // Umbrales más altos

const useReadingXP = (postId) => {
  const [awardedSteps, setAwardedSteps] = useState(() => {
    const saved = JSON.parse(localStorage.getItem(`xp_awarded_${postId}`)) || [];
    return saved;
  });

  const [xpGained, setXpGained] = useState(0);
  const [level, setLevel] = useState(() => {
    const totalXP = parseInt(localStorage.getItem('plubot_xp_total') || '0');
    return LEVEL_THRESHOLDS.findIndex((threshold, index) => {
      return totalXP >= threshold && (index === LEVEL_THRESHOLDS.length - 1 || totalXP < LEVEL_THRESHOLDS[index + 1]);
    });
  });

  useEffect(() => {
    // Verificar si el artículo ya fue completado completamente
    const isPostCompleted = JSON.parse(localStorage.getItem(`xp_completed_${postId}`)) || false;
    if (isPostCompleted) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const percent = parseInt(entry.target.dataset.percent);
            if (!awardedSteps.includes(percent)) {
              const newSteps = [...awardedSteps, percent];
              setAwardedSteps(newSteps);
              localStorage.setItem(`xp_awarded_${postId}`, JSON.stringify(newSteps));
              setXpGained((prev) => prev + XP_PER_STEP);
              addXPToGlobal(XP_PER_STEP);

              // Marcar artículo como completado si se alcanza el 100%
              if (percent === 100) {
                localStorage.setItem(`xp_completed_${postId}`, JSON.stringify(true));
              }
            }
          }
        });
      },
      { threshold: 0.8 },
    );

    XP_STEPS.forEach((step) => {
      const el = document.querySelector(`[data-percent='${step}']`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [awardedSteps, postId]);

  const addXPToGlobal = (amount) => {
    const prevXP = parseInt(localStorage.getItem('plubot_xp_total') || '0');
    const newXP = prevXP + amount;
    localStorage.setItem('plubot_xp_total', newXP);

    // Actualizar nivel
    const newLevel = LEVEL_THRESHOLDS.findIndex((threshold, index) => {
      return newXP >= threshold && (index === LEVEL_THRESHOLDS.length - 1 || newXP < LEVEL_THRESHOLDS[index + 1]);
    });
    if (newLevel !== level) {
      setLevel(newLevel);
      showNotification(`¡Subiste al Nivel ${newLevel}!`);
    }
  };

  const showNotification = (message) => {
    const notification = document.createElement('div');
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
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2500);
  };

  return { xpGained, level };
};

export default useReadingXP;