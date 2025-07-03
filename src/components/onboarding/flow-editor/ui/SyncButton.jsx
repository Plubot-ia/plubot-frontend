import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useEffect } from 'react';

import { useSyncService, getSyncState } from '@/services/syncService';
import './SyncButton.css';

/**
 * Botón de sincronización para el editor de flujos
 * Muestra un indicador visual del estado de sincronización
 * y permite expandir detalles al hacer clic
 */
const SyncButton = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [syncDetails, setSyncDetails] = useState(null);
  const [statusBubble, setStatusBubble] = useState(null); // Estado para la burbuja de notificación

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

  // Manejar clic en el botón
  const handleClick = () => {
    setIsExpanded(!isExpanded);
  };

  // Forzar sincronización manual con notificación
  const handleSync = async (e) => {
    e.stopPropagation();
    setStatusBubble({
      type: 'syncing',
      message: '⌛ Sincronizando cambios...',
    });

    try {
      const result = await syncAllPlubots();
      const message = result.success
        ? '✅ Sincronización completada'
        : '❌ Error de sincronización';
      setStatusBubble({ type: result.success ? 'success' : 'error', message });
    } catch (error) {
      setStatusBubble({
        type: 'error',
        message: `❌ Error: ${error.message || 'Error inesperado'}`,
      });
    } finally {
      setTimeout(() => setStatusBubble(null), 3000);
    }
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

  // Helper para obtener el texto del estado de sincronización
  const getSyncStatusText = (details) => {
    if (details.isSyncing) return 'Sincronizando...';
    if (details.syncStatus === 'success') return 'Sincronizado';
    if (details.syncStatus === 'error') return 'Error';
    return 'Listo';
  };

  // Si no hay detalles de sincronización, mostrar indicador de carga
  if (!syncDetails) {
    return (
      <button className='sync-control-button loading'>
        <span className='sync-icon'>⏳</span>
        <div className='button-tooltip'>Cargando...</div>
      </button>
    );
  }

  return (
    <>
      <AnimatePresence>
        {statusBubble && (
          <motion.div
            className='status-bubble'
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
          >
            <div className='status-bubble-content'>{statusBubble.message}</div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className='sync-button-container'>
        <button
          className={`sync-control-button ${syncDetails.syncStatus}`}
          onClick={handleClick}
          style={{ animation: 'subtle-pulse-green 2s infinite' }}
        >
          <span
            className='sync-icon'
            style={{
              animation: syncDetails.isSyncing
                ? 'spin 1s linear infinite'
                : 'none',
              color: getStatusColor(),
            }}
          >
            {getStatusIcon()}
          </span>
          <div className='button-tooltip'>Sincronizado</div>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              className='sync-details-panel'
              initial={{ opacity: 0, scale: 0.9, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className='sync-panel-header'>
                <h4>Estado de sincronización</h4>
                <span
                  className='sync-icon'
                  style={{
                    color:
                      syncDetails.syncStatus === 'synced'
                        ? '#34A853'
                        : '#FF5722',
                  }}
                >
                  {syncDetails.syncStatus === 'synced' ? '✓' : '⟳'}
                </span>
              </div>

              <div className='sync-details'>
                <p>
                  Última sincronización:{' '}
                  {syncDetails.lastSync
                    ? new Date(syncDetails.lastSync).toLocaleString()
                    : 'Nunca'}
                </p>
                <p>Estado: {getSyncStatusText(syncDetails)}</p>
                {syncDetails.syncStatus === 'error' && (
                  <p className='error-message'>
                    Error:{' '}
                    {syncDetails.errorMessage || 'Error de sincronización'}
                  </p>
                )}
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default SyncButton;
