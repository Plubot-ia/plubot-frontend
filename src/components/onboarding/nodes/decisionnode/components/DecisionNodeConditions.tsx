/**
 * @file DecisionNodeConditions.tsx
 * @description Componente para gestionar las condiciones del nodo de decisión
 */

import { X, Check, Plus, Pencil } from 'lucide-react';
import React, { memo, useState, useRef, useCallback, useEffect } from 'react';

import Tooltip from '../../../ui/ToolTip';
import type { DecisionCondition } from '../DecisionNode.types';
import { DECISION_NODE_ARIA, DECISION_NODE_SHORTCUTS } from '../DecisionNode.types';

// Interfaces
interface ConditionItemProps {
  condition: DecisionCondition;
  index: number;
  onConditionChange: (id: string, newText: string) => void;
  onDelete: (conditionId: string) => void;
  isUltraPerformanceMode?: boolean;
  isActive?: boolean;
}

interface DecisionNodeConditionsProps {
  conditions: DecisionCondition[];
  onAddCondition: (text: string) => void;
  onConditionChange: (id: string, newText: string) => void;
  onDeleteCondition: (conditionId: string) => void;
  onMoveCondition?: (fromIndex: number, toIndex: number) => void;
  isUltraPerformanceMode?: boolean;
  activeConditionId?: string | null;
  setActiveConditionId?: (id: string | null) => void;
  isEditing?: boolean;
  disableAdd?: boolean;
  maxConditions?: number;
}

interface DeleteHandlerOptions {
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: React.Dispatch<React.SetStateAction<boolean>>;
  onDelete: (conditionId: string) => void;
  conditionId: string;
}

// Constants
const NODE_CONFIG = {
  ARIA_LABELS: DECISION_NODE_ARIA,
  KEY_SHORTCUTS: DECISION_NODE_SHORTCUTS,
  DEFAULT_CONDITION: 'Nueva condición...',
  MAX_CONDITIONS: 5,
};

// Helper functions for condition types
const getConditionType = (text: string): string => {
  if (text.includes('?')) return 'question';
  if (text.includes('=') || text.includes('>') || text.includes('<')) return 'comparison';
  if (text.includes('&&') || text.includes('||')) return 'logical';
  return 'simple';
};

const getConnectorColor = (conditionType: string): string => {
  switch (conditionType) {
    case 'question':
      return '#3b82f6';
    case 'comparison':
      return '#10b981';
    case 'logical':
      return '#f59e0b';
    default:
      return '#6b7280';
  }
};

// Helper: Manejar eliminación con confirmación
const useDeleteHandler = (options: DeleteHandlerOptions) => {
  const { showDeleteConfirm, setShowDeleteConfirm, onDelete, conditionId } = options;

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
const useInputKeyHandler = (handleSaveEdit: () => void, handleCancelEdit: () => void) => {
  return useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleSaveEdit();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        handleCancelEdit();
      }
    },
    [handleSaveEdit, handleCancelEdit],
  );
};

