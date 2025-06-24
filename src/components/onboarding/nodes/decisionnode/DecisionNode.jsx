/**
 * @file DecisionNode.jsx
 * @description Componente de alto rendimiento para el nodo de decisión, refactorizado con selectores granulares.
 * @version 5.0.0 - Refactorización con selectores granulares para eliminar ciclos de renderizado.
 */

import { GitBranch, Edit2, PlusCircle, Copy, Trash2 } from 'lucide-react';
import PropTypes from 'prop-types';
import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react';
import { Position, Handle, useUpdateNodeInternals } from 'reactflow';
import { shallow } from 'zustand/shallow';


import './DecisionNode.css';

import useFlowStore from '@/stores/useFlowStore';

import DecisionNodeHandles from './components/DecisionNodeHandles';
import { getConnectorColor } from './DecisionNode.types';


// Carga diferida de componentes para optimización
const DecisionNodeHeader = React.lazy(() => import('./components/DecisionNodeHeader'));
const DecisionNodeQuestion = React.lazy(() => import('./components/DecisionNodeQuestion'));
const DecisionNodeConditions = React.lazy(() => import('./components/DecisionNodeConditions'));
const DecisionNodeOptions = React.lazy(() => import('./components/DecisionNodeOptions'));

const MAX_CONDITIONS = 5;

const isValidQuestion = (question) => question?.trim().length > 0 && question.trim().length <= 500;


