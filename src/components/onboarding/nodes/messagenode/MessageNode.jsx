/**
 * @file MessageNode.jsx
 * @description Componente optimizado para representar nodos de mensaje en el editor de flujos PLUBOT.
 * Implementa diseño profesional, accesibilidad y optimización para modo normal y ultra rendimiento.
 * @author PLUBOT Team
 * @version 2.0.0
 */

import {
  Clock,
  Copy,
  Edit2,
  HelpCircle,
  Loader2,
  Maximize2,
  Minimize2,
  Save,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import PropTypes from 'prop-types';
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  memo,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Handle, Position, useUpdateNodeInternals } from 'reactflow';

import ReactMarkdown from '@/lib/simplified-markdown';
import { useContextMenu } from '@/stores/selectors';
import useFlowStore from '@/stores/use-flow-store';
import { formatDateRelative, formatTime } from '@/utils/date.js';
import { replaceVariablesInMessage } from '@/utils/message-utilities.js';

import { escapeRegex } from '../../../../utils/regex-utilities.js';
import Tooltip from '../../ui/ToolTip';

import { MessageNodeIcon } from './MessageNodeIcon';

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
};

// Constantes y configuración (Mantenemos las específicas si NODE_CONFIG no las cubre todas aún)
const placeholder = NODE_CONFIG.DEFAULT_MESSAGE_PLACEHOLDER;
const { MAX_PREVIEW_LINES } = NODE_CONFIG;

/**
 * Tipos de mensajes disponibles
 * @type {Object}
 */
const MESSAGE_TYPES = {
  USER: 'user', // Mensaje del usuario
  BOT: 'bot', // Respuesta del bot
  SYSTEM: 'system', // Mensaje de sistema
  ERROR: 'error', // Mensaje de error
  WARNING: 'warning', // Advertencia
  INFO: 'info', // Información
  QUESTION: 'question', // Pregunta
};

// Helper function to generate titles based on message type
const typeToTitle = (type) => {
  switch (type) {
    case MESSAGE_TYPES.USER: {
      return 'Mensaje de Usuario';
    }
    case MESSAGE_TYPES.BOT: {
      return 'Respuesta del Bot';
    }
    case MESSAGE_TYPES.SYSTEM: {
      return 'Mensaje de Sistema';
    }
    case MESSAGE_TYPES.ERROR: {
      return 'Error';
    }
    case MESSAGE_TYPES.WARNING: {
      return 'Advertencia';
    }
    case MESSAGE_TYPES.INFO: {
      return 'Información';
    }
    case MESSAGE_TYPES.QUESTION: {
      return 'Pregunta';
    }
    default: {
      return NODE_CONFIG.DEFAULT_TITLE_PREFIX;
    }
  }
};

/**
 * Componente para el ícono del nodo de mensaje
 * @param {Object} props - Propiedades del componente
 * @param {string} props.type - Tipo de mensaje (user, bot, system, etc.)
 * @param {boolean} props.isUltraPerformanceMode - Indica si está en modo ultra rendimiento
 * @returns {JSX.Element} - Ícono del nodo de mensaje
 */

/**
 * Componente para la vista previa del mensaje con soporte para Markdown y truncado inteligente
 * @param {Object} props - Propiedades del componente
 * @param {string} props.message - Contenido del mensaje
 * @param {Array} props.variables - Variables para reemplazar en el mensaje
 * @param {boolean} props.isUltraPerformanceMode - Indica si está en modo ultra rendimiento
 * @returns {JSX.Element} - Vista previa del mensaje formateada
 */
