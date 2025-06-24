/**
 * @file DecisionNodeConditions.jsx
 * @description Componente para gestionar las condiciones del nodo de decisión
 */

import {
  X,
  Check,
  Circle,
  Plus,
  Pencil,
  // Move, ChevronUp, ChevronDown removed as move functionality UI is being removed
} from 'lucide-react';
import PropTypes from 'prop-types';
import React, { memo, useState, useRef, useCallback, useEffect } from 'react';
import { Handle, Position } from 'reactflow';

import Tooltip from '../../../ui/ToolTip';
import { NODE_CONFIG, CONDITION_TYPES, getConditionType, getConnectorColor as getGlobalConnectorColor } from '../DecisionNode.types';


/**
 * Componente para renderizar una condición individual.
 * La edición se maneja localmente. La funcionalidad de mover se ha eliminado.
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.condition - Objeto de condición con id y texto.
 * @param {string} props.condition.id - ID único de la condición.
 * @param {string} props.condition.text - Texto de la condición.
 * @param {number} props.index - Índice de la condición.
 * @param {Function} props.onConditionChange - Función para notificar el cambio de texto de la condición (id, newText).
 * @param {Function} props.onDelete - Función para eliminar la condición (conditionId).
 * @param {boolean} [props.isUltraPerformanceMode=false] - Indica si está en modo ultra rendimiento.
 * @param {boolean} [props.isActive=false] - Indica si la condición está activa.
 * @returns {JSX.Element} - Componente de condición.
 */
const ConditionItem = memo(({
  condition, // Ahora es { id: string, text: string }
  index,
  onConditionChange, // Prop para notificar cambio de texto
  onDelete, // Espera (conditionId)
  // onMove no longer needed as UI is removed
  isUltraPerformanceMode,
  isActive = false,
  // onEdit prop is removed, editing is handled locally
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditingThisItem, setIsEditingThisItem] = useState(false);
  const [editedText, setEditedText] = useState(condition.text);
  const inputRef = useRef(null);

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

  // Move handlers removed

  const handleStartEditing = () => {
    setEditedText(condition.text);
    setIsEditingThisItem(true);
  };

  const handleSaveEdit = () => {
    if (editedText.trim() !== condition.text) {
      onConditionChange(condition.id, editedText.trim());
    }
    setIsEditingThisItem(false);
  };

  const handleCancelEdit = () => {
    setEditedText(condition.text); // Revert to original text
    setIsEditingThisItem(false);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  // Effect to focus input when editing starts
  useEffect(() => {
    if (isEditingThisItem && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select(); // Select all text
    }
  }, [isEditingThisItem]);

  // Manejar teclas para accesibilidad del ítem (no del input)
  const handleItemKeyDown = useCallback((e) => {
    if (isEditingThisItem) return; // Don't interfere with input keydown

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        handleStartEditing();
        break;
      case 'Delete':
        e.preventDefault();
        handleDelete();
        break;
      default:
        break;
    }
  }, [isEditingThisItem, handleDelete, handleStartEditing, condition.id]);

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
      onKeyDown={handleItemKeyDown}
      onDoubleClick={!isEditingThisItem ? handleStartEditing : undefined}
    >
      {/* Marca de color para la condición */}
      <div
        className="decision-node__condition-color-mark"
        style={{
          backgroundColor: getGlobalConnectorColor(condition.text, index),
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          marginRight: '8px',
          border: '1px solid white',
          boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.1)',
          flexShrink: 0,
        }}
      />

      {isEditingThisItem ? (
        <input
          ref={inputRef}
          type="text"
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          onBlur={handleSaveEdit}
          onKeyDown={handleInputKeyDown}
          className="decision-node__condition-input decision-node__condition-input--inline"
          aria-label={`Editar texto de la condición: ${condition.text}`}
          onClick={(e) => e.stopPropagation()} // Prevent double click from bubbling if input is clicked
          onMouseDown={(e) => e.stopPropagation()} // Evitar que el drag del nodo interfiera
        />
      ) : (
        <span className="decision-node__condition-text" onClick={handleStartEditing}>{condition.text}</span>
      )}

      {!isUltraPerformanceMode && !isEditingThisItem && (isHovered || window.matchMedia('(hover: none)').matches) && (
        <div className="decision-node__condition-actions">
          <Tooltip content="Editar condición" position="top">
            <button
              className="decision-node__condition-button decision-node__condition-button--edit"
              onClick={handleStartEditing} // Now triggers in-place editing
              aria-label={NODE_CONFIG.ARIA_LABELS.editCondition}
            >
              <Pencil size={14} />
            </button>
          </Tooltip>

          <Tooltip content={showDeleteConfirm ? 'Confirmar eliminación' : 'Eliminar condición'} position="top">
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
  onConditionChange: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  isUltraPerformanceMode: PropTypes.bool,
  isActive: PropTypes.bool,
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
  isEditing,
  disableAdd = false, // Default to false if not provided
  maxConditions = Infinity, // Default if not provided
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

  // Actualizar el estado de `disableAdd` internamente si es necesario, aunque se prefiere que venga de props
  // const internalDisableAdd = disableAdd || (conditions && conditions.length >= maxConditions);


  // Iniciar adición de condición
  const startAddingCondition = useCallback(() => {
    if (disableAdd || conditions.length >= maxConditions) {
      // Optionally, show a message or log, but the button should be disabled visually

      return;
    }
    setIsAddingCondition(true);
    setEditingText('');
  }, [disableAdd, conditions, maxConditions]);

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
            onConditionChange={onConditionChange} // Passthrough from parent
            onDelete={() => onDeleteCondition(condition.id)} // Pasa (conditionId)
            // onMove prop removed
            isUltraPerformanceMode={isUltraPerformanceMode}
            isActive={condition.id === activeConditionId}
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
                className="decision-node__add-condition-button"
                disabled={disableAdd || conditions.length >= maxConditions}
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
  onConditionChange: PropTypes.func.isRequired, // This prop is now used by ConditionItem
  onDeleteCondition: PropTypes.func.isRequired,
  // onMoveCondition: PropTypes.func.isRequired, // Prop removed
  isUltraPerformanceMode: PropTypes.bool,
  activeConditionId: PropTypes.string,
  setActiveConditionId: PropTypes.func.isRequired,
  isEditing: PropTypes.bool,
  disableAdd: PropTypes.bool,
  maxConditions: PropTypes.number,
};

export default DecisionNodeConditions;