const DecisionNodeInternal = ({ id, selected, isConnectable }) => {
  // --- 1. Hooks de React y Zustand (TODOS INCONDICIONALES) ---
  const updateNodeInternals = useUpdateNodeInternals();

  const {
    updateNodeData,
    addDecisionNodeCondition,
    updateDecisionNodeConditionText,
    deleteDecisionNodeCondition,
    generateOptionNodes,
    duplicateNode,
    deleteNode,
    showContextMenu,
    isUltraPerformanceModeGlobal,
  } = useFlowStore(state => ({
    updateNodeData: state.updateNodeData,
    addDecisionNodeCondition: state.addDecisionNodeCondition,
    updateDecisionNodeConditionText: state.updateDecisionNodeConditionText,
    deleteDecisionNodeCondition: state.deleteDecisionNodeCondition,
    generateOptionNodes: state.generateOptionNodes,
    duplicateNode: state.duplicateNode,
    deleteNode: state.deleteNode,
    showContextMenu: state.showContextMenu,
    isUltraPerformanceModeGlobal: state.isUltraPerformanceModeGlobal,
  }), shallow);

  // Selector granular para optimizar re-renderizados. Solo nos subscribimos a los cambios de las props que realmente usamos.
  // La clave es `conditions.length`, que fuerza la actualización cuando se agrega/elimina una condición.
  const nodeData = useFlowStore(state => {
    const node = state.nodes.find(n => n.id === id);
    if (!node) return null;
    return {
      question: node.data.question,
      conditions: node.data.conditions,
      conditionsLength: node.data.conditions?.length || 0, // Dependencia CRÍTICA
      isEditing: node.data.isEditing,
      isSaving: node.data.isSaving,
      enableMarkdown: node.data.enableMarkdown,
      enableVariables: node.data.enableVariables,
      isUltraPerformanceMode: node.data.isUltraPerformanceMode,
      lodLevel: node.data.lodLevel,
    };
  }, shallow);

  const [currentQuestion, setCurrentQuestion] = useState(nodeData?.question || '');
  const [markdownEnabled, setMarkdownEnabled] = useState(nodeData?.enableMarkdown || false);
  const [variablesEnabled, setVariablesEnabled] = useState(nodeData?.enableVariables || false);


  const prevIsEditing = useRef(nodeData?.isEditing);

  const defaultConditions = useMemo(() => [
    { id: `cond-${id}-default-yes`, text: 'Sí', color: getConnectorColor('Sí', 0) },
    { id: `cond-${id}-default-no`, text: 'No', color: getConnectorColor('No', 1) },
  ], [id]);

  // Se elimina useMemo para garantizar que siempre se use la lista más actualizada de condiciones.
  // La optimización anterior estaba causando que la lista de handles no se actualizara.
  const currentConditions = (nodeData?.conditions && nodeData.conditions.length > 0) ? nodeData.conditions : defaultConditions;
  const isUltraMode = useMemo(() => nodeData?.isUltraPerformanceMode || isUltraPerformanceModeGlobal, [nodeData?.isUltraPerformanceMode, isUltraPerformanceModeGlobal]);
  const nodeClasses = useMemo(() =>
    ['decision-node', selected && 'selected', nodeData?.isEditing && 'editing', isUltraMode && 'ultra-performance'].filter(Boolean).join(' '),
  [selected, nodeData?.isEditing, isUltraMode]);

  const startEditing = useCallback(() => {
    setCurrentQuestion(nodeData?.question || '');
    setMarkdownEnabled(nodeData?.enableMarkdown || false);
    setVariablesEnabled(nodeData?.enableVariables || false);
    updateNodeData(id, { isEditing: true });
  }, [id, nodeData?.question, nodeData?.enableMarkdown, nodeData?.enableVariables, updateNodeData]);

  const cancelEditing = useCallback(() => {
    updateNodeData(id, { isEditing: false });
  }, [id, updateNodeData]);

  const finishEditing = useCallback(() => {
    if (isValidQuestion(currentQuestion)) {
      updateNodeData(id, {
        question: currentQuestion,
        enableMarkdown: markdownEnabled,
        enableVariables: variablesEnabled,
        isEditing: false,
      });
    } else {
      cancelEditing();
    }
  }, [id, currentQuestion, markdownEnabled, variablesEnabled, updateNodeData, cancelEditing]);

  const addCondition = useCallback(() => {
    if ((nodeData?.conditions?.length || 0) < MAX_CONDITIONS) {
      addDecisionNodeCondition(id);
    }
  }, [id, nodeData?.conditions?.length, addDecisionNodeCondition]);

  const handleConditionTextChange = useCallback((conditionId, newText) => {
    updateDecisionNodeConditionText(id, conditionId, newText);
  }, [id, updateDecisionNodeConditionText]);

  const handleDeleteCondition = useCallback((conditionId) => {
    deleteDecisionNodeCondition(id, conditionId);
  }, [id, deleteDecisionNodeCondition]);

  const handleContextMenu = useCallback((event) => {
    event.preventDefault();
    const items = [
      { label: 'Iniciar Edición', icon: <Edit2 size={16} />, action: () => updateNodeData(id, { isEditing: true }), disabled: nodeData?.isEditing },
      { label: 'Agregar Opción', icon: <PlusCircle size={16} />, action: addCondition, disabled: (nodeData?.conditions?.length || 0) >= MAX_CONDITIONS },
      { label: 'Duplicar Nodo', icon: <Copy size={16} />, action: () => duplicateNode(id) },
      { label: 'Eliminar Nodo', icon: <Trash2 size={16} />, action: () => deleteNode(id), isDestructive: true },
    ];
    showContextMenu(event.clientX, event.clientY, id, items);
  }, [id, nodeData?.isEditing, nodeData?.conditions?.length, addCondition, duplicateNode, deleteNode, showContextMenu, updateNodeData]);

  useEffect(() => {
    if (nodeData && (!nodeData.conditions || nodeData.conditions.length === 0)) {
      updateNodeData(id, { conditions: defaultConditions });
    }
  }, [id, nodeData, defaultConditions, updateNodeData]);

  // Clave de dependencia para regenerar nodos de opción solo cuando los datos relevantes cambian.
  // Se serializa `currentConditions` para crear una dependencia estable que solo cambia si los datos reales cambian.
  const conditionsKey = useMemo(() => JSON.stringify(currentConditions), [currentConditions]);


  useEffect(() => {
    // Si el estado de edición ha cambiado (de true a false o de false a true),
    // es crucial forzar una actualización de los "internals" del nodo.
    // Esto le indica a React Flow que debe volver a medir el tamaño del nodo y
    // la posición de sus handles, asegurando que las aristas se reconecten
    // correctamente al nuevo layout.
    if (prevIsEditing.current !== nodeData?.isEditing) {
      // Se usa un pequeño timeout para asegurar que el DOM se haya actualizado
      // con el nuevo tamaño del nodo antes de que React Flow intente medirlo.
      setTimeout(() => updateNodeInternals(id), 50);
    }
    prevIsEditing.current = nodeData?.isEditing;
  }, [nodeData?.isEditing, updateNodeInternals, id]);

  // Efecto para forzar la actualización de handles al cambiar el modo ultra.
  // Esto es crucial para prevenir que los handles desaparezcan o se desincronicen.
  useEffect(() => {
    if (id) {
      updateNodeInternals(id);
    }
  }, [isUltraMode, id, updateNodeInternals]);

  // --- Guarda de renderizado ---
  // Se ejecuta DESPUÉS de todos los hooks para cumplir las reglas de React.
  if (!nodeData) {
    return null;
  }

  // --- Renderizado del Componente ---
  const {
    question,
    isEditing,
    isSaving,
    enableMarkdown,
    enableVariables,
  } = nodeData;

  return (
    <div className={nodeClasses} onContextMenu={handleContextMenu} onDoubleClick={!isEditing ? startEditing : undefined}>
      <Handle type="target" position={Position.Top} className="decision-node__handle decision-node__handle--target" isConnectable={isConnectable} />
      <Suspense fallback={<div className="suspense-loader">Cargando...</div>}>
        <DecisionNodeHeader
          title={isEditing ? 'Editando Decisión' : (question || '...')}
          isEditing={isEditing}
          isUltraPerformanceMode={isUltraMode}
          onStartEdit={startEditing}
        />
        <div className="decision-node__content">
          {isEditing ? (
            <>
              <DecisionNodeQuestion
                question={currentQuestion}
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
                onMoveCondition={() => {}} // Placeholder
                isUltraPerformanceMode={isUltraMode}
                isEditing={isEditing}
                activeConditionId={null}
                setActiveConditionId={() => {}}
              />
            </>
          ) : (
            <div className="decision-node__question-preview" onClick={startEditing} role="button" tabIndex={0}>
              {question || 'Haz clic para editar la pregunta...'}
            </div>
          )}
        </div>

        <div className="decision-node__footer">
          {isEditing ? (
            <div className="decision-node__edit-actions">
              <button onClick={cancelEditing} className="decision-node__button decision-node__button--secondary">Cancelar</button>
              <button onClick={finishEditing} className="decision-node__button decision-node__button--primary">Guardar</button>
            </div>
          ) : (
            <DecisionNodeOptions
              onAddCondition={addCondition}
              isEditing={isEditing}
              isSaving={isSaving || false}
              onToggleMarkdown={() => updateNodeData(id, { enableMarkdown: !enableMarkdown })}
              onToggleVariables={() => updateNodeData(id, { enableVariables: !enableVariables })}
              onToggleLogic={() => {}} // Placeholder
              enableMarkdown={enableMarkdown || false}
              enableVariables={enableVariables || false}
              enableLogic={false} // Placeholder
            />
          )}
        </div>
      </Suspense>

      <DecisionNodeHandles nodeId={id} outputs={currentConditions} isConnectable={isConnectable} />
    </div>
  );
};

const arePropsEqual = (prevProps, nextProps) => {
  return (
    prevProps.id === nextProps.id &&
    prevProps.selected === nextProps.selected &&
    prevProps.isConnectable === nextProps.isConnectable
  );
};

const DecisionNode = React.memo(DecisionNodeInternal, arePropsEqual);

DecisionNode.displayName = 'DecisionNode';

DecisionNode.propTypes = {
  id: PropTypes.string.isRequired,
  selected: PropTypes.bool,
  isConnectable: PropTypes.bool,
};

export default DecisionNode;
