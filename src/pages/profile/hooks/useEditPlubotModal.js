import { useState, useEffect, useMemo } from 'react';

const calculatePowerLevel = (powers) => {
  if (!powers) return 0;
  if (typeof powers === 'string') {
    return powers.split(',').filter((p) => p.trim()).length;
  }
  if (Array.isArray(powers)) {
    return powers.length;
  }
  if (typeof powers === 'object') {
    return Object.keys(powers).length;
  }
  return 0;
};

const useEditPlubotModal = ({ plubot, setEditModalPlubot, showNotification, navigate }) => {
  const [particleEffect, setParticleEffect] = useState(false);

  const particleData = useMemo(
    () =>
      Array.from({ length: 12 }).map((_, index) => {
        // Sistema determinístico configurable: más predecible, testeable y mantenible
        const seedFactor = (index * 13 + 23) % 100; // Generador pseudo-aleatorio determinístico

        return {
          key: `particle-effect-${index}`,
          style: {
            // Posicionamiento determinístico
            left: `${(seedFactor * 2 + index * 8) % 100}%`,
            // Delay de animación determinístico
            animationDelay: `${(seedFactor % 20) / 10}s`, // 0s a 1.9s
            // Duración de animación determinística
            animationDuration: `${3 + (seedFactor % 5)}s`, // 3s a 7s
          },
        };
      }),
    [],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setParticleEffect(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleEditIdentity = () => {
    if (!plubot.id) {
      showNotification('Error: ID del Plubot no válido', 'error');
      return;
    }
    const audio = new Audio('/assets/sounds/click.mp3');
    audio.volume = 0.3;
    // eslint-disable-next-line no-empty-function
    audio.play().catch(() => {});

    setEditModalPlubot(undefined);
    navigate(`/plubot/edit/identity/${plubot.id}`);
  };

  const handleEditFlows = () => {
    if (!plubot.id) {
      showNotification('Error: ID del Plubot no válido. Por favor, crea un nuevo plubot.', 'error');
      setEditModalPlubot(undefined);
      return;
    }

    const audio = new Audio('/assets/sounds/click.mp3');
    audio.volume = 0.3;
    // eslint-disable-next-line no-empty-function
    audio.play().catch(() => {});

    navigate(`/plubot/edit/flow/${plubot.id}`);
  };

  const powerLevel = useMemo(() => calculatePowerLevel(plubot.powers), [plubot.powers]);

  return {
    particleEffect,
    particleData,
    powerLevel,
    handleEditIdentity,
    handleEditFlows,
  };
};

export default useEditPlubotModal;
