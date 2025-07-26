import { useCallback } from 'react';

export const useNodeStatus = (status) => {
  const getStatusClass = useCallback(() => {
    switch (status) {
      case 'success': {
        return 'node-status-success';
      }
      case 'warning': {
        return 'node-status-warning';
      }
      case 'error': {
        return 'node-status-error';
      }
      case 'processing': {
        return 'node-status-processing';
      }
      case 'inactive': {
        return 'node-status-inactive';
      }
      default: {
        return '';
      }
    }
  }, [status]);

  return { getStatusClass };
};
