/**
 * @file DecisionNodeQuestion.jsx
 * @description Componente para editar la pregunta del nodo de decisión
 */

import React, { memo, useRef, useEffect, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { X, Save, Check } from 'lucide-react';
import Tooltip from '../../../ui/ToolTip';
import { NODE_CONFIG } from '../DecisionNode.types';

// Importación dinámica para ReactMarkdown
const ReactMarkdown = React.lazy(() => import('../../../../../lib/simplified-markdown'));

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
const DecisionNodeQuestion = memo(({ 
  question, 
  onQuestionChange, 
  isEditing, 
  onStartEditing, 
  onSave, 
  onCancel,
  isSaving = false,
  enableMarkdown = false,
  enableVariables = false, // Asegurarse de que se recibe y se usa
  isUltraPerformanceMode = false
}) => {
  const textareaRef = useRef(null);
  // Usar estado local para el input para evitar problemas de renderizado
  const [localQuestion, setLocalQuestion] = useState(question);
  
  // Sincronizar el estado local con el prop cuando cambia externamente
  useEffect(() => {
    setLocalQuestion(question);
  }, [question]);
  
  // Ajustar altura del textarea y enfocar cuando se inicia la edición
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      requestAnimationFrame(() => {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, NODE_CONFIG.MAX_TEXTAREA_HEIGHT || 300)}px`;
        textareaRef.current.focus();
        textareaRef.current.select();
      });
    }
  }, [isEditing]);
  
  // Manejar cambios en el textarea usando estado local
  const handleChange = useCallback((e) => {
    const newValue = e.target.value;
    setLocalQuestion(newValue); // Actualizar estado local inmediatamente
    
    // Propagar el cambio al componente padre
    onQuestionChange(newValue);
    
    // Ajustar la altura del textarea dinámicamente
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, NODE_CONFIG.MAX_TEXTAREA_HEIGHT || 300)}px`;
    }
  }, [onQuestionChange]);
  
  // Manejar teclas al editar
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  }, [onSave, onCancel]);
  
  // Renderizar contenido según modo
  const renderContent = () => {
    if (isEditing) {
      return (
        <div className="decision-node__question-wrapper">
          <textarea
            ref={textareaRef}
            className="decision-node__question-input"
            value={localQuestion}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onMouseDown={(e) => e.stopPropagation()} // Evitar que el drag del nodo interfiera con la selección de texto
            placeholder={NODE_CONFIG.DEFAULT_QUESTION}
            aria-label={NODE_CONFIG.ARIA_LABELS.question}
            disabled={isSaving}
          />
          
          <div className="decision-node__actions-toolbar">
            <Tooltip content={`Cancelar (${NODE_CONFIG.KEY_SHORTCUTS.cancel.key})`} position="top">
              <button
                onClick={onCancel}
                className="decision-node__button decision-node__button--cancel"
                aria-label={NODE_CONFIG.ARIA_LABELS.cancelEditing}
                aria-keyshortcuts={NODE_CONFIG.KEY_SHORTCUTS.cancel.key}
                disabled={isSaving}
              >
                <X size={14} />
                <span>Cancelar</span>
              </button>
            </Tooltip>
            <Tooltip content="Guardar (Ctrl/Cmd + Enter)" position="top">
              <button
                onClick={onSave}
                className="decision-node__button decision-node__button--save"
                aria-label={NODE_CONFIG.ARIA_LABELS.saveChanges}
                aria-keyshortcuts="Control+Enter Meta+Enter"
                disabled={isSaving}
                type="submit" 
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
        className="decision-node__question-wrapper"
        onClick={!isUltraPerformanceMode ? onStartEditing : undefined}
      >
        <div 
          className="decision-node__question"
          role="button"
          tabIndex={0}
          aria-label={`${NODE_CONFIG.ARIA_LABELS.question}: ${question}. Doble clic para editar.`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
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
            <span dangerouslySetInnerHTML={{ __html: question.replace(/\{\{(.*?)\}\}/g, '<span class="variable-highlight">{{$1}}</span>') }} />
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
});

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
  isUltraPerformanceMode: PropTypes.bool
};

export default DecisionNodeQuestion;
