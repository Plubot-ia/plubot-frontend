/**
 * @file DecisionNode.jsx
 * @description Componente para el nodo de decisión en el editor de flujos
 * @version 2.0.0 - Refactorizado para integración directa con Zustand
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Position, Handle } from 'reactflow';
import { debounce } from 'lodash';
import ContextMenu from "../../ui/context-menu";
import './DecisionNode.css';
import useFlowStore from '@/stores/useFlowStore';

// Carga diferida de componentes para mejorar el rendimiento inicial
const DecisionNodeHeader = React.lazy(() => import('./components/DecisionNodeHeader'));
const DecisionNodeQuestion = React.lazy(() => import('./components/DecisionNodeQuestion'));
const DecisionNodeConditions = React.lazy(() => import('./components/DecisionNodeConditions'));
const DecisionNodeOptions = React.lazy(() => import('./components/DecisionNodeOptions'));

// Número máximo de condiciones permitidas
const MAX_CONDITIONS = 8;

// Validación simple de pregunta
const isValidQuestion = (question) => {
  return question && question.trim().length > 0 && question.trim().length <= 500;
};

/**
 * Componente DecisionNodeHandle - Maneja los handles de conexión
 */
const DecisionNodeHandle = React.memo(({ 
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
    width: '16px',
    height: '16px',
    border: isUltraPerformanceMode ? '1px solid white' : '2px solid white',
    boxShadow: isUltraPerformanceMode 
      ? '0 1px 2px rgba(0, 0, 0, 0.1)' 
      : '0 0 0 2px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.1)',
    background: handleColor || '#3b82f6',
    transition: isUltraPerformanceMode ? 'none' : 'all 0.2s cubic-bezier(0.25, 1, 0.5, 1)',
    ...style
  };
  
  // Manejadores de eventos para efectos visuales
  const handleMouseEnter = useCallback((e) => {
    if (e.target && !isUltraPerformanceMode) {
      e.target.style.transform = 'scale(1.15) translateZ(0)';
      e.target.style.boxShadow = `0 0 8px ${handleColor || '#3b82f6'}`;
      e.target.style.filter = 'brightness(1.2)';
    }
  }, [isUltraPerformanceMode, handleColor]);
  
  const handleMouseLeave = useCallback((e) => {
    if (e.target) {
      e.target.style.transform = '';
      e.target.style.filter = '';
      e.target.style.boxShadow = '0 0 0 2px rgba(0, 0, 0, 0.15), 0 4px 6px rgba(0, 0, 0, 0.1)';
    }
  }, []);
  
  return (
    <Handle
      type={type}
      position={positionObj}
      id={handleId}
      isConnectable={isConnectable && !isEditing}
      className={`decision-node__handle decision-node__handle--${type} ${isUltraPerformanceMode ? 'ultra-performance' : ''}`}
      style={baseStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...rest}
    />
  );
});

