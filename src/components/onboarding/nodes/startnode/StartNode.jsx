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
  DEFAULT_DYNAMIC_CONTENT: 'Bienvenido al flujo de inicio.',
  MIN_WIDTH: 180, // Ajustado para más contenido
  MIN_HEIGHT: 100, // Ajustado para más contenido
  DEBOUNCE_DELAY: 300,
  MAX_LABEL_LENGTH: 50,
  MAX_DYNAMIC_CONTENT_LENGTH: 200,
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
  // HANDLE_POSITIONS eliminado, ya no es configurable para StartNode
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
      ENABLED: false, // Esto se controlará por prop isUltraPerformanceMode
    },
  },
};

/**
 * Subcomponente para la cabecera del nodo de inicio
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
      console.warn('[StartNodeHeader] Error formatting date:', e);
      return '';
    }
  }, [lastModified]);

  return (
    <div className="start-node__header">
      <div className="start-node__icon-container">
        {/* Icono SVG de 'Play' para representar inicio */}
        <svg className="start-node__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20px" height="20px" aria-hidden="true">
          <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18c.62-.39.62-1.29 0-1.69L9.54 5.98C8.87 5.55 8 6.03 8 6.82z"/>
        </svg>
      </div>
      <div className="start-node__title-container">
        {isEditing ? null : (
          <span className="start-node__label">{label || NODE_CONFIG.DEFAULT_LABEL}</span>
        )}
      </div>
      {!isUltraMode && formattedDate && (
        <div className="start-node__timestamp" title={`Última modificación: ${formattedDate}`}>
          <small>{formattedDate}</small>
        </div>
      )}
    </div>
  );
});
StartNodeHeader.propTypes = {
  label: PropTypes.string,
  isEditing: PropTypes.bool,
  isUltraMode: PropTypes.bool,
  lastModified: PropTypes.string,
};

/**
 * Subcomponente para el contenido editable y visualización del nodo de inicio
 */
const StartNodeContent = memo(({ 
  isEditing, 
  currentLabel, 
  currentDynamicContent,
  inputRef, 
  textareaRef, // Nueva ref para textarea
  handleLabelChange, 
  handleDynamicContentChange, // Nuevo handler
  handleKeyDown, // Puede usarse para ambos inputs
  handleBlur, // Puede usarse para ambos inputs
  isUltraMode, 
  errorMessage 
}) => {
  return (
    <div className={`start-node__content ${isEditing ? 'start-node__content--editing' : ''}`}>
      {isEditing ? (
        <>
          <input
            ref={inputRef}
            className="start-node__input start-node__input--label"
            value={currentLabel}
            onChange={handleLabelChange}
            onBlur={handleBlur} // El blur general guardará
            onKeyDown={handleKeyDown}
            placeholder="Título del inicio..."
            maxLength={NODE_CONFIG.MAX_LABEL_LENGTH}
            aria-label="Título del nodo de inicio"
            autoFocus
          />
          <textarea
            ref={textareaRef} // Usar la nueva ref
            className="start-node__input start-node__input--dynamic-content"
            value={currentDynamicContent}
            onChange={handleDynamicContentChange}
            onBlur={handleBlur} // El blur general guardará
            onKeyDown={handleKeyDown} // Podría tener lógica específica si es necesario (ej. Shift+Enter)
            placeholder="Mensaje de inicio..."
            maxLength={NODE_CONFIG.MAX_DYNAMIC_CONTENT_LENGTH}
            aria-label="Contenido dinámico del nodo de inicio"
            rows={3} // Ajustar según necesidad
          />
        </>
      ) : (
        <div className="start-node__display-content">
          <p className="start-node__display-dynamic-content">
            {currentDynamicContent || NODE_CONFIG.DEFAULT_DYNAMIC_CONTENT}
          </p>
        </div>
      )}
      
      {errorMessage && (
        <div className="start-node__error" role="alert">
          {errorMessage}
        </div>
      )}
      
      {isUltraMode && !isEditing && (
        <div className="start-node__ultra-indicator" aria-hidden="true">
          ULTRA
        </div>
      )}
    </div>
  );
});
StartNodeContent.propTypes = {
  isEditing: PropTypes.bool,
  currentLabel: PropTypes.string,
  currentDynamicContent: PropTypes.string,
  inputRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.instanceOf(Element) })]),
  textareaRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.instanceOf(Element) })]),
  handleLabelChange: PropTypes.func,
  handleDynamicContentChange: PropTypes.func,
  handleKeyDown: PropTypes.func,
  handleBlur: PropTypes.func,
  isUltraMode: PropTypes.bool,
  errorMessage: PropTypes.string,
};


/**
 * Componente principal StartNode
 */
