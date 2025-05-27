/**
 * @file MessageNode.jsx
 * @description Componente optimizado para representar nodos de mensaje en el editor de flujos PLUBOT.
 * Implementa diseño profesional, accesibilidad y optimización para modo normal y ultra rendimiento.
 * @author PLUBOT Team
 * @version 2.0.0
 */

import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import { Handle, Position } from 'reactflow';
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
  Minimize2
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
import './MessageNode.css';

// Constantes y configuración
const DEFAULT_MESSAGE = 'Escribe tu mensaje aquí...';
const MAX_PREVIEW_LINES = 2;
const TRANSITION_DURATION = 300; // ms

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

/**
 * Componente para el ícono del nodo de mensaje
 * @param {Object} props - Propiedades del componente
 * @param {string} props.type - Tipo de mensaje (user, bot, system, etc.)
 * @param {boolean} props.isUltraPerformanceMode - Indica si está en modo ultra rendimiento
 * @returns {JSX.Element} - Ícono del nodo de mensaje
 */
const MessageNodeIcon = ({ type, isUltraPerformanceMode = false }) => {
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
};

MessageNodeIcon.propTypes = {
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
const MessagePreview = ({ message = '', variables = [], isUltraPerformanceMode = false }) => {
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
};

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
 * @returns {JSX.Element} - Editor de variables
 */
const VariableEditor = ({ 
  variables, 
  onAddVariable, 
  onUpdateVariable, 
  onDeleteVariable,
  isUltraPerformanceMode 
}) => {
  const [newVariable, setNewVariable] = useState({ name: '', value: '' });
  const [isAdding, setIsAdding] = useState(false);
  const newNameInputRef = useRef(null);

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
      <div className="message-node__variables-title">
        <span id="variables-heading">Variables</span>
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
              <UserCheck size={14} aria-hidden="true" />
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
                  className="message-node__variable-button"
                  onClick={() => onDeleteVariable(index)}
                  aria-label={`Eliminar variable ${variable.name}`}
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
  const [isEditing, setIsEditing] = useState(false);
  const [showVariables, setShowVariables] = useState(false);
  const [message, setMessage] = useState(safeData.message);
  const [variables, setVariables] = useState(safeData.variables);
  
  // Compatibilidad con el setNodes proporcionado por props
  const setNodes = legacySetNodes || useFlowStore.getState().setNodes;
  
  // Referencias
  const textareaRef = useRef(null);
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
    if (!isEditing && !isUltraMode) {
      setIsEditing(true);
    }
  }, [isEditing, isUltraMode]);

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
    setVariables(prev => [...prev, newVar]);
    
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
   * Opciones del menú contextual
   * Desactivadas en modo ultra rendimiento
   */
  const contextMenuOptions = useMemo(() => [
    {
      label: 'Editar',
      icon: <Edit2 size={14} aria-hidden="true" />,
      action: () => !isUltraMode && setIsEditing(true),
      disabled: isUltraMode
    },
    {
      label: 'Duplicar',
      icon: <Copy size={14} aria-hidden="true" />,
      action: () => {
        // Usar la acción de duplicación de Zustand si está disponible
        if (duplicateNode && !isUltraMode) {
          duplicateNode(id);
        }
        // Desactivada en modo ultra rendimiento
      },
      disabled: isUltraMode
    },
    {
      label: 'Eliminar',
      icon: <Trash2 size={14} aria-hidden="true" />,
      action: () => {
        // Usar la acción de eliminación de Zustand si está disponible
        if (removeNode && !isUltraMode) {
          removeNode(id);
        }
        // Desactivada en modo ultra rendimiento
      },
      isDanger: true,
      disabled: isUltraMode
    }
  ], [isUltraMode]);

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
  
  /**
   * Optimización para modo ultra rendimiento
   * Reduce la cantidad de elementos renderizados
   */
  const renderUltraPerformanceContent = () => (
    <div className="message-node__ultra-content">
      <div className="message-node__ultra-header">
        <MessageNodeIcon type={messageType} isUltraPerformanceMode={true} />
        <span className="message-node__ultra-title">{messageType}</span>
      </div>
      <div className="message-node__ultra-message">
        {message.length > 50 ? `${message.substring(0, 50)}...` : message}
      </div>
    </div>
  );

  /**
   * Renderizar el componente MessageNode
   */
  return (
    <div
      ref={nodeRef}
      className={nodeClasses}
      onDoubleClick={handleDoubleClick}
      data-testid="message-node"
      role="group"
      aria-label={`Nodo de mensaje: ${messageType}`}
      tabIndex={0}
    >
      <ContextMenu options={contextMenuOptions}>
        {/* Cabecera del nodo */}
        <header className="message-node__header">
          <div className="message-node__title">
            <MessageNodeIcon 
              type={messageType} 
              isUltraPerformanceMode={isUltraMode} 
            />
            <span>
              {messageType === MESSAGE_TYPES.USER ? 'Usuario' : 
               messageType === MESSAGE_TYPES.BOT ? 'Bot' : 
               messageType === MESSAGE_TYPES.SYSTEM ? 'Sistema' : 
               messageType === MESSAGE_TYPES.ERROR ? 'Error' : 
               messageType === MESSAGE_TYPES.WARNING ? 'Advertencia' : 
               messageType === MESSAGE_TYPES.INFO ? 'Información' : 
               messageType === MESSAGE_TYPES.QUESTION ? 'Pregunta' : 'Mensaje'}
            </span>
          </div>
          
          {/* Botón para mostrar/ocultar variables */}
          {!isEditing && variables && variables.length > 0 && !isUltraMode && (
            <Tooltip content={showVariables ? "Ocultar variables" : "Mostrar variables"}>
              <button
                type="button"
                className="message-node__variable-button"
                onClick={() => setShowVariables(prev => !prev)}
                aria-label={showVariables ? "Ocultar variables" : "Mostrar variables"}
                aria-expanded={showVariables}
                aria-controls="variables-list"
              >
                {showVariables ? 
                  <ChevronUp size={16} aria-hidden="true" /> : 
                  <ChevronDown size={16} aria-hidden="true" />
                }
              </button>
            </Tooltip>
          )}
        </header>

        {/* Contenido principal */}
        <main className="message-node__content">
          {isUltraMode && !isEditing ? (
            renderUltraPerformanceContent()
          ) : isEditing ? (
            <div 
              className="message-node__edit-area"
              role="form"
              aria-label="Editar mensaje"
            >
              <label htmlFor={`message-textarea-${id}`} className="sr-only">
                Contenido del mensaje
              </label>
              <textarea
                id={`message-textarea-${id}`}
                ref={textareaRef}
                className="message-node__textarea"
                value={message}
                onChange={handleMessageChange}
                onKeyDown={handleKeyDown}
                placeholder={DEFAULT_MESSAGE}
                aria-label="Contenido del mensaje"
                aria-describedby={`message-help-${id}`}
                rows={4}
                autoFocus
                spellCheck="true"
                data-testid="message-node-textarea"
              />
              <div id={`message-help-${id}`} className="sr-only">
                Presiona Enter para crear un salto de línea. Presiona Ctrl+Enter o Cmd+Enter para guardar los cambios.
              </div>
              
              <VariableEditor
                variables={variables}
                onAddVariable={handleAddVariable}
                onUpdateVariable={handleUpdateVariable}
                onDeleteVariable={handleDeleteVariable}
                isUltraPerformanceMode={isUltraMode}
              />
              
              <div className="message-node__actions">
                <button
                  type="button"
                  className="message-node__button message-node__button--secondary"
                  onClick={cancelEdit}
                  aria-label="Cancelar edición"
                  tabIndex="0"
                  title="Cancelar la edición del mensaje"
                >
                  <X size={14} className="message-node__button-icon" aria-hidden="true" />
                  <span>Cancelar</span>
                </button>
                <button
                  type="button"
                  className="message-node__button"
                  onClick={saveChanges}
                  aria-label="Guardar cambios"
                  tabIndex="0"
                  title="Guardar los cambios realizados"
                >
                  <Send size={14} className="message-node__button-icon" aria-hidden="true" />
                  <span>Guardar</span>
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
                  aria-label="Variables del mensaje"
                  tabIndex={0}
                >
                  <div className="message-node__variables-title">
                    <span>Variables</span>
                    <span className="sr-only">{variables.length} variables disponibles</span>
                  </div>
                  <div 
                    className="message-node__variables-list"
                    role="list"
                    aria-label="Lista de variables del mensaje"
                  >
                    {variables.map((variable, index) => (
                      <div 
                        key={`var-preview-${index}`} 
                        className="message-node__variable"
                        role="listitem"
                        aria-label={`Variable ${variable.name} con valor ${variable.value || 'vacío'}`}
                        tabIndex={0}
                      >
                        <span className="message-node__variable-name" title={`Nombre de variable: ${variable.name}`}>{variable.name}</span>
                        <span className="message-node__variable-value" title={`Valor: ${variable.value || 'vacío'}`}>
                          <CornerDownRight 
                            size={12} 
                            style={{ marginRight: '4px', opacity: 0.7 }} 
                            aria-hidden="true" 
                          />
                          {variable.value || '(vacío)'}
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
          isConnectable={isConnectable && !isUltraMode}
          className={`message-node__handle message-node__handle--target ${isUltraMode ? 'message-node__handle--ultra' : ''}`}
          aria-label="Conector de entrada"
          title="Conectar desde otro nodo"
          tabIndex={isConnectable && !isUltraMode ? 0 : -1}
          role="button"
          data-testid="message-node-target-handle"
          style={{
            top: '-10px', // Alejado del borde para mejor visibilidad
            width: '18px',
            height: '18px',
            backgroundColor: '#3b82f6',
            border: isUltraMode ? '2px solid white' : '3px solid white',
            boxShadow: '0 0 0 2px rgba(0, 0, 0, 0.15), 0 4px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 110
          }}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="default" // ID estandarizado para el handle de salida
          isConnectable={isConnectable && !isUltraMode}
          className={`message-node__handle message-node__handle--source ${isUltraMode ? 'message-node__handle--ultra' : ''}`}
          aria-label="Conector de salida"
          title="Conectar hacia otro nodo"
          tabIndex={isConnectable && !isUltraMode ? 0 : -1}
          role="button"
          data-testid="message-node-source-handle"
          style={{
            bottom: '-10px', // Alejado del borde para mejor visibilidad
            width: '18px',
            height: '18px',
            backgroundColor: '#3b82f6',
            border: isUltraMode ? '2px solid white' : '3px solid white',
            boxShadow: '0 0 0 2px rgba(0, 0, 0, 0.15), 0 4px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 110
          }}
        />
      </ContextMenu>
      
      {/* Texto para lectores de pantalla */}
      <span className="sr-only">
        Nodo de mensaje tipo {messageType}. {message}
        {variables && variables.length > 0 && ` Con ${variables.length} variables.`}
        {safeData.lastUpdated && ` Última actualización: ${formatDateRelative(safeData.lastUpdated)}.`}
      </span>
    </div>
  );
});

/**
 * Nombre para mostrar en DevTools
 * @type {string}
 */
MessageNode.displayName = 'MessageNode';

/**
 * Validación de propiedades
 * @type {Object}
 */
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

// Los valores predeterminados ahora están definidos directamente en los parámetros de la función

/**
 * Exportar el componente MessageNode
 * Memoizado para evitar renderizados innecesarios
 */
export default MessageNode;
