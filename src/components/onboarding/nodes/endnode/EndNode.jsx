/**
 * @file EndNode.jsx
 * @description Componente para representar el nodo final en el editor de flujos PLUBOT.
 * Implementa diseño optimizado, accesibilidad y características avanzadas.
 * @version 2.0.0
 */

import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import { shallow } from 'zustand/shallow';
import useFlowStore from '@/stores/useFlowStore';
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
import Tooltip from "../../ui/ToolTip";
import ContextMenu from "../../ui/context-menu";
import { formatDateRelative } from '@/utils/date';
import useNode from '@/hooks/useNode';
import ReactMarkdown from '@/lib/simplified-markdown';
import { v4 as uuidv4 } from 'uuid';
import './EndNode.css';

// Configuración del nodo
const NODE_CONFIG = {
  DEFAULT_WIDTH: 200,
  DEFAULT_HEIGHT: 120,
  MIN_WIDTH: 150,
  MIN_HEIGHT: 80,
  COLORS: {
    BACKGROUND: '#ff6b6b',
    BACKGROUND_GRADIENT: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%)',
    BORDER: '#ff5252',
    TEXT: '#ffffff',
    HANDLE: '#ff6b6b',
    HANDLE_HOVER: '#ff8e8e',
  }
};

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
  onNodesChange,
  isUltraPerformanceMode = false,
}) => {
  // Acciones de Zustand para EndNode
  const {
    updateEndNodeLabel,
    updateEndNodeData,
    toggleEndNodeCollapse,
    addEndNodeVariable,
    updateEndNodeVariable,
    removeEndNodeVariable,
    resizeEndNode,
    duplicateNode,
    removeNode
  } = useFlowStore(state => ({
    updateEndNodeLabel: state.updateEndNodeLabel,
    updateEndNodeData: state.updateEndNodeData,
    toggleEndNodeCollapse: state.toggleEndNodeCollapse,
    addEndNodeVariable: state.addEndNodeVariable,
    updateEndNodeVariable: state.updateEndNodeVariable,
    removeEndNodeVariable: state.removeEndNodeVariable,
    resizeEndNode: state.resizeEndNode,
    duplicateNode: state.duplicateNode,
    removeNode: state.removeNode
  }), shallow);

  // Estados locales del componente
  const [label, setLabel] = useState(data.label || 'Fin');
  const [isEditing, setIsEditing] = useState(false);
  const [variables, setVariables] = useState(data.variables || []);
  const [showVariableEditor, setShowVariableEditor] = useState(false);

  // Referencias
  const inputRef = useRef(null);
  const variableEditorRef = useRef(null);

  // Estado para la posición del menú contextual
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });

  // Configuración del nodo usando el hook personalizado
  const {
    isResizing,
    isCollapsed,
    showContextMenu,
    // contextMenuPosition, // Comentado porque ahora usamos el estado local
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
    onNodesChange, 
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
      };
      
      // Registrar cambios y actualizar el nodo
      trackChanges('Nodo de fin actualizado', updateData);
      
      // Usar Zustand para actualizar el nodo si está disponible
      if (updateEndNodeData) {
        updateEndNodeData(id, updateData);
      }
      
      // Mantener compatibilidad con implementación anterior
      if (data.onChange) {
        data.onChange(id, updateData);
      }
    }
  }, [data, id, label, variables, trackChanges, updateEndNodeData]);

  // Alternar la visibilidad del editor de variables
  const toggleVariableEditor = useCallback(() => {
    setShowVariableEditor(prev => !prev);
  }, []);

  // Cerrar el menú contextual
  const closeContextMenu = useCallback(() => {
    setShowContextMenu(false);
  }, [setShowContextMenu]);

  // Añadir una nueva variable
  const addVariable = useCallback(() => {
    const newVar = `var_${variables.length + 1}`;
    
    // Actualizar estado local para la UI
    setVariables([...variables, newVar]);
    
    // Si no estamos en modo edición, actualizar también a través de Zustand
    if (!isEditing && addEndNodeVariable) {
      addEndNodeVariable(id, newVar);
    }
  }, [variables, id, isEditing, addEndNodeVariable]);

  // Eliminar una variable por índice
  const removeVariable = useCallback((index) => {
    // Actualizar estado local para la UI
    setVariables(variables.filter((_, i) => i !== index));
    
    // Si no estamos en modo edición, actualizar también a través de Zustand
    if (!isEditing && removeEndNodeVariable) {
      removeEndNodeVariable(id, index);
    }
  }, [variables, id, isEditing, removeEndNodeVariable]);

  // Actualizar el valor de una variable
  const updateVariable = useCallback((index, value) => {
    // Actualizar estado local para la UI
    const newVariables = [...variables];
    newVariables[index] = value;
    setVariables(newVariables);
    
    // Si no estamos en modo edición, actualizar también a través de Zustand
    if (!isEditing && updateEndNodeVariable) {
      updateEndNodeVariable(id, index, value);
    }
  }, [variables, id, isEditing, updateEndNodeVariable]);

  // Formatear la etiqueta con variables destacadas y/o markdown
  const formatLabel = useMemo(() => {
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

  // Optimizar renderizado de elementos que no cambian frecuentemente
  const renderNodeHeader = useMemo(() => (
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
  ), [data.customIcon, data.badge, isCollapsed, isEditing, toggleCollapse, setShowContextMenu]);

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
        
        // Usar Zustand para duplicar si está disponible
        if (duplicateNode && canEdit) {
          duplicateNode(id, { label: newLabel });
        }
        
        // Mantener compatibilidad con implementación anterior
        if (data.onDuplicate) {
          data.onDuplicate(id, { ...data, id: newId, label: newLabel });
        }
      }, 
      disabled: !canEdit,
      shortcut: 'Ctrl+D'
    },
    {
      label: 'Eliminar',
      icon: <X size={14} />,
      action: () => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este nodo?')) {
          // Usar Zustand para eliminar si está disponible
          if (removeNode && canDelete) {
            removeNode(id);
          }
          
          // Mantener compatibilidad con implementación anterior
          if (data.onDelete) {
            data.onDelete(id);
          }
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

  // Efecto de aparición mejorado con animaciones HD
  useEffect(() => {
    if (nodeRef.current && !isUltraPerformanceMode) {
      // Aplicar efecto de aparición con un ligero retraso para escalonar las animaciones
      const timer = setTimeout(() => {
        nodeRef.current.style.opacity = '1';
        nodeRef.current.style.transform = 'translateY(0) scale(1) translateZ(0)';
      }, Math.random() * 100); // Pequeña variación para que no todos los nodos aparezcan exactamente al mismo tiempo
      
      return () => clearTimeout(timer);
    }
  }, [isUltraPerformanceMode]);

  return (
    <div
      ref={nodeRef}
      className={`end-node${selected ? ' selected' : ''}${isCollapsed ? ' collapsed' : ''}${isUltraPerformanceMode ? ' ultra-performance' : ''}`}
      style={{
        width: `${initialWidth}px`,
        minWidth: `${minWidth}px`,
        minHeight: `${minHeight}px`,
        height: `${initialHeight}px`,
        opacity: isResizing ? 0.7 : 1,
        cursor: isResizing ? 'grabbing' : 'default',
        background: isUltraPerformanceMode ? '#ff6b6b' : 'linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%)',
        boxShadow: isUltraPerformanceMode ? '0 2px 4px rgba(0, 0, 0, 0.1)' : '0 4px 12px rgba(255, 107, 107, 0.2), 0 1px 3px rgba(0, 0, 0, 0.1)',
        border: `1px solid ${selected ? '#ff5252' : 'rgba(255, 107, 107, 0.3)'}`,
        backdropFilter: isUltraPerformanceMode ? 'none' : 'blur(8px)',
        transition: isUltraPerformanceMode ? 'none' : 'all 0.2s cubic-bezier(0.25, 1, 0.5, 1)',
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
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
      {/* Handle de entrada en la parte superior - mejorado para mayor visibilidad y mejor conexión */}
      <Handle
        type="target"
        position={Position.Top}
        id="default" // ID estandarizado para el handle de entrada
        isConnectable={isConnectable && !isEditing}
        className={`end-node-input ${data.hasActiveInput ? 'active' : ''}`}
        aria-label="Conexión de entrada"
        data-testid="end-node-input-handle"
        style={{
          background: '#ff6b6b',
          border: '3px solid white',
          boxShadow: '0 0 0 2px rgba(0, 0, 0, 0.15), 0 4px 6px rgba(0, 0, 0, 0.1)',
          width: '18px',
          height: '18px',
          top: '-10px',
          zIndex: 110,
          transition: isUltraPerformanceMode ? 'none' : 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        onMouseEnter={(e) => {
          // Efecto al pasar el mouse (solo si no está en modo ultra rendimiento)
          if (e.target && !isUltraPerformanceMode) {
            e.target.style.transform = 'scale(1.15) translateZ(0)';
            e.target.style.boxShadow = '0 0 8px rgba(255, 107, 107, 0.8)';
            e.target.style.filter = 'brightness(1.2)';
          }
        }}
        onMouseLeave={(e) => {
          // Restaurar al salir
          if (e.target) {
            e.target.style.transform = '';
            e.target.style.filter = '';
            e.target.style.boxShadow = '0 0 0 2px rgba(0, 0, 0, 0.15), 0 4px 6px rgba(0, 0, 0, 0.1)';
          }
        }}
      />
      
      {renderNodeHeader}
      
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
                {label ? formatLabel : <em className="end-node-placeholder">Sin etiqueta</em>}
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
          onMouseDown={(e) => {
            // Efecto visual al iniciar el redimensionamiento
            if (e.target) {
              e.target.style.transform = 'scale(1.2) translateZ(0)';
              e.target.style.boxShadow = '0 0 12px rgba(255, 107, 107, 0.6)';
              e.target.style.filter = 'brightness(1.1)';
            }
            handleMouseDown(e);
          }}
          onMouseEnter={(e) => {
            // Efecto al pasar el mouse
            if (e.target) {
              e.target.style.transform = 'scale(1.15) translateZ(0)';
              e.target.style.transition = 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)';
            }
          }}
          onMouseLeave={(e) => {
            // Restaurar al salir
            if (e.target) {
              e.target.style.transform = '';
              e.target.style.transition = '';
            }
          }}
          onKeyDown={(e) => {
            if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
              e.preventDefault();
              // Calcular nuevas dimensiones
              let newWidth = initialWidth;
              let newHeight = initialHeight;
              
              // Cambiar dimensiones con teclado
              if (e.key === 'ArrowRight') newWidth += 10;
              if (e.key === 'ArrowLeft') newWidth = Math.max(minWidth, newWidth - 10);
              if (e.key === 'ArrowDown') newHeight += 10;
              if (e.key === 'ArrowUp') newHeight = Math.max(minHeight, newHeight - 10);
              
              // Usar Zustand para redimensionar si está disponible
              if (resizeEndNode) {
                resizeEndNode(id, newWidth, newHeight);
              }
              
              // Mantener compatibilidad con implementación anterior
              if (onNodesChange) {
                onNodesChange([{
                  type: 'change',
                  item: {
                    id: id,
                    width: newWidth,
                    height: newHeight
                  }
                }]);
              }
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
  isUltraPerformanceMode: PropTypes.bool,
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
  onNodesChange: PropTypes.func.isRequired,
};

export default EndNode;
