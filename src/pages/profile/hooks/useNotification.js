import { useState, useCallback } from 'react';

/**
 * Hook personalizado para gestionar notificaciones
 * @returns {Object} - Objeto con el estado de notificación y funciones para gestionarlo
 */
const useNotification = () => {
  const [notification, setNotification] = useState();

  /**
   * Muestra una notificación con tiempo de expiración automático
   * @param {string} message - Mensaje a mostrar
   * @param {string} type - Tipo de notificación ('success', 'error', 'info', 'warning')
   * @param {number} [timeout=3000] - Tiempo en ms antes de que desaparezca la notificación
   */
  const showNotification = useCallback((message, type, timeout = 3000) => {
    setNotification({ message, type });

    // Limpiar notificación después del tiempo especificado
    const timer = setTimeout(() => {
      setNotification(undefined);
    }, timeout);

    // Limpiar el temporizador si el componente se desmonta
    return () => clearTimeout(timer);
  }, []);

  return {
    notification,
    setNotification,
    showNotification,
  };
};

export default useNotification;
