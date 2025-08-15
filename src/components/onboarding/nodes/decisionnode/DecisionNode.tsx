/**
 * @file DecisionNode.tsx
 * @description Componente de alto rendimiento para el nodo de decisión, refactorizado con selectores granulares.
 * @version 5.0.0 - Refactorización con selectores granulares para eliminar ciclos de renderizado.
 */

import PropTypes from 'prop-types';
import React, { useState, useCallback, useMemo, useEffect, useRef, Suspense } from 'react';
import { Position, Handle, useUpdateNodeInternals } from 'reactflow';
import { shallow } from 'zustand/shallow';

import { useRenderTracker } from '@/utils/renderTracker';

import useFlowStore, { useDecisionNodeActions } from '../../../../stores/use-flow-store';

import DecisionNodeHandles from './components/DecisionNodeHandles';
import { getConnectorColor } from './DecisionNode.types';
import type { DecisionCondition, DecisionNodeData } from './DecisionNode.types';

import './DecisionNode.css';

// Tipos específicos para el store de Zustand
interface FlowStoreState {
  updateNodeData: (id: string, data: Partial<DecisionNodeData>) => void;
  showContextMenu: (params: {
    x: number;
    y: number;
    nodeId: string;
    items: ContextMenuItem[];
  }) => void;
  isUltraPerformanceMode: boolean;
  nodes: Array<{ id: string; data: DecisionNodeData }>;
}

interface ContextMenuItem {
  label?: string;
  action?: () => void;
  icon?: string;
  disabled?: boolean;
  type?: string;
  style?: Record<string, string>;
}

interface DecisionNodeProps {
  id: string;
  selected?: boolean;
  isConnectable?: boolean;
  data: DecisionNodeData;
}

// Carga diferida de componentes para optimización
const DecisionNodeHeader = React.lazy(async () => import('./components/DecisionNodeHeader'));
const DecisionNodeQuestion = React.lazy(async () => import('./components/DecisionNodeQuestion'));
const DecisionNodeConditions = React.lazy(
  async () => import('./components/DecisionNodeConditions'),
);
const DecisionNodeOptions = React.lazy(async () => import('./components/DecisionNodeOptions'));

const MAX_CONDITIONS = 5;

// Interfaces
interface DecisionNodeProps {
  id: string;
  selected?: boolean;
  isConnectable?: boolean;
}

