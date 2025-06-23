/**
 * @file MessageNode.jsx
 * @description Componente optimizado para representar nodos de mensaje en el editor de flujos PLUBOT.
 * Implementa diseño profesional, accesibilidad y optimización para modo normal y ultra rendimiento.
 * @author PLUBOT Team
 * @version 2.0.0
 */

import React, { useState, useEffect, useRef, useCallback, memo, useMemo, useLayoutEffect } from 'react';
import { Handle, Position, NodeResizer, useUpdateNodeInternals, useReactFlow } from 'reactflow';
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
  Save, // Añadido Save
  UserCheck,
  Trash2,
  CornerDownRight,
  Maximize2,
  Minimize2,
  Loader2
} from 'lucide-react';
import PropTypes from 'prop-types';
import Tooltip from '../../ui/ToolTip';
import ContextMenu from '../../ui/context-menu';
import { formatDateRelative, formatTime } from '@/utils/date';
// Importamos shallow de Zustand para comparaciones de estado optimizadas
import { shallow } from 'zustand/shallow';
// Importamos el store de Zustand
import { useNodeData, useFlowMeta, useFlowNodesEdges, useContextMenu } from '@/stores/selectors';
import useFlowStore from '@/stores/useFlowStore';
import ReactMarkdown from '@/lib/simplified-markdown';
import { replaceVariablesInMessage } from '@/utils/messageUtils';
import './MessageNode.css';
import './MessageNodeLOD.css';
import { MessageNodeIcon } from './MessageNodeIcon';

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
  }
};

// Constantes y configuración (Mantenemos las específicas si NODE_CONFIG no las cubre todas aún)
const DEFAULT_MESSAGE = NODE_CONFIG.DEFAULT_MESSAGE_PLACEHOLDER;
const MAX_PREVIEW_LINES = NODE_CONFIG.MAX_PREVIEW_LINES;
const TRANSITION_DURATION = NODE_CONFIG.TRANSITION_DURATION;

/**
 * Tipos de mensajes disponibles
 * @type {Object}
 */

/**
 * Tipos de mensajes disponibles
 * @type {Object}
 */
const MESSAGE_TYPES = {
  USER: 'user',      // Mensaje del usuario
  BOT: 'bot',       // Respuesta del bot
  SYSTEM: 'system', // Mensaje de sistema
  ERROR: 'error',   // Mensaje de error
  WARNING: 'warning', // Advertencia
  INFO: 'info',     // Información
  QUESTION: 'question' // Pregunta
};

// Helper function to generate titles based on message type
const typeToTitle = (type) => {
  switch (type) {
    case MESSAGE_TYPES.USER: return 'Mensaje de Usuario';
    case MESSAGE_TYPES.BOT: return 'Respuesta del Bot';
    case MESSAGE_TYPES.SYSTEM: return 'Mensaje de Sistema';
    case MESSAGE_TYPES.ERROR: return 'Error';
    case MESSAGE_TYPES.WARNING: return 'Advertencia';
    case MESSAGE_TYPES.INFO: return 'Información';
    case MESSAGE_TYPES.QUESTION: return 'Pregunta';
    default: return NODE_CONFIG.DEFAULT_TITLE_PREFIX;
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
const MessagePreview = memo(function MessagePreview({ message = '', variables = [], isUltraPerformanceMode = false }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const messageRef = useRef(null);
  const [isTruncated, setIsTruncated] = useState(false);
  
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
      const maxHeight = lineHeight * MAX_PREVIEW_LINES;
      
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
      >
        {isUltraPerformanceMode ? (
          // En modo ultra rendimiento, mostramos texto plano sin formato
          <div className="message-node__plain-text">{formattedMessage}</div>
        ) : (
          // En modo normal, usamos Markdown
          <ReactMarkdown>{formattedMessage}</ReactMarkdown>
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
              <span>Colapsar</span>
            </>
          ) : (
            <>
              <Maximize2 size={14} aria-hidden="true" />
              <span>Expandir</span>
            </>
          )}
        </button>
      )}
    </div>
  );
});


