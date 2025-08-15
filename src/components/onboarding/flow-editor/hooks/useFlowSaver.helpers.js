import { useCallback, useState, useEffect } from 'react';

/**
 * Hook para manejar el estado de guardado (status, message, show)
 */
export const useSaveStatus = () => {
  const [status, setStatus] = useState('idle'); // idle, saving, success, error
  const [message, setMessage] = useState('');
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (status === 'success' || status === 'error') {
      const timer = setTimeout(() => {
        setShow(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  return {
    status,
    setStatus,
    message,
    setMessage,
    show,
    setShow,
  };
};

/**
 * Hook para manejar handlers de guardado y errores
 */
export const useSaveHandlers = ({
  setStatus,
  setMessage,
  setShow,
  nodes,
  edges,
  createBackup,
  handleError,
  setHasChanges,
}) => {
  const handleSaveError = useCallback(
    (error, preparedEdges) => {
      const errorMessage =
        (error instanceof Error ? error.message : error?.message) || 'Error desconocido al guardar';
      setStatus('error');
      setMessage(errorMessage);
      setShow(true);
      createBackup(nodes, preparedEdges || edges);
      if (error instanceof Error && handleError) {
        handleError(error);
      }
    },
    [nodes, edges, createBackup, handleError, setStatus, setMessage, setShow],
  );

  const handleSaveSuccess = useCallback(() => {
    if (setHasChanges) {
      setHasChanges(false);
    }
    setStatus('success');
    setMessage('Cambios guardados correctamente');
    setShow(true);
  }, [setHasChanges, setStatus, setMessage, setShow]);

  return {
    handleSaveError,
    handleSaveSuccess,
  };
};
