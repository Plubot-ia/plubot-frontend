import React, { useState, useCallback, useMemo, memo, useRef, useEffect, Suspense, lazy } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import PropTypes from 'prop-types';
import { produce } from 'immer';
import { debounce } from 'lodash';
import './StartNode.css';

// Componentes cargados de forma diferida para optimizar rendimiento
const ContextMenu = lazy(() => import('../../ui/context-menu'));
const StartNodeError = lazy(() => import('./StartNodeError'));
const StartNodeControls = lazy(() => import('./StartNodeControls'));

// Configuración centralizada para el nodo
const NODE_CONFIG = {
  TYPE: 'start',
  DEFAULT_LABEL: 'Inicio',
  MIN_WIDTH: 100,
  MIN_HEIGHT: 50,
  INITIAL_WIDTH: 150,
  INITIAL_HEIGHT: 60,
  DEBOUNCE_DELAY: 300,
  MAX_LABEL_LENGTH: 50,
  TRANSITION_DURATION: 200,
  ANIMATION_DURATION: 300,
  COLORS: {
    PRIMARY: '#0080ff',
    SECONDARY: '#00e0ff',
    TEXT: '#ffffff',
    BORDER: '#0060c0',
    HANDLE: '#00a0ff',
    HANDLE_HOVER: '#00c0ff',
    ERROR: '#ff3333',
    SUCCESS: '#33cc33',
    WARNING: '#ffcc00',
    SELECTED: '#00c0ff',
    SHADOW: 'rgba(0, 128, 255, 0.5)',
    BACKGROUND: 'linear-gradient(135deg, #0080ff 0%, #0060c0 100%)',
    BACKGROUND_HOVER: 'linear-gradient(135deg, #0090ff 0%, #0070d0 100%)',
    BACKGROUND_SELECTED: 'linear-gradient(135deg, #00a0ff 0%, #0080e0 100%)',
  },
  HANDLE_POSITIONS: {
    TOP: Position.Top,
    RIGHT: Position.Right,
    BOTTOM: Position.Bottom,
    LEFT: Position.Left,
  },
  ACCESSIBILITY: {
    ARIA_LABEL: 'Nodo de inicio del flujo',
    ROLE: 'button',
    TABINDEX: 0,
  },
  ANIMATIONS: {
    HOVER: {
      SCALE: 1.02,
      SHADOW: '0 8px 20px rgba(0, 128, 255, 0.3)',
      TRANSITION: 'all 0.3s ease',
    },
    SELECTED: {
      SCALE: 1.05,
      SHADOW: '0 10px 25px rgba(0, 128, 255, 0.4)',
      TRANSITION: 'all 0.3s ease',
    },
    ULTRA_PERFORMANCE: {
      ENABLED: false,
    },
  },
};

/**
 * Componente StartNode - Nodo de inicio para el flujo
 * 
 * @component
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.data - Datos del nodo
 * @param {string} props.data.label - Etiqueta del nodo
 * @param {Function} props.data.onSelect - Función para seleccionar el nodo
 * @param {Function} props.data.onShowHistory - Función para mostrar el historial del nodo
 * @param {Function} props.data.onDuplicate - Función para duplicar el nodo
 * @param {Function} props.data.onDelete - Función para eliminar el nodo
 * @param {string} props.data.currentUser - Usuario actual
 * @param {string} props.data.lastModified - Fecha de última modificación
 * @param {string} props.data.handlePosition - Posición del handle (top, right, bottom, left)
 * @param {boolean} props.isConnectable - Indica si el nodo puede conectarse
 * @param {boolean} props.selected - Indica si el nodo está seleccionado
 * @param {string} props.id - ID único del nodo
 * @param {Function} props.setNodes - Función para actualizar los nodos
 * @param {Function} props.setEdges - Función para actualizar las conexiones
 * @param {boolean} props.isUltraPerformanceMode - Indica si está activado el modo de ultra rendimiento
 * @param {Object} props.position - Posición del nodo en el canvas
 * @returns {React.ReactElement} Componente StartNode
 */
