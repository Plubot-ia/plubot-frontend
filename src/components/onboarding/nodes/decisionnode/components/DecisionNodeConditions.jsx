/**
 * @file DecisionNodeConditions.jsx
 * @description Componente para gestionar las condiciones del nodo de decisión
 */

import {
  X,
  Check,
  Plus,
  Pencil,
  // Move, ChevronUp, ChevronDown removed as move functionality UI is being removed
} from 'lucide-react';
import PropTypes from 'prop-types';
import React, { memo, useState, useRef, useCallback, useEffect } from 'react';

import Tooltip from '../../../ui/ToolTip';
import {
  NODE_CONFIG,
  getConditionType,
  getConnectorColor as getGlobalConnectorColor,
} from '../DecisionNode.types';

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
// Helper: Manejar eliminación con confirmación
const useDeleteHandler = (options) => {
  const { showDeleteConfirm, setShowDeleteConfirm, onDelete, conditionId } =
    options;

  return useCallback(() => {
    if (showDeleteConfirm) {
      onDelete(conditionId);
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  }, [showDeleteConfirm, onDelete, conditionId, setShowDeleteConfirm]);
};

// Helper: Manejar teclas del input
const useInputKeyHandler = (handleSaveEdit, handleCancelEdit) => {
  return useCallback(
    (event_) => {
      if (event_.key === 'Enter') {
        event_.preventDefault();
        handleSaveEdit();
      } else if (event_.key === 'Escape') {
        event_.preventDefault();
        handleCancelEdit();
      }
    },
    [handleSaveEdit, handleCancelEdit],
  );
};

// Helper: Manejar teclas del item para accesibilidad
const useItemKeyHandler = (
  isEditingThisItem,
  handleDelete,
  handleStartEditing,
) => {
  return useCallback(
    (event_) => {
      if (isEditingThisItem) return;

      switch (event_.key) {
        case 'Enter':
        case ' ': {
          event_.preventDefault();
          handleStartEditing();
          break;
        }
        case 'Delete': {
          event_.preventDefault();
          handleDelete();
          break;
        }
        default: {
          break;
        }
      }
    },
    [isEditingThisItem, handleDelete, handleStartEditing],
  );
};

// Helper: Enfocar input al editar o añadir condición
const useFocusInput = (
  isAddingCondition,
  editingConditionId,
  conditionInputReference,
) => {
  useEffect(() => {
    let animationId;
    if (
      (isAddingCondition || editingConditionId !== undefined) &&
      conditionInputReference.current
    ) {
      animationId = requestAnimationFrame(() => {
        conditionInputReference.current.focus();
        conditionInputReference.current.select();
      });
    }
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [isAddingCondition, editingConditionId, conditionInputReference]);
};

// Helper: Renderizar formulario de condición
const renderConditionForm = ({
  isEditing,
  isAddingCondition,
  editingConditionId,
  conditionInputReference,
  editingText,
  handleNewConditionChange,
  handleNewConditionKeyDown,
  handleEditConditionKeyDown,
  setIsAddingCondition,
  setEditingConditionId,
  setEditingText,
  addCondition,
  saveEditedCondition,
  startAddingCondition,
  disableAdd,
  conditions,
  maxConditions,
}) => {
  if (!isEditing) return;

  return (
    <div className='decision-node__add-condition-container'>
      {isAddingCondition || editingConditionId !== undefined ? (
        <div className='decision-node__condition-form'>
          <input
            ref={conditionInputReference}
            type='text'
            className='decision-node__condition-input'
            onMouseDown={(event_) => event_.stopPropagation()}
            value={editingText}
            onChange={handleNewConditionChange}
            onKeyDown={
              editingConditionId === undefined
                ? handleNewConditionKeyDown
                : handleEditConditionKeyDown
            }
            placeholder='Escribe la condición...'
            aria-label='Texto de la condición'
          />
          <div className='decision-node__condition-form-actions'>
            <button
              onClick={() => {
                setIsAddingCondition(false);
                setEditingConditionId(undefined);
                setEditingText('');
              }}
              className='decision-node__condition-button decision-node__condition-button--cancel'
              aria-label={NODE_CONFIG.ARIA_LABELS.cancelEditing}
            >
              <X size={14} />
            </button>
            <button
              onClick={
                editingConditionId === undefined
                  ? addCondition
                  : saveEditedCondition
              }
              className='decision-node__condition-button decision-node__condition-button--save'
              aria-label={NODE_CONFIG.ARIA_LABELS.saveChanges}
              disabled={!editingText.trim()}
            >
              <Check size={14} />
            </button>
          </div>
        </div>
      ) : (
        <Tooltip content='Añadir nueva condición (Ctrl+A)' position='top'>
          <button
            onClick={startAddingCondition}
            className='decision-node__add-condition-button'
            disabled={disableAdd || conditions.length >= maxConditions}
            aria-label={NODE_CONFIG.ARIA_LABELS.addCondition}
            aria-keyshortcuts='Ctrl+A'
          >
            <Plus size={14} />
            <span>Añadir condición</span>
          </button>
        </Tooltip>
      )}
    </div>
  );
};

// Helper: Renderizar botones de acción condicional
const renderActionButtons = (options) => {
  const {
    isUltraPerformanceMode,
    isEditingThisItem,
    isHovered,
    showDeleteConfirm,
    handleStartEditing,
    handleDelete,
  } = options;

  if (isUltraPerformanceMode || isEditingThisItem) return;
  if (!isHovered && !globalThis.matchMedia('(hover: none)').matches) return;

  return (
    <div className='decision-node__condition-actions'>
      <Tooltip content='Editar condición' position='top'>
        <button
          className='decision-node__condition-button decision-node__condition-button--edit'
          onClick={handleStartEditing}
          aria-label={NODE_CONFIG.ARIA_LABELS.editCondition}
        >
          <Pencil size={14} />
        </button>
      </Tooltip>

      <Tooltip
        content={
          showDeleteConfirm ? 'Confirmar eliminación' : 'Eliminar condición'
        }
        position='top'
      >
        <button
          className={`decision-node__condition-button ${showDeleteConfirm ? 'decision-node__condition-button--confirm' : 'decision-node__condition-button--delete'}`}
          onClick={handleDelete}
          aria-label={NODE_CONFIG.ARIA_LABELS.deleteCondition}
        >
          <X size={14} />
        </button>
      </Tooltip>
    </div>
  );
};

const ConditionItem = memo((props) => {
  const {
    condition,
    index,
    onConditionChange,
    onDelete,
    isUltraPerformanceMode,
    isActive = false,
  } = props;
  const [isHovered, setIsHovered] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditingThisItem, setIsEditingThisItem] = useState(false);
  const [editedText, setEditedText] = useState(condition.text);
  const inputReference = useRef(null);

  const conditionType = getConditionType(condition.text);
  const conditionTypeClass = `decision-node__condition--${conditionType}`;

  const handleStartEditing = useCallback(() => {
    setEditedText(condition.text);
    setIsEditingThisItem(true);
  }, [condition.text]);

  const handleSaveEdit = useCallback(() => {
    if (editedText.trim() !== condition.text) {
      onConditionChange(condition.id, editedText.trim());
    }
    setIsEditingThisItem(false);
  }, [editedText, condition.text, condition.id, onConditionChange]);

  const handleCancelEdit = useCallback(() => {
    setEditedText(condition.text);
    setIsEditingThisItem(false);
  }, [condition.text]);

  const handleDelete = useDeleteHandler({
    showDeleteConfirm,
    setShowDeleteConfirm,
    onDelete,
    conditionId: condition.id,
  });
  const handleInputKeyDown = useInputKeyHandler(
    handleSaveEdit,
    handleCancelEdit,
  );
  const handleItemKeyDown = useItemKeyHandler(
    isEditingThisItem,
    handleDelete,
    handleStartEditing,
  );

  useEffect(() => {
    if (isEditingThisItem && inputReference.current) {
      inputReference.current.focus();
      inputReference.current.select();
    }
  }, [isEditingThisItem]);

  return (
    <div
      className={`decision-node__condition ${isUltraPerformanceMode ? 'decision-node__condition--ultra' : ''} ${conditionTypeClass} ${isActive ? 'decision-node__condition--active' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-index={index}
      data-condition-text={condition.text}
      data-condition-id={condition.id}
      tabIndex={0}
      role='button'
      aria-label={`Condición: ${condition.text}`}
      onKeyDown={handleItemKeyDown}
      onDoubleClick={isEditingThisItem ? undefined : handleStartEditing}
    >
      {/* Marca de color para la condición */}
      <div
        className='decision-node__condition-color-mark'
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
          ref={inputReference}
          type='text'
          value={editedText}
          onChange={(event_) => setEditedText(event_.target.value)}
          onBlur={handleSaveEdit}
          onKeyDown={handleInputKeyDown}
          className='decision-node__condition-input decision-node__condition-input--inline'
          aria-label={`Editar texto de la condición: ${condition.text}`}
          onClick={(event_) => event_.stopPropagation()} // Prevent double click from bubbling if input is clicked
          onMouseDown={(event_) => event_.stopPropagation()} // Evitar que el drag del nodo interfiera
        />
      ) : (
        <span
          className='decision-node__condition-text'
          onClick={handleStartEditing}
          role='button'
          tabIndex={0}
          onKeyDown={(event_) => {
            if (event_.key === 'Enter' || event_.key === ' ') {
              event_.preventDefault();
              handleStartEditing();
            }
          }}
        >
          {condition.text}
        </span>
      )}

      {renderActionButtons({
        isUltraPerformanceMode,
        isEditingThisItem,
        isHovered,
        showDeleteConfirm,
        handleStartEditing,
        handleDelete,
      })}
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
const DecisionNodeConditions = memo(
  ({
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
    const [editingConditionId, setEditingConditionId] = useState();
    const [editingText, setEditingText] = useState('');
    const conditionInputReference = useRef(null);

    // Enfocar el input al añadir o editar una condición
    useFocusInput(
      isAddingCondition,
      editingConditionId,
      conditionInputReference,
    );

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
    const handleNewConditionChange = useCallback((event_) => {
      setEditingText(event_.target.value);
    }, []);

    // Guardar nueva condición al presionar Enter
    const handleNewConditionKeyDown = useCallback(
      (event_) => {
        if (event_.key === 'Enter' && editingText.trim()) {
          event_.preventDefault();
          addCondition();
        } else if (event_.key === 'Escape') {
          event_.preventDefault();
          setIsAddingCondition(false);
          setEditingText('');
        }
      },
      [editingText, addCondition],
    );

    // Guardar condición editada
    const saveEditedCondition = useCallback(() => {
      if (editingConditionId !== undefined) {
        onConditionChange(editingConditionId, editingText);
        setEditingConditionId(undefined);
        setEditingText('');
        conditionInputReference.current?.blur(); // Quitar foco del input
      }
    }, [editingConditionId, editingText, onConditionChange]);

    // Manejar teclas al editar una condición
    const handleEditConditionKeyDown = useCallback(
      (event_) => {
        if (event_.key === 'Enter' && editingText.trim()) {
          event_.preventDefault();
          saveEditedCondition();
        } else if (event_.key === 'Escape') {
          event_.preventDefault();
          setEditingConditionId(undefined);
          setEditingText('');
        }
      },
      [editingText, saveEditedCondition],
    );

    return (
      <div className='decision-node__conditions'>
        {/* Lista de condiciones */}
        <div className='decision-node__conditions-list'>
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
        {renderConditionForm({
          isEditing,
          isAddingCondition,
          editingConditionId,
          conditionInputReference,
          editingText,
          handleNewConditionChange,
          handleNewConditionKeyDown,
          handleEditConditionKeyDown,
          setIsAddingCondition,
          setEditingConditionId,
          setEditingText,
          addCondition,
          saveEditedCondition,
          startAddingCondition,
          disableAdd,
          conditions,
          maxConditions,
        })}
      </div>
    );
  },
);

DecisionNodeConditions.displayName = 'DecisionNodeConditions';

DecisionNodeConditions.propTypes = {
  conditions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      text: PropTypes.string.isRequired,
    }),
  ).isRequired,
  onAddCondition: PropTypes.func.isRequired,
  onConditionChange: PropTypes.func.isRequired, // This prop is now used by ConditionItem
  onDeleteCondition: PropTypes.func.isRequired,
  onMoveCondition: PropTypes.func.isRequired,
  isUltraPerformanceMode: PropTypes.bool,
  activeConditionId: PropTypes.string,
  setActiveConditionId: PropTypes.func.isRequired,
  isEditing: PropTypes.bool,
  disableAdd: PropTypes.bool,
  maxConditions: PropTypes.number,
};

export default DecisionNodeConditions;
