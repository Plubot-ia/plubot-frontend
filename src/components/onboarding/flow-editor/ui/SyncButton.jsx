import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useEffect } from 'react';

import useSyncService, { getSyncState } from '@/services/syncService';
import './SyncButton.css';

// Funciones helper movidas fuera del componente para optimización
const getStatusColor = () => {
  return '#00FF66'; // Verde neón brillante
};

const getSyncStatusText = (details) => {
  if (details.isSyncing) return 'Sincronizando...';
  if (details.syncStatus === 'success') return 'Sincronizado';
  if (details.syncStatus === 'error') return 'Error';
  return 'Listo';
};

/**
 * Botón de sincronización para el editor de flujos
 * Muestra un indicador visual del estado de sincronización
 * y permite expandir detalles al hacer clic
 */
// Hook personalizado para la lógica de SyncButton
const useSyncButtonLogic = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [syncDetails, setSyncDetails] = useState();
  const [, setStatusBubble] = useState(); // StatusBubble removed - centralized in EpicHeader for performance

  const { syncAllPlubots } = useSyncService();

  useEffect(() => {
    setSyncDetails(getSyncState());
    const updateInterval = setInterval(() => {
      setSyncDetails(getSyncState());
    }, 1000);
    return () => clearInterval(updateInterval);
  }, []);

  const handleClick = () => {
    setIsExpanded(!isExpanded);
  };

  const handleSync = async (event) => {
    event.stopPropagation();
    setStatusBubble({
      type: 'syncing',
      message: '⏰ Sincronizando cambios...',
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
      setTimeout(() => setStatusBubble(undefined), 3000);
    }
  };

  const getStatusIcon = () => {
    if (!syncDetails) return '⏳';
    return '✓';
  };

  return {
    isExpanded,
    syncDetails,
    handleClick,
    handleSync,
    getStatusIcon,
  };
};

const SyncButton = () => {
  const { isExpanded, syncDetails, handleClick, handleSync, getStatusIcon } = useSyncButtonLogic();

  // Componente helper para estado de carga
  const LoadingButton = () => (
    <button className='sync-control-button loading'>
      <span className='sync-icon'>⏳</span>
      <div className='button-tooltip'>Cargando...</div>
    </button>
  );

  // Componente helper para botón principal
  const MainSyncButton = () => (
    <button
      className={`sync-control-button ${syncDetails.syncStatus}`}
      onClick={handleClick}
      style={{ animation: 'subtle-pulse-green 2s infinite' }}
    >
      <span
        className='sync-icon'
        style={{
          animation: syncDetails.isSyncing ? 'spin 1s linear infinite' : 'none',
          color: getStatusColor(),
        }}
      >
        {getStatusIcon()}
      </span>
      <div className='button-tooltip'>Sincronizado</div>
    </button>
  );

  // Si no hay detalles de sincronización, mostrar indicador de carga
  if (!syncDetails) {
    return <LoadingButton />;
  }

  // StatusBubble removed - now handled by EpicHeader

  // Componente helper para lista de errores
  const SyncErrorsList = () => (
    <div className='sync-errors'>
      <h4>Errores ({syncDetails.syncErrors.length}):</h4>
      <ul>
        {syncDetails.syncErrors.slice(0, 3).map((error, index) => {
          // eslint-disable-next-line react/no-array-index-key
          return <li key={`${error}-${index}`}>{error}</li>;
        })}
        {syncDetails.syncErrors.length > 3 && <li>...y {syncDetails.syncErrors.length - 3} más</li>}
      </ul>
    </div>
  );

  // Componente helper para panel de detalles expandido
  const SyncDetailsPanel = () => (
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
            color: syncDetails.syncStatus === 'synced' ? '#34A853' : '#FF5722',
          }}
        >
          {syncDetails.syncStatus === 'synced' ? '✓' : '⟳'}
        </span>
      </div>

      <div className='sync-details'>
        <p>
          Última sincronización:{' '}
          {syncDetails.lastSync ? new Date(syncDetails.lastSync).toLocaleString() : 'Nunca'}
        </p>
        <p>Estado: {getSyncStatusText(syncDetails)}</p>
        {syncDetails.syncStatus === 'error' && (
          <p className='error-message'>
            Error: {syncDetails.errorMessage || 'Error de sincronización'}
          </p>
        )}
      </div>

      {syncDetails.syncErrors.length > 0 && <SyncErrorsList />}

      <div className='sync-controls'>
        <button className='sync-now-btn' onClick={handleSync} disabled={syncDetails.isSyncing}>
          {syncDetails.isSyncing ? 'Sincronizando...' : 'Sincronizar ahora'}
        </button>
      </div>
    </motion.div>
  );

  return (
    <>
      {/* StatusBubble removed - centralized in EpicHeader */}
      <div className='sync-button-container'>
        <MainSyncButton />
        <AnimatePresence>{isExpanded && <SyncDetailsPanel />}</AnimatePresence>
      </div>
    </>
  );
};

export default SyncButton;
