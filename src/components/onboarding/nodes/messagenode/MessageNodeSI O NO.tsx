/**
 * @file MessageNode.tsx
 * @description Componente de élite mundial para representar nodos de mensaje en el editor de flujos PLUBOT.
 * Implementa diseño premium, accesibilidad WCAG 2.1, optimización de rendimiento y características avanzadas.
 * @author PLUBOT Team
 * @version 3.0.0
 */

import React, { useState, useEffect, useRef, useCallback, memo, useMemo, Suspense, lazy } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { 
  MessageSquare, 
  User, 
  Bot, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  HelpCircle,
  X, 
  Edit2, 
  Copy, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  Send,
  UserCheck,
  Trash2,
  CornerDownRight,
  Maximize2,
  Minimize2,
  Sparkles,
  Mic,
  FileText,
  Settings,
  Save,
  RotateCcw
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { produce } from 'immer';
import { z } from 'zod';
import debounce from 'lodash/debounce';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import './MessageNode.css';
// import MessageNodeFixed from './MessageNodeFixed';

// Importaciones con lazy loading para optimizar el rendimiento
const Tooltip = lazy(() => import('../../ui/ToolTip'));
const ContextMenu = lazy(() => import('../../ui/context-menu'));
const ReactMarkdown = lazy(() => import('../../../../lib/simplified-markdown'));

// ======================================================
// CONFIGURACIÓN Y CONSTANTES
// ======================================================

/**
 * Configuración centralizada del nodo
 * @version 3.0.0
 */
const NODE_CONFIG = {
  DEFAULT_MESSAGE: 'Escribe tu mensaje aquí...',
  MAX_PREVIEW_LINES: 2,
  TRANSITION_DURATION: 300, // ms
  DEBOUNCE_DELAY: 250, // ms
  MAX_VARIABLES_DISPLAY: 50,
  VERSION: '3.0.0',
  MESSAGE_TYPES: {
    USER: 'user',      // Mensaje del usuario
    BOT: 'bot',        // Respuesta del bot
    SYSTEM: 'system',  // Mensaje de sistema
    ERROR: 'error',    // Mensaje de error
    WARNING: 'warning',// Advertencia
    INFO: 'info',      // Información
    QUESTION: 'question' // Pregunta
  },
  TEMPLATES: [
    { name: 'Saludo', content: 'Hola, {{nombre}}! Bienvenido a {{servicio}}.' },
    { name: 'Pregunta', content: '¿Podrías proporcionarme más información sobre {{tema}}?' },
    { name: 'Despedida', content: 'Gracias por contactarnos, {{nombre}}. ¡Hasta pronto!' }
  ],
  HANDLE_POSITIONS: {
    INPUT: Position.Top,
    OUTPUT: Position.Bottom
  },
  ACCESSIBILITY: {
    MIN_CONTRAST_RATIO: 4.5,
    FOCUS_VISIBLE_OUTLINE: '2px solid #4ea0ff',
    MIN_TOUCH_TARGET: '44px'
  }
};

// ======================================================
// DEFINICIÓN DE TIPOS Y ESQUEMAS
// ======================================================

/**
 * Esquema de validación para variables
 */
const VariableSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  value: z.string().optional().default(''),
  id: z.string().optional()
});

/**
 * Esquema de validación para datos del nodo
 */
const MessageNodeDataSchema = z.object({
  message: z.string().default(NODE_CONFIG.DEFAULT_MESSAGE),
  type: z.enum(Object.values(NODE_CONFIG.MESSAGE_TYPES) as [string, ...string[]]).default(NODE_CONFIG.MESSAGE_TYPES.SYSTEM),
  variables: z.array(VariableSchema).default([]),
  lastUpdated: z.string().optional(),
  version: z.string().default(NODE_CONFIG.VERSION),
  id: z.string().optional(),
  x: z.number().optional(),
  y: z.number().optional()
});

/**
 * Tipo para variables
 */
export type Variable = z.infer<typeof VariableSchema>;

/**
 * Tipo para datos del nodo
 */
export type MessageNodeData = z.infer<typeof MessageNodeDataSchema>;

/**
 * Propiedades del nodo de mensaje
 */
export interface MessageNodeProps extends NodeProps<MessageNodeData> {
  isUltraPerformanceMode?: boolean;
  performanceMode?: boolean; // Alias para compatibilidad
  onEdit?: (id: string) => void;
  onDuplicate?: (id: string, data: MessageNodeData) => void;
  onDelete?: (id: string) => void;
  outputHandles?: Array<{
    id: string;
    label: string;
    position?: Position;
  }>;
}

/**
 * Propiedades para el ícono del nodo
 */
interface MessageNodeIconProps {
  type: string;
  isUltraPerformanceMode: boolean;
}

/**
 * Propiedades para la vista previa del mensaje
 */
interface MessagePreviewProps {
  message: string;
  variables: Variable[];
  isUltraPerformanceMode: boolean;
}

/**
 * Propiedades para el editor de variables
 */
interface VariableEditorProps {
  variables: Variable[];
  onAddVariable: (variable: Variable) => void;
  onUpdateVariable: (index: number, variable: Variable) => void;
  onDeleteVariable: (index: number) => void;
  isUltraPerformanceMode: boolean;
}

// ======================================================
// HOOKS PERSONALIZADOS
// ======================================================

/**
 * Hook personalizado para manejar el estado de edición del nodo
 * @param initialData Datos iniciales del nodo
 * @returns Estado y funciones para manejar la edición
 */
