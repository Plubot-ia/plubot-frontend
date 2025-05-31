/**
 * @file DecisionNode.jsx
 * @description Componente para el nodo de decisión en el editor de flujos
 * @version 2.1.0 - Refactorizado para usar DecisionNodeHandles y añadir handle de entrada
 */

import React, { useState, useCallback, useMemo, useEffect, useRef, Suspense } from 'react'; 
import PropTypes from 'prop-types';
import { Position, Handle, useReactFlow, useUpdateNodeInternals } from 'reactflow'; 
import { debounce } from 'lodash';

import './DecisionNode.css';
import useFlowStore from '@/stores/useFlowStore';

// Carga diferida de componentes para mejorar el rendimiento inicial
const DecisionNodeHeader = React.lazy(() => import('./components/DecisionNodeHeader'));
const DecisionNodeQuestion = React.lazy(() => import('./components/DecisionNodeQuestion'));
const DecisionNodeConditions = React.lazy(() => import('./components/DecisionNodeConditions'));
const DecisionNodeOptions = React.lazy(() => import('./components/DecisionNodeOptions'));
import DecisionNodeHandles from './components/DecisionNodeHandles'; // Importación síncrona para prueba 

// Número máximo de condiciones permitidas
const MAX_CONDITIONS = 8; 

// Validación simple de pregunta
const isValidQuestion = (question) => {
  return question && question.trim().length > 0 && question.trim().length <= 500;
};

/**
 * Componente DecisionNode - Componente principal para el nodo de decisión
 */