MessagePreview.propTypes = {
  message: PropTypes.string,
  variables: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      value: PropTypes.string
    })
  ),
  isUltraPerformanceMode: PropTypes.bool
};

// Valores predeterminados ahora definidos directamente en los parámetros de la función

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
  isUltraPerformanceMode = false
}) => {
  const [newVariable, setNewVariable] = useState({ name: '', value: '' });
  const [isAdding, setIsAdding] = useState(false);
  const newNameInputRef = useRef(null);
  const updateNodeInternals = useUpdateNodeInternals(); // <--- Hook de React Flow

  // Enfocar el campo de nombre al agregar una nueva variable
  useEffect(() => {
    if (isAdding && newNameInputRef.current) {
      newNameInputRef.current.focus();
    }
  }, [isAdding]);

  // Efecto para actualizar las dimensiones del nodo cuando el form de añadir aparece/desaparece
  useEffect(() => {
    if (nodeId) {
      updateNodeInternals(nodeId);
    }
  }, [isAdding, nodeId, updateNodeInternals]);

  /**
   * Iniciar la adición de una nueva variable
   */
  const handleAddClick = useCallback(() => {
    setIsAdding(true);
  }, []);

  /**
   * Cancelar la adición de una nueva variable
   */
  const handleCancelAdd = useCallback(() => {
    setIsAdding(false);
    setNewVariable({ name: '', value: '' });
  }, []);

  /**
   * Guardar una nueva variable
   */
  const handleSubmitAdd = useCallback(() => {
    if (newVariable.name.trim()) {
      onAddVariable(newVariable);
      setNewVariable({ name: '', value: '' });
      setIsAdding(false);
    }
  }, [newVariable, onAddVariable]);

  /**
   * Manejar cambios en los campos de una variable existente
   * @param {number} index - Índice de la variable
   * @param {string} field - Campo a modificar (name o value)
   * @param {string} value - Nuevo valor
   */
  const handleVariableChange = useCallback((index, field, value) => {
    onUpdateVariable(index, { ...variables[index], [field]: value });
  }, [variables, onUpdateVariable]);

  /**
   * Manejar teclas en el formulario de nueva variable
   * @param {Event} e - Evento de teclado
   */
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      handleSubmitAdd();
    } else if (e.key === 'Escape') {
      handleCancelAdd();
    }
  }, [handleSubmitAdd, handleCancelAdd]);

  const VARIABLE_EDITOR_TOOLTIP_CONTENT = `**¿Qué son las Variables?**
Son como etiquetas para guardar información que cambia, como el nombre de un cliente o una fecha.

**¿Cómo las uso?**
1.  **Crea una:** Haz clic en el botón \`+\` de abajo.
    *   **Nombre:** Un nombre corto para recordar qué es (ej: \`nombre_cliente\`).
    *   **Valor:** La información que quieres guardar (ej: \`Ana Sofía\`).
2.  **Insértala en tu mensaje:** Escribe el Nombre de tu variable entre llaves dobles, así: \`{{nombre_cliente}}\`.
    Cuando el mensaje se envíe, \`{{nombre_cliente}}\` se reemplazará automáticamente por \`Ana Sofía\`.

¡Así puedes personalizar mensajes fácilmente!`;

  return (
    <div 
      className={`message-node__variables ${isUltraPerformanceMode ? 'message-node__variables--ultra' : ''}`}
      role="region"
      aria-label="Editor de variables"
    >
      <div className="message-node__variables-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <h4 className="message-node__variables-title">Variables</h4>
        <Tooltip 
          content={<ReactMarkdown children={VARIABLE_EDITOR_TOOLTIP_CONTENT} />}
        >
          <HelpCircle size={16} className="message-node__help-icon" style={{ cursor: 'help' }} />
        </Tooltip>
        {!isAdding && (
          <button 
            type="button" 
            className="message-node__variable-button"
            onClick={handleAddClick}
            aria-label="Agregar variable"
            aria-describedby="variables-heading"
            disabled={isUltraPerformanceMode}
          >
            +
          </button>
        )}
      </div>
      
      {isAdding && !isUltraPerformanceMode && (
        <div 
          className="message-node__variable"
          role="form"
          aria-labelledby="new-variable-heading"
        >
          <span id="new-variable-heading" className="sr-only">Nueva variable</span>
          <input
            ref={newNameInputRef}
            type="text"
            placeholder="Nombre"
            value={newVariable.name}
            onChange={(e) => setNewVariable({ ...newVariable, name: e.target.value })}
            className="message-node__variable-name"
            aria-label="Nombre de variable"
            onKeyDown={handleKeyDown}
          />
          <input
            type="text"
            placeholder="Valor"
            value={newVariable.value}
            onChange={(e) => setNewVariable({ ...newVariable, value: e.target.value })}
            className="message-node__variable-value"
            aria-label="Valor de variable"
            onKeyDown={handleKeyDown}
          />
          <div className="message-node__variable-actions">
            <button 
              type="button" 
              className="message-node__variable-button"
              onClick={handleSubmitAdd}
              aria-label="Guardar variable"
            >
              <Save size={14} aria-hidden="true" />
            </button>
            <button 
              type="button" 
              className="message-node__variable-button"
              onClick={handleCancelAdd}
              aria-label="Cancelar"
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
      
      <div 
        className="message-node__variables-list"
        role="list"
        aria-label="Lista de variables"
      >
        {variables && variables.map((variable, index) => (
          <div 
            key={`var-${index}`} 
            className="message-node__variable"
            role="listitem"
          >
            <input
              type="text"
              value={variable.name}
              onChange={(e) => handleVariableChange(index, 'name', e.target.value)}
              className="message-node__variable-name"
              aria-label={`Nombre de variable ${index + 1}`}
              disabled={isUltraPerformanceMode}
            />
            <input
              type="text"
              value={variable.value}
              onChange={(e) => handleVariableChange(index, 'value', e.target.value)}
              className="message-node__variable-value"
              aria-label={`Valor de variable ${index + 1}`}
              disabled={isUltraPerformanceMode}
            />
            {!isUltraPerformanceMode && (
              <div className="message-node__variable-actions">
                <button
                  type="button"
                  className="message-node__variable-button message-node__variable-button--delete"
                  onClick={() => onDeleteVariable(index)}
                  aria-label={`Eliminar variable ${variable.name || 'sin nombre'}`}
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

VariableEditor.propTypes = {
  nodeId: PropTypes.string.isRequired, // <--- Añadir nodeId como propType
  variables: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      value: PropTypes.string
    })
  ),
  onAddVariable: PropTypes.func.isRequired,
  onUpdateVariable: PropTypes.func.isRequired,
  onDeleteVariable: PropTypes.func.isRequired,
  isUltraPerformanceMode: PropTypes.bool
};



/**
 * Componente para el ícono del nodo de mensaje
 * @param {Object} props - Propiedades del componente
 * @param {string} props.type - Tipo de mensaje (user, bot, system, etc.)
 * @param {boolean} props.isUltraPerformanceMode - Indica si está en modo ultra rendimiento
 * @returns {JSX.Element} - Ícono del nodo de mensaje
 */
const MessageNodeHeader = memo(({ 
  id, 
  titleFromData, 
  messageType, 
  isUltraMode, 
  isSaving, 
  isSelected, 
  onDoubleClickHeader,
  lastUpdatedTimestamp,
  disableAnimations // Prop recibida
}) => {
  const displayTitle = titleFromData || typeToTitle(messageType);
  const headerClasses = [
    'message-node__header',
    isSaving ? 'message-node__header--saving' : '',
    disableAnimations ? 'message-node__header--no-anim' : '', // Usar la prop
    isSelected ? 'message-node__header--selected' : '' // Mantener si es necesario
  ].filter(Boolean).join(' ');

  return (
    <header className={headerClasses} onDoubleClick={onDoubleClickHeader}>
      <div className="message-node__title-container">
        <MessageNodeIcon type={messageType} isUltraPerformanceMode={isUltraMode} />
        <h2 className="message-node__title" title={displayTitle}>{displayTitle}</h2>
      </div>
      <div className="message-node__header-actions"> {/* Contenedor para acciones del header */}
        {isSaving && <SavingIndicator />}
        {!isUltraMode && lastUpdatedTimestamp && (
          <Tooltip content={`Última modificación: ${formatDateRelative(lastUpdatedTimestamp)} a las ${formatTime(lastUpdatedTimestamp)}`}>
            <Clock size={12} className="message-node__timestamp-icon" aria-hidden="true" />
          </Tooltip>
        )}
      </div>
    </header>
  );
}); // Corregido el cierre del componente MessageNodeHeader

MessageNodeHeader.propTypes = {
  id: PropTypes.string.isRequired,
  titleFromData: PropTypes.string,
  messageType: PropTypes.string,
  isUltraMode: PropTypes.bool,
  isSaving: PropTypes.bool,
  isSelected: PropTypes.bool,
  onDoubleClickHeader: PropTypes.func,
  lastUpdatedTimestamp: PropTypes.string, // Cambiado de number a string si es un timestamp ISO
  disableAnimations: PropTypes.bool // PropType para disableAnimations
};

const MessageNodeEditor = memo(({
  id,
  message,
  variables,
  DEFAULT_MESSAGE,
  editorActions,
}) => {
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
      className="message-node__textarea nodrag"
      value={message}
      onChange={handleMessageChange}
      placeholder={DEFAULT_MESSAGE}
      aria-label="Editor de mensaje"
      rows={4}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          handleCancel();
        }
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
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
    <div className="message-node__editor-actions">
      <Tooltip content="Guardar cambios (Ctrl+Enter o Cmd+Enter)">
        <button onClick={handleSave} className="message-node__editor-button message-node__editor-button--save" aria-label="Guardar mensaje">
          <Send size={14} /> Guardar
        </button>
      </Tooltip>
      <Tooltip content="Descartar cambios (Esc)">
        <button onClick={handleCancel} className="message-node__editor-button message-node__editor-button--cancel" aria-label="Cancelar edición">
          <X size={14} /> Cancelar
        </button>
      </Tooltip>
    </div>
  </>
  );
});

MessageNodeEditor.propTypes = {
  id: PropTypes.string.isRequired,
  message: PropTypes.string,
  variables: PropTypes.array,
  DEFAULT_MESSAGE: PropTypes.string,
  editorActions: PropTypes.shape({
    handleMessageChange: PropTypes.func.isRequired,
    handleSave: PropTypes.func.isRequired,
    handleCancel: PropTypes.func.isRequired,
    handleAddVariable: PropTypes.func.isRequired,
    handleUpdateVariable: PropTypes.func.isRequired,
    handleDeleteVariable: PropTypes.func.isRequired,
  }).isRequired,
};

const MessageNodeContent = memo(({
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
      <main className="message-node__content" role="main" id={`message-node-content-${id}`}>
        <div className="message-node__content message-node__content--ultra">
          <p className="message-node__ultra-text">
            {(() => {
              if (!safeData.message) return DEFAULT_MESSAGE;
              const processedMessage = replaceVariablesInMessage(safeData.message, safeData.variables);
              return processedMessage.substring(0, 50) + (processedMessage.length > 50 ? '...' : '');
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
    <main className="message-node__content" role="main" id={`message-node-content-${id}`}>
      {isEditing ? (
        <div className="message-node__editor" onDoubleClick={(e) => e.stopPropagation()}>
          <MessageNodeEditor
            id={id}
            message={editState?.message ?? ''}
            variables={editState?.variables ?? []}
            DEFAULT_MESSAGE={DEFAULT_MESSAGE}
            editorActions={editorActions}
          />
        </div>
      ) : (
        <div className="message-node__preview-display">
          <MessagePreview
            message={safeData.message || DEFAULT_MESSAGE}
            variables={safeData.variables}
            isUltraPerformanceMode={isUltraMode}
          />
        </div>
      )}
    </main>
  );
});

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
    <div className="message-node__saving-indicator" aria-live="polite" aria-label="Guardando cambios">
      <Loader2 size={14} className="animate-spin" /> {/* Usando Loader2 de lucide-react con animación */} 
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
  <div className="message-node__mini-content">
    <MessageNodeIcon type={messageType} isUltraPerformanceMode={true} />
  </div>
));
MiniView.displayName = 'MiniView';
MiniView.propTypes = { messageType: PropTypes.string };


// Vista para el nivel de detalle COMPACTO
const CompactView = memo(({ messageType, title, message, variables }) => {
  const processedMessage = useMemo(() => {
    if (!message) return DEFAULT_MESSAGE;
    const processed = replaceVariablesInMessage(message, variables);
    return processed.length > 50 ? `${processed.substring(0, 50)}...` : processed;
  }, [message, variables]);

  return (
    <div className="message-node__compact-content">
      <div className="message-node__compact-header">
        <MessageNodeIcon type={messageType} isUltraPerformanceMode={true} />
        <span className="message-node__compact-title">{title}</span>
      </div>
      <div className="message-node__compact-message">
        {processedMessage}
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


/**
 * Componente principal MessageNode
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.data - Datos del nodo
 * @param {boolean} props.isConnectable - Indica si el nodo puede conectarse
 * @param {boolean} props.selected - Indica si el nodo está seleccionado
 * @param {string} props.id - Identificador único del nodo
 * @param {Function} props.setNodes - Función para actualizar los nodos
 * @param {boolean} props.isUltraPerformanceMode - Indica si está en modo ultra rendimiento
 * @returns {JSX.Element} - Componente MessageNode
 */
const MessageNodeComponent = ({ 
  data = {
    message: DEFAULT_MESSAGE,
    type: MESSAGE_TYPES.SYSTEM,
    variables: [],
    lodLevel: LOD_LEVELS.FULL, // Valor por defecto
  }, 
  isConnectable = true, 
  selected = false, 
  id, 
  setNodes: legacySetNodes, // Mantener compatibilidad con implementación existente
  onEdit = () => {},
  onDuplicate = () => {},
  onDelete = () => {}
}) => {
  
  // Acceso seguro a los datos del nodo
  const safeData = useMemo(() => ({
    message: data?.message || DEFAULT_MESSAGE,
    type: data?.type || MESSAGE_TYPES.SYSTEM,
    variables: data?.variables || [],
    lastUpdated: data?.lastUpdated
  }), [data]);
  
  // Extraer el nivel de detalle (LOD) de los datos del nodo.
  const { lodLevel = LOD_LEVELS.FULL } = data;
  const isUltraMode = lodLevel !== LOD_LEVELS.FULL;
  const disableAnimations = isUltraMode;

  // Estados locales (preservando exactamente el comportamiento original)
  const [isResizing, setIsResizing] = useState(false);
  // screenToFlowPosition se obtiene de useReactFlow, pero no lo usaremos aquí directamente para el menú contextual global.
  const [editState, setEditState] = useState(null);
  const editStateRef = useRef(editState);
  editStateRef.current = editState;

  // El modo de edición se deriva de la existencia de `editState`.
  // Este es el patrón de estado derivado: una única fuente de verdad.
  const isEditing = editState !== null;
  const [showVariables, setShowVariables] = useState(false);
  const [nodeState, setNodeState] = useState({ isSaving: false });
  const { showContextMenu, hideContextMenu } = useContextMenu();
  const updateNodeInternals = useUpdateNodeInternals();
  const updateNodeData = useFlowStore(state => state.updateNodeData);

  // Forzar la actualización de las dimensiones del nodo cuando se entra/sale del modo de edición.
  // Esto es CRUCIAL para que el contenedor del nodo se expanda y contraiga correctamente.
  // Se usa useLayoutEffect para evitar un "salto" visual, ya que se ejecuta
  // después de la mutación del DOM pero antes de que el navegador pinte la pantalla.
  useLayoutEffect(() => {
    if (id) {
      // HACK: Se usa un timeout para asegurar que la actualización de las dimensiones
      // se ejecute DESPUÉS de que el DOM haya tenido tiempo de renderizar el nuevo contenido
      // (editor o preview). Esto soluciona problemas de temporización donde updateNodeInternals
      // se ejecuta antes de que el contenido tenga su tamaño final.
      const timeoutId = setTimeout(() => {
        updateNodeInternals(id);
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [isEditing, id, updateNodeInternals]);

  // Sincronizar estado local con props actualizadas desde Zustand
  
  
  // Compatibilidad con el setNodes proporcionado por props
  const setNodes = legacySetNodes || useFlowStore.getState().setNodes;
  
  // Referencias
  const nodeRef = useRef(null);
  
  // Hooks personalizados eliminados ya que implementamos la lógica directamente

  /**
   * Tipo de mensaje (user, bot, system, etc.)
   * Memoizado para evitar cálculos innecesarios
   */
  const messageType = useMemo(() => safeData.type || MESSAGE_TYPES.SYSTEM, [safeData.type]);

  /**
   * Manejar doble clic para editar el nodo
   * Solo si no está en modo ultra rendimiento
   */
  /**
   * Guardar cambios en el nodo
   */
  const saveChanges = useCallback(() => {
    const currentEditState = editStateRef.current;
    if (!currentEditState || !currentEditState.message) {

      setEditState(null);
      return;
    }

    setNodeState({ isSaving: true });

    updateNodeData(id, {
      message: currentEditState.message,
      variables: currentEditState.variables
    });

    setEditState(null);
    updateNodeInternals(id);

    setTimeout(() => {
      setNodeState({ isSaving: false });
    }, 300);
  }, [id, updateNodeData, updateNodeInternals, setNodeState, setEditState, editStateRef]);

  /**
   * Cancelar edición y restaurar valores originales
   */
  const cancelEdit = useCallback(() => {
    setEditState(null);
  }, [setEditState]);

  /**
   * Manejar cambios en el texto del mensaje
   */
  const handleMessageChange = useCallback((e) => {
    setEditState(prev => ({ ...prev, message: e.target.value }));
  }, [setEditState]);

  /**
   * Agregar una nueva variable
   */
  const handleAddVariable = useCallback((newVar) => {
    setEditState(prev => ({
      ...prev,
      variables: [...(prev.variables || []), newVar]
    }));
  }, [setEditState]);

  /**
   * Actualizar una variable existente
   */
  const handleUpdateVariable = useCallback((index, updatedVar) => {
    setEditState(prev => ({
      ...prev,
      variables: prev.variables.map((v, i) => (i === index ? updatedVar : v))
    }));
  }, [setEditState]);

  /**
   * Eliminar una variable
   */
  const handleDeleteVariable = useCallback((index) => {
    setEditState(prev => ({
      ...prev,
      variables: prev.variables.filter((_, i) => i !== index)
    }));
  }, [setEditState]);

  /**
   * Manejar doble clic para editar el nodo
   */
  const handleDoubleClick = useCallback(() => {
    if (isEditing) {
      saveChanges();
    } else {
      setEditState({
        message: safeData.message || DEFAULT_MESSAGE,
        variables: safeData.variables || []
      });
    }
  }, [isEditing, saveChanges, safeData.message, safeData.variables, setEditState]);

  /**
   * Opciones del menú contextual
   */
  const contextMenuOptions = useMemo(() => [
    {
      label: 'Editar',
      icon: <Edit2 size={14} aria-hidden="true" />,
      action: handleDoubleClick,
      disabled: isEditing
    },
    {
      label: 'Duplicar',
      icon: <Copy size={14} aria-hidden="true" />,
      action: () => onDuplicate(id),
      disabled: false
    },
    {
      label: 'Eliminar',
      icon: <Trash2 size={14} aria-hidden="true" />,
      action: () => onDelete(id),
      isDanger: true,
      disabled: isEditing
    }
  ], [isEditing, id, onDuplicate, onDelete, handleDoubleClick]);

  const handleNodeContextMenu = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    
    const x = event.clientX;
    const y = event.clientY;
    
    showContextMenu(x, y, id, contextMenuOptions);
  }, [id, contextMenuOptions, showContextMenu]);

  const editorActions = useMemo(() => ({
    handleMessageChange,
    handleSave: saveChanges,
    handleCancel: cancelEdit,
    handleAddVariable,
    handleUpdateVariable,
    handleDeleteVariable,
  }), [cancelEdit, handleAddVariable, handleDeleteVariable, handleMessageChange, handleUpdateVariable, saveChanges]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (nodeRef.current && !nodeRef.current.contains(event.target) && isEditing) {
        saveChanges();
      }
    };

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing, saveChanges]);

  // El useLayoutEffect anterior se elimina porque la animación ahora es manejada puramente por CSS,
  // lo que proporciona una transición más suave y performante sin necesidad de forzar actualizaciones.



  /**
   * Clases CSS del nodo
   * Incluye variantes por tipo y estado
   * Optimizado para rendimiento con memoización
   */
  const nodeClasses = useMemo(() => {
    const classes = ['message-node', `message-node--${messageType}`];
    if (selected) classes.push('selected');
    if (isUltraMode) classes.push('ultra-performance');
    return classes.join(' ');
  }, [messageType, selected, isUltraMode]);

  const nodeStyle = useMemo(() => {
    const styles = {};
    // Los estilos dinámicos basados en isUltraMode o selected se pueden agregar aquí.
    // Por ejemplo:
    // if (isUltraMode) { // isUltraMode aquí se refiere al definido en el alcance del componente
    //   styles.opacity = 0.8;
    // }
    // if (selected) { // selected aquí se refiere al definido en el alcance del componente
    //   styles.outline = '2px solid var(--message-node-primary, #2563eb)';
    // }
    return styles;
  }, [isUltraMode, selected]); // Dependencias correctas: isUltraMode y selected del alcance del componente

 // Dependencias del efecto (zoomLevel removido ya que isUltraMode lo cubre)
  


  /**
   * Renderizar el componente MessageNode
   */
  return (
    <div
      ref={nodeRef}
      className={nodeClasses}
      style={nodeStyle}
      onDoubleClick={lodLevel === LOD_LEVELS.FULL ? handleDoubleClick : undefined}
      onContextMenu={handleNodeContextMenu}
      data-testid="message-node"
      aria-labelledby={`message-node-title-${id}`}
      role="group"
      tabIndex={0}
    >
      {(() => {
        const handleProps = {
          type: "source",
          position: Position.Bottom,
          id: "default",
          isConnectable: isConnectable,
        };

        switch (lodLevel) {
          case LOD_LEVELS.MINI:
            return (
              <>
                <Handle {...handleProps} type="target" position={Position.Top} className={`message-node__handle message-node__handle--target message-node__handle--ultra`} />
                <Handle {...handleProps} type="source" position={Position.Bottom} className={`message-node__handle message-node__handle--source message-node__handle--ultra`} />
                <MiniView messageType={messageType} />
              </>
            );

          case LOD_LEVELS.COMPACT:
            return (
              <>
                <Handle {...handleProps} type="target" position={Position.Top} className={`message-node__handle message-node__handle--target message-node__handle--ultra`} />
                <Handle {...handleProps} type="source" position={Position.Bottom} className={`message-node__handle message-node__handle--source message-node__handle--ultra`} />
                <CompactView 
                  messageType={messageType} 
                  title={typeToTitle(messageType)}
                  message={safeData.message}
                  variables={safeData.variables}
                />
              </>
            );

          default: // FULL
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
                  DEFAULT_MESSAGE={DEFAULT_MESSAGE}
                  editState={editState}
                  editorActions={editorActions}
                />
                {!isEditing && safeData.lastUpdated && !isUltraMode && (
                  <footer className="message-node__footer">
                    <div className="message-node__timestamp">
                      <Clock size={12} aria-hidden="true" />
                      <span title={formatTime(safeData.lastUpdated)}>
                        {formatDateRelative(safeData.lastUpdated)}
                      </span>
                    </div>
                  </footer>
                )}
                <Handle
                  type="target"
                  position={Position.Top}
                  id="default"
                  isConnectable={isConnectable}
                  className={`message-node__handle message-node__handle--target`}
                  aria-label="Conector de entrada"
                  title="Conectar desde otro nodo"
                  tabIndex={isConnectable ? 0 : -1}
                  role="button"
                />
                <Handle
                  type="source"
                  position={Position.Bottom}
                  id="default"
                  isConnectable={isConnectable}
                  className={`message-node__handle message-node__handle--source`}
                  aria-label="Conector de salida"
                  title="Conectar hacia otro nodo"
                  tabIndex={isConnectable ? 0 : -1}
                  role="button"
                />
                <span className="sr-only">
                  Nodo de mensaje tipo {messageType}. {safeData.message}
                </span>
              </>
            );
        }
      })()}
    </div>
  );
};

/**
 * Función de comparación personalizada para React.memo.
 * Evita re-renderizados innecesarios comparando props relevantes.
 * @param {Object} prevProps - Propiedades anteriores
 * @param {Object} nextProps - Nuevas propiedades
 * @returns {boolean} - `true` si las props son iguales, `false` en caso contrario.
 */
const arePropsEqual = (prevProps, nextProps) => {
  // Comparación de props primitivas y de primer nivel
  if (
    prevProps.selected !== nextProps.selected ||
    prevProps.isConnectable !== nextProps.isConnectable ||
    prevProps.id !== nextProps.id
  ) {
    return false;
  }

  const prevData = prevProps.data || {};
  const nextData = nextProps.data || {};

  // Comparación de campos clave del objeto `data`
  if (
    prevData.message !== nextData.message ||
    prevData.type !== nextData.type ||
    prevData.lastUpdated !== nextData.lastUpdated ||
    prevData.lodLevel !== nextData.lodLevel ||
    prevData.title !== nextData.title
  ) {
    return false;
  }

  // Comparación profunda pragmática para el array de variables.
  // JSON.stringify es una solución aceptable aquí para evitar comparaciones complejas
  // y dado que el array no debería ser masivo.
  if (JSON.stringify(prevData.variables) !== JSON.stringify(nextData.variables)) {
    return false;
  }

  // Si ninguna de las comprobaciones anteriores falló, las props son iguales
  return true;
};

// Envolvemos el componente con React.memo y la función de comparación personalizada
const MessageNode = memo(MessageNodeComponent, arePropsEqual);

// Asignamos un nombre para facilitar la depuración en React DevTools
MessageNode.displayName = 'MessageNode';

// Definimos los propTypes para el componente memoizado final
MessageNode.propTypes = {
  data: PropTypes.shape({
    message: PropTypes.string,
    type: PropTypes.oneOf(Object.values(MESSAGE_TYPES)),
    variables: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        value: PropTypes.string
      })
    ),
    lastUpdated: PropTypes.string,
    lodLevel: PropTypes.string,
    title: PropTypes.string,
  }),
  isConnectable: PropTypes.bool,
  selected: PropTypes.bool,
  id: PropTypes.string.isRequired,
  setNodes: PropTypes.func, // Para compatibilidad
  onEdit: PropTypes.func,
  onDuplicate: PropTypes.func,
  onDelete: PropTypes.func,
};

// Exportamos el componente optimizado
export default MessageNode;
