import React, { useState, useCallback, useEffect, useRef, memo, useMemo } from 'react';
import { Handle, Position } from 'reactflow';
import { 
  MoreHorizontal, 
  Edit2, 
  X, 
  Plus, 
  CornerRightDown, 
  ChevronDown, 
  ChevronUp,
  Rocket,
  Info
} from 'lucide-react';
import ContextMenu from '@/components/onboarding/ui/context-menu';
import { usePermissions } from '@/hooks/usePermissions';
import useNode from '@/hooks/useNode';
import PropTypes from 'prop-types';
import './StartNode.css';

// Constantes para mejorar la legibilidad y mantenimiento
const NODE_TYPE = 'start';
const DEFAULT_LABEL = 'Inicio';
const MIN_WIDTH = 120; // Aumentado para mejor legibilidad
const MIN_HEIGHT = 60; // Aumentado para mejor usabilidad

/**
 * StartNode - Nodo de inicio para el flujo de trabajo
 * 
 * Componente optimizado para alto rendimiento y experiencia de usuario premium
 */
const StartNode = memo(({ 
  data = { label: DEFAULT_LABEL }, 
  isConnectable = true, 
  selected = false, 
  id, 
  setNodes 
}) => {
  // Estado local optimizado con valor inicial desde props
  const [label, setLabel] = useState(data.label || DEFAULT_LABEL);
  const inputRef = useRef(null);
  
  // Configuración del nodo usando el hook personalizado con constantes para mejor mantenimiento
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
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    nodeType: NODE_TYPE
  });
  
  const { canEdit, canDelete } = usePermissions();
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });

  // Actualizar etiqueta cuando cambien los datos - Optimizado con dependencias mínimas
  useEffect(() => {
    if (!isEditing && data.label !== label) {
      setLabel(data.label || DEFAULT_LABEL);
    }
  }, [data.label, isEditing, label]);

  // Enfocar el input cuando se active el modo de edición - Con cleanup para prevenir memory leaks
  useEffect(() => {
    let timeoutId;
    if (isEditing && inputRef.current) {
      // Usar setTimeout para asegurar que el DOM esté listo
      timeoutId = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select(); // Seleccionar todo el texto para facilitar la edición
      }, 10);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isEditing]);

  // Manejar el guardado del cambio de etiqueta - Optimizado con memoización
  const handleBlur = useCallback(() => {
    setIsEditing(false);
    
    // Solo guardar si hay cambios reales
    if (data.label !== label && label.trim()) {
      const updateData = {
        label: label.trim(), // Eliminar espacios en blanco innecesarios
        lastModified: new Date().toISOString(),
        modifiedBy: data.currentUser || 'unknown',
      };
      saveChanges(updateData, { label: data.label }, NODE_TYPE);
    } else if (!label.trim()) {
      // Si la etiqueta está vacía, restaurar al valor anterior
      setLabel(data.label || DEFAULT_LABEL);
    }
  }, [label, data, saveChanges, setIsEditing]);

  // Manejar eventos de teclado durante la edición - Optimizado con memoización
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleBlur();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsEditing(false);
        setLabel(data.label || DEFAULT_LABEL);
      }
    },
    [handleBlur, data.label, setIsEditing]
  );

  // Manejar clic en el nodo - Optimizado con memoización
  const handleClick = useCallback((e) => {
    e.stopPropagation();
    // Prevenir múltiples clics rápidos
    if (data.onSelect && typeof data.onSelect === 'function') {
      data.onSelect();
    }
  }, [data]);

  // Manejar el menú contextual - Optimizado con memoización
  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevenir propagación de eventos
    
    // Calcular posición para asegurar que el menú no se salga de la pantalla
    const x = Math.min(e.clientX, window.innerWidth - 200);
    const y = Math.min(e.clientY, window.innerHeight - 300);
    
    setContextMenuPosition({ x, y });
    setShowContextMenu(true);
  }, []);

  // Opciones del menú contextual - Optimizado y mejorado con nuevas funcionalidades
  const contextMenuItems = useMemo(() => [
    { 
      label: 'Editar', 
      icon: <Edit2 size={14} />, 
      action: handleDoubleClick, 
      disabled: !canEdit,
      shortcut: 'F2',
      description: 'Modificar la etiqueta del nodo'
    },
    { 
      label: 'Ver historial', 
      icon: <CornerRightDown size={14} />, 
      action: () => {
        if (data.onShowHistory && typeof data.onShowHistory === 'function') {
          data.onShowHistory(id);
        }
      },
      description: 'Ver historial de cambios'
    },
    {
      label: 'Información',
      icon: <Info size={14} />,
      action: () => {
        // Mostrar información detallada del nodo
        const createdDate = data.createdAt ? new Date(data.createdAt).toLocaleString() : 'Desconocido';
        const modifiedDate = data.lastModified ? new Date(data.lastModified).toLocaleString() : 'Nunca';
        const creator = data.createdBy || 'Desconocido';
        const modifier = data.modifiedBy || 'Nadie';
        
        alert(`Información del Nodo\n\nID: ${id}\nTipo: Nodo de Inicio\nCreado: ${createdDate}\nCreador: ${creator}\nÚltima modificación: ${modifiedDate}\nModificado por: ${modifier}`);
      },
      description: 'Ver detalles técnicos del nodo'
    },
    { 
      label: 'Duplicar', 
      icon: <Plus size={14} />, 
      action: () => {
        if (data.onDuplicate && typeof data.onDuplicate === 'function') {
          data.onDuplicate(id);
        }
      }, 
      disabled: !canEdit,
      shortcut: 'Ctrl+D',
      description: 'Crear una copia de este nodo'
    },
    {
      label: 'Eliminar',
      icon: <X size={14} />,
      action: () => {
        // Confirmación mejorada para eliminar nodo
        if (window.confirm(`¿Estás seguro de que quieres eliminar este nodo de inicio?\n\nEsta acción no se puede deshacer.`)) {
          if (data.onDelete && typeof data.onDelete === 'function') {
            data.onDelete(id);
          }
        }
      },
      disabled: !canDelete,
      shortcut: 'Del',
      description: 'Eliminar permanentemente este nodo',
      danger: true // Marcar como acción peligrosa
    },
  ], [id, handleDoubleClick, canEdit, canDelete, data]);

  return (
    <div
      // Renderizado optimizado con React.memo y useMemo para prevenir re-renderizados innecesarios
      className={`start-node ${selected ? 'selected' : ''} ${isEditing ? 'editing' : ''} ${isHovered ? 'hovered' : ''} ${errorMessage ? 'has-error' : ''}`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      ref={nodeRef}
      style={{
        width: `${initialWidth}px`,
        height: `${initialHeight}px`,
        minWidth: `${minWidth}px`,
        minHeight: `${minHeight}px`,
        willChange: 'transform, opacity', // Optimización de rendimiento para animaciones
      }}
      aria-label="Nodo de inicio"
      role="button"
      tabIndex={0}
    >
      {/* Cabecera del nodo con diseño mejorado */}
      <div className="start-node-header">
        <div className="start-node-icon" title="Nodo de inicio">
          <Rocket size={16} />
        </div>
        <div className="start-node-title">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="start-node-input"
              maxLength={50} // Limitar la longitud para evitar problemas de diseño
              aria-label="Nombre del nodo"
              placeholder="Nombre del nodo..."
              autoComplete="off"
            />
          ) : (
            <span className="start-node-label" title={label}>{label}</span>
          )}
        </div>
        <div className="start-node-controls">
          {!isEditing && (
            <>
              <button
                className="start-node-button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCollapse();
                }}
                title={isCollapsed ? 'Expandir' : 'Colapsar'}
                aria-label={isCollapsed ? 'Expandir' : 'Colapsar'}
              >
                {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </button>
              <button
                className="start-node-button"
                onClick={(e) => {
                  e.stopPropagation();
                  // Posición optimizada para evitar que el menú se salga de la pantalla
                  const rect = e.currentTarget.getBoundingClientRect();
                  setContextMenuPosition({ 
                    x: Math.min(rect.right, window.innerWidth - 200),
                    y: Math.min(rect.bottom, window.innerHeight - 300) 
                  });
                  setShowContextMenu(true);
                }}
                title="Menú de opciones"
                aria-label="Abrir menú de opciones"
              >
                <MoreHorizontal size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Contenido del nodo con transición suave */}
      {!isCollapsed && (
        <div className="start-node-content">
          <div className="start-node-description">
            {data.description || 'Nodo de inicio del flujo. Desde aquí comienza la ejecución del proceso.'}
          </div>
          {data.metadata && (
            <div className="start-node-metadata">
              <div className="metadata-item">
                <span className="metadata-label">Creado:</span>
                <span className="metadata-value">{data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'N/A'}</span>
              </div>
              {data.lastModified && (
                <div className="metadata-item">
                  <span className="metadata-label">Última edición:</span>
                  <span className="metadata-value">{new Date(data.lastModified).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mensaje de error con animación mejorada */}
      {errorMessage && (
        <div className="start-node-error" role="alert">
          <X size={12} className="error-icon" />
          {errorMessage}
        </div>
      )}

      {/* Conector de salida optimizado */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="start-node-handle"
        isConnectable={isConnectable}
        id="start-output"
        title="Conectar con el siguiente nodo"
      />

      {/* Controlador de redimensionamiento mejorado */}
      <div
        className="resize-handle"
        onMouseDown={handleMouseDown}
        role="button"
        tabIndex={0}
        aria-label="Redimensionar nodo"
        title="Arrastrar para redimensionar"
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
});

StartNode.displayName = 'StartNode';

StartNode.propTypes = {
  data: PropTypes.shape({
    label: PropTypes.string,
    description: PropTypes.string,
    onSelect: PropTypes.func,
    onShowHistory: PropTypes.func,
    onDuplicate: PropTypes.func,
    onDelete: PropTypes.func,
    currentUser: PropTypes.string,
    createdAt: PropTypes.string,
    createdBy: PropTypes.string,
    lastModified: PropTypes.string,
    modifiedBy: PropTypes.string,
    width: PropTypes.number,
    height: PropTypes.number,
    metadata: PropTypes.object,
    error: PropTypes.string,
  }),
  isConnectable: PropTypes.bool,
  selected: PropTypes.bool,
  id: PropTypes.string.isRequired,
  setNodes: PropTypes.func.isRequired,
};

export default StartNode;