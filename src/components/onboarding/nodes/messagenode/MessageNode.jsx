/**
 * @file MessageNode.jsx
 * @description Componente optimizado para representar nodos de mensaje en el editor de flujos PLUBOT.
 * Implementa diseño profesional, accesibilidad y optimización para modo normal y ultra rendimiento.
 * @author PLUBOT Team
 * @version 2.0.0
 */

import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
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
import useFlowStore from '@/stores/useFlowStore';
import ReactMarkdown from '@/lib/simplified-markdown';
import { replaceVariablesInMessage } from '@/utils/messageUtils';
import './MessageNode.css';

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
const MessageNodeIcon = memo(({ type, isUltraPerformanceMode = false }) => {
  // Tamaño y grosor optimizados para legibilidad
  const iconProps = { 
    size: 16, 
    strokeWidth: 2,
    // En modo ultra rendimiento, desactivamos animaciones
    className: isUltraPerformanceMode ? '' : 'message-node__icon-svg'
  };
  
  /**
   * Devuelve el ícono correspondiente al tipo de mensaje
   * @returns {JSX.Element} - Ícono SVG
   */
  const getIcon = () => {
    switch (type) {
      case MESSAGE_TYPES.USER:
        return <User {...iconProps} aria-hidden="true" />;
      case MESSAGE_TYPES.BOT:
        return <Bot {...iconProps} aria-hidden="true" />;
      case MESSAGE_TYPES.ERROR:
        return <AlertCircle {...iconProps} aria-hidden="true" />;
      case MESSAGE_TYPES.WARNING:
        return <AlertTriangle {...iconProps} aria-hidden="true" />;
      case MESSAGE_TYPES.INFO:
        return <Info {...iconProps} aria-hidden="true" />;
      case MESSAGE_TYPES.QUESTION:
        return <HelpCircle {...iconProps} aria-hidden="true" />;
      case MESSAGE_TYPES.SYSTEM:
      default:
        return <MessageSquare {...iconProps} aria-hidden="true" />;
    }
  };

  return (
    <div 
      className={`message-node__icon message-node__icon--${type || 'system'}`}
      role="img"
      aria-label={`Tipo de mensaje: ${type || 'sistema'}`}
    >
      {getIcon()}
    </div>
  );
});

const MemoizedMessageNodeIcon = memo(MessageNodeIcon);

// Hook para el menú contextual
const useContextMenu = () => {
  const { showContextMenu, hideContextMenu, contextMenuPosition, contextMenuNodeId, contextMenuItems } = useFlowStore(state => ({ 
    showContextMenu: state.showContextMenu,
    hideContextMenu: state.hideContextMenu,
    contextMenuPosition: state.contextMenuPosition, // Assuming these exist in store for ContextMenu component
    contextMenuNodeId: state.contextMenuNodeId,
    contextMenuItems: state.contextMenuItems
  }), shallow);
  // This hook now primarily fetches state for a global ContextMenu component if that's the pattern.
  // If MessageNode handles its own ContextMenu rendering, then show/hide is enough.
  return { showContextMenu, hideContextMenu, contextMenuPosition, contextMenuNodeId, contextMenuItems };
};
MemoizedMessageNodeIcon.propTypes = {
  type: PropTypes.oneOf(Object.values(MESSAGE_TYPES)),
  isUltraPerformanceMode: PropTypes.bool
};

// Valores predeterminados ahora definidos directamente en los parámetros de la función

/**
 * Componente para la vista previa del mensaje con soporte para Markdown y truncado inteligente
 * @param {Object} props - Propiedades del componente
 * @param {string} props.message - Contenido del mensaje
 * @param {Array} props.variables - Variables para reemplazar en el mensaje
 * @param {boolean} props.isUltraPerformanceMode - Indica si está en modo ultra rendimiento
 * @returns {JSX.Element} - Vista previa del mensaje formateada
 */