const MessagePreview = memo(
  ({ message = '', variables = [], isUltraPerformanceMode = false }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const messageReference = useRef();
    const [isTruncated, setIsTruncated] = useState(false);

    // Formatear mensaje con variables
    const formattedMessage = useMemo(() => {
      if (!message) return '';

      let formatted = message;

      // Reemplazar variables en el mensaje
      if (variables && variables.length > 0) {
        for (const variable of variables) {
          // eslint-disable-next-line security/detect-non-literal-regexp
          const regex = new RegExp(
            `\\{\\{\\s*${escapeRegex(variable.name)}\\s*\\}\\}`,
            'g',
          );
          formatted = formatted.replace(
            regex,
            variable.value || `{{${variable.name}}}`,
          );
        }
      }

      return formatted;
    }, [message, variables]);

    // Detectar si el mensaje necesita ser truncado
    useEffect(() => {
      if (messageReference.current && !isUltraPerformanceMode) {
        const element = messageReference.current;
        const lineHeight = Number.parseInt(
          globalThis.getComputedStyle(element).lineHeight,
          10,
        );
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
            <div className='message-node__plain-text'>{formattedMessage}</div>
          ) : (
            // En modo normal, usamos Markdown
            <ReactMarkdown>{formattedMessage}</ReactMarkdown>
          )}
        </div>

        {/* Botón para expandir/colapsar si el mensaje está truncado */}
        {isTruncated && !isUltraPerformanceMode && (
          <button
            type='button'
            className='message-node__expand-button'
            onClick={toggleExpand}
            aria-expanded={isExpanded}
            aria-controls='message-content'
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

// Valores predeterminados ahora definidos directamente en los parámetros de la función

// Constante de tooltip para el editor de variables
const VARIABLE_EDITOR_TOOLTIP_CONTENT = `**¿Qué son las Variables?**
Son como etiquetas para guardar información que cambia, como el nombre de un cliente o una fecha.

**¿Cómo las uso?**
1.  **Crea una:** Haz clic en el botón \`+\` de abajo.
    *   **Nombre:** Un nombre corto para recordar qué es (ej: \`nombre_cliente\`).
    *   **Valor:** La información que quieres guardar (ej: \`Ana Sofía\`).
2.  **Insértala en tu mensaje:** Escribe el Nombre de tu variable entre llaves dobles, así: \`{{nombre_cliente}}\`.
    Cuando el mensaje se envíe, \`{{nombre_cliente}}\` se reemplazará automáticamente por \`Ana Sofía\`.

¡Así puedes personalizar mensajes fácilmente!`;

// Helper para renderizar el formulario de nueva variable
const renderNewVariableForm = ({
  isAdding,
  isUltraPerformanceMode,
  newNameInputReference,
  newVariable,
  setNewVariable,
  handleKeyDown,
  handleSubmitAdd,
  handleCancelAdd,
}) => {
  if (!isAdding || isUltraPerformanceMode) return;

  return (
    <div
      className='message-node__variable'
      role='form'
      aria-labelledby='new-variable-heading'
    >
      <span id='new-variable-heading' className='sr-only'>
        Nueva variable
      </span>
      <input
        ref={newNameInputReference}
        type='text'
        placeholder='Nombre'
        value={newVariable.name}
        onChange={(event) =>
          setNewVariable({ ...newVariable, name: event.target.value })
        }
        className='message-node__variable-name'
        aria-label='Nombre de variable'
        onKeyDown={handleKeyDown}
      />
      <input
        type='text'
        placeholder='Valor'
        value={newVariable.value}
        onChange={(event) =>
          setNewVariable({ ...newVariable, value: event.target.value })
        }
        className='message-node__variable-value'
        aria-label='Valor de variable'
        onKeyDown={handleKeyDown}
      />
      <div className='message-node__variable-actions'>
        <button
          type='button'
          className='message-node__variable-button'
          onClick={handleSubmitAdd}
          aria-label='Guardar variable'
        >
          <Save size={14} aria-hidden='true' />
        </button>
        <button
          type='button'
          className='message-node__variable-button'
          onClick={handleCancelAdd}
          aria-label='Cancelar'
        >
          <X size={14} aria-hidden='true' />
        </button>
      </div>
    </div>
  );
};

// Helper para renderizar la lista de variables existentes
const renderExistingVariablesList = ({
  variables,
  handleVariableChange,
  isUltraPerformanceMode,
  onDeleteVariable,
}) => {
  return (
    <div
      className='message-node__variables-list'
      role='list'
      aria-label='Lista de variables'
    >
      {variables &&
        variables.map((variable) => (
          <div
            key={variable.id}
            className='message-node__variable'
            role='listitem'
          >
            <input
              type='text'
              value={variable.name}
              onChange={(event) =>
                handleVariableChange(variable.id, 'name', event.target.value)
              }
              className='message-node__variable-name'
              aria-label={`Nombre de variable ${variable.name}`}
              disabled={isUltraPerformanceMode}
            />
            <input
              type='text'
              value={variable.value}
              onChange={(event) =>
                handleVariableChange(variable.id, 'value', event.target.value)
              }
              className='message-node__variable-value'
              aria-label={`Valor de variable ${variable.name}`}
              disabled={isUltraPerformanceMode}
            />
            {!isUltraPerformanceMode && (
              <div className='message-node__variable-actions'>
                <button
                  type='button'
                  className='message-node__variable-button message-node__variable-button--delete'
                  onClick={() => onDeleteVariable(variable.id)}
                  aria-label={`Eliminar variable ${variable.name || 'sin nombre'}`}
                >
                  <Trash2 size={14} aria-hidden='true' />
                </button>
              </div>
            )}
          </div>
        ))}
    </div>
  );
};

// Custom hook for VariableEditor callbacks
const useVariableEditorCallbacks = ({
  newVariable,
  setNewVariable,
  setIsAdding,
  onAddVariable,
  variables,
  onUpdateVariable,
}) => {
  const handleAddClick = useCallback(() => {
    setIsAdding(true);
  }, [setIsAdding]);

  const handleCancelAdd = useCallback(() => {
    setIsAdding(false);
    setNewVariable({ name: '', value: '' });
  }, [setIsAdding, setNewVariable]);

  const handleSubmitAdd = useCallback(() => {
    if (newVariable.name.trim()) {
      onAddVariable(newVariable);
      setNewVariable({ name: '', value: '' });
      setIsAdding(false);
    }
  }, [newVariable, onAddVariable, setNewVariable, setIsAdding]);

  const handleVariableChange = useCallback(
    (id, field, value) => {
      const variableToUpdate = variables.find((v) => v.id === id);
      if (variableToUpdate) {
        onUpdateVariable(id, { ...variableToUpdate, [field]: value });
      }
    },
    [variables, onUpdateVariable],
  );

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter') {
        handleSubmitAdd();
      } else if (event.key === 'Escape') {
        handleCancelAdd();
      }
    },
    [handleSubmitAdd, handleCancelAdd],
  );

  return {
    handleAddClick,
    handleCancelAdd,
    handleSubmitAdd,
    handleVariableChange,
    handleKeyDown,
  };
};

/**
 * Componente para editar variables del mensaje
 * @param {Object} props - Propiedades del componente
 * @param {Array} props.variables - Lista de variables actuales
 * @param {Function} props.onAddVariable - Función para agregar una variable
 * @param {Function} props.onUpdateVariable - Función para actualizar una variable
 * @param {Function} props.onDeleteVariable - Función para eliminar una variable
 * @param {boolean} props.isUltraPerformanceMode - Indica si está en modo ultra rendimiento
 * @param {string} props.nodeId - Identificador del nodo
 * @returns {JSX.Element} - Editor de variables
 */
const VariableEditor = ({
  nodeId, // <--- Añadir nodeId como prop
  variables = [],
  onAddVariable,
  onUpdateVariable,
  onDeleteVariable,
  isUltraPerformanceMode = false,
}) => {
  const [newVariable, setNewVariable] = useState({ name: '', value: '' });
  const [isAdding, setIsAdding] = useState(false);
  const newNameInputReference = useRef(null);
  const updateNodeInternals = useUpdateNodeInternals(); // <--- Hook de React Flow

  // Enfocar el campo de nombre al agregar una nueva variable
  useEffect(() => {
    if (isAdding && newNameInputReference.current) {
      newNameInputReference.current.focus();
    }
  }, [isAdding]);

  // Efecto para actualizar las dimensiones del nodo cuando el form de añadir aparece/desaparece
  useEffect(() => {
    if (nodeId) {
      updateNodeInternals(nodeId);
    }
  }, [isAdding, nodeId, updateNodeInternals]);

  // Usar custom hook para todos los callbacks de VariableEditor
  const {
    handleAddClick,
    handleCancelAdd,
    handleSubmitAdd,
    handleVariableChange,
    handleKeyDown,
  } = useVariableEditorCallbacks({
    newVariable,
    setNewVariable,
    setIsAdding,
    onAddVariable,
    variables,
    onUpdateVariable,
  });

  return (
    <div
      className={`message-node__variables ${isUltraPerformanceMode ? 'message-node__variables--ultra' : ''}`}
      role='region'
      aria-label='Editor de variables'
    >
      <div
        className='message-node__variables-header'
        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        <h4 className='message-node__variables-title'>Variables</h4>
        <Tooltip
          content={
            <ReactMarkdown>{VARIABLE_EDITOR_TOOLTIP_CONTENT}</ReactMarkdown>
          }
        >
          <HelpCircle
            size={16}
            className='message-node__help-icon'
            style={{ cursor: 'help' }}
          />
        </Tooltip>
        {!isAdding && (
          <button
            type='button'
            className='message-node__variable-button'
            onClick={handleAddClick}
            aria-label='Agregar variable'
            aria-describedby='variables-heading'
            disabled={isUltraPerformanceMode}
          >
            +
          </button>
        )}
      </div>

      {renderNewVariableForm({
        isAdding,
        isUltraPerformanceMode,
        newNameInputReference,
        newVariable,
        setNewVariable,
        handleKeyDown,
        handleSubmitAdd,
        handleCancelAdd,
      })}

      {renderExistingVariablesList({
        variables,
        handleVariableChange,
        isUltraPerformanceMode,
        onDeleteVariable,
      })}
    </div>
  );
};

VariableEditor.propTypes = {
  nodeId: PropTypes.string.isRequired, // <--- Añadir nodeId como propType
  variables: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      value: PropTypes.string,
    }),
  ),
  onAddVariable: PropTypes.func.isRequired,
  onUpdateVariable: PropTypes.func.isRequired,
  onDeleteVariable: PropTypes.func.isRequired,
  isUltraPerformanceMode: PropTypes.bool,
};

