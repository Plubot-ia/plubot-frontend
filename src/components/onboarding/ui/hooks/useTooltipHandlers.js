import { useState, useRef, useEffect, useCallback } from 'react';

const useTooltipHandlers = (delay) => {
  const [isVisible, setIsVisible] = useState(false);
  const hideTimeoutReference = useRef(null);

  const handleMouseEnterTrigger = useCallback(() => {
    clearTimeout(hideTimeoutReference.current);
    setIsVisible(true);
  }, []);

  const handleMouseEnterTooltipContent = useCallback(() => {
    clearTimeout(hideTimeoutReference.current);
  }, []);

  const hideTooltipWithDelay = useCallback(() => {
    hideTimeoutReference.current = setTimeout(() => {
      setIsVisible(false);
    }, delay);
  }, [delay]);

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Escape') {
      setIsVisible(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTimeout(hideTimeoutReference.current);
    };
  }, []);

  return {
    isVisible,
    handleMouseEnterTrigger,
    handleMouseEnterTooltipContent,
    hideTooltipWithDelay,
    handleKeyDown,
  };
};

export default useTooltipHandlers;
