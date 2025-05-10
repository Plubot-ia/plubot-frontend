import React, { useState } from 'react';
import './VersionHistory.css';

const VersionHistory = ({ versions, onRestore }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`ts-version-history ${isExpanded ? 'ts-expanded' : 'ts-collapsed'}`}>
      <div 
        className="ts-version-header" 
        onClick={() => setIsExpanded(!isExpanded)}
        title={isExpanded ? "Minimizar historial" : "Expandir historial"}
      >
        <h4>Historial de Versiones</h4>
        <span className="ts-toggle-icon">{isExpanded ? '▼' : '▲'}</span>
      </div>
      
      {isExpanded && (
        <div className="ts-version-content">
          {versions?.length ? (
            versions.map((version) => (
              <div key={version.version} className="ts-version-item">
                <span>{new Date(version.version).toLocaleString()}</span>
                <button onClick={() => onRestore(version)}>Restaurar</button>
              </div>
            ))
          ) : (
            <p>No hay versiones guardadas.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default VersionHistory;