/**
 * Componente para el ícono del nodo de mensaje
 * @param {Object} props - Propiedades del componente
 * @param {string} props.type - Tipo de mensaje (user, bot, system, etc.)
 * @param {boolean} props.isUltraPerformanceMode - Indica si está en modo ultra rendimiento
 * @returns {JSX.Element} - Ícono del nodo de mensaje
 */
const MessageNodeHeader = memo(
  ({
    id: _id,
    titleFromData,
    messageType,
    isUltraMode,
    isSaving,
    isSelected,
    onDoubleClickHeader,
    lastUpdatedTimestamp,
    disableAnimations,
  }) => {
    const displayTitle = titleFromData || typeToTitle(messageType);
    const headerClasses = [
      'message-node__header',
      isSaving ? 'message-node__header--saving' : '',
      disableAnimations ? 'message-node__header--no-anim' : '',
      isSelected ? 'message-node__header--selected' : '',
      disableAnimations ? 'message-node__header--no-anim' : '', // Usar la prop
      isSelected ? 'message-node__header--selected' : '', // Mantener si es necesario
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <header className={headerClasses} onDoubleClick={onDoubleClickHeader}>
        <div className='message-node__title-container'>
          <MessageNodeIcon
            type={messageType}
            isUltraPerformanceMode={isUltraMode}
          />
          <h2 className='message-node__title' title={displayTitle}>
            {displayTitle}
          </h2>
        </div>
        <div className='message-node__header-actions'>
          {' '}
          {/* Contenedor para acciones del header */}
          {isSaving && <SavingIndicator />}
          {!isUltraMode && lastUpdatedTimestamp && (
            <Tooltip
              content={`Última modificación: ${formatDateRelative(lastUpdatedTimestamp)} a las ${formatTime(lastUpdatedTimestamp)}`}
            >
              <Clock
                size={12}
                className='message-node__timestamp-icon'
                aria-hidden='true'
              />
            </Tooltip>
          )}
        </div>
      </header>
    );
  },
); // Corregido el cierre del componente MessageNodeHeader

