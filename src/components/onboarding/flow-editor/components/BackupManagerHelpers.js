/**
 * Helper functions for BackupManager component
 * Extracted to reduce component complexity
 */

export const formatBackupSize = (sizeInBytes) => {
  if (sizeInBytes < 1024) return `${sizeInBytes} B`;
  if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(2)} KB`;
  return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const formatBackupDate = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString();
};

export const getBackupTypeIcon = (type) => {
  switch (type) {
    case 'auto': {
      return '🔄';
    }
    case 'manual': {
      return '💾';
    }
    case 'checkpoint': {
      return '📍';
    }
    default: {
      return '📦';
    }
  }
};

export const getBackupTypeLabel = (type) => {
  switch (type) {
    case 'auto': {
      return 'Auto-save';
    }
    case 'manual': {
      return 'Manual';
    }
    case 'checkpoint': {
      return 'Checkpoint';
    }
    default: {
      return 'Backup';
    }
  }
};
