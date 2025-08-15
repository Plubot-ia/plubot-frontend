import { useState, useRef } from 'react';

import useMousePosition from './useMousePosition';
import usePhraseRotator from './usePhraseRotator';
import useScrollActivation from './useScrollActivation';
import useTiltEffect from './useTiltEffect';

const initialPhrases = [
  'Los flujos son el alma de tu Plubot.',
  'Conecta nodos y activa poderes.',
  'Haz magia digital con automatizaciones.',
  'Explora el PluLab para crear flujos.',
  'Integra herramientas como WhatsApp.',
];

const useTutorialFlujos = () => {
  const [showMore, setShowMore] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const containerReference = useRef(undefined);

  const { currentPhrase } = usePhraseRotator(initialPhrases);
  const activatedElements = useScrollActivation();
  const cursorPosition = useMousePosition(containerReference);
  const tilt = useTiltEffect(containerReference, cursorPosition, isHovering);

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => setIsHovering(false);

  const buttonVariants = {
    hover: { scale: 1.08, boxShadow: '0 0 20px rgba(255, 0, 255, 0.8)' },
    tap: { scale: 0.95 },
  };

  return {
    showMore,
    setShowMore,
    isHovering,
    containerReference,
    currentPhrase,
    cursorPosition,
    tilt,
    activatedElements,
    handleMouseEnter,
    handleMouseLeave,
    buttonVariants,
  };
};

export default useTutorialFlujos;
