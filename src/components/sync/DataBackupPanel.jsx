import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import React, { useState, useRef } from 'react';

import { exportAllPlubots, importPlubots } from '../../services/exportImportService';
import useSyncService from '../../services/syncService';
import useAuthStore from '../../stores/use-auth-store';

import './DataBackupPanel.css';

// Hook personalizado para manejar la lógica de exportación e importación
const useBackupHandlers = ({ setIsLoading, setStatus, syncAllPlubots }) => {
  const handleExportAll = async () => {
    setIsLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const result = await exportAllPlubots();
      setStatus({
        type: result.success ? 'success' : 'error',
        message: result.message || 'Ocurrió un error',
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message ?? 'Error inesperado al exportar',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async (event) => {
    const input = event.target;
    const { files } = input;
    if (!files || files.length === 0) {
      setStatus({ type: 'error', message: 'Por favor, selecciona un archivo' });
      return;
    }

    const [file] = files;
    setIsLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const result = await importPlubots(file);
      setStatus({
        type: result.success ? 'success' : 'error',
        message: result.message || 'Ocurrió un error',
      });

      if (result.success) {
        setTimeout(syncAllPlubots, 1000);
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message ?? 'Error inesperado al importar',
      });
    } finally {
      setIsLoading(false);

      input.value = '';
    }
  };

  return { handleExportAll, handleImport };
};
const ExportCard = ({ onExport, isLoading, user }) => (
  <div className='action-card export-card'>
    <h3>Exportar Plubots</h3>
    <p>Descarga todos tus plubots como archivo JSON para guardarlos de forma segura.</p>
    <button
      className='action-button export-button'
      onClick={onExport}
      disabled={isLoading || !user || !user.plubots || user.plubots.length === 0}
    >
      {isLoading ? 'Exportando...' : 'Exportar todos los plubots'}
    </button>

    {user && user.plubots && user.plubots.length > 0 && (
      <div className='plubot-count'>
        {user.plubots.length}{' '}
        {user.plubots.length === 1 ? 'plubot disponible' : 'plubots disponibles'}
      </div>
    )}
  </div>
);

ExportCard.propTypes = {
  onExport: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
  user: PropTypes.shape({
    plubots: PropTypes.arrayOf(PropTypes.object),
  }),
};

const ImportCard = ({ onImportClick, onFileSelected, isLoading, fileInputRef }) => (
  <div className='action-card import-card'>
    <h3>Importar Plubots</h3>
    <p>Restaura plubots desde un archivo JSON previamente exportado.</p>
    <input
      type='file'
      ref={fileInputRef}
      onChange={onFileSelected}
      accept='.json,application/json'
      style={{ display: 'none' }}
    />
    <button className='action-button import-button' onClick={onImportClick} disabled={isLoading}>
      {isLoading ? 'Importando...' : 'Importar desde archivo'}
    </button>
  </div>
);

ImportCard.propTypes = {
  onImportClick: PropTypes.func.isRequired,
  onFileSelected: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
  fileInputRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
  ]).isRequired,
};

const StatusMessage = ({ status }) => {
  if (!status.message) {
    // eslint-disable-next-line unicorn/no-null
    return null;
  }

  return (
    <motion.div
      className={`status-message ${status.type}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {status.message}
    </motion.div>
  );
};

StatusMessage.propTypes = {
  status: PropTypes.shape({
    type: PropTypes.string,
    message: PropTypes.string,
  }).isRequired,
};

const BackupTips = () => (
  <div className='backup-tips'>
    <h4>Consejos de respaldo</h4>
    <ul>
      <li>Exporta regularmente tus plubots para tener respaldos actualizados.</li>
      <li>Guarda los archivos de respaldo en múltiples ubicaciones (nube, disco externo, etc.).</li>
      <li>Los respaldos incluyen toda la configuración y estructura de tus plubots.</li>
      <li>
        Al importar plubots existentes, puedes elegir sobrescribir o mantener ambas versiones.
      </li>
    </ul>
  </div>
);

/**
 * Componente que permite a los usuarios exportar e importar sus plubots
 * como respaldo adicional
 */
const DataBackupPanel = () => {
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const fileInputReference = useRef(null);
  const { user } = useAuthStore();
  const { syncAllPlubots } = useSyncService();

  const { handleExportAll, handleImport } = useBackupHandlers({
    setIsLoading,
    setStatus,
    syncAllPlubots,
  });

  const handleImportClick = () => {
    fileInputReference.current.click();
  };

  return (
    <div className='data-backup-panel'>
      <h2>Respaldo de Datos</h2>
      <p className='panel-description'>
        Exporta tus plubots como archivo JSON para tener un respaldo adicional o importa plubots
        previamente exportados.
      </p>

      <div className='backup-actions'>
        <ExportCard onExport={handleExportAll} isLoading={isLoading} user={user} />
        <ImportCard
          onImportClick={handleImportClick}
          onFileSelected={handleImport}
          isLoading={isLoading}
          fileInputRef={fileInputReference}
        />
      </div>

      <StatusMessage status={status} />
      <BackupTips />
    </div>
  );
};

export default DataBackupPanel;
