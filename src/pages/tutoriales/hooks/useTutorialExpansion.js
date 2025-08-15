import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import useMousePosition from './useMousePosition';
import usePhraseRotator from './usePhraseRotator';
import useScrollActivation from './useScrollActivation';

const initialPhrases = [
  'Expande tu Plubot al siguiente nivel.',
  'Comparte tu visión en el PluBazaar.',
  'Haz crecer el Pluniverse con aliados.',
  'Compite en el Coliseo de Productividad.',
  'Desbloquea poderes premium para tu bot.',
];

const useTutorialExpansion = () => {
  const [showMore, setShowMore] = useState(false);
  const navigate = useNavigate();
  const containerReference = useRef(null);

  const { currentPhrase } = usePhraseRotator(initialPhrases);
  const cursorPosition = useMousePosition(containerReference);
  const activatedElements = useScrollActivation();

  const handleNavigation = (path) => {
    navigate(path);
  };

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
    showMore,
    setShowMore,
    activatedElements,
    handleNavigation,
    currentPhrase,
    buttonVariants,
    expandableContentVariants,
    containerReference,
    cursorPosition,
  };
};

export default useTutorialExpansion;
