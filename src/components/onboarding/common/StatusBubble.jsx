import PropTypes from 'prop-types';
import { useState, useEffect, useRef, useCallback } from 'react';
import './StatusBubble.css';

/**
 * Componente StatusBubble - Muestra una notificación de estado temporal.
 * Lógica simplificada para manejar una sola notificación a la vez con cierre manual y automático.
 * @param {object} notification - Objeto que contiene el texto y un ID único para forzar re-render.
 */
const StatusBubble = ({ notification }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState('');
  const hideTimer = useRef(null);

  const AUTO_HIDE_DELAY = 5000; // 5 segundos

  // Función para ocultar la burbuja, ya sea manual o automáticamente
  const hideBubble = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = undefined;
    }
    setIsVisible(false);
  }, []);

  useEffect(() => {
    // Si llega una nueva notificación con texto, la procesamos.
    if (notification && notification.text) {
      // Limpiamos cualquier temporizador anterior para evitar cierres prematuros.
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }

      // Mostramos la nueva notificación.
      setMessage(notification.text);
      setIsVisible(true);

      // Configuramos un nuevo temporizador para ocultarla automáticamente.
      hideTimer.current = setTimeout(() => {
        hideBubble();
      }, AUTO_HIDE_DELAY);
    }

    // Cleanup: Asegurarse de limpiar el temporizador si el componente se desmonta.
    return () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
    };
  }, [notification, hideBubble]); // Dependemos de la notificación y la función de ocultar.

  // Si no es visible, no renderizamos nada.
  if (!isVisible) {
    return;
  }

  return (
    <div className='status-bubble'>
      <div className='status-bubble-content'>
        {message}
        <button
          className='status-bubble-close'
          onClick={hideBubble} // El botón de cierre ahora llama directamente a hideBubble.
          aria-label='Cerrar mensaje'
        >
          ×
        </button>
      </div>
      <div className='status-bubble-arrow' />
    </div>
  );
};

StatusBubble.propTypes = {
  notification: PropTypes.shape({
    text: PropTypes.string.isRequired,
  }),
};

export default StatusBubble;