function useNodeEditor(initialData: MessageNodeData) {
  const [message, setMessage] = useState<string>(initialData.message || NODE_CONFIG.DEFAULT_MESSAGE);
  const [variables, setVariables] = useState<Variable[]>(initialData.variables || []);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [history, setHistory] = useState<{past: MessageNodeData[], future: MessageNodeData[]}>({
    past: [],
    future: []
  });

  // Actualizar estado cuando cambian los datos iniciales
  useEffect(() => {
    if (!isEditing) {
      setMessage(initialData.message || NODE_CONFIG.DEFAULT_MESSAGE);
      setVariables(initialData.variables || []);
      setIsDirty(false);
    }
  }, [initialData, isEditing]);

  // Marcar como sucio cuando hay cambios
  useEffect(() => {
    if (isEditing) {
      const hasMessageChanged = message !== initialData.message;
      const haveVariablesChanged = JSON.stringify(variables) !== JSON.stringify(initialData.variables);
      setIsDirty(hasMessageChanged || haveVariablesChanged);
    }
  }, [message, variables, initialData, isEditing]);

  // Función para comenzar la edición
  const startEditing = useCallback(() => {
    if (!isEditing) {
      // Guardar estado actual en el historial
      setHistory(prev => ({
        ...prev,
        past: [...prev.past, {
          message: initialData.message || NODE_CONFIG.DEFAULT_MESSAGE,
          variables: initialData.variables || [],
          type: initialData.type,
          version: initialData.version || NODE_CONFIG.VERSION
        }]
      }));
      setIsEditing(true);
    }
  }, [isEditing, initialData]);

  // Función para cancelar la edición
  const cancelEditing = useCallback(() => {
    setMessage(initialData.message || NODE_CONFIG.DEFAULT_MESSAGE);
    setVariables(initialData.variables || []);
    setIsEditing(false);
    setIsDirty(false);
  }, [initialData]);

  // Funciones para deshacer/rehacer
  const undo = useCallback(() => {
    if (history.past.length > 0) {
      const previous = history.past[history.past.length - 1];
      const newPast = history.past.slice(0, -1);
      
      setHistory({
        past: newPast,
        future: [{ message, variables, type: initialData.type, version: initialData.version || NODE_CONFIG.VERSION }, ...history.future]
      });
      
      setMessage(previous.message);
      setVariables(previous.variables);
    }
  }, [history, message, variables, initialData]);

  const redo = useCallback(() => {
    if (history.future.length > 0) {
      const next = history.future[0];
      const newFuture = history.future.slice(1);
      
      setHistory({
        past: [...history.past, { message, variables, type: initialData.type, version: initialData.version || NODE_CONFIG.VERSION }],
        future: newFuture
      });
      
      setMessage(next.message);
      setVariables(next.variables);
    }
  }, [history, message, variables, initialData]);

  return {
    message,
    setMessage,
    variables,
    setVariables,
    isEditing,
    setIsEditing,
    isDirty,
    startEditing,
    cancelEditing,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0
  };
}

/**
 * Hook personalizado para manejar variables
 * @param initialVariables Variables iniciales
 * @returns Estado y funciones para manejar variables
 */
