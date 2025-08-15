import { useState, useEffect } from 'react';

import './PerformanceModeButton.css';
import { useFlowMeta } from '@/stores/selectors';

/**
 * Botón para activar/desactivar el modo Ultra Rendimiento
 * Este modo optimiza la visualización y el rendimiento para trabajar con cientos de nodos
 * eliminando efectos visuales, animaciones y simplificando estilos
 */
const PerformanceModeButton = () => {
  // Obtener estado y funciones del store de Flow
  const { isUltraMode, toggleUltraMode } = useFlowMeta();
  const [showFeedback, setShowFeedback] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Manejar el clic con feedback visual
  const handleClick = () => {
    try {
      // Mostrar feedback visual
      setShowFeedback(true);
      setHasError(false);

      // Llamar a la función toggleUltraMode del store
      toggleUltraMode();

      // La manipulación del DOM ahora es responsabilidad exclusiva del UltraModeManager,
      // orquestado por el store, para mantener una única fuente de verdad.

      // Ocultar el feedback después de un tiempo
      setTimeout(() => {
        setShowFeedback(false);
      }, 1000);
    } catch {
      setHasError(true);
      setTimeout(() => {
        setHasError(false);
      }, 3000);
    }
  };

  // Limpiar estados al desmontar
  useEffect(() => {
    return () => {
      clearTimeout();
    };
  }, []);

  return (
    <button
      className={`performance-mode-button ${isUltraMode ? 'active' : ''} ${showFeedback ? 'show-feedback' : ''} ${hasError ? 'has-error' : ''}`}
      onClick={handleClick}
      title={isUltraMode ? 'Desactivar modo Ultra Rendimiento' : 'Activar modo Ultra Rendimiento'}
    >
      <div className='button-icon'>
        <svg viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
          <path
            d='M13 2L3 14H12L11 22L21 10H12L13 2Z'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      </div>
      <div className='feedback-indicator' />
      <div className='button-tooltip'>
        {isUltraMode ? 'Desactivar modo Ultra Rendimiento' : 'Activar modo Ultra Rendimiento'}
      </div>
      {hasError && <div className='performance-error-tooltip'>Error al cambiar modo</div>}
    </button>
  );
};

export default PerformanceModeButton;