const StartNode = memo(({ id, data, selected = false, isConnectable = true, isUltraPerformanceMode = false }) => {
  // Referencias
  const inputRef = useRef(null);
  const textareaRef = useRef(null); // Nueva ref para textarea
  const nodeRef = useRef(null);
  const menuRef = useRef(null);
  
  // Estado local
  const [isEditing, setIsEditing] = useState(false);
  const [currentLabel, setCurrentLabel] = useState(data?.label || NODE_CONFIG.DEFAULT_LABEL);
  const [currentDynamicContent, setCurrentDynamicContent] = useState(data?.dynamicContent || NODE_CONFIG.DEFAULT_DYNAMIC_CONTENT);
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false); // Considerar si aún es necesario
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false); // Para feedback visual de guardado
  
  // ReactFlow hooks
  const { setNodes, getNodes } = useReactFlow(); // Para actualizar el nodo localmente si es necesario
  
  // Zustand store actions
  // Asumimos que updateNodeData es la acción correcta para actualizar y persistir.
  // Si no existe, se debería crear en useFlowStore.
  const updateNodeDataInStore = useFlowStore(state => state.updateNodeData); 
  const deleteNodeFromStore = useFlowStore(state => state.deleteNode);

  // Sincronizar estado local si 'data' prop cambia desde el exterior
  useEffect(() => {
    if (data?.label !== currentLabel) {
      setCurrentLabel(data?.label || NODE_CONFIG.DEFAULT_LABEL);
    }
    if (data?.dynamicContent !== currentDynamicContent) {
      setCurrentDynamicContent(data?.dynamicContent || NODE_CONFIG.DEFAULT_DYNAMIC_CONTENT);
    }
  }, [data?.label, data?.dynamicContent]);

  const handleSave = useCallback(() => {
    setIsEditing(false);
    setErrorMessage(''); // Limpiar errores al guardar

    const trimmedLabel = currentLabel.trim();
    const finalLabel = trimmedLabel || NODE_CONFIG.DEFAULT_LABEL;
    const finalDynamicContent = currentDynamicContent.trim() || NODE_CONFIG.DEFAULT_DYNAMIC_CONTENT;

    if (updateNodeDataInStore) {
      setIsSaving(true);
      // Preparamos el objeto de datos completo para el nodo
      const newNodeData = {
        ...data, // Mantenemos otros datos existentes
        label: finalLabel,
        dynamicContent: finalDynamicContent,
        lastModified: new Date().toISOString(),
      };
      updateNodeDataInStore(id, newNodeData)
        .then(() => {
          // Opcional: actualizar localmente si el store no fuerza re-render inmediato con nuevos datos
          // const nodes = getNodes().map(n => n.id === id ? { ...n, data: newNodeData } : n);
          // setNodes(nodes);
        })
        .catch(err => {
          console.error('[StartNode] Error saving data:', err);
          setErrorMessage('Error al guardar. Intente de nuevo.');
        })
        .finally(() => setIsSaving(false));
    } else {
      console.warn('[StartNode] updateNodeDataInStore no está disponible en useFlowStore.');
      // Fallback: actualizar solo visualmente si no hay función de guardado (no recomendado para producción)
      const nodes = getNodes().map(n => n.id === id ? { ...n, data: { ...data, label: finalLabel, dynamicContent: finalDynamicContent } } : n);
      setNodes(nodes);
    }
    setCurrentLabel(finalLabel); // Actualiza el estado local también
    setCurrentDynamicContent(finalDynamicContent);
  }, [id, currentLabel, currentDynamicContent, data, updateNodeDataInStore, getNodes, setNodes]);

  const debouncedSave = useMemo(() => debounce(handleSave, NODE_CONFIG.DEBOUNCE_DELAY), [handleSave]);

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleLabelChange = useCallback((event) => {
    setCurrentLabel(event.target.value);
    debouncedSave();
  }, [debouncedSave]);

  const handleDynamicContentChange = useCallback((event) => {
    setCurrentDynamicContent(event.target.value);
    debouncedSave();
  }, [debouncedSave]);

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Enter' && !event.shiftKey) { // Guardar con Enter (si no es Shift+Enter en textarea)
      if (event.target.tagName.toLowerCase() === 'input' || (event.target.tagName.toLowerCase() === 'textarea' && !event.shiftKey)) {
        event.preventDefault();
        handleSave();
      }
    }
    if (event.key === 'Escape') { // Cancelar edición con Escape
      setIsEditing(false);
      setCurrentLabel(data?.label || NODE_CONFIG.DEFAULT_LABEL); // Revertir
      setCurrentDynamicContent(data?.dynamicContent || NODE_CONFIG.DEFAULT_DYNAMIC_CONTENT); // Revertir
      setErrorMessage('');
    }
  }, [handleSave, data?.label, data?.dynamicContent]);

  const handleBlur = useCallback(() => {
    // Solo guardar si realmente se estaba editando para evitar guardados innecesarios
    if (isEditing) {
      handleSave();
    }
  }, [isEditing, handleSave]);

  // Manejo del menú contextual
  const handleContextMenu = useCallback((event) => {
    event.preventDefault();
    setShowContextMenu(true);
    setContextMenuPosition({ x: event.pageX, y: event.pageY });
  }, []);

  const closeContextMenu = useCallback(() => {
    setShowContextMenu(false);
  }, []);

  const contextMenuItems = useMemo(() => [
    {
      label: isEditing ? 'Guardar Cambios' : 'Editar Nodo',
      icon: isEditing ? 'save' : 'edit',
      action: () => {
        if (isEditing) {
          handleSave();
        } else {
          setIsEditing(true);
        }
      },
    },
    // Ya no hay opción para cambiar posición del handle
    {
      label: 'Eliminar Nodo',
      icon: 'delete',
      action: () => deleteNodeFromStore && deleteNodeFromStore(id),
      className: 'context-menu-item--danger',
    },
  ], [id, isEditing, handleSave, deleteNodeFromStore]);
  
  // Clases dinámicas para el nodo
  const nodeClasses = useMemo(() => {
    let baseClass = 'start-node';
    if (isUltraPerformanceMode) baseClass += ' start-node--ultra-performance';
    if (selected) baseClass += ' start-node--selected';
    if (isHovered && !selected) baseClass += ' start-node--hovered'; // Solo hover si no está seleccionado
    if (isEditing) baseClass += ' start-node--editing';
    if (errorMessage) baseClass += ' start-node--has-error';
    if (isSaving) baseClass += ' start-node--saving'; // Clase para feedback de guardado
    return baseClass;
  }, [selected, isHovered, isEditing, errorMessage, isSaving, isUltraPerformanceMode]);

  // Efecto para enfocar el input/textarea al entrar en modo edición
  useEffect(() => {
    if (isEditing) {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      } else if (textareaRef.current) { // Si no hay input de label (ej. solo textarea)
        textareaRef.current.focus();
      }
    }
  }, [isEditing]);

  // Tooltip content
  const tooltipContent = useMemo(() => {
    if (isEditing) return "Haz clic fuera o presiona Enter para guardar, Esc para cancelar.";
    // Simplificamos el tooltip
    return "Doble clic para editar."; 
  }, [isEditing]);

  return (
    <div
      className={nodeClasses}
      ref={nodeRef}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        minWidth: NODE_CONFIG.MIN_WIDTH,
        minHeight: NODE_CONFIG.MIN_HEIGHT,
        // Las transformaciones de scale y shadow se manejarán por CSS para mejor rendimiento
      }}
      role={NODE_CONFIG.ACCESSIBILITY.ROLE}
      aria-label={NODE_CONFIG.ACCESSIBILITY.ARIA_LABEL}
      tabIndex={NODE_CONFIG.ACCESSIBILITY.TABINDEX}
    >
      <Tooltip 
        content={tooltipContent} 
        visible={isHovered || selected} 
        position="top" // Cambiado de top-start a top
        delay={500}
      >
        <StartNodeHeader 
          label={currentLabel} 
          isEditing={isEditing} 
          isUltraMode={isUltraPerformanceMode} 
          lastModified={data?.lastModified} 
        />
      </Tooltip>
      
      <StartNodeContent
        isEditing={isEditing}
        currentLabel={currentLabel}
        currentDynamicContent={currentDynamicContent}
        inputRef={inputRef}
        textareaRef={textareaRef}
        handleLabelChange={handleLabelChange}
        handleDynamicContentChange={handleDynamicContentChange}
        handleKeyDown={handleKeyDown}
        handleBlur={handleBlur} // Un solo blur para guardar todo
        isUltraMode={isUltraPerformanceMode}
        errorMessage={errorMessage}
      />

      {/* Handle de salida fijo a la derecha */}
      <Handle
        type="source"
        position={Position.Right} // Fijo
        id="default" // ID único para el handle
        isConnectable={isConnectable}
        className="start-node__handle start-node__handle--source"
      />

      {showContextMenu && (
        <Suspense fallback={<div>Cargando menú...</div>}>
          <ContextMenu
            x={contextMenuPosition.x}
            y={contextMenuPosition.y}
            items={contextMenuItems}
            onClose={closeContextMenu}
            menuRef={menuRef}
          />
        </Suspense>
      )}
    </div>
  );
});

StartNode.propTypes = {
  id: PropTypes.string.isRequired,
  data: PropTypes.shape({
    label: PropTypes.string,
    dynamicContent: PropTypes.string,
    lastModified: PropTypes.string, // ISO string date
    // Otros datos específicos que pueda tener el nodo
  }),
  selected: PropTypes.bool,
  isConnectable: PropTypes.bool,
  isUltraPerformanceMode: PropTypes.bool,
};

StartNode.defaultProps = {
  data: {
    label: NODE_CONFIG.DEFAULT_LABEL,
    dynamicContent: NODE_CONFIG.DEFAULT_DYNAMIC_CONTENT,
    lastModified: null,
  },
  selected: false,
  isConnectable: true,
  isUltraPerformanceMode: false,
};

export default StartNode;
