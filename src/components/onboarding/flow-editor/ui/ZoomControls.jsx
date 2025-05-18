import React from 'react';
import { useReactFlow } from 'reactflow';
import { FiZoomIn, FiZoomOut, FiMaximize, FiRotateCcw, FiRotateCw } from 'react-icons/fi';
import './ZoomControls.css';
import useFlowStore from '@/stores/useFlowStore';
import useTrainingStore from '@/stores/useTrainingStore';

/**
 * Componente para controles de zoom, historial y versiones en el editor de flujos
 * @param {Object} props - Propiedades del componente
 * @param {Function} props.onUndo - Función para deshacer cambios
 * @param {Function} props.onRedo - Función para rehacer cambios
 * @param {boolean} props.canUndo - Indica si se puede deshacer
 * @param {boolean} props.canRedo - Indica si se puede rehacer
 * @param {Function} props.onToggleHistory - Función para mostrar/ocultar el panel de historial
 * @param {boolean} props.historyActive - Indica si el panel de historial está activo
 */
const ZoomControls = ({
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onToggleHistory,
  historyActive
}) => {
  // Usar el store de Flow como fallback si no se proporcionan props
  const flowStore = useFlowStore(state => ({
    undo: state.undo,
    redo: state.redo,
    canUndo: state.canUndo,
    canRedo: state.canRedo
  }));
  
  // Usar las props si están disponibles, de lo contrario usar el store
  const handleUndo = onUndo || flowStore.undo;
  const handleRedo = onRedo || flowStore.redo;
  const isUndoEnabled = canUndo !== undefined ? canUndo : flowStore.canUndo;
  const isRedoEnabled = canRedo !== undefined ? canRedo : flowStore.canRedo;

  // Usar ReactFlow hooks para zoom
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <div className="zoom-controls">
      {/* Controles de zoom */}
      <button
        className="zoom-control-button"
        onClick={() => zoomIn()}
      >
        <FiZoomIn />
        <div className="button-tooltip">Acercar</div>
      </button>
      <button
        className="zoom-control-button"
        onClick={() => zoomOut()}
      >
        <FiZoomOut />
        <div className="button-tooltip">Alejar</div>
      </button>
      <button
        className="zoom-control-button"
        onClick={() => fitView({ padding: 0.2 })}
      >
        <FiMaximize />
        <div className="button-tooltip">Ajustar vista</div>
      </button>
      
      {/* Botones de deshacer/rehacer */}
      <button
        className={`zoom-control-button ${!isUndoEnabled ? 'disabled' : ''}`}
        onClick={() => isUndoEnabled && handleUndo()}
        disabled={!isUndoEnabled}
      >
        <FiRotateCcw />
        <div className="button-tooltip">Deshacer</div>
      </button>
      <button
        className={`zoom-control-button ${!isRedoEnabled ? 'disabled' : ''}`}
        onClick={() => isRedoEnabled && handleRedo()}
        disabled={!isRedoEnabled}
      >
        <FiRotateCw />
        <div className="button-tooltip">Rehacer</div>
      </button>
      
      {/* El botón de historial de versiones ha sido eliminado */}
    </div>
  );
};

export default ZoomControls;