MessageNodeHeader.displayName = 'MessageNodeHeader';

MessageNodeHeader.propTypes = {
  id: PropTypes.string.isRequired,
  titleFromData: PropTypes.string,
  messageType: PropTypes.string,
  isUltraMode: PropTypes.bool,
  isSaving: PropTypes.bool,
  isSelected: PropTypes.bool,
  onDoubleClickHeader: PropTypes.func,
  lastUpdatedTimestamp: PropTypes.string, // Cambiado de number a string si es un timestamp ISO
  disableAnimations: PropTypes.bool, // PropType para disableAnimations
};

const MessageNodeEditor = memo(({ id, message, variables, editorActions }) => {
  const {
    handleMessageChange,
    handleSave,
    handleCancel,
    handleAddVariable,
    handleUpdateVariable,
    handleDeleteVariable,
  } = editorActions;

  return (
    <>
      <textarea
        className='message-node__textarea nodrag'
        value={message}
        onChange={handleMessageChange}
        placeholder={placeholder}
        aria-label='Editor de mensaje'
        rows={4}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.stopPropagation();
            handleCancel();
          }
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSave();
          }
        }}
      />
      <VariableEditor
        nodeId={id}
        variables={variables}
        onAddVariable={handleAddVariable}
        onUpdateVariable={handleUpdateVariable}
        onDeleteVariable={handleDeleteVariable}
        isUltraPerformanceMode={false} // Siempre es false cuando se está editando
      />
      <div className='message-node__editor-actions'>
        <Tooltip content='Guardar cambios (Ctrl+Enter o Cmd+Enter)'>
          <button
            onClick={handleSave}
            className='message-node__editor-button message-node__editor-button--save'
            aria-label='Guardar mensaje'
          >
            <Send size={14} /> Guardar
          </button>
        </Tooltip>
        <Tooltip content='Descartar cambios (Esc)'>
          <button
            onClick={handleCancel}
            className='message-node__editor-button message-node__editor-button--cancel'
            aria-label='Cancelar edición'
          >
            <X size={14} /> Cancelar
          </button>
        </Tooltip>
      </div>
    </>
  );
});

MessageNodeEditor.displayName = 'MessageNodeEditor';

MessageNodeEditor.propTypes = {
  id: PropTypes.string.isRequired,
  message: PropTypes.string,
  variables: PropTypes.array,
  editorActions: PropTypes.shape({
    handleMessageChange: PropTypes.func.isRequired,
    handleSave: PropTypes.func.isRequired,
    handleCancel: PropTypes.func.isRequired,
    handleAddVariable: PropTypes.func.isRequired,
    handleUpdateVariable: PropTypes.func.isRequired,
    handleDeleteVariable: PropTypes.func.isRequired,
  }).isRequired,
};