// Custom Hook: Decision Node Handlers
const useDecisionNodeHandlers = ({
  id,
  nodeData,
  currentQuestion,
  _markdownEnabled,
  _variablesEnabled,
  setCurrentQuestion,
  setMarkdownEnabled,
  setVariablesEnabled,
  updateNodeData,
  addDecisionNodeCondition,
  updateDecisionNodeConditionText,
  deleteDecisionNodeCondition,
  showContextMenu,
}: {
  id: string;
  nodeData: DecisionNodeData | null;
  currentQuestion: string;
  _markdownEnabled: boolean;
  _variablesEnabled: boolean;
  setCurrentQuestion: (question: string) => void;
  setMarkdownEnabled: (enabled: boolean) => void;
  setVariablesEnabled: (enabled: boolean) => void;
  updateNodeData: (id: string, data: Partial<DecisionNodeData>) => void;
  addDecisionNodeCondition: (nodeId: string) => void;
  updateDecisionNodeConditionText: (nodeId: string, conditionId: string, text: string) => void;
  deleteDecisionNodeCondition: (nodeId: string, conditionId: string) => void;
  showContextMenu: (params: {
    x: number;
    y: number;
    nodeId: string;
    items: ContextMenuItem[];
  }) => void;
}) => {
  const startEditing = useCallback(() => {
    setCurrentQuestion(nodeData?.question ?? '');
    setMarkdownEnabled(nodeData?.enableMarkdown ?? false);
    setVariablesEnabled(nodeData?.enableVariables ?? false);
    updateNodeData(id, { isEditing: true });
  }, [
    id,
    nodeData?.question,
    nodeData?.enableMarkdown,
    nodeData?.enableVariables,
    updateNodeData,
    setCurrentQuestion,
    setMarkdownEnabled,
    setVariablesEnabled,
  ]);

  const cancelEditing = useCallback(() => {
    updateNodeData(id, { isEditing: false });
  }, [id, updateNodeData]);

  const finishEditing = useCallback(() => {
    if (!currentQuestion.trim()) {
      cancelEditing();
      return;
    }

    updateNodeData(id, {
      question: currentQuestion,
      isEditing: false,
    });
  }, [id, currentQuestion, updateNodeData, cancelEditing]);

  const addCondition = useCallback(() => {
    if ((nodeData?.conditions?.length ?? 0) < MAX_CONDITIONS) {
      addDecisionNodeCondition(id);
    }
  }, [id, nodeData?.conditions?.length, addDecisionNodeCondition]);

  const handleConditionTextChange = useCallback(
    (conditionId: string, newText: string) => {
      updateDecisionNodeConditionText(id, conditionId, newText);
    },
    [id, updateDecisionNodeConditionText],
  );

  const handleDeleteCondition = useCallback(
    (conditionId: string) => {
      deleteDecisionNodeCondition(id, conditionId);
    },
    [id, deleteDecisionNodeCondition],
  );

  const handleContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const contextMenuItems = [
        {
          label: 'Editar',
          icon: '✏️',
          action: startEditing,
          disabled: nodeData?.isEditing ?? false,
        },
        {
          label: 'Agregar Opción',
          icon: '➕',
          action: addCondition,
          disabled: (nodeData?.conditions?.length ?? 0) >= MAX_CONDITIONS,
        },
        { type: 'separator', label: '' },
        {
          label: 'Eliminar',
          icon: '🗑️',
          action: () => {
            // TODO: Implement delete functionality
          },
          style: { color: '#ef4444' },
        },
      ];

      showContextMenu({ x: event.clientX, y: event.clientY, nodeId: id, items: contextMenuItems });
    },
    [
      id,
      nodeData?.isEditing,
      nodeData?.conditions?.length,
      startEditing,
      addCondition,
      showContextMenu,
    ],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        if (!nodeData?.isEditing) {
          startEditing();
        }
      }
    },
    [nodeData?.isEditing, startEditing],
  );

  return {
    startEditing,
    cancelEditing,
    finishEditing,
    addCondition,
    handleConditionTextChange,
    handleDeleteCondition,
    handleContextMenu,
    handleKeyDown,
  };
};

// Custom Hook: Decision Node Initialization and Effects
const useDecisionNodeInitialization = ({
  id,
  nodeData,
  defaultConditions,
  currentConditions: _currentConditions,
  isUltraMode: _isUltraMode,
  updateNodeData,
  updateNodeInternals,
  previousIsEditing,
}: {
  id: string;
  nodeData: DecisionNodeData | null;
  defaultConditions: DecisionCondition[];
  currentConditions: DecisionCondition[];
  isUltraMode: boolean;
  updateNodeData: (id: string, data: Partial<DecisionNodeData>) => void;
  updateNodeInternals: (id: string) => void;
  previousIsEditing: React.MutableRefObject<boolean | undefined>;
}) => {
  // Effect to initialize default conditions if none exist
  useEffect(() => {
    if (nodeData && (!nodeData.conditions || nodeData.conditions.length === 0)) {
      updateNodeData(id, { conditions: defaultConditions });
    }
  }, [id, nodeData, defaultConditions, updateNodeData]);

  // Effect SOLO para cambios de tamaño (expandir/colapsar), NO para edición de contenido
  useEffect(() => {
    // Solo actualizar cuando cambia el estado de edición (tamaño del nodo)
    // NO cuando cambia el contenido de las condiciones
    if (previousIsEditing.current !== nodeData?.isEditing) {
      // console.log('🔧 DecisionNode size changed - updating handles for edge alignment'); // DISABLED
      setTimeout(() => updateNodeInternals(id), 50);
    }
    previousIsEditing.current = nodeData?.isEditing;
  }, [nodeData?.isEditing, updateNodeInternals, id, previousIsEditing]);
};

