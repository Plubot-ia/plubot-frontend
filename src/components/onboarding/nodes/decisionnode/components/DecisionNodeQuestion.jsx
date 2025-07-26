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

// Helper: Manejar cambios en el textarea
const useTextareaHandlers = (onQuestionChange, onSave, onCancel) => {
  const handleChange = useCallback(
    (event) => {
      const newValue = event.target.value;
      onQuestionChange(newValue);

      // Ajustar la altura del textarea dinámicamente
      if (event.target) {
        event.target.style.height = 'auto';
        event.target.style.height = `${Math.min(event.target.scrollHeight, NODE_CONFIG.MAX_TEXTAREA_HEIGHT || 300)}px`;
      }
    },
    [onQuestionChange],
  );

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

  return { handleChange, handleKeyDown };
};

// Helper: Manejar efectos de edición
const useEditingEffects = (
  isEditing,
  question,
  textareaReference,
  setLocalQuestion,
) => {
  // Sincronizar el estado local con el prop cuando cambia externamente
  useEffect(() => {
    setLocalQuestion(question);
  }, [question, setLocalQuestion]);

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
  }, [isEditing, textareaReference]);
};

// Helper: Renderizar modo visualización
const renderViewMode = ({
  question,
  enableMarkdown,
  enableVariables,
  isUltraPerformanceMode,
  onStartEditing,
}) => {
  const renderQuestionContent = () => {
    if (enableMarkdown) {
      return (
        <React.Suspense fallback={<div>{question}</div>}>
          <ReactMarkdown>{question}</ReactMarkdown>
        </React.Suspense>
      );
    }
    if (enableVariables) {
      return (
        <span
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: question.replaceAll(
              // eslint-disable-next-line sonarjs/slow-regex -- Safe regex with non-greedy matching and specific delimiters, not vulnerable to ReDoS
              /\{\{(.*?)\}\}/g,
              '<span class="variable-highlight">{{$1}}</span>',
            ),
          }}
        />
      );
    }
    return question;
  };

  return (
    <div
      className='decision-node__question-wrapper'
      onClick={isUltraPerformanceMode ? undefined : onStartEditing}
      onKeyDown={
        isUltraPerformanceMode
          ? undefined
          : (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onStartEditing();
              }
            }
      }
      role={isUltraPerformanceMode ? undefined : 'button'}
      tabIndex={isUltraPerformanceMode ? undefined : 0}
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
        {renderQuestionContent()}
      </div>
    </div>
  );
};

// Helper function to render editing mode JSX - extracted to reduce renderContent function size
const renderEditingModeHelper = ({
  localQuestion,
  handleTextareaChange,
  handleKeyDown,
  isSaving,
  onCancel,
  onSave,
  textareaReference,
}) => {
  return (
    <div className='decision-node__question-wrapper nodrag'>
      <textarea
        ref={textareaReference}
        className='decision-node__question-input'
        value={localQuestion}
        onChange={handleTextareaChange}
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
};

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
    // Estado local para el input
    const [localQuestion, setLocalQuestion] = useState(question);

    // Efectos de edición
    useEditingEffects(isEditing, question, textareaReference, setLocalQuestion);

    // Handlers de textarea
    const { handleChange: handleTextareaChange, handleKeyDown } =
      useTextareaHandlers(
        (newValue) => {
          setLocalQuestion(newValue);
          onQuestionChange(newValue);
        },
        onSave,
        onCancel,
      );
    // Helper function to render editing mode JSX - extracted to reduce renderContent function size
    const renderEditingModeJSX = () => {
      return (
        <div className='decision-node__question-wrapper nodrag'>
          <textarea
            ref={textareaReference}
            className='decision-node__question-input'
            value={localQuestion}
            onChange={handleTextareaChange}
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
    };

    // Renderizar contenido según modo
    const renderContent = () => {
      if (isEditing) {
        return renderEditingModeJSX();
      }

      // En modo visualización
      return renderViewMode({
        question,
        enableMarkdown,
        enableVariables,
        isUltraPerformanceMode,
        onStartEditing,
      });
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
