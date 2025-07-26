/**
 * @file MessagePreview.jsx
 * @description Componente para renderizar la vista previa de un mensaje con soporte para Markdown y variables.
 * @author PLUBOT Team
 * @version 3.0.0
 */

import PropTypes from 'prop-types';
import React, { memo, useMemo } from 'react';

import ReactMarkdown from '@/lib/simplified-markdown';
import { replaceVariablesInMessage } from '@/utils/message-utilities.js';

// Constantes
const MAX_PREVIEW_LINES = 2;

/**
 * Componente que renderiza la vista previa de un mensaje con procesamiento de variables
 */
const MessagePreview = memo(
  ({ message = '', variables = [], isUltraPerformanceMode = false }) => {
    /**
     * Procesa el mensaje reemplazando las variables
     */
    const processedMessage = useMemo(() => {
      return replaceVariablesInMessage(message, variables);
    }, [message, variables]);

    /**
     * Versión truncada del mensaje para modo de vista previa
     */
    const truncatedMessage = useMemo(() => {
      if (!processedMessage) return '';
      if (isUltraPerformanceMode) {
        // En modo ultra rendimiento, simplemente truncamos el texto
        return processedMessage.length > 100
          ? `${processedMessage.slice(0, 100)}...`
          : processedMessage;
      }

      // Para modo normal, hacemos un truncado más inteligente por líneas
      const lines = processedMessage.split('\n');
      if (lines.length > MAX_PREVIEW_LINES) {
        return `${lines.slice(0, MAX_PREVIEW_LINES).join('\n')}...`;
      }

      return processedMessage;
    }, [processedMessage, isUltraPerformanceMode]);

    /**
     * Renderiza el componente MessagePreview
     */
    if (isUltraPerformanceMode) {
      // En modo ultra rendimiento, usamos texto plano para máxima eficiencia
      return (
        <div className='message-node__preview'>
          {truncatedMessage || 'Mensaje vacío'}
        </div>
      );
    }

    // En modo normal, usamos ReactMarkdown para formato enriquecido
    return (
      <div className='message-node__preview' data-testid='message-preview'>
        {processedMessage ? (
          <ReactMarkdown>{processedMessage}</ReactMarkdown>
        ) : (
          <span className='message-node__empty'>Mensaje vacío</span>
        )}
      </div>
    );
  },
);

MessagePreview.displayName = 'MessagePreview';

MessagePreview.propTypes = {
  message: PropTypes.string,
  variables: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      value: PropTypes.string,
    }),
  ),
  isUltraPerformanceMode: PropTypes.bool,
};

export default MessagePreview;
