import React from 'react';
import { FiSave, FiZoomIn, FiZoomOut, FiMap, FiMaximize2, FiMinimize2 } from 'react-icons/fi';
import { BiReset } from 'react-icons/bi';
import { BsLightningFill } from 'react-icons/bs';

/**
 * Controles para el editor de flujo
 * @param {Object} props - Propiedades del componente
 * @param {Function} props.toggleMiniMap - Función para alternar el minimapa
 * @param {Function} props.toggleUltraMode - Función para alternar el modo ultra rendimiento
 * @param {Function} props.onSave - Función para guardar el flujo
 * @param {Boolean} props.minimapOpen - Estado del minimapa
 * @param {Boolean} props.isUltraMode - Estado del modo ultra rendimiento
 * @param {Boolean} props.hasAutoOptimized - Indica si el sistema se ha auto-optimizado
 * @param {String} props.optimizationLevel - Nivel actual de optimización
 */
const FlowControls = ({
  toggleMiniMap,
  toggleUltraMode,
  onSave,
  minimapOpen,
  isUltraMode,
  hasAutoOptimized,
  optimizationLevel
}) => {
  return (
    <div className="flow-controls">
      {/* Controles de guardado */}
      <button 
        className="control-button save-button" 
        onClick={onSave}
        title="Guardar flujo"
      >
        <FiSave />
      </button>
      
      {/* Controles de minimapa */}
      <button 
        className={`control-button ${minimapOpen ? 'active' : ''}`} 
        onClick={toggleMiniMap}
        title="Mostrar/ocultar minimapa"
      >
        <FiMap />
      </button>
      
      {/* Control de modo ultra rendimiento */}
      <button 
        className={`control-button perf-button ${isUltraMode ? 'ultra-active' : ''}`} 
        onClick={toggleUltraMode}
        title="Activar/desactivar modo ultra rendimiento"
      >
        <BsLightningFill />
        {hasAutoOptimized && (
          <span className="auto-optimized-indicator">Auto</span>
        )}
      </button>
      
      {/* Indicador de nivel de optimización */}
      {optimizationLevel !== 'none' && (
        <div className={`optimization-level-indicator ${optimizationLevel}`}>
          {optimizationLevel.toUpperCase()}
        </div>
      )}
    </div>
  );
};

export default FlowControls;
