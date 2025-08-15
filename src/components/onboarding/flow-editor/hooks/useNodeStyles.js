import { useMemo } from 'react';

/**
 * Hook personalizado para memoizar los estilos de los nodos
 * Evita recreaciones constantes que causan problemas de rendimiento
 */
const useNodeStyles = (isUltraPerformanceMode = false) => {
  return useMemo(() => {
    // Estilos base para todos los nodos
    const baseNodeStyle = {
      borderRadius: '12px',
      boxShadow: isUltraPerformanceMode
        ? '0 2px 6px rgba(0, 0, 0, 0.2)'
        : '0 4px 12px rgba(0, 0, 0, 0.3), 0 0 15px rgba(0, 195, 255, 0.2)',
      border: '2px solid',
      transition: isUltraPerformanceMode ? 'none' : 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
      backdropFilter: isUltraPerformanceMode ? 'none' : 'blur(5px)',
      WebkitBackdropFilter: isUltraPerformanceMode ? 'none' : 'blur(5px)',
    };

    // Estilos específicos para cada tipo de nodo
    return {
      start: {
        ...baseNodeStyle,
        borderColor: '#4ecca3',
        background: 'linear-gradient(145deg, #1a1a2e, #232342)',
      },
      message: {
        ...baseNodeStyle,
        borderColor: '#4ea0ff',
        background: 'linear-gradient(145deg, #1a1a2e, #232342)',
      },
      decision: {
        ...baseNodeStyle,
        borderColor: '#ffcc00',
        background: 'linear-gradient(145deg, #1a1a2e, #232342)',
      },
      option: {
        ...baseNodeStyle,
        borderColor: '#ff9966',
        background: 'linear-gradient(145deg, #1a1a2e, #232342)',
      },
      action: {
        ...baseNodeStyle,
        borderColor: '#ff6b6b',
        background: 'linear-gradient(145deg, #1a1a2e, #232342)',
      },
      end: {
        ...baseNodeStyle,
        borderColor: '#ff3366',
        background: 'linear-gradient(145deg, #1a1a2e, #232342)',
      },
      power: {
        ...baseNodeStyle,
        borderColor: '#9966ff',
        background: 'linear-gradient(145deg, #1a1a2e, #232342)',
      },
      httpRequest: {
        ...baseNodeStyle,
        borderColor: '#66cc99',
        background: 'linear-gradient(145deg, #1a1a2e, #232342)',
      },
      // Estilos para nodos seleccionados
      selected: {
        borderColor: '#ff6b6b',
        boxShadow: isUltraPerformanceMode
          ? '0 0 8px rgba(255, 107, 107, 0.5)'
          : '0 0 18px rgba(255, 107, 107, 0.5), inset 0 0 8px rgba(255, 107, 107, 0.2)',
        transform: isUltraPerformanceMode ? 'none' : 'translateY(-2px)',
      },
      // Estilos para nodos con hover
      hovered: {
        boxShadow: isUltraPerformanceMode
          ? '0 4px 8px rgba(0, 0, 0, 0.3)'
          : '0 8px 16px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.15)',
        transform: isUltraPerformanceMode ? 'none' : 'translateY(-1px)',
      },
    };
  }, [isUltraPerformanceMode]);
};

export default useNodeStyles;
