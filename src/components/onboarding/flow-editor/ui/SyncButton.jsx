import React, { useState, useEffect } from 'react';
import { useSyncService, getSyncState } from '@/services/syncService';
import { motion, AnimatePresence } from 'framer-motion';
import './SyncButton.css';

/**
 * Botón de sincronización para el editor de flujos
 * Muestra un indicador visual del estado de sincronización
 * y permite expandir detalles al hacer clic
 */
const SyncButton = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [syncDetails, setSyncDetails] = useState(null);
  
  // Usar el servicio de sincronización
  const { syncState, syncAllPlubots } = useSyncService();
  
  // Actualizar estado cada segundo para mantener la UI actualizada
  useEffect(() => {
    const updateInterval = setInterval(() => {
      setSyncDetails(getSyncState());
    }, 1000);
    
    return () => clearInterval(updateInterval);
  }, []);
  
  // Inicializar detalles de sincronizaciu00f3n
  useEffect(() => {
    setSyncDetails(getSyncState());
  }, []);
  
  // Manejar clic en el botón
  const handleClick = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Forzar sincronización manual con notificación
  const handleSync = (e) => {
    e.stopPropagation();
    // Mostrar StatusBubble con mensaje de sincronización
    const statusBubbleElement = document.createElement('div');
    statusBubbleElement.className = 'status-bubble';
    statusBubbleElement.innerHTML = `
      <div class="status-bubble-content">
        ⌛ Sincronizando cambios...
      </div>
    `;
    document.body.appendChild(statusBubbleElement);
    
    // Iniciar sincronización
    syncAllPlubots()
      .then(result => {
        // Actualizar StatusBubble con resultado
        statusBubbleElement.innerHTML = `
          <div class="status-bubble-content">
            ✅ ${result.success ? 'Sincronización completada' : 'Error de sincronización'}
          </div>
        `;
        
        // Eliminar StatusBubble despuu00e9s de 3 segundos
        setTimeout(() => {
          if (document.body.contains(statusBubbleElement)) {
            document.body.removeChild(statusBubbleElement);
          }
        }, 3000);
      })
      .catch(error => {
        // Mostrar error en StatusBubble
        statusBubbleElement.innerHTML = `
          <div class="status-bubble-content">
            ❌ Error: ${error.message || 'Error de sincronización'}
          </div>
        `;
        
        // Eliminar StatusBubble despuu00e9s de 3 segundos
        setTimeout(() => {
          if (document.body.contains(statusBubbleElement)) {
            document.body.removeChild(statusBubbleElement);
          }
        }, 3000);
      });
  };
  
  // Determinar el icono según el estado
  const getStatusIcon = () => {
    if (!syncDetails) return '⏳';
    
    // Siempre mostrar el checkmark para un diseño más limpio
    return '✓'; // Checkmark simple y moderno
  };
  
  // Siempre usar el color verde neón para un diseño más limpio
  const getStatusColor = () => {
    return '#00FF66'; // Verde neón brillante
  };
  
  // Si no hay detalles de sincronización, mostrar indicador de carga
  if (!syncDetails) {
    return (
      <button className="sync-control-button loading">
        <span className="sync-icon">⏳</span>
        <div className="button-tooltip">Cargando...</div>
      </button>
    );
  }
  
  return (
    <div className="sync-button-container">
      <button 
        className={`sync-control-button ${syncDetails.syncStatus}`}
        onClick={handleClick}
        style={{ animation: 'subtle-pulse-green 2s infinite' }}
      >
        <span 
          className="sync-icon" 
          style={{ 
            animation: syncDetails.isSyncing ? 'spin 1s linear infinite' : 'none',
            color: getStatusColor()
          }}
        >
          {getStatusIcon()}
        </span>
        <div className="button-tooltip">Sincronizado</div>
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            className="sync-details-panel"
            initial={{ opacity: 0, scale: 0.9, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="sync-panel-header">
              <h4>Estado de sincronización</h4>
              <span 
                className="sync-icon" 
                style={{ color: syncDetails.syncStatus === 'synced' ? '#34A853' : '#FF5722' }}
              >
                {syncDetails.syncStatus === 'synced' ? '✓' : '⟳'}
              </span>
            </div>
            
            <div className="sync-details">
              <p>Última sincronización: {syncDetails.lastSync ? new Date(syncDetails.lastSync).toLocaleString() : 'Nunca'}</p>
              <p>Estado: {syncDetails.isSyncing ? 'Sincronizando...' : 
                        syncDetails.syncStatus === 'success' ? 'Sincronizado' :
                        syncDetails.syncStatus === 'error' ? 'Error' :
                        'Listo'}</p>
              {syncDetails.syncStatus === 'error' && (
                <p className="error-message">Error: {syncDetails.errorMessage || 'Error de sincronización'}</p>
              )}
            </div>
            
            {syncDetails.syncErrors.length > 0 && (
              <div className="sync-errors">
                <h4>Errores ({syncDetails.syncErrors.length}):</h4>
                <ul>
                  {syncDetails.syncErrors.slice(0, 3).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                  {syncDetails.syncErrors.length > 3 && (
                    <li>...y {syncDetails.syncErrors.length - 3} más</li>
                  )}
                </ul>
              </div>
            )}
            
            <div className="sync-controls">
              <button 
                className="sync-now-btn" 
                onClick={handleSync}
                disabled={syncDetails.isSyncing}
              >
                {syncDetails.isSyncing ? 'Sincronizando...' : 'Sincronizar ahora'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SyncButton;
