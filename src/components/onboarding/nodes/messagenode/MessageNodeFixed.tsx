/**
 * @file MessageNodeFixed.tsx
 * @description Versión corregida del componente MessageNode para el modo ultra rendimiento
 */

import React, { memo } from 'react';
import { MessageNodeIcon } from './MessageNode';
import './MessageNode.css';

// Interfaz para las propiedades del componente
interface MessageNodeFixedProps {
  type: string;
  message: string;
  isUltraPerformanceMode: boolean;
}

// Componente mejorado para el modo ultra rendimiento
const MessageNodeFixed = memo(({ 
  type, 
  message, 
  isUltraPerformanceMode 
}: MessageNodeFixedProps) => {
  // Función para obtener el texto en español según el tipo de mensaje
  const getTypeLabel = () => {
    switch (type) {
      case 'user': return 'Usuario';
      case 'bot': return 'Bot';
      case 'system': return 'Sistema';
      case 'error': return 'Error';
      case 'warning': return 'Advertencia';
      case 'info': return 'Información';
      case 'question': return 'Pregunta';
      default: return 'Sistema';
    }
  };

  // Truncar el mensaje de manera más inteligente
  const truncateMessage = (text: string, maxLength = 60) => {
    if (text.length <= maxLength) return text;
    
    // Buscar un espacio cercano al límite para cortar de forma más natural
    const breakPoint = text.lastIndexOf(' ', maxLength);
    const cutPoint = breakPoint > maxLength * 0.7 ? breakPoint : maxLength;
    
    return `${text.substring(0, cutPoint)}...`;
  };
  
  // Determinar si el mensaje está vacío o es el predeterminado
  const isEmptyOrDefault = !message || message === 'Escribe tu mensaje aquí...';
  
  // Obtener un resumen del contenido para mostrar
  const getContentSummary = () => {
    if (isEmptyOrDefault) {
      return <span className="message-node__ultra-empty">Mensaje vacío</span>;
    }
    return truncateMessage(message);
  };
  
  return (
    <div className="message-node__ultra-content">
      <div className="message-node__ultra-header">
        <MessageNodeIcon type={type} isUltraPerformanceMode={true} />
        <span className="message-node__ultra-title">
          {getTypeLabel()}
        </span>
      </div>
      <div className={`message-node__ultra-message ${isEmptyOrDefault ? 'message-node__ultra-message--empty' : ''}`}>
        {getContentSummary()}
      </div>
    </div>
  );
});

MessageNodeFixed.displayName = 'MessageNodeFixed';

export default MessageNodeFixed;
