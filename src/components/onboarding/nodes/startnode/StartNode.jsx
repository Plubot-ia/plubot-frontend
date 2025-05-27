/**
 * @file StartNode.jsx
 * @description Componente optimizado para el nodo de inicio en el editor de flujos Plubot
 * Con integración directa con Zustand y estructura modular de alto rendimiento
 */

import React, { useState, useCallback, useMemo, memo, useRef, useEffect, Suspense, lazy } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import PropTypes from 'prop-types';
import useFlowStore from '@/stores/useFlowStore';
import debounce from 'lodash/debounce';
import './StartNode.css';

// Componentes cargados de forma diferida para optimizar rendimiento
const ContextMenu = lazy(() => import('../../ui/context-menu'));
const Tooltip = lazy(() => import('../../ui/ToolTip'));

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
 * Subcomponente para la cabecera del nodo de inicio
 * @param {Object} props - Propiedades del componente
 * @returns {JSX.Element} - Cabecera del nodo de inicio
 */
const StartNodeHeader = memo(({ label, isEditing, isUltraMode, lastModified }) => {
  const formattedDate = useMemo(() => {
    if (!lastModified) return '';
    try {
      const date = new Date(lastModified);
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return '';
    }
  }, [lastModified]);

  return (
    <div className="start-node__header">
      <div className="start-node__icon-container">
        <div className="start-node__icon" aria-hidden="true">
          <div className="start-node__icon-circle" />
        </div>
      </div>
      <div className="start-node__title">
        {isEditing ? null : (
          <span className="start-node__label">{label}</span>
        )}
      </div>
      {!isUltraMode && lastModified && (
        <div className="start-node__timestamp" title={`Última modificación: ${formattedDate}`}>
          <small>{formattedDate}</small>
        </div>
      )}
    </div>
  );
});

/**
 * Subcomponente para el contenido editable del nodo de inicio
 * @param {Object} props - Propiedades del componente
 * @returns {JSX.Element} - Contenido editable del nodo de inicio
 */
