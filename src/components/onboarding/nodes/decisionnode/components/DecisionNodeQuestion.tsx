/**
 * @file DecisionNodeQuestion.tsx
 * @description Componente para editar la pregunta del nodo de decisión
 */

import { X, Check } from 'lucide-react';
import React, { memo, useRef, useEffect, useCallback, useState } from 'react';

import Tooltip from '../../../ui/ToolTip';
import { DECISION_NODE_ARIA, DECISION_NODE_SHORTCUTS } from '../DecisionNode.types';

// Importación dinámica para ReactMarkdown
const ReactMarkdown = React.lazy(async () => import('../../../../../lib/simplified-markdown'));

// Interfaces
interface DecisionNodeQuestionProps {
  question: string;
  onQuestionChange: (question: string) => void;
  isEditing: boolean;
  onStartEditing: () => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving?: boolean;
  enableMarkdown?: boolean;
  enableVariables?: boolean;
  isUltraPerformanceMode?: boolean;
}

interface TextareaHandlers {
  handleChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

interface ViewModeProps {
  question: string;
  enableMarkdown?: boolean;
  enableVariables?: boolean;
  isUltraPerformanceMode?: boolean;
  onStartEditing: () => void;
}

// Constants
const NODE_CONFIG = {
  MAX_TEXTAREA_HEIGHT: 300,
  DEFAULT_QUESTION: 'Escribe tu pregunta aquí...',
  ARIA_LABELS: DECISION_NODE_ARIA,
  KEY_SHORTCUTS: DECISION_NODE_SHORTCUTS,
};

// Helper: Manejar cambios en el textarea
const useTextareaHandlers = (
  onQuestionChange: (value: string) => void,
  onSave: () => void,
  onCancel: () => void,
): TextareaHandlers => {
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = event.target.value;
      onQuestionChange(newValue);

      // Ajustar la altura del textarea dinámicamente
      if (event.target) {
        event.target.style.height = 'auto';
        event.target.style.height = `${Math.min(event.target.scrollHeight, NODE_CONFIG.MAX_TEXTAREA_HEIGHT)}px`;
      }
    },
    [onQuestionChange],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
  isEditing: boolean,
  question: string,
  textareaReference: React.RefObject<HTMLTextAreaElement | null>,
  setLocalQuestion: React.Dispatch<React.SetStateAction<string>>,
): void => {
  // Sincronizar el estado local con el prop cuando cambia externamente
  useEffect(() => {
    setLocalQuestion(question);
  }, [question, setLocalQuestion]);

  // Enfocar y ajustar altura cuando entra en modo edición
  useEffect(() => {
    if (isEditing && textareaReference.current) {
      const textarea = textareaReference.current;
      textarea.focus();
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, NODE_CONFIG.MAX_TEXTAREA_HEIGHT)}px`;
    }
  }, [isEditing, textareaReference]);
};

// Helper: Renderizar modo visualización
const renderViewMode = ({
  question,
  enableMarkdown = false,
  enableVariables = false,
  isUltraPerformanceMode = false,
  onStartEditing,
}: ViewModeProps): React.JSX.Element => {
  const renderQuestionContent = (): React.ReactNode => {
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
          : (event: React.KeyboardEvent) => {
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
        aria-label={`${NODE_CONFIG.ARIA_LABELS.QUESTION_INPUT}: ${question}. Doble clic para editar.`}
        onKeyDown={(event: React.KeyboardEvent) => {
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

/**
 * Componente para editar la pregunta del nodo de decisión
 */
const DecisionNodeQuestion = memo<DecisionNodeQuestionProps>(
  ({
    question,
    onQuestionChange,
    isEditing,
    onStartEditing,
    onSave,
    onCancel,
    isSaving = false,
    enableMarkdown = false,
    enableVariables = false,
    isUltraPerformanceMode = false,
  }) => {
    const textareaReference = useRef<HTMLTextAreaElement>(null);
    // Estado local para el input
    const [localQuestion, setLocalQuestion] = useState(question);

    // Efectos de edición
    useEditingEffects(isEditing, question, textareaReference, setLocalQuestion);

    // Handlers de textarea
    const { handleChange: handleTextareaChange, handleKeyDown } = useTextareaHandlers(
      (newValue: string) => {
        setLocalQuestion(newValue);
        onQuestionChange(newValue);
      },
      onSave,
      onCancel,
    );

    // Helper function to render editing mode JSX
    const renderEditingModeJSX = (): React.JSX.Element => {
      return (
        <div className='decision-node__question-wrapper nodrag'>
          <textarea
            ref={textareaReference}
            className='decision-node__question-input'
            value={localQuestion}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={NODE_CONFIG.DEFAULT_QUESTION}
            aria-label={NODE_CONFIG.ARIA_LABELS.QUESTION_INPUT}
            disabled={isSaving}
          />

          <div className='decision-node__actions-toolbar'>
            <Tooltip content={`Cancelar (${NODE_CONFIG.KEY_SHORTCUTS.CANCEL})`} position='top'>
              <button
                onClick={onCancel}
                className='decision-node__button decision-node__button--cancel'
                aria-label={NODE_CONFIG.ARIA_LABELS.DELETE_CONDITION_BUTTON}
                aria-keyshortcuts={NODE_CONFIG.KEY_SHORTCUTS.CANCEL}
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
                aria-label={NODE_CONFIG.ARIA_LABELS.ADD_CONDITION_BUTTON}
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
    const renderContent = (): React.JSX.Element => {
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

export default DecisionNodeQuestion;
