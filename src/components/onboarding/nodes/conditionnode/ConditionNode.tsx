import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { FiTrash2, FiChevronDown, FiChevronUp, FiGitBranch, FiCheck } from 'react-icons/fi';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';

import useFlowStore from '../../../../stores/use-flow-store';
import { useRenderTracker } from '../../../../utils/renderTracker';

import './ConditionNode.css';

// ==================== CONFIGURACIÓN CENTRALIZADA ====================
// const NODE_CONFIG = {
//   colors: {
//     primary: '#8B5CF6',
//     secondary: '#7C3AED',
//     accent: '#A78BFA',
//     background: 'linear-gradient(145deg, #8B5CF6, #7C3AED)',
//     text: '#FFFFFF',
//     textSecondary: '#E9D5FF',
//     border: '#A78BFA',
//     handle: '#8B5CF6',
//     handleBorder: '#FFFFFF',
//     trueHandle: '#10B981',
//     falseHandle: '#EF4444',
//     defaultHandle: '#6B7280',
//   },
//   dimensions: {
//     minWidth: 320,
//     maxWidth: 400,
//     handleSize: 12,
//     borderRadius: 12,
//     padding: 16,
//   },
//   animation: {
//     duration: '0.2s',
//     easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
//   },
// };

// ==================== TIPOS E INTERFACES ====================
export interface Condition {
  id: string;
  variable: string;
  operator:
    | 'equals'
    | 'not_equals'
    | 'greater'
    | 'less'
    | 'greater_equal'
    | 'less_equal'
    | 'contains'
    | 'not_contains';
  value: string;
  logicalOperator?: 'and' | 'or';
}

export interface ConditionNodeData {
  label?: string;
  conditions: Condition[];
  defaultBranch?: 'true' | 'false' | 'none';
  description?: string;
  isCollapsed?: boolean;
  onChange?: (data: ConditionNodeData) => void;
}

// interface ConditionNodeProps extends NodeProps {
// ==================== OPERADORES DISPONIBLES ====================
const OPERATORS = [
  { value: 'equals', label: 'es igual a' },
  { value: 'not_equals', label: 'no es igual a' },
  { value: 'contains', label: 'contiene' },
  { value: 'not_contains', label: 'no contiene' },
  { value: 'greater_than', label: 'es mayor que' },
  { value: 'less_than', label: 'es menor que' },
  { value: 'is_empty', label: 'está vacío' },
  { value: 'is_not_empty', label: 'no está vacío' },
].map(({ value, label: _label }) => ({ value, label: _label }));

// ==================== COMPONENTE HEADER ====================
const ConditionNodeHeader = React.memo<{
  label?: string;
  selected?: boolean;
  isCollapsed?: boolean;
}>(
  ({ label: _label, selected, isCollapsed }) => (
    <div
      className={`condition-node ${selected ? 'condition-node--selected' : ''} ${
        isCollapsed ? 'condition-node--collapsed' : ''
      }`}
      role='group'
      aria-label='Nodo de condición'
    >
      {/* Header */}
      <div className='condition-node__header'>
        <div className='condition-node__icon-wrapper'>
          <FiGitBranch className='condition-node__icon' />
        </div>
        <h3 className='condition-node__title'>Condición</h3>
        <button
          className='condition-node__collapse-btn'
          onClick={isCollapsed ? undefined : undefined}
          aria-label={isCollapsed ? 'Expandir' : 'Colapsar'}
        >
          {isCollapsed ? '▶' : '▼'}
        </button>
      </div>
      {selected && <div className='condition-node__selected-indicator' />}
    </div>
  ),
  (prevProps, nextProps) =>
    prevProps.label === nextProps.label && prevProps.selected === nextProps.selected,
);

ConditionNodeHeader.displayName = 'ConditionNodeHeader';

