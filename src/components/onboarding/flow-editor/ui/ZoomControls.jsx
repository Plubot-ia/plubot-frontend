import React from 'react';
import { useReactFlow } from 'reactflow';
import { FiZoomIn, FiZoomOut, FiMaximize, FiRotateCcw, FiRotateCw } from 'react-icons/fi';
import { History } from 'lucide-react';
import './ZoomControls.css';

/**
 * Componente para controles de zoom, historial y versiones en el editor de flujos
 * @param {Object} props - Propiedades del componente
 * @param {Function} props.onUndo - Función para deshacer
 * @param {Function} props.onRedo - Función para rehacer
 * @param {boolean} props.canUndo - Si se puede deshacer
 * @param {boolean} props.canRedo - Si se puede rehacer
 * @param {Function} props.onToggleHistory - Función para mostrar/ocultar el historial de versiones
 * @param {boolean} props.historyActive - Si el panel de historial está activo
 */
const ZoomControls = ({ onUndo, onRedo, canUndo, canRedo, onToggleHistory, historyActive }) => {
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
        onClick={onUndo}
        disabled={!canUndo}
      >
        <FiRotateCcw />
        <div className="button-tooltip">Deshacer</div>
      </button>
      <button
        className={`zoom-control-button ${!canRedo ? 'disabled' : ''}`}
        onClick={onRedo}
        disabled={!canRedo}
      >
        <FiRotateCw />
        <div className="button-tooltip">Rehacer</div>
      </button>
      
      {/* Botón de historial de versiones */}
      <button
        className={`zoom-control-button ${historyActive ? 'active' : ''}`}
        onClick={onToggleHistory}
      >
        <History size={18} />
        <div className="button-tooltip">Historial</div>
      </button>
    </div>
  );
};

export default ZoomControls;
