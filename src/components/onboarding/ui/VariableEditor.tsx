import { Plus, X } from 'lucide-react';
import React, { useState } from 'react';

export interface Variable {
  id: string; // Keep internal ID for React key and potential future use
  name: string;
  value: string;
}

interface VariableEditorProperties {
  variables: Variable[];
  onAddVariable: (newVariable: { name: string; value: string }) => void;
  onUpdateVariable: (index: number, updatedFields: Partial<Omit<Variable, 'id'>>) => void;
  onDeleteVariable: (index: number) => void;
  readOnly?: boolean;
  maxVariables?: number;
  // Styling or class props if needed
  className?: string;
  inputClassName?: string;
  buttonClassName?: string;
}

const VariableEditor: React.FC<VariableEditorProperties> = ({
  variables,
  onAddVariable,
  onUpdateVariable,
  onDeleteVariable,
  readOnly = false,
  maxVariables,
  className = '',
  inputClassName = '',
  buttonClassName = '',
}) => {
  const [newVariableName, setNewVariableName] = useState('');
  const [newVariableValue, setNewVariableValue] = useState('');

  const handleAddClick = () => {
    if (maxVariables !== undefined && variables.length >= maxVariables) {
      // Optionally, provide user feedback (e.g., toast notification)
      return;
    }
    onAddVariable({ name: newVariableName, value: newVariableValue });
    setNewVariableName('');
    setNewVariableValue('');
  };

  const handleInputChange = (index: number, field: 'name' | 'value', inputValue: string) => {
    onUpdateVariable(index, { [field]: inputValue });
  };

  return (
    <div className={`variable-editor ${className}`.trim()}>
      {!readOnly && (
        <div className='variable-editor-add-section'>
          <input
            type='text'
            placeholder='Nombre de Variable'
            value={newVariableName}
            onChange={(e) => setNewVariableName(e.target.value)}
            className={`variable-input name-input ${inputClassName}`.trim()}
            aria-label='Nuevo nombre de variable'
          />
          <input
            type='text'
            placeholder='Valor de Variable'
            value={newVariableValue}
            onChange={(e) => setNewVariableValue(e.target.value)}
            className={`variable-input value-input ${inputClassName}`.trim()}
            aria-label='Nuevo valor de variable'
          />
          <button
            onClick={handleAddClick}
            className={`variable-button add-button ${buttonClassName}`.trim()}
            aria-label='Agregar variable'
            disabled={variables.length >= (maxVariables ?? Infinity)}
          >
            <Plus size={16} /> Agregar
          </button>
        </div>
      )}
      <div className='variable-editor-list'>
        {variables.length === 0 ? (
          <div className='variable-editor-empty'>No hay variables definidas.</div>
        ) : (
          variables.map((variable, index) => (
            <div key={variable.id} className='variable-editor-item'>
              <input
                type='text'
                value={variable.name}
                onChange={(e) => handleInputChange(index, 'name', e.target.value)}
                placeholder='Nombre'
                className={`variable-input name-input ${inputClassName}`.trim()}
                aria-label={`Nombre de variable ${index + 1}`}
                readOnly={readOnly}
              />
              <input
                type='text'
                value={variable.value}
                onChange={(e) => handleInputChange(index, 'value', e.target.value)}
                placeholder='Valor'
                className={`variable-input value-input ${inputClassName}`.trim()}
                aria-label={`Valor de variable ${index + 1}`}
                readOnly={readOnly}
              />
              {!readOnly && (
                <button
                  onClick={() => onDeleteVariable(index)}
                  className={`variable-button remove-button ${buttonClassName}`.trim()}
                  aria-label={`Eliminar variable ${index + 1}`}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
      {/* Optional: Help text or other UI elements */}
      {/* <div className="variable-editor-help">
        <small>Usa {{variableName}} en tu contenido.</small>
      </div> */}
    </div>
  );
};

export default VariableEditor;

// Basic CSS (can be moved to a separate .css file and imported)
/*
.variable-editor {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.variable-editor-add-section {
  display: flex;
  gap: 8px;
  align-items: center;
}

.variable-editor-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.variable-editor-item {
  display: flex;
  gap: 8px;
  align-items: center;
}

.variable-input {
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 3px;
  font-size: 14px;
  flex-grow: 1;
}

.name-input {
  min-width: 100px;
}

.value-input {
  min-width: 120px;
}

.variable-button {
  padding: 6px 10px;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
}

.add-button {
  background-color: #28a745;
  color: white;
}

.add-button:hover {
  background-color: #218838;
}

.remove-button {
  background-color: #dc3545;
  color: white;
}

.remove-button:hover {
  background-color: #c82333;
}

.variable-editor-empty {
  color: #666;
  font-style: italic;
  padding: 10px 0;
}
*/
