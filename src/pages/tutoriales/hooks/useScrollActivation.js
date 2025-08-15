import { useState, useEffect, useCallback } from 'react';

import useWindowSize from '../../../hooks/useWindowSize';

const useScrollActivation = () => {
  const { height } = useWindowSize();
  const [activatedElements, setActivatedElements] = useState([]);

  const activateElement = useCallback(
    (id) => {
      if (!activatedElements.includes(id)) {
        setActivatedElements((previous) => [...previous, id]);
      }
    },
    [activatedElements],
  );

  const handleScroll = useCallback(() => {
    const elements = document.querySelectorAll('.activatable');
    for (const element of elements) {
      const rect = element.getBoundingClientRect();
      const isVisible = rect.top <= (height ?? 0) * 0.8 && rect.bottom >= 0;
      if (isVisible) {
        const { id } = element.dataset;
        if (id && !activatedElements.includes(id)) {
          activateElement(id);
        }
      }
    }
  }, [height, activatedElements, activateElement]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial call
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return activatedElements;
};

export default useScrollActivation;