const MessageNodeContent = memo(
  ({
    id,
    isEditing,
    isUltraMode,
    safeData,
    DEFAULT_MESSAGE,
    editState,
    editorActions,
  }) => {
    // En modo ultra, la lógica no cambia.
    if (isUltraMode && !isEditing) {
      return (
        <main
          className='message-node__content'
          role='main'
          id={`message-node-content-${id}`}
        >
          <div className='message-node__content message-node__content--ultra'>
            <p className='message-node__ultra-text'>
              {(() => {
                if (!safeData.message) return DEFAULT_MESSAGE;
                const processedMessage = replaceVariablesInMessage(
                  safeData.message,
                  safeData.variables,
                );
                return (
                  processedMessage.slice(0, 50) +
                  (processedMessage.length > 50 ? '...' : '')
                );
              })()}
            </p>
          </div>
        </main>
      );
    }

    // En modo normal, se renderiza CONDICIONALMENTE el editor o la vista previa.
    // Este enfoque es más robusto y soluciona el bug de superposición.
    // La animación de transición se sacrifica temporalmente por la estabilidad.
    return (
      <main
        className='message-node__content'
        role='main'
        id={`message-node-content-${id}`}
      >
        {isEditing ? (
          <div
            className='message-node__editor'
            onDoubleClick={(event) => event.stopPropagation()}
          >
            <MessageNodeEditor
              id={id}
              message={editState?.message ?? ''}
              variables={editState?.variables ?? []}
              DEFAULT_MESSAGE={DEFAULT_MESSAGE}
              editorActions={editorActions}
            />
          </div>
        ) : (
          <div className='message-node__preview-display'>
            <MessagePreview
              message={safeData.message || DEFAULT_MESSAGE}
              variables={safeData.variables}
              isUltraPerformanceMode={isUltraMode}
            />
          </div>
        )}
      </main>
    );
  },
);

MessageNodeContent.displayName = 'MessageNodeContent';

MessageNodeContent.propTypes = {
  id: PropTypes.string.isRequired,
  isEditing: PropTypes.bool,
  isUltraMode: PropTypes.bool,
  safeData: PropTypes.object.isRequired,
  DEFAULT_MESSAGE: PropTypes.string,
  editState: PropTypes.object,
  editorActions: PropTypes.object,
};

/**
 * Componente para el indicador de guardado
 * @returns {JSX.Element} - Indicador de guardado
 */
const SavingIndicator = () => {
  return (
    <div
      className='message-node__saving-indicator'
      aria-live='polite'
      aria-label='Guardando cambios'
    >
      <Loader2 size={14} className='animate-spin' />{' '}
      {/* Usando Loader2 de lucide-react con animación */}
      <span>Guardando...</span>
    </div>
  );
};

/**
 * Nombre para mostrar en DevTools
 */
SavingIndicator.displayName = 'SavingIndicator';

const LOD_LEVELS = {
  FULL: 'FULL',
  COMPACT: 'COMPACT',
  MINI: 'MINI',
};

// Vista para el nivel de detalle MÍNIMO (MINI)
const MiniView = memo(({ messageType }) => (
  <div className='message-node__mini-content'>
    <MessageNodeIcon type={messageType} isUltraPerformanceMode />
  </div>
));
MiniView.displayName = 'MiniView';
MiniView.propTypes = { messageType: PropTypes.string };

// Vista para el nivel de detalle COMPACTO
const CompactView = memo(({ messageType, title, message, variables }) => {
  const processedMessage = useMemo(() => {
    if (!message) return placeholder;
    const processed = replaceVariablesInMessage(message, variables);
    return processed.length > 50 ? `${processed.slice(0, 50)}...` : processed;
  }, [message, variables]);

  return (
    <div className='message-node'>
      <Handle type='target' position={Position.Left} id='input' />
      <Handle type='source' position={Position.Right} id='output' />
      <div className='message-node__compact-content'>
        <div className='message-node__compact-header'>
          <MessageNodeIcon type={messageType} isUltraPerformanceMode />
          <span className='message-node__compact-title'>{title}</span>
        </div>
        <div className='message-node__compact-message'>{processedMessage}</div>
      </div>
    </div>
  );
});
CompactView.displayName = 'CompactView';
CompactView.propTypes = {
  messageType: PropTypes.string,
  title: PropTypes.string,
  message: PropTypes.string,
  variables: PropTypes.array,
};

