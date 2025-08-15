/**
 * @file MessageNode.tsx
 * @description Componente optimizado para representar nodos de mensaje en el editor de flujos PLUBOT.
 * Implementa diseño profesional, accesibilidad y optimización para modo normal y ultra rendimiento.
 * @author PLUBOT Team
 * @version 2.0.0
 */

import { Maximize2, Minimize2 } from 'lucide-react';
import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import { Position } from 'reactflow';

import ReactMarkdown from '@/lib/simplified-markdown';
import { replaceVariablesInMessage } from '@/utils/message-utilities.js';

import './MessageNode.css';
import './MessageNodeLOD.css';

// Configuración centralizada para el MessageNode
const NODE_CONFIG = {
  TYPE: 'message', // O podría ser dinámico basado en data.messageType
  DEFAULT_MESSAGE_PLACEHOLDER: 'Escribe tu mensaje aquí...',
  DEFAULT_TITLE_PREFIX: 'Mensaje',
  TRANSITION_DURATION: 300, // ms, igual que en CSS
  ANIMATION_DURATION: 500, // ms, igual que en CSS
  MAX_PREVIEW_LINES: 2,
  COLORS: {
    // Estos se mapearán/refinarán con las variables CSS
    // Ejemplo:
    // USER_PRIMARY: 'rgb(var(--message-node-bg-user-color-rgb))',
    // BOT_PRIMARY: 'rgb(var(--message-node-bg-bot-color-rgb))',
    TEXT_PRIMARY: 'var(--message-node-text)',
    BORDER_SELECTED: 'var(--message-node-border-selected)',
  },
  DIMENSIONS: {
    MIN_WIDTH: '200px', // Desde CSS
    MAX_WIDTH: '320px', // Desde CSS
    MIN_HEIGHT: '100px', // Desde CSS
    BORDER_RADIUS: '12px', // Desde CSS
    PADDING: '1rem', // Desde CSS
  },
  HANDLES: {
    INPUT_TYPE: 'target',
    OUTPUT_TYPE: 'source',
    DEFAULT_POSITION: Position.Top, // O Position.Left/Right si cambia el diseño
  },
} as const;

// Constantes y configuración (Mantenemos las específicas si NODE_CONFIG no las cubre todas aún)
const placeholder = NODE_CONFIG.DEFAULT_MESSAGE_PLACEHOLDER;
const { MAX_PREVIEW_LINES } = NODE_CONFIG;

interface Variable {
  name: string;
  value?: string;
  id?: number;
}

/**
 * Componente para la vista previa del mensaje con soporte para Markdown y truncado inteligente
 * @param {Object} props - Propiedades del componente
 * @param {string} props.message - Contenido del mensaje
 * @param {Array} props.variables - Variables para reemplazar en el mensaje
 * @param {boolean} props.isUltraPerformanceMode - Indica si está en modo ultra rendimiento
 * @returns {JSX.Element} - Vista previa del mensaje formateada
 */
const MessagePreview = memo<{
  message?: string;
  variables?: Variable[];
  isUltraPerformanceMode?: boolean;
}>(({ message = '', variables = [], isUltraPerformanceMode = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const messageReference = useRef<HTMLDivElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  // Formatear mensaje con variables
  const formattedMessage = useMemo(() => {
    return replaceVariablesInMessage(message, variables);
  }, [message, variables]);

  // Detectar si el mensaje necesita ser truncado
  useEffect(() => {
    if (messageReference.current && !isUltraPerformanceMode) {
      const element = messageReference.current;
      const lineHeight = parseInt(window.getComputedStyle(element).lineHeight, 10);
      const maxHeight = lineHeight * MAX_PREVIEW_LINES;
      setIsTruncated(element.scrollHeight > maxHeight);
    }
  }, [formattedMessage, isUltraPerformanceMode]);

  // Alternar entre vista completa y truncada
  const toggleExpand = useCallback(() => {
    setIsExpanded((previous) => !previous);
  }, []);

  // Clases para el contenedor del mensaje
  const messageClasses = useMemo(() => {
    const classes = ['message-node__message'];

    if (!isExpanded && !isUltraPerformanceMode) {
      classes.push('message-node__message--truncated');
    }

    if (isUltraPerformanceMode) {
      classes.push('message-node__message--ultra');
    }

    return classes.join(' ');
  }, [isExpanded, isUltraPerformanceMode]);

  return (
    <div className='message-node__message-container'>
      <div ref={messageReference} className={messageClasses}>
        {isUltraPerformanceMode ? (
          // En modo ultra rendimiento, mostramos texto plano sin formato
          formattedMessage || placeholder
        ) : (
          // En modo normal, usamos ReactMarkdown para formato enriquecido
          <ReactMarkdown>{formattedMessage || placeholder}</ReactMarkdown>
        )}
      </div>
      {isTruncated && !isUltraPerformanceMode && (
        <button
          type='button'
          onClick={toggleExpand}
          className='message-node__expand-btn'
          aria-label={isExpanded ? 'Colapsar mensaje' : 'Expandir mensaje'}
          title={isExpanded ? 'Colapsar' : 'Expandir'}
        >
          {isExpanded ? (
            <>
              <Minimize2 size={14} aria-hidden='true' />
              <span>Colapsar</span>
            </>
          ) : (
            <>
              <Maximize2 size={14} aria-hidden='true' />
              <span>Expandir</span>
            </>
          )}
        </button>
      )}
    </div>
  );
});

MessagePreview.displayName = 'MessagePreview';

export default MessagePreview;
