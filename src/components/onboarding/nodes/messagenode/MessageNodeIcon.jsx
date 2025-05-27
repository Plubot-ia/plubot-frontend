/**
 * @file MessageNodeIcon.jsx
 * @description Componente que renderiza el ícono correspondiente al tipo de mensaje.
 * @author PLUBOT Team
 * @version 3.0.0
 */

import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { 
  MessageSquare, 
  User, 
  Bot, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  HelpCircle
} from 'lucide-react';

// Constantes
export const MESSAGE_TYPES = {
  USER: 'user',      // Mensaje del usuario
  BOT: 'bot',       // Respuesta del bot
  SYSTEM: 'system', // Mensaje de sistema
  ERROR: 'error',   // Mensaje de error
  WARNING: 'warning', // Advertencia
  INFO: 'info',     // Información
  QUESTION: 'question' // Pregunta
};

/**
 * Componente para el ícono del nodo de mensaje
 */
const MessageNodeIcon = memo(({ type, isUltraPerformanceMode = false }) => {
  // Tamaño y grosor optimizados para legibilidad
  const iconProps = { 
    size: 16, 
    strokeWidth: 2,
    // En modo ultra rendimiento, desactivamos animaciones
    className: isUltraPerformanceMode ? '' : 'message-node__icon-svg'
  };
  
  /**
   * Devuelve el ícono correspondiente al tipo de mensaje
   */
  const getIcon = () => {
    switch (type) {
      case MESSAGE_TYPES.USER:
        return <User {...iconProps} aria-hidden="true" />;
      case MESSAGE_TYPES.BOT:
        return <Bot {...iconProps} aria-hidden="true" />;
      case MESSAGE_TYPES.ERROR:
        return <AlertCircle {...iconProps} aria-hidden="true" />;
      case MESSAGE_TYPES.WARNING:
        return <AlertTriangle {...iconProps} aria-hidden="true" />;
      case MESSAGE_TYPES.INFO:
        return <Info {...iconProps} aria-hidden="true" />;
      case MESSAGE_TYPES.QUESTION:
        return <HelpCircle {...iconProps} aria-hidden="true" />;
      case MESSAGE_TYPES.SYSTEM:
      default:
        return <MessageSquare {...iconProps} aria-hidden="true" />;
    }
  };

  return (
    <div 
      className={`message-node__icon message-node__icon--${type || 'system'}`}
      aria-hidden="true"
    >
      {getIcon()}
    </div>
  );
});

MessageNodeIcon.displayName = 'MessageNodeIcon';

MessageNodeIcon.propTypes = {
  type: PropTypes.oneOf(Object.values(MESSAGE_TYPES)),
  isUltraPerformanceMode: PropTypes.bool
};

export default MessageNodeIcon;
