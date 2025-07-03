import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useEffect } from 'react';

import { useSyncService, getSyncState } from '../../services/syncService';
import './SyncStatusIndicator.css';

/**
 * Componente que muestra el estado de sincronización de plubots
 * Puede mostrarse como un indicador simple o expandirse para mostrar detalles
 */
const SyncStatusIndicator = ({ expanded = false, showControls = true }) => {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [syncDetails, setSyncDetails] = useState(null);

  // Usar el servicio de sincronización
  const { syncState, syncAllPlubots } = useSyncService();

  // Actualizar estado y detalles de sincronización
  useEffect(() => {
    setSyncDetails(getSyncState()); // Carga inicial

    const updateInterval = setInterval(() => {
      setSyncDetails(getSyncState());
    }, 1000);

    return () => clearInterval(updateInterval);
  }, []);

  // Manejar clic en el indicador
  const handleClick = () => {
    if (!showControls) return;
    setIsExpanded(!isExpanded);
  };

  // Forzar sincronización manual
  const handleSync = (e) => {
    e.stopPropagation();
    syncAllPlubots();
  };

  // Determinar el icono y color según el estado
  const getStatusIcon = () => {
    if (!syncDetails) return '⏳'; // Reloj de arena

    switch (syncDetails.syncStatus) {
      case 'syncing': {
        return '↻';
      } // Flecha circular
      case 'success': {
        return '✅';
      } // Marca de verificación
      case 'error': {
        return '⚠';
      } // Advertencia
      default: {
        return 'ℹ';
      } // Información
    }
  };

  const getStatusColor = () => {
    if (!syncDetails) return 'var(--color-gray)';

    switch (syncDetails.syncStatus) {
      case 'syncing': {
        return 'var(--color-blue)';
      }
      case 'success': {
        return 'var(--color-green)';
      }
      case 'error': {
        return 'var(--color-red)';
      }
      default: {
        return 'var(--color-gray)';
      }
    }
  };

  // Helper para obtener el texto del estado de sincronización
  const getSyncStatusText = (details) => {
    if (details.isSyncing) return 'Sincronizando...';
    if (details.syncStatus === 'success') return 'Sincronizado';
    if (details.syncStatus === 'error') return 'Error de sincronización';
    return 'Listo para sincronizar';
  };

  // Si no hay detalles de sincronización, mostrar indicador de carga
  if (!syncDetails) {
    return (
      <div className='sync-indicator loading'>
        <span className='sync-icon'>⏳</span>
      </div>
    );
  }

  return (
    <button
      type='button'
      className={`sync-indicator ${syncDetails.syncStatus} ${isExpanded ? 'expanded' : ''}`}
      onClick={handleClick}
      style={{ '--status-color': getStatusColor() }}
    >
      <div className='sync-indicator-basic'>
        <span
          className='sync-icon'
          style={{
            animation: syncDetails.isSyncing
              ? 'spin 1s linear infinite'
              : 'none',
          }}
        >
          {getStatusIcon()}
        </span>
        <span className='sync-status-text'>
          {getSyncStatusText(syncDetails)}
        </span>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className='sync-details'
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className='sync-detail-item'>
              <span>Última sincronización:</span>
              <span>{syncDetails.lastSyncFormatted}</span>
            </div>

            {syncDetails.syncErrors.length > 0 && (
              <div className='sync-errors'>
                <h4>Errores ({syncDetails.syncErrors.length}):</h4>
                <ul>
                  {syncDetails.syncErrors.slice(0, 3).map((error, index) => {
                    // eslint-disable-next-line react/no-array-index-key
                    return <li key={`${error}-${index}`}>{error}</li>;
                  })}
                  {syncDetails.syncErrors.length > 3 && (
                    <li>...y {syncDetails.syncErrors.length - 3} más</li>
                  )}
                </ul>
              </div>
            )}

            {showControls && (
              <div className='sync-controls'>
                <button
                  className='sync-now-btn'
                  onClick={handleSync}
                  disabled={syncDetails.isSyncing}
                >
                  {syncDetails.isSyncing
                    ? 'Sincronizando...'
                    : 'Sincronizar ahora'}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
};

export default SyncStatusIndicator;
