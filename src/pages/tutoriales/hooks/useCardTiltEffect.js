import { useState, useMemo } from 'react';

const useCardTiltEffect = (containerReference, cursorPosition) => {
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => setIsHovering(false);

  const tilt = useMemo(() => {
    if (!containerReference.current || !isHovering) return { x: 0, y: 0 };
    const rect = containerReference.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const tiltX = ((cursorPosition.y - centerY) / centerY) * 5;
    const tiltY = ((cursorPosition.x - centerX) / centerX) * -5;
    return { x: tiltX, y: tiltY };
  }, [cursorPosition, isHovering, containerReference]);

  return { tilt, isHovering, handleMouseEnter, handleMouseLeave };
};

export default useCardTiltEffect;
