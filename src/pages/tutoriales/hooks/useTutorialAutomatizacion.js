import { useState, useRef } from 'react';

import useCardTiltEffect from './useCardTiltEffect';
import useMousePosition from './useMousePosition';
import usePhraseRotator from './usePhraseRotator';
import useScrollActivation from './useScrollActivation';

const initialPhrases = [
  'Automatiza y conquista el caos.',
  'Tu Plubot, tu flujo, tu poder.',
  'Eficiencia es el nuevo superpoder.',
  'Crea flujos que trabajan por ti.',
  'Byte te guía en cada paso.',
];

const useTutorialAutomatizacion = () => {
  const [showMore, setShowMore] = useState(false);
  const containerReference = useRef(null);

  const { phrases, phraseIndex, currentPhrase } = usePhraseRotator(initialPhrases);
  useScrollActivation();
  const cursorPosition = useMousePosition(containerReference);
  const { tilt, handleMouseEnter, handleMouseLeave } = useCardTiltEffect(
    containerReference,
    cursorPosition,
  );

  const cardStyle = {
    transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
  };

  const buttonVariants = {
    hover: { scale: 1.08, boxShadow: '0 0 20px rgba(255, 0, 255, 0.8)' },
    tap: { scale: 0.95 },
  };

  return {
    showMore,
    setShowMore,
    phrases,
    phraseIndex,
    currentPhrase,
    containerReference,
    cardStyle,
    handleMouseEnter,
    handleMouseLeave,
    buttonVariants,
  };
};

export default useTutorialAutomatizacion;
