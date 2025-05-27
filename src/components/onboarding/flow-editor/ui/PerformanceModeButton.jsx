import React, { useState, useEffect } from 'react';
import { Zap, AlertTriangle } from 'lucide-react';
import './PerformanceModeButton.css';
import useFlowStore from '@/stores/useFlowStore';

/**
 * Botón para activar/desactivar el modo Ultra Rendimiento
 * Este modo optimiza la visualización y el rendimiento para trabajar con cientos de nodos
 * eliminando efectos visuales, animaciones y simplificando estilos
 */
const PerformanceModeButton = () => {
  // Obtener estado y funciones del store de Flow
  const { isUltraMode, toggleUltraMode } = useFlowStore(state => ({
    isUltraMode: state.isUltraMode,
    toggleUltraMode: state.toggleUltraMode
  }));
  const [showFeedback, setShowFeedback] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Manejar el clic con feedback visual
  const handleClick = () => {
    try {
      // Mostrar feedback visual
      setShowFeedback(true);
      setHasError(false);
      
      // Llamar a la función toggleUltraMode del store
      toggleUltraMode();
      
      // Aplicar o quitar la clase 'ultra-mode' al body
      if (!isUltraMode) {
        document.body.classList.add('ultra-mode');
      } else {
        document.body.classList.remove('ultra-mode');
      }
      
      // Ocultar el feedback después de un tiempo
      setTimeout(() => {
        setShowFeedback(false);
      }, 1000);
    } catch (error) {
      console.error('Error al cambiar el modo de rendimiento:', error);
      setHasError(true);
      setTimeout(() => {
        setHasError(false);
      }, 3000);
    }
  };
  
  // Mostrar/ocultar tooltip
  const handleMouseEnter = () => setShowTooltip(true);
  const handleMouseLeave = () => setShowTooltip(false);
  
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
      <div className="button-icon">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div className="feedback-indicator"></div>
      <div className="button-tooltip">
        {isUltraMode ? 'Desactivar modo Ultra Rendimiento' : 'Activar modo Ultra Rendimiento'}
      </div>
      {hasError && (
        <div className="performance-error-tooltip">
          Error al cambiar modo
        </div>
      )}
    </button>
  );
};

export default PerformanceModeButton;
