import useCardTiltEffect from './useCardTiltEffect';
import useMousePosition from './useMousePosition';
import usePhraseRotator from './usePhraseRotator';

const initialPhrases = [
  'Todo problema tiene un flujo que lo resuelve.',
  'Las ideas no duermen. Tu Plubot tampoco.',
  'La automatización no reemplaza, potencia.',
  'Un flujo bien diseñado, una galaxia conquistada.',
  'Byte está contigo. Siempre.',
];

const useTutorialEffects = (containerReference) => {
  const { currentPhrase } = usePhraseRotator(initialPhrases);
  const cursorPosition = useMousePosition(containerReference);
  const { tilt, isHovering, handleMouseEnter, handleMouseLeave } = useCardTiltEffect(
    containerReference,
    cursorPosition,
  );

  return {
    currentPhrase,
    cursorPosition,
    isHovering,
    tilt,
    handleMouseEnter,
    handleMouseLeave,
  };
};

export default useTutorialEffects;
