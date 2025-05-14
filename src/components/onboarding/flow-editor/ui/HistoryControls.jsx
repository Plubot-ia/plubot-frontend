import React from 'react';
import { FiRotateCcw, FiRotateCw } from 'react-icons/fi';
import './HistoryControls.css';

/**
 * Componente para controles de historial (deshacer/rehacer) en el editor de flujos
 */
const HistoryControls = ({ onUndo, onRedo, canUndo, canRedo }) => {
  return (
    <div className="history-controls">
      <button
        className="history-control-button"
        onClick={onUndo}
        disabled={!canUndo}
        title="Deshacer"
      >
        <FiRotateCcw />
      </button>
      <button
        className="history-control-button"
        onClick={onRedo}
        disabled={!canRedo}
        title="Rehacer"
      >
        <FiRotateCw />
      </button>
    </div>
  );
};

export default HistoryControls;