const StartNode = memo(({ data = {}, isConnectable = true, selected = false, id, setNodes, setEdges, isUltraPerformanceMode = false, position = { x: 0, y: 0 } }) => {
  // Referencias
  const inputRef = useRef(null);
  const nodeRef = useRef(null);
  const menuRef = useRef(null);
  const reactFlowInstance = useReactFlow();
  
  // Estados
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label || NODE_CONFIG.DEFAULT_LABEL);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Validación de datos para evitar errores
  const safeData = useMemo(() => ({
    label: data.label || NODE_CONFIG.DEFAULT_LABEL,
    onSelect: typeof data.onSelect === 'function' ? data.onSelect : () => {},
    onShowHistory: typeof data.onShowHistory === 'function' ? data.onShowHistory : () => {},
    onDuplicate: typeof data.onDuplicate === 'function' ? data.onDuplicate : () => {},
    onDelete: typeof data.onDelete === 'function' ? data.onDelete : () => {},
    currentUser: data.currentUser || '',
    lastModified: data.lastModified || '',
    handlePosition: data.handlePosition || 'bottom',
  }), [data]);
  
  // Determinar la posición del handle
  const handlePosition = useMemo(() => {
    const pos = safeData.handlePosition.toUpperCase();
    return NODE_CONFIG.HANDLE_POSITIONS[pos] || NODE_CONFIG.HANDLE_POSITIONS.BOTTOM;
  }, [safeData.handlePosition]);
  
  // Función debounced para actualizar la etiqueta
  const debouncedSetLabel = useCallback(
    debounce((value) => {
      setLabel(value);
    }, NODE_CONFIG.DEBOUNCE_DELAY),
    []
  );
  
  // Clases CSS para el nodo
  const nodeClasses = useMemo(() => [
    'start-node',
    selected ? 'start-node--selected' : '',
    isEditing ? 'start-node--editing' : '',
    isHovered ? 'start-node--hovered' : '',
    errorMessage ? 'start-node--has-error' : '',
    isUltraPerformanceMode ? 'start-node--ultra-performance' : '',
  ].filter(Boolean).join(' '), [selected, isEditing, isHovered, errorMessage, isUltraPerformanceMode]);
  
  // Manejar doble clic para editar
  const handleDoubleClick = useCallback(() => {
    if (!isEditing && !isUltraPerformanceMode) {
      setIsEditing(true);
      // Enfoque en el input después de renderizar
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  }, [isEditing, isUltraPerformanceMode]);
  
  // Elementos del menú contextual
  const contextMenuItems = useMemo(() => [
    { id: 'edit', label: 'Editar', icon: 'edit', onClick: () => handleDoubleClick() },
    { id: 'history', label: 'Ver historial', icon: 'history', onClick: () => safeData.onShowHistory(id) },
    { id: 'duplicate', label: 'Duplicar', icon: 'copy', onClick: () => safeData.onDuplicate(id) },
    { id: 'delete', label: 'Eliminar', icon: 'trash', onClick: () => safeData.onDelete(id) },
  ], [id, safeData, handleDoubleClick]);
  
  // Estilos para el nodo
  const nodeStyle = useMemo(() => {
    const baseStyle = {
      minWidth: NODE_CONFIG.MIN_WIDTH,
      minHeight: NODE_CONFIG.MIN_HEIGHT,
      background: NODE_CONFIG.COLORS.BACKGROUND,
      boxShadow: 'none',
      transition: isUltraPerformanceMode ? 'none' : NODE_CONFIG.ANIMATIONS.HOVER.TRANSITION,
    };
    
    if (isUltraPerformanceMode) {
      return baseStyle;
    }
    
    if (selected) {
      return {
        ...baseStyle,
        background: NODE_CONFIG.COLORS.BACKGROUND_SELECTED,
        boxShadow: `0 0 0 2px ${NODE_CONFIG.COLORS.SELECTED}, ${NODE_CONFIG.ANIMATIONS.SELECTED.SHADOW}`,
        transform: `scale(${NODE_CONFIG.ANIMATIONS.SELECTED.SCALE})`,
      };
    }
    
    if (isHovered && !isEditing) {
      return {
        ...baseStyle,
        background: NODE_CONFIG.COLORS.BACKGROUND_HOVER,
        boxShadow: NODE_CONFIG.ANIMATIONS.HOVER.SHADOW,
        transform: `scale(${NODE_CONFIG.ANIMATIONS.HOVER.SCALE})`,
      };
    }
    
    return baseStyle;
  }, [selected, isHovered, isEditing, isUltraPerformanceMode]);
  
  // Función para guardar cambios en el nodo
  const saveChanges = useCallback((updateData, prevData = {}, nodeType = NODE_CONFIG.TYPE) => {
    setIsSaving(true);
    try {
      // Actualización inmutable con immer
      setNodes((nds) => produce(nds, (draft) => {
        const node = draft.find((n) => n.id === id);
        if (node) {
          node.data = { ...node.data, ...updateData };
        }
      }));
      
      setErrorMessage('');
      return true;
    } catch (error) {
      console.error('Error al guardar cambios en el nodo:', error);
      setErrorMessage('Error al guardar los cambios');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [id, setNodes]);
  
  // Manejar pérdida de foco
  const handleBlur = useCallback(async () => {
    if (!isEditing) return;
    
    setIsSaving(true);
    try {
      const trimmedLabel = label.trim();
      if (!trimmedLabel) {
        setLabel(safeData.label);
        setErrorMessage('La etiqueta no puede estar vacía');
        return;
      }
      
      // Si no hay cambios, no hacemos nada
      if (trimmedLabel === safeData.label) {
        setIsEditing(false);
        return;
      }
      
      // Actualizar el nodo con la nueva etiqueta
      const success = await saveChanges({ label: trimmedLabel });
      if (success) {
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error al procesar el blur:', error);
      setErrorMessage('Error al guardar los cambios');
    } finally {
      setIsSaving(false);
    }
  }, [isEditing, label, safeData.label, saveChanges]);
  
  // Manejar teclas (Enter para guardar, Escape para cancelar)
  const handleKeyDown = useCallback((e) => {
    if (!isEditing) return;
    
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBlur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setLabel(safeData.label);
      setIsEditing(false);
      setErrorMessage('');
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      if (e.ctrlKey || e.metaKey) {
        e.stopPropagation(); // Evitar que se propague al editor de flujo
      }
    } else if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
      // Duplicar nodo con Ctrl+D o Cmd+D
      e.preventDefault();
      e.stopPropagation();
      if (typeof safeData.onDuplicate === 'function') {
        safeData.onDuplicate(id);
      }
    } else if (e.key === 'e' && (e.ctrlKey || e.metaKey)) {
      // Editar nodo con Ctrl+E o Cmd+E
      e.preventDefault();
      e.stopPropagation();
      handleDoubleClick();
    } else if (e.key === 'Delete' && (e.ctrlKey || e.metaKey || e.shiftKey)) {
      // Eliminar nodo con Ctrl+Delete, Cmd+Delete o Shift+Delete
      e.preventDefault();
      e.stopPropagation();
      if (typeof safeData.onDelete === 'function') {
        safeData.onDelete(id);
      }
    }
  }, [isEditing, handleBlur, safeData, handleDoubleClick, id]);
  
  // Manejar clic derecho para menú contextual
  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    if (isUltraPerformanceMode) return;
    
    const rect = nodeRef.current.getBoundingClientRect();
    setContextMenuPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setShowContextMenu(true);
    
    // Notificar selección del nodo
    if (typeof safeData.onSelect === 'function') {
      safeData.onSelect(id);
    }
  }, [id, safeData, isUltraPerformanceMode]);
  
  // Manejar entrada del mouse
  const handleMouseEnter = useCallback(() => {
    if (!isEditing && !isUltraPerformanceMode) {
      setIsHovered(true);
      setShowTooltip(true);
    }
  }, [isUltraPerformanceMode, isEditing]);
  
  // Manejar salida del mouse
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setShowTooltip(false);
  }, []);
  
  // Cerrar menú contextual al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowContextMenu(false);
      }
    };
    
    if (showContextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showContextMenu]);
  
  // Formatear fecha relativa
  const formatDateRelative = useCallback((dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMin = Math.floor(diffMs / (1000 * 60));
      
      if (diffMin < 1) return 'hace unos segundos';
      if (diffMin < 60) return `hace ${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'}`;
      
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return `hace ${diffHour} ${diffHour === 1 ? 'hora' : 'horas'}`;
      
      const diffDay = Math.floor(diffHour / 24);
      if (diffDay < 30) return `hace ${diffDay} ${diffDay === 1 ? 'día' : 'días'}`;
      
      return date.toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  }, []);
  
  return (
    <div 
      ref={nodeRef}
      className={nodeClasses}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onKeyDown={handleKeyDown}
      style={nodeStyle}
      role={NODE_CONFIG.ACCESSIBILITY.ROLE}
      aria-label={`${NODE_CONFIG.ACCESSIBILITY.ARIA_LABEL}: ${safeData.label}`}
      aria-expanded={isEditing}
      aria-describedby={errorMessage ? 'start-node-error' : undefined}
      tabIndex={NODE_CONFIG.ACCESSIBILITY.TABINDEX}
      data-testid="start-node"
    >
      {/* Handle de salida en la posición configurada */}
      <Handle
        type="source"
        position={handlePosition}
        id="a"
        isConnectable={isConnectable}
        style={{
          background: isHovered && !isUltraPerformanceMode ? NODE_CONFIG.COLORS.HANDLE_HOVER : NODE_CONFIG.COLORS.HANDLE,
          border: `1px solid ${NODE_CONFIG.COLORS.BORDER}`,
          transition: isUltraPerformanceMode ? 'none' : 'all 0.2s ease',
        }}
      />
      
      {/* Contenido principal del nodo */}
      <div className="start-node__content">
        {/* Cabecera del nodo */}
        <div className="start-node__header">
          {isEditing ? (
            <input
              ref={inputRef}
              className="start-node__input"
              value={label}
              onChange={(e) => debouncedSetLabel(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              maxLength={NODE_CONFIG.MAX_LABEL_LENGTH}
              aria-label="Nombre del nodo de inicio"
              disabled={isSaving}
              autoFocus
            />
          ) : (
            <div className="start-node__label">
              {safeData.label}
            </div>
          )}
        </div>
        
        {/* Información adicional */}
        {!isUltraPerformanceMode && safeData.lastModified && (
          <div className="start-node__meta">
            <span className="start-node__timestamp">
              {formatDateRelative(safeData.lastModified)}
            </span>
            {safeData.currentUser && (
              <span className="start-node__user">
                por {safeData.currentUser}
              </span>
            )}
          </div>
        )}
        
        {/* Mensaje de error */}
        {errorMessage && (
          <Suspense fallback={<div className="start-node__error-fallback">Error</div>}>
            <StartNodeError message={errorMessage} id="start-node-error" />
          </Suspense>
        )}
        
        {/* Controles adicionales */}
        {!isUltraPerformanceMode && !isEditing && isHovered && (
          <Suspense fallback={null}>
            <StartNodeControls 
              onEdit={handleDoubleClick} 
              onDelete={() => safeData.onDelete(id)}
              onDuplicate={() => safeData.onDuplicate(id)}
            />
          </Suspense>
        )}
      </div>
      
      {/* Menú contextual */}
      {showContextMenu && !isUltraPerformanceMode && (
        <Suspense fallback={<div className="context-menu-fallback">Cargando...</div>}>
          <div ref={menuRef} style={{ position: 'absolute', left: contextMenuPosition.x, top: contextMenuPosition.y }}>
            <ContextMenu items={contextMenuItems} onClose={() => setShowContextMenu(false)} />
          </div>
        </Suspense>
      )}
      
      {/* Tooltip */}
      {showTooltip && !isUltraPerformanceMode && (
        <div className="start-node__tooltip">
          <div className="start-node__tooltip-content">
            <div className="start-node__tooltip-header">
              <strong>Nodo de inicio</strong>
              <span className="start-node__tooltip-hint">Editar con doble clic</span>
              {safeData.lastModified && (
                <span className="start-node__tooltip-meta">
                  Actualizado: {formatDateRelative(safeData.lastModified)}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Texto para lectores de pantalla */}
      <span className="sr-only">
        Nodo de inicio: {safeData.label}. 
        {isEditing ? 'En modo de edición.' : 'Editar con doble clic.'}
        {safeData.lastModified && ` Actualizado: ${formatDateRelative(safeData.lastModified)}.`}
        {errorMessage && ` Error: ${errorMessage}`}
      </span>
    </div>
  );
});

// Establecer displayName para DevTools
StartNode.displayName = 'StartNode';

// PropTypes para validación de tipos
StartNode.propTypes = {
  data: PropTypes.object,
  isConnectable: PropTypes.bool,
  selected: PropTypes.bool,
  id: PropTypes.string.isRequired,
  setNodes: PropTypes.func.isRequired,
  setEdges: PropTypes.func,
  isUltraPerformanceMode: PropTypes.bool,
  position: PropTypes.object
};

export default StartNode;
