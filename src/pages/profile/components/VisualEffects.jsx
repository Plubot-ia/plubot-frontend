import React, { useEffect, useRef, useState } from 'react';

/**
 * Componente que maneja los efectos visuales de la página de perfil
 * Utiliza Intersection Observer para cargar y activar efectos solo cuando son visibles
 */
const VisualEffects = () => {
  // Referencias para los contenedores de efectos
  const particlesRef = useRef(null);
  const gridLinesRef = useRef(null);
  const cosmicLightsRef = useRef(null);
  
  // Estados para controlar la visibilidad
  const [particlesVisible, setParticlesVisible] = useState(false);
  const [gridLinesVisible, setGridLinesVisible] = useState(false);
  const [cosmicLightsVisible, setCosmicLightsVisible] = useState(false);
  
  // Configuración para limitar la cantidad de partículas según el rendimiento del dispositivo
  const [particleCount, setParticleCount] = useState(12);
  
  useEffect(() => {
    // Detectar capacidades del dispositivo para ajustar efectos
    const detectPerformance = () => {
      // Verificar si es un dispositivo móvil
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      // Verificar memoria del dispositivo si está disponible
      const lowMemory = navigator.deviceMemory && navigator.deviceMemory < 4;
      
      // Reducir efectos en dispositivos de bajo rendimiento
      if (isMobile || lowMemory) {
        setParticleCount(6); // Menos partículas para dispositivos de bajo rendimiento
      }
    };
    
    detectPerformance();
    
    // Crear observadores de intersección para cada efecto
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1 // 10% visible para activar
    };
    
    // Observer para partículas
    const particlesObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setParticlesVisible(true);
          // Desconectar después de activar para mantener los efectos
          particlesObserver.disconnect();
        }
      });
    }, observerOptions);
    
    // Observer para líneas de cuadrícula
    const gridLinesObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setGridLinesVisible(true);
          gridLinesObserver.disconnect();
        }
      });
    }, observerOptions);
    
    // Observer para luces cósmicas
    const cosmicLightsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setCosmicLightsVisible(true);
          cosmicLightsObserver.disconnect();
        }
      });
    }, observerOptions);
    
    // Observar elementos si existen
    if (particlesRef.current) {
      particlesObserver.observe(particlesRef.current);
    }
    
    if (gridLinesRef.current) {
      gridLinesObserver.observe(gridLinesRef.current);
    }
    
    if (cosmicLightsRef.current) {
      cosmicLightsObserver.observe(cosmicLightsRef.current);
    }
    
    // Limpiar observadores al desmontar
    return () => {
      particlesObserver.disconnect();
      gridLinesObserver.disconnect();
      cosmicLightsObserver.disconnect();
    };
  }, []);
  
  // Generar partículas de manera dinámica
  const renderParticles = () => {
    if (!particlesVisible) return null;
    
    return Array.from({ length: particleCount }).map((_, index) => (
      <div 
        key={`particle-${index}`} 
        className={`particle particle-${index + 1}`}
        style={{
          // Calcular posiciones aleatorias pero deterministas para cada partícula
          top: `${(index * 7) % 100}%`,
          left: `${(index * 13) % 100}%`,
          // Reducir la intensidad de animación para mejorar rendimiento
          animationDuration: `${3 + (index % 3)}s`
        }}
      />
    ));
  };
  
  // Generar líneas de cuadrícula de manera dinámica
  const renderGridLines = () => {
    if (!gridLinesVisible) return null;
    
    // Número reducido de líneas para mejor rendimiento
    const horizontalLines = 5;
    const verticalLines = 5;
    
    return (
      <>
        {Array.from({ length: horizontalLines }).map((_, index) => (
          <div 
            key={`h-line-${index}`} 
            className="horizontal-line"
            style={{ 
              top: `${(index + 1) * (100 / (horizontalLines + 1))}%`,
              animationDelay: `${index * 0.2}s`
            }}
          />
        ))}
        
        {Array.from({ length: verticalLines }).map((_, index) => (
          <div 
            key={`v-line-${index}`} 
            className="vertical-line"
            style={{ 
              left: `${(index + 1) * (100 / (verticalLines + 1))}%`,
              animationDelay: `${index * 0.2 + 0.1}s`
            }}
          />
        ))}
      </>
    );
  };
  
  return (
    <>
      {/* Partículas */}
      <div ref={particlesRef} className="particles">
        {renderParticles()}
      </div>
      
      {/* Líneas de cuadrícula */}
      <div ref={gridLinesRef} className="grid-lines">
        {renderGridLines()}
      </div>
      
      {/* Luces cósmicas */}
      <div ref={cosmicLightsRef} className="cosmic-lights">
        {cosmicLightsVisible && (
          <>
            <div className="light-beam light-beam-1"></div>
            <div className="light-beam light-beam-2"></div>
            <div className="light-beam light-beam-3"></div>
          </>
        )}
      </div>
      
      {/* Scanlines */}
      <div className="scanlines"></div>
      
      {/* Glitch effect */}
      <div className="glitch-effect"></div>
    </>
  );
};

export default React.memo(VisualEffects);