const StartNodeContent = memo(({ 
  isEditing, 
  label, 
  inputRef, 
  handleBlur, 
  handleKeyDown, 
  handleLabelChange, 
  isUltraMode, 
  errorMessage 
}) => {
  return (
    <div className="start-node__content">
      {isEditing ? (
        <input
          ref={inputRef}
          className="start-node__input"
          value={label}
          onChange={handleLabelChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="Nombre del inicio..."
          maxLength={NODE_CONFIG.MAX_LABEL_LENGTH}
          aria-label="Nombre del nodo de inicio"
          autoFocus
        />
      ) : null}
      
      {errorMessage && (
        <div className="start-node__error" role="alert">
          {errorMessage}
        </div>
      )}
      
      {isUltraMode && (
        <div className="start-node__ultra-indicator" aria-hidden="true">
          ULTRA
        </div>
      )}
    </div>
  );
});

/**
 * Componente principal StartNode - Nodo de inicio para el flujo
 * Implementado con integración directa a Zustand para mejor rendimiento y mantenibilidad
 * @param {Object} props - Propiedades del componente
 * @returns {JSX.Element} - Componente StartNode
 */
const StartNode = memo(({ id, selected = false, isConnectable = true, isUltraPerformanceMode = false }) => {
  // Referencias
  const inputRef = useRef(null);
  const nodeRef = useRef(null);
  const menuRef = useRef(null);
  const dataRef = useRef({});
  
  // Estado local
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // ReactFlow hooks
  const reactFlow = useReactFlow();
  
  // Zustand store
  const {
    nodes,
    edges,
    deleteNode,
    updateStartNodeLabel,
    updateStartNodeHandlePosition,
    toggleStartNodeFeature,
  } = useFlowStore(state => ({
    nodes: state.nodes,
    edges: state.edges,
    deleteNode: state.deleteNode,
    updateStartNodeLabel: state.updateStartNodeLabel,
    updateStartNodeHandlePosition: state.updateStartNodeHandlePosition,
    toggleStartNodeFeature: state.toggleStartNodeFeature,
  }));
  
  // Obtener datos del nodo
  const node = useMemo(() => nodes.find(n => n.id === id), [nodes, id]);
  
  // Extraer datos del nodo
  const { data = {} } = node || {};
  const {
    label = NODE_CONFIG.DEFAULT_LABEL,
    handlePosition = 'bottom',
    lastModified,
    isMinimized = false,
    isLocked = false,
    features = {},
  } = data;
  
  // Clases CSS
  const nodeClasses = useMemo(() => {
    const classes = ['start-node'];
    
    if (selected) classes.push('start-node--selected');
    if (isHovered) classes.push('start-node--hovered');
    if (isEditing) classes.push('start-node--editing');
    if (isMinimized) classes.push('start-node--minimized');
    if (isLocked) classes.push('start-node--locked');
    if (isUltraPerformanceMode) classes.push('start-node--ultra');
    
    return classes.join(' ');
  }, [selected, isHovered, isEditing, isMinimized, isLocked, isUltraPerformanceMode]);
  
  // Funciones de manejo de eventos que podrían ser usadas en menuOptions
  const handleDoubleClick = useCallback((e) => {
    if (e) {
      e.stopPropagation();
    }
    
    setIsEditing(true);
    
    // Enfoque en input después de renderizado
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 0);
  }, [setIsEditing, inputRef]);

  // Opciones del menú contextual
  const menuOptions = useMemo(() => [
    {
      label: 'Editar etiqueta',
      icon: 'edit',
      action: () => handleDoubleClick(),
    },
    {
      label: 'Cambiar posición del conector',
      icon: 'swap_vert',
      subItems: [
        {
          label: 'Arriba',
          action: () => updateStartNodeHandlePosition(id, 'top'),
          checked: handlePosition === 'top',
        },
        {
          label: 'Derecha',
          action: () => updateStartNodeHandlePosition(id, 'right'),
          checked: handlePosition === 'right',
        },
        {
          label: 'Abajo',
          action: () => updateStartNodeHandlePosition(id, 'bottom'),
          checked: handlePosition === 'bottom',
        },
        {
          label: 'Izquierda',
          action: () => updateStartNodeHandlePosition(id, 'left'),
          checked: handlePosition === 'left',
        },
      ],
    },
    {
      label: 'Eliminar nodo',
      icon: 'delete',
      action: () => {
        if (window.confirm('¿Estás seguro de eliminar este nodo de inicio?')) {
          deleteNode(id);
        }
      },
      className: 'context-menu-item--danger',
    },
  ], [id, handlePosition, updateStartNodeHandlePosition, deleteNode, handleDoubleClick]);
  
  // Función para manejar clicks fuera del menú - definida fuera del effect
  const handleOutsideClick = useCallback((e) => {
    try {
      console.log('[StartNode] handleOutsideClick: menuRef is', menuRef, 'e is', e);
      // Verificar que menuRef.current existe y que contiene es una función
      if (menuRef?.current && typeof menuRef.current.contains === 'function' && e?.target) {
        if (!menuRef.current.contains(e.target)) {
          setShowContextMenu(false);
        }
      } else {
        // Esta rama se alcanza si menuRef.current es null/undefined, o .contains no es una función, o e.target es falsy.
        console.log('[StartNode] handleOutsideClick: Main condition failed. menuRef.current:', menuRef?.current, 'typeof menuRef.current.contains:', typeof menuRef?.current?.contains, 'e.target:', e?.target);
        setShowContextMenu(false);
      }
    } catch (error) {
      // En caso de cualquier error, simplemente cerrar el menú
      console.error('[StartNode] CATCH BLOCK in handleOutsideClick: Error:', error, 'menuRef was:', menuRef, 'e was:', e);
      setShowContextMenu(false);
    }
  }, [menuRef, setShowContextMenu]);

  // Uso de un único effect para manejar la adición y eliminación de eventos
  useEffect(() => {
    // No hacer nada si no se muestra el menú contextual
    if (!showContextMenu) return;
    
    // Solo agregamos el listener si el menú está abierto
    document.addEventListener('mousedown', handleOutsideClick);
    
    // Cleanup function - siempre se ejecuta cuando el componente se desmonta
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showContextMenu, handleOutsideClick]); // Dependemos de showContextMenu y handleOutsideClick
  
  // Funciones de manejo de eventos
  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  }, []);
  
  const handleLabelChange = useCallback((e) => {
    const value = e.target.value;
    dataRef.current = { ...dataRef.current, label: value };
  }, []);
  
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      inputRef.current.blur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsEditing(false);
    }
  }, []);
  
  const handleBlur = useCallback(() => {
    const newLabel = dataRef.current.label;
    
    if (newLabel !== undefined && newLabel !== label) {
      try {
        updateStartNodeLabel(id, newLabel);
      } catch (error) {
        setErrorMessage('Error al actualizar la etiqueta');
        console.error('Error actualizando etiqueta:', error);
        
        // Limpiar mensaje de error después de un tiempo
        setTimeout(() => setErrorMessage(''), 3000);
      }
    }
    
    setIsEditing(false);
  }, [id, label, updateStartNodeLabel]);
  
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    
    // Mostrar tooltip después de un tiempo
    const tooltipTimer = setTimeout(() => {
      if (isHovered) {
        setShowTooltip(true);
      }
    }, 800);
    
    return () => clearTimeout(tooltipTimer);
  }, [isHovered]);
  
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setShowTooltip(false);
  }, []);
  
  // Posición del handle según configuración
  const handlePositionValue = useMemo(() => {
    switch (handlePosition) {
      case 'top': return Position.Top;
      case 'right': return Position.Right;
      case 'left': return Position.Left;
      case 'bottom':
      default: return Position.Bottom;
    }
  }, [handlePosition]);
  
  // Renderizado del componente
  return (
    <div
      className={nodeClasses}
      ref={nodeRef}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role={NODE_CONFIG.ACCESSIBILITY.ROLE}
      aria-label={NODE_CONFIG.ACCESSIBILITY.ARIA_LABEL}
      tabIndex={NODE_CONFIG.ACCESSIBILITY.TABINDEX}
      data-testid="start-node"
      data-node-id={id}
      style={{
        opacity: isSaving ? 0.7 : 1,
      }}
    >
      <StartNodeHeader
        label={label}
        isEditing={isEditing}
        isUltraMode={isUltraPerformanceMode}
        lastModified={lastModified}
      />
      
      <StartNodeContent
        isEditing={isEditing}
        label={dataRef.current.label !== undefined ? dataRef.current.label : label}
        inputRef={inputRef}
        handleBlur={handleBlur}
        handleKeyDown={handleKeyDown}
        handleLabelChange={handleLabelChange}
        isUltraMode={isUltraPerformanceMode}
        errorMessage={errorMessage}
      />
      
      {/* Handle de conexión según posición configurada */}
      <Handle
        type="source"
        position={handlePositionValue}
        isConnectable={isConnectable && !isLocked}
        className={`start-node__handle start-node__handle--${handlePosition}`}
        id="start-handle"
        style={{ opacity: isUltraPerformanceMode ? 0.5 : 1 }}
      />
      
      {/* Menú contextual */}
      {showContextMenu && (
        <Suspense fallback={null}>
          <ContextMenu
            ref={menuRef}
            options={menuOptions}
            position={contextMenuPosition}
            onClose={() => setShowContextMenu(false)}
          />
        </Suspense>
      )}
      
      {/* Tooltip */}
      {showTooltip && !isUltraPerformanceMode && (
        <Suspense fallback={null}>
          <Tooltip
            content={
              <div>
                <strong>{label}</strong>
                <div>ID: {id}</div>
                {lastModified && (
                  <div>Última modificación: {new Date(lastModified).toLocaleString()}</div>
                )}
                <div>Posición del conector: {handlePosition}</div>
                <div>Conexiones: {edges.filter(e => e.source === id).length}</div>
              </div>
            }
            position="top"
          />
        </Suspense>
      )}
      
      {/* Indicador de guardado */}
      {isSaving && (
        <div className="start-node__saving-indicator">
          Guardando...
        </div>
      )}
    </div>
  );
});

// PropTypes
StartNode.propTypes = {
  id: PropTypes.string.isRequired,
  selected: PropTypes.bool,
  isConnectable: PropTypes.bool,
  isUltraPerformanceMode: PropTypes.bool,
};

StartNodeHeader.propTypes = {
  label: PropTypes.string.isRequired,
  isEditing: PropTypes.bool,
  isUltraMode: PropTypes.bool,
  lastModified: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

StartNodeContent.propTypes = {
  isEditing: PropTypes.bool,
  label: PropTypes.string,
  inputRef: PropTypes.object,
  handleBlur: PropTypes.func.isRequired,
  handleKeyDown: PropTypes.func.isRequired,
  handleLabelChange: PropTypes.func.isRequired,
  isUltraMode: PropTypes.bool,
  errorMessage: PropTypes.string,
};

export default StartNode;
