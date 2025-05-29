/**
 * @file DecisionNodeConditions.jsx
 * @description Componente para gestionar las condiciones del nodo de decisión
 */

import React, { memo, useState, useRef, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Handle, Position } from 'reactflow';
import { 
  X, 
  Check, 
  Circle, 
  Plus, 
  Pencil, 
  Move,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import Tooltip from '../../../ui/ToolTip';
import { NODE_CONFIG, CONDITION_TYPES, getConditionType } from '../DecisionNode.types';

/**
 * Obtiene el color del handle basado en el tipo de condición
 * @param {string} condition - Texto de la condición
 * @param {number} index - Índice de la condición para colores alternativos
 * @returns {string} - Color en formato hexadecimal
 */
const getConditionColor = (conditionText, index = 0) => {
  const normalized = conditionText.toLowerCase();
  if (normalized === 'sí' || normalized === 'si') {
    return '#22c55e'; // Verde para "sí"
  } else if (normalized === 'no') {
    return '#ef4444'; // Rojo para "no"
  } else {
    // Colores para otras condiciones - variedad de colores
    const otherColors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4', '#10b981'];
    return otherColors[index % otherColors.length];
  }
};

/**
 * Componente para renderizar una condición individual
 * @param {Object} props - Propiedades del componente
 * @param {string} props.condition - Texto de la condición
 * @param {number} props.index - Índice de la condición
 * @param {Function} props.onEdit - Función para editar la condición
 * @param {Function} props.onDelete - Función para eliminar la condición
 * @param {Function} props.onMove - Función para mover la condición (reordenar)
 * @param {boolean} props.isUltraPerformanceMode - Indica si está en modo ultra rendimiento
 * @param {boolean} props.isActive - Indica si la condición está activa
 * @returns {JSX.Element} - Componente de condición
 */
const ConditionItem = memo(({ 
  condition, // Ahora es { id: string, text: string }
  index, // Sigue siendo útil para la lógica de movimiento visual (arriba/abajo)
  onEdit, // Espera (conditionId)
  onDelete, // Espera (conditionId)
  onMove, // Espera (conditionId, targetIndex)
  isUltraPerformanceMode,
  isActive = false
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Determinar si la condición es verdadera o falsa para aplicar estilos
  const conditionType = getConditionType(condition.text);
  const conditionTypeClass = `decision-node__condition--${conditionType}`;
  
  // Verificar si es una condición especial
  const isTrue = conditionType === CONDITION_TYPES.TRUE;
  const isFalse = conditionType === CONDITION_TYPES.FALSE;
  
  // Manejar eliminación con confirmación
  const handleDelete = useCallback(() => {
    if (showDeleteConfirm) {
      onDelete(condition.id);
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
      // Auto-ocultar la confirmación después de 3 segundos
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  }, [showDeleteConfirm, onDelete, condition.id]);
  
  // Manejar movimiento de condición
  const handleMoveUp = useCallback(() => {
    onMove(condition.id, 'up');
  }, [onMove, condition.id]);
  
  const handleMoveDown = useCallback(() => {
    onMove(condition.id, 'down');
  }, [onMove, condition.id]);
  
  // Manejar teclas para accesibilidad
  const handleKeyDown = useCallback((e) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        onEdit(condition.id);
        break;
      case 'Delete':
        e.preventDefault();
        handleDelete();
        break;
      case 'ArrowUp':
        if (e.ctrlKey) {
          e.preventDefault();
          handleMoveUp();
        }
        break;
      case 'ArrowDown':
        if (e.ctrlKey) {
          e.preventDefault();
          handleMoveDown();
        }
        break;
      default:
        break;
    }
  }, [onEdit, condition.id, handleDelete, handleMoveUp, handleMoveDown]);
  
  return (
    <div 
      className={`decision-node__condition ${isUltraPerformanceMode ? 'decision-node__condition--ultra' : ''} ${conditionTypeClass} ${isActive ? 'decision-node__condition--active' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-index={index}
      data-condition-text={condition.text}
      data-condition-id={condition.id}
      tabIndex={0}
      role="button"
      aria-label={`Condición: ${condition.text}`}
      onKeyDown={handleKeyDown}
    >
      {/* Marca de color para la condición */}
      <div 
        className="decision-node__condition-color-mark"
        style={{
          backgroundColor: getConditionColor(condition.text, index),
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          marginRight: '8px',
          border: '1px solid white',
          boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.1)',
          flexShrink: 0
        }}
      />
      
      <span className="decision-node__condition-text">{condition.text}</span>
      
      {!isUltraPerformanceMode && (isHovered || window.matchMedia('(hover: none)').matches) && (
        <div className="decision-node__condition-actions">
          {!isUltraPerformanceMode && (
            <Tooltip content="Mover condición" position="top">
              <div 
                className="decision-node__condition-button decision-node__condition-button--move"
                aria-label={NODE_CONFIG.ARIA_LABELS.moveCondition}
                role="group"
              >
                <div className="decision-node__condition-button-inner">
                  <Move size={14} />
                  <div className="decision-node__condition-move-controls">
                    <div 
                      className="decision-node__condition-move-button decision-node__condition-move-button--up"
                      onClick={handleMoveUp}
                      role="button"
                      tabIndex={0}
                      style={{ cursor: index === 0 ? 'not-allowed' : 'pointer', opacity: index === 0 ? 0.5 : 1 }}
                      aria-disabled={index === 0}
                      aria-label="Mover arriba"
                    >
                      <ChevronUp size={12} />
                    </div>
                    <div 
                      className="decision-node__condition-move-button decision-node__condition-move-button--down"
                      onClick={handleMoveDown}
                      role="button"
                      tabIndex={0}
                      aria-label="Mover abajo"
                    >
                      <ChevronDown size={12} />
                    </div>
                  </div>
                </div>
              </div>
            </Tooltip>
          )}
          
          <Tooltip content="Editar condición" position="top">
            <button 
              className="decision-node__condition-button decision-node__condition-button--edit"
              onClick={() => onEdit(condition.id)}
              aria-label={NODE_CONFIG.ARIA_LABELS.editCondition}
              aria-keyshortcuts="Enter"
            >
              <Pencil size={14} />
            </button>
          </Tooltip>
          
          <Tooltip content={showDeleteConfirm ? "Confirmar eliminación" : "Eliminar condición"} position="top">
            <button 
              className={`decision-node__condition-button ${showDeleteConfirm ? 'decision-node__condition-button--confirm' : 'decision-node__condition-button--delete'}`}
              onClick={handleDelete}
              aria-label={NODE_CONFIG.ARIA_LABELS.deleteCondition}
            >
              <X size={14} />
            </button>
          </Tooltip>
        </div>
      )}
    </div>
  );
});

ConditionItem.displayName = 'ConditionItem';

ConditionItem.propTypes = {
  condition: PropTypes.shape({
    id: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
  }).isRequired,
  index: PropTypes.number.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onMove: PropTypes.func.isRequired,
  isUltraPerformanceMode: PropTypes.bool,
  isActive: PropTypes.bool
};

/**
 * Componente para gestionar las condiciones del nodo de decisión
 * @param {Object} props - Propiedades del componente
 * @param {Array<Object>} props.conditions - Lista de condiciones { id: string, text: string }
 * @param {Function} props.onAddCondition - Función para añadir condición
 * @param {Function} props.onConditionChange - Función para cambiar el texto de una condición
 * @param {Function} props.onDeleteCondition - Función para eliminar condición
 * @param {Function} props.onMoveCondition - Función para mover condición
 * @param {boolean} props.isUltraPerformanceMode - Indica si está en modo ultra rendimiento
 * @param {string|null} props.activeConditionId - ID de la condición activa
 * @param {Function} props.setActiveConditionId - Función para cambiar el ID de la condición activa
 * @param {boolean} props.isEditing - Indica si está en modo edición
 * @returns {JSX.Element} - Gestor de condiciones
 */
const DecisionNodeConditions = memo(({ 
  conditions, 
  onAddCondition, 
  onConditionChange, 
  onDeleteCondition, 
  onMoveCondition,
  isUltraPerformanceMode,
  activeConditionId,
  setActiveConditionId,
  isEditing
}) => {
  const [isAddingCondition, setIsAddingCondition] = useState(false);
  const [editingConditionId, setEditingConditionId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const conditionInputRef = useRef(null);
  
  // Enfocar el input al añadir o editar una condición
  useEffect(() => {
    let animationId;
    if ((isAddingCondition || editingConditionId !== null) && conditionInputRef.current) {
      animationId = requestAnimationFrame(() => {
        conditionInputRef.current.focus();
        conditionInputRef.current.select();
      });
    }
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [isAddingCondition, editingConditionId]);
  
  // Iniciar adición de condición
  const startAddingCondition = useCallback(() => {
    setIsAddingCondition(true);
    setEditingText('');
  }, []);
  
  // Añadir condición
  const addCondition = useCallback(() => {
    if (editingText.trim()) {
      onAddCondition(editingText.trim());
      setEditingText('');
    }
    setIsAddingCondition(false);
  }, [editingText, onAddCondition]);
  
  // Manejar cambios en el input de nueva condición
  const handleNewConditionChange = useCallback((e) => {
    setEditingText(e.target.value);
  }, []);
  
  // Guardar nueva condición al presionar Enter
  const handleNewConditionKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && editingText.trim()) {
      e.preventDefault();
      addCondition();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditingText('');
      setIsAddingCondition(false);
      setEditingConditionId(null);
    }
  }, [editingText, addCondition]);
  
  // Iniciar edición de una condición existente
  const handleStartEdit = useCallback((conditionId) => {
    if (isUltraPerformanceMode) return; // No editar en modo ultra
    const conditionToEdit = conditions.find(c => c.id === conditionId);
    setEditingConditionId(conditionId);
    setEditingText(conditionToEdit ? conditionToEdit.text : ''); // Derivar currentText
    setActiveConditionId(conditionId); // Notificar al padre cuál es la condición activa/editada
    
    // Enfocar el input después de que se renderice
    requestAnimationFrame(() => {
      if (conditionInputRef.current) {
        conditionInputRef.current.focus();
        conditionInputRef.current.select();
      }
    });
  }, [isUltraPerformanceMode, setActiveConditionId, conditions]);
  
  // Guardar condición editada
  const saveEditedCondition = useCallback(() => {
    if (editingConditionId !== null) {
      onConditionChange(editingConditionId, editingText);
      setEditingConditionId(null);
      setEditingText('');
      conditionInputRef.current?.blur(); // Quitar foco del input
    }
  }, [editingConditionId, editingText, onConditionChange]);
  
  // Manejar teclas al editar una condición
  const handleEditConditionKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && editingText.trim()) {
      e.preventDefault();
      saveEditedCondition();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditingText('');
      setEditingConditionId(null);
    }
  }, [editingText, saveEditedCondition]);
  
  return (
    <div className="decision-node__conditions">
      {/* Lista de condiciones */}
      <div className="decision-node__conditions-list">
        {conditions.map((condition, index) => (
          <ConditionItem
            key={condition.id}
            condition={condition}
            index={index}
            onEdit={handleStartEdit} // Pasa (conditionId, currentText)
            onDelete={() => onDeleteCondition(condition.id)} // Pasa (conditionId)
            onMove={(movedConditionId, targetVisualIndex) => onMoveCondition(movedConditionId, targetVisualIndex)} // Pasa (conditionId, targetIndex)
            isUltraPerformanceMode={isUltraPerformanceMode}
            isActive={condition.id === activeConditionId} // Asume que activeConditionId podría ser un ID o se resolverá
          />
        ))}
      </div>
      
      {/* Formulario para añadir/editar condición */}
      {isEditing && (
        <div className="decision-node__add-condition-container">
          {isAddingCondition || editingConditionId !== null ? (
            <div className="decision-node__condition-form">
              <input
                ref={conditionInputRef}
                type="text"
                className="decision-node__condition-input"
                  onMouseDown={(e) => e.stopPropagation()} // Evitar que el drag del nodo interfiera con la selección de texto
                value={editingText}
                onChange={handleNewConditionChange}
                onKeyDown={editingConditionId !== null ? handleEditConditionKeyDown : handleNewConditionKeyDown}
                placeholder="Escribe la condición..."
                aria-label="Texto de la condición"
              />
              <div className="decision-node__condition-form-actions">
                <button
                  onClick={() => {
                    setIsAddingCondition(false);
                    setEditingConditionId(null);
                    setEditingText('');
                  }}
                  className="decision-node__condition-button decision-node__condition-button--cancel"
                  aria-label={NODE_CONFIG.ARIA_LABELS.cancelEditing}
                >
                  <X size={14} />
                </button>
                <button
                  onClick={editingConditionId !== null ? saveEditedCondition : addCondition}
                  className="decision-node__condition-button decision-node__condition-button--save"
                  aria-label={NODE_CONFIG.ARIA_LABELS.saveChanges}
                  disabled={!editingText.trim()}
                >
                  <Check size={14} />
                </button>
              </div>
            </div>
          ) : (
            <Tooltip content="Añadir nueva condición (Ctrl+A)" position="top">
              <button
                onClick={startAddingCondition}
                className="decision-node__add-condition"
                aria-label={NODE_CONFIG.ARIA_LABELS.addCondition}
                aria-keyshortcuts="Ctrl+A"
              >
                <Plus size={14} />
                <span>Añadir condición</span>
              </button>
            </Tooltip>
          )}
        </div>
      )}
    </div>
  );
});

DecisionNodeConditions.displayName = 'DecisionNodeConditions';

DecisionNodeConditions.propTypes = {
  conditions: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
  })).isRequired,
  onAddCondition: PropTypes.func.isRequired,
  onConditionChange: PropTypes.func.isRequired,
  onDeleteCondition: PropTypes.func.isRequired,
  onMoveCondition: PropTypes.func.isRequired,
  isUltraPerformanceMode: PropTypes.bool,
  activeConditionId: PropTypes.string,
  setActiveConditionId: PropTypes.func.isRequired,
  isEditing: PropTypes.bool
};

export default DecisionNodeConditions;
