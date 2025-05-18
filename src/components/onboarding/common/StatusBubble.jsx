import React, { useState, useEffect, useRef } from 'react';
import './StatusBubble.css';

/**
 * Componente StatusBubble - Muestra mensajes críticos como confirmaciones de guardado
 * @param {Object} props - Propiedades del componente
 * @param {string} props.message - Mensaje a mostrar
 */
const StatusBubble = ({ message }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const timerRef = useRef(null);
  const messageQueueRef = useRef([]);
  const processingRef = useRef(false);
  const AUTO_HIDE_DELAY = 5000; // 5 segundos para ocultar automáticamente

  // Función para cerrar manualmente el mensaje actual
  const closeMessage = () => {
    setIsVisible(false);
    
    // Esperar a que termine la animación de salida antes de procesar el siguiente mensaje
    setTimeout(() => {
      processMessageQueue();
    }, 500); // 500ms para la animación de salida
    
    // Limpiar el timer si existe
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // Función para procesar la cola de mensajes
  const processMessageQueue = () => {
    // Si la cola está vacía, marcar como no procesando y salir
    if (messageQueueRef.current.length === 0) {
      processingRef.current = false;
      return;
    }
    
    // Marcar como procesando y obtener el siguiente mensaje
    processingRef.current = true;
    const nextMessage = messageQueueRef.current.shift();
    
    // Actualizar el estado con el nuevo mensaje y hacerlo visible
    setCurrentMessage(nextMessage);
    setIsVisible(true);
    
    // Limpiar cualquier timer previo
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Configurar el timer para ocultar automáticamente
    timerRef.current = setTimeout(() => {
      closeMessage();
    }, AUTO_HIDE_DELAY);
  };

  // Función para determinar si un mensaje debe mostrarse en StatusBubble o ByteAssistant
  const shouldShowInStatusBubble = (msg) => {
    // Mensajes que deben mostrarse en StatusBubble (operaciones, confirmaciones, errores)
    const statusPatterns = [
      /\u2705/, // Marca de verificación (operación exitosa)
      /\u274C/, // Cruz roja (error)
      /\u26A0\uFE0F/, // Advertencia
      /guardado/i,
      /guardando/i,
      /error/i,
      /cargando/i,
      /generando/i,
      /completado/i,
      /actualizado/i,
      /eliminado/i,
      /creado/i,
      /¡listo!/i
    ];
    
    // Verificar si el mensaje coincide con alguno de los patrones de StatusBubble
    return statusPatterns.some(pattern => pattern.test(msg));
  };
  
  useEffect(() => {
    // No procesar mensajes vacíos
    if (!message || message.trim() === '') return;
    
    // Verificar si este mensaje debe mostrarse en StatusBubble
    if (!shouldShowInStatusBubble(message)) {
      // Si no debe mostrarse en StatusBubble, ignorarlo (se mostrará en ByteAssistant)
      return;
    }
    
    // Evitar mensajes duplicados o superpuestos
    // Si es un mensaje de bienvenida, limpiar la cola y mostrar solo este
    if (message.includes('Bienvenido') || message.includes('Hola') || message.includes('Editor listo')) {
      // Verificar si ya hay un mensaje similar en la cola
      const hasSimilarMessage = messageQueueRef.current.some(m => 
        m.includes('Bienvenido') || m.includes('Hola') || m.includes('Editor listo')
      );
      
      if (!hasSimilarMessage) {
        // Si no hay mensajes similares, limpiar la cola y agregar este
        messageQueueRef.current = [];
        messageQueueRef.current.push(message);
      } else {
        // Si ya hay un mensaje similar, no agregar este
        return;
      }
    } else {
      // Para otros mensajes, verificar si es un duplicado exacto o muy similar
      const isDuplicate = messageQueueRef.current.some(m => {
        // Verificar duplicados exactos
        if (m === message) return true;
        
        // Verificar mensajes muy similares (sin emojis o con pequeñas diferencias)
        const cleanMsg = message.replace(/[\u{1F300}-\u{1F6FF}\u{2700}-\u{27BF}\u{E000}-\u{F8FF}\u{2600}-\u{26FF}\u{2300}-\u{23FF}\u{2B50}\u{2B06}\u{2934}\u{2935}]/gu, '').trim();
        const cleanM = m.replace(/[\u{1F300}-\u{1F6FF}\u{2700}-\u{27BF}\u{E000}-\u{F8FF}\u{2600}-\u{26FF}\u{2300}-\u{23FF}\u{2B50}\u{2B06}\u{2934}\u{2935}]/gu, '').trim();
        
        return cleanMsg === cleanM;
      });
      
      if (!isDuplicate) {
        messageQueueRef.current.push(message);
      }
    }
    
    // Si no estamos procesando mensajes, iniciar el proceso
    if (!processingRef.current) {
      processMessageQueue();
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [message]);

  // No renderizar nada si no hay mensaje visible
  if (!isVisible) {
    return null;
  }

  return (
    <div className="status-bubble">
      <div className="status-bubble-content">
        {currentMessage}
        <button 
          className="status-bubble-close" 
          onClick={(e) => {
            e.stopPropagation(); // Evitar propagación del evento
            closeMessage();
          }}
          onMouseDown={(e) => e.stopPropagation()} // Evitar que el evento mousedown se propague
          aria-label="Cerrar mensaje"
          style={{ cursor: 'pointer !important', pointerEvents: 'auto !important' }}
        >
          ×
        </button>
      </div>
      <div className="status-bubble-arrow"></div>
    </div>
  );
};

export default StatusBubble;
