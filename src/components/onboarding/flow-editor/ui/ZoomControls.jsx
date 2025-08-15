import PropTypes from 'prop-types';
import { useCallback } from 'react';
import { FiZoomIn, FiZoomOut, FiMaximize, FiRotateCcw, FiRotateCw } from 'react-icons/fi';

import './ZoomControls.css';

/**
 * Componente para controles de zoom e historial en el editor de flujos
 * IMPORTANT: This component relies on zoom functions being passed as props
 * from the parent component that has access to the React Flow instance.
 * @param {Object} props - Propiedades del componente
 * @param {Function} props.onUndo - Función para deshacer cambios
 * @param {Function} props.onRedo - Función para rehacer cambios
 * @param {Function} props.onZoomIn - Función para acercar el zoom
 * @param {Function} props.onZoomOut - Función para alejar el zoom
 * @param {Function} props.onFitView - Función para ajustar la vista
 * @param {boolean} props.canUndo - Si se puede deshacer
 * @param {boolean} props.canRedo - Si se puede rehacer
 */
const ZoomControls = ({
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onFitView,
  canUndo: canUndoProperty,
  canRedo: canRedoProperty,
}) => {
  // Use props if available, otherwise default to false
  const isUndoEnabled = canUndoProperty ?? false;
  const isRedoEnabled = canRedoProperty ?? false;
  const handleUndo = useCallback(() => {
    if (onUndo) {
      onUndo();
    }
  }, [onUndo]);

  const handleRedo = useCallback(() => {
    if (onRedo) {
      onRedo();
    }
  }, [onRedo]);

  // Funciones de zoom - usar las props directamente o funciones vacías como fallback
  const handleZoomIn = useCallback(() => {
    if (onZoomIn) {
      onZoomIn();
    }
  }, [onZoomIn]);

  const handleZoomOut = useCallback(() => {
    if (onZoomOut) {
      onZoomOut();
    }
  }, [onZoomOut]);

  const handleFitView = useCallback(
    (options) => {
      if (onFitView) {
        onFitView(options);
      }
    },
    [onFitView],
  );

  return (
    <div className='zoom-controls'>
      {/* Controles de zoom */}
      <button className='zoom-control-button' onClick={() => handleZoomIn()}>
        <FiZoomIn />
        <div className='button-tooltip'>Acercar</div>
      </button>
      <button className='zoom-control-button' onClick={() => handleZoomOut()}>
        <FiZoomOut />
        <div className='button-tooltip'>Alejar</div>
      </button>
      <button className='zoom-control-button' onClick={() => handleFitView({ padding: 0.2 })}>
        <FiMaximize />
        <div className='button-tooltip'>Ajustar vista</div>
      </button>

      {/* Botones de deshacer/rehacer */}
      <button
        className='zoom-control-button'
        onClick={handleUndo}
        disabled={!isUndoEnabled}
        title={isUndoEnabled ? 'Deshacer (Ctrl+Z)' : 'No hay acciones para deshacer'}
        aria-label='Deshacer'
      >
        <FiRotateCcw size={16} className={isUndoEnabled ? '' : 'icon-disabled'} />
      </button>
      <button
        className='zoom-control-button'
        onClick={handleRedo}
        disabled={!isRedoEnabled}
        title={isRedoEnabled ? 'Rehacer (Ctrl+Y)' : 'No hay acciones para rehacer'}
        aria-label='Rehacer'
      >
        <FiRotateCw size={16} className={isRedoEnabled ? '' : 'icon-disabled'} />
      </button>

      {/* El botón de historial de versiones ha sido eliminado */}
    </div>
  );
};

ZoomControls.propTypes = {
  onUndo: PropTypes.func,
  onRedo: PropTypes.func,
  onZoomIn: PropTypes.func,
  onZoomOut: PropTypes.func,
  onFitView: PropTypes.func,
  canUndo: PropTypes.bool,
  canRedo: PropTypes.bool,
};

export default ZoomControls;
