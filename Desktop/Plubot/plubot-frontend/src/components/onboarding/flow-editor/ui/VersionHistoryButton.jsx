import React from 'react';
import { History } from 'lucide-react';
import './VersionHistoryButton.css';

/**
 * Botón para mostrar/ocultar el panel de historial de versiones
 */
const VersionHistoryButton = ({ onClick, isActive }) => {
  return (
    <div className="version-history-button-container">
      <button 
        className={`version-history-button ${isActive ? 'active' : ''}`}
        onClick={onClick}
        title="Historial de versiones"
      >
        <History size={16} />
      </button>
    </div>
  );
};

export default VersionHistoryButton;
