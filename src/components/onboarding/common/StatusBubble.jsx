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
  const [messageType, setMessageType] = useState('info');
  const hideTimer = useRef(null);
  const lastMessageRef = useRef('');
  const lastMessageTimeRef = useRef(0);

  const AUTO_HIDE_DELAY = 5000; // 5 segundos
  const DUPLICATE_MESSAGE_THRESHOLD = 1000; // 1 segundo

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
      const currentTime = Date.now();
      
      // Evitar mensajes duplicados en un corto período de tiempo
      if (
        notification.text === lastMessageRef.current &&
        currentTime - lastMessageTimeRef.current < DUPLICATE_MESSAGE_THRESHOLD
      ) {
        return; // Ignorar mensaje duplicado
      }

      // Actualizar referencias
      lastMessageRef.current = notification.text;
      lastMessageTimeRef.current = currentTime;

      // Limpiamos cualquier temporizador anterior para evitar cierres prematuros.
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }

      // Mostramos la nueva notificación.
      setMessage(notification.text);
      setMessageType(notification.type || 'info');
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
    <div className={`status-bubble status-bubble--${messageType}`}>
      <div className='status-bubble-content'>
        <span className='status-bubble-icon'>
          {messageType === 'success' && '✓'}
          {messageType === 'error' && '✕'}
          {messageType === 'info' && 'ℹ'}
          {messageType === 'warning' && '⚠'}
        </span>
        <span className='status-bubble-text'>{message}</span>
        <button className='status-bubble-close' onClick={hideBubble} aria-label='Cerrar mensaje'>
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
    type: PropTypes.oneOf(['success', 'error', 'info', 'warning']),
  }),
};

export default StatusBubble;