const MessagePreview = memo(({ message = '', variables = [], isUltraPerformanceMode = false }) => {
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
        style={{
          // En modo ultra rendimiento o expandido, no aplicamos límite de altura
          maxHeight: (!isUltraPerformanceMode && !isExpanded) 
            ? `calc(${MAX_PREVIEW_LINES}em * 1.5)` 
            : 'none'
        }}
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

const MemoizedMessagePreview = memo(MessagePreview);
MemoizedMessagePreview.propTypes = {
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
  variables, 
  onAddVariable, 
  onUpdateVariable, 
  onDeleteVariable,
  isUltraPerformanceMode 
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

  return (
    <div 
      className={`message-node__variables ${isUltraPerformanceMode ? 'message-node__variables--ultra' : ''}`}
      role="region"
      aria-label="Editor de variables"
    >
      <div className="message-node__variables-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <h4 className="message-node__variables-title">Variables</h4>
        <Tooltip 
          content="**¿Qué son las Variables?**\nSon como etiquetas para guardar información que cambia, como el nombre de un cliente o una fecha.\n\n**¿Cómo las uso?**\n1.  **Crea una:** Haz clic en el botón `+` de abajo.\n    *   **Nombre:** Un nombre corto para recordar qué es (ej: `nombre_cliente`).\n    *   **Valor:** La información que quieres guardar (ej: `Ana Sofía`).\n2.  **Insértala en tu mensaje:** Escribe el Nombre de tu variable entre llaves dobles, así: `{{nombre_cliente}}`.\n    Cuando el mensaje se envíe, `{{nombre_cliente}}` se reemplazará automáticamente por `Ana Sofía`.\n\n¡Así puedes personalizar mensajes fácilmente!"
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

VariableEditor.defaultProps = {
  variables: [],
  isUltraPerformanceMode: false
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

/**
 * Componente para el contenido del nodo de mensaje
 * @param {Object} props - Propiedades del componente
 * @param {string} props.id - Identificador único del nodo
 * @param {Object} props.data - Datos del nodo
 * @param {boolean} props.isEditing - Indica si el nodo está en modo edición
 * @param {boolean} props.isUltraMode - Indica si está en modo ultra rendimiento
 * @param {Function} props.onUpdateNodeData - Función para actualizar los datos del nodo
 * @param {Object} props.safeData - Datos procesados del nodo (con valores por defecto)
 * @param {string} props.message - Mensaje actual del nodo
 * @param {Array} props.variables - Variables actuales del nodo
 * @param {Function} props.handleMessageChange - Función para manejar cambios en el mensaje
 * @param {Function} props.handleSave - Función para guardar cambios
 * @param {Function} props.handleCancel - Función para cancelar edición
 * @param {Function} props.handleAddVariable - Función para agregar una nueva variable
 * @param {Function} props.handleUpdateVariable - Función para actualizar una variable existente
 * @param {Function} props.handleDeleteVariable - Función para eliminar una variable
 * @returns {JSX.Element} - Contenido del nodo de mensaje
 */
const MessageNodeContent = memo(({
  id, 
  message,
  variables,
  isEditing,
  isUltraMode,
  onUpdateNodeData,
  safeData, 
  DEFAULT_MESSAGE,
  handleMessageChange,
  handleSave,
  handleCancel,
  handleAddVariable,
  handleUpdateVariable,
  handleDeleteVariable
}) => {
  const renderUltraContent = () => (
    <div className="message-node__content message-node__content--ultra">
      <p className="message-node__ultra-text">
        {(() => {
          if (!safeData.message) return DEFAULT_MESSAGE;
          const processedMessage = replaceVariablesInMessage(safeData.message, safeData.variables);
          return processedMessage.substring(0, 50) + (processedMessage.length > 50 ? '...' : '');
        })()}
      </p>
      {safeData.variables && safeData.variables.length > 0 && (
        <div className="message-node__variables-count-ultra">
          {safeData.variables.length} var.
        </div>
      )}
    </div>
  );

  return (
    <main className="message-node__content" role="main" id={`message-node-content-${id}`}>
      {isUltraMode && !isEditing ? (
        renderUltraContent()
      ) : (
        <>
          <div className={`message-node__editor ${isEditing ? 'message-node__editor--active' : ''}`}>
            {isEditing && ( // Conditionally render editor internals
              <>
                <textarea
                  className="message-node__textarea nodrag"
                  value={message} // Usa estado local currentMessage
                  onChange={handleMessageChange}
                  placeholder={DEFAULT_MESSAGE}
                  aria-label="Editor de mensaje"
                  rows={4} 
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      e.stopPropagation(); // Evitar que se propague a otros listeners de 'Escape'
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
                  variables={variables} // Usar el estado local 'variables' que se sincroniza con props
                  onAddVariable={handleAddVariable} // Conectar a la función correcta de MessageNode
                  onUpdateVariable={handleUpdateVariable} // Conectar a la función correcta de MessageNode
                  onDeleteVariable={handleDeleteVariable} // Conectar a la función correcta de MessageNode
                  isUltraPerformanceMode={isUltraMode && !isEditing} /* VariableEditor completo si se está editando */
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
            )}
          </div>

          <div className={`message-node__preview-display ${!isEditing ? 'message-node__preview-display--active' : ''}`}>
            {!isEditing && ( // Conditionally render preview internals
              <MessagePreview
                message={safeData.message || DEFAULT_MESSAGE} // Muestra el mensaje guardado de safeData
                variables={safeData.variables}
                isUltraPerformanceMode={isUltraMode}
              />
            )}
          </div>
        </>
      )}
    </main>
  );
});

MessageNodeContent.propTypes = {
  id: PropTypes.string.isRequired,
  message: PropTypes.string,
  variables: PropTypes.array,
  isEditing: PropTypes.bool,
  isUltraMode: PropTypes.bool,
  onUpdateNodeData: PropTypes.func.isRequired,
  safeData: PropTypes.object.isRequired,
  DEFAULT_MESSAGE: PropTypes.string,
  handleMessageChange: PropTypes.func,
  handleSave: PropTypes.func,
  handleCancel: PropTypes.func,
  handleAddVariable: PropTypes.func.isRequired,
  handleUpdateVariable: PropTypes.func.isRequired,
  handleDeleteVariable: PropTypes.func.isRequired,
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
const MessageNode = memo(({ 
  data = {
    message: DEFAULT_MESSAGE,
    type: MESSAGE_TYPES.SYSTEM,
    variables: []
  }, 
  isConnectable = true, 
  selected = false, 
  id, 
  setNodes: legacySetNodes, // Mantener compatibilidad con implementación existente
  isUltraPerformanceMode = false, 
  performanceMode = false,
  onEdit = () => {},
  onDuplicate = () => {},
  onDelete = () => {}
}) => {
  console.log(`[MessageNode ${id} RENDER] data.variables received in props:`, data?.variables ? JSON.parse(JSON.stringify(data.variables)) : data?.variables);
  // Acceso seguro a los datos del nodo
  const safeData = useMemo(() => ({
    message: data?.message || DEFAULT_MESSAGE,
    type: data?.type || MESSAGE_TYPES.SYSTEM,
    variables: data?.variables || [],
    lastUpdated: data?.lastUpdated
  }), [data]);
  
  // Determinar si estamos en modo ultra rendimiento
  // Usar performanceMode como fallback para isUltraPerformanceMode (compatibilidad)
  const isUltraMode = isUltraPerformanceMode || performanceMode || false;
  
  // Obtener el estado de las animaciones globales desde Zustand
  const globalDisableAnimations = useFlowStore(state => state.disableAnimations);
  // Determinar si las animaciones deben estar deshabilitadas para este nodo
  const disableAnimations = isUltraMode || globalDisableAnimations;

  // Integramos Zustand para operaciones específicas del nodo
  const { 
    updateMessageNodeContent,
    updateMessageNodeType,
    updateMessageNodeData,
    addMessageNodeVariable,
    updateMessageNodeVariable,
    deleteMessageNodeVariable,
    duplicateNode,
    removeNode
  } = useFlowStore(state => ({
    updateMessageNodeContent: state.updateMessageNodeContent || ((nodeId, message) => {
      // Fallback si la acción no existe en el store
      state.updateNode(nodeId, { message, lastUpdated: new Date().toISOString() });
    }),
    updateMessageNodeType: state.updateMessageNodeType || ((nodeId, type) => {
      state.updateNode(nodeId, { type, lastUpdated: new Date().toISOString() });
    }),
    updateMessageNodeData: state.updateMessageNodeData || ((nodeId, data) => {
      state.updateNode(nodeId, { ...data, lastUpdated: new Date().toISOString() });
    }),
    addMessageNodeVariable: state.addMessageNodeVariable,
    updateMessageNodeVariable: state.updateMessageNodeVariable,
    deleteMessageNodeVariable: state.deleteMessageNodeVariable,
    duplicateNode: state.duplicateNode,
    removeNode: state.removeNode
  }), shallow);
  
  // Estados locales (preservando exactamente el comportamiento original)
  const [isResizing, setIsResizing] = useState(false);
  // screenToFlowPosition se obtiene de useReactFlow, pero no lo usaremos aquí directamente para el menú contextual global.
  const [isEditing, setIsEditing] = useState(false);
  const [showVariables, setShowVariables] = useState(false);
  const [message, setMessage] = useState(safeData.message);
  const [variables, setVariables] = useState(data.variables || []); // Inicializar desde data.variables
  const [nodeState, setNodeState] = useState({ isSaving: false });
  const { showContextMenu, hideContextMenu } = useContextMenu();
  const updateNodeInternals = useUpdateNodeInternals();

  // Sincronizar estado local con props actualizadas desde Zustand
  useEffect(() => {
    const currentId = id || data.id; // Asegurar que tenemos un ID para los logs
    console.log(`[MessageNode ${currentId}] useEffect SYNC START. data.variables from props:`, JSON.parse(JSON.stringify(data.variables || [])));
    console.log(`[MessageNode ${currentId}] useEffect SYNC. Local 'variables' state BEFORE sync:`, JSON.parse(JSON.stringify(variables || [])));

    const newPropsVars = data.variables || [];
    const currentLocalVars = variables || [];

    // Comparación profunda (simplificada con JSON.stringify, considera una librería para casos complejos)
    const newPropsVarsString = JSON.stringify(newPropsVars);
    const currentLocalVarsString = JSON.stringify(currentLocalVars);

    if (newPropsVarsString !== currentLocalVarsString) {
      console.log(`[MessageNode ${currentId}] Variables differ. Updating local state.`);
      console.log(`[MessageNode ${currentId}]   Current local (string):`, currentLocalVarsString);
      console.log(`[MessageNode ${currentId}]   New from props (string):`, newPropsVarsString);
      console.log(`[MessageNode ${currentId}] Calling setVariables with:`, JSON.parse(JSON.stringify(newPropsVars)));
      setVariables(newPropsVars);
      console.log(`[MessageNode ${currentId}] Called setVariables.`);
    } else {
      console.log(`[MessageNode ${currentId}] Variables are the same (strings). No local state update needed.`);
    }
    console.log(`[MessageNode ${currentId}] useEffect SYNC END.`);
  }, [data.variables, id]); // Depender directamente de data.variables

  useEffect(() => {
    setMessage(safeData.message);
  }, [safeData.message]);
  
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
  const handleDoubleClick = useCallback(() => {
    if (!isEditing) { // Permitir edición incluso en modo ultra
      setIsEditing(true);
    }
  }, [isEditing, isUltraMode]);

  /**
   * Opciones del menú contextual
   * Desactivadas en modo ultra rendimiento
   */
  const contextMenuOptions = useMemo(() => [
    {
      label: 'Editar',
      icon: <Edit2 size={14} aria-hidden="true" />,
      action: () => setIsEditing(true),
      disabled: false
    },
    {
      label: 'Duplicar',
      icon: <Copy size={14} aria-hidden="true" />,
      action: () => {
        if (duplicateNode) {
          duplicateNode(id);
        }
      },
      disabled: false
    },
    {
      label: 'Eliminar',
      icon: <Trash2 size={14} aria-hidden="true" />,
      action: () => {
        if (removeNode) {
          removeNode(id);
        }
      },
      isDanger: true,
      disabled: isEditing // No permitir eliminar si se está editando
    }
  ], [isUltraMode, isEditing, id, duplicateNode, removeNode, setIsEditing, hideContextMenu]);

  const handleNodeContextMenu = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Usar las coordenadas del clic del viewport directamente para el menú contextual global
    const x = event.clientX;
    const y = event.clientY;
    
    console.log(`[MessageNode] Mostrando menú contextual en (viewport coords): x=${x}, y=${y} para nodo ${id}`);
    
    showContextMenu(x, y, id, contextMenuOptions);
  }, [id, contextMenuOptions, showContextMenu]);

  /**
   * Manejar clic fuera del nodo para guardar cambios
   */
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
  }, [isEditing, message, variables]);

  /**
   * Guardar cambios en el nodo
   */
  const saveChanges = useCallback(() => {
    // Usamos la acción de Zustand cuando está disponible, manteniendo compatibilidad con setNodes
    if (updateMessageNodeData) {
      // Usar acción específica de Zustand
      updateMessageNodeData(id, {
        message,
        variables
      });
    } else {
      // Fallback a la implementación original para mantener compatibilidad
      setNodes((nds) =>
        nds.map((node) =>
          node.id === id
            ? {
                ...node,
                data: {
                  ...node.data,
                  message,
                  variables,
                  lastUpdated: new Date().toISOString()
                }
              }
            : node
        )
      );
    }
    setIsEditing(false);
  }, [id, setNodes, updateMessageNodeData, message, variables]);

  /**
   * Cancelar edición y restaurar valores originales
   */
  const cancelEdit = useCallback(() => {
    setMessage(safeData.message || DEFAULT_MESSAGE);
    setVariables(safeData.variables || []);
    setIsEditing(false);
  }, [safeData.message, safeData.variables]);

  /**
   * Manejar cambios en el texto del mensaje
   * @param {Event} e - Evento de cambio
   */
  const handleMessageChange = useCallback((e) => {
    setMessage(e.target.value);
  }, []);

  /**
   * Manejar atajos de teclado
   * @param {KeyboardEvent} e - Evento de teclado
   */
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      cancelEdit();
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      saveChanges();
    }
  }, [cancelEdit, saveChanges]);

  // Funciones para manejar variables
  /**
   * Agregar una nueva variable
   * @param {Object} newVar - Nueva variable
   */
  const handleAddVariable = useCallback((newVar) => {
    // Mantener el estado local actualizado para la edición en curso
    setVariables(prev => [...(prev || []), newVar]);
    
    // Si no estamos en modo edición, actualizar también a través de Zustand
    if (!isEditing && addMessageNodeVariable) {
      addMessageNodeVariable(id, newVar);
    }
  }, [id, isEditing, addMessageNodeVariable]);

  /**
   * Actualizar una variable existente
   * @param {number} index - Índice de la variable
   * @param {Object} updatedVar - Variable actualizada
   */
  const handleUpdateVariable = useCallback((index, updatedVar) => {
    // Mantener el estado local actualizado para la edición en curso
    setVariables(prev => prev.map((v, i) => i === index ? updatedVar : v));
    
    // Si no estamos en modo edición, actualizar también a través de Zustand
    if (!isEditing && updateMessageNodeVariable) {
      updateMessageNodeVariable(id, index, updatedVar);
    }
  }, [id, isEditing, updateMessageNodeVariable]);

  /**
   * Eliminar una variable
   * @param {number} index - Índice de la variable a eliminar
   */
  const handleDeleteVariable = useCallback((index) => {
    // Mantener el estado local actualizado para la edición en curso
    setVariables(prev => prev.filter((_, i) => i !== index));
    
    // Si no estamos en modo edición, actualizar también a través de Zustand
    if (!isEditing && deleteMessageNodeVariable) {
      deleteMessageNodeVariable(id, index);
    }
  }, [id, isEditing, deleteMessageNodeVariable]);



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

useEffect(() => {
  if (isUltraMode && nodeRef.current) {
    const animationFrameId = requestAnimationFrame(() => {
      const handles = nodeRef.current.querySelectorAll('.react-flow__handle.message-node__handle--ultra');
      handles.forEach(handle => {
        // Estilos en línea eliminados/comentados para permitir que CSS maneje la apariencia en modo ultra
        // handle.style.setProperty('background-color', '#f8fafc', 'important');
        // handle.style.setProperty('border', '1px solid #2563eb', 'important');
        // handle.style.setProperty('border-radius', '50%', 'important');
        // handle.style.setProperty('width', '10px', 'important');
        // handle.style.setProperty('height', '10px', 'important');
        // handle.style.setProperty('box-shadow', '0 0 0 1px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)', 'important');
        // handle.style.setProperty('transition', 'none', 'important');
        // handle.style.setProperty('animation', 'none', 'important');
        // handle.style.setProperty('transform', 'none', 'important');
        // handle.style.setProperty('cursor', 'pointer', 'important');
        // handle.style.setProperty('z-index', '120', 'important');

        // if (handle.classList.contains('react-flow__handle-top') || handle.classList.contains('message-node__handle--target')) {
        //   handle.style.setProperty('top', '-10px', 'important');
        //   handle.style.removeProperty('bottom'); // Limpiar por si acaso
        // }
        // if (handle.classList.contains('react-flow__handle-bottom') || handle.classList.contains('message-node__handle--source')) {
        //   handle.style.setProperty('bottom', '-10px', 'important');
        //   handle.style.removeProperty('top'); // Limpiar por si acaso
        // }
      });
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (nodeRef.current) {
        const handlesInNode = nodeRef.current.querySelectorAll('.react-flow__handle.message-node__handle--ultra');
        handlesInNode.forEach(handle => {
          const propsToRemove = [
            'background-color', 'border', 'border-radius', 'width', 'height',
            'box-shadow', 'transition', 'animation', 'transform', 'cursor',
            'z-index', 'top', 'bottom'
          ];
          propsToRemove.forEach(prop => handle.style.removeProperty(prop));
        });
      }
    };
  } else if (nodeRef.current) { // No está en modo ultra, pero nodeRef existe, asegurar limpieza
    const handlesInNode = nodeRef.current.querySelectorAll('.react-flow__handle.message-node__handle--ultra');
    handlesInNode.forEach(handle => {
      const propsToRemove = [
        'background-color', 'border', 'border-radius', 'width', 'height',
        'box-shadow', 'transition', 'animation', 'transform', 'cursor',
        'z-index', 'top', 'bottom'
      ];
      propsToRemove.forEach(prop => handle.style.removeProperty(prop));
    });
  }
  // No se necesita un return explícito si todas las rutas están cubiertas o devuelven undefined implícitamente
}, [isUltraMode, id, safeData, nodeRef]); // Dependencias del efecto (zoomLevel removido ya que isUltraMode lo cubre)
  
  /**
   * Optimización para modo ultra rendimiento
   * Reduce la cantidad de elementos renderizados
   */
  const renderUltraPerformanceContent = () => {
    // ultraHandleBaseStyle ya no es necesario, los estilos se manejan por CSS.
    return (

    <div className="message-node__ultra-content" data-testid={`message-node-ultra-content-${id}`}>
      <Handle
        type="target"
        position={Position.Top} // O la posición que corresponda para modo ultra
        id="default"
        isConnectable={isConnectable} // Usar directamente isConnectable
        className="message-node__handle message-node__handle--target message-node__handle--ultra"
        aria-label="Conector de entrada (ultra)"
        title="Conectar desde otro nodo (ultra)"
        tabIndex={-1} // Generalmente no focuseable en modo ultra
        role="button"
        data-testid={`message-node-target-handle-ultra-${id}`}
        // La prop 'style' se elimina para depender de las clases CSS
      />
      <Handle
        type="source"
        position={Position.Bottom} // O la posición que corresponda para modo ultra
        id="default"
        isConnectable={isConnectable} // Usar directamente isConnectable
        className="message-node__handle message-node__handle--source message-node__handle--ultra"
        aria-label="Conector de salida (ultra)"
        title="Conectar hacia otro nodo (ultra)"
        tabIndex={-1} // Generalmente no focuseable en modo ultra
        role="button"
        data-testid={`message-node-source-handle-ultra-${id}`}
        // La prop 'style' se elimina para depender de las clases CSS
      />
      <div className="message-node__ultra-header">
        <MessageNodeIcon type={messageType} isUltraPerformanceMode={true} />
        <span className="message-node__ultra-title">{typeToTitle(messageType)}</span>
      </div>
      <div className="message-node__ultra-message">
        {(() => {
          if (!safeData.message) return DEFAULT_MESSAGE;
          const processed = replaceVariablesInMessage(safeData.message, safeData.variables);
          return processed.length > 50 ? `${processed.substring(0, 50)}...` : processed;
        })()}
      </div>
    </div>
  );
};

  /**
   * Renderizar el componente MessageNode
   */
  return (
    <div
      ref={nodeRef}
      className={nodeClasses}
      style={nodeStyle}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleNodeContextMenu} // Add context menu handler
      data-testid="message-node"
      aria-labelledby={`message-node-title-${id}`} // Add for accessibility
      aria-describedby={`message-node-content-${id}`} // Add for accessibility
      role="group"
      // aria-label removed as labelledby/describedby are more specific
      tabIndex={0}
      onKeyDown={(e) => { // Add keydown handler
        if (e.key === 'Enter' && !isEditing) {
          // Optional: handleDoubleClick(); 
        }
        if (e.key === 'Escape' && isEditing) {
          cancelEdit(); // Escape should cancel edits
        }
      }}
    >
      <MessageNodeHeader
        id={id}
        titleFromData={safeData.title} 
        messageType={safeData.type} // Usar safeData.type que es el tipo procesado
        isUltraMode={isUltraMode}
        isSaving={nodeState.isSaving} // Usar el estado local isSaving
        isSelected={selected}
        onDoubleClickHeader={handleDoubleClick}
        lastUpdatedTimestamp={safeData.lastUpdated}
        disableAnimations={disableAnimations} // Pasar la prop disableAnimations
      />
      
      <MessageNodeContent
        id={id}
        message={message} 
        variables={variables} 
        isEditing={isEditing}
        isUltraMode={isUltraMode}
        onUpdateNodeData={updateMessageNodeData}
        safeData={safeData}
        handleMessageChange={handleMessageChange}
        handleSave={saveChanges}
        handleCancel={cancelEdit}
        DEFAULT_MESSAGE={DEFAULT_MESSAGE}
        handleAddVariable={handleAddVariable}
        handleUpdateVariable={handleUpdateVariable}
        handleDeleteVariable={handleDeleteVariable}
      />

        {/* Pie del nodo con información de última actualización */}
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

        {/* Conectores para entradas y salidas - con mejoras de accesibilidad */}
        <Handle
          type="target"
          position={Position.Top}
          id="default" // ID estandarizado para el handle de entrada
          isConnectable={isConnectable}
          className={`message-node__handle message-node__handle--target ${isUltraMode ? 'message-node__handle--ultra' : ''}`}
          aria-label="Conector de entrada"
          title="Conectar desde otro nodo"
          tabIndex={isConnectable && !isUltraMode ? 0 : -1}
          role="button"
          data-testid="message-node-target-handle"
          
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="default" // ID estandarizado para el handle de salida
          isConnectable={isConnectable}
          className={`message-node__handle message-node__handle--source ${isUltraMode ? 'message-node__handle--ultra' : ''}`}
          aria-label="Conector de salida"
          title="Conectar hacia otro nodo"
          tabIndex={isConnectable && !isUltraMode ? 0 : -1}
          role="button"
          data-testid="message-node-source-handle"
          
        />
    
    {/* Texto para lectores de pantalla */}
    <span className="sr-only">
      Nodo de mensaje tipo {messageType}. {message}
      {variables && variables.length > 0 && ` Con ${variables.length} variables.`}
      {safeData.lastUpdated && ` Última actualización: ${formatDateRelative(safeData.lastUpdated)}.`}
    </span>
  </div>
);
}); // Corrected closing for: const MessageNode = memo(...) 

MessageNode.displayName = 'MessageNode';

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
    x: PropTypes.number,
    y: PropTypes.number,
    id: PropTypes.string
  }),
  isConnectable: PropTypes.bool,
  selected: PropTypes.bool,
  id: PropTypes.string.isRequired,
  setNodes: PropTypes.func,
  isUltraPerformanceMode: PropTypes.bool,
  onEdit: PropTypes.func,
  onDuplicate: PropTypes.func,
  onDelete: PropTypes.func,
  performanceMode: PropTypes.bool // Alias para isUltraPerformanceMode (compatibilidad)
};

export default MessageNode;
