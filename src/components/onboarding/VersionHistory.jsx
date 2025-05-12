import React, { useCallback } from 'react';
import './VersionHistory.css';

const VersionHistory = ({ versions, onRestore, onClose }) => {
  // Función para manejar clics en el panel
  const handlePanelClick = useCallback((e) => {
    // Si el clic fue en un botón de restaurar, no cerramos el panel
    if (e.target.tagName === 'BUTTON') {
      return;
    }
    
    // Si el clic fue en el encabezado, cerramos el panel
    if (e.target.closest('.ts-version-header')) {
      onClose();
      return;
    }
    
    // Para cualquier otro clic dentro del panel, evitamos la propagación
    // para que no se cierre cuando se hace clic en el contenido
    e.stopPropagation();
  }, [onClose]);

  // Función para manejar clics fuera del panel
  const handleOutsideClick = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <>
      {/* Overlay para detectar clics fuera del panel */}
      <div 
        className="ts-version-history-overlay" 
        onClick={handleOutsideClick}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 998
        }}
      />
      <div 
        className={`ts-version-history ts-expanded`}
        onClick={handlePanelClick}
      >
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
                <button 
                  onClick={(e) => {
                    e.stopPropagation(); // Evitar que el clic se propague
                    onRestore(version);
                    onClose(); // Cerrar después de restaurar
                  }}
                >
                  Restaurar
                </button>
              </div>
            ))
          ) : (
            <p>No hay versiones guardadas.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default VersionHistory;
