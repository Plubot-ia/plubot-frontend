import React from 'react';
import './VersionHistory.css';

const VersionHistory = ({ versions, onRestore }) => {
  return (
    <div className={`ts-version-history ts-expanded`}>
      <div 
        className="ts-version-header" 
        title="Historial de Versiones"
      >
        <h4>Historial de Versiones</h4>
        <span className="ts-toggle-icon">▼</span> 
      </div>
      
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
    </div>
  );
};

export default VersionHistory;
