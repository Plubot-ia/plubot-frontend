import { AnimatePresence } from 'framer-motion';
import React from 'react';

import useSyncButton from '../../hooks/useSyncButton';

import '../onboarding/flow-editor/ui/SyncButton.css';
import SyncDetailsPanel from './SyncDetailsPanel';

// Helpers para determinar el estilo visual del botón
const getStatusColor = (status) => {
  const colors = {
    syncing: 'var(--color-blue)',
    success: 'var(--color-green)',
    error: 'var(--color-red)',
  };
  // eslint-disable-next-line security/detect-object-injection
  return colors[status] || 'var(--color-gray)';
};

const getStatusIcon = (status) => {
  const icons = {
    syncing: '↻',
    success: '✅',
    error: '⚠',
  };
  // eslint-disable-next-line security/detect-object-injection
  return icons[status] || 'ℹ';
};

/**
 * Botón de sincronización que muestra el estado y permite acciones.
 * La lógica se maneja a través del hook `useSyncButton`.
 * El panel de detalles se renderiza en `SyncDetailsPanel`.
 */
const SyncButton = () => {
  const { isExpanded, syncDetails, handleClick, handleSync } = useSyncButton();

  // Estado de carga mientras se obtienen los detalles iniciales
  if (!syncDetails) {
    return (
      <button type='button' className='sync-button loading' disabled>
        <span className='sync-icon'>⏳</span>
      </button>
    );
  }

  const { syncStatus, isSyncing } = syncDetails;
  const icon = getStatusIcon(syncStatus);
  const color = getStatusColor(syncStatus);
  const animation = isSyncing ? 'spin 1s linear infinite' : 'none';

  return (
    <div className='sync-button-container'>
      <button
        type='button'
        className={`sync-button ${syncStatus}`}
        onClick={handleClick}
        title='Estado de sincronización'
        style={{ '--status-color': color }}
      >
        <span className='sync-icon' style={{ animation }}>
          {icon}
        </span>
      </button>

      <AnimatePresence>
        {isExpanded && <SyncDetailsPanel syncDetails={syncDetails} handleSync={handleSync} />}
      </AnimatePresence>
    </div>
  );
};

export default SyncButton;
