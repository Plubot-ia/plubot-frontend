/**
 * @file DecisionNode.jsx
 * @description Componente para el nodo de decisión en el editor de flujos
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useReactFlow, Handle, Position } from 'reactflow';
import { produce } from 'immer';
import { debounce } from 'lodash';
import PropTypes from 'prop-types';
import './DecisionNode.css';
import { NODE_CONFIG, DISPLAY_MODES, isValidQuestion, generateNodeId } from './DecisionNode.types';

// Importar subcomponentes con lazy loading para mejorar el rendimiento
const DecisionNodeHeader = React.lazy(() => import('./components/DecisionNodeHeader.jsx'));
const DecisionNodeQuestion = React.lazy(() => import('./components/DecisionNodeQuestion.jsx'));
const DecisionNodeConditions = React.lazy(() => import('./components/DecisionNodeConditions.jsx'));
const DecisionNodeHandles = React.lazy(() => import('./components/DecisionNodeHandles.jsx'));
const DecisionNodeOptions = React.lazy(() => import('./components/DecisionNodeOptions.jsx'));

// Importaciones dinámicas para componentes pesados
const ContextMenu = React.lazy(() => import('../../ui/context-menu'));
const ReactMarkdown = React.lazy(() => import('../../../../lib/simplified-markdown'));

/**
 * Componente para el nodo de decisión en el editor de flujos
 * @param {Object} props - Propiedades del componente
 * @returns {JSX.Element} - Componente DecisionNode
 */
