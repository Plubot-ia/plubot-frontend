/**
 * BackupManager Component
 *
 * Professional UI for managing flow backups with manual control.
 * Provides visibility and control over the backup system.
 */

import PropTypes from 'prop-types';
import React from 'react';

import { useBackupManager } from './BackupManagerLogic';
import { BackupManagerModal } from './BackupManagerModal';

import './BackupManager.css';

const BackupManager = ({ isOpen, onClose }) => {
  const {
    backups,
    selectedBackup,
    message,
    stats,
    setSelectedBackup,
    handleCreate,
    handleRestore,
    handleDelete,
    handleExport,
    handleImport,
  } = useBackupManager();

  if (!isOpen) return;

  return (
    <BackupManagerModal
      backups={backups}
      stats={stats}
      message={message}
      selectedBackup={selectedBackup}
      setSelectedBackup={setSelectedBackup}
      handleRestore={handleRestore}
      handleDelete={handleDelete}
      handleExport={handleExport}
      handleImport={handleImport}
      handleCreate={handleCreate}
      onClose={onClose}
    />
  );
};

BackupManager.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default BackupManager;