// Subcomponente: Decision Node Content
const DecisionNodeContent = ({
  isEditing,
  currentQuestion,
  setCurrentQuestion,
  startEditing,
  finishEditing,
  cancelEditing,
  currentConditions,
  addCondition,
  handleConditionTextChange,
  handleDeleteCondition,
  isUltraMode,
  question,
  handleKeyDown,
  id,
  updateNodeData,
  enableMarkdown,
  enableVariables,
}: {
  isEditing: boolean;
  currentQuestion: string;
  setCurrentQuestion: (question: string) => void;
  startEditing: () => void;
  finishEditing: () => void;
  cancelEditing: () => void;
  currentConditions: DecisionCondition[];
  addCondition: () => void;
  handleConditionTextChange: (conditionId: string, newText: string) => void;
  handleDeleteCondition: (conditionId: string) => void;
  isUltraMode: boolean;
  question: string;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  id: string;
  updateNodeData: (id: string, data: Partial<DecisionNodeData>) => void;
  enableMarkdown: boolean;
  enableVariables: boolean;
}) => {
  const trimmedQuestion = currentQuestion?.trim() ?? '';

  return (
    <>
      <div className='decision-node__content'>
        {isEditing ? (
          <>
            <DecisionNodeQuestion
              question={trimmedQuestion}
              onQuestionChange={setCurrentQuestion}
              isEditing={isEditing}
              onStartEditing={startEditing}
              onSave={finishEditing}
              onCancel={cancelEditing}
            />
            <DecisionNodeConditions
              conditions={currentConditions}
              onAddCondition={addCondition}
              onConditionChange={handleConditionTextChange}
              onDeleteCondition={handleDeleteCondition}
              onMoveCondition={() => {
                // Placeholder
              }}
              isUltraPerformanceMode={isUltraMode}
              isEditing={isEditing}
              activeConditionId={undefined}
              setActiveConditionId={() => {
                // Placeholder
              }}
            />
          </>
        ) : (
          <div
            className='decision-node__question-preview'
            onClick={startEditing}
            onKeyDown={handleKeyDown}
            role='button'
            tabIndex={0}
          >
            {question || 'Haz clic para editar la pregunta...'}
          </div>
        )}
      </div>

      <div className='decision-node__footer'>
        {isEditing ? (
          <div className='decision-node__edit-actions'>
            <button
              onClick={cancelEditing}
              className='decision-node__button decision-node__button--secondary'
            >
              Cancelar
            </button>
            <button
              onClick={finishEditing}
              className='decision-node__button decision-node__button--primary'
            >
              Guardar
            </button>
          </div>
        ) : (
          <DecisionNodeOptions
            isUltraPerformanceMode={isUltraMode}
            onToggleMarkdown={() => updateNodeData(id, { enableMarkdown: !enableMarkdown })}
            enableMarkdown={enableMarkdown}
            onToggleVariables={() => updateNodeData(id, { enableVariables: !enableVariables })}
            enableVariables={enableVariables}
            onToggleLogic={() => {
              // Placeholder
            }}
            enableLogic={false}
          />
        )}
      </div>
    </>
  );
};

DecisionNodeContent.propTypes = {
  isEditing: PropTypes.bool,
  currentQuestion: PropTypes.string,
  setCurrentQuestion: PropTypes.func,
  startEditing: PropTypes.func,
  finishEditing: PropTypes.func,
  cancelEditing: PropTypes.func,
  currentConditions: PropTypes.array,
  addCondition: PropTypes.func,
  handleConditionTextChange: PropTypes.func,
  handleDeleteCondition: PropTypes.func,
  isUltraMode: PropTypes.bool,
  question: PropTypes.string,
  handleKeyDown: PropTypes.func,
  isSaving: PropTypes.bool,
  id: PropTypes.string,
  updateNodeData: PropTypes.func,
  enableMarkdown: PropTypes.bool,
  enableVariables: PropTypes.bool,
};

