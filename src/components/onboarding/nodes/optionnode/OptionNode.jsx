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

// Helper para navegación a nodo usando reactFlowInstance
const _navigateToNode = (reactFlowInstance, nodeId, options = {}) => {
  if (!reactFlowInstance || !nodeId) return;

  try {
    // Usar fitView para centrar en el nodo específico
    reactFlowInstance.fitView({
      nodes: [{ id: nodeId }],
      padding: 0.3,
      duration: 800,
      ...options,
    });
  } catch {
    // Error navegando a nodo - silencioso en producción
    // Fallback: usar fitView general
    try {
      reactFlowInstance.fitView({ padding: 0.2, duration: 500 });
    } catch {
      // Error en fallback fitView - silencioso en producción
    }
  }
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

// Helper para calcular el color del borde basado en el estado del nodo
const _getBorderColor = ({ selected, sourceNode, isConnectable }) => {
  if (selected) return '#ff6b6b';
  if (sourceNode) return '#4ecca3';
  if (isConnectable) return '#667eea';
  return '#4b5563';
};

// Helper para calcular clases CSS del nodo
const _calculateNodeClasses = ({ selected, sourceNode, isConnectable }) => {
  return `option-node ${
    selected ? 'selected' : ''
  } ${sourceNode ? 'has-source' : ''} ${isConnectable ? 'connectable' : ''}`;
};

// Helper para calcular estilos dinámicos del nodo
const _calculateNodeStyle = ({ selected, sourceNode, isConnectable }) => {
  const borderColor = _getBorderColor({ selected, sourceNode, isConnectable });
  return {
    borderColor,
    boxShadow: selected ? `0 0 0 2px ${borderColor}` : 'none',
  };
};

// Custom hook para efectos del nodo
const useNodeEffects = ({
  isEditing,
  instruction,
  setCurrentInstruction,
  textareaReference,
  nodeReference,
  id,
  updateNodeInternals,
}) => {
  // Sync local editing buffer when not editing
  useEffect(() => {
    if (!isEditing) {
      setCurrentInstruction(instruction || '');
    }
  }, [instruction, isEditing, setCurrentInstruction]);

  // Handle textarea focus and resize when editing starts
  useEffect(() => {
    if (isEditing && textareaReference.current) {
      const ta = textareaReference.current;
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, NODE_CONFIG.MAX_TEXTAREA_HEIGHT)}px`;
      ta.focus();
      ta.select();
    }
  }, [isEditing, textareaReference]);

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
  }, [id, updateNodeInternals, nodeReference]);
};

// Helper para renderizar el header del nodo
const _renderNodeHeader = ({
  label,
  isUltraPerformanceMode,
  sourceNode,
  reactFlowInstance,
  id,
}) => {
  return (
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
            className='option-node__parent-button'
            onClick={() =>
              _navigateToNode(reactFlowInstance, sourceNode, { select: true })
            }
            onKeyDown={(event_) => {
              if (event_.key === 'Enter' || event_.key === ' ') {
                event_.preventDefault();
                _navigateToNode(reactFlowInstance, sourceNode, {
                  select: true,
                });
              }
            }}
            aria-label={`Ir a nodo padre ${sourceNode}`}
            tabIndex={0}
          >
            <CornerDownRight size={12} />
          </button>
        </Tooltip>
      )}
    </div>
  );
};

// Helper para renderizar el contenido principal del nodo
const _renderNodeMainContent = ({
  isEditing,
  currentInstruction,
  handleInstructionChange,
  textareaReference,
  instruction,
}) => {
  if (isEditing) {
    return (
      <textarea
        ref={textareaReference}
        value={currentInstruction}
        onChange={handleInstructionChange}
        className='option-node__textarea'
        placeholder='Escribe las instrucciones para esta opción...'
        rows={3}
        maxLength={500}
        aria-label='Editor de instrucciones'
        spellCheck='false'
      />
    );
  }

  return (
    <div
      className='option-node__instruction'
      onClick={() => {
        /* startEditing will be handled by parent */
      }}
      onKeyDown={() => {
        /* handleKeyDown will be handled by parent */
      }}
      tabIndex={0}
      role='button'
      aria-label='Hacer clic para editar instrucciones'
    >
      {instruction || 'Haz clic para añadir instrucciones...'}
    </div>
  );
};

// Helper para renderizar los botones de acción
const _renderActionButtons = ({ isEditing, cancelEditing, finishEditing }) => {
  if (!isEditing) return;

  return (
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
  );
};

// Helper para renderizar el footer del nodo
const _renderNodeFooter = ({
  isUltraPerformanceMode,
  isEditing,
  lastUpdated,
}) => {
  if (!isUltraPerformanceMode && !isEditing && lastUpdated) {
    return (
      <div className='option-node__footer'>
        <div className='option-node__footer-info'>
          <span className='option-node__last-updated'>
            Actualizado {formatDateRelative(lastUpdated)}
          </span>
        </div>
      </div>
    );
  }
};

// Custom hook para callbacks del nodo - Simplificado para reducir max-lines
const useNodeCallbacks = ({
  currentInstruction,
  setCurrentInstruction,
  updateNodeData,
  id,
  instruction,
  sourceNode,
  textareaReference,
  setNodeEditing,
  isUltraPerformanceMode,
  reactFlowInstance,
}) => {
  const handleInstructionChange = useCallback(
    (event_) => {
      setCurrentInstruction(event_.target.value);
      const ta = textareaReference.current;
      if (ta) {
        ta.style.height = 'auto';
        ta.style.height = `${Math.min(ta.scrollHeight, NODE_CONFIG.MAX_TEXTAREA_HEIGHT)}px`;
      }
    },
    [setCurrentInstruction, textareaReference],
  );

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
  }, [instruction, id, setNodeEditing, setCurrentInstruction]);

  const navigateToParent = useCallback(() => {
    if (sourceNode) {
      _navigateToNode(reactFlowInstance, sourceNode, { select: true });
    }
  }, [sourceNode, reactFlowInstance]);

  return {
    handleInstructionChange,
    startEditing,
    finishEditing,
    cancelEditing,
    navigateToParent,
  };
};

// Custom hook para manejo de teclado - Simplificado para reducir complejidad
const useKeyboardHandlers = ({
  isEditing,
  startEditing,
  finishEditing,
  cancelEditing,
  navigateToParent,
  sourceNode,
}) => {
  // Helpers para reducir complejidad del handleKeyDown
  const _handleEditingModeKeys = useCallback(
    (event_) => {
      if (event_.key === 'Enter' && (event_.ctrlKey || event_.metaKey)) {
        event_.preventDefault();
        finishEditing();
        return true;
      } else if (event_.key === 'Escape') {
        event_.preventDefault();
        cancelEditing();
        return true;
      }
      return false;
    },
    [finishEditing, cancelEditing],
  );

  const _handleNormalModeKeys = useCallback(
    (event_) => {
      if (event_.key === 'Enter' && !event_.ctrlKey && !event_.metaKey) {
        event_.preventDefault();
        startEditing();
        return true;
      }
      return false;
    },
    [startEditing],
  );

  const _handleParentNavigation = useCallback(
    (event_) => {
      if (event_.key === 'p' && event_.ctrlKey && sourceNode) {
        event_.preventDefault();
        navigateToParent();
        return true;
      }
      return false;
    },
    [navigateToParent, sourceNode],
  );

  const handleKeyDown = useCallback(
    (event_) => {
      // Manejar teclas en modo edición
      if (isEditing && _handleEditingModeKeys(event_)) {
        return;
      }

      // Manejar teclas en modo normal
      if (!isEditing && _handleNormalModeKeys(event_)) {
        return;
      }

      // Manejar navegación a nodo padre
      _handleParentNavigation(event_);
    },
    [
      isEditing,
      _handleEditingModeKeys,
      _handleNormalModeKeys,
      _handleParentNavigation,
    ],
  );

  return { handleKeyDown };
};

// Helper components for OptionNode JSX sections
const renderOptionNodeTopHandle = ({
  isConnectable,
  isEditing,
  isUltraPerformanceMode,
  color,
}) => (
  <OptionNodeHandle
    type='target'
    position={Position.Top}
    id='target'
    isConnectable={isConnectable}
    isEditing={isEditing}
    isUltraPerformanceMode={isUltraPerformanceMode}
    handleColor={color}
  />
);

const renderOptionNodeBottomHandle = ({
  isConnectable,
  isEditing,
  isUltraPerformanceMode,
  color,
}) => (
  <OptionNodeHandle
    type='source'
    position={Position.Bottom}
    id='source'
    isConnectable={isConnectable}
    isEditing={isEditing}
    isUltraPerformanceMode={isUltraPerformanceMode}
    handleColor={color}
  />
);

const renderAccessibilityDescription = ({
  id,
  label,
  instruction,
  sourceNode,
  lastUpdated,
}) => (
  <span className='sr-only' id={`option-node-description-${id}`}>
    Nodo de opción: {label || 'Opción sin etiqueta'}. Instrucción:{' '}
    {instruction || NODE_CONFIG.DEFAULT_INSTRUCTION}. Deriva del nodo de
    decisión: {sourceNode ? `${sourceNode.slice(0, 8)}...` : 'Desconocido'}.
    {lastUpdated &&
      ` Última actualización: ${formatDateRelative(lastUpdated)}.`}
  </span>
);

// Helper para renderizado del contenedor principal del nodo
const _renderOptionNodeContainer = (props) => {
  const {
    nodeReference,
    nodeClasses,
    nodeStyle,
    startEditing,
    handleKeyDown,
    selected,
    label,
    id,
    isConnectable,
    isEditing,
    isUltraPerformanceMode,
    color,
    reactFlowInstance,
    sourceNode,
    currentInstruction,
    handleInstructionChange,
    textareaReference,
    instruction,
    cancelEditing,
    finishEditing,
    lastUpdated,
  } = props;
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
      {renderOptionNodeTopHandle({
        isConnectable,
        isEditing,
        isUltraPerformanceMode,
        color,
      })}

      <div className='option-node__content'>
        {_renderNodeHeader({
          label,
          isUltraPerformanceMode,
          sourceNode,
          reactFlowInstance,
          id,
        })}

        <div className='option-node__instruction-wrapper'>
          {_renderNodeMainContent({
            isEditing,
            currentInstruction,
            handleInstructionChange,
            textareaReference,
            instruction,
          })}
        </div>

        {_renderActionButtons({
          isEditing,
          cancelEditing,
          finishEditing,
        })}

        {_renderNodeFooter({
          isUltraPerformanceMode,
          isEditing,
          lastUpdated,
          id,
        })}
      </div>

      {renderOptionNodeBottomHandle({
        isConnectable,
        isEditing,
        isUltraPerformanceMode,
        color,
      })}

      {renderAccessibilityDescription({
        id,
        label,
        instruction,
        sourceNode,
        lastUpdated,
      })}
    </div>
  );
};

// Custom hook para setup completo de callbacks y state local
const useOptionNodeSetup = ({
  initialInstruction,
  updateNodeData,
  id,
  sourceNode,
  setNodeEditing,
  isUltraPerformanceMode,
  reactFlowInstance,
  isEditing,
  navigateToParent,
}) => {
  // Local UI state
  const [currentInstruction, setCurrentInstruction] = useState(
    initialInstruction || '',
  );

  // Callbacks
  const callbacks = useNodeCallbacks({
    currentInstruction,
    setCurrentInstruction,
    updateNodeData,
    id,
    instruction: initialInstruction,
    sourceNode,
    textareaReference: useRef(undefined),
    setNodeEditing,
    isUltraPerformanceMode,
    reactFlowInstance,
  });

  // Keyboard handlers
  const { handleKeyDown } = useKeyboardHandlers({
    isEditing,
    startEditing: callbacks.startEditing,
    finishEditing: callbacks.finishEditing,
    cancelEditing: callbacks.cancelEditing,
    navigateToParent,
    sourceNode,
  });

  return {
    currentInstruction,
    setCurrentInstruction,
    handleInstructionChange: callbacks.handleInstructionChange,
    startEditing: callbacks.startEditing,
    finishEditing: callbacks.finishEditing,
    cancelEditing: callbacks.cancelEditing,
    handleKeyDown,
  };
};

// Custom hook para memoized values
const useOptionNodeMemoizedValues = ({
  initialInstruction,
  isUltra,
  isUltraPerformanceModeGlobal,
  selected,
  sourceNode,
  isConnectable,
}) => {
  const instruction = useMemo(
    () => initialInstruction || NODE_CONFIG.DEFAULT_INSTRUCTION,
    [initialInstruction],
  );

  const isUltraPerformanceMode = useMemo(
    () => isUltra || isUltraPerformanceModeGlobal,
    [isUltra, isUltraPerformanceModeGlobal],
  );

  const nodeClasses = useMemo(
    () => _calculateNodeClasses({ selected, sourceNode, isConnectable }),
    [selected, sourceNode, isConnectable],
  );

  const nodeStyle = useMemo(
    () => _calculateNodeStyle({ selected, sourceNode, isConnectable }),
    [selected, sourceNode, isConnectable],
  );

  return {
    instruction,
    isUltraPerformanceMode,
    nodeClasses,
    nodeStyle,
  };
};

// Custom hook para Zustand store state and actions
const useOptionNodeState = (id) => {
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
    reactFlowInstance,
  } = useFlowStore(
    (state) => ({
      updateNodeData: state.updateNodeData,
      setNodeEditing: state.setNodeEditing,
      isUltraPerformanceModeGlobal: state.isUltraPerformanceModeGlobal,
      reactFlowInstance: state.reactFlowInstance,
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

  return {
    nodeData,
    initialInstruction,
    sourceNode,
    sourceHandle,
    lastUpdated,
    isEditing,
    isUltra,
    color,
    updateNodeData,
    setNodeEditing,
    isUltraPerformanceModeGlobal,
    reactFlowInstance,
    label,
  };
};

/**
 * Helper function to render OptionNode - extracted to reduce OptionNodeComponent function size
 */
const _renderOptionNode = (props) => {
  return _renderOptionNodeContainer(props);
};

// Helper hook to consolidate render props for OptionNode - extracted to reduce function size
const useOptionNodeRender = ({
  nodeReference,
  nodeClasses,
  nodeStyle,
  startEditing,
  handleKeyDown,
  selected,
  label,
  id,
  isConnectable,
  isEditing,
  isUltraPerformanceMode,
  color,
  reactFlowInstance,
  sourceNode,
  currentInstruction,
  handleInstructionChange,
  textareaReference,
  instruction,
  cancelEditing,
  finishEditing,
  lastUpdated,
}) => {
  return _renderOptionNode({
    nodeReference,
    nodeClasses,
    nodeStyle,
    startEditing,
    handleKeyDown,
    selected,
    label,
    id,
    isConnectable,
    isEditing,
    isUltraPerformanceMode,
    color,
    reactFlowInstance,
    sourceNode,
    currentInstruction,
    handleInstructionChange,
    textareaReference,
    instruction,
    cancelEditing,
    finishEditing,
    lastUpdated,
  });
};

/**
 * Consolidated setup hook to reduce OptionNodeComponent function size
 */
const useOptionNodeSetupConsolidated = (props) => {
  return useOptionNodeSetup({
    ...props,
    navigateToParent: undefined, // No está definido en el scope actual
  });
};

// Helper function to build render props
const buildOptionNodeRenderProps = ({
  nodeReference,
  nodeClasses,
  nodeStyle,
  startEditing,
  handleKeyDown,
  selected,
  label,
  id,
  isConnectable,
  isEditing,
  isUltraPerformanceMode,
  color,
  reactFlowInstance,
  sourceNode,
  currentInstruction,
  handleInstructionChange,
  textareaReference,
  instruction,
  cancelEditing,
  finishEditing,
  lastUpdated,
}) => ({
  nodeReference,
  nodeClasses,
  nodeStyle,
  startEditing,
  handleKeyDown,
  selected,
  label,
  id,
  isConnectable,
  isEditing,
  isUltraPerformanceMode,
  color,
  reactFlowInstance,
  sourceNode,
  currentInstruction,
  handleInstructionChange,
  textareaReference,
  instruction,
  cancelEditing,
  finishEditing,
  lastUpdated,
});

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
  const textareaReference = useRef(undefined);
  const nodeReference = useRef(undefined);
  const updateNodeInternals = useUpdateNodeInternals();

  // --- ZUSTAND STORE (SELECTORS & ACTIONS) ---
  const {
    // eslint-disable-next-line sonarjs/no-unused-vars, sonarjs/no-dead-store -- nodeData is used on lines 748, 769, 779
    nodeData,
    initialInstruction,
    sourceNode,
    // eslint-disable-next-line sonarjs/no-unused-vars, sonarjs/no-dead-store -- sourceHandle is used on lines 768, 773, 782
    sourceHandle,
    lastUpdated,
    isEditing,
    isUltra,
    color,
    updateNodeData,
    setNodeEditing,
    isUltraPerformanceModeGlobal,
    reactFlowInstance,
    label,
  } = useOptionNodeState(id);

  // --- MEMOIZED VALUES ---
  const { instruction, isUltraPerformanceMode, nodeClasses, nodeStyle } =
    useOptionNodeMemoizedValues({
      initialInstruction,
      isUltra,
      isUltraPerformanceModeGlobal,
      selected,
      sourceNode,
      isConnectable,
    });

  // --- SETUP CONSOLIDADO --- (extracted to reduce function size)
  const setupProps = useOptionNodeSetupConsolidated({
    initialInstruction,
    updateNodeData,
    id,
    sourceNode,
    setNodeEditing,
    isUltraPerformanceMode,
    reactFlowInstance,
    isEditing,
  });
  const {
    currentInstruction,
    setCurrentInstruction,
    handleInstructionChange,
    startEditing,
    finishEditing,
    cancelEditing,
    handleKeyDown,
  } = setupProps;

  // --- EFFECTS ---
  useNodeEffects({
    isEditing,
    instruction,
    setCurrentInstruction,
    textareaReference,
    nodeReference,
    id,
    updateNodeInternals,
  });

  // --- RENDER ---
  return useOptionNodeRender(
    buildOptionNodeRenderProps({
      nodeReference,
      nodeClasses,
      nodeStyle,
      startEditing,
      handleKeyDown,
      selected,
      label,
      id,
      isConnectable,
      isEditing,
      isUltraPerformanceMode,
      color,
      reactFlowInstance,
      sourceNode,
      currentInstruction,
      handleInstructionChange,
      textareaReference,
      instruction,
      cancelEditing,
      finishEditing,
      lastUpdated,
    }),
  );
};

OptionNodeComponent.propTypes = {
  id: PropTypes.string.isRequired,
  selected: PropTypes.bool,
  isConnectable: PropTypes.bool,
  _lodLevel: PropTypes.string,
};

const OptionNode = memo(OptionNodeComponent);

OptionNode.displayName = 'OptionNode';

export default OptionNode;
