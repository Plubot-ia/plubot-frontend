import { useState, useEffect, useMemo } from 'react';

const useAprendizajeEffects = () => {
  const phrases = useMemo(
    () => [
      'En el Pluniverse, aprender es evolucionar.',
      'Entrena a tu Plubot y crece con él.',
      'Descubre la Academia de Automatización.',
      'Conecta con la comunidad en el PluForum.',
      'Obtén certificaciones y destaca.',
    ],
    [],
  );

  const [currentPhrase, setCurrentPhrase] = useState(phrases[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhrase((previous) => {
        const currentIndex = phrases.indexOf(previous);
        return phrases[(currentIndex + 1) % phrases.length];
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [phrases]);

  const buttonVariants = {
    hover: { scale: 1.08, boxShadow: '0 0 20px rgba(255, 0, 255, 0.8)' },
    tap: { scale: 0.95 },
  };

  const expandableContentVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7 } },
    exit: { opacity: 0, y: 30, scale: 0.95, transition: { duration: 0.5 } },
  };

  return {
    currentPhrase,
    buttonVariants,
    expandableContentVariants,
  };
};

export default useAprendizajeEffects;
