/**
 * @file OptionNode.jsx
 * @description Componente elite para representar opciones lógicas generadas por un DecisionNode.
 * Implementa diseño profesional, accesibilidad y optimización para modo normal y ultra rendimiento.
 * @version 2.0.0 - Refactorizado para integración directa con Zustand
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Position, Handle } from 'reactflow';
import { 
  Check, 
  X, 
  HelpCircle,
  Circle,
  Edit2, 
  CornerDownRight
} from 'lucide-react';
import { debounce } from 'lodash';
import Tooltip from '../../ui/ToolTip';
import { formatDateRelative } from '@/utils/date';
import useFlowStore from '@/stores/useFlowStore';
import './OptionNode.css';

// Constantes y configuración
const NODE_CONFIG = {
  DEFAULT_INSTRUCTION: 'Instrucciones para esta opción...',
  MAX_TEXTAREA_HEIGHT: 200,
};

/**
 * Componente para el ícono del nodo de opción
 */
const OptionNodeIcon = React.memo(({ 
  label, 
  isUltraPerformanceMode = false 
}) => {
  const iconProps = { 
    size: isUltraPerformanceMode ? 14 : 16, 
    strokeWidth: isUltraPerformanceMode ? 2 : 1.75,
    className: isUltraPerformanceMode ? '' : 'option-node__icon-svg'
  };
  
  const renderIcon = useCallback(() => {
    const currentLabelText = label?.toLowerCase() || '';
    
    // Comparaciones más robustas para los labels
    if (['sí', 'si', 'yes', 'true'].some(term => currentLabelText.includes(term))) {
      return <Check {...iconProps} aria-hidden="true" />;
    } else if (['no', 'false'].some(term => currentLabelText.includes(term))) {
      return <X {...iconProps} aria-hidden="true" />;
    } else if (['tal vez', 'quizás', 'quizas', 'maybe'].some(term => currentLabelText.includes(term))) {
      return <HelpCircle {...iconProps} aria-hidden="true" />;
    } else {
      return <Circle {...iconProps} aria-hidden="true" />;
    }
  }, [label, iconProps]);
  
  return (
    <div 
      className={`option-node__icon ${isUltraPerformanceMode ? 'option-node__icon--ultra' : ''}`}
      role="img"
      aria-label={`Opción: ${label}`}
    >
      {renderIcon()}
    </div>
  );
});

OptionNodeIcon.displayName = 'OptionNodeIcon';

OptionNodeIcon.propTypes = {
  label: PropTypes.string,
  isUltraPerformanceMode: PropTypes.bool
};

/**
 * Componente OptionNodeHandle - Maneja los handles de conexión
 */
const OptionNodeHandle = React.memo(({ 
  type, 
  position, 
  id: handleId, 
  isConnectable, 
  isEditing,
  isUltraPerformanceMode,
  style,
  handleColor,
  ...rest
}) => {
  // Garantizar que position siempre sea un objeto Position
  const positionObj = position instanceof Object ? position :
    (position === 'top' ? Position.Top : 
     position === 'right' ? Position.Right : 
     position === 'bottom' ? Position.Bottom : 
     position === 'left' ? Position.Left : Position.Bottom);
    
  const baseStyle = {
    zIndex: 50,
    '--option-node-handle-bg-color': handleColor || '#3b82f6',
    // width, height, border, boxShadow, background, transition serán manejados por CSS
    ...style // Mantenemos los estilos de posicionamiento que vienen de OptionNode (top, left, etc.)
  };
  
  // Los efectos visuales de hover ahora se manejan puramente con CSS.
  
  return (
    <Handle 
      type={type}
      position={positionObj}
      id={handleId}
      isConnectable={isConnectable}
      className={`option-node__handle option-node__handle--${type} ${isUltraPerformanceMode ? 'option-node__handle--ultra' : ''} ${isEditing ? 'option-node__handle--editing' : ''}`}
      style={baseStyle}
      tabIndex={0}
      aria-label={type === "source" ? "Salida del nodo de opción" : "Entrada del nodo de opción"}
      {...rest}
    />
  );
});

OptionNodeHandle.displayName = 'OptionNodeHandle';

OptionNodeHandle.propTypes = {
  type: PropTypes.string.isRequired,
  position: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.string  // Permitimos string para posiciones como 'top', 'right', etc.
  ]).isRequired,
  id: PropTypes.string.isRequired,
  isConnectable: PropTypes.bool,
  isEditing: PropTypes.bool,
  isUltraPerformanceMode: PropTypes.bool,
  style: PropTypes.object,
  handleColor: PropTypes.string
};

/**
 * Componente principal OptionNode - Refactorizado para integración directa con Zustand
 */