const DecisionNode = ({ 
  id, 
  selected = false, 
  isConnectable = true 
}) => {
  // Estado local para UI
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // showContextMenu y contextMenuPosition eliminados, se usa el store global
  const [activeConditionId, setActiveConditionId] = useState(null);

  useEffect(() => {
    console.log(`DecisionNode ${id}: isEditing cambió a: ${isEditing}`);
  }, [isEditing, id]); 
  
  // Referencias
  const nodeRef = useRef(null);
  const prevConditionsRef = useRef([]);
  const updateNodeInternals = useUpdateNodeInternals();
  const reactFlowInstance = useReactFlow();
  
  // Selectores de Zustand
  const nodeData = useFlowStore(state => {
    const node = state.nodes.find(n => n.id === id);
    return node?.data || {
      question: '¿Cuál es tu pregunta?',
      conditions: [
        { id: `cond-${id}-yes`, text: 'Sí' }, 
        { id: `cond-${id}-no`, text: 'No' }
      ],
      enableMarkdown: false,
      enableVariables: false,
      enableLogic: false,
      enableAnimation: true,
      isUltraPerformanceMode: false
    };
  });
  
  // Acciones del store 
  const {
    updateDecisionNodeQuestion,
    addDecisionNodeCondition,
    updateDecisionNodeConditionText,
    deleteDecisionNodeCondition,
    moveDecisionNodeCondition,
    toggleDecisionNodeFeature,
    updateDecisionNodeData,
    generateOptionNodes,
    duplicateDecisionNode,
    getNode,
    setNodes
  } = useFlowStore(state => ({
    updateDecisionNodeQuestion: state.updateDecisionNodeQuestion,
    addDecisionNodeCondition: state.addDecisionNodeCondition,
    updateDecisionNodeConditionText: state.updateDecisionNodeConditionText,
    deleteDecisionNodeCondition: state.deleteDecisionNodeCondition,
    moveDecisionNodeCondition: state.moveDecisionNodeCondition,
    toggleDecisionNodeFeature: state.toggleDecisionNodeFeature,
    updateDecisionNodeData: state.updateDecisionNodeData,
    generateOptionNodes: state.generateOptionNodes,
    duplicateDecisionNode: state.duplicateDecisionNode,
    getNode: state.getNode,
    setNodes: state.setNodes
  }));
  
  const {
    question,
    conditions: nodeConditions = [],
    enableMarkdown = false,
    enableVariables = false,
    enableLogic = false,
    // enableAnimation fue eliminado
    isUltraPerformanceMode = false
  } = nodeData;

  const defaultConditions = useMemo(() => [
    { id: `cond-${id}-default-yes`, text: 'Sí' }, 
    { id: `cond-${id}-default-no`, text: 'No' }
  ], [id]);

  const currentConditions = useMemo(() => 
    nodeConditions && nodeConditions.length > 0 ? nodeConditions : defaultConditions,
  [nodeConditions, defaultConditions]);
  
    // Determinar si estamos en modo ultra rendimiento
  const isUltraMode = useMemo(() => 
    nodeData?.isUltraPerformanceMode || useFlowStore.getState().isUltraPerformanceModeGlobal || false,
  [nodeData?.isUltraPerformanceMode]);

  const nodeClasses = useMemo(() => {
    const classes = ['decision-node'];
    if (selected) classes.push('selected');
    if (isEditing) classes.push('editing');
    if (isUltraMode) classes.push('ultra-performance');
    return classes.join(' ');
  }, [selected, isEditing, isUltraPerformanceMode]);
  
  useEffect(() => {
    let firstTimerId;
    let secondTimerId;
    let thirdTimerId;

    if (currentConditions && currentConditions.length > 0) {
      if (JSON.stringify(currentConditions) !== JSON.stringify(prevConditionsRef.current)) {
        console.log(`[DecisionNode ${id} EFFECT] Conditions changed. Prev: ${prevConditionsRef.current?.length}, Curr: ${currentConditions.length}`);
        console.log(`[DecisionNode ${id} EFFECT] typeof updateNodeInternals: ${typeof updateNodeInternals}`);

        if (typeof updateNodeInternals === 'function' && reactFlowInstance) {
          console.log(`[DecisionNode ${id} EFFECT] 1. Calling updateNodeInternals(${id}) PRE-generation.`);
          updateNodeInternals(id); // Primera llamada: notificar que los handles van a cambiar

          console.log(`[DecisionNode ${id} EFFECT] Scheduling generateOptionNodes with setTimeout 0.`);
          firstTimerId = setTimeout(() => {
            console.log(`[DecisionNode ${id} EFFECT] 2. Executing delayed generateOptionNodes.`);
            generateOptionNodes(id, currentConditions); // Generar nodos y aristas

            console.log(`[DecisionNode ${id} EFFECT] Scheduling SECOND updateNodeInternals call with setTimeout 0.`);
            secondTimerId = setTimeout(() => {
              console.log(`[DecisionNode ${id} EFFECT] 3. Calling updateNodeInternals(${id}) POST-generation.`);
              updateNodeInternals(id); // Segunda llamada: ayudar a React Flow a asentar el layout

              console.log(`[DecisionNode ${id} EFFECT] Scheduling fitView call with setTimeout 0.`);
              thirdTimerId = setTimeout(() => {
                console.log(`[DecisionNode ${id} EFFECT] 4. Calling fitView for node ${id}.`);
                reactFlowInstance.fitView({ nodes: [{ id }], duration: 200, padding: 0.2 });
              }, 0); // Delay para fitView

            }, 0); // Delay para la segunda llamada a updateNodeInternals

          }, 0); // Delay para generateOptionNodes

          prevConditionsRef.current = [...currentConditions];
        } else {
          console.error('[DecisionNode ${id} EFFECT] updateNodeInternals is not a function or reactFlowInstance is not available', { updateNodeInternals, reactFlowInstance });
        }
      }
    }

    return () => {
      if (firstTimerId) {
        clearTimeout(firstTimerId);
      }
      if (secondTimerId) {
        clearTimeout(secondTimerId);
      }
      if (thirdTimerId) {
        clearTimeout(thirdTimerId);
      }
    };
  }, [currentConditions, id, generateOptionNodes, updateNodeInternals, reactFlowInstance]);

  const saveChanges = useCallback(() => {
    setIsEditing(false);
    setIsSaving(false);
  }, []);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
  }, []);
  
  const startEditing = useCallback(() => {
    console.log(`DecisionNode ${id}: startEditing llamado. Estado actual de isEditing: ${isEditing}, isUltraPerformanceMode: ${isUltraPerformanceMode}`);
    if (!isEditing) { // Temporalmente modificado para ignorar isUltraPerformanceMode
      setIsEditing(true);
    }
  }, [isUltraPerformanceMode, isEditing]);
  
  const handleDoubleClick = useCallback((e) => {
    console.log(`DecisionNode ${id}: handleDoubleClick disparado!`, { target: e.target, currentTarget: e.currentTarget });
    // Temporalmente modificado para ignorar isUltraPerformanceMode
    e.stopPropagation();
    startEditing();
  }, [startEditing]);
  

  
  const handleQuestionChange = useCallback((newQuestionText) => {
    if (isValidQuestion(newQuestionText)) {
      updateDecisionNodeQuestion(id, newQuestionText);
    } else {
      console.warn('Pregunta no válida:', newQuestionText);
    }
  }, [id, updateDecisionNodeQuestion]);
  
  const handleAddCondition = useCallback((newConditionText) => {
    if (currentConditions.length < MAX_CONDITIONS) {
      const newConditionId = `cond-${id}-${Date.now()}`;
      addDecisionNodeCondition(id, newConditionText);
    } else {
      console.warn(`No se pueden añadir más de ${MAX_CONDITIONS} condiciones.`);
    }
  }, [id, addDecisionNodeCondition, currentConditions.length]);
  
  const handleConditionChange = useCallback((conditionId, newText) => {
    updateDecisionNodeConditionText(id, conditionId, newText);
  }, [id, updateDecisionNodeConditionText]);
  
  const handleToggleMarkdown = useCallback(() => {
    console.log(`Toggling Markdown for node ${id}. Current: ${nodeData.enableMarkdown}`);
    toggleDecisionNodeFeature(id, 'enableMarkdown');
  }, [id, toggleDecisionNodeFeature, nodeData.enableMarkdown]);

  const getNodeContextMenuItems = () => {
    const items = [];
    if (isEditing) {
      items.push({ label: 'Guardar Cambios', action: saveChanges, closeMenuOnClick: true });
      items.push({ label: 'Cancelar Edición', action: cancelEditing, closeMenuOnClick: true });
    } else {
      items.push({ label: 'Editar Nodo', action: startEditing, closeMenuOnClick: true });
    }
    items.push({ label: 'Añadir Condición', action: () => handleAddCondition('Nueva Condición'), closeMenuOnClick: true });
    items.push({ label: 'Duplicar Nodo', action: () => duplicateDecisionNode(id), closeMenuOnClick: true });
    items.push({ 
      label: 'Eliminar Nodo', 
      action: () => useFlowStore.getState().deleteNode(id), 
      closeMenuOnClick: true 
    });
    
    return items;
  };

  const handleNodeContextMenu = useCallback((event) => {
    event.preventDefault();
    // Opcional: Añadir condición para !isUltraPerformanceMode si se desea
    const items = getNodeContextMenuItems();
    console.log('[DecisionNode] handleNodeContextMenu attempting to show. Event:', event, 'clientX:', event.clientX, 'clientY:', event.clientY, 'items:', items, 'nodeId:', id);
    useFlowStore.getState().showContextMenu(event.clientX, event.clientY, id, items);
  }, [id, isEditing, saveChanges, cancelEditing, startEditing, handleAddCondition, duplicateDecisionNode, isUltraPerformanceMode]);

  const handleToggleVariables = useCallback(() => {
    console.log(`Toggling Variables for node ${id}. Current: ${nodeData.enableVariables}`);
    toggleDecisionNodeFeature(id, 'enableVariables');
  }, [id, toggleDecisionNodeFeature, nodeData.enableVariables]);

  const handleToggleLogic = useCallback(() => {
    console.log(`Toggling Logic for node ${id}. Current: ${nodeData.enableLogic}`);
    toggleDecisionNodeFeature(id, 'enableLogic');
  }, [id, toggleDecisionNodeFeature, nodeData.enableLogic]);

  const handleDeleteCondition = useCallback((conditionIdToDelete) => {
    deleteDecisionNodeCondition(id, conditionIdToDelete);
  }, [id, deleteDecisionNodeCondition]);
  
  const handleMoveCondition = useCallback((conditionId, direction) => {
    if (direction === 'up' || direction === 'down') {
      moveDecisionNodeCondition(id, conditionId, direction);
    } else {
      console.warn(`handleMoveCondition llamado con dirección inválida: ${direction}. Se espera 'up' o 'down'.`);
    }
  }, [id, moveDecisionNodeCondition]);
  
  const toggleMarkdown = useCallback(() => toggleDecisionNodeFeature(id, 'enableMarkdown', !enableMarkdown), [id, toggleDecisionNodeFeature, enableMarkdown]);
  const toggleVariables = useCallback(() => toggleDecisionNodeFeature(id, 'enableVariables', !enableVariables), [id, toggleDecisionNodeFeature, enableVariables]);
  const toggleLogic = useCallback(() => toggleDecisionNodeFeature(id, 'enableLogic', !enableLogic), [id, toggleDecisionNodeFeature, enableLogic]);
  // toggleAnimation fue eliminado
  
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      if (isEditing) {
        saveChanges();
      } else {
        startEditing();
      }
    } else if (e.key === 'Escape' && isEditing) {
      e.preventDefault();
      cancelEditing();
    }
  }, [isEditing, saveChanges, startEditing, cancelEditing]);
  
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (!selected) return;
      if (e.key === 'e' && e.ctrlKey) {
        e.preventDefault();
        startEditing();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [selected, startEditing, cancelEditing, isEditing]);

  return (
    <div 
      ref={nodeRef} 
      className={nodeClasses} 
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleNodeContextMenu}
      tabIndex={0} 
      aria-label={`Nodo de decisión: ${question}`}
    >
      {/* Handle de entrada (Target) */}
      <Handle
        type="target"
        position={Position.Top}
        className="decision-node__handle decision-node__handle--target"
      />

  <Suspense fallback={<div className="decision-node-loading">Cargando...</div>}>
        <DecisionNodeHeader 
          title={question} 
          isEditing={isEditing} 
          isUltraPerformanceMode={isUltraPerformanceMode} 
          onStartEdit={startEditing}
        />
      </Suspense>
      
      <div className="decision-node__content">
        {isEditing && !isUltraPerformanceMode ? (
          <Suspense fallback={<div>Cargando editor...</div>}>
            <DecisionNodeQuestion 
              question={question} 
              isEditing={isEditing} 
              onQuestionChange={handleQuestionChange} 
              onSave={saveChanges}
              onCancel={cancelEditing}
              onStartEditing={startEditing} 
              isSaving={isSaving}
              isUltraPerformanceMode={isUltraPerformanceMode}
            />
            <DecisionNodeConditions
              conditions={currentConditions}
              onAddCondition={handleAddCondition}
              onConditionChange={handleConditionChange}
              onDeleteCondition={handleDeleteCondition}
              onMoveCondition={handleMoveCondition}
              isUltraPerformanceMode={isUltraPerformanceMode}
              maxConditions={MAX_CONDITIONS}
              activeConditionId={activeConditionId} 
              setActiveConditionId={setActiveConditionId} 
            />
          </Suspense>
        ) : (
          <div className="decision-node__question-preview" onClick={startEditing} role="button" tabIndex={0} aria-label="Editar pregunta">
            {question || 'Haz clic para editar la pregunta...'}
          </div>
        )}
        {/* Las opciones solo se muestran si NO se está editando */}
        {!isEditing && (
          <Suspense fallback={<div>Cargando opciones...</div>}>
            <DecisionNodeOptions
            enableMarkdown={enableMarkdown} // De nodeData
            onToggleMarkdown={handleToggleMarkdown}
            enableVariables={enableVariables} // De nodeData
            onToggleVariables={handleToggleVariables}
            enableLogic={enableLogic} // De nodeData
            onToggleLogic={handleToggleLogic}
              isUltraPerformanceMode={isUltraPerformanceMode} 
            />
          </Suspense>
        )}
      </div> {/* Cierre de decision-node__content */}

      {/* Handles de salida para cada condición */}
      <Suspense fallback={<div>Cargando conectores...</div>}>
        {/* Los handles de salida se renderizan basados en las condiciones */}
        {/* Asumimos que DecisionNodeHandles toma 'conditions', 'isConnectable', 'nodeId' y 'isUltraMode' */}
        <DecisionNodeHandles 
          nodeId={id}
          outputs={[...currentConditions]} 
          isConnectable={isConnectable} 
          isUltraPerformanceMode={isUltraPerformanceMode}
          data-tooltip-base-id={`tooltip-${id}-condition`}
          // TODO: DecisionNodeHandles internamente debería añadir tooltips a cada handle de salida
        />
      </Suspense>
      

    </div>
  );
};

DecisionNode.displayName = 'DecisionNode';

DecisionNode.propTypes = {
  id: PropTypes.string.isRequired,
  selected: PropTypes.bool,
  isConnectable: PropTypes.bool
};

export default React.memo(DecisionNode);