DecisionNodeHandle.displayName = 'DecisionNodeHandle';

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
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [activeConditionId, setActiveConditionId] = useState(null);
  
  // Referencias
  const nodeRef = useRef(null);
  const prevConditionsRef = useRef([]);
  
  // Selectores de Zustand - solo obtenemos los datos que necesitamos
  const nodeData = useFlowStore(state => {
    const node = state.nodes.find(n => n.id === id);
    return node?.data || {
      question: '¿Cuál es tu pregunta?',
      conditions: [{ id: 'default-yes', text: 'Sí' }, { id: 'default-no', text: 'No' }],
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
  
  // Extraer datos relevantes del nodo
  const {
    question,
    conditions = [],
    enableMarkdown = false,
    enableVariables = false,
    enableLogic = false,
    enableAnimation = true,
    isUltraPerformanceMode = false
  } = nodeData;
  
  // Construir clases para el nodo
  const nodeClasses = useMemo(() => {
    const classes = ['decision-node'];
    
    if (selected) classes.push('selected');
    if (isEditing) classes.push('editing');
    if (isUltraPerformanceMode) classes.push('ultra-performance');
    
    return classes.join(' ');
  }, [selected, isEditing, isUltraPerformanceMode]);
  
  // Efecto para manejar la actualización de nodos de opción cuando las condiciones cambian
  useEffect(() => {
    if (JSON.stringify(prevConditionsRef.current) !== JSON.stringify(conditions)) {
      generateOptionNodes(id);
      prevConditionsRef.current = [...conditions];
    }
  }, [conditions, id, generateOptionNodes]);
  
  // Guardar cambios (para cuando se termina la edición)
  const saveChanges = useCallback(() => {
    setIsSaving(true);
    // No es necesario hacer nada especial aquí ya que todas las modificaciones
    // se hacen directamente en el store a través de las acciones
    setTimeout(() => {
      setIsEditing(false);
      setIsSaving(false);
    }, 300);
  }, []);
  
  // Cancelar edición
  const cancelEditing = useCallback(() => {
    setIsEditing(false);
  }, []);
  
  // Iniciar edición
  const startEditing = useCallback(() => {
    if (!isUltraPerformanceMode && !isEditing) {
      setIsEditing(true);
    }
  }, [isUltraPerformanceMode, isEditing]);
  
  // Manejar doble clic para editar
  const handleDoubleClick = useCallback((e) => {
    if (!isUltraPerformanceMode) {
      e.stopPropagation();
      startEditing();
    }
  }, [startEditing, isUltraPerformanceMode]);
  
  // Manejar clic derecho para mostrar menú contextual
  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    if (!isUltraPerformanceMode) {
      setContextMenuPosition({ x: e.clientX, y: e.clientY });
      setShowContextMenu(true);
    }
  }, [isUltraPerformanceMode]);
  
  // Cerrar menú contextual
  const closeContextMenu = useCallback(() => {
    setShowContextMenu(false);
  }, []);
  
  // Manejar cambios en la pregunta
  const handleQuestionChange = useCallback((newQuestionText) => {
    if (isValidQuestion(newQuestionText)) {
      updateDecisionNodeQuestion(id, newQuestionText);
    } else {
      console.warn('Pregunta no válida:', newQuestionText);
    }
  }, [id, updateDecisionNodeQuestion]);
  
  // Añadir condición
  const handleAddCondition = useCallback((newConditionText) => {
    if (conditions.length < MAX_CONDITIONS) {
      addDecisionNodeCondition(id, newConditionText);
    } else {
      console.warn(`No se pueden añadir más de ${MAX_CONDITIONS} condiciones.`);
    }
  }, [id, addDecisionNodeCondition, conditions.length]);
  
  // Editar condición
  const handleConditionChange = useCallback((conditionId, newText) => {
    updateDecisionNodeConditionText(id, conditionId, newText);
  }, [id, updateDecisionNodeConditionText]);
  
  // Eliminar condición
  const handleDeleteCondition = useCallback((conditionIdToDelete) => {
    deleteDecisionNodeCondition(id, conditionIdToDelete);
  }, [id, deleteDecisionNodeCondition]);
  
  // Mover condición (reordenar)
  const handleMoveCondition = useCallback((conditionId, direction) => {
    if (direction === 'up' || direction === 'down') {
      moveDecisionNodeCondition(id, conditionId, direction);
    } else {
      console.warn(`handleMoveCondition llamado con dirección inválida: ${direction}. Se espera 'up' o 'down'.`);
    }
  }, [id, moveDecisionNodeCondition]);
  
  // Alternar opciones avanzadas
  const toggleMarkdown = useCallback(() => toggleDecisionNodeFeature(id, 'enableMarkdown', !enableMarkdown), [id, toggleDecisionNodeFeature, enableMarkdown]);
  const toggleVariables = useCallback(() => toggleDecisionNodeFeature(id, 'enableVariables', !enableVariables), [id, toggleDecisionNodeFeature, enableVariables]);
  const toggleLogic = useCallback(() => toggleDecisionNodeFeature(id, 'enableLogic', !enableLogic), [id, toggleDecisionNodeFeature, enableLogic]);
  const toggleAnimation = useCallback(() => toggleDecisionNodeFeature(id, 'enableAnimation', !enableAnimation), [id, toggleDecisionNodeFeature, enableAnimation]);
  
  // Manejar teclas para accesibilidad
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
  
  // Efecto para manejar atajos de teclado globales cuando el nodo está seleccionado
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (!selected) return;
      
      // Ctrl+E para editar
      if (e.key === 'e' && e.ctrlKey) {
        e.preventDefault();
        startEditing();
      }
    };
    
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [selected, startEditing]);
  
  // Renderizar opciones del menú contextual
  const contextMenuOptions = useMemo(() => [
    {
      label: 'Editar',
      onClick: startEditing,
      icon: 'edit',
    },
    {
      label: 'Duplicar',
      onClick: () => {
        duplicateDecisionNode(id);
      },
      icon: 'copy',
    },
    {
      label: 'Eliminar',
      onClick: () => {
        setNodes(nodes => nodes.filter(node => node.id !== id));
      },
      icon: 'trash',
      danger: true,
    },
  ], [id, startEditing, duplicateDecisionNode, setNodes]);
  
  return (
    <div
      ref={nodeRef}
      className={nodeClasses}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Nodo de decisión: ${question}`}
      data-testid={`decision-node-${id}`}
    >
      {/* Handle de entrada (target) en la parte superior central */}
      <DecisionNodeHandle
        type="target"
        position={Position.Top}
        id="target"
        isConnectable={isConnectable}
        isEditing={isEditing}
        isUltraPerformanceMode={isUltraPerformanceMode}
        style={{
          top: '-12px',
          left: '50%',
          transform: 'translateX(-50%)'
        }}
      />
      
      {/* Cabecera del nodo */}
      <React.Suspense fallback={<div className="decision-node__loading">Cargando...</div>}>
        <DecisionNodeHeader
          title="Decisión"
          isUltraPerformanceMode={isUltraPerformanceMode}
        />
      </React.Suspense>
      
      <div className="decision-node__content">
        {/* Editor de pregunta */}
        <React.Suspense fallback={<div className="decision-node__loading">Cargando editor...</div>}>
          <DecisionNodeQuestion
            question={question}
            onQuestionChange={handleQuestionChange}
            isEditing={isEditing}
            onStartEditing={startEditing}
            onSave={saveChanges}
            onCancel={cancelEditing}
            isSaving={isSaving}
            enableMarkdown={enableMarkdown}
            isUltraPerformanceMode={isUltraPerformanceMode}
          />
        </React.Suspense>
        
        {/* Gestor de condiciones */}
        <React.Suspense fallback={<div className="decision-node__loading">Cargando condiciones...</div>}>
          <DecisionNodeConditions
            conditions={conditions}
            onAddCondition={handleAddCondition}
            onConditionChange={handleConditionChange}
            onDeleteCondition={handleDeleteCondition}
            onMoveCondition={handleMoveCondition}
            isUltraPerformanceMode={isUltraPerformanceMode}
            activeConditionId={activeConditionId}
            setActiveConditionId={setActiveConditionId}
            isEditing={isEditing}
          />
        </React.Suspense>
        
        {/* Opciones avanzadas */}
        {isEditing && (
          <React.Suspense fallback={<div className="decision-node__loading">Cargando opciones...</div>}>
            <DecisionNodeOptions
              isUltraPerformanceMode={isUltraPerformanceMode}
              onToggleMarkdown={toggleMarkdown}
              enableMarkdown={enableMarkdown}
              onToggleVariables={toggleVariables}
              enableVariables={enableVariables}
              onToggleLogic={toggleLogic}
              enableLogic={enableLogic}
              onToggleAnimation={toggleAnimation}
              enableAnimation={enableAnimation}
            />
          </React.Suspense>
        )}
      </div>
      
      {/* Handles de salida para cada condición */}
      <div className="decision-node__handles">
        <div className="decision-node__handle-wrapper">
          {conditions.map((output, index) => {
            const totalHandles = conditions.length;
            
            // Calcular posición con mayor separación entre handles
            // Limitamos el espacio utilizado al 70% del ancho para dar más margen en los extremos
            const availableWidth = 70;
            const spacing = availableWidth / (Math.max(totalHandles, 3));
            const startOffset = (100 - availableWidth) / 2;
            const position = startOffset + (spacing * index);
            
            // Determinar color basado en el tipo de condición
            let handleColor;
            const normalized = output.text.toLowerCase();
            if (normalized === 'sí' || normalized === 'si') {
              handleColor = '#22c55e'; // Verde para "sí"
            } else if (normalized === 'no') {
              handleColor = '#ef4444'; // Rojo para "no"
            } else {
              // Colores para otras condiciones - variedad de colores
              const otherColors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4', '#10b981'];
              handleColor = otherColors[index % otherColors.length];
            }
            
            return (
              <div key={`handle-${output.id}-${index}`} className="decision-node__handle-container">
                <DecisionNodeHandle
                  type="source"
                  position={Position.Bottom}
                  id={`output-${index}`}
                  isConnectable={isConnectable}
                  isEditing={isEditing}
                  isUltraPerformanceMode={isUltraPerformanceMode}
                  handleColor={handleColor}
                  style={{
                    left: `${position}%`,
                    bottom: '-10px'
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Menú contextual */}
      {showContextMenu && (
        <React.Suspense fallback={<div />}>
          <ContextMenu
            items={contextMenuOptions}
            position={contextMenuPosition}
            onClose={closeContextMenu}
          />
        </React.Suspense>
      )}
    </div>
  );
};

DecisionNode.propTypes = {
  id: PropTypes.string.isRequired,
  selected: PropTypes.bool,
  isConnectable: PropTypes.bool
};

DecisionNodeHandle.propTypes = {
  id: PropTypes.string.isRequired,
  position: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.string  // Permitimos string para posiciones como 'top', 'right', etc.
  ]).isRequired,
  isConnectable: PropTypes.bool,
  isEditing: PropTypes.bool,
  isUltraPerformanceMode: PropTypes.bool,
  handleColor: PropTypes.string,
  style: PropTypes.object,
};

export default DecisionNode;