// Custom Hook: Decision Node Memoizations
const useDecisionNodeMemoizations = ({
  id,
  nodeData,
  selected,
  isUltraPerformanceModeGlobal,
}: {
  id: string;
  nodeData: DecisionNodeData | null;
  selected?: boolean;
  isUltraPerformanceModeGlobal?: boolean;
}) => {
  const defaultConditions = useMemo(
    () => [
      {
        id: `cond-${id}-default-yes`,
        text: 'Sí',
        color: getConnectorColor('Sí', 0),
        isValid: true,
        order: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `cond-${id}-default-no`,
        text: 'No',
        color: getConnectorColor('No', 1),
        isValid: true,
        order: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    [id],
  );

  const currentConditions =
    nodeData?.conditions && nodeData.conditions.length > 0
      ? nodeData.conditions
      : defaultConditions;

  const nodeIsUltraMode = nodeData?.isUltraPerformanceMode ?? false;
  const isUltraMode = useMemo(
    () => isUltraPerformanceModeGlobal ?? nodeIsUltraMode,
    [isUltraPerformanceModeGlobal, nodeIsUltraMode],
  );

  const nodeClasses = useMemo(
    () =>
      [
        'decision-node',
        selected && 'selected',
        nodeData?.isEditing && 'editing',
        isUltraMode && 'ultra-performance',
      ]
        .filter(Boolean)
        .join(' '),
    [selected, nodeData?.isEditing, isUltraMode],
  );

  return {
    defaultConditions,
    currentConditions,
    isUltraMode,
    nodeClasses,
  };
};

// Custom Hook: Decision Node State
const useDecisionNodeState = (nodeData: DecisionNodeData | null) => {
  const [currentQuestion, setCurrentQuestion] = useState(nodeData?.question ?? '');
  const [markdownEnabled, setMarkdownEnabled] = useState(nodeData?.enableMarkdown ?? false);
  const [variablesEnabled, setVariablesEnabled] = useState(nodeData?.enableVariables ?? false);

  const previousIsEditing = useRef(nodeData?.isEditing);

  return {
    currentQuestion,
    setCurrentQuestion,
    markdownEnabled,
    setMarkdownEnabled,
    variablesEnabled,
    setVariablesEnabled,
    previousIsEditing,
  };
};

// Custom Hook: Decision Node Selector
const useDecisionNodeSelector = (id: string): DecisionNodeData | null => {
  // Selector granular para optimizar re-renderizados. Solo nos subscribimos a los cambios de las props que realmente usamos.
  // La clave es `conditions.length`, que fuerza la actualización cuando se agrega/elimina una condición.
  const nodeData = useFlowStore((state: FlowStoreState) => {
    const node = state.nodes.find((n) => n.id === id);
    return node?.data ?? null;
  }, shallow);

  return nodeData;
};

const DecisionNodeInternal = ({ id, selected, isConnectable }: DecisionNodeProps) => {
  // 🔄 RENDER TRACKING
  useRenderTracker('DecisionNode', [id, selected]);

  // --- 1. Hooks de React y Zustand (TODOS INCONDICIONALES) ---
  const updateNodeInternals = useUpdateNodeInternals();

  const { updateNodeData, showContextMenu, isUltraPerformanceModeGlobal } = useFlowStore(
    (state: FlowStoreState) => ({
      updateNodeData: state.updateNodeData,
      showContextMenu: state.showContextMenu,
      isUltraPerformanceModeGlobal: state.isUltraPerformanceMode,
    }),
    shallow,
  ) as {
    updateNodeData: (id: string, data: Partial<DecisionNodeData>) => void;
    showContextMenu: (params: {
      x: number;
      y: number;
      nodeId: string;
      items: ContextMenuItem[];
    }) => void;
    isUltraPerformanceModeGlobal: boolean;
  };

  const { addDecisionNodeCondition, updateDecisionNodeConditionText, deleteDecisionNodeCondition } =
    useDecisionNodeActions() as {
      addDecisionNodeCondition: (nodeId: string) => void;
      updateDecisionNodeConditionText: (nodeId: string, conditionId: string, text: string) => void;
      deleteDecisionNodeCondition: (nodeId: string, conditionId: string) => void;
    };

  // Node data using custom hook
  const nodeData = useDecisionNodeSelector(id);

  // All state using custom hook
  const {
    currentQuestion,
    setCurrentQuestion,
    markdownEnabled,
    setMarkdownEnabled,
    variablesEnabled,
    setVariablesEnabled,
    previousIsEditing,
  } = useDecisionNodeState(nodeData) as {
    currentQuestion: string;
    setCurrentQuestion: (question: string) => void;
    markdownEnabled: boolean;
    setMarkdownEnabled: (enabled: boolean) => void;
    variablesEnabled: boolean;
    setVariablesEnabled: (enabled: boolean) => void;
    previousIsEditing: React.MutableRefObject<boolean | undefined>;
  };

  // All memoizations using custom hook
  const { defaultConditions, currentConditions, isUltraMode, nodeClasses } =
    useDecisionNodeMemoizations({
      id,
      nodeData,
      selected,
      isUltraPerformanceModeGlobal,
    }) as {
      defaultConditions: DecisionCondition[];
      currentConditions: DecisionCondition[];
      isUltraMode: boolean;
      nodeClasses: string;
    };

  // All handlers using custom hook
  const handlers = useDecisionNodeHandlers({
    id,
    nodeData,
    currentQuestion,
    _markdownEnabled: markdownEnabled,
    _variablesEnabled: variablesEnabled,
    setCurrentQuestion,
    setMarkdownEnabled,
    setVariablesEnabled,
    updateNodeData,
    addDecisionNodeCondition,
    updateDecisionNodeConditionText,
    deleteDecisionNodeCondition,
    showContextMenu,
  });

  const {
    startEditing,
    cancelEditing,
    finishEditing,
    addCondition,
    handleConditionTextChange,
    handleDeleteCondition,
    handleContextMenu,
    handleKeyDown,
  } = handlers as {
    startEditing: () => void;
    cancelEditing: () => void;
    finishEditing: () => void;
    addCondition: () => void;
    handleConditionTextChange: (conditionId: string, newText: string) => void;
    handleDeleteCondition: (conditionId: string) => void;
    handleContextMenu: (event: React.MouseEvent) => void;
    handleKeyDown: (event: React.KeyboardEvent) => void;
  };
  // All initialization effects using custom hook
  useDecisionNodeInitialization({
    id,
    nodeData,
    defaultConditions,
    currentConditions,
    isUltraMode,
    updateNodeData,
    updateNodeInternals,
    previousIsEditing,
  });
  // --- Guarda de renderizado ---
  // Se ejecuta DESPUÉS de todos los hooks para cumplir las reglas de React.
  if (!nodeData) return null;

  // --- Renderizado del Componente ---
  const {
    question = '',
    isEditing = false,
    enableMarkdown = false,
    enableVariables = false,
  } = nodeData ?? {};

  return (
    <div
      className={nodeClasses}
      onContextMenu={handleContextMenu}
      onDoubleClick={isEditing ? undefined : startEditing}
    >
      <Handle
        type='target'
        position={Position.Top}
        id='input'
        className='decision-node__handle decision-node__handle--target'
        isConnectable={isConnectable}
      />
      <Suspense fallback={<div className='suspense-loader'>Cargando...</div>}>
        <DecisionNodeHeader title={`Decisión ${id}`} isUltraPerformanceMode={isUltraMode} />
        <DecisionNodeContent
          isEditing={isEditing}
          currentQuestion={currentQuestion}
          setCurrentQuestion={setCurrentQuestion}
          startEditing={startEditing}
          finishEditing={finishEditing}
          cancelEditing={cancelEditing}
          currentConditions={currentConditions}
          addCondition={addCondition}
          handleConditionTextChange={handleConditionTextChange}
          handleDeleteCondition={handleDeleteCondition}
          isUltraMode={isUltraMode}
          question={question}
          handleKeyDown={handleKeyDown}
          id={id}
          updateNodeData={updateNodeData}
          enableMarkdown={enableMarkdown}
          enableVariables={enableVariables}
        />
      </Suspense>

      <DecisionNodeHandles nodeId={id} outputs={currentConditions} isConnectable={isConnectable} />
    </div>
  );
};

const arePropertiesEqual = (
  previousProperties: DecisionNodeProps,
  nextProperties: DecisionNodeProps,
) => {
  return (
    previousProperties.id === nextProperties.id &&
    previousProperties.selected === nextProperties.selected &&
    previousProperties.isConnectable === nextProperties.isConnectable
  );
};

const DecisionNode = React.memo(DecisionNodeInternal, arePropertiesEqual);

DecisionNode.displayName = 'DecisionNode';

export default DecisionNode;
