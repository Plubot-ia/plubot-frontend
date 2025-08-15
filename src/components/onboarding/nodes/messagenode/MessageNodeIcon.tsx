/**
 * @file MessageNodeIcon.tsx
 * @description Componente de ícono modularizado para nodos de mensaje.
 * @author PLUBOT Team
 * @version 1.0.0
 */

import {
  MessageSquare,
  User,
  Bot,
  AlertTriangle,
  AlertCircle,
  Info,
  HelpCircle,
  Settings,
} from 'lucide-react';
import React, { memo } from 'react';

// Constantes
/* eslint-disable react-refresh/only-export-components */
export const MESSAGE_TYPES = {
  USER: 'user', // Mensaje del usuario
  BOT: 'bot', // Respuesta del bot
  SYSTEM: 'system', // Mensaje de sistema
  ERROR: 'error', // Mensaje de error
  WARNING: 'warning', // Advertencia
  INFO: 'info', // Información
  QUESTION: 'question', // Pregunta
} as const;

export type MessageType = (typeof MESSAGE_TYPES)[keyof typeof MESSAGE_TYPES];

interface MessageNodeIconProps {
  type?: MessageType;
  isUltraPerformanceMode?: boolean;
}

/**
 * Componente para el ícono del nodo de mensaje
 */
export const MessageNodeIcon = memo<MessageNodeIconProps>(
  ({ type, isUltraPerformanceMode = false }) => {
    // Tamaño y grosor optimizados para legibilidad
    const iconProperties = {
      size: 16,
      strokeWidth: 2,
      // En modo ultra rendimiento, desactivamos animaciones
      className: isUltraPerformanceMode ? '' : 'message-node__icon-svg',
    };

    /**
     * Devuelve el ícono correspondiente al tipo de mensaje
     */
    const getIcon = () => {
      switch (type) {
        case MESSAGE_TYPES.USER: {
          return <User {...iconProperties} aria-hidden='true' />;
        }
        case MESSAGE_TYPES.BOT: {
          return <Bot {...iconProperties} aria-hidden='true' />;
        }
        case MESSAGE_TYPES.ERROR: {
          return <AlertCircle {...iconProperties} aria-hidden='true' />;
        }
        case MESSAGE_TYPES.WARNING: {
          return <AlertTriangle {...iconProperties} aria-hidden='true' />;
        }
        case MESSAGE_TYPES.INFO: {
          return <Info {...iconProperties} aria-hidden='true' />;
        }
        case MESSAGE_TYPES.QUESTION: {
          return <HelpCircle {...iconProperties} aria-hidden='true' />;
        }
        case MESSAGE_TYPES.SYSTEM: {
          return <Settings {...iconProperties} aria-hidden='true' />;
        }
        case undefined: {
          return <MessageSquare {...iconProperties} aria-hidden='true' />;
        }
        default: {
          return <MessageSquare {...iconProperties} aria-hidden='true' />;
        }
      }
    };

    return (
      <div
        className={`message-node__icon message-node__icon--${type ?? 'system'}`}
        aria-hidden='true'
      >
        {getIcon()}
      </div>
    );
  },
);

MessageNodeIcon.displayName = 'MessageNodeIcon';
