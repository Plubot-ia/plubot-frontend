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
  CornerDownRight,
  Plus,
  Circle
} from 'lucide-react';
import PropTypes from 'prop-types';
import Tooltip from '@/components/onboarding/ui/ToolTip';
import ContextMenu from '@/components/onboarding/ui/context-menu';
import { formatDateRelative } from '@/utils/date';
import useNode from '@/hooks/useNode';
import ReactMarkdown from '@/lib/simplified-markdown';
import './DecisionNode.css';

// Nota: No es necesario importar CustomEdge aquí, pero para referencia:
// CustomEdge se usa en el componente padre (por ejemplo, App.jsx) para personalizar
// los edges salientes de DecisionNode. Asegúrate de configurar edgeTypes y onConnect
// en <ReactFlow> como se indica en las instrucciones.

const DecisionNode = React.memo(
  ({
    data = {
      question: '¿Cuál es tu pregunta?',
      outputs: ['Sí', 'No'],
      variables: [],
      label: 'Decisión',
      priority: 'normal',
      status: '',
      isCollapsed: false,
      enableMarkdown: false,
    },
    isConnectable = true,
    selected = false,
    id,
    setNodes,
  }) => {
    const [question, setQuestion] = useState(data.question || '¿Cuál es tu pregunta?');
    const [outputs, setOutputs] = useState(data.outputs || ['Sí', 'No']);
    const [isEditing, setIsEditing] = useState(false);
    const [variables, setVariables] = useState(data.variables || []);
    const [showVariableEditor, setShowVariableEditor] = useState(false);

    const textareaRef = useRef(null);

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
    } = useNode({ id, data, setNodes, isConnectable, minWidth: 180, minHeight: 110 });

    useEffect(() => {
      if (!isEditing) {
        if (data.question !== question) setQuestion(data.question || '¿Cuál es tu pregunta?');
        if (data.outputs && JSON.stringify(data.outputs) !== JSON.stringify(outputs)) setOutputs(data.outputs || ['Sí', 'No']);
        if (data.variables && JSON.stringify(data.variables) !== JSON.stringify(variables)) {
          setVariables(data.variables || []);
        }
      }
    }, [data.question, data.outputs, data.variables, isEditing]);

    useEffect(() => {
      if (isEditing && textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        textareaRef.current.focus();
      }
    }, [isEditing, question]);

    const handleDoubleClick = useCallback(() => {
      if (!canEdit) {
        showError('No tienes permisos para editar este nodo');
        return;
      }
      setIsEditing(true);
    }, [canEdit, showError]);

    const cancelEditing = useCallback(() => {
      setQuestion(data.question || '¿Cuál es tu pregunta?');
      setOutputs(data.outputs || ['Sí', 'No']);
      setVariables(data.variables || []);
      setIsEditing(false);
      setShowVariableEditor(false);
    }, [data.question, data.outputs, data.variables]);

    const finishEditing = useCallback(() => {
      setIsEditing(false);
      setShowVariableEditor(false);

      const hasChanges =
        data.question !== question ||
        JSON.stringify(data.outputs) !== JSON.stringify(outputs) ||
        JSON.stringify(data.variables) !== JSON.stringify(variables);
      if (hasChanges) {
        const updateData = {
          question,
          outputs,
          variables,
          lastModified: new Date().toISOString(),
          modifiedBy: data.currentUser || 'unknown',
        };

        setTimeout(() => {
          data.onChange?.(updateData);

          trackChanges('decision', updateData, {
            question: data.question,
            outputs: data.outputs,
            variables: data.variables,
          }, { question, outputs, variables });

          setNodes((nds) => {
            let updatedNodes = nds.map((node) =>
              node.id === id
                ? {
                    ...node,
                    data: { ...node.data, ...updateData },
                  }
                : node
            );

            const existingOptionNodes = updatedNodes.filter(
              (node) => node.type === 'option' && node.data.parentDecisionId === id
            );

            const currentOutputLabels = outputs.map((output) => output.toLowerCase());
            updatedNodes = updatedNodes.filter(
              (node) => !(node.type === 'option' && node.data.parentDecisionId === id && !currentOutputLabels.includes(node.data.label.toLowerCase()))
            );

            const parentNode = updatedNodes.find((node) => node.id === id);
            const parentPosition = parentNode?.position || { x: 0, y: 0 };
            const parentWidth = parentNode?.width || 180;

            outputs.forEach((output, index) => {
              const existingNode = existingOptionNodes.find(
                (node) => node.data.label.toLowerCase() === output.toLowerCase()
              );
              const uniqueId = `option-${id}-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

              if (!existingNode) {
                const newOptionNode = {
                  id: uniqueId,
                  type: 'option',
                  position: {
                    x: parentPosition.x + parentWidth + 80,
                    y: parentPosition.y + (index - outputs.length / 2) * 100 + 50,
                  },
                  data: {
                    label: output,
                    condition: `Contiene: ${output.toLowerCase()}`,
                    parentDecisionId: id,
                    createdAt: new Date().toISOString(),
                    createdBy: data.currentUser || 'unknown',
                    width: 150,
                    height: 80,
                    variables: [],
                    status: '',
                    isCollapsed: false,
                  },
                  draggable: true,
                  selectable: true,
                  connectable: true,
                  zIndex: 1000,
                };
                updatedNodes.push(newOptionNode);
                console.log(`[DecisionNode] Created new OptionNode: ${uniqueId}, Label: ${output}`);
              } else {
                updatedNodes = updatedNodes.map((node) =>
                  node.id === existingNode.id
                    ? {
                        ...node,
                        data: {
                          ...node.data,
                          label: output,
                          condition: `Contiene: ${output.toLowerCase()}`,
                          status: node.data.status || '',
                          isCollapsed: node.data.isCollapsed || false,
                        },
                        draggable: true,
                        selectable: true,
                        connectable: true,
                      }
                    : node
                );
              }
            });

            return updatedNodes;
          });
        }, 0);
      }

      if (textareaRef.current) {
        textareaRef.current.blur();
      }
    }, [question, outputs, variables, id, data, setNodes, trackChanges]);

    const handleOptionChange = useCallback((index, value) => {
      setOutputs((prev) => {
        const newOutputs = [...prev];
        newOutputs[index] = value;
        return newOutputs;
      });
    }, []);

    const addOption = useCallback((e) => {
      e.stopPropagation();
      setOutputs((prev) => [...prev, `Opción ${prev.length + 1}`]);
    }, []);

    const removeOption = useCallback(
      (index) => {
        if (outputs.length <= 2) {
          showError('Se requieren al menos dos opciones');
          return;
        }
        setOutputs((prev) => prev.filter((_, i) => i !== index));
      },
      [outputs.length, showError]
    );

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

    const formatQuestion = useCallback(() => {
      let formattedQuestion = question;
      if (variables.length > 0) {
        variables.forEach((variable) => {
          const regex = new RegExp(`\\{\\{\\s*${variable}\\s*\\}\\}`, 'g');
          formattedQuestion = formattedQuestion.replace(regex, `<span class="node-variable">${variable}</span>`);
        });
      }
      return data.enableMarkdown ? <ReactMarkdown>{formattedQuestion}</ReactMarkdown> : formattedQuestion;
    }, [question, variables, data.enableMarkdown]);

    const getOutputHandles = () => {
      if (isCollapsed) return null;
      return outputs.map((option, index) => {
        const totalHandles = outputs.length;
        const spacing = 100 / (totalHandles + 1);
        const position = (index + 1) * spacing;
        return (
          <React.Fragment key={index}>
            <Handle
              type="source"
              position={Position.Bottom}
              id={`output-${index}`}
              isConnectable={isConnectable && !isEditing}
              className={`decision-node-output ${data.activeOutputs?.includes(index) ? 'active' : ''}`}
              style={{
                left: `${position}%`,
                width: '12px',
                height: '12px',
                background: '#667eea', // Restaurar color original
                border: '1px solid #fff',
                transform: 'translateX(-50%)',
                bottom: '-6px',
              }}
            />
            <div
              className="decision-node-output-label"
              style={{
                left: `${position}%`,
                bottom: '-30px',
                transform: 'translateX(-50%)',
                fontSize: '12px',
                color: '#666',
                whiteSpace: 'nowrap',
              }}
              title={option}
            >
              {isEditing ? (
                <div className="decision-node-output-edit">
                  <input
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="decision-node-output-input"
                    aria-label={`Opción ${index + 1}`}
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                  {outputs.length > 2 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeOption(index);
                      }}
                      className="decision-node-remove-option"
                      aria-label="Eliminar opción"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ) : (
                <span className="decision-node-output-text">{option}</span>
              )}
            </div>
          </React.Fragment>
        );
      });
    };

    const getPriorityIcon = useCallback(() => {
      switch (data.priority) {
        case 'high':
          return <AlertTriangle size={14} className="priority-high" />;
        case 'medium':
          return <AlertTriangle size={14} className="priority-medium" />;
        case 'low':
          return <AlertCircle size={14} className="priority-low" />;
        default:
          return <Circle size={14} className="priority-normal" />;
      }
    }, [data.priority]);

    const contextMenuItems = [
      { label: 'Editar', icon: <Edit2 size={14} />, action: handleDoubleClick, disabled: !canEdit },
      { label: 'Ver historial', icon: <CornerDownRight size={14} />, action: () => data.onShowHistory?.(id) },
      { label: 'Duplicar', icon: <Plus size={14} />, action: () => data.onDuplicate?.(id), disabled: !canEdit },
      { label: 'Eliminar', icon: <X size={14} />, action: () => data.onDelete?.(id), disabled: !canDelete },
    ];

    const renderVariableEditor = () => {
      if (!showVariableEditor) return null;
      return (
        <div className="decision-node-variable-editor">
          <div className="decision-node-variable-editor-header">
            <h4>Variables</h4>
            <button onClick={addVariable} className="decision-node-variable-add" aria-label="Agregar variable">
              + Agregar
            </button>
          </div>
          <div className="decision-node-variable-list">
            {variables.length === 0 ? (
              <div className="decision-node-variable-empty">No hay variables definidas</div>
            ) : (
              variables.map((variable, index) => (
                <div key={index} className="decision-node-variable-item">
                  <input
                    value={variable}
                    onChange={(e) => updateVariable(index, e.target.value)}
                    className="decision-node-variable-input"
                    aria-label={`Variable ${index + 1}`}
                  />
                  <button
                    onClick={() => removeVariable(index)}
                    className="decision-node-variable-remove"
                    aria-label="Eliminar variable"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
          <div className="decision-node-variable-help">
            <small>Usa {{variable}} en la pregunta para insertar variables</small>
          </div>
        </div>
      );
    };

    return (
      <div
        ref={nodeRef}
        className={`
          decision-node 
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
          width: isCollapsed ? 150 : (data.width || 180),
          height: isCollapsed ? 40 : (data.height || 110),
          transition: 'background-color 0.2s, border-color 0.2s, box-shadow 0.2s',
        }}
        role="button"
        aria-label={`Nodo de decisión: ${question}`}
        tabIndex={0}
      >
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={isConnectable && !isEditing}
          className={`decision-node-input ${data.hasActiveInput ? 'active' : ''}`}
        />
        <div className="decision-node-header">
          <div className="decision-node-icon" title={data.iconTitle || 'Nodo de decisión'}>
            {data.customIcon || data.icon || '🔄'}
          </div>
          <div className="decision-node-title" title={data.label}>
            {data.label || 'Decisión'}
            {data.badge && (
              <span className={`decision-node-badge badge-${data.badge.type || 'default'}`}>
                {data.badge.text}
              </span>
            )}
          </div>
          <div className="decision-node-controls">
            {data.priority && (
              <Tooltip content={`Prioridad: ${data.priority}`}>
                <div className={`decision-node-priority priority-${data.priority}`}>{getPriorityIcon()}</div>
              </Tooltip>
            )}
            <button
              className="decision-node-collapse-btn"
              onClick={toggleCollapse}
              aria-label={isCollapsed ? 'Expandir' : 'Colapsar'}
            >
              {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
          </div>
        </div>
        {!isCollapsed && (
          <>
            <div className="decision-node-content">
              {isEditing ? (
                <div className="decision-node-edit-container">
                  <textarea
                    ref={textareaRef}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
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
                    className="decision-node-textarea"
                    placeholder="Escribe la pregunta..."
                    aria-label="Pregunta de decisión"
                    rows={3}
                    style={{ maxHeight: '200px', overflowY: 'auto' }}
                  />
                  <div className="decision-node-editing-toolbar">
                    <button
                      className={`decision-node-tool-btn ${showVariableEditor ? 'active' : ''}`}
                      onClick={toggleVariableEditor}
                      title="Variables"
                    >
                      {}
                    </button>
                  </div>
                  {renderVariableEditor()}
                </div>
              ) : (
                <div className="decision-node-question">
                  {question ? formatQuestion() : <em className="decision-node-placeholder">¿Cuál es tu pregunta?</em>}
                </div>
              )}
              {data.context && !isEditing && (
                <div className="decision-node-context">
                  <small>{data.context}</small>
                </div>
              )}
              {errorMessage && <div className="decision-node-error">{errorMessage}</div>}
            </div>
            {!isEditing ? (
              <div className="decision-node-footer">
                {canEdit && <small className="decision-node-hint">Doble clic para editar</small>}
                {data.metadata && (
                  <div className="decision-node-metadata">
                    {data.metadata.date && (
                      <Tooltip content={`Actualizado: ${data.metadata.date}`}>
                        <span className="decision-node-date">{formatDateRelative(data.metadata.date)}</span>
                      </Tooltip>
                    )}
                    {data.metadata.owner && (
                      <Tooltip content={`Propietario: ${data.metadata.owner}`}>
                        <span className="decision-node-owner">
                          {data.metadata.owner.substring(0, 2).toUpperCase()}
                        </span>
                      </Tooltip>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="decision-node-editing-controls">
                <button
                  onClick={addOption}
                  className="decision-node-add-option"
                  aria-label="Agregar opción"
                >
                  <Plus size={14} /> Agregar Opción
                </button>
                <div className="decision-node-edit-actions">
                  <button onClick={cancelEditing} className="decision-node-cancel-btn" aria-label="Cancelar">
                    Cancelar
                  </button>
                  <button onClick={finishEditing} className="decision-node-save-btn" aria-label="Guardar">
                    Guardar
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        {getOutputHandles()}
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
                      let newWidth = node.width || 180;
                      let newHeight = node.height || 110;
                      if (e.key === 'ArrowRight') newWidth += 10;
                      if (e.key === 'ArrowLeft') newWidth = Math.max(180, newWidth - 10);
                      if (e.key === 'ArrowDown') newHeight += 10;
                      if (e.key === 'ArrowUp') newHeight = Math.max(110, newHeight - 10);
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

DecisionNode.propTypes = {
  data: PropTypes.shape({
    question: PropTypes.string,
    outputs: PropTypes.arrayOf(PropTypes.string),
    variables: PropTypes.arrayOf(PropTypes.string),
    label: PropTypes.string,
    priority: PropTypes.string,
    isCollapsed: PropTypes.bool,
    width: PropTypes.number,
    height: PropTypes.number,
    status: PropTypes.string,
    customIcon: PropTypes.node,
    icon: PropTypes.string,
    iconTitle: PropTypes.string,
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
    activeOutputs: PropTypes.arrayOf(PropTypes.number),
    enableMarkdown: PropTypes.bool,
  }).isRequired,
  isConnectable: PropTypes.bool,
  selected: PropTypes.bool,
  id: PropTypes.string.isRequired,
  setNodes: PropTypes.func.isRequired,
};

export default DecisionNode;