function useVariableManager(initialVariables: Variable[] = []) {
  const [variables, setVariables] = useState<Variable[]>(initialVariables);
  const [errors, setErrors] = useState<Record<number, string>>({});

  // Validar variables
  const validateVariables = useCallback(() => {
    const newErrors: Record<number, string> = {};
    const names = new Set<string>();
    
    variables.forEach((variable, index) => {
      try {
        VariableSchema.parse(variable);
        
        // Verificar nombres duplicados
        if (names.has(variable.name)) {
          newErrors[index] = 'Nombre duplicado';
        } else {
          names.add(variable.name);
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          newErrors[index] = error.errors[0]?.message || 'Error de validación';
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [variables]);

  // Agregar variable
  const addVariable = useCallback((variable: Variable) => {
    setVariables(prev => {
      const newVariables = [...prev, {
        ...variable,
        id: Math.random().toString(36).substring(2, 9)
      }];
      return newVariables;
    });
  }, []);

  // Actualizar variable
  const updateVariable = useCallback((index: number, variable: Variable) => {
    setVariables(prev => {
      const newVariables = [...prev];
      newVariables[index] = {
        ...variable,
        id: prev[index].id || Math.random().toString(36).substring(2, 9)
      };
      return newVariables;
    });
  }, []);

  // Eliminar variable
  const deleteVariable = useCallback((index: number) => {
    setVariables(prev => prev.filter((_, i) => i !== index));
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[index];
      
      // Reindexar errores
      const reindexedErrors: Record<number, string> = {};
      Object.entries(newErrors).forEach(([key, value]) => {
        const keyNum = parseInt(key);
        if (keyNum > index) {
          reindexedErrors[keyNum - 1] = value;
        } else {
          reindexedErrors[keyNum] = value;
        }
      });
      
      return reindexedErrors;
    });
  }, []);

  // Reordenar variables
  const reorderVariables = useCallback((sourceIndex: number, destinationIndex: number) => {
    setVariables(prev => {
      const result = [...prev];
      const [removed] = result.splice(sourceIndex, 1);
      result.splice(destinationIndex, 0, removed);
      return result;
    });
  }, []);

  return {
    variables,
    setVariables,
    errors,
    validateVariables,
    addVariable,
    updateVariable,
    deleteVariable,
    reorderVariables,
    hasErrors: Object.keys(errors).length > 0
  };
}

// ======================================================
// COMPONENTES AUXILIARES
// ======================================================

/**
 * Componente para el ícono del nodo de mensaje
 * @param props Propiedades del componente
 * @returns Componente de ícono
 */
const MessageNodeIcon: React.FC<MessageNodeIconProps> = memo(({ type, isUltraPerformanceMode }) => {
  const { t } = useTranslation('messageNode');
  
  // Tamaño y grosor optimizados para legibilidad
  const iconProps = { 
    size: 16, 
    strokeWidth: 2,
    // En modo ultra rendimiento, desactivamos animaciones y usamos un estilo más simple
    className: isUltraPerformanceMode ? 'message-node__icon-svg--ultra' : 'message-node__icon-svg'
  };
  
  /**
   * Devuelve el ícono correspondiente al tipo de mensaje
   * @returns Ícono SVG
   */
  const getIcon = () => {
    const types = NODE_CONFIG.MESSAGE_TYPES;
    
    switch (type) {
      case types.USER:
        return <User {...iconProps} aria-hidden="true" />;
      case types.BOT:
        return <Bot {...iconProps} aria-hidden="true" />;
      case types.ERROR:
        return <AlertCircle {...iconProps} aria-hidden="true" />;
      case types.WARNING:
        return <AlertTriangle {...iconProps} aria-hidden="true" />;
      case types.INFO:
        return <Info {...iconProps} aria-hidden="true" />;
      case types.QUESTION:
        return <HelpCircle {...iconProps} aria-hidden="true" />;
      case types.SYSTEM:
      default:
        return <MessageSquare {...iconProps} aria-hidden="true" />;
    }
  };

  return (
    <div 
      className={`message-node__icon ${isUltraPerformanceMode ? 'message-node__icon--ultra' : ''} message-node__icon--${type || 'system'}`}
      role="img"
      aria-label={t('iconLabel', { type: type || 'system' })}
    >
      {getIcon()}
    </div>
  );
});

MessageNodeIcon.displayName = 'MessageNodeIcon';

/**
 * Componente para la vista previa del mensaje con soporte para Markdown y truncado inteligente
 * @param props Propiedades del componente
 * @returns Componente de vista previa
 */
const MessagePreview: React.FC<MessagePreviewProps> = memo(({ message, variables, isUltraPerformanceMode }) => {
  const { t } = useTranslation('messageNode');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const messageRef = useRef<HTMLDivElement>(null);
  const [isTruncated, setIsTruncated] = useState<boolean>(false);
  
  // Formatear mensaje con variables
  const formattedMessage = useMemo(() => {
    if (!message) return '';
    
    let formatted = message;
    
    // Reemplazar variables en el mensaje
    if (variables && variables.length > 0) {
      variables.forEach(variable => {
        const regex = new RegExp(`\\{\\{\\s*${variable.name}\\s*\\}\\}`, 'g');
        formatted = formatted.replace(regex, variable.value || `{{${variable.name}}}`);
      });
    }
    
    return formatted;
  }, [message, variables]);

  // Detectar si el mensaje necesita ser truncado
  useEffect(() => {
    if (messageRef.current && !isUltraPerformanceMode) {
      const element = messageRef.current;
      const lineHeight = parseInt(window.getComputedStyle(element).lineHeight);
      const maxHeight = lineHeight * NODE_CONFIG.MAX_PREVIEW_LINES;
      
      setIsTruncated(element.scrollHeight > maxHeight);
    }
  }, [formattedMessage, isUltraPerformanceMode]);

  // Alternar entre vista completa y truncada
  const toggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
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
    <div className="message-node__message-container">
      <div 
        ref={messageRef}
        className={messageClasses}
        style={{
          // En modo ultra rendimiento o expandido, no aplicamos límite de altura
          maxHeight: (!isUltraPerformanceMode && !isExpanded) 
            ? `calc(${NODE_CONFIG.MAX_PREVIEW_LINES}em * 1.5)` 
            : 'none'
        }}
      >
        {isUltraPerformanceMode ? (
          // En modo ultra rendimiento, mostramos texto plano sin formato
          <div className="message-node__plain-text">{formattedMessage}</div>
        ) : (
          // En modo normal, usamos Markdown
          <Suspense fallback={<div className="message-node__loading">{t('loadingPreview')}</div>}>
            <ReactMarkdown>{formattedMessage}</ReactMarkdown>
          </Suspense>
        )}
      </div>
      
      {/* Botón para expandir/colapsar si el mensaje está truncado */}
      {isTruncated && !isUltraPerformanceMode && (
        <button 
          type="button"
          className="message-node__expand-button"
          onClick={toggleExpand}
          aria-expanded={isExpanded}
          aria-controls="message-content"
        >
          {isExpanded ? (
            <>
              <Minimize2 size={14} aria-hidden="true" />
              <span>{t('collapse')}</span>
            </>
          ) : (
            <>
              <Maximize2 size={14} aria-hidden="true" />
              <span>{t('expand')}</span>
            </>
          )}
        </button>
      )}
    </div>
  );
});

MessagePreview.displayName = 'MessagePreview';
/**
 * Componente para editar variables del mensaje con soporte para drag-and-drop
 * @param props Propiedades del componente
 * @returns Componente editor de variables
 */
const VariableEditor: React.FC<VariableEditorProps> = memo(({ 
  variables, 
  onAddVariable, 
  onUpdateVariable, 
  onDeleteVariable,
  isUltraPerformanceMode 
}) => {
  const { t } = useTranslation('messageNode');
  const [newVariable, setNewVariable] = useState<Variable>({ name: '', value: '' });
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const newNameInputRef = useRef<HTMLInputElement>(null);

  // Enfocar el campo de nombre al agregar una nueva variable
  useEffect(() => {
    if (isAdding && newNameInputRef.current) {
      newNameInputRef.current.focus();
    }
  }, [isAdding]);

  /**
   * Iniciar la adición de una nueva variable
   */
  const handleAddClick = useCallback(() => {
    setIsAdding(true);
    setValidationErrors({});
  }, []);

  /**
   * Cancelar la adición de una nueva variable
   */
  const handleCancelAdd = useCallback(() => {
    setIsAdding(false);
    setNewVariable({ name: '', value: '' });
    setValidationErrors({});
  }, []);

  /**
   * Validar una nueva variable
   * @returns Booleano indicando si la variable es válida
   */
  const validateNewVariable = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    
    // Validar nombre
    if (!newVariable.name.trim()) {
      errors.name = t('validation.nameRequired');
    } else if (variables.some(v => v.name === newVariable.name.trim())) {
      errors.name = t('validation.nameDuplicate');
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [newVariable, variables, t]);

  /**
   * Guardar una nueva variable
   */
  const handleSubmitAdd = useCallback(() => {
    if (validateNewVariable()) {
      onAddVariable({
        ...newVariable,
        name: newVariable.name.trim(),
        value: newVariable.value || ''
      });
      setNewVariable({ name: '', value: '' });
      setIsAdding(false);
    }
  }, [newVariable, onAddVariable, validateNewVariable]);

  /**
   * Manejar cambios en los campos de una variable existente
   * @param index Índice de la variable
   * @param field Campo a modificar (name o value)
   * @param value Nuevo valor
   */
  const handleVariableChange = useCallback((index: number, field: keyof Variable, value: string) => {
    onUpdateVariable(index, { ...variables[index], [field]: value });
  }, [variables, onUpdateVariable]);

  /**
   * Manejar teclas en el formulario de nueva variable
   * @param e Evento de teclado
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmitAdd();
    } else if (e.key === 'Escape') {
      handleCancelAdd();
    }
  }, [handleSubmitAdd, handleCancelAdd]);

  /**
   * Manejar el reordenamiento de variables
   * @param result Resultado del drag-and-drop
   */
  const handleDragEnd = useCallback((result: any) => {
    if (!result.destination) return;
    
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    if (sourceIndex === destinationIndex) return;
    
    // Crear una nueva lista reordenada
    const reorderedVariables = [...variables];
    const [removed] = reorderedVariables.splice(sourceIndex, 1);
    reorderedVariables.splice(destinationIndex, 0, removed);
    
    // Actualizar todas las variables
    reorderedVariables.forEach((variable, index) => {
      onUpdateVariable(index, variable);
    });
  }, [variables, onUpdateVariable]);

  // Limitar la cantidad de variables mostradas en modo ultra rendimiento
  const displayedVariables = useMemo(() => {
    if (isUltraPerformanceMode && variables.length > NODE_CONFIG.MAX_VARIABLES_DISPLAY) {
      return variables.slice(0, NODE_CONFIG.MAX_VARIABLES_DISPLAY);
    }
    return variables;
  }, [variables, isUltraPerformanceMode]);

  return (
    <div 
      className={`message-node__variables ${isUltraPerformanceMode ? 'message-node__variables--ultra' : ''}`}
      role="region"
      aria-label={t('variableEditor')}
    >
      <div className="message-node__variables-title">
        <span id="variables-heading">{t('variables')}</span>
        {!isAdding && (
          <button 
            type="button" 
            className="message-node__variable-button"
            onClick={handleAddClick}
            aria-label={t('addVariable')}
            aria-describedby="variables-heading"
            disabled={isUltraPerformanceMode}
          >
            +
          </button>
        )}
      </div>
      
      {isAdding && !isUltraPerformanceMode && (
        <div 
          className="message-node__variable message-node__variable--new"
          role="form"
          aria-labelledby="new-variable-heading"
        >
          <span id="new-variable-heading" className="sr-only">{t('newVariable')}</span>
          <div className="message-node__variable-field">
            <input
              ref={newNameInputRef}
              type="text"
              placeholder={t('namePlaceholder')}
              value={newVariable.name}
              onChange={(e) => setNewVariable({ ...newVariable, name: e.target.value })}
              className={`message-node__variable-name ${validationErrors.name ? 'message-node__variable-name--error' : ''}`}
              aria-label={t('variableName')}
              aria-invalid={!!validationErrors.name}
              aria-describedby={validationErrors.name ? "name-error" : undefined}
              onKeyDown={handleKeyDown}
            />
            {validationErrors.name && (
              <div id="name-error" className="message-node__variable-error" role="alert">
                {validationErrors.name}
              </div>
            )}
          </div>
          <div className="message-node__variable-field">
            <input
              type="text"
              placeholder={t('valuePlaceholder')}
              value={newVariable.value}
              onChange={(e) => setNewVariable({ ...newVariable, value: e.target.value })}
              className="message-node__variable-value"
              aria-label={t('variableValue')}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div className="message-node__variable-actions">
            <button 
              type="button" 
              className="message-node__variable-button message-node__variable-button--save"
              onClick={handleSubmitAdd}
              aria-label={t('saveVariable')}
            >
              <UserCheck size={14} aria-hidden="true" />
            </button>
            <button 
              type="button" 
              className="message-node__variable-button message-node__variable-button--cancel"
              onClick={handleCancelAdd}
              aria-label={t('cancel')}
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
      
      {!isUltraPerformanceMode ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="variables-list">
            {(provided) => (
              <div 
                className="message-node__variables-list"
                role="list"
                aria-label={t('variablesList')}
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {displayedVariables.map((variable, index) => (
                  <Draggable 
                    key={`var-${variable.id || index}`} 
                    draggableId={`var-${variable.id || index}`} 
                    index={index}
                    isDragDisabled={isUltraPerformanceMode}
                  >
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`message-node__variable ${snapshot.isDragging ? 'message-node__variable--dragging' : ''}`}
                        role="listitem"
                      >
                        <input
                          type="text"
                          value={variable.name}
                          onChange={(e) => handleVariableChange(index, 'name', e.target.value)}
                          className="message-node__variable-name"
                          aria-label={t('variableNameWithIndex', { index: index + 1 })}
                          disabled={isUltraPerformanceMode}
                        />
                        <input
                          type="text"
                          value={variable.value}
                          onChange={(e) => handleVariableChange(index, 'value', e.target.value)}
                          className="message-node__variable-value"
                          aria-label={t('variableValueWithIndex', { index: index + 1 })}
                          disabled={isUltraPerformanceMode}
                        />
                        {!isUltraPerformanceMode && (
                          <div className="message-node__variable-actions">
                            <button 
                              type="button" 
                              className="message-node__variable-button message-node__variable-button--delete"
                              onClick={() => onDeleteVariable(index)}
                              aria-label={t('deleteVariableWithName', { name: variable.name })}
                            >
                              <Trash2 size={14} aria-hidden="true" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        <div 
          className="message-node__variables-list"
          role="list"
          aria-label={t('variablesList')}
        >
          {displayedVariables.map((variable, index) => (
            <div 
              key={`var-${variable.id || index}`} 
              className="message-node__variable"
              role="listitem"
            >
              <input
                type="text"
                value={variable.name}
                onChange={(e) => handleVariableChange(index, 'name', e.target.value)}
                className="message-node__variable-name"
                aria-label={t('variableNameWithIndex', { index: index + 1 })}
                disabled={isUltraPerformanceMode}
              />
              <input
                type="text"
                value={variable.value}
                onChange={(e) => handleVariableChange(index, 'value', e.target.value)}
                className="message-node__variable-value"
                aria-label={t('variableValueWithIndex', { index: index + 1 })}
                disabled={isUltraPerformanceMode}
              />
            </div>
          ))}
          {variables.length > NODE_CONFIG.MAX_VARIABLES_DISPLAY && (
            <div className="message-node__variables-more">
              {t('moreVariables', { count: variables.length - NODE_CONFIG.MAX_VARIABLES_DISPLAY })}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

VariableEditor.displayName = 'VariableEditor';

/**
 * Componente para mostrar errores del nodo
 */
interface ErrorFallbackProps {
  error: Error | string;
  resetError?: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => {
  const { t } = useTranslation('messageNode');
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  return (
    <div className="message-node__error-fallback" role="alert">
      <AlertCircle size={16} aria-hidden="true" />
      <span>{errorMessage}</span>
      {resetError && (
        <button 
          type="button" 
          onClick={resetError}
          className="message-node__error-button"
          aria-label={t('dismissError')}
        >
          <X size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

/**
 * Componente para sugerir mensajes usando IA
 */
interface AIMessageSuggestorProps {
  onSelectSuggestion: (message: string) => void;
  currentMessage: string;
  messageType: string;
}

const AIMessageSuggestor: React.FC<AIMessageSuggestorProps> = memo(({ 
  onSelectSuggestion, 
  currentMessage,
  messageType
}) => {
  const { t } = useTranslation('messageNode');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Función para generar sugerencias
  const generateSuggestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulación de llamada a API (reemplazar con llamada real a xAI)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Sugerencias de ejemplo (reemplazar con respuesta real)
      const exampleSuggestions = [
        "¡Hola! Gracias por contactarnos. ¿En qué podemos ayudarte hoy?",
        "Bienvenido a nuestro servicio. Estamos aquí para asistirte.",
        "Gracias por tu mensaje. Un especialista te atenderá pronto."
      ];
      
      setSuggestions(exampleSuggestions);
    } catch (err) {
      setError(t('aiSuggestionError'));
      console.error('Error al generar sugerencias:', err);
    } finally {
      setIsLoading(false);
    }
  }, [t]);
  
  // Seleccionar una sugerencia
  const handleSelectSuggestion = useCallback((suggestion: string) => {
    onSelectSuggestion(suggestion);
    setSuggestions([]);
  }, [onSelectSuggestion]);
  
  return (
    <div className="message-node__ai-suggester">
      <button
        type="button"
        className="message-node__ai-button"
        onClick={generateSuggestions}
        disabled={isLoading}
        aria-label={t('suggestMessage')}
      >
        <Sparkles size={14} aria-hidden="true" />
        <span>{t('suggestMessage')}</span>
      </button>
      
      {isLoading && (
        <div className="message-node__ai-loading" role="status">
          <div className="message-node__ai-spinner" aria-hidden="true" />
          <span>{t('generatingSuggestions')}</span>
        </div>
      )}
      
      {error && (
        <div className="message-node__ai-error" role="alert">
          {error}
        </div>
      )}
      
      {suggestions.length > 0 && (
        <div 
          className="message-node__ai-suggestions"
          role="listbox"
          aria-label={t('messageSuggestions')}
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="message-node__ai-suggestion"
              onClick={() => handleSelectSuggestion(suggestion)}
              role="option"
              aria-selected="false"
            >
              {suggestion.length > 60 ? `${suggestion.substring(0, 60)}...` : suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

AIMessageSuggestor.displayName = 'AIMessageSuggestor';

/**
 * Componente para seleccionar plantillas de mensajes
 */
interface TemplatePickerProps {
  onSelectTemplate: (template: string) => void;
}

const TemplatePicker: React.FC<TemplatePickerProps> = memo(({ onSelectTemplate }) => {
  const { t } = useTranslation('messageNode');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  
  // Manejar selección de plantilla
  const handleSelectTemplate = useCallback((template: string) => {
    onSelectTemplate(template);
    setIsOpen(false);
  }, [onSelectTemplate]);
  
  return (
    <div className="message-node__template-picker">
      <button
        type="button"
        className="message-node__template-button"
        onClick={() => setIsOpen(prev => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={t('templates')}
      >
        <FileText size={14} aria-hidden="true" />
        <span>{t('templates')}</span>
      </button>
      
      {isOpen && (
        <div 
          className="message-node__templates"
          role="listbox"
          aria-label={t('messageTemplates')}
        >
          {NODE_CONFIG.TEMPLATES.map((template, index) => (
            <button
              key={index}
              className="message-node__template"
              onClick={() => handleSelectTemplate(template.content)}
              role="option"
              aria-selected="false"
            >
              <strong>{template.name}</strong>
              <span>{template.content}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

TemplatePicker.displayName = 'TemplatePicker';

/**
 * Componente para autocompletado de variables
 */
interface VariableAutocompleteProps {
  variables: Variable[];
  onInsertVariable: (name: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

const VariableAutocomplete: React.FC<VariableAutocompleteProps> = memo(({ 
  variables, 
  onInsertVariable,
  textareaRef
}) => {
  const { t } = useTranslation('messageNode');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [filteredVariables, setFilteredVariables] = useState<Variable[]>([]);
  const [cursorPosition, setCursorPosition] = useState<{ top: number, left: number }>({ top: 0, left: 0 });
  
  // Detectar cuando se escribe {{ para mostrar el autocompletado
  useEffect(() => {
    const handleInput = () => {
      if (!textareaRef.current) return;
      
      const textarea = textareaRef.current;
      const text = textarea.value;
      const cursorPos = textarea.selectionStart;
      
      // Buscar {{ antes del cursor
      const beforeCursor = text.substring(0, cursorPos);
      const match = beforeCursor.match(/\{\{([^}]*)$/);
      
      if (match) {
        const search = match[1].trim().toLowerCase();
        const filtered = variables.filter(v => 
          v.name.toLowerCase().includes(search)
        );
        
        if (filtered.length > 0) {
          // Calcular posición para el dropdown
          const cursorCoords = getCaretCoordinates(textarea, cursorPos);
          setCursorPosition({
            top: cursorCoords.top + 20,
            left: cursorCoords.left
          });
          
          setFilteredVariables(filtered);
          setIsOpen(true);
          return;
        }
      }
      
      setIsOpen(false);
    };
    
    // Función auxiliar para obtener coordenadas del cursor
    // Simplificada - en producción usar una biblioteca como textarea-caret-position
    function getCaretCoordinates(element: HTMLTextAreaElement, position: number) {
      const { offsetLeft, offsetTop } = element;
      // Implementación básica - en producción usar cálculo preciso
      return { top: offsetTop + 20, left: offsetLeft + 10 };
    }
    
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('input', handleInput);
      textarea.addEventListener('keyup', handleInput);
      textarea.addEventListener('click', handleInput);
    }
    
    return () => {
      if (textarea) {
        textarea.removeEventListener('input', handleInput);
        textarea.removeEventListener('keyup', handleInput);
        textarea.removeEventListener('click', handleInput);
      }
    };
  }, [textareaRef, variables]);
  
  // Insertar variable seleccionada
  const handleSelectVariable = useCallback((name: string) => {
    onInsertVariable(name);
    setIsOpen(false);
  }, [onInsertVariable]);
  
  if (!isOpen || filteredVariables.length === 0) {
    return null;
  }
  
  return (
    <div 
      className="message-node__variable-autocomplete"
      style={{ top: cursorPosition.top, left: cursorPosition.left }}
      role="listbox"
      aria-label={t('variableSuggestions')}
    >
      {filteredVariables.map((variable, index) => (
        <button
          key={index}
          className="message-node__variable-suggestion"
          onClick={() => handleSelectVariable(variable.name)}
          role="option"
          aria-selected="false"
        >
          {variable.name}
        </button>
      ))}
    </div>
  );
});

VariableAutocomplete.displayName = 'VariableAutocomplete';
/**
 * Componente principal MessageNode
 * Implementa un nodo de mensaje de élite mundial con todas las características avanzadas
 * @param props Propiedades del componente
 * @returns Componente MessageNode
 */
const MessageNode: React.FC<MessageNodeProps> = memo(({ 
  data, 
  isConnectable = true, 
  selected = false, 
  id, 
  isUltraPerformanceMode = false, 
  performanceMode = false,
  onEdit,
  onDuplicate,
  onDelete,
  outputHandles = []
}) => {
  const { t } = useTranslation('messageNode');
  const { setNodes } = useReactFlow();
  
  // Validar y normalizar datos del nodo
  const safeData = useMemo<MessageNodeData>(() => {
    try {
      return MessageNodeDataSchema.parse(data || {});
    } catch (error) {
      console.error('Error validando datos del nodo:', error);
      return MessageNodeDataSchema.parse({});
    }
  }, [data]);
  
  // Usar performanceMode como fallback para isUltraPerformanceMode (compatibilidad)
  const isUltraMode = isUltraPerformanceMode || performanceMode || false;
  
  // Referencias
  const nodeRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Estado de error
  const [error, setError] = useState<string | null>(null);
  const [showContextMenu, setShowContextMenu] = useState<boolean>(false);
  const [showVariables, setShowVariables] = useState<boolean>(false);
  
  // Usar hooks personalizados para manejar edición y variables
  const {
    message,
    setMessage,
    variables,
    setVariables,
    isEditing,
    setIsEditing,
    isDirty,
    startEditing,
    cancelEditing,
    undo,
    redo,
    canUndo,
    canRedo
  } = useNodeEditor(safeData);
  
  // Tipo de mensaje (user, bot, system, etc.)
  const messageType = useMemo(() => safeData.type || NODE_CONFIG.MESSAGE_TYPES.SYSTEM, [safeData.type]);

  /**
   * Manejar doble clic para editar el nodo
   * Solo si no está en modo ultra rendimiento
   */
  const handleDoubleClick = useCallback(() => {
    if (!isEditing && !isUltraMode) {
      startEditing();
    }
  }, [isEditing, isUltraMode, startEditing]);

  /**
   * Manejar clic fuera del nodo para guardar cambios
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (nodeRef.current && !nodeRef.current.contains(event.target as Node) && isEditing) {
        saveChanges();
      }
    };

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing]);

  /**
   * Enfocar textarea al entrar en modo edición
   */
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(0, textareaRef.current.value.length);
    }
  }, [isEditing]);

  /**
   * Guardar cambios en el nodo
   */
  const saveChanges = useCallback(() => {
    try {
      // Validar datos antes de guardar
      const validatedVariables = variables.map(v => VariableSchema.parse(v));
      
      // Usar immer para actualización inmutable
      setNodes(produce((draft) => {
        const node = draft.find(n => n.id === id);
        if (node) {
          node.data = {
            ...node.data,
            message,
            variables: validatedVariables,
            lastUpdated: new Date().toISOString(),
            version: NODE_CONFIG.VERSION
          };
        }
      }));
      
      setIsEditing(false);
      setError(null);
    } catch (error) {
      if (error instanceof z.ZodError) {
        setError(t('validation.invalidData'));
      } else {
        setError(t('errors.saveError'));
      }
      console.error('Error al guardar cambios:', error);
    }
  }, [id, setNodes, message, variables, t]);

  /**
   * Manejar cambios en el texto del mensaje
   * Con debounce para mejorar rendimiento
   */
  const handleMessageChange = useMemo(() => 
    debounce((e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setMessage(e.target.value);
    }, NODE_CONFIG.DEBOUNCE_DELAY) as React.ChangeEventHandler<HTMLTextAreaElement>,
  [setMessage]);

  /**
   * Manejar atajos de teclado
   * @param e Evento de teclado
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Atajos para guardar/cancelar
    if (e.key === 'Escape') {
      cancelEditing();
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      saveChanges();
    } 
    // Atajos para deshacer/rehacer
    else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      if (e.shiftKey) {
        if (canRedo) redo();
      } else {
        if (canUndo) undo();
      }
    }
  }, [cancelEditing, saveChanges, canUndo, canRedo, undo, redo]);

  // Funciones para manejar variables
  /**
   * Agregar una nueva variable
   * @param newVar Nueva variable
   */
  const handleAddVariable = useCallback((newVar: Variable) => {
    setVariables(prev => [...prev, newVar]);
  }, [setVariables]);

  /**
   * Actualizar una variable existente
   * @param index Índice de la variable
   * @param updatedVar Variable actualizada
   */
  const handleUpdateVariable = useCallback((index: number, updatedVar: Variable) => {
    setVariables(prev => prev.map((v, i) => i === index ? updatedVar : v));
  }, [setVariables]);

  /**
   * Eliminar una variable
   * @param index Índice de la variable a eliminar
   */
  const handleDeleteVariable = useCallback((index: number) => {
    setVariables(prev => prev.filter((_, i) => i !== index));
  }, [setVariables]);

  /**
   * Insertar una variable en el mensaje
   * @param name Nombre de la variable
   */
  const handleInsertVariable = useCallback((name: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    
    // Buscar {{ antes del cursor
    const beforeCursor = text.substring(0, start);
    const match = beforeCursor.match(/\{\{([^}]*)$/);
    
    if (match) {
      // Reemplazar la parte {{... con la variable completa
      const newText = beforeCursor.substring(0, match.index) + 
                      `{{${name}}}` + 
                      text.substring(end);
      
      setMessage(newText);
      
      // Establecer posición del cursor después de la variable
      setTimeout(() => {
        const newPosition = match.index! + name.length + 4; // 4 por los caracteres {{}}
        textarea.selectionStart = newPosition;
        textarea.selectionEnd = newPosition;
        textarea.focus();
      }, 0);
    } else {
      // Insertar la variable en la posición actual
      const newText = text.substring(0, start) + 
                      `{{${name}}}` + 
                      text.substring(end);
      
      setMessage(newText);
      
      // Establecer posición del cursor después de la variable
      setTimeout(() => {
        const newPosition = start + name.length + 4; // 4 por los caracteres {{}}
        textarea.selectionStart = newPosition;
        textarea.selectionEnd = newPosition;
        textarea.focus();
      }, 0);
    }
  }, [setMessage]);

  /**
   * Opciones del menú contextual
   * Desactivadas en modo ultra rendimiento
   */
  const contextMenuOptions = useMemo(() => [
    {
      label: t('edit'),
      icon: <Edit2 size={14} aria-hidden="true" />,
      action: () => {
        if (!isUltraMode) {
          startEditing();
          if (onEdit) onEdit(id);
        }
      },
      disabled: isUltraMode
    },
    {
      label: t('duplicate'),
      icon: <Copy size={14} aria-hidden="true" />,
      action: () => {
        if (!isUltraMode && onDuplicate) {
          onDuplicate(id, safeData);
        }
      },
      disabled: isUltraMode
    },
    {
      label: t('delete'),
      icon: <Trash2 size={14} aria-hidden="true" />,
      action: () => {
        if (!isUltraMode && onDelete) {
          onDelete(id);
        }
      },
      isDanger: true,
      disabled: isUltraMode
    }
  ], [isUltraMode, startEditing, id, onEdit, onDuplicate, onDelete, safeData, t]);

  /**
   * Clases CSS del nodo
   * Incluye variantes por tipo y estado
   * Optimizado para rendimiento con memoización
   */
  const nodeClasses = useMemo(() => {
    const classes = ['message-node', `message-node--${messageType}`];
    
    if (selected) classes.push('message-node--selected');
    if (isEditing) classes.push('message-node--editing');
    if (isUltraMode) classes.push('message-node--ultra-performance');
    if (error) classes.push('message-node--has-error');
    if (isDirty) classes.push('message-node--dirty');
    
    return classes.join(' ');
  }, [messageType, selected, isEditing, isUltraMode, error, isDirty]);
  
  /**
   * Optimización para modo ultra rendimiento
   * Utilizamos el componente MessageNodeFixed para evitar problemas de renderizado
   * y mejorar la apariencia estética
   */
  const renderUltraPerformanceContent = () => {
    // Devolver un placeholder o el contenido simplificado que no dependa de MessageNodeFixed
    return (
      <div className="message-node__ultra-placeholder">
        <MessageNodeIcon type={messageType} isUltraPerformanceMode={true} />
        <span>{safeData.label || t(`messageTypes.${messageType}`)}</span>
      </div>
      <MessageNodeFixed 
        type={messageType}
        message={message}
        isUltraPerformanceMode={true}
      />
    );
  };

  /**
   * Renderizar el componente MessageNode
   */
  // Renderizamos el componente con una estructura diferente según el modo
  return (
    <div
      ref={nodeRef}
      className={nodeClasses}
      onDoubleClick={handleDoubleClick}
      data-testid="message-node"
      role="group"
      aria-label={t('nodeAriaLabel', { type: messageType })}
      tabIndex={0}
    >
      {isUltraMode ? (
        // Contenido simplificado para modo ultra rendimiento
        <>
          {renderUltraPerformanceContent()}
          
          {/* Conectores para entradas y salidas - simplificados para ultra rendimiento */}
          <Handle
            type="target"
            position={NODE_CONFIG.HANDLE_POSITIONS.INPUT}
            isConnectable={isConnectable}
            className="message-node__handle message-node__handle--target message-node__handle--ultra"
            aria-label={t('inputConnector')}
            title={t('connectFromNode')}
            tabIndex={-1}
            role="button"
            data-testid="message-node-target-handle"
          />
          
          {/* Conector de salida predeterminado */}
          <Handle
            type="source"
            position={NODE_CONFIG.HANDLE_POSITIONS.OUTPUT}
            isConnectable={isConnectable}
            className="message-node__handle message-node__handle--source message-node__handle--ultra"
            aria-label={t('outputConnector')}
            title={t('connectToNode')}
            tabIndex={-1}
            role="button"
            data-testid="message-node-source-handle"
          />
        </>
      ) : (
        // Contenido normal para modo estándar
        <>
          {/* Handles para el modo normal */}
          <Handle
            type="target"
            position={NODE_CONFIG.HANDLE_POSITIONS.INPUT}
            isConnectable={isConnectable}
            className="message-node__handle message-node__handle--target"
            id={`input-handle-${id}`}
            aria-label={t('inputConnector')}
            title={t('connectFromNode')}
            tabIndex={-1}
            role="button"
            data-testid={`message-node-target-handle-normal-${id}`}
          />
          <Handle
            type="source"
            position={NODE_CONFIG.HANDLE_POSITIONS.OUTPUT}
            isConnectable={isConnectable}
            className="message-node__handle message-node__handle--source"
            id={`output-handle-${id}`}
            aria-label={t('outputConnector')}
            title={t('connectToNode')}
            tabIndex={-1}
            role="button"
            data-testid={`message-node-source-handle-normal-${id}`}
          />
          <Suspense fallback={<div className="message-node__loading">{t('loading')}</div>}>
          <ContextMenu options={contextMenuOptions}>
            {/* Cabecera del nodo */}
            <header className="message-node__header">
              <div className="message-node__title">
                <MessageNodeIcon 
                  type={messageType} 
                  isUltraPerformanceMode={false} 
                />
                <span>
                  {t(`messageTypes.${messageType}`)}
                </span>
              </div>
              
              {/* Botones de acción en la cabecera */}
            <div className="message-node__header-actions">
              {/* Botón para mostrar/ocultar variables */}
              {!isEditing && variables && variables.length > 0 && !isUltraMode && (
                <Suspense fallback={null}>
                  <Tooltip content={showVariables ? t('hideVariables') : t('showVariables')}>
                    <button
                      type="button"
                      className="message-node__variable-button"
                      onClick={() => setShowVariables(prev => !prev)}
                      aria-label={showVariables ? t('hideVariables') : t('showVariables')}
                      aria-expanded={showVariables}
                      aria-controls="variables-list"
                    >
                      {showVariables ? 
                        <ChevronUp size={16} aria-hidden="true" /> : 
                        <ChevronDown size={16} aria-hidden="true" />
                      }
                    </button>
                  </Tooltip>
                </Suspense>
              )}
            </div>
          </header>

          {/* Contenido principal */}
          <main className="message-node__content">
            {isEditing ? (
              <div 
                className="message-node__edit-area"
                role="form"
                aria-label={t('editMessage')}
              >
                <label htmlFor={`message-textarea-${id}`} className="sr-only">
                  {t('messageContent')}
                </label>
                <textarea
                  id={`message-textarea-${id}`}
                  ref={textareaRef}
                  className="message-node__textarea"
                  value={message}
                  onChange={handleMessageChange}
                  onKeyDown={handleKeyDown}
                  placeholder={NODE_CONFIG.DEFAULT_MESSAGE}
                  aria-label={t('messageContent')}
                  aria-describedby={`message-help-${id}`}
                  rows={4}
                  autoFocus
                  spellCheck="true"
                  data-testid="message-node-textarea"
                />
                <div id={`message-help-${id}`} className="sr-only">
                  {t('textareaHelp')}
                </div>
                
                {/* Autocompletado de variables */}
                <VariableAutocomplete 
                  variables={variables}
                  onInsertVariable={handleInsertVariable}
                  textareaRef={textareaRef}
                />
                
                {/* Herramientas avanzadas */}
                <div className="message-node__tools">
                  <AIMessageSuggestor 
                    onSelectSuggestion={setMessage}
                    currentMessage={message}
                    messageType={messageType}
                  />
                  
                  <TemplatePicker 
                    onSelectTemplate={setMessage}
                  />
                  
                  <div className="message-node__history-actions">
                    <button
                      type="button"
                      className="message-node__history-button"
                      onClick={undo}
                      disabled={!canUndo}
                      aria-label={t('undo')}
                      title={t('undo')}
                    >
                      <RotateCcw size={14} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="message-node__history-button"
                      onClick={redo}
                      disabled={!canRedo}
                      aria-label={t('redo')}
                      title={t('redo')}
                    >
                      <RotateCcw size={14} className="message-node__icon--flipped" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                
                <VariableEditor
                  variables={variables}
                  onAddVariable={handleAddVariable}
                  onUpdateVariable={handleUpdateVariable}
                  onDeleteVariable={handleDeleteVariable}
                  isUltraPerformanceMode={isUltraMode}
                />
                
                {error && (
                  <ErrorFallback 
                    error={error}
                    resetError={() => setError(null)}
                  />
                )}
                
                <div className="message-node__actions">
                  <button
                    type="button"
                    className="message-node__button message-node__button--secondary"
                    onClick={cancelEditing}
                    aria-label={t('cancel')}
                    tabIndex={0}
                    title={t('cancelEdit')}
                  >
                    <X size={14} className="message-node__button-icon" aria-hidden="true" />
                    <span>{t('cancel')}</span>
                  </button>
                  <button
                    type="button"
                    className="message-node__button"
                    onClick={saveChanges}
                    aria-label={t('save')}
                    tabIndex={0}
                    title={t('saveChanges')}
                  >
                    <Save size={14} className="message-node__button-icon" aria-hidden="true" />
                    <span>{t('save')}</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <MessagePreview 
                  message={message} 
                  variables={variables} 
                  isUltraPerformanceMode={isUltraMode}
                />
                
                {/* Lista de variables (visible solo cuando showVariables es true) */}
                {showVariables && variables && variables.length > 0 && (
                  <div 
                    id="variables-list"
                    className="message-node__variables"
                    role="region"
                    aria-label={t('messageVariables')}
                    tabIndex={0}
                  >
                    <div className="message-node__variables-title">
                      <span>{t('variables')}</span>
                      <span className="sr-only">
                        {t('variablesCount', { count: variables.length })}
                      </span>
                    </div>
                    <div 
                      className="message-node__variables-list"
                      role="list"
                      aria-label={t('variablesList')}
                    >
                      {variables.map((variable, index) => (
                        <div 
                          key={`var-preview-${variable.id || index}`} 
                          className="message-node__variable"
                          role="listitem"
                          aria-label={t('variableWithValue', { 
                            name: variable.name, 
                            value: variable.value || t('empty') 
                          })}
                          tabIndex={0}
                        >
                          <span 
                            className="message-node__variable-name" 
                            title={t('variableName', { name: variable.name })}
                          >
                            {variable.name}
                          </span>
                          <span 
                            className="message-node__variable-value" 
                            title={t('variableValue', { value: variable.value || t('empty') })}
                          >
                            <CornerDownRight 
                              size={12} 
                              style={{ marginRight: '4px', opacity: 0.7 }} 
                              aria-hidden="true" 
                            />
                            {variable.value || t('emptyValue')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </main>

          {/* Pie del nodo con información de última actualización */}
          {!isEditing && safeData.lastUpdated && !isUltraMode && (
            <footer className="message-node__footer">
              <div className="message-node__timestamp">
                <Clock size={12} aria-hidden="true" />
                <span title={new Date(safeData.lastUpdated).toLocaleString()}>
                  {t('lastUpdated', { 
                    date: new Date(safeData.lastUpdated).toLocaleDateString(),
                    time: new Date(safeData.lastUpdated).toLocaleTimeString()
                  })}
                </span>
              </div>
            </footer>
          )}

          {/* Conectores para entradas y salidas - con mejoras de accesibilidad */}
          <Handle
            type="target"
            position={NODE_CONFIG.HANDLE_POSITIONS.INPUT}
            isConnectable={isConnectable && !isUltraMode}
            className={`message-node__handle message-node__handle--target ${isUltraMode ? 'message-node__handle--ultra' : ''}`}
            aria-label={t('inputConnector')}
            title={t('connectFromNode')}
            tabIndex={isConnectable && !isUltraMode ? 0 : -1}
            role="button"
            data-testid="message-node-target-handle"
          />
          
          {/* Manejar múltiples conectores de salida */}
          {outputHandles.length > 0 ? (
            // Renderizar conectores personalizados
            outputHandles.map((handle, index) => (
              <Handle
                key={`handle-${handle.id || index}`}
                id={handle.id}
                type="source"
                position={handle.position || NODE_CONFIG.HANDLE_POSITIONS.OUTPUT}
                isConnectable={isConnectable && !isUltraMode}
                className={`message-node__handle message-node__handle--source ${isUltraMode ? 'message-node__handle--ultra' : ''}`}
                aria-label={t('outputConnectorWithLabel', { label: handle.label })}
                title={handle.label}
                tabIndex={isConnectable && !isUltraMode ? 0 : -1}
                role="button"
                data-testid={`message-node-source-handle-${handle.id}`}
              />
            ))
          ) : (
            // Conector de salida predeterminado
            <Handle
              type="source"
              position={NODE_CONFIG.HANDLE_POSITIONS.OUTPUT}
              isConnectable={isConnectable && !isUltraMode}
              className={`message-node__handle message-node__handle--source ${isUltraMode ? 'message-node__handle--ultra' : ''}`}
              aria-label={t('outputConnector')}
              title={t('connectToNode')}
              tabIndex={isConnectable && !isUltraMode ? 0 : -1}
              role="button"
              data-testid="message-node-source-handle"
            />
          )}
        </ContextMenu>
      </Suspense>
        </>
      )
      }
      
      {/* Texto para lectores de pantalla */}
      <span className="sr-only">
        {t('screenReaderDescription', {
          type: t(`messageTypes.${messageType}`),
          message: message,
          variablesCount: variables.length,
          lastUpdated: safeData.lastUpdated ? new Date(safeData.lastUpdated).toLocaleString() : ''
        })}
      </span>
    </div>
  )
});

MessageNode.displayName = 'MessageNode';

// Exportar el componente y tipos
export default MessageNode;
export { 
  MessageNodeIcon, 
  MessagePreview, 
  VariableEditor,
  NODE_CONFIG,
  MessageNodeDataSchema,
  VariableSchema
};
