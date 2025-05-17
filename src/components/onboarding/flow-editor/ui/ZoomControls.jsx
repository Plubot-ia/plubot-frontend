import React from 'react';
import { useReactFlow } from 'reactflow';
import { FiZoomIn, FiZoomOut, FiMaximize, FiRotateCcw, FiRotateCw } from 'react-icons/fi';
import { History } from 'lucide-react';
import './ZoomControls.css';
import useFlowStore from '@/stores/useFlowStore';
import useTrainingStore from '@/stores/useTrainingStore';

/**
 * Componente para controles de zoom, historial y versiones en el editor de flujos
 */
const ZoomControls = () => {
  // Obtener funciones y estados del store de Flow
  const { 
    undo, 
    redo, 
    canUndo, 
    canRedo,
    toggleHistoryPanel,
    historyPanelActive
  } = useFlowStore(state => ({
    undo: state.undo,
    redo: state.redo,
    canUndo: state.canUndo,
    canRedo: state.canRedo,
    toggleHistoryPanel: state.toggleHistoryPanel,
    historyPanelActive: state.historyPanelActive
  }));

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
      
      {/* Controles de historial */}
      <button
        className={`zoom-control-button ${!canUndo ? 'disabled' : ''}`}
        onClick={undo}
        disabled={!canUndo}
      >
        <FiRotateCcw />
        <div className="button-tooltip">Deshacer</div>
      </button>
      <button
        className={`zoom-control-button ${!canRedo ? 'disabled' : ''}`}
        onClick={redo}
        disabled={!canRedo}
      >
        <FiRotateCw />
        <div className="button-tooltip">Rehacer</div>
      </button>
      
      {/* Botón de historial de versiones */}
      <button
        className={`zoom-control-button ${historyPanelActive ? 'active' : ''}`}
        onClick={toggleHistoryPanel}
      >
        <History size={18} />
        <div className="button-tooltip">Historial</div>
      </button>
    </div>
  );
};

export default ZoomControls;