// Custom hook para callbacks de variables en MessageNode
const useVariableCallbacks = (setEditState) => {
  const handleAddVariable = useCallback(
    (newVariable) => {
      setEditState((previous) => ({
        ...previous,
        variables: [
          ...(previous.variables || []),
          { ...newVariable, id: Date.now() },
        ],
      }));
    },
    [setEditState],
  );

  const handleUpdateVariable = useCallback(
    (variableId, updatedVariable) => {
      setEditState((previous) => ({
        ...previous,
        variables: previous.variables.map((v) =>
          v.id === variableId ? updatedVariable : v,
        ),
      }));
    },
    [setEditState],
  );

  const handleDeleteVariable = useCallback(
    (variableId) => {
      setEditState((previous) => ({
        ...previous,
        variables: previous.variables.filter((v) => v.id !== variableId),
      }));
    },
    [setEditState],
  );

  return { handleAddVariable, handleUpdateVariable, handleDeleteVariable };
};

// Custom hook para el menu contextual
const useContextMenuOptions = ({
  isEditing,
  id,
  onDuplicate,
  onDelete,
  handleDoubleClick,
}) => {
  return useMemo(
    () => [
      {
        label: 'Editar',
        icon: <Edit2 size={14} aria-hidden='true' />,
        action: handleDoubleClick,
        disabled: isEditing,
      },
      {
        label: 'Duplicar',
        icon: <Copy size={14} aria-hidden='true' />,
        action: () => onDuplicate(id),
        disabled: false,
      },
      {
        label: 'Eliminar',
        icon: <Trash2 size={14} aria-hidden='true' />,
        action: () => onDelete(id),
        isDanger: true,
        disabled: isEditing,
      },
    ],
    [isEditing, id, onDuplicate, onDelete, handleDoubleClick],
  );
};

// Custom hook para callbacks y lógica de MessageNode
const useMessageNodeCallbacks = ({
  editStateReference,
  setEditState,
  setNodeState,
  updateNodeData,
  updateNodeInternals,
  safeData,
  isEditing,
  id,
  onDuplicate,
  onDelete,
  showContextMenu,
}) => {
  const { handleAddVariable, handleUpdateVariable, handleDeleteVariable } =
    useVariableCallbacks(setEditState);
  const saveChanges = useCallback(() => {
    const currentEditState = editStateReference.current;
    if (!currentEditState || !currentEditState.message) {
      setEditState(undefined);
      return;
    }
    setNodeState({ isSaving: true });
    updateNodeData(id, {
      message: currentEditState.message,
      variables: currentEditState.variables,
      lastUpdated: new Date().toISOString(),
    });
    setEditState(undefined);
    updateNodeInternals(id);
    setTimeout(() => {
      setNodeState({ isSaving: false });
    }, 300);
  }, [
    id,
    updateNodeData,
    updateNodeInternals,
    setNodeState,
    setEditState,
    editStateReference,
  ]);
  const cancelEdit = useCallback(() => {
    setEditState(undefined);
  }, [setEditState]);
  const handleMessageChange = useCallback(
    (event) => {
      setEditState((previous) => ({
        ...previous,
        message: event.target.value,
      }));
    },
    [setEditState],
  );
  const handleDoubleClick = useCallback(() => {
    if (isEditing) {
      saveChanges();
    } else {
      setEditState({
        message: safeData.message || placeholder,
        variables: (safeData.variables || []).map((v, index) => ({
          ...v,
          id: v.id || Date.now() + index,
        })),
      });
    }
  }, [
    isEditing,
    saveChanges,
    safeData.message,
    safeData.variables,
    setEditState,
  ]);
  const contextMenuOptions = useContextMenuOptions({
    isEditing,
    id,
    onDuplicate,
    onDelete,
    handleDoubleClick,
  });
  const handleNodeContextMenu = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      showContextMenu({
        x: event.clientX,
        y: event.clientY,
        nodeId: id,
        items: contextMenuOptions,
      });
    },
    [id, contextMenuOptions, showContextMenu],
  );
  const editorActions = useMemo(
    () => ({
      handleMessageChange,
      handleSave: saveChanges,
      handleCancel: cancelEdit,
      handleAddVariable,
      handleUpdateVariable,
      handleDeleteVariable,
    }),
    [
      handleMessageChange,
      saveChanges,
      cancelEdit,
      handleAddVariable,
      handleUpdateVariable,
      handleDeleteVariable,
    ],
  );
  return {
    saveChanges,
    cancelEdit,
    handleMessageChange,
    handleAddVariable,
    handleUpdateVariable,
    handleDeleteVariable,
    handleDoubleClick,
    contextMenuOptions,
    handleNodeContextMenu,
    editorActions,
  };
};
// Custom hook para efectos, estilos y clases de MessageNode
const useMessageNodeStyling = ({
  isEditing,
  saveChanges,
  nodeReference,
  messageType,
  selected,
  isUltraMode,
}) => {
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        nodeReference.current &&
        !nodeReference.current.contains(event.target) &&
        isEditing
      ) {
        saveChanges();
      }
    };

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing, saveChanges, nodeReference]);

  const nodeClasses = useMemo(() => {
    const classes = ['message-node', `message-node--${messageType}`];
    if (selected) classes.push('selected');
    if (isUltraMode) classes.push('ultra-performance');
    return classes.join(' ');
  }, [messageType, selected, isUltraMode]);

  const nodeStyle = useMemo(() => {
    const styles = {};
    // Los estilos dinámicos basados en isUltraMode o selected se pueden agregar aquí.
    return styles;
  }, []);

  return {
    nodeClasses,
    nodeStyle,
  };
};

