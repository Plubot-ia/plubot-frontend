import React, { useState, useEffect, useRef } from 'react';

const useVisualEffects = () => {
  const particlesReference = useRef(undefined);
  const gridLinesReference = useRef(undefined);
  const cosmicLightsReference = useRef(undefined);

  const [particlesVisible, setParticlesVisible] = useState(false);
  const [gridLinesVisible, setGridLinesVisible] = useState(false);
  const [cosmicLightsVisible, setCosmicLightsVisible] = useState(false);
  const [particleCount, setParticleCount] = useState(12);

  useEffect(() => {
    const detectPerformance = () => {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const lowMemory = navigator.deviceMemory && navigator.deviceMemory < 4;
      if (isMobile || lowMemory) {
        setParticleCount(6);
      }
    };

    detectPerformance();

    const observerOptions = {
      root: undefined,
      rootMargin: '0px',
      threshold: 0.1,
    };

    const elementsToObserve = [
      { ref: particlesReference, setVisible: setParticlesVisible },
      { ref: gridLinesReference, setVisible: setGridLinesVisible },
      { ref: cosmicLightsReference, setVisible: setCosmicLightsVisible },
    ];

    const observers = elementsToObserve.map(({ ref, setVisible }) => {
      const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        }
      }, observerOptions);

      if (ref.current) {
        observer.observe(ref.current);
      }
      return observer;
    });

    return () => {
      for (const observer of observers) {
        observer.disconnect();
      }
    };
  }, []);

  return {
    particlesReference,
    gridLinesReference,
    cosmicLightsReference,
    particlesVisible,
    gridLinesVisible,
    cosmicLightsVisible,
    particleCount,
  };
};

export default useVisualEffects;