const OptionNode = ({ 
  id, 
  selected = false, 
  isConnectable = true 
}) => {
  // Estado local para UI
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [currentInstruction, setCurrentInstruction] = useState('');
  
  // Referencias
  const textareaRef = useRef(null);
  const nodeRef = useRef(null);
  
  // Selectores de Zustand - solo obtenemos los datos que necesitamos
  const nodeData = useFlowStore(state => {
    const node = state.nodes.find(n => n.id === id);
    return node?.data || {
      label: '',
      instruction: NODE_CONFIG.DEFAULT_INSTRUCTION,
      sourceNode: null,
      sourceConditionId: null,
      lastUpdated: null,
      isUltraPerformanceMode: false
    };
  });
  
  // Acciones del store
  const {
    updateOptionNodeInstruction,
    setNodes,
    getNode,
    fitView
  } = useFlowStore(state => ({
    updateOptionNodeInstruction: state.updateOptionNodeInstruction,
    setNodes: state.setNodes,
    getNode: state.getNode,
    fitView: state.fitView
  }));
  
  // Extraer datos relevantes del nodo
  const {
    label,
    instruction,
    sourceNode,
    lastUpdated,
    isUltraPerformanceMode,
    parentHandleColor // Extraer el color del handle padre
  } = nodeData;
  
  // Sincronizar el estado local con los datos del store
  useEffect(() => {
    if (!isEditing) {
      setCurrentInstruction(instruction);
    }
  }, [instruction, isEditing]);
  
  // Efecto para ajustar el textarea cuando se está editando
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      requestAnimationFrame(() => {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, NODE_CONFIG.MAX_TEXTAREA_HEIGHT)}px`;
        textareaRef.current.focus();
        textareaRef.current.select();
      });
    }
  }, [isEditing]);
  
  // Construir clases para el nodo
  const nodeClasses = useMemo(() => {
    const classes = ['option-node'];
    
    if (selected) classes.push('option-node--selected');
    if (isEditing) classes.push('option-node--editing');
    if (isUltraPerformanceMode) classes.push('option-node--ultra');
    if (isHovered && !isUltraPerformanceMode) classes.push('option-node--hovered');
    
    return classes.join(' ');
  }, [selected, isEditing, isUltraPerformanceMode, isHovered]);
  
  // Determinar el color del borde basado en el label
  const borderColor = useMemo(() => {
    const currentLabelText = label?.toLowerCase() || '';
    if (['sí', 'si', 'yes', 'true'].some(term => currentLabelText.includes(term))) {
      return 'var(--option-node-border-yes)';
    } else if (['no', 'false'].some(term => currentLabelText.includes(term))) {
      return 'var(--option-node-border-no)';
    } else if (['tal vez', 'quizás', 'quizas', 'maybe'].some(term => currentLabelText.includes(term))) {
      return 'var(--option-node-border-maybe)';
    } else {
      return 'var(--option-node-border-default)';
    }
  }, [label]);
  
  // Estilo del nodo
  const nodeStyle = useMemo(() => ({
    borderLeftColor: borderColor,
    backgroundColor: isUltraPerformanceMode ? '#2d2d2d' : undefined,
    boxShadow: isUltraPerformanceMode ? 'none' : undefined,
    padding: isUltraPerformanceMode ? '0.5rem' : undefined,
  }), [isUltraPerformanceMode, borderColor]);
  
  // Iniciar edición
  const handleDoubleClick = useCallback(() => {
    if (!isUltraPerformanceMode) {
      setIsEditing(true);
    }
  }, [isUltraPerformanceMode]);
  
  // Cancelar edición
  const cancelEditing = useCallback(() => {
    setCurrentInstruction(instruction);
    setIsEditing(false);
  }, [instruction]);
  
  // Finalizar edición y guardar cambios
  const finishEditing = useCallback(async () => {
    if (isSaving) return;
    
    const hasChanges = currentInstruction !== instruction;
    if (!hasChanges) {
      setIsEditing(false);
      return;
    }
    
    setIsSaving(true);
    try {
      updateOptionNodeInstruction(id, currentInstruction);
      await new Promise(resolve => setTimeout(resolve, 50)); // Pequeño delay para UX
    } catch (error) {
      console.error('Error al guardar cambios en OptionNode:', error);
    } finally {
      setIsSaving(false);
      setIsEditing(false);
      if (textareaRef.current) {
        textareaRef.current.blur();
      }
    }
  }, [id, currentInstruction, instruction, isSaving, updateOptionNodeInstruction]);
  
  // Manejar cambios en el textarea
  const handleInstructionChange = useCallback((e) => {
    setCurrentInstruction(e.target.value);
    
    // Ajustar altura del textarea dinámicamente
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, NODE_CONFIG.MAX_TEXTAREA_HEIGHT)}px`;
    }
  }, []);
  
  // Navegar al nodo padre
  const navigateToParent = useCallback(() => {
    if (sourceNode) {
      const parentNodeInstance = getNode(sourceNode);
      if (parentNodeInstance) {
        setNodes(nds =>
          nds.map(n => ({
            ...n,
            selected: n.id === sourceNode,
          }))
        );
        
        // Centrar la vista en el nodo padre
        if (fitView) {
          fitView({ 
            nodes: [{ id: sourceNode }], 
            duration: 800, 
            padding: 0.2 
          });
        }
      }
    }
  }, [sourceNode, getNode, setNodes, fitView]);
  
  // Manejar teclas para accesibilidad
  const handleKeyDown = useCallback((e) => {
    if (isEditing) {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        finishEditing();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEditing();
      }
    } else {
      if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleDoubleClick();
      } else if (e.key === 'p' && e.ctrlKey && sourceNode) {
        e.preventDefault();
        navigateToParent();
      }
    }
  }, [isEditing, finishEditing, cancelEditing, handleDoubleClick, navigateToParent, sourceNode]);
  
  return (
    <div
      ref={nodeRef}
      className={nodeClasses}
      style={nodeStyle}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="group"
      aria-label={`Nodo de opción: ${label || 'Opción sin etiqueta'}`}
      aria-expanded={isEditing}
      aria-busy={isSaving}
      aria-describedby={`option-node-description-${id}`}
    >
      {/* Conector de entrada en la parte superior */}
      <OptionNodeHandle 
        type="target" 
        position={Position.Top} 
        id="target" 
        isConnectable={isConnectable}
        isEditing={isEditing}
        isUltraPerformanceMode={isUltraPerformanceMode}
        handleColor={parentHandleColor} // Aplicar el color del handle padre
        style={{
          left: '50%',
          transform: 'translateX(-50%)'
        }}
      />

      <div className="option-node__content">
        <div className="option-node__header">
          <div className="option-node__title">
            <OptionNodeIcon label={label} isUltraPerformanceMode={isUltraPerformanceMode} />
            <span className="option-node__label-text">{label || 'Opción'}</span>
          </div>
          
          {!isUltraPerformanceMode && sourceNode && (
            <Tooltip content={`Ir a nodo padre: ${sourceNode.substring(0,8)}...`} position="top">
              <button
                onClick={navigateToParent}
                className="option-node__parent-link"
                aria-label="Ver nodo padre"
              >
                <CornerDownRight size={14} />
              </button>
            </Tooltip>
          )}
        </div>

        <div className="option-node__instruction-wrapper">
          {isEditing ? (
            <textarea
              ref={textareaRef}
              className="option-node__instruction-textarea"
              value={currentInstruction} 
              onChange={handleInstructionChange}
              onBlur={finishEditing}
              onKeyDown={handleKeyDown}
              placeholder="Escribe las instrucciones para esta opción..."
              aria-label="Instrucciones para esta opción"
            />
          ) : (
            <p 
              className="option-node__instruction-text" 
              onClick={!isUltraPerformanceMode ? handleDoubleClick : undefined}
            >
              {instruction}
            </p>
          )}
        </div>

        {/* Botones de acción en modo edición */}
        {isEditing && (
          <div className="option-node__actions">
            <Tooltip content="Cancelar (Esc)" position="top">
              <button
                onClick={cancelEditing}
                className="option-node__button option-node__button--cancel"
                aria-label="Cancelar edición"
              >
                <X size={14} />
                <span>Cancelar</span>
              </button>
            </Tooltip>
            <Tooltip content="Guardar (Ctrl+Enter)" position="top">
              <button
                onClick={finishEditing}
                className="option-node__button option-node__button--save"
                aria-label="Guardar cambios"
              >
                <Check size={14} />
                <span>Guardar</span>
              </button>
            </Tooltip>
          </div>
        )}

        {/* Metadatos */}
        {!isUltraPerformanceMode && !isEditing && lastUpdated && (
          <div className="option-node__footer">
            <span className="option-node__timestamp">
              Actualizado: {formatDateRelative(lastUpdated)}
            </span>
          </div>
        )}
      </div>

      {/* Conector de salida en la parte inferior */}
      <OptionNodeHandle
        type="source"
        position={Position.Bottom}
        id="source"
        isConnectable={isConnectable}
        isEditing={isEditing}
        isUltraPerformanceMode={isUltraPerformanceMode}
        handleColor={borderColor}
        style={{
          left: '50%',
          transform: 'translateX(-50%)'
        }}
      />

      {/* Texto para lectores de pantalla - Accesibilidad mejorada */}
      <span className="sr-only" id={`option-node-description-${id}`}>
        Nodo de opción: {label || 'Opción sin etiqueta'}. 
        Instrucción: {instruction || NODE_CONFIG.DEFAULT_INSTRUCTION}. 
        Deriva del nodo de decisión: {sourceNode ? sourceNode.substring(0,8) + '...' : 'Desconocido'}.
        {lastUpdated && ` Última actualización: ${formatDateRelative(lastUpdated)}.`}
      </span>
    </div>
  );
};

OptionNode.propTypes = {
  id: PropTypes.string.isRequired,
  selected: PropTypes.bool,
  isConnectable: PropTypes.bool
};

export default OptionNode;
