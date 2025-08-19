/**
 * Business logic hooks for BackupManager
 */
import { useState, useCallback, useEffect } from 'react';

import useFlowStore from '@/stores/use-flow-store';

// Helper functions
export const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Main hook for backup management
export const useBackupManager = () => {
  const [backups, setBackups] = useState([]);
  const [selectedBackup, setSelectedBackup] = useState();
  const [message, setMessage] = useState(null);

  const { nodes, edges, setNodes, setEdges } = useFlowStore();

  // Load backups from localStorage
  const loadBackups = useCallback(() => {
    try {
      const stored = localStorage.getItem('flow_backups');
      if (stored) {
        const parsedBackups = JSON.parse(stored);
        setBackups(parsedBackups);
      } else {
        setBackups([]);
      }
    } catch (error) {
      console.error('Error loading backups:', error);
      setBackups([]);
    }
  }, []);

  useEffect(() => {
    loadBackups();
    
    // Listen for storage changes to update backups when saved from EpicHeader
    const handleStorageChange = (e) => {
      if (e.key === 'flow_backups') {
        loadBackups();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom event when backup is created in same tab
    const handleBackupCreated = () => {
      loadBackups();
    };
    
    window.addEventListener('backup-created', handleBackupCreated);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('backup-created', handleBackupCreated);
    };
  }, [loadBackups]);

  // Save backups to localStorage
  const saveBackups = useCallback((updatedBackups) => {
    localStorage.setItem('flow_backups', JSON.stringify(updatedBackups));
    setBackups(updatedBackups);
  }, []);

  // Create new backup
  const handleCreate = useCallback(() => {
    const newBackup = {
      id: Date.now().toString(),
      name: `Copia manual`,
      timestamp: Date.now(),
      type: 'manual',
      nodes: nodes || [],
      edges: edges || [],
      nodeCount: nodes?.length || 0,
      edgeCount: edges?.length || 0,
      size: JSON.stringify({ nodes, edges }).length,
      reason: 'Creado manualmente por el usuario'
    };

    const updatedBackups = [newBackup, ...backups].slice(0, 10); // Keep max 10 backups
    saveBackups(updatedBackups);
    setMessage({ type: 'success', text: 'Copia de seguridad creada exitosamente' });
    setTimeout(() => setMessage(null), 3000);
  }, [nodes, edges, backups, saveBackups]);

  // Restore backup
  const handleRestore = useCallback(
    (backup) => {
      if (globalThis.window?.confirm('¿Restaurar esta copia? Se perderán los cambios actuales.')) {
        setNodes(backup.nodes || []);
        setEdges(backup.edges || []);
        setMessage({ type: 'success', text: 'Copia restaurada exitosamente' });
        setTimeout(() => setMessage(null), 3000);
      }
    },
    [setNodes, setEdges],
  );

  // Delete backup
  const handleDelete = useCallback(
    (backupId) => {
      if (globalThis.window?.confirm('¿Eliminar esta copia de seguridad?')) {
        const updatedBackups = backups.filter((b) => b.id !== backupId);
        saveBackups(updatedBackups);
        setMessage({ type: 'success', text: 'Copia eliminada correctamente' });
        setTimeout(() => setMessage(null), 3000);
        if (selectedBackup?.id === backupId) {
          setSelectedBackup(undefined);
        }
      }
    },
    [backups, selectedBackup, saveBackups],
  );

  // Export backup
  const handleExport = useCallback(() => {
    if (!selectedBackup) return;

    const blob = new Blob([JSON.stringify(selectedBackup, undefined, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${selectedBackup.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage({ type: 'success', text: 'Copia exportada correctamente' });
    setTimeout(() => setMessage(null), 3000);
  }, [selectedBackup]);

  // Import backup
  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    const handleFileChange = async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const backup = JSON.parse(text);
        backup.id = Date.now().toString();
        backup.name = `Importado ${formatDate(Date.now())}`;
        const updatedBackups = [backup, ...backups].slice(0, 10);
        saveBackups(updatedBackups);
        setMessage({ type: 'success', text: 'Copia importada exitosamente' });
      } catch {
        setMessage({ type: 'error', text: 'Error al importar la copia' });
      }
      setTimeout(() => setMessage(null), 3000);
    };

    input.addEventListener('change', handleFileChange);
    input.click();
  }, [backups, saveBackups]);

  // Calculate stats
  const stats = {
    totalBackups: backups.length,
    totalSize: backups.reduce((accumulator, b) => accumulator + (b.size || 0), 0),
    lastBackup: backups[0]?.timestamp || null,
  };

  return {
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
  };
};
