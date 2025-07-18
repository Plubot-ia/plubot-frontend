/**
 * @file DecisionNodeQuestion.jsx
 * @description Componente para editar la pregunta del nodo de decisión
 */

import { X, Save, Check } from 'lucide-react';
import PropTypes from 'prop-types';
import React, { memo, useRef, useEffect, useCallback, useState } from 'react';

import Tooltip from '../../../ui/ToolTip';
import { NODE_CONFIG } from '../DecisionNode.types';

// Importación dinámica para ReactMarkdown
const ReactMarkdown = React.lazy(
  () => import('../../../../../lib/simplified-markdown'),
);

/**
 * Componente para editar la pregunta del nodo de decisión
 * @param {Object} props - Propiedades del componente
 * @param {string} props.question - Texto de la pregunta
 * @param {Function} props.onQuestionChange - Función para manejar cambios en la pregunta
 * @param {boolean} props.isEditing - Indica si está en modo edición
 * @param {Function} props.onStartEditing - Función para iniciar edición
 * @param {Function} props.onSave - Función para guardar cambios
 * @param {Function} props.onCancel - Función para cancelar edición
 * @param {boolean} props.isSaving - Indica si está guardando
 * @param {boolean} props.enableMarkdown - Indica si se debe renderizar markdown
 * @param {boolean} props.isUltraPerformanceMode - Indica si está en modo ultra rendimiento
 * @returns {JSX.Element} - Editor de pregunta del nodo
 */
const DecisionNodeQuestion = memo(
  ({
    question,
    onQuestionChange,
    isEditing,
    onStartEditing,
    onSave,
    onCancel,
    isSaving = false,
    enableMarkdown = false,
    enableVariables = false, // Asegurarse de que se recibe y se usa
    isUltraPerformanceMode = false,
  }) => {
    const textareaReference = useRef(null);
    // Usar estado local para el input para evitar problemas de renderizado
    const [localQuestion, setLocalQuestion] = useState(question);

    // Sincronizar el estado local con el prop cuando cambia externamente
    useEffect(() => {
      setLocalQuestion(question);
    }, [question]);

    // Ajustar altura del textarea y enfocar cuando se inicia la edición
    useEffect(() => {
      if (isEditing && textareaReference.current) {
        requestAnimationFrame(() => {
          textareaReference.current.style.height = 'auto';
          textareaReference.current.style.height = `${Math.min(textareaReference.current.scrollHeight, NODE_CONFIG.MAX_TEXTAREA_HEIGHT || 300)}px`;
          textareaReference.current.focus();
          textareaReference.current.select();
        });
      }
    }, [isEditing]);

    // Manejar cambios en el textarea usando estado local
    const handleChange = useCallback(
      (event) => {
        const newValue = event.target.value;
        setLocalQuestion(newValue); // Actualizar estado local inmediatamente

        // Propagar el cambio al componente padre
        onQuestionChange(newValue);

        // Ajustar la altura del textarea dinámicamente
        if (textareaReference.current) {
          textareaReference.current.style.height = 'auto';
          textareaReference.current.style.height = `${Math.min(textareaReference.current.scrollHeight, NODE_CONFIG.MAX_TEXTAREA_HEIGHT || 300)}px`;
        }
      },
      [onQuestionChange],
    );

    // Manejar teclas al editar
    const handleKeyDown = useCallback(
      (event) => {
        if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
          event.preventDefault();
          onSave();
        } else if (event.key === 'Escape') {
          event.preventDefault();
          onCancel();
        }
      },
      [onSave, onCancel],
    );

    // Renderizar contenido según modo
    const renderContent = () => {
      if (isEditing) {
        return (
          <div className='decision-node__question-wrapper nodrag'>
            <textarea
              ref={textareaReference}
              className='decision-node__question-input'
              value={localQuestion}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={NODE_CONFIG.DEFAULT_QUESTION}
              aria-label={NODE_CONFIG.ARIA_LABELS.question}
              disabled={isSaving}
            />

            <div className='decision-node__actions-toolbar'>
              <Tooltip
                content={`Cancelar (${NODE_CONFIG.KEY_SHORTCUTS.cancel.key})`}
                position='top'
              >
                <button
                  onClick={onCancel}
                  className='decision-node__button decision-node__button--cancel'
                  aria-label={NODE_CONFIG.ARIA_LABELS.cancelEditing}
                  aria-keyshortcuts={NODE_CONFIG.KEY_SHORTCUTS.cancel.key}
                  disabled={isSaving}
                >
                  <X size={14} />
                  <span>Cancelar</span>
                </button>
              </Tooltip>
              <Tooltip content='Guardar (Ctrl/Cmd + Enter)' position='top'>
                <button
                  onClick={onSave}
                  className='decision-node__button decision-node__button--save'
                  aria-label={NODE_CONFIG.ARIA_LABELS.saveChanges}
                  aria-keyshortcuts='Control+Enter Meta+Enter'
                  disabled={isSaving}
                  type='submit'
                >
                  <Check size={14} />
                  <span>{isSaving ? 'Guardando...' : 'Guardar'}</span>
                </button>
              </Tooltip>
            </div>
          </div>
        );
      }

      // En modo visualización
      return (
        <div
          className='decision-node__question-wrapper'
          onClick={isUltraPerformanceMode ? undefined : onStartEditing}
        >
          <div
            className='decision-node__question'
            role='button'
            tabIndex={0}
            aria-label={`${NODE_CONFIG.ARIA_LABELS.question}: ${question}. Doble clic para editar.`}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onStartEditing();
              }
            }}
          >
            {enableMarkdown ? (
              <React.Suspense fallback={<div>{question}</div>}>
                <ReactMarkdown>{question}</ReactMarkdown>
              </React.Suspense>
            ) : enableVariables ? (
              // Renderizar con variables resaltadas si enableVariables es true y enableMarkdown es false
              <span
                dangerouslySetInnerHTML={{
                  __html: question.replaceAll(
                    /\{\{(.*?)\}\}/g,
                    '<span class="variable-highlight">{{$1}}</span>',
                  ),
                }}
              />
            ) : (
              question
            )}
            {/* Nota: Si enableMarkdown y enableVariables están activos, Markdown tiene precedencia.
              Para tener ambos, ReactMarkdown necesitaría un componente personalizado para los spans. */}
          </div>
        </div>
      );
    };

    return renderContent();
  },
);

DecisionNodeQuestion.displayName = 'DecisionNodeQuestion';

DecisionNodeQuestion.propTypes = {
  question: PropTypes.string.isRequired,
  onQuestionChange: PropTypes.func.isRequired,
  isEditing: PropTypes.bool.isRequired,
  onStartEditing: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isSaving: PropTypes.bool,
  enableMarkdown: PropTypes.bool,
  enableVariables: PropTypes.bool, // Añadir a propTypes
  isUltraPerformanceMode: PropTypes.bool,
};

export default DecisionNodeQuestion;
