import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Handle, Position } from 'reactflow';
import { 
  MoreHorizontal, 
  Edit2, 
  ChevronDown, 
  ChevronUp,
  X,
  Plus,
  CornerDownRight,
  Flag,
  Code,
  Save
} from 'lucide-react';
import PropTypes from 'prop-types';
import Tooltip from '@/components/onboarding/ui/ToolTip';
import ContextMenu from '@/components/onboarding/ui/context-menu';
import { formatDateRelative } from '@/utils/date';
import useNode from '@/hooks/useNode';
import ReactMarkdown from '@/lib/simplified-markdown';
import { v4 as uuidv4 } from 'uuid';
import './EndNode.css';

const EndNode = memo(({
  data = {
    label: 'Fin',
    variables: [],
    status: '',
    isCollapsed: false,
    enableMarkdown: false,
  },
  isConnectable = true,
  selected = false,
  id,
  setNodes,
}) => {
  // Estados locales del componente
  const [label, setLabel] = useState(data.label || 'Fin');
  const [isEditing, setIsEditing] = useState(false);
  const [variables, setVariables] = useState(data.variables || []);
  const [showVariableEditor, setShowVariableEditor] = useState(false);

  // Referencias
  const inputRef = useRef(null);
  const variableEditorRef = useRef(null);

  // Configuración del nodo usando el hook personalizado
  const {
    isResizing,
    isCollapsed,
    showContextMenu,
    contextMenuPosition,
    errorMessage,
    isHovered,
    nodeRef,
    toggleCollapse,
    handleContextMenu,
    handleClick,
    handleMouseDown,
    setShowContextMenu,
    setIsHovered,
    showError,
    getStatusClass,
    trackChanges,
    canEdit,
    canDelete,
    minWidth,
    minHeight,
    initialWidth,
    initialHeight,
  } = useNode({ 
    id, 
    data, 
    setNodes, 
    isConnectable, 
    minWidth: 150,
    minHeight: 100 
  });

  // Sincronizar estados locales con props cuando sea necesario
  useEffect(() => {
    if (!isEditing) {
      if (data.label !== label) setLabel(data.label || 'Fin');
      if (data.variables && JSON.stringify(data.variables) !== JSON.stringify(variables)) {
        setVariables(data.variables || []);
      }
    }
  }, [data.label, data.variables, isEditing, label, variables]);

  // Enfocar el input cuando se active el modo de edición
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Detectar clics fuera del editor de variables para cerrarlo
  useEffect(() => {
    if (showVariableEditor) {
      const handleClickOutside = (event) => {
        if (
          variableEditorRef.current && 
          !variableEditorRef.current.contains(event.target) &&
          !event.target.closest('.end-node-tool-btn')
        ) {
          setShowVariableEditor(false);
        }
      };
      
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showVariableEditor]);

  // Activar modo de edición al hacer doble clic
  const handleDoubleClick = useCallback(() => {
    if (!canEdit) {
      showError('No tienes permisos para editar este nodo');
      return;
    }
    setIsEditing(true);
  }, [canEdit, showError]);

  // Cancelar la edición y restaurar valores originales
  const cancelEditing = useCallback(() => {
    setLabel(data.label || 'Fin');
    setVariables(data.variables || []);
    setIsEditing(false);
    setShowVariableEditor(false);
  }, [data.label, data.variables]);

  // Finalizar la edición y guardar cambios
  const finishEditing = useCallback(() => {
    setIsEditing(false);
    setShowVariableEditor(false);

    const hasChanges = data.label !== label || JSON.stringify(data.variables) !== JSON.stringify(variables);
    if (hasChanges) {
      const updateData = {
        label,
        variables,
        lastModified: new Date().toISOString(),
        modifiedBy: data.currentUser || 'unknown',
      };

      // Notificar cambios si existe el callback
      data.onChange?.(updateData);

      // Registrar cambios en el historial
      trackChanges('end', updateData, { label: data.label, variables: data.variables }, { label, variables });

      // Actualizar el nodo en el estado global
      setNodes((nds) =>
        nds.map((node) =>
          node.id === id
            ? { ...node, data: { ...node.data, label, variables, lastModified: updateData.lastModified } }
            : node
        )
      );
    }
  }, [label, variables, id, data, setNodes, trackChanges]);

  // Alternar la visualización del editor de variables
  const toggleVariableEditor = useCallback((e) => {
    e?.stopPropagation();
    setShowVariableEditor(!showVariableEditor);
  }, [showVariableEditor]);

  // Añadir una nueva variable
  const addVariable = useCallback(() => {
    const newVar = `var_${variables.length + 1}`;
    setVariables([...variables, newVar]);
  }, [variables]);

  // Eliminar una variable por índice
  const removeVariable = useCallback((index) => {
    setVariables(variables.filter((_, i) => i !== index));
  }, [variables]);

  // Actualizar el valor de una variable
  const updateVariable = useCallback((index, value) => {
    const newVariables = [...variables];
    newVariables[index] = value;
    setVariables(newVariables);
  }, [variables]);

  // Formatear la etiqueta con variables destacadas y/o markdown
  const formatLabel = useCallback(() => {
    if (!label) return null;

    let formattedLabel = label;
    
    // Resaltar las variables en el texto
    if (variables.length > 0) {
      variables.forEach((variable) => {
        const regex = new RegExp(`\\{\\{\\s*${variable}\\s*\\}\\}`, 'g');
        formattedLabel = formattedLabel.replace(
          regex, 
          `<span class="end-node-variable-highlight">${variable}</span>`
        );
      });
    }
    
    // Aplicar markdown si está habilitado
    return data.enableMarkdown ? 
      <ReactMarkdown>{formattedLabel}</ReactMarkdown> : 
      <span dangerouslySetInnerHTML={{ __html: formattedLabel }} />;
  }, [label, variables, data.enableMarkdown]);

  // Opciones del menú contextual
  const contextMenuItems = [
    { 
      label: 'Editar', 
      icon: <Edit2 size={14} />, 
      action: handleDoubleClick, 
      disabled: !canEdit,
      shortcut: 'F2' 
    },
    { 
      label: 'Ver historial', 
      icon: <CornerDownRight size={14} />, 
      action: () => data.onShowHistory?.(id),
      shortcut: 'Alt+H'
    },
    { 
      label: 'Duplicar', 
      icon: <Plus size={14} />, 
      action: () => {
        const newId = uuidv4();
        const newLabel = `${data.label} (Copia)`;
        data.onDuplicate?.(id, { ...data, id: newId, label: newLabel });
      }, 
      disabled: !canEdit,
      shortcut: 'Ctrl+D'
    },
    {
      label: 'Eliminar',
      icon: <X size={14} />,
      action: () => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este nodo?')) {
          data.onDelete?.(id);
        }
      },
      disabled: !canDelete,
      shortcut: 'Del'
    },
  ];

  // Renderizar el editor de variables
  const renderVariableEditor = () => {
    if (!showVariableEditor) return null;
    
    return (
      <div className="end-node-variable-editor" ref={variableEditorRef}>
        <div className="end-node-variable-editor-header">
          <h4>Variables</h4>
          <button 
            onClick={addVariable} 
            className="end-node-variable-add" 
            aria-label="Agregar variable"
          >
            <Plus size={14} /> Agregar
          </button>
        </div>
        <div className="end-node-variable-list">
          {variables.length === 0 ? (
            <div className="end-node-variable-empty">
              No hay variables definidas
            </div>
          ) : (
            variables.map((variable, index) => (
              <div key={index} className="end-node-variable-item">
                <input
                  value={variable}
                  onChange={(e) => updateVariable(index, e.target.value)}
                  className="end-node-variable-input"
                  aria-label={`Variable ${index + 1}`}
                  placeholder="Nombre de variable"
                />
                <button
                  onClick={() => removeVariable(index)}
                  className="end-node-variable-remove"
                  aria-label="Eliminar variable"
                >
                  <X size={14} />
                </button>
              </div>
            ))
          )}
        </div>
        <div className="end-node-variable-help">
          <small>Usa {{variable}} en la etiqueta para insertar variables</small>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={nodeRef}
      className={`
        end-node 
        ${selected ? 'selected' : ''} 
        ${getStatusClass()} 
        ${isEditing ? 'editing' : ''} 
        ${isCollapsed ? 'collapsed' : ''}
        ${isHovered ? 'hovered' : ''}
      `}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: isCollapsed ? 120 : (data.width || initialWidth),
        height: isCollapsed ? 40 : (data.height || initialHeight),
      }}
      role="button"
      aria-label={`Nodo de fin: ${label}`}
      tabIndex={0}
      data-testid="end-node"
      data-node-id={id}
      onKeyDown={(e) => {
        // Navegación por teclado
        if (e.key === 'Enter' && !isEditing) {
          handleDoubleClick(e);
        }
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable && !isEditing}
        className={`end-node-input ${data.hasActiveInput ? 'active' : ''}`}
        aria-label="Conexión de entrada"
      />
      
      <div className="end-node-header">
        <div className="end-node-icon" title="Nodo de fin">
          {data.customIcon || <Flag size={16} />}
        </div>
        <div className="end-node-title" title="Nodo final del flujo">
          Fin
          {data.badge && (
            <span className={`end-node-badge badge-${data.badge.type || 'default'}`}>
              {data.badge.text}
            </span>
          )}
        </div>
        <div className="end-node-controls">
          {!isCollapsed && !isEditing && (
            <button
              className="end-node-menu-btn"
              onClick={(e) => {
                e.stopPropagation();
                setContextMenuPosition({ x: e.clientX, y: e.clientY });
                setShowContextMenu(true);
              }}
              aria-label="Menú"
            >
              <MoreHorizontal size={16} />
            </button>
          )}
          <button
            className="end-node-collapse-btn"
            onClick={toggleCollapse}
            aria-label={isCollapsed ? 'Expandir' : 'Colapsar'}
          >
            {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
      </div>
      
      {!isCollapsed && (
        <>
          <div className="end-node-content">
            {isEditing ? (
              <div className="end-node-edit-container">
                <input
                  ref={inputRef}
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  onBlur={() => {}}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      finishEditing();
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      cancelEditing();
                    }
                  }}
                  className="end-node-input"
                  placeholder="Etiqueta del nodo"
                  aria-label="Etiqueta del nodo de fin"
                  maxLength={100}
                />
                <div className="end-node-editing-toolbar">
                  <button
                    className={`end-node-tool-btn ${showVariableEditor ? 'active' : ''}`}
                    onClick={toggleVariableEditor}
                    title="Gestionar Variables"
                    aria-label="Mostrar editor de variables"
                  >
                    <Code size={16} />
                  </button>
                  {data.enableMarkdown && (
                    <Tooltip content="Markdown soportado">
                      <span className="end-node-markdown-indicator">MD</span>
                    </Tooltip>
                  )}
                </div>
                {renderVariableEditor()}
              </div>
            ) : (
              <div className="end-node-label" title={label}>
                {label ? formatLabel() : <em className="end-node-placeholder">Sin etiqueta</em>}
              </div>
            )}
            {data.context && !isEditing && (
              <div className="end-node-context">
                <small>{data.context}</small>
              </div>
            )}
            {errorMessage && (
              <div className="end-node-error" role="alert">
                {errorMessage}
              </div>
            )}
          </div>
          
          {!isEditing ? (
            <div className="end-node-footer">
              {canEdit && (
                <small className="end-node-hint">
                  Doble clic para editar
                </small>
              )}
              {data.metadata && (
                <div className="end-node-metadata">
                  {data.metadata.date && (
                    <Tooltip content={`Actualizado: ${data.metadata.date}`}>
                      <span className="end-node-date">
                        {formatDateRelative(data.metadata.date)}
                      </span>
                    </Tooltip>
                  )}
                  {data.metadata.owner && (
                    <Tooltip content={`Propietario: ${data.metadata.owner}`}>
                      <span className="end-node-owner">
                        {data.metadata.owner.substring(0, 2).toUpperCase()}
                      </span>
                    </Tooltip>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="end-node-editing-controls">
              <div className="end-node-edit-actions">
                <button 
                  onClick={cancelEditing} 
                  className="end-node-cancel-btn" 
                  aria-label="Cancelar"
                >
                  <X size={14} /> Cancelar
                </button>
                <button 
                  onClick={finishEditing} 
                  className="end-node-save-btn" 
                  aria-label="Guardar"
                >
                  <Save size={14} /> Guardar
                </button>
              </div>
            </div>
          )}
        </>
      )}
      
      {!isCollapsed && !isEditing && (
        <div
          className="resize-handle"
          onMouseDown={handleMouseDown}
          onKeyDown={(e) => {
            if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
              e.preventDefault();
              setNodes((nds) =>
                nds.map((node) => {
                  if (node.id === id) {
                    let newWidth = node.width || initialWidth;
                    let newHeight = node.height || initialHeight;
                    
                    // Cambiar dimensiones con teclado
                    if (e.key === 'ArrowRight') newWidth += 10;
                    if (e.key === 'ArrowLeft') newWidth = Math.max(minWidth, newWidth - 10);
                    if (e.key === 'ArrowDown') newHeight += 10;
                    if (e.key === 'ArrowUp') newHeight = Math.max(minHeight, newHeight - 10);
                    
                    return { ...node, width: newWidth, height: newHeight };
                  }
                  return node;
                })
              );
            }
          }}
          style={{ cursor: isResizing ? 'grabbing' : 'nwse-resize' }}
          role="button"
          tabIndex={0}
          aria-label="Redimensionar nodo"
        />
      )}
      
      {showContextMenu && (
        <ContextMenu
          items={contextMenuItems}
          position={contextMenuPosition}
          onClose={() => setShowContextMenu(false)}
        />
      )}
    </div>
  );
});

EndNode.displayName = 'EndNode';

EndNode.propTypes = {
  data: PropTypes.shape({
    label: PropTypes.string,
    variables: PropTypes.arrayOf(PropTypes.string),
    isCollapsed: PropTypes.bool,
    width: PropTypes.number,
    height: PropTypes.number,
    status: PropTypes.string,
    customIcon: PropTypes.node,
    badge: PropTypes.shape({
      type: PropTypes.string,
      text: PropTypes.string,
    }),
    context: PropTypes.string,
    metadata: PropTypes.shape({
      date: PropTypes.string,
      owner: PropTypes.string,
    }),
    onChange: PropTypes.func,
    onSelect: PropTypes.func,
    onShowHistory: PropTypes.func,
    onDuplicate: PropTypes.func,
    onDelete: PropTypes.func,
    currentUser: PropTypes.string,
    hasActiveInput: PropTypes.bool,
    enableMarkdown: PropTypes.bool,
  }),
  isConnectable: PropTypes.bool,
  selected: PropTypes.bool,
  id: PropTypes.string.isRequired,
  setNodes: PropTypes.func.isRequired,
};

export default EndNode;