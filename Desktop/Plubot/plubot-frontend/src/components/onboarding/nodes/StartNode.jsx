import React, { useState, useCallback, useEffect, useRef, memo } from 'react';
import { Handle, Position } from 'reactflow';
import { 
  MoreHorizontal, 
  Edit2, 
  X, 
  Plus, 
  CornerRightDown, 
  ChevronDown, 
  ChevronUp,
  Rocket
} from 'lucide-react';
import ContextMenu from '@/components/onboarding/ui/context-menu';
import { usePermissions } from '@/hooks/usePermissions';
import useNode from '@/hooks/useNode';
import PropTypes from 'prop-types';
import './StartNode.css';

const StartNode = memo(({ 
  data = { label: 'Inicio' }, 
  isConnectable = true, 
  selected = false, 
  id, 
  setNodes 
}) => {
  const [label, setLabel] = useState(data.label || 'Inicio');
  const inputRef = useRef(null);
  
  // Configuración del nodo usando el hook personalizado
  const {
    isEditing,
    setIsEditing,
    isCollapsed,
    errorMessage,
    isHovered,
    setIsHovered,
    nodeRef,
    handleDoubleClick,
    toggleCollapse,
    handleMouseDown,
    saveChanges,
    minWidth,
    minHeight,
    initialWidth,
    initialHeight,
  } = useNode({ 
    id, 
    data, 
    setNodes, 
    isConnectable, 
    minWidth: 100, // Aumentado ligeramente para mejor legibilidad
    minHeight: 50 
  });
  
  const { canEdit, canDelete } = usePermissions();
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });

  // Actualizar etiqueta cuando cambien los datos
  useEffect(() => {
    if (!isEditing && data.label !== label) {
      setLabel(data.label || 'Inicio');
    }
  }, [data.label, isEditing, label]);

  // Enfocar el input cuando se active el modo de edición
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select(); // Seleccionar todo el texto para facilitar la edición
    }
  }, [isEditing]);

  // Manejar el guardado del cambio de etiqueta
  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (data.label !== label) {
      const updateData = {
        label,
        lastModified: new Date().toISOString(),
        modifiedBy: data.currentUser || 'unknown',
      };
      saveChanges(updateData, { label: data.label }, 'start');
    }
  }, [label, data, saveChanges, setIsEditing]);

  // Manejar eventos de teclado durante la edición
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleBlur();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsEditing(false);
        setLabel(data.label || 'Inicio');
      }
    },
    [handleBlur, data.label, setIsEditing]
  );

  // Manejar clic en el nodo
  const handleClick = useCallback((e) => {
    e.stopPropagation();
    data.onSelect?.();
  }, [data]);

  // Manejar el menú contextual
  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  }, []);

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
      icon: <CornerRightDown size={14} />, 
      action: () => data.onShowHistory?.(id) 
    },
    { 
      label: 'Duplicar', 
      icon: <Plus size={14} />, 
      action: () => data.onDuplicate?.(id), 
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

  return (
    <div
      ref={nodeRef}
      className={`start-node ${selected ? 'selected' : ''} ${isEditing ? 'editing' : ''} ${
        isCollapsed ? 'collapsed' : ''
      } ${isHovered ? 'hovered' : ''}`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: isCollapsed ? 80 : data.width || initialWidth,
        height: isCollapsed ? 40 : data.height || initialHeight,
        transition: 'all 0.2s ease',
      }}
      role="button"
      aria-label={`Nodo de inicio: ${label}`}
      data-testid="start-node"
      data-node-id={id}
      tabIndex={0}
      onKeyDown={(e) => {
        // Navegación por teclado
        if (e.key === 'Enter' && !isEditing) {
          handleDoubleClick(e);
        }
      }}
    >
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable && !isEditing}
        className="start-node-handle"
        aria-label="Conexión de salida"
      />

      <div className="start-node-header">
        <div className="start-node-icon" aria-hidden="true">
          <Rocket size={16} />
        </div>
        <div className="start-node-title">Inicio</div>
        {!isCollapsed && (
          <div className="start-node-controls">
            <button
              className="start-node-collapse-btn"
              onClick={(e) => {
                e.stopPropagation();
                toggleCollapse();
              }}
              aria-label={isCollapsed ? 'Expandir' : 'Colapsar'}
            >
              {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
            <button
              className="start-node-menu-btn"
              onClick={(e) => {
                e.stopPropagation();
                setContextMenuPosition({ x: e.clientX, y: e.clientY });
                setShowContextMenu(true);
              }}
              aria-label="Menú"
            >
              <MoreHorizontal size={16} />
            </button>
          </div>
        )}
      </div>

      {!isCollapsed && (
        <div className="start-node-content">
          {isEditing ? (
            <input
              ref={inputRef}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="start-node-input"
              placeholder="Etiqueta del nodo"
              aria-label="Etiqueta del nodo de inicio"
              maxLength={50}
            />
          ) : (
            <div className="start-node-label" title={label}>
              {label || <em className="start-node-placeholder">Sin etiqueta</em>}
            </div>
          )}
          {errorMessage && (
            <div className="start-node-error" role="alert">
              {errorMessage}
            </div>
          )}
        </div>
      )}

      {!isCollapsed && !isEditing && (
        <>
          <div className="start-node-footer">
            {canEdit && (
              <small className="start-node-hint">
                Doble clic para editar
              </small>
            )}
            {data.lastModified && (
              <small className="start-node-modified">
                {new Date(data.lastModified).toLocaleDateString()}
              </small>
            )}
          </div>
          <div
            className="resize-handle"
            onMouseDown={handleMouseDown}
            style={{ cursor: 'nwse-resize' }}
            aria-label="Redimensionar nodo"
            tabIndex={0}
            role="button"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                // Iniciar el redimensionamiento con teclado
                // (requeriría implementación adicional para funcionar completamente)
                e.preventDefault();
              }
            }}
          />
        </>
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

StartNode.displayName = 'StartNode';

StartNode.propTypes = {
  data: PropTypes.shape({
    label: PropTypes.string,
    onSelect: PropTypes.func,
    onShowHistory: PropTypes.func,
    onDuplicate: PropTypes.func,
    onDelete: PropTypes.func,
    currentUser: PropTypes.string,
    lastModified: PropTypes.string,
    width: PropTypes.number,
    height: PropTypes.number,
  }),
  isConnectable: PropTypes.bool,
  selected: PropTypes.bool,
  id: PropTypes.string.isRequired,
  setNodes: PropTypes.func.isRequired,
};

export default StartNode;