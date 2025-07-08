import {
  FiZoomIn,
  FiZoomOut,
  FiMaximize,
  FiRotateCcw,
  FiRotateCw,
} from 'react-icons/fi';
import { useReactFlow } from 'reactflow';

import { useUndoRedo } from '@/stores/selectors';

import './ZoomControls.css';

/**
 * Componente para controles de zoom e historial en el editor de flujos
 * @param {Object} props - Propiedades del componente
 * @param {Function} props.onUndo - Función para deshacer cambios
 * @param {Function} props.onRedo - Función para rehacer cambios
 */
const ZoomControls = ({ onUndo, onRedo }) => {
  // Obtener funciones de historial del store de Zustand
  const { undo, redo, canUndo, canRedo } = useUndoRedo();

  // Usar las props si están disponibles, de lo contrario usar el store
  const handleUndo = onUndo || undo;
  const handleRedo = onRedo || redo;
  const isUndoEnabled = canUndo;
  const isRedoEnabled = canRedo;

  // Usar ReactFlow hooks para zoom
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <div className='zoom-controls'>
      {/* Controles de zoom */}
      <button className='zoom-control-button' onClick={() => zoomIn()}>
        <FiZoomIn />
        <div className='button-tooltip'>Acercar</div>
      </button>
      <button className='zoom-control-button' onClick={() => zoomOut()}>
        <FiZoomOut />
        <div className='button-tooltip'>Alejar</div>
      </button>
      <button
        className='zoom-control-button'
        onClick={() => fitView({ padding: 0.2 })}
      >
        <FiMaximize />
        <div className='button-tooltip'>Ajustar vista</div>
      </button>

      {/* Botones de deshacer/rehacer */}
      <button
        className={`zoom-control-button ${isUndoEnabled ? '' : 'disabled'}`}
        onClick={() => isUndoEnabled && handleUndo()}
        disabled={!isUndoEnabled}
      >
        <FiRotateCcw />
        <div className='button-tooltip'>Deshacer</div>
      </button>
      <button
        className={`zoom-control-button ${isRedoEnabled ? '' : 'disabled'}`}
        onClick={() => isRedoEnabled && handleRedo()}
        disabled={!isRedoEnabled}
      >
        <FiRotateCw />
        <div className='button-tooltip'>Rehacer</div>
      </button>

      {/* El botón de historial de versiones ha sido eliminado */}
    </div>
  );
};

export default ZoomControls;
