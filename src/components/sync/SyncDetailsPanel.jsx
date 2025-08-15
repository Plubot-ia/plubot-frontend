import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import React from 'react';

// Helper para obtener el texto del estado de sincronización
const getSyncStatusText = (details) => {
  if (details.isSyncing) return 'Sincronizando...';
  if (details.syncStatus === 'success') return 'Sincronizado';
  if (details.syncStatus === 'error') return 'Error de sincronización';
  return 'Listo para sincronizar';
};

const SyncDetailsPanel = ({ syncDetails, handleSync }) => (
  <motion.div
    className='sync-details-panel'
    initial={{ opacity: 0, scale: 0.9, y: -10 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.9, y: -10 }}
    transition={{ duration: 0.2 }}
  >
    <div className='sync-panel-header'>
      <h4>Estado de sincronización</h4>
      <span className='sync-status'>{getSyncStatusText(syncDetails)}</span>
    </div>

    <div className='sync-detail-item'>
      <span>Última sincronización:</span>
      <span>{syncDetails.lastSyncFormatted}</span>
    </div>

    {syncDetails.syncErrors.length > 0 && (
      <div className='sync-errors'>
        <h4>Errores ({syncDetails.syncErrors.length}):</h4>
        <ul>
          {syncDetails.syncErrors.slice(0, 3).map((error, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <li key={`${error.slice(0, 10)}-${index}`}>{error}</li>
          ))}
          {syncDetails.syncErrors.length > 3 && (
            <li>...y {syncDetails.syncErrors.length - 3} más</li>
          )}
        </ul>
      </div>
    )}

    <div className='sync-controls'>
      <button className='sync-now-btn' onClick={handleSync} disabled={syncDetails.isSyncing}>
        {syncDetails.isSyncing ? 'Sincronizando...' : 'Sincronizar ahora'}
      </button>
    </div>
  </motion.div>
);

SyncDetailsPanel.propTypes = {
  syncDetails: PropTypes.shape({
    isSyncing: PropTypes.bool,
    syncStatus: PropTypes.string,
    lastSyncFormatted: PropTypes.string,
    syncErrors: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  handleSync: PropTypes.func.isRequired,
};

export default SyncDetailsPanel;
