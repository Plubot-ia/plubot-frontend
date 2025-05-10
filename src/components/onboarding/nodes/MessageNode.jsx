import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  CornerDownRight
} from 'lucide-react';
import PropTypes from 'prop-types';
import Tooltip from '@/components/onboarding/ui/ToolTip';
import ContextMenu from '@/components/onboarding/ui/context-menu';
import { formatDateRelative, formatTime } from '@/utils/date';
import useNode from '@/hooks/useNode';
import ReactMarkdown from '@/lib/simplified-markdown';
import './MessageNode.css';

const MessageNode = React.memo(
  ({
    data = {
      message: 'Ingresa un mensaje aquí',
      variables: [],
      label: 'Mensaje',
      sender: 'bot',
      type: 'message',
      status: '',
      isCollapsed: false,
      enableMarkdown: true,
    },
    isConnectable = true,
    selected = false,
    id,
    setNodes,
  }) => {
    const [message, setMessage] = useState(data.message || 'Ingresa un mensaje aquí');
    const [isEditing, setIsEditing] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);
    const [variables, setVariables] = useState(data.variables || []);
    const [showVariableEditor, setShowVariableEditor] = useState(false);

    const textareaRef = useRef(null);

    const {
      isCollapsed,
      showContextMenu,
      contextMenuPosition,
      errorMessage,
      isHovered,
      nodeRef,
      toggleCollapse,
      handleContextMenu,
      handleClick,
      setShowContextMenu,
      setIsHovered,
      showError,
      getStatusClass,
      trackChanges,
      canEdit,
      canDelete,
    } = useNode({ id, data, setNodes, isConnectable, minWidth: 150, minHeight: 150 });

    useEffect(() => {
      if (!isEditing) {
        if (data.message !== message) setMessage(data.message || 'Ingresa un mensaje aquí');
        if (data.variables && JSON.stringify(data.variables) !== JSON.stringify(variables)) {
          setVariables(data.variables || []);
        }
      }
    }, [data.message, data.variables, isEditing, message, variables]);

    useEffect(() => {
      if (isEditing && textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
        textareaRef.current.focus();
      } else if (nodeRef.current) {
        // Forzar tamaño inicial consistente
        nodeRef.current.style.width = '150px';
        nodeRef.current.style.height = '150px';
      }
    }, [isEditing, message, nodeRef]);

    const handleDoubleClick = useCallback(() => {
      if (!canEdit) {
        showError('No tienes permisos para editar este nodo');
        return;
      }
      setIsEditing(true);
    }, [canEdit, showError]);

    const cancelEditing = useCallback(() => {
      setMessage(data.message || 'Ingresa un mensaje aquí');
      setVariables(data.variables || []);
      setIsEditing(false);
      setShowVariableEditor(false);
    }, [data.message, data.variables]);

    const finishEditing = useCallback(() => {
      setIsEditing(false);
      setShowVariableEditor(false);

      const hasChanges = data.message !== message || JSON.stringify(data.variables) !== JSON.stringify(variables);
      if (hasChanges) {
        const updateData = {
          message,
          variables,
          lastModified: new Date().toISOString(),
          modifiedBy: data.currentUser || 'unknown',
        };

        data.onChange?.(updateData);

        trackChanges('message', updateData, { message: data.message, variables: data.variables }, { message, variables });

        setNodes((nds) =>
          nds.map((node) =>
            node.id === id
              ? {
                  ...node,
                  data: { ...node.data, message, variables, lastModified: updateData.lastModified },
                }
              : node
          )
        );
      }
    }, [message, variables, id, data, setNodes, trackChanges]);

    const togglePreview = useCallback(() => {
      setPreviewMode((prev) => !prev);
    }, []);

    const toggleVariableEditor = useCallback((e) => {
      e?.stopPropagation();
      setShowVariableEditor(!showVariableEditor);
    }, [showVariableEditor]);

    const addVariable = useCallback(() => {
      const newVar = `var_${variables.length + 1}`;
      setVariables([...variables, newVar]);
    }, [variables]);

    const removeVariable = useCallback((index) => {
      setVariables(variables.filter((_, i) => i !== index));
    }, [variables]);

    const updateVariable = useCallback((index, value) => {
      const newVariables = [...variables];
      newVariables[index] = value;
      setVariables(newVariables);
    }, [variables]);

    const getIcon = useCallback(() => {
      if (data.customIcon) return data.customIcon;
      switch (data.sender) {
        case 'system':
        case 'bot':
          return <Bot size={16} />;
        case 'user':
          return <User size={16} />;
        case 'agent':
          return <UserCheck size={16} />;
        default:
          switch (data.type) {
            case 'question':
              return <HelpCircle size={16} />;
            case 'info':
              return <Info size={16} />;
            case 'warning':
              return <AlertTriangle size={16} />;
            case 'error':
              return <AlertCircle size={16} />;
            default:
              return <MessageSquare size={16} />;
          }
      }
    }, [data.sender, data.type, data.customIcon]);

    const formatMessage = useCallback(() => {
      if (!message) return null;
      let formattedMessage = message;
      if (previewMode && variables.length > 0) {
        variables.forEach((variable) => {
          const regex = new RegExp(`\\{\\{\\s*${variable}\\s*\\}\\}`, 'g');
          formattedMessage = formattedMessage.replace(regex, `<span class="message-variable">${variable}</span>`);
        });
      }
      return data.enableMarkdown ? (
        <ReactMarkdown>{formattedMessage}</ReactMarkdown>
      ) : (
        formattedMessage.split('\n').map((line, index) => (
          <React.Fragment key={index}>
            {line}
            {index < formattedMessage.split('\n').length - 1 && <br />}
          </React.Fragment>
        ))
      );
    }, [message, variables, previewMode, data.enableMarkdown]);

    const getMessageTypeClass = useCallback(() => {
      switch (data.type) {
        case 'info':
          return 'message-type-info';
        case 'warning':
          return 'message-type-warning';
        case 'error':
          return 'message-type-error';
        case 'question':
          return 'message-type-question';
        default:
          return '';
      }
    }, [data.type]);

    const getSenderClass = useCallback(() => {
      switch (data.sender) {
        case 'system':
          return 'message-sender-system';
        case 'user':
          return 'message-sender-user';
        case 'bot':
          return 'message-sender-bot';
        case 'agent':
          return 'message-sender-agent';
        default:
          return '';
      }
    }, [data.sender]);

    const contextMenuItems = [
      { label: 'Editar', icon: <Edit2 size={14} />, action: handleDoubleClick, disabled: !canEdit },
      { label: 'Ver historial', icon: <CornerDownRight size={14} />, action: () => data.onShowHistory?.(id) },
      { label: 'Duplicar', icon: <Copy size={14} />, action: () => data.onDuplicate?.(id), disabled: !canEdit },
      { label: 'Eliminar', icon: <Trash2 size={14} />, action: () => data.onDelete?.(id), disabled: !canDelete },
    ];

    const renderVariableEditor = () => {
      if (!showVariableEditor) return null;
      return (
        <div className="message-node-variable-editor">
          <div className="message-node-variable-editor-header">
            <h4>Variables</h4>
            <button onClick={addVariable} className="message-node-variable-add" aria-label="Agregar variable">
              + Agregar
            </button>
          </div>
          <div className="message-node-variable-list">
            {variables.length === 0 ? (
              <div className="message-node-variable-empty">No hay variables definidas</div>
            ) : (
              variables.map((variable, index) => (
                <div key={index} className="message-node-variable-item">
                  <input
                    value={variable}
                    onChange={(e) => updateVariable(index, e.target.value)}
                    className="message-node-variable-input"
                    aria-label={`Variable ${index + 1}`}
                  />
                  <button
                    onClick={() => removeVariable(index)}
                    className="message-node-variable-remove"
                    aria-label="Eliminar variable"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
          <div className="message-node-variable-help">
            <small>Usa {{variable}} en el mensaje para insertar variables</small>
          </div>
        </div>
      );
    };

    return (
      <div
        ref={nodeRef}
        className={`
          message-node 
          ${selected ? 'selected' : ''} 
          ${getStatusClass()} 
          ${getMessageTypeClass()} 
          ${getSenderClass()} 
          ${isEditing ? 'editing' : ''} 
          ${isCollapsed ? 'collapsed' : ''} 
          ${previewMode ? 'preview' : ''} 
          ${isHovered ? 'hovered' : ''}
        `}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="button"
        aria-label={`Nodo de mensaje: ${message}`}
        tabIndex={0}
        data-testid="message-node"
        style={{ minWidth: '150px', minHeight: '150px', maxWidth: '250px', maxHeight: '250px' }}
      >
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={isConnectable && !isEditing}
          className={`message-node-input ${data.hasActiveInput ? 'active' : ''}`}
        />
        <div className="message-node-header">
          <div className="message-node-icon" title={data.iconTitle || 'Nodo de mensaje'}>
            {getIcon()}
          </div>
          <div className="message-node-title" title={data.label}>
            {data.label || 'Mensaje'}
            {data.badge && (
              <span className={`message-node-badge badge-${data.badge.type || 'default'}`}>
                {data.badge.text}
              </span>
            )}
          </div>
          <div className="message-node-controls">
            <button
              className="message-node-collapse-btn"
              onClick={toggleCollapse}
              aria-label={isCollapsed ? 'Expandir' : 'Colapsar'}
            >
              {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
          </div>
        </div>
        {!isCollapsed && (
          <>
            <div className="message-node-content">
              {isEditing ? (
                <div className="message-node-edit-container">
                  <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onBlur={finishEditing}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        finishEditing();
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        cancelEditing();
                      }
                    }}
                    className="message-node-textarea"
                    placeholder="Escribe el mensaje..."
                    aria-label="Mensaje"
                    style={{ maxHeight: '150px', overflowY: 'auto' }}
                  />
                  <div className="message-node-editing-toolbar">
                    <button
                      className={`message-node-tool-btn ${showVariableEditor ? 'active' : ''}`}
                      onClick={toggleVariableEditor}
                      title="Variables"
                    >
                      {}
                    </button>
                    <button
                      className={`message-node-tool-btn ${previewMode ? 'active' : ''}`}
                      onClick={togglePreview}
                      title={previewMode ? 'Desactivar vista previa' : 'Activar vista previa'}
                    >
                      <Send size={14} />
                    </button>
                  </div>
                  {renderVariableEditor()}
                </div>
              ) : (
                <div className="message-node-message" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                  {message ? (
                    formatMessage()
                  ) : (
                    <em className="message-node-placeholder">Ingresa un mensaje aquí</em>
                  )}
                </div>
              )}
              {data.context && !isEditing && (
                <div className="message-node-context">
                  <small>{data.context}</small>
                </div>
              )}
              {errorMessage && <div className="message-node-error">{errorMessage}</div>}
            </div>
            {!isEditing ? (
              <div className="message-node-footer">
                {canEdit && <small className="message-node-hint">Doble clic para editar</small>}
                {data.metadata && (
                  <div className="message-node-metadata">
                    {data.metadata.date && (
                      <Tooltip content={`Actualizado: ${data.metadata.date}`}>
                        <span className="message-node-date">{formatDateRelative(data.metadata.date)}</span>
                      </Tooltip>
                    )}
                    {data.metadata.time && (
                      <Tooltip content={`Hora: ${data.metadata.time}`}>
                        <span className="message-node-time">{formatTime(data.metadata.time)}</span>
                      </Tooltip>
                    )}
                    {data.metadata.owner && (
                      <Tooltip content={`Propietario: ${data.metadata.owner}`}>
                        <span className="message-node-owner">
                          {data.metadata.owner.substring(0, 2).toUpperCase()}
                        </span>
                      </Tooltip>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="message-node-editing-controls">
                <div className="message-node-edit-actions">
                  <button onClick={cancelEditing} className="message-node-cancel-btn" aria-label="Cancelar">
                    Cancelar
                  </button>
                  <button onClick={finishEditing} className="message-node-save-btn" aria-label="Guardar">
                    Guardar
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        <Handle
          type="source"
          position={Position.Bottom}
          isConnectable={isConnectable && !isEditing}
          className={`message-node-output ${data.hasActiveOutput ? 'active' : ''}`}
        />
        {showContextMenu && (
          <ContextMenu
            items={contextMenuItems}
            position={contextMenuPosition}
            onClose={() => setShowContextMenu(false)}
          />
        )}
      </div>
    );
  }
);

MessageNode.propTypes = {
  data: PropTypes.shape({
    message: PropTypes.string,
    variables: PropTypes.arrayOf(PropTypes.string),
    label: PropTypes.string,
    sender: PropTypes.string,
    type: PropTypes.string,
    isCollapsed: PropTypes.bool,
    width: PropTypes.number,
    height: PropTypes.number,
    status: PropTypes.string,
    customIcon: PropTypes.node,
    iconTitle: PropTypes.string,
    badge: PropTypes.shape({
      type: PropTypes.string,
      text: PropTypes.string,
    }),
    context: PropTypes.string,
    metadata: PropTypes.shape({
      date: PropTypes.string,
      time: PropTypes.string,
      owner: PropTypes.string,
    }),
    onChange: PropTypes.func,
    onSelect: PropTypes.func,
    onShowHistory: PropTypes.func,
    onDuplicate: PropTypes.func,
    onDelete: PropTypes.func,
    currentUser: PropTypes.string,
    hasActiveInput: PropTypes.bool,
    hasActiveOutput: PropTypes.bool,
    enableMarkdown: PropTypes.bool,
  }).isRequired,
  isConnectable: PropTypes.bool,
  selected: PropTypes.bool,
  id: PropTypes.string.isRequired,
  setNodes: PropTypes.func.isRequired,
};

export default MessageNode;