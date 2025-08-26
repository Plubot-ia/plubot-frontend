import { useState, useEffect, useRef, useCallback, memo } from 'react';

import useByteMessageContext from '@/hooks/useByteMessageContext';
import './StatusBubble.css';

/**
 * Componente StatusBubble - Muestra una notificación de estado temporal.
 * Usa el contexto global de ByteMessage para evitar re-renders innecesarios.
 */
const StatusBubble = memo(() => {
  const { byteMessage, byteMessageType } = useByteMessageContext();
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
    // Si llega un nuevo mensaje del contexto, lo procesamos.
    if (byteMessage) {
      const currentTime = Date.now();

      // Evitar mensajes duplicados en un corto período de tiempo
      if (
        byteMessage === lastMessageRef.current &&
        currentTime - lastMessageTimeRef.current < DUPLICATE_MESSAGE_THRESHOLD
      ) {
        return; // Ignorar mensaje duplicado
      }

      // Actualizar referencias
      lastMessageRef.current = byteMessage;
      lastMessageTimeRef.current = currentTime;

      // Limpiamos cualquier temporizador anterior para evitar cierres prematuros.
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }

      // Mostramos la nueva notificación.
      setMessage(byteMessage);
      setMessageType(byteMessageType || 'info');
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
  }, [byteMessage, byteMessageType, hideBubble]); // Dependemos del mensaje del contexto.

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
});

StatusBubble.displayName = 'StatusBubble';

export default StatusBubble;