// Helper: Manejar teclas del item para accesibilidad
const useItemKeyHandler = (
  isEditingThisItem: boolean,
  handleDelete: () => void,
  handleStartEditing: () => void,
) => {
  return useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (isEditingThisItem) return;

      switch (event.key) {
        case 'Delete':
        case 'Backspace': {
          event.preventDefault();
          handleDelete();
          break;
        }
        case 'Enter':
        case ' ': {
          event.preventDefault();
          handleStartEditing();
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
  isAddingCondition: boolean,
  editingConditionId: string | undefined,
  conditionInputReference: React.RefObject<HTMLInputElement | null>,
): void => {
  useEffect(() => {
    if ((isAddingCondition || editingConditionId) && conditionInputReference.current) {
      const timer = setTimeout(() => {
        conditionInputReference.current?.focus();
        conditionInputReference.current?.select();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isAddingCondition, editingConditionId, conditionInputReference]);
};

/**
 * Componente para renderizar una condición individual
 */
const ConditionItem = memo<ConditionItemProps>(
  ({
    condition,
    index,
    onConditionChange,
    onDelete,
    isUltraPerformanceMode = false,
    isActive = false,
  }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isEditingThisItem, setIsEditingThisItem] = useState(false);
    const [editedText, setEditedText] = useState(condition.text);
    const inputReference = useRef<HTMLInputElement>(null);

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

    const handleInputKeyDown = useInputKeyHandler(handleSaveEdit, handleCancelEdit);
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
        className={`decision-node__condition ${
          isUltraPerformanceMode ? 'decision-node__condition--ultra' : ''
        } ${conditionTypeClass} ${isActive ? 'decision-node__condition--active' : ''}`}
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
        {isEditingThisItem ? (
          <div className='decision-node__condition-edit'>
            <input
              ref={inputReference}
              type='text'
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              onKeyDown={handleInputKeyDown}
              className='decision-node__condition-input'
              aria-label={NODE_CONFIG.ARIA_LABELS.CONDITION_INPUT}
            />
            <div className='decision-node__condition-actions'>
              <Tooltip content='Guardar (Enter)' position='top'>
                <button
                  onClick={handleSaveEdit}
                  className='decision-node__button decision-node__button--save-small'
                  aria-label='Guardar condición'
                >
                  <Check size={12} />
                </button>
              </Tooltip>
              <Tooltip content='Cancelar (Escape)' position='top'>
                <button
                  onClick={handleCancelEdit}
                  className='decision-node__button decision-node__button--cancel-small'
                  aria-label='Cancelar edición'
                >
                  <X size={12} />
                </button>
              </Tooltip>
            </div>
          </div>
        ) : (
          <>
            <div className='decision-node__condition-content'>
              <span className='decision-node__condition-text'>{condition.text}</span>
              <div
                className='decision-node__condition-type-indicator'
                style={{ backgroundColor: getConnectorColor(conditionType) }}
                title={`Tipo: ${conditionType}`}
              />
            </div>

            {(isHovered || showDeleteConfirm) && !isUltraPerformanceMode && (
              <div className='decision-node__condition-controls'>
                <Tooltip content='Editar condición (Enter)' position='top'>
                  <button
                    onClick={handleStartEditing}
                    className='decision-node__button decision-node__button--edit'
                    aria-label={`Editar condición ${index + 1}`}
                  >
                    <Pencil size={12} />
                  </button>
                </Tooltip>
                <Tooltip
                  content={
                    showDeleteConfirm ? 'Confirmar eliminación' : 'Eliminar condición (Delete)'
                  }
                  position='top'
                >
                  <button
                    onClick={handleDelete}
                    className={`decision-node__button ${
                      showDeleteConfirm
                        ? 'decision-node__button--delete-confirm'
                        : 'decision-node__button--delete'
                    }`}
                    aria-label={`Eliminar condición ${index + 1}`}
                  >
                    <X size={12} />
                  </button>
                </Tooltip>
              </div>
            )}
          </>
        )}
      </div>
    );
  },
);

ConditionItem.displayName = 'ConditionItem';

/**
 * Componente para gestionar las condiciones del nodo de decisión
 */
const DecisionNodeConditions = memo<DecisionNodeConditionsProps>(
  ({
    conditions,
    onAddCondition,
    onConditionChange,
    onDeleteCondition,
    onMoveCondition: _onMoveCondition,
    isUltraPerformanceMode = false,
    activeConditionId,
    setActiveConditionId: _setActiveConditionId,
    isEditing: _isEditing = false,
    disableAdd = false,
    maxConditions = NODE_CONFIG.MAX_CONDITIONS,
  }) => {
    const [isAddingCondition, setIsAddingCondition] = useState(false);
    const [editingConditionId, _setEditingConditionId] = useState<string | undefined>();
    const [editingText, setEditingText] = useState('');
    const conditionInputReference = useRef<HTMLInputElement>(null);

    // Enfocar el input al añadir o editar una condición
    useFocusInput(isAddingCondition, editingConditionId, conditionInputReference);

    // Iniciar adición de condición
    const startAddingCondition = useCallback(() => {
      if (disableAdd || conditions.length >= maxConditions) {
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
    const handleNewConditionChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
      setEditingText(event.target.value);
    }, []);

    // Guardar nueva condición al presionar Enter
    const handleNewConditionKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && editingText.trim()) {
          event.preventDefault();
          addCondition();
        } else if (event.key === 'Escape') {
          event.preventDefault();
          setIsAddingCondition(false);
          setEditingText('');
        }
      },
      [editingText, addCondition],
    );

    return (
      <div className='decision-node__conditions'>
        <div className='decision-node__conditions-header'>
          <h4 className='decision-node__conditions-title'>
            Condiciones ({conditions.length}/{maxConditions})
          </h4>
          {!isAddingCondition && !disableAdd && conditions.length < maxConditions && (
            <Tooltip
              content={`Añadir condición (${conditions.length}/${maxConditions})`}
              position='top'
            >
              <button
                onClick={startAddingCondition}
                className='decision-node__button decision-node__button--add-condition'
                aria-label={NODE_CONFIG.ARIA_LABELS.ADD_CONDITION_BUTTON}
                disabled={disableAdd || conditions.length >= maxConditions}
              >
                <Plus size={14} />
                <span>Añadir condición</span>
              </button>
            </Tooltip>
          )}
        </div>

        <div className='decision-node__conditions-list'>
          {conditions.map((condition, index) => (
            <ConditionItem
              key={condition.id}
              condition={condition}
              index={index}
              onConditionChange={onConditionChange}
              onDelete={onDeleteCondition}
              isUltraPerformanceMode={isUltraPerformanceMode}
              isActive={activeConditionId === condition.id}
            />
          ))}

          {isAddingCondition && (
            <div className='decision-node__add-condition-form'>
              <input
                ref={conditionInputReference}
                type='text'
                value={editingText}
                onChange={handleNewConditionChange}
                onKeyDown={handleNewConditionKeyDown}
                placeholder={NODE_CONFIG.DEFAULT_CONDITION}
                className='decision-node__condition-input decision-node__condition-input--new'
                aria-label={NODE_CONFIG.ARIA_LABELS.CONDITION_INPUT}
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
              />
              <div className='decision-node__condition-actions'>
                <Tooltip content='Guardar (Enter)' position='top'>
                  <button
                    onClick={addCondition}
                    className='decision-node__button decision-node__button--save-small'
                    aria-label='Guardar nueva condición'
                    disabled={!editingText.trim()}
                  >
                    <Check size={12} />
                  </button>
                </Tooltip>
                <Tooltip content='Cancelar (Escape)' position='top'>
                  <button
                    onClick={() => {
                      setIsAddingCondition(false);
                      setEditingText('');
                    }}
                    className='decision-node__button decision-node__button--cancel-small'
                    aria-label='Cancelar nueva condición'
                  >
                    <X size={12} />
                  </button>
                </Tooltip>
              </div>
            </div>
          )}
        </div>

        {conditions.length === 0 && !isAddingCondition && (
          <div className='decision-node__conditions-empty'>
            <p>No hay condiciones definidas</p>
            <p className='decision-node__conditions-hint'>
              Haz clic en &quot;Añadir condición&quot; para comenzar
            </p>
          </div>
        )}
      </div>
    );
  },
);

DecisionNodeConditions.displayName = 'DecisionNodeConditions';

export default DecisionNodeConditions;
