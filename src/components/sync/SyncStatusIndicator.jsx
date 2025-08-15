import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';

import useSyncService, { getSyncState } from '../../services/syncService';
import './SyncStatusIndicator.css';

// Hook para manejar la lógica de los detalles de sincronización
const useSyncDetails = () => {
  const [syncDetails, setSyncDetails] = useState(getSyncState());

  useEffect(() => {
    const updateInterval = setInterval(() => setSyncDetails(getSyncState()), 1000);
    return () => clearInterval(updateInterval);
  }, []);

  return syncDetails;
};

const getStatusText = (details) => {
  if (details.isSyncing) return 'Sincronizando...';
  if (details.syncStatus === 'success') return 'Sincronizado';
  if (details.syncStatus === 'error') return 'Error de sincronización';
  return 'Listo para sincronizar';
};

const getStatusColor = (syncStatus) => {
  const colors = {
    syncing: 'var(--color-blue)',
    success: 'var(--color-green)',
    error: 'var(--color-red)',
  };
  // eslint-disable-next-line security/detect-object-injection
  return colors[syncStatus] ?? 'var(--color-gray)';
};

const SyncIcon = ({ syncStatus, isSyncing }) => {
  const icons = { syncing: '↻', success: '✅', error: '⚠' };
  // eslint-disable-next-line security/detect-object-injection
  const icon = icons[syncStatus] ?? 'ℹ';
  const animation = isSyncing ? 'spin 1s linear infinite' : 'none';

  return (
    <span className='sync-icon' style={{ animation }}>
      {icon}
    </span>
  );
};

SyncIcon.propTypes = {
  syncStatus: PropTypes.string,
  isSyncing: PropTypes.bool,
};
SyncIcon.defaultProps = { syncStatus: 'idle', isSyncing: false };

const SyncErrors = ({ errors }) => (
  <div className='sync-errors'>
    <h4>Errores ({errors.length}):</h4>
    <ul>
      {errors.slice(0, 3).map((error, index) => (
        // Usar el índice es seguro aquí porque la lista es estática y no se reordena.
        // Se combina con el error para mayor unicidad.
        // eslint-disable-next-line react/no-array-index-key
        <li key={`${error.slice(0, 10)}-${index}`}>{error}</li>
      ))}
      {errors.length > 3 && <li>...y {errors.length - 3} más</li>}
    </ul>
  </div>
);

SyncErrors.propTypes = {
  errors: PropTypes.arrayOf(PropTypes.string).isRequired,
};

const SyncControls = ({ onSync, isSyncing }) => (
  <div className='sync-controls'>
    <button type='button' className='sync-now-btn' onClick={onSync} disabled={isSyncing}>
      {isSyncing ? 'Sincronizando...' : 'Sincronizar ahora'}
    </button>
  </div>
);

SyncControls.propTypes = {
  onSync: PropTypes.func.isRequired,
  isSyncing: PropTypes.bool.isRequired,
};

const SyncDetailsView = ({ details, showControls, onSync }) => (
  <motion.div
    className='sync-details'
    initial={{ opacity: 0, height: 0 }}
    animate={{ opacity: 1, height: 'auto' }}
    exit={{ opacity: 0, height: 0 }}
    transition={{ duration: 0.3 }}
  >
    <div className='sync-detail-item'>
      <span>Última sincronización:</span>
      <span>{details.lastSyncFormatted}</span>
    </div>
    {details.syncErrors.length > 0 && <SyncErrors errors={details.syncErrors} />}
    {showControls && <SyncControls onSync={onSync} isSyncing={details.isSyncing} />}
  </motion.div>
);

SyncDetailsView.propTypes = {
  details: PropTypes.object.isRequired,
  showControls: PropTypes.bool.isRequired,
  onSync: PropTypes.func.isRequired,
};

const SyncStatusIndicator = ({ expanded = false, showControls = true }) => {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const syncDetails = useSyncDetails();
  const { syncAllPlubots } = useSyncService();

  const handleSync = (event) => {
    event.stopPropagation();
    syncAllPlubots();
  };

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
      onClick={() => showControls && setIsExpanded(!isExpanded)}
      style={{ '--status-color': getStatusColor(syncDetails.syncStatus) }}
    >
      <div className='sync-indicator-basic'>
        <SyncIcon syncStatus={syncDetails.syncStatus} isSyncing={syncDetails.isSyncing} />
        <span className='sync-status-text'>{getStatusText(syncDetails)}</span>
      </div>
      <AnimatePresence>
        {isExpanded && (
          <SyncDetailsView details={syncDetails} showControls={showControls} onSync={handleSync} />
        )}
      </AnimatePresence>
    </button>
  );
};

SyncStatusIndicator.propTypes = {
  expanded: PropTypes.bool,
  showControls: PropTypes.bool,
};

export default SyncStatusIndicator;
