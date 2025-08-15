import { useState, useEffect, useRef, useMemo } from 'react';

import useIntersectionObserver from './useIntersectionObserver';

const useVisualEffects = () => {
  const [particleCount, setParticleCount] = useState(12);

  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const lowMemory = navigator.deviceMemory && navigator.deviceMemory < 4;
    if (isMobile || lowMemory) {
      setParticleCount(6);
    }
  }, []);

  const observerOptions = useMemo(
    () => ({ root: undefined, rootMargin: '0px', threshold: 0.1 }),
    [],
  );

  const particlesReference = useRef(undefined);
  const particlesVisible = useIntersectionObserver(particlesReference, observerOptions);

  const gridLinesReference = useRef(undefined);
  const gridLinesVisible = useIntersectionObserver(gridLinesReference, observerOptions);

  const cosmicLightsReference = useRef(undefined);
  const cosmicLightsVisible = useIntersectionObserver(cosmicLightsReference, observerOptions);

  return {
    particlesReference,
    particlesVisible,
    gridLinesReference,
    gridLinesVisible,
    cosmicLightsReference,
    cosmicLightsVisible,
    particleCount,
  };
};

export default useVisualEffects;
