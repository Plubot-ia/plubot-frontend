/**
 * @file OptionNode.jsx
 * @description Componente elite para representar opciones lógicas generadas por un DecisionNode.
 * Implementa diseño profesional, accesibilidad y optimización para modo normal y ultra rendimiento.
 * @version 2.0.0 - Refactorizado para integración directa con Zustand
 */

import { debounce } from 'lodash';
import { Check, X, HelpCircle, Circle, CornerDownRight } from 'lucide-react';
import PropTypes from 'prop-types';
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useUpdateNodeInternals, Position, Handle } from 'reactflow';
import { shallow } from 'zustand/shallow';

import { useNodeData } from '@/stores/selectors';
import useFlowStore from '@/stores/use-flow-store';
import { formatDateRelative } from '@/utils/date.js';

import Tooltip from '../../ui/ToolTip';

import './OptionNode.css';

// Constantes y configuración
const NODE_CONFIG = {
  DEFAULT_INSTRUCTION: 'Instrucciones para esta opción...',
  MAX_TEXTAREA_HEIGHT: 200,
};

const getPosition = (position) => {
  if (position instanceof Object) {
    return position;
  }
  switch (position) {
    case 'top': {
      return Position.Top;
    }
    case 'right': {
      return Position.Right;
    }
    case 'left': {
      return Position.Left;
    }
    default: {
      return Position.Bottom;
    }
  }
};

/**
 * Componente para el ícono del nodo de opción
 */
const OptionNodeIcon = React.memo(
  ({ label, isUltraPerformanceMode = false }) => {
    const iconProperties = useMemo(
      () => ({
        size: isUltraPerformanceMode ? 14 : 16,
        strokeWidth: isUltraPerformanceMode ? 2 : 1.75,
        className: isUltraPerformanceMode ? '' : 'option-node__icon-svg',
      }),
      [isUltraPerformanceMode],
    );

    const renderIcon = useCallback(() => {
      const currentLabelText = label?.toLowerCase() || '';

      // Comparaciones más robustas para los labels
      if (
        ['sí', 'si', 'yes', 'true'].some((term) =>
          currentLabelText.includes(term),
        )
      ) {
        return <Check {...iconProperties} aria-hidden='true' />;
      } else if (
        ['no', 'false'].some((term) => currentLabelText.includes(term))
      ) {
        return <X {...iconProperties} aria-hidden='true' />;
      } else if (
        ['tal vez', 'quizás', 'quizas', 'maybe'].some((term) =>
          currentLabelText.includes(term),
        )
      ) {
        return <HelpCircle {...iconProperties} aria-hidden='true' />;
      } else {
        return <Circle {...iconProperties} aria-hidden='true' />;
      }
    }, [label, iconProperties]);

    return (
      <div
        className={`option-node__icon ${isUltraPerformanceMode ? 'option-node__icon--ultra' : ''}`}
        role='img'
        aria-label={`Opción: ${label}`}
      >
        {renderIcon()}
      </div>
    );
  },
);

OptionNodeIcon.displayName = 'OptionNodeIcon';

OptionNodeIcon.propTypes = {
  label: PropTypes.string,
  isUltraPerformanceMode: PropTypes.bool,
};

/**
 * Componente OptionNodeHandle - Maneja los handles de conexión
 */
const OptionNodeHandle = React.memo(
  ({
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
    const positionObject = getPosition(position);

    const baseStyle = {
      zIndex: 50,
      '--option-node-handle-bg-color': handleColor || '#3b82f6',
      ...style,
    };

    // Los efectos visuales de hover ahora se manejan puramente con CSS.

    return (
      <Handle
        type={type}
        position={positionObject}
        id={handleId}
        isConnectable={isConnectable}
        className={`option-node__handle option-node__handle--${type} ${isUltraPerformanceMode ? 'option-node__handle--ultra' : ''} ${isEditing ? 'option-node__handle--editing' : ''}`}
        style={baseStyle}
        tabIndex={0}
        aria-label={
          type === 'source'
            ? 'Salida del nodo de opción'
            : 'Entrada del nodo de opción'
        }
        {...rest}
      />
    );
  },
);

OptionNodeHandle.displayName = 'OptionNodeHandle';

OptionNodeHandle.propTypes = {
  type: PropTypes.string.isRequired,
  position: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.string, // Permitimos string para posiciones como 'top', 'right', etc.
  ]).isRequired,
  id: PropTypes.string.isRequired,
  isConnectable: PropTypes.bool,
  isEditing: PropTypes.bool,
  isUltraPerformanceMode: PropTypes.bool,
  style: PropTypes.object,
  handleColor: PropTypes.string,
};

