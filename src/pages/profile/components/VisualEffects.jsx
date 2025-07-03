import React, { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Componente que maneja los efectos visuales de la página de perfil
 * Utiliza Intersection Observer para cargar y activar efectos solo cuando son visibles
 */
const VisualEffects = () => {
  // Referencias para los contenedores de efectos
  const particlesReference = useRef(null);
  const gridLinesReference = useRef(null);
  const cosmicLightsReference = useRef(null);

  // Estados para controlar la visibilidad
  const [particlesVisible, setParticlesVisible] = useState(false);
  const [gridLinesVisible, setGridLinesVisible] = useState(false);
  const [cosmicLightsVisible, setCosmicLightsVisible] = useState(false);

  // Configuración para limitar la cantidad de partículas según el rendimiento del dispositivo
  const [particleCount, setParticleCount] = useState(12);

  useEffect(() => {
    // Detectar capacidades del dispositivo para ajustar efectos
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

  // Genera claves únicas y estables para los elementos de la lista para
  // cumplir con las reglas de lint. Aunque los índices serían seguros aquí
  // (listas estáticas), generamos IDs únicos para una solución más robusta.
  const particleKeys = useMemo(
    () => Array.from({ length: particleCount }, (_, index) => `p-${index}`),
    [particleCount],
  );

  const horizontalLineKeys = useMemo(
    () => Array.from({ length: 5 }, (_, index) => `h-${index}`),
    [],
  );

  const verticalLineKeys = useMemo(
    () => Array.from({ length: 5 }, (_, index) => `v-${index}`),
    [],
  );

  // Generar partículas de manera dinámica
  const renderParticles = () => {
    if (!particlesVisible) return;

    return Array.from({ length: particleCount }).map((_, index) => {
      return (
        <div
          // eslint-disable-next-line security/detect-object-injection
          key={particleKeys[index]}
          className={`particle particle-${index + 1}`}
          style={{
            // Calcular posiciones aleatorias pero deterministas para cada partícula
            top: `${(index * 7) % 100}%`,
            left: `${(index * 13) % 100}%`,
            // Reducir la intensidad de animación para mejorar rendimiento
            animationDuration: `${3 + (index % 3)}s`,
          }}
        />
      );
    });
  };

  // Generar líneas de cuadrícula de manera dinámica
  const renderGridLines = () => {
    if (!gridLinesVisible) return;

    // Número reducido de líneas para mejor rendimiento
    const horizontalLines = 5;
    const verticalLines = 5;

    return (
      <>
        {Array.from({ length: horizontalLines }).map((_, index) => {
          return (
            <div
              // eslint-disable-next-line security/detect-object-injection
              key={horizontalLineKeys[index]}
              className='horizontal-line'
              style={{
                top: `${(index + 1) * (100 / (horizontalLines + 1))}%`,
                animationDelay: `${index * 0.2}s`,
              }}
            />
          );
        })}

        {Array.from({ length: verticalLines }).map((_, index) => {
          return (
            <div
              // eslint-disable-next-line security/detect-object-injection
              key={verticalLineKeys[index]}
              className='vertical-line'
              style={{
                left: `${(index + 1) * (100 / (verticalLines + 1))}%`,
                animationDelay: `${index * 0.2 + 0.1}s`,
              }}
            />
          );
        })}
      </>
    );
  };

  return (
    <>
      {/* Partículas */}
      <div ref={particlesReference} className='particles'>
        {renderParticles()}
      </div>

      {/* Líneas de cuadrícula */}
      <div ref={gridLinesReference} className='grid-lines'>
        {renderGridLines()}
      </div>

      {/* Luces cósmicas */}
      <div ref={cosmicLightsReference} className='cosmic-lights'>
        {cosmicLightsVisible && (
          <>
            <div className='light-beam light-beam-1' />
            <div className='light-beam light-beam-2' />
            <div className='light-beam light-beam-3' />
          </>
        )}
      </div>

      {/* Scanlines */}
      <div className='scanlines' />

      {/* Glitch effect */}
      <div className='glitch-effect' />
    </>
  );
};

export default React.memo(VisualEffects);