// Helper para renderizar contenido según el nivel de detalle (LOD)
const renderMessageNodeContent = ({
  lodLevel,
  handleProperties,
  messageType,
  safeData,
  id,
  isUltraMode,
  selected,
  handleDoubleClick,
  nodeState,
  disableAnimations,
  isEditing,
  editState,
  editorActions,
  isConnectable,
}) => {
  switch (lodLevel) {
    case LOD_LEVELS.MINI: {
      return (
        <>
          <Handle
            {...handleProperties}
            type='target'
            position={Position.Top}
            className='message-node__handle message-node__handle--target message-node__handle--ultra'
          />
          <Handle
            {...handleProperties}
            type='source'
            position={Position.Bottom}
            className='message-node__handle message-node__handle--source message-node__handle--ultra'
          />
          <MiniView messageType={messageType} />
        </>
      );
    }

    case LOD_LEVELS.COMPACT: {
      return (
        <>
          <Handle
            {...handleProperties}
            type='target'
            position={Position.Top}
            className='message-node__handle message-node__handle--target message-node__handle--ultra'
          />
          <Handle
            {...handleProperties}
            type='source'
            position={Position.Bottom}
            className='message-node__handle message-node__handle--source message-node__handle--ultra'
          />
          <CompactView
            messageType={messageType}
            title={typeToTitle(messageType)}
            message={safeData.message}
            variables={safeData.variables}
          />
        </>
      );
    }

    default: {
      // FULL
      return (
        <>
          <MessageNodeHeader
            id={id}
            titleFromData={safeData.title}
            messageType={safeData.type}
            isUltraMode={isUltraMode}
            isSaving={nodeState.isSaving}
            isSelected={selected}
            onDoubleClickHeader={handleDoubleClick}
            lastUpdatedTimestamp={safeData.lastUpdated}
            disableAnimations={disableAnimations}
          />
          <MessageNodeContent
            id={id}
            isEditing={isEditing}
            isUltraMode={isUltraMode}
            safeData={safeData}
            placeholder={safeData.placeholder}
            editState={editState}
            editorActions={editorActions}
          />
          {!isEditing && safeData.lastUpdated && !isUltraMode && (
            <footer className='message-node__footer'>
              <div className='message-node__timestamp'>
                <Clock size={12} aria-hidden='true' />
                <span title={formatTime(safeData.lastUpdated)}>
                  {formatDateRelative(safeData.lastUpdated)}
                </span>
              </div>
            </footer>
          )}
          <Handle
            type='target'
            position={Position.Top}
            id='default'
            isConnectable={isConnectable}
            className='message-node__handle message-node__handle--target'
            aria-label='Conector de entrada'
            title='Conectar desde otro nodo'
            tabIndex={isConnectable ? 0 : -1}
            role='button'
          />
          <Handle
            type='source'
            position={Position.Bottom}
            id='default'
            isConnectable={isConnectable}
            className='message-node__handle message-node__handle--source'
            aria-label='Conector de salida'
            title='Conectar hacia otro nodo'
            tabIndex={isConnectable ? 0 : -1}
            role='button'
          />
          <span className='sr-only'>
            Nodo de mensaje tipo {messageType}. {safeData.message}
          </span>
        </>
      );
    }
  }
};

