import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import { 
  MoreHorizontal, 
  Edit2, 
  ChevronDown, 
  ChevronUp,
  X,
  Plus,
  CornerDownRight,
  Circle
} from 'lucide-react';
import PropTypes from 'prop-types';
import Tooltip from '@/components/onboarding/ui/ToolTip';
import ContextMenu from '@/components/onboarding/ui/context-menu';
import { formatDateRelative } from '@/utils/date';
import useNode from '@/hooks/useNode';
import ReactMarkdown from '@/lib/simplified-markdown';

const OptionNode = React.memo(
  ({
    data = {
      label: 'Opción',
      condition: 'Contiene: palabra_clave',
      variables: [],
      status: '',
      isCollapsed: false,
      enableMarkdown: false,
      parentDecisionId: '',
    },
    isConnectable = true,
    selected = false,
    id,
    setNodes,
    draggable = true,
  }) => {
    const [label, setLabel] = useState(data.label || 'Opción');
    const [condition, setCondition] = useState(data.condition || 'Contiene: palabra_clave');
    const [isEditing, setIsEditing] = useState(false);
    const [variables, setVariables] = useState(data.variables || []);
    const [showVariableEditor, setShowVariableEditor] = useState(false);

    const inputRef = useRef(null);

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
    } = useNode({ id, data, setNodes, isConnectable, minWidth: 150, minHeight: 80 });

    useEffect(() => {
      if (!isEditing) {
        if (data.label !== label) setLabel(data.label || 'Opción');
        if (data.condition !== condition) setCondition(data.condition || 'Contiene: palabra_clave');
        if (data.variables && JSON.stringify(data.variables) !== JSON.stringify(variables)) {
          setVariables(data.variables || []);
        }
      }
    }, [data.label, data.condition, data.variables, isEditing, label, condition, variables]);

    useEffect(() => {
      if (isEditing && inputRef.current) {
        inputRef.current.focus();
      }
    }, [isEditing]);

    const handleDoubleClick = useCallback((e) => {
      e.stopPropagation();
      e.preventDefault();
      console.log(`[OptionNode] Double click on node ${id}, canEdit: ${canEdit}, isEditing: ${isEditing}`);
      if (!canEdit) {
        showError('No tienes permisos para editar este nodo');
        return;
      }
      setIsEditing(true);
    }, [canEdit, showError, id]);

    const cancelEditing = useCallback(() => {
      setLabel(data.label || 'Opción');
      setCondition(data.condition || 'Contiene: palabra_clave');
      setVariables(data.variables || []);
      setIsEditing(false);
      setShowVariableEditor(false);
    }, [data.label, data.condition, data.variables]);

    const finishEditing = useCallback(() => {
      setIsEditing(false);
      setShowVariableEditor(false);

      const hasChanges =
        data.label !== label ||
        data.condition !== condition ||
        JSON.stringify(data.variables) !== JSON.stringify(variables);
      if (hasChanges) {
        const updateData = {
          label,
          condition,
          variables,
          lastModified: new Date().toISOString(),
          modifiedBy: data.currentUser || 'unknown',
        };

        setTimeout(() => {
          data.onChange?.(updateData);

          trackChanges('option', updateData, {
            label: data.label,
            condition: data.condition,
            variables: data.variables,
          }, { label, condition, variables });

          setNodes((nds) => {
            let updatedNodes = nds.map((node) =>
              node.id === id
                ? { ...node, data: { ...node.data, label, condition, variables, lastModified: updateData.lastModified } }
                : node
            );

            if (data.parentDecisionId) {
              updatedNodes = updatedNodes.map((node) => {
                if (node.id === data.parentDecisionId && node.type === 'decision') {
                  const updatedOutputs = node.data.outputs.map((output, index) => {
                    const optionNode = nds.find(
                      (n) => n.id === id && n.data.parentDecisionId === data.parentDecisionId
                    );
                    const optionIndex = nds
                      .filter(
                        (n) => n.type === 'option' && n.data.parentDecisionId === data.parentDecisionId
                      )
                      .findIndex((n) => n.id === id);
                    if (optionIndex === index) {
                      return label;
                    }
                    return output;
                  });
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      outputs: updatedOutputs,
                    },
                  };
                }
                return node;
              });
            }

            return updatedNodes;
          });
        }, 0);
      }

      if (inputRef.current) {
        inputRef.current.blur();
      }
    }, [label, condition, variables, id, data, setNodes, trackChanges]);

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

    const formatLabel = useCallback(() => {
      let formattedLabel = label;
      if (variables.length > 0) {
        variables.forEach((variable) => {
          const regex = new RegExp(`\\{\\{\\s*${variable}\\s*\\}\\}`, 'g');
          formattedLabel = formattedLabel.replace(regex, `<span class="node-variable">${variable}</span>`);
        });
      }
      return data.enableMarkdown ? <ReactMarkdown>{formattedLabel}</ReactMarkdown> : formattedLabel;
    }, [label, variables, data.enableMarkdown]);

    const contextMenuItems = [
      { label: 'Editar', icon: <Edit2 size={14} />, action: handleDoubleClick, disabled: !canEdit },
      { label: 'Ver historial', icon: <CornerDownRight size={14} />, action: () => data.onShowHistory?.(id) },
      { label: 'Duplicar', icon: <Plus size={14} />, action: () => data.onDuplicate?.(id), disabled: !canEdit },
      { label: 'Eliminar', icon: <X size={14} />, action: () => data.onDelete?.(id), disabled: !canDelete },
    ];

    const renderVariableEditor = () => {
      if (!showVariableEditor) return null;
      return (
        <div className="option-node-variable-editor">
          <div className="option-node-variable-editor-header">
            <h4>Variables</h4>
            <button onClick={addVariable} className="option-node-variable-add" aria-label="Agregar variable">
              + Agregar
            </button>
          </div>
          <div className="option-node-variable-list">
            {variables.length === 0 ? (
              <div className="option-node-variable-empty">No hay variables definidas</div>
            ) : (
              variables.map((variable, index) => (
                <div key={index} className="option-node-variable-item">
                  <input
                    value={variable}
                    onChange={(e) => updateVariable(index, e.target.value)}
                    className="option-node-variable-input"
                    aria-label={`Variable ${index + 1}`}
                    onMouseDown={(e) => e.stopPropagation()}
                    onDoubleClick={(e) => e.stopPropagation()}
                  />
                  <button
                    onClick={() => removeVariable(index)}
                    className="option-node-variable-remove"
                    aria-label="Eliminar variable"
                    onMouseDown={(e) => e.stopPropagation()}
                    onDoubleClick={(e) => e.stopPropagation()}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
          <div className="option-node-variable-help">
            <small>Usa {{variable}} en la etiqueta para insertar variables</small>
          </div>
        </div>
      );
    };

    const handleConnectStart = useCallback((event, params) => {
      console.log(`[OptionNode] Connection started from node ${id}, params:`, params);
    }, [id]);

    const handleConnectStop = useCallback((event) => {
      console.log(`[OptionNode] Connection stopped for node ${id}, event:`, event);
    }, [id]);

    const handleDrag = useCallback((event) => {
      console.log(`[OptionNode] Handle dragging for node ${id}, position:`, { x: event.clientX, y: event.clientY });
    }, [id]);

    return (
      <div
        ref={nodeRef}
        className={`
          option-node 
          ${selected ? 'selected' : ''} 
          ${getStatusClass()} 
          ${isEditing ? 'editing' : ''} 
          ${isCollapsed ? 'collapsed' : ''}
          ${isHovered ? 'hovered' : ''}
        `}
        onClick={(e) => {
          e.stopPropagation();
          handleClick(e);
          console.log(`[OptionNode] Node clicked: ${id}, selected: ${selected}`);
        }}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        onMouseDown={(e) => {
          console.log(`[OptionNode] Mouse down on node ${id}, draggable: ${draggable}`);
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: isCollapsed ? 150 : (data.width || 150),
          height: isCollapsed ? 40 : (data.height || 80),
          transition: 'background-color 0.2s, border-color 0.2s, box-shadow 0.2s',
        }}
        role="button"
        aria-label={`Nodo de opción: ${label}`}
        tabIndex={0}
        data-testid="option-node"
        draggable={draggable}
      >
        <Handle
          type="target"
          position={Position.Top}
          id="target"
          isConnectable={isConnectable && !isEditing && !isCollapsed}
          className={`option-node-input ${data.hasActiveInput ? 'active' : ''}`}
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            console.log(`[OptionNode] Target Handle mouse down: ${id}`);
          }}
          onDragStart={(e) => {
            e.stopPropagation();
            e.preventDefault();
            console.log(`[OptionNode] Target Handle drag start: ${id}`);
          }}
          onDrag={(e) => {
            e.stopPropagation();
            handleDrag(e);
          }}
          onDragEnd={(e) => {
            e.stopPropagation();
            console.log(`[OptionNode] Target Handle drag ended: ${id}`);
          }}
          onConnect={(params) => {
            console.log(`[OptionNode] Target Handle connected: ${id}, params:`, params);
          }}
        />
        <div className="option-node-header">
          <div className="option-node-icon" title="Nodo de opción">
            {data.customIcon || <Circle size={16} />}
          </div>
          <div className="option-node-title" title={data.label}>
            {data.label || 'Opción'}
            {data.badge && (
              <span className={`option-node-badge badge-${data.badge.type || 'default'}`}>
                {data.badge.text}
              </span>
            )}
          </div>
          <div className="option-node-controls">
            <button
              className="option-node-collapse-btn"
              onClick={toggleCollapse}
              onMouseDown={(e) => e.stopPropagation()}
              onDoubleClick={(e) => e.stopPropagation()}
              aria-label={isCollapsed ? 'Expandir' : 'Colapsar'}
            >
              {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
          </div>
        </div>
        {!isCollapsed && (
          <>
            <div className="option-node-content">
              {isEditing ? (
                <div className="option-node-edit-container">
                  <input
                    ref={inputRef}
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    onBlur={finishEditing}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        finishEditing();
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        cancelEditing();
                      }
                    }}
                    className="option-node-input"
                    placeholder="Etiqueta de la opción"
                    aria-label="Etiqueta de la opción"
                    onMouseDown={(e) => e.stopPropagation()}
                    onDoubleClick={(e) => e.stopPropagation()}
                  />
                  <input
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    onBlur={finishEditing}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        finishEditing();
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        cancelEditing();
                      }
                    }}
                    className="option-node-input"
                    placeholder="Condición"
                    aria-label="Condición de la opción"
                    onMouseDown={(e) => e.stopPropagation()}
                    onDoubleClick={(e) => e.stopPropagation()}
                  />
                  <div className="option-node-editing-toolbar">
                    <button
                      className={`option-node-tool-btn ${showVariableEditor ? 'active' : ''}`}
                      onClick={toggleVariableEditor}
                      onMouseDown={(e) => e.stopPropagation()}
                      onDoubleClick={(e) => e.stopPropagation()}
                      title="Variables"
                    >
                      {}
                    </button>
                  </div>
                  {renderVariableEditor()}
                </div>
              ) : (
                <div className="option-node-label">
                  {label ? formatLabel() : <em className="option-node-placeholder">Sin etiqueta</em>}
                  <div className="option-node-condition">{condition}</div>
                </div>
              )}
              {data.context && !isEditing && (
                <div className="option-node-context">
                  <small>{data.context}</small>
                </div>
              )}
              {errorMessage && <div className="option-node-error">{errorMessage}</div>}
            </div>
            {!isEditing ? (
              <div className="option-node-footer">
                {canEdit && <small className="option-node-hint">Doble clic para editar</small>}
                {data.metadata && (
                  <div className="option-node-metadata">
                    {data.metadata.date && (
                      <Tooltip content={`Actualizado: ${data.metadata.date}`}>
                        <span className="option-node-date">{formatDateRelative(data.metadata.date)}</span>
                      </Tooltip>
                    )}
                    {data.metadata.owner && (
                      <Tooltip content={`Propietario: ${data.metadata.owner}`}>
                        <span className="option-node-owner">
                          {data.metadata.owner.substring(0, 2).toUpperCase()}
                        </span>
                      </Tooltip>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="option-node-editing-controls">
                <div className="option-node-edit-actions">
                  <button onClick={cancelEditing} className="option-node-cancel-btn" aria-label="Cancelar">
                    Cancelar
                  </button>
                  <button onClick={finishEditing} className="option-node-save-btn" aria-label="Guardar">
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
          id="source"
          isConnectable={isConnectable && !isEditing && !isCollapsed}
          className={`option-node-output ${data.hasActiveOutput ? 'active' : ''}`}
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            console.log(`[OptionNode] Source Handle mouse down: ${id}`);
          }}
          onDragStart={(e) => {
            e.stopPropagation();
            e.preventDefault();
            console.log(`[OptionNode] Source Handle drag start: ${id}`);
          }}
          onDrag={(e) => {
            e.stopPropagation();
            handleDrag(e);
          }}
          onDragEnd={(e) => {
            e.stopPropagation();
            console.log(`[OptionNode] Source Handle drag ended: ${id}`);
          }}
          onConnect={(params) => {
            console.log(`[OptionNode] Source Handle connected: ${id}, params:`, params);
          }}
        />
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
                      let newWidth = node.width || 150;
                      let newHeight = node.height || 80;
                      if (e.key === 'ArrowRight') newWidth += 10;
                      if (e.key === 'ArrowLeft') newWidth = Math.max(150, newWidth - 10);
                      if (e.key === 'ArrowDown') newHeight += 10;
                      if (e.key === 'ArrowUp') newHeight = Math.max(80, newHeight - 10);
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
  }
);

OptionNode.propTypes = {
  data: PropTypes.shape({
    label: PropTypes.string,
    condition: PropTypes.string,
    variables: PropTypes.arrayOf(PropTypes.string),
    status: PropTypes.string,
    isCollapsed: PropTypes.bool,
    enableMarkdown: PropTypes.bool,
    parentDecisionId: PropTypes.string,
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
    hasActiveOutput: PropTypes.bool,
  }).isRequired,
  isConnectable: PropTypes.bool,
  selected: PropTypes.bool,
  id: PropTypes.string.isRequired,
  setNodes: PropTypes.func.isRequired,
  draggable: PropTypes.bool,
};

export default OptionNode;