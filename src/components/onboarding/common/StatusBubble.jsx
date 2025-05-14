import React, { useState, useEffect } from 'react';
import './StatusBubble.css';

/**
 * Componente StatusBubble - Muestra mensajes críticos como confirmaciones de guardado
 * @param {Object} props - Propiedades del componente
 * @param {string} props.message - Mensaje a mostrar
 */
const StatusBubble = ({ message }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');

  useEffect(() => {
    // Solo mostrar mensajes relacionados con guardado
    if (message && message.trim() !== '') {
      // Verificar si el mensaje es relacionado con guardado
      const isSaveMessage = (
        message.includes('guardado') || 
        message.includes('Guardando') || 
        message.includes('💾') // Emoji de disquete
      );

      if (isSaveMessage) {
        // Limpiar cualquier timer previo
        let timer;
        setCurrentMessage(message);
        setIsVisible(true);

        timer = setTimeout(() => {
          setIsVisible(false);
        }, 5000); // El mensaje desaparece después de 5 segundos

        return () => {
          clearTimeout(timer);
        };
      }
    } else {
      setIsVisible(false);
    }
  }, [message]);

  // No renderizar nada si no hay mensaje visible
  if (!isVisible) {
    return null;
  }

  return (
    <div className="status-bubble">
      <div className="status-bubble-content">
        {currentMessage}
      </div>
      <div className="status-bubble-arrow"></div>
    </div>
  );
};

export default StatusBubble;