/** Componente principal MessageNode */
const MessageNodeComponent = ({
  data = {
    message: placeholder,
    type: MESSAGE_TYPES.SYSTEM,
    variables: [],
    lodLevel: LOD_LEVELS.FULL, // Valor por defecto
  },
  isConnectable = true,
  selected = false,
  id,

  onDuplicate = () => {
    // Default empty handler
  },

  onDelete = () => {
    // Default empty handler
  },
}) => {
  // Acceso seguro a los datos del nodo
  const safeData = useMemo(
    () => ({
      message: data?.message || placeholder,
      type: data?.type || MESSAGE_TYPES.SYSTEM,
      variables: data?.variables || [],
      lastUpdated: data?.lastUpdated,
    }),
    [data],
  );

  // Extraer el nivel de detalle (LOD) de los datos del nodo.
  const { lodLevel = LOD_LEVELS.FULL } = data;
  const isUltraMode = lodLevel !== LOD_LEVELS.FULL;
  const disableAnimations = isUltraMode;

  // Estados locales (preservando exactamente el comportamiento original)
  const [editState, setEditState] = useState();
  const editStateReference = useRef(editState);
  editStateReference.current = editState;
  const isEditing = editState !== undefined;

  const [nodeState, setNodeState] = useState({ isSaving: false });
  const { showContextMenu } = useContextMenu();
  const updateNodeInternals = useUpdateNodeInternals();
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  // Forzar la actualización de las dimensiones del nodo cuando se entra/sale del modo de edición.
  useLayoutEffect(() => {
    if (id) {
      // HACK: timeout para asegurar que updateNodeInternals se ejecute después del renderizado
      const timeoutId = setTimeout(() => {
        updateNodeInternals(id);
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [isEditing, id, updateNodeInternals]);

  const nodeReference = useRef();

  const messageType = useMemo(
    () => safeData.type || MESSAGE_TYPES.SYSTEM,
    [safeData.type],
  );
  const {
    saveChanges,
    handleDoubleClick,
    handleNodeContextMenu,
    editorActions,
  } = useMessageNodeCallbacks({
    editStateReference,
    setEditState,
    setNodeState,
    updateNodeData,
    updateNodeInternals,
    safeData,
    isEditing,
    id,
    onDuplicate,
    onDelete,
    showContextMenu,
  });

  const { nodeClasses, nodeStyle } = useMessageNodeStyling({
    isEditing,
    saveChanges,
    nodeReference,
    messageType,
    selected,
    isUltraMode,
  });

  const handleProperties = {
    type: 'source',
    position: Position.Bottom,
    id: 'default',
    isConnectable,
  };

  return (
    <div
      ref={nodeReference}
      className={nodeClasses}
      style={nodeStyle}
      onDoubleClick={
        lodLevel === LOD_LEVELS.FULL ? handleDoubleClick : undefined
      }
      onContextMenu={handleNodeContextMenu}
      data-testid='message-node'
      aria-labelledby={`message-node-title-${id}`}
      role='group'
    >
      {renderMessageNodeContent({
        lodLevel,
        handleProperties,
        messageType,
        safeData,
        id,
        isUltraMode,
        selected,
        handleDoubleClick,
        nodeState,
        disableAnimations,
        isEditing,
        editState,
        editorActions,
        isConnectable,
      })}
    </div>
  );
};

// Helper para comparar propiedades básicas del nodo
function _compareBasicProperties(previousProperties, nextProperties) {
  return (
    previousProperties.selected === nextProperties.selected &&
    previousProperties.isConnectable === nextProperties.isConnectable &&
    previousProperties.id === nextProperties.id
  );
}

// Helper para comparar propiedades de datos internos
function _compareDataProperties(previousData, nextData) {
  return (
    previousData.message === nextData.message &&
    previousData.type === nextData.type &&
    previousData.lastUpdated === nextData.lastUpdated &&
    previousData.lodLevel === nextData.lodLevel &&
    previousData.title === nextData.title &&
    JSON.stringify(previousData.variables) ===
      JSON.stringify(nextData.variables)
  );
}

/**
 * Compara las propiedades de dos nodos para determinar si son iguales.
 * Evita re-renderizados innecesarios comparando props relevantes.
 * @param {Object} previousProperties - Propiedades anteriores
 * @param {Object} nextProps - Nuevas propiedades
 * @returns {boolean} - `true` si las props son iguales, `false` en caso contrario.
 */
const arePropertiesEqual = (previousProperties, nextProperties) => {
  const previousData = previousProperties.data || {};
  const nextData = nextProperties.data || {};

  // Compara las propiedades principales del nodo y los datos internos.
  return (
    _compareBasicProperties(previousProperties, nextProperties) &&
    _compareDataProperties(previousData, nextData)
  );
};

MessageNodeComponent.propTypes = {
  data: PropTypes.shape({
    message: PropTypes.string,
    type: PropTypes.oneOf(Object.values(MESSAGE_TYPES)),
    variables: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        value: PropTypes.string,
      }),
    ),
    lastUpdated: PropTypes.string,
    lodLevel: PropTypes.string,
    title: PropTypes.string,
  }),
  isConnectable: PropTypes.bool,
  selected: PropTypes.bool,
  id: PropTypes.string.isRequired,
  onDuplicate: PropTypes.func,
  onDelete: PropTypes.func,
};

const MessageNode = memo(MessageNodeComponent, arePropertiesEqual);

MessageNode.displayName = 'MessageNode';

// Definimos los propTypes para el componente memoizado final

// Exportamos el componente optimizado
export default MessageNode;
