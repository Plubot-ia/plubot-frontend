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
const getConditionColor = (condition, index = 0) => {
  const normalized = condition.toLowerCase();
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
  condition, 
  index, 
  onEdit, 
  onDelete, 
  onMove,
  isUltraPerformanceMode,
  isActive = false
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Determinar si la condición es verdadera o falsa para aplicar estilos
  const conditionType = getConditionType(condition);
  const conditionTypeClass = `decision-node__condition--${conditionType}`;
  
  // Verificar si es una condición especial
  const isTrue = conditionType === CONDITION_TYPES.TRUE;
  const isFalse = conditionType === CONDITION_TYPES.FALSE;
  
  // Manejar eliminación con confirmación
  const handleDelete = useCallback(() => {
    if (showDeleteConfirm) {
      onDelete(index);
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
      // Auto-ocultar la confirmación después de 3 segundos
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  }, [showDeleteConfirm, onDelete, index]);
  
  // Manejar movimiento de condición
  const handleMoveUp = useCallback(() => {
    onMove(index, index - 1);
  }, [index, onMove]);
  
  const handleMoveDown = useCallback(() => {
    onMove(index, index + 1);
  }, [index, onMove]);
  
  // Manejar teclas para accesibilidad
  const handleKeyDown = useCallback((e) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        onEdit(index);
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
  }, [onEdit, index, handleDelete, handleMoveUp, handleMoveDown]);
  
  return (
    <div 
      className={`decision-node__condition ${isUltraPerformanceMode ? 'decision-node__condition--ultra' : ''} ${conditionTypeClass} ${isActive ? 'decision-node__condition--active' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-index={index}
      data-condition={condition}
      tabIndex={0}
      role="button"
      aria-label={`Condición: ${condition}`}
      onKeyDown={handleKeyDown}
    >
      {/* Marca de color para la condición */}
      <div 
        className="decision-node__condition-color-mark"
        style={{
          backgroundColor: getConditionColor(condition, index),
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          marginRight: '8px',
          border: '1px solid white',
          boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.1)',
          flexShrink: 0
        }}
      />
      
      <span className="decision-node__condition-text">{condition}</span>
      
      {!isUltraPerformanceMode && (isHovered || window.matchMedia('(hover: none)').matches) && (
        <div className="decision-node__condition-actions">
          {!isUltraPerformanceMode && (
            <Tooltip content="Mover condición" position="top">
              <button 
                className="decision-node__condition-button decision-node__condition-button--move"
                aria-label={`Mover condición ${condition}`}
                aria-keyshortcuts="Ctrl+ArrowUp Ctrl+ArrowDown"
              >
                <Move size={14} />
                <div className="decision-node__condition-move-buttons">
                  <button
                    onClick={() => handleMoveUp()}
                    className="decision-node__condition-move-button"
                    aria-label="Mover arriba"
                    disabled={index === 0}
                  >
                    <ChevronUp size={12} />
                  </button>
                  <button
                    onClick={() => handleMoveDown()}
                    className="decision-node__condition-move-button"
                    aria-label="Mover abajo"
                  >
                    <ChevronDown size={12} />
                  </button>
                </div>
              </button>
            </Tooltip>
          )}
          
          <Tooltip content="Editar condición" position="top">
            <button 
              className="decision-node__condition-button decision-node__condition-button--edit"
              onClick={() => onEdit(index)}
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
  condition: PropTypes.string.isRequired,
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
 * @param {Array<string>} props.conditions - Lista de condiciones
 * @param {Function} props.onAddCondition - Función para añadir condición
 * @param {Function} props.onEditCondition - Función para editar condición
 * @param {Function} props.onDeleteCondition - Función para eliminar condición
 * @param {Function} props.onMoveCondition - Función para mover condición
 * @param {boolean} props.isUltraPerformanceMode - Indica si está en modo ultra rendimiento
 * @param {number|null} props.activeConditionIndex - Índice de la condición activa
 * @param {boolean} props.isEditing - Indica si está en modo edición
 * @returns {JSX.Element} - Gestor de condiciones
 */
const DecisionNodeConditions = memo(({ 
  conditions, 
  onAddCondition, 
  onEditCondition, 
  onDeleteCondition, 
  onMoveCondition,
  isUltraPerformanceMode,
  activeConditionIndex,
  isEditing
}) => {
  const [isAddingCondition, setIsAddingCondition] = useState(false);
  const [editingConditionIndex, setEditingConditionIndex] = useState(null);
  const [newCondition, setNewCondition] = useState('');
  const conditionInputRef = useRef(null);
  
  // Enfocar el input al añadir o editar una condición
  useEffect(() => {
    let animationId;
    if ((isAddingCondition || editingConditionIndex !== null) && conditionInputRef.current) {
      animationId = requestAnimationFrame(() => {
        conditionInputRef.current.focus();
        conditionInputRef.current.select();
      });
    }
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [isAddingCondition, editingConditionIndex]);
  
  // Iniciar adición de condición
  const startAddingCondition = useCallback(() => {
    setIsAddingCondition(true);
    setNewCondition('');
  }, []);
  
  // Añadir condición
  const addCondition = useCallback(() => {
    if (newCondition.trim()) {
      onAddCondition(newCondition.trim());
      setNewCondition('');
    }
    setIsAddingCondition(false);
  }, [newCondition, onAddCondition]);
  
  // Manejar cambios en el input de nueva condición
  const handleNewConditionChange = useCallback((e) => {
    setNewCondition(e.target.value);
  }, []);
  
  // Guardar nueva condición al presionar Enter
  const handleNewConditionKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && newCondition.trim()) {
      e.preventDefault();
      addCondition();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setNewCondition('');
      setIsAddingCondition(false);
      setEditingConditionIndex(null);
    }
  }, [newCondition, addCondition]);
  
  // Iniciar edición de una condición existente
  const editCondition = useCallback((index) => {
    setEditingConditionIndex(index);
    setNewCondition(conditions[index]);
  }, [conditions]);
  
  // Guardar condición editada
  const saveEditedCondition = useCallback(() => {
    if (editingConditionIndex !== null && newCondition.trim()) {
      onEditCondition(editingConditionIndex, newCondition.trim());
      setNewCondition('');
      setEditingConditionIndex(null);
    }
  }, [editingConditionIndex, newCondition, onEditCondition]);
  
  // Manejar teclas al editar una condición
  const handleEditConditionKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && newCondition.trim()) {
      e.preventDefault();
      saveEditedCondition();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setNewCondition('');
      setEditingConditionIndex(null);
    }
  }, [newCondition, saveEditedCondition]);
  
  return (
    <div className="decision-node__conditions">
      {/* Lista de condiciones */}
      <div className="decision-node__conditions-list">
        {conditions.map((condition, index) => (
          <ConditionItem
            key={`condition-${index}`}
            condition={condition}
            index={index}
            onEdit={editCondition}
            onDelete={onDeleteCondition}
            onMove={onMoveCondition}
            isUltraPerformanceMode={isUltraPerformanceMode}
            isActive={activeConditionIndex === index}
          />
        ))}
      </div>
      
      {/* Formulario para añadir/editar condición */}
      {isEditing && (
        <div className="decision-node__add-condition-container">
          {isAddingCondition || editingConditionIndex !== null ? (
            <div className="decision-node__condition-form">
              <input
                ref={conditionInputRef}
                type="text"
                className="decision-node__condition-input"
                value={newCondition}
                onChange={handleNewConditionChange}
                onKeyDown={editingConditionIndex !== null ? handleEditConditionKeyDown : handleNewConditionKeyDown}
                placeholder="Escribe la condición..."
                aria-label="Texto de la condición"
              />
              <div className="decision-node__condition-form-actions">
                <button
                  onClick={() => {
                    setIsAddingCondition(false);
                    setEditingConditionIndex(null);
                    setNewCondition('');
                  }}
                  className="decision-node__condition-button decision-node__condition-button--cancel"
                  aria-label={NODE_CONFIG.ARIA_LABELS.cancelEditing}
                >
                  <X size={14} />
                </button>
                <button
                  onClick={editingConditionIndex !== null ? saveEditedCondition : addCondition}
                  className="decision-node__condition-button decision-node__condition-button--save"
                  aria-label={NODE_CONFIG.ARIA_LABELS.saveChanges}
                  disabled={!newCondition.trim()}
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
  conditions: PropTypes.arrayOf(PropTypes.string).isRequired,
  onAddCondition: PropTypes.func.isRequired,
  onEditCondition: PropTypes.func.isRequired,
  onDeleteCondition: PropTypes.func.isRequired,
  onMoveCondition: PropTypes.func.isRequired,
  isUltraPerformanceMode: PropTypes.bool,
  activeConditionIndex: PropTypes.number,
  isEditing: PropTypes.bool
};

export default DecisionNodeConditions;
