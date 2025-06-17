import React, { useState, useEffect } from 'react';
import { useSyncService, getSyncState } from '../../services/syncService';
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
  
  // Inicializar detalles de sincronización
  useEffect(() => {
    setSyncDetails(getSyncState());
  }, []);
  
  // Manejar clic en el botón
  const handleClick = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Forzar sincronización manual
  const handleSync = (e) => {
    e.stopPropagation();
    syncAllPlubots();
  };
  
  // Determinar el icono según el estado
  const getStatusIcon = () => {
    if (!syncDetails) return '⏳';
    
    switch (syncDetails.syncStatus) {
      case 'syncing':
        return '↻';
      case 'success':
        return '✅';
      case 'error':
        return '⚠';
      default:
        return 'ℹ';
    }
  };
  
  // Determinar el color según el estado
  const getStatusColor = () => {
    if (!syncDetails) return 'var(--color-gray)';
    
    switch (syncDetails.syncStatus) {
      case 'syncing':
        return 'var(--color-blue)';
      case 'success':
        return 'var(--color-green)';
      case 'error':
        return 'var(--color-red)';
      default:
        return 'var(--color-gray)';
    }
  };
  
  // Si no hay detalles de sincronización, mostrar indicador de carga
  if (!syncDetails) {
    return (
      <button className="sync-button loading">
        <span className="sync-icon">⏳</span>
      </button>
    );
  }
  
  return (
    <div className="sync-button-container">
      <button 
        className={`sync-button ${syncDetails.syncStatus}`}
        onClick={handleClick}
        title="Estado de sincronización"
        style={{ '--status-color': getStatusColor() }}
      >
        <span 
          className="sync-icon" 
          style={{ animation: syncDetails.isSyncing ? 'spin 1s linear infinite' : 'none' }}
        >
          {getStatusIcon()}
        </span>
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            className="sync-details-panel"
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="sync-panel-header">
              <h4>Estado de sincronización</h4>
              <span className="sync-status">
                {syncDetails.isSyncing ? 'Sincronizando...' : 
                 syncDetails.syncStatus === 'success' ? 'Sincronizado' :
                 syncDetails.syncStatus === 'error' ? 'Error de sincronización' :
                 'Listo para sincronizar'}
              </span>
            </div>
            
            <div className="sync-detail-item">
              <span>Última sincronización:</span>
              <span>{syncDetails.lastSyncFormatted}</span>
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
