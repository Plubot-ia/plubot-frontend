import React from 'react';
import { FiRotateCcw, FiRotateCw } from 'react-icons/fi';
import './HistoryControls.css';
import useFlowStore from '@/stores/useFlowStore';

/**
 * Componente para controles de historial (deshacer/rehacer) en el editor de flujos
 */
const HistoryControls = () => {
  // Obtener funciones y estados del store de Flow
  const { undo, redo, canUndo, canRedo } = useFlowStore(state => ({
    undo: state.undo,
    redo: state.redo,
    canUndo: state.canUndo,
    canRedo: state.canRedo
  }));
  return (
    <div className="history-controls">
      <button
        className="history-control-button"
        onClick={undo}
        disabled={!canUndo}
        title="Deshacer"
      >
        <FiRotateCcw />
      </button>
      <button
        className="history-control-button"
        onClick={redo}
        disabled={!canRedo}
        title="Rehacer"
      >
        <FiRotateCw />
      </button>
    </div>
  );
};

export default HistoryControls;