/**
 * Componente principal OptionNode - Refactorizado para integración directa y granular con Zustand
 */
const OptionNodeComponent = ({
  id,
  selected = false,
  isConnectable = true,
  _lodLevel, // <-- Prop recibida del HOC para que React.memo la detecte
}) => {
  // --- REFS ---
  const textareaReference = useRef(null);
  const nodeReference = useRef(null);
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
  } = useFlowStore(
    (state) => ({
      updateNodeData: state.updateNodeData,
      setNodeEditing: state.setNodeEditing,
      isUltraPerformanceModeGlobal: state.isUltraPerformanceModeGlobal,
      panToNode: state.panToNode,
    }),
    shallow,
  );

  // 3. Get the label reactively from the parent DecisionNode's condition
  const label = useFlowStore((state) => {
    if (!sourceNode || !sourceHandle) {
      return nodeData?.label || 'Opción';
    }
    const parentNode = state.nodes.find((n) => n.id === sourceNode);
    const condition = parentNode?.data?.conditions?.find(
      (c) => c.id === sourceHandle,
    );
    return condition?.text || 'Opción';
  }, shallow);

  // --- LOCAL UI STATE ---
  const [currentInstruction, setCurrentInstruction] = useState(
    initialInstruction || '',
  );

  // --- MEMOIZED VALUES ---
  const instruction = useMemo(
    () => initialInstruction || NODE_CONFIG.DEFAULT_INSTRUCTION,
    [initialInstruction],
  );
  const isUltraPerformanceMode = useMemo(
    () => isUltra || isUltraPerformanceModeGlobal,
    [isUltra, isUltraPerformanceModeGlobal],
  );

  const borderColor = useMemo(() => {
    const currentLabelText = label?.toLowerCase() || '';
    if (
      ['sí', 'si', 'yes', 'true'].some((term) =>
        currentLabelText.includes(term),
      )
    )
      return 'var(--option-node-border-yes)';
    if (['no', 'false'].some((term) => currentLabelText.includes(term)))
      return 'var(--option-node-border-no)';
    if (
      ['tal vez', 'quizás', 'quizas', 'maybe'].some((term) =>
        currentLabelText.includes(term),
      )
    )
      return 'var(--option-node-border-maybe)';
    return 'var(--option-node-border-default)';
  }, [label]);

  const nodeClasses = useMemo(
    () =>
      [
        'option-node',
        `option-node--${isUltraPerformanceMode ? 'ultra' : 'normal'}-mode`,
        selected ? 'option-node--selected' : '',
        isEditing ? 'option-node--editing' : '',
        `option-node--border-color--${borderColor.replace('#', '')}`,
      ]
        .filter(Boolean)
        .join(' '),
    [selected, isEditing, isUltraPerformanceMode, borderColor],
  );

  const nodeStyle = useMemo(
    () => ({
      borderLeftColor: borderColor,
      backgroundColor: isUltraPerformanceMode ? '#2d2d2d' : undefined,
    }),
    [isUltraPerformanceMode, borderColor],
  );

  // --- EFFECTS ---
  // Sync local editing buffer when not editing
  useEffect(() => {
    if (!isEditing) {
      setCurrentInstruction(instruction || '');
    }
  }, [instruction, isEditing]);

  // Handle textarea focus and resize when editing starts
  useEffect(() => {
    if (isEditing && textareaReference.current) {
      const ta = textareaReference.current;
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
    const currentReference = nodeReference.current;
    if (currentReference) {
      observer.observe(currentReference);
    }
    return () => {
      debouncedUpdate.cancel();
      if (currentReference) {
        observer.unobserve(currentReference);
      }
    };
  }, [id, updateNodeInternals]);

  // --- CALLBACKS ---
  const handleInstructionChange = useCallback((event_) => {
    setCurrentInstruction(event_.target.value);
    const ta = textareaReference.current;
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
      updateNodeData(id, {
        instruction: currentInstruction,
        lastUpdated: new Date().toISOString(),
      });
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

  const handleKeyDown = useCallback(
    (event_) => {
      if (isEditing) {
        if (event_.key === 'Enter' && (event_.ctrlKey || event_.metaKey)) {
          event_.preventDefault();
          finishEditing();
        } else if (event_.key === 'Escape') {
          event_.preventDefault();
          cancelEditing();
        }
      } else if (event_.key === 'Enter' && !event_.ctrlKey && !event_.metaKey) {
        event_.preventDefault();
        startEditing();
      } else if (event_.key === 'p' && event_.ctrlKey && sourceNode) {
        event_.preventDefault();
        navigateToParent();
      }
    },
    [
      isEditing,
      finishEditing,
      cancelEditing,
      startEditing,
      navigateToParent,
      sourceNode,
    ],
  );

  // --- RENDER ---
  return (
    <div
      ref={nodeReference}
      className={nodeClasses}
      style={nodeStyle}
      onDoubleClick={startEditing}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role='treeitem'
      aria-selected={selected}
      aria-label={`Nodo de opción: ${label || 'Opción sin etiqueta'}`}
      aria-expanded={isEditing}
      aria-describedby={`option-node-description-${id}`}
    >
      <OptionNodeHandle
        type='target'
        position={Position.Top}
        id='target'
        isConnectable={isConnectable}
        isEditing={isEditing}
        isUltraPerformanceMode={isUltraPerformanceMode}
        handleColor={color}
      />

      <div className='option-node__content'>
        <div className='option-node__header'>
          <div className='option-node__title'>
            <OptionNodeIcon
              label={label}
              isUltraPerformanceMode={isUltraPerformanceMode}
            />
            <span className='option-node__label-text'>{label || 'Opción'}</span>
          </div>

          {!isUltraPerformanceMode && sourceNode && (
            <Tooltip
              content={`Ir a nodo padre: ${sourceNode.slice(0, 8)}...`}
              position='top'
            >
              <button
                onClick={navigateToParent}
                className='option-node__parent-link'
                aria-label='Ver nodo padre'
              >
                <CornerDownRight size={14} />
              </button>
            </Tooltip>
          )}
        </div>

        <div className='option-node__instruction-wrapper'>
          {isEditing ? (
            <textarea
              ref={textareaReference}
              className='option-node__instruction-textarea'
              value={currentInstruction}
              onChange={handleInstructionChange}
              onBlur={finishEditing}
              onKeyDown={handleKeyDown}
              placeholder='Escribe las instrucciones para esta opción...'
              aria-label='Instrucciones para esta opción'
            />
          ) : (
            <div
              className='option-node__instruction-text'
              onClick={startEditing}
              onKeyDown={(event_) => {
                // Allow starting edit with Enter or Space, as expected for a button role
                if (event_.key === 'Enter' || event_.key === ' ') {
                  event_.preventDefault();
                  startEditing();
                }
              }}
              role='button'
              tabIndex={0}
            >
              {instruction}
            </div>
          )}
        </div>

        {isEditing && (
          <div className='option-node__actions'>
            <Tooltip content='Cancelar (Esc)' position='top'>
              <button
                onClick={cancelEditing}
                className='option-node__button option-node__button--cancel'
                aria-label='Cancelar edición'
              >
                <X size={14} />
                <span>Cancelar</span>
              </button>
            </Tooltip>
            <Tooltip content='Guardar (Ctrl+Enter)' position='top'>
              <button
                onClick={finishEditing}
                className='option-node__button option-node__button--save'
                aria-label='Guardar cambios'
              >
                <Check size={14} />
                <span>Guardar</span>
              </button>
            </Tooltip>
          </div>
        )}

        {!isUltraPerformanceMode && !isEditing && lastUpdated && (
          <div className='option-node__footer'>
            <span className='option-node__timestamp'>
              Actualizado: {formatDateRelative(lastUpdated)}
            </span>
          </div>
        )}
      </div>

      <OptionNodeHandle
        type='source'
        position={Position.Bottom}
        id='source'
        isConnectable={isConnectable}
        isEditing={isEditing}
        isUltraPerformanceMode={isUltraPerformanceMode}
        handleColor={color}
      />

      <span className='sr-only' id={`option-node-description-${id}`}>
        Nodo de opción: {label || 'Opción sin etiqueta'}. Instrucción:{' '}
        {instruction || NODE_CONFIG.DEFAULT_INSTRUCTION}. Deriva del nodo de
        decisión: {sourceNode ? `${sourceNode.slice(0, 8)}...` : 'Desconocido'}.
        {lastUpdated &&
          ` Última actualización: ${formatDateRelative(lastUpdated)}.`}
      </span>
    </div>
  );
};

OptionNodeComponent.propTypes = {
  id: PropTypes.string.isRequired,
  selected: PropTypes.bool,
  isConnectable: PropTypes.bool,
  lodLevel: PropTypes.string,
};

const OptionNode = memo(OptionNodeComponent);

OptionNode.displayName = 'OptionNode';

export default OptionNode;