const DecisionNode = ({ 
  id, 
  data = {
    question: '¿Cuál es tu pregunta?',
    outputs: ['Sí', 'No'],
    variables: [],
    label: 'Decisión',
    enableMarkdown: false,
    enableVariables: false,
    enableLogic: false,
    enableAnimation: true,
    isUltraPerformanceMode: false
  }, 
  selected = false, 
  isConnectable = true 
}) => {
  const { setNodes, getNode, getNodes } = useReactFlow();
  const nodeRef = useRef(null);
  
  // Estado del nodo
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [question, setQuestion] = useState(data.question || NODE_CONFIG.DEFAULT_QUESTION);
  const [conditions, setConditions] = useState(data.outputs || NODE_CONFIG.DEFAULT_OUTPUTS);
  const [activeConditionIndex, setActiveConditionIndex] = useState(null);
  
  // Estado para opciones avanzadas
  const [enableMarkdown, setEnableMarkdown] = useState(data.enableMarkdown || false);
  const [enableVariables, setEnableVariables] = useState(data.enableVariables || false);
  const [enableLogic, setEnableLogic] = useState(data.enableLogic || false);
  const [enableAnimation, setEnableAnimation] = useState(data.enableAnimation !== false);
  
  // Estado para menú contextual
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  
  // Determinar si está en modo ultra rendimiento
  const isUltraPerformanceMode = useMemo(() => 
    data.isUltraPerformanceMode || false, 
  [data.isUltraPerformanceMode]);
  
  // Memoizar las clases CSS del nodo
  const nodeClasses = useMemo(() => {
    const classes = ['decision-node'];
    if (selected) classes.push('decision-node--selected');
    if (isEditing) classes.push('decision-node--editing');
    if (isUltraPerformanceMode) classes.push('decision-node--ultra');
    if (enableAnimation && !isUltraPerformanceMode) classes.push('decision-node--animated');
    return classes.join(' ');
  }, [selected, isEditing, isUltraPerformanceMode, enableAnimation]);
  
  // Memoizar el estilo del nodo con optimizaciones para modo ultra rendimiento
  const nodeStyle = useMemo(() => {
    // En modo ultra rendimiento, usamos estilos más simples y sin efectos costosos
    if (data.isUltraPerformanceMode) {
      return {
        background: '#60a5fa', // Color sólido en lugar de degradado
        borderColor: 'rgba(30, 58, 138, 0.3)',
        color: '#1e3a8a',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', // Sombra más simple
        backdropFilter: 'none', // Sin efecto de blur
        borderWidth: '1px',
        borderStyle: 'solid',
        transition: 'none', // Sin transiciones
      };
    }
    
    // Modo normal con todos los efectos visuales
    return {
      background: 'linear-gradient(145deg, #bfdbfe, #3b82f6)', // Degradado de azul claro a azul medio
      borderColor: 'rgba(30, 58, 138, 0.3)', // Borde azul transparente
      color: '#1e3a8a', // Texto azul oscuro para mejor contraste con fondo claro
      boxShadow: '0 8px 24px rgba(59, 130, 246, 0.25), 0 4px 8px rgba(59, 130, 246, 0.15)',
      backdropFilter: 'blur(8px)',
      borderWidth: '1px',
      borderStyle: 'solid',
    };
  }, [data.isUltraPerformanceMode]);
  
  // Memoizar metadatos del nodo
  const nodeMetadata = useMemo(() => ({
    date: data.lastUpdated ? new Date(data.lastUpdated).toLocaleDateString() : null,
    owner: data.owner || null,
  }), [data.lastUpdated, data.owner]);
  
  // Guardar cambios en el nodo
  const saveChanges = useCallback(() => {
    if (!isEditing) return;
    
    setIsSaving(true);
    
    // Usar setTimeout para simular una operación asíncrona
    // En un caso real, aquí iría una llamada a la API
    setTimeout(() => {
      setNodes(nodes => 
        produce(nodes, draft => {
          const node = draft.find(n => n.id === id);
          if (node) {
            node.data = {
              ...node.data,
              question,
              outputs: conditions,
              enableMarkdown,
              enableVariables,
              enableLogic,
              enableAnimation,
              lastUpdated: new Date().toISOString(),
            };
          }
        })
      );
      
      // Crear o actualizar nodos de opción asociados
      updateOptionNodes();
      
      setIsEditing(false);
      setIsSaving(false);
    }, 300); // Simular un pequeño retraso para mostrar el estado de guardado
  }, [id, isEditing, question, conditions, setNodes, enableMarkdown, enableVariables, enableLogic, enableAnimation]);
  
  // Actualizar nodos de opción
  const updateOptionNodes = useCallback(() => {
    setNodes(nodes => {
      // Encontrar nodos de opción existentes conectados a este nodo
      const existingOptionNodes = nodes.filter(node => 
        node.type === 'option' && 
        node.data && 
        node.data.parentId === id
      );
      
      // Crear una copia de los nodos
      let updatedNodes = [...nodes];
      
      // Obtener la posición del nodo actual
      const parentNode = nodes.find(node => node.id === id);
      if (!parentNode) return nodes;
      
      const parentPosition = parentNode.position;
      const parentWidth = parentNode.width || NODE_CONFIG.MIN_WIDTH;
      
      // Actualizar o crear nodos de opción para cada condición
      conditions.forEach((condition, index) => {
        // Calcular posición para el nodo de opción
        const angle = (index / conditions.length) * Math.PI + Math.PI / 2;
        const distance = 150;
        const xOffset = Math.cos(angle) * distance;
        const yOffset = Math.sin(angle) * distance;
        
        const optionPosition = {
          x: parentPosition.x + parentWidth / 2 + xOffset,
          y: parentPosition.y + 120 + yOffset,
        };
        
        // Buscar si ya existe un nodo de opción para esta condición
        const existingNode = existingOptionNodes.find(
          node => node.data.label.toLowerCase() === condition.toLowerCase()
        );
        
        if (existingNode) {
          // Actualizar nodo existente
          updatedNodes = updatedNodes.map(node => 
            node.id === existingNode.id
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    label: condition,
                    parentId: id,
                    conditionIndex: index,
                  },
                  position: optionPosition,
                }
              : node
          );
        } else {
          // Crear nuevo nodo de opción
          const optionNodeId = generateNodeId('option');
          
          const newOptionNode = {
            id: optionNodeId,
            type: 'option',
            position: optionPosition,
            data: {
              label: condition,
              parentId: id,
              conditionIndex: index,
              isUltraPerformanceMode,
            },
            draggable: true,
            selectable: true,
            connectable: true,
          };
          
          updatedNodes.push(newOptionNode);
        }
      });
      
      // Eliminar nodos de opción que ya no corresponden a ninguna condición
      updatedNodes = updatedNodes.filter(node => {
        if (node.type === 'option' && node.data && node.data.parentId === id) {
          const conditionExists = conditions.some(
            condition => condition.toLowerCase() === node.data.label.toLowerCase()
          );
          return conditionExists;
        }
        return true;
      });
      
      return updatedNodes;
    });
  }, [id, conditions, isUltraPerformanceMode, setNodes]);
  
  // Cancelar edición
  const cancelEditing = useCallback(() => {
    setQuestion(data.question || NODE_CONFIG.DEFAULT_QUESTION);
    setConditions(data.outputs || NODE_CONFIG.DEFAULT_OUTPUTS);
    setEnableMarkdown(data.enableMarkdown || false);
    setEnableVariables(data.enableVariables || false);
    setEnableLogic(data.enableLogic || false);
    setEnableAnimation(data.enableAnimation !== false);
    setIsEditing(false);
  }, [data]);
  
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
  const handleQuestionChange = useCallback((newQuestion) => {
    setQuestion(newQuestion);
  }, []);
  
  // Añadir condición
  const addCondition = useCallback((newCondition) => {
    if (conditions.length < NODE_CONFIG.MAX_CONDITIONS) {
      setConditions(prev => [...prev, newCondition]);
    }
  }, [conditions]);
  
  // Editar condición
  const editCondition = useCallback((index, newValue) => {
    setConditions(prev => 
      prev.map((condition, i) => i === index ? newValue : condition)
    );
  }, []);
  
  // Eliminar condición
  const deleteCondition = useCallback((index) => {
    setConditions(prev => prev.filter((_, i) => i !== index));
  }, []);
  
  // Mover condición (reordenar)
  const moveCondition = useCallback((fromIndex, toIndex) => {
    if (
      toIndex >= 0 && 
      toIndex < conditions.length && 
      fromIndex !== toIndex
    ) {
      setConditions(prev => {
        const newConditions = [...prev];
        const [movedItem] = newConditions.splice(fromIndex, 1);
        newConditions.splice(toIndex, 0, movedItem);
        return newConditions;
      });
    }
  }, [conditions]);
  
  // Alternar opciones avanzadas
  const toggleMarkdown = useCallback(() => {
    setEnableMarkdown(prev => !prev);
  }, []);
  
  const toggleVariables = useCallback(() => {
    setEnableVariables(prev => !prev);
  }, []);
  
  const toggleLogic = useCallback(() => {
    setEnableLogic(prev => !prev);
  }, []);
  
  const toggleAnimation = useCallback(() => {
    setEnableAnimation(prev => !prev);
  }, []);
  
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
        // Implementación de duplicado
        const node = getNode(id);
        if (node) {
          const newNode = {
            ...node,
            id: `${id}_copy`,
            position: {
              x: node.position.x + 20,
              y: node.position.y + 20,
            },
          };
          setNodes(nodes => [...nodes, newNode]);
        }
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
  ], [id, startEditing, getNode, setNodes]);
  
  return (
    <div
      ref={nodeRef}
      className={nodeClasses}
      style={nodeStyle}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Nodo de decisión: ${question}`}
      data-testid={`decision-node-${id}`}
    >
      {/* Handle de entrada (target) en la parte superior central */}
      <Handle
        type="target"
        position={Position.Top}
        id="target"
        isConnectable={isConnectable && !isEditing}
        className={`decision-node__handle decision-node__handle--target ${isUltraPerformanceMode ? 'ultra-performance' : ''}`}
        style={{
          top: '-12px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
          width: '16px',
          height: '16px',
          border: isUltraPerformanceMode ? '1px solid white' : '2px solid white',
          boxShadow: isUltraPerformanceMode 
            ? '0 1px 2px rgba(0, 0, 0, 0.1)' 
            : '0 0 0 2px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.1)',
          background: '#3b82f6', // Azul vibrante
          transition: isUltraPerformanceMode ? 'none' : 'all 0.2s cubic-bezier(0.25, 1, 0.5, 1)'
        }}
      />
      {/* Cabecera del nodo */}
      <React.Suspense fallback={<div className="decision-node__loading">Cargando...</div>}>
        <DecisionNodeHeader
          title="Decisión"
          iconType="default"
          isUltraPerformanceMode={isUltraPerformanceMode}
          isCollapsed={false}
          metadata={nodeMetadata}
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
            onAddCondition={addCondition}
            onEditCondition={editCondition}
            onDeleteCondition={deleteCondition}
            onMoveCondition={moveCondition}
            isUltraPerformanceMode={isUltraPerformanceMode}
            activeConditionIndex={activeConditionIndex}
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
      
      {/* Handles de entrada y salida */}
      <div className="decision-node__handles">
        {/* El handle de entrada ya está definido en la parte superior del nodo, no es necesario duplicarlo aquí */}
        
        <div className="decision-node__handle-wrapper">
          {/* Handles de salida con mayor separación */}
          {conditions.map((output, index) => {
            const totalHandles = conditions.length;
            
            // Calcular posición con mayor separación entre handles
            // Limitamos el espacio utilizado al 70% del ancho para dar aún más margen en los extremos
            const availableWidth = 70;
            const spacing = availableWidth / (Math.max(totalHandles, 3));
            const startOffset = (100 - availableWidth) / 2;
            const position = startOffset + (spacing * index);
            
            // Determinar color basado en el tipo de condición
            let handleColor;
            const normalized = output.toLowerCase();
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
              <div key={`handle-${index}`} className="decision-node__handle-container">
                <Handle
                  type="source"
                  position={Position.Bottom}
                  id={`output-${index}`}
                  isConnectable={isConnectable && !isEditing}
                  className="decision-node__handle decision-node__handle--source"
                  style={{
                    left: `${position}%`,
                    backgroundColor: handleColor,
                    bottom: '-10px', // Alejado del margen inferior para mejor visibilidad
                    zIndex: 100,
                    width: '16px',
                    height: '16px',
                    border: isUltraPerformanceMode ? '2px solid white' : '3px solid white',
                    boxShadow: '0 0 0 2px rgba(0, 0, 0, 0.15), 0 4px 6px rgba(0, 0, 0, 0.1)',
                    transition: isUltraPerformanceMode ? 'none' : 'all 0.2s cubic-bezier(0.25, 1, 0.5, 1)'
                  }}
                  onMouseEnter={(e) => {
                    // Efecto al pasar el mouse (solo si no está en modo ultra rendimiento)
                    if (e.target && !isUltraPerformanceMode) {
                      e.target.style.transform = 'scale(1.15) translateZ(0)';
                      e.target.style.boxShadow = `0 0 8px ${handleColor}`;
                      e.target.style.filter = 'brightness(1.2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    // Restaurar al salir
                    if (e.target) {
                      e.target.style.transform = '';
                      e.target.style.filter = '';
                      e.target.style.boxShadow = '0 0 0 2px rgba(0, 0, 0, 0.15), 0 4px 6px rgba(0, 0, 0, 0.1)';
                    }
                  }}
                />
                {/* Se ha eliminado la etiqueta de texto debajo del handle */}
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
  data: PropTypes.shape({
    question: PropTypes.string,
    outputs: PropTypes.arrayOf(PropTypes.string),
    variables: PropTypes.arrayOf(PropTypes.string),
    label: PropTypes.string,
    enableMarkdown: PropTypes.bool,
    enableVariables: PropTypes.bool,
    enableLogic: PropTypes.bool,
    enableAnimation: PropTypes.bool,
    isUltraPerformanceMode: PropTypes.bool,
    lastUpdated: PropTypes.string,
    owner: PropTypes.string,
  }),
  selected: PropTypes.bool,
  isConnectable: PropTypes.bool,
};

export default React.memo(DecisionNode);