// ==================== COMPONENTE CONDICIÓN INDIVIDUAL ====================
const ConditionItem = React.memo<{
  condition: Condition;
  index: number;
  isFirst: boolean;
  onChange: (index: number, field: keyof Condition, value: string) => void;
  onRemove: (index: number) => void;
}>(
  ({ condition, index, isFirst, onChange, onRemove }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    const handleFieldChange = useCallback(
      (field: keyof Condition, value: string) => {
        onChange(index, field, value);
      },
      [index, onChange],
    );

    const selectedOperator = useMemo(
      () => OPERATORS.find((op) => op.value === condition.operator),
      [condition.operator],
    );

    return (
      <div className='condition-node__item'>
        {!isFirst && (
          <div className='condition-node__logical-operator'>
            <select
              value={condition.logicalOperator ?? 'and'}
              onChange={(e) => handleFieldChange('logicalOperator', e.target.value)}
              className='condition-node__logical-select'
            >
              <option value='and'>Y</option>
              <option value='or'>O</option>
            </select>
          </div>
        )}

        <div className='condition-node__item-header'>
          <button
            className='condition-node__expand-btn'
            onClick={() => setIsExpanded(!isExpanded)}
            type='button'
            aria-label={isExpanded ? 'Contraer' : 'Expandir'}
          >
            {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
          </button>

          <span className='condition-node__item-preview'>
            {condition.variable || 'variable'} {selectedOperator?.label}{' '}
            {condition.value || 'valor'}
          </span>

          {!isFirst && (
            <button
              className='condition-node__remove-btn'
              onClick={() => onRemove(index)}
              type='button'
              aria-label='Eliminar condición'
            >
              <FiTrash2 />
            </button>
          )}
        </div>

        {isExpanded && (
          <div className='condition-node__item-content'>
            <div className='condition-node__field'>
              <label htmlFor={`variable-${index}`} className='condition-node__label'>
                Variable
              </label>
              <input
                id={`variable-${index}`}
                type='text'
                value={condition.variable}
                onChange={(e) => handleFieldChange('variable', e.target.value)}
                placeholder='{{nombre_variable}}'
                className='condition-node__input'
              />
            </div>

            <div className='condition-node__field'>
              <label htmlFor={`operator-${index}`} className='condition-node__label'>
                Operador
              </label>
              <select
                id={`operator-${index}`}
                value={condition.operator}
                onChange={(e) => handleFieldChange('operator', e.target.value)}
                className='condition-node__select'
              >
                {OPERATORS.map((op) => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>
            </div>

            <div className='condition-node__field'>
              <label htmlFor={`value-${index}`} className='condition-node__label'>
                Valor
              </label>
              <input
                id={`value-${index}`}
                type='text'
                value={condition.value}
                onChange={(e) => handleFieldChange('value', e.target.value)}
                placeholder='Ingrese un valor'
                className='condition-node__input'
              />
            </div>
          </div>
        )}
      </div>
    );
  },
  (prevProps, nextProps) =>
    prevProps.condition.id === nextProps.condition.id &&
    prevProps.condition.variable === nextProps.condition.variable &&
    prevProps.condition.operator === nextProps.condition.operator &&
    prevProps.condition.value === nextProps.condition.value &&
    prevProps.index === nextProps.index &&
    prevProps.isFirst === nextProps.isFirst,
);

ConditionItem.displayName = 'ConditionItem';

// ==================== COMPONENTE PRINCIPAL ====================
const ConditionNodeComponent: React.FC<NodeProps<ConditionNodeData>> = ({ id, data, selected }) => {
  // 🔄 RENDER TRACKING
  useRenderTracker('ConditionNode', [id, selected, data.conditions?.length]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(data.isCollapsed ?? false);
  const [selectedOperator, setSelectedOperator] = useState(
    data.conditions?.[0]?.operator ?? 'equals',
  );
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  const handleConditionChange = useCallback(
    (index: number, field: keyof Condition, value: string) => {
      const updatedConditions = [...(data.conditions ?? [])];
      const safeIndex = Math.max(0, Math.min(index, updatedConditions.length));

      // eslint-disable-next-line security/detect-object-injection
      if (!updatedConditions[safeIndex]) {
        // eslint-disable-next-line security/detect-object-injection
        updatedConditions[safeIndex] = {
          id: `condition-${Date.now()}-${safeIndex}`,
          variable: '',
          operator: 'equals',
          value: '',
          logicalOperator: 'and',
        };
      }

      // Controlled property access to avoid security warnings
      // eslint-disable-next-line security/detect-object-injection
      const currentCondition = updatedConditions[safeIndex];

      switch (field) {
        case 'variable':
          // eslint-disable-next-line security/detect-object-injection
          updatedConditions[safeIndex] = { ...currentCondition, variable: value };
          break;
        case 'operator':
          // eslint-disable-next-line security/detect-object-injection
          updatedConditions[safeIndex] = {
            ...currentCondition,
            operator: value as Condition['operator'],
          };
          break;
        case 'value':
          // eslint-disable-next-line security/detect-object-injection
          updatedConditions[safeIndex] = { ...currentCondition, value };
          break;
        case 'logicalOperator':
          // eslint-disable-next-line security/detect-object-injection
          updatedConditions[safeIndex] = {
            ...currentCondition,
            logicalOperator: value as Condition['logicalOperator'],
          };
          break;
        case 'id':
          // eslint-disable-next-line security/detect-object-injection
          updatedConditions[safeIndex] = { ...currentCondition, id: value };
          break;
        default:
          // No action for unknown fields
          break;
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      updateNodeData(id, { conditions: updatedConditions });
    },
    [data.conditions, id, updateNodeData],
  );

  const handleOperatorSelect = useCallback(
    (operator: string, event?: React.MouseEvent) => {
      // Prevent event propagation to avoid drag issues
      if (event) {
        event.stopPropagation();
        event.preventDefault();
      }
      setSelectedOperator(operator as Condition['operator']);
      setIsDropdownOpen(false);
      const updatedConditions = [...(data.conditions ?? [])];
      if (updatedConditions.length === 0) {
        updatedConditions.push({
          id: `condition-${Date.now()}-0`,
          variable: '',
          operator: operator as Condition['operator'],
          value: '',
        });
      } else {
        updatedConditions[0] = {
          ...updatedConditions[0],
          operator: operator as Condition['operator'],
        };
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      updateNodeData(id, { conditions: updatedConditions });
    },
    [data.conditions, id, updateNodeData],
  );

  const toggleCollapse = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const newCollapsed = !isCollapsed;
      setIsCollapsed(newCollapsed);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      updateNodeData(id, { isCollapsed: newCollapsed });
    },
    [id, isCollapsed, updateNodeData],
  );

  return (
    <div
      className={`condition-node ${
        selected ? 'condition-node--selected' : ''
      } ${isCollapsed ? 'condition-node--collapsed' : ''}`}
      role='group'
      aria-label='Nodo de condición'
    >
      {/* Header */}
      <div className='condition-node__header'>
        <div className='condition-node__icon-wrapper'>
          <FiGitBranch className='condition-node__icon' />
        </div>
        <h3 className='condition-node__title'>Condición</h3>
        <button
          className='condition-node__collapse-btn'
          onClick={toggleCollapse}
          aria-label={isCollapsed ? 'Expandir' : 'Colapsar'}
        >
          {isCollapsed ? '▶' : '▼'}
        </button>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className='condition-node__content'>
          <div className='condition-node__help-text'>
            Si no se cumple ninguna condición, el flujo continuará por la salida &quot;?&quot; (por
            defecto). Si se cumple alguna condición, el flujo continuará por la salida &quot;✓&quot;
            (verdadero), si no por &quot;✗&quot; (falso)
          </div>

          {/* Simple Condition Builder */}
          <div className='condition-node__builder'>
            <div className='condition-node__simple-row'>
              {/* Variable Input */}
              <input
                type='text'
                className='condition-node__input condition-node__input--variable'
                placeholder='Variable (ej: edad)'
                value={data.conditions?.[0]?.variable ?? ''}
                onChange={(e) => handleConditionChange(0, 'variable', e.target.value)}
              />

              {/* Operator Dropdown */}
              <div className='condition-node__dropdown-wrapper' ref={dropdownRef}>
                <button
                  className='condition-node__dropdown-trigger'
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setIsDropdownOpen(!isDropdownOpen);
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                  aria-expanded={isDropdownOpen}
                  aria-haspopup='listbox'
                >
                  <span>
                    {OPERATORS.find((op) => op.value === selectedOperator)?.label ?? 'Seleccionar'}
                  </span>
                  <FiChevronDown className='condition-node__dropdown-icon' />
                </button>

                {isDropdownOpen && (
                  <div className='condition-node__dropdown-menu' role='listbox'>
                    {OPERATORS.map((op) => (
                      <button
                        key={op.value}
                        className={`condition-node__dropdown-item ${
                          selectedOperator === op.value
                            ? 'condition-node__dropdown-item--selected'
                            : ''
                        }`}
                        onClick={(e) => handleOperatorSelect(op.value, e)}
                        onMouseDown={(e) => e.preventDefault()}
                        role='option'
                        aria-selected={selectedOperator === op.value}
                      >
                        {selectedOperator === op.value && (
                          <FiCheck className='condition-node__dropdown-check' />
                        )}
                        {op.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Value Input */}
              <input
                type='text'
                className='condition-node__input condition-node__input--value'
                placeholder='Valor (ej: 18)'
                value={data.conditions?.[0]?.value ?? ''}
                onChange={(e) => handleConditionChange(0, 'value', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Handles */}
      <Handle
        type='target'
        position={Position.Left}
        className='condition-node__handle condition-node__handle--input'
        id='input'
      />
      <Handle
        type='source'
        position={Position.Right}
        className='condition-node__handle condition-node__handle--true'
        id='true'
        style={{ top: '35%' }}
      />
      <Handle
        type='source'
        position={Position.Right}
        className='condition-node__handle condition-node__handle--false'
        id='false'
        style={{ top: '65%' }}
      />
      <Handle
        type='source'
        position={Position.Bottom}
        className='condition-node__handle condition-node__handle--default'
        id='default'
      />

      {/* Handle Labels */}
      {!isCollapsed && (
        <>
          <div className='condition-node__handle-label condition-node__handle-label--true'>✓</div>
          <div className='condition-node__handle-label condition-node__handle-label--false'>✗</div>
          <div className='condition-node__handle-label condition-node__handle-label--default'>
            ?
          </div>
        </>
      )}
    </div>
  );
};

// ==================== MEMOIZACIÓN ====================
const MemoizedConditionNode = React.memo(ConditionNodeComponent, (prevProps, nextProps) => {
  return (
    prevProps.id === nextProps.id &&
    prevProps.selected === nextProps.selected &&
    JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data)
  );
});

MemoizedConditionNode.displayName = 'ConditionNode';

export default MemoizedConditionNode;
