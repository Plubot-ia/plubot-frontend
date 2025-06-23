/**
 * @file OptionNode.jsx
 * @description Componente elite para representar opciones lógicas generadas por un DecisionNode.
 * Implementa diseño profesional, accesibilidad y optimización para modo normal y ultra rendimiento.
 * @version 2.0.0 - Refactorizado para integración directa con Zustand
 */

import React, { useState, useCallback, useMemo, useRef, useEffect, memo } from 'react';

import { useUpdateNodeInternals } from 'reactflow';
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
import { shallow } from 'zustand/shallow';
import useFlowStore from '@/stores/useFlowStore';
import { debounce } from 'lodash';
import Tooltip from '../../ui/ToolTip';
import { formatDateRelative } from '@/utils/date';
import { useNodeData } from '@/stores/selectors';
import { getConnectorColor } from '../decisionnode/DecisionNode.types';
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
    ...style
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
 * Componente principal OptionNode - Refactorizado para integración directa y granular con Zustand
 */
const OptionNodeComponent = ({ 
  id, 
  selected = false, 
  isConnectable = true,
  lodLevel // <-- Prop recibida del HOC para que React.memo la detecte
}) => {
  // --- REFS ---
  const textareaRef = useRef(null);
  const nodeRef = useRef(null);
  const updateNodeInternals = useUpdateNodeInternals();

  // --- ZUSTAND STORE (SELECTORS & ACTIONS) ---
  // Selectors are granular to prevent unnecessary re-renders.
  
  // 1. Get node-specific data and editing state from a dedicated selector
  const nodeData = useNodeData(id);
  const {
    instruction: initialInstruction,
    sourceNode,
    sourceHandle,
    lastUpdated,
    isEditing,
    isUltra,
    color,
  } = nodeData || {};

  // 2. Get global state and actions
  const {
    updateNodeData,
    setNodeEditing,
    isUltraPerformanceModeGlobal,
    panToNode,
  } = useFlowStore(state => ({
    updateNodeData: state.updateNodeData,
    setNodeEditing: state.setNodeEditing,
    isUltraPerformanceModeGlobal: state.isUltraPerformanceModeGlobal,
    panToNode: state.panToNode,
  }), shallow);

  // 3. Get the label reactively from the parent DecisionNode's condition
  const label = useFlowStore(state => {
    if (!sourceNode || !sourceHandle) {
      return nodeData?.label || 'Opción';
    }
    const parentNode = state.nodes.find(n => n.id === sourceNode);
    const condition = parentNode?.data?.conditions?.find(c => c.id === sourceHandle);
    return condition?.text || 'Opción';
  }, shallow);

  // --- LOCAL UI STATE ---
  const [currentInstruction, setCurrentInstruction] = useState(initialInstruction || '');
  const [isHovered, setIsHovered] = useState(false);

  // --- MEMOIZED VALUES ---
  const instruction = useMemo(() => initialInstruction || NODE_CONFIG.DEFAULT_INSTRUCTION, [initialInstruction]);
  const isUltraPerformanceMode = useMemo(() => isUltra || isUltraPerformanceModeGlobal, [isUltra, isUltraPerformanceModeGlobal]);

  const borderColor = useMemo(() => {
    const currentLabelText = label?.toLowerCase() || '';
    if (['sí', 'si', 'yes', 'true'].some(term => currentLabelText.includes(term))) return 'var(--option-node-border-yes)';
    if (['no', 'false'].some(term => currentLabelText.includes(term))) return 'var(--option-node-border-no)';
    if (['tal vez', 'quizás', 'quizas', 'maybe'].some(term => currentLabelText.includes(term))) return 'var(--option-node-border-maybe)';
    return 'var(--option-node-border-default)';
  }, [label]);

  const nodeClasses = useMemo(() => [
    'option-node',
    `option-node--${isUltraPerformanceMode ? 'ultra' : 'normal'}-mode`,
    selected ? 'option-node--selected' : '',
    isEditing ? 'option-node--editing' : '',
    `option-node--border-color--${borderColor.replace('#', '')}`
  ].filter(Boolean).join(' '), [selected, isEditing, isUltraPerformanceMode, borderColor]);

  const nodeStyle = useMemo(() => ({
    borderLeftColor: borderColor,
    backgroundColor: isUltraPerformanceMode ? '#2d2d2d' : undefined,
  }), [isUltraPerformanceMode, borderColor]);


  // --- EFFECTS ---
  // Sync local editing buffer when not editing
  useEffect(() => {
    if (!isEditing) {
      setCurrentInstruction(instruction || '');
    }
  }, [instruction, isEditing]);

  // Handle textarea focus and resize when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const ta = textareaRef.current;
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, NODE_CONFIG.MAX_TEXTAREA_HEIGHT)}px`;
      ta.focus();
      ta.select();
    }
  }, [isEditing]);

  // Update React Flow internals on resize to keep edges connected correctly
  useEffect(() => {
    const debouncedUpdate = debounce(() => updateNodeInternals(id), 50);
    const observer = new ResizeObserver(() => {
      debouncedUpdate();
    });
    const currentRef = nodeRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }
    return () => {
      debouncedUpdate.cancel();
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [id, updateNodeInternals]);


  // --- CALLBACKS ---
  const handleInstructionChange = useCallback((e) => {
    setCurrentInstruction(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, NODE_CONFIG.MAX_TEXTAREA_HEIGHT)}px`;
    }
  }, []);

  const startEditing = useCallback(() => {
    if (!isUltraPerformanceMode) {
      setNodeEditing(id, true);
    }
  }, [id, isUltraPerformanceMode, setNodeEditing]);

  const finishEditing = useCallback(() => {
    if (currentInstruction !== instruction) {
      updateNodeData(id, { instruction: currentInstruction, lastUpdated: new Date().toISOString() });
    }
    setNodeEditing(id, false);
  }, [id, currentInstruction, instruction, updateNodeData, setNodeEditing]);

  const cancelEditing = useCallback(() => {
    setCurrentInstruction(instruction || '');
    setNodeEditing(id, false);
  }, [instruction, id, setNodeEditing]);

  const navigateToParent = useCallback(() => {
    if (sourceNode) {
      panToNode(sourceNode, { select: true });
    }
  }, [sourceNode, panToNode]);

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
        startEditing();
      } else if (e.key === 'p' && e.ctrlKey && sourceNode) {
        e.preventDefault();
        navigateToParent();
      }
    }
  }, [isEditing, finishEditing, cancelEditing, startEditing, navigateToParent, sourceNode]);

  // --- RENDER ---
  return (
    <div
      ref={nodeRef}
      className={nodeClasses}
      style={nodeStyle}
      onDoubleClick={startEditing}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="group"
      aria-label={`Nodo de opción: ${label || 'Opción sin etiqueta'}`}
      aria-expanded={isEditing}
      aria-describedby={`option-node-description-${id}`}
    >
      <OptionNodeHandle
        type="target"
        position={Position.Top}
        id="target"
        isConnectable={isConnectable}
        isEditing={isEditing}
        isUltraPerformanceMode={isUltraPerformanceMode}
        handleColor={color}
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
              onClick={startEditing}
            >
              {instruction}
            </p>
          )}
        </div>

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

        {!isUltraPerformanceMode && !isEditing && lastUpdated && (
          <div className="option-node__footer">
            <span className="option-node__timestamp">
              Actualizado: {formatDateRelative(lastUpdated)}
            </span>
          </div>
        )}
      </div>

      <OptionNodeHandle
        type="source"
        position={Position.Bottom}
        id="source"
        isConnectable={isConnectable}
        isEditing={isEditing}
        isUltraPerformanceMode={isUltraPerformanceMode}
        handleColor={color}
      />

      <span className="sr-only" id={`option-node-description-${id}`}>
        Nodo de opción: {label || 'Opción sin etiqueta'}. 
        Instrucción: {instruction || NODE_CONFIG.DEFAULT_INSTRUCTION}. 
        Deriva del nodo de decisión: {sourceNode ? sourceNode.substring(0,8) + '...' : 'Desconocido'}.
        {lastUpdated && ` Última actualización: ${formatDateRelative(lastUpdated)}.`}
      </span>
    </div>
  );
};

OptionNodeComponent.propTypes = {
  id: PropTypes.string.isRequired,
  selected: PropTypes.bool,
  isConnectable: PropTypes.bool,
  lodLevel: PropTypes.string
};

const OptionNode = memo(OptionNodeComponent);

OptionNode.displayName = 'OptionNode';

export default OptionNode;
