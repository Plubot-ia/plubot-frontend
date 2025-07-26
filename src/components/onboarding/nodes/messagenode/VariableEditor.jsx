/**
 * @file VariableEditor.jsx
 * @description Componente para editar variables de un mensaje en el editor de flujos.
 * @author PLUBOT Team
 * @version 3.0.0
 */

import { X, Save, CornerDownRight } from 'lucide-react';
import PropTypes from 'prop-types';
import { memo, useCallback, useState } from 'react';

import './VariableEditor.css';

// Helper para renderizar modo de edición
function _renderEditingMode({
  editingName,
  setEditingName,
  editingValue,
  setEditingValue,
  handleKeyDown,
  cancelEditing,
  saveEditing,
}) {
  return (
    <div className='message-node__variable-edit'>
      <input
        type='text'
        value={editingName}
        onChange={(event_) => setEditingName(event_.target.value)}
        onKeyDown={handleKeyDown}
        placeholder='Nombre'
        className='message-node__variable-input nodrag'
        aria-label='Nombre de variable'
        onMouseDown={(event_) => event_.stopPropagation()}
      />
      <input
        type='text'
        value={editingValue}
        onChange={(event_) => setEditingValue(event_.target.value)}
        onKeyDown={handleKeyDown}
        placeholder='Valor'
        className='message-node__variable-input nodrag'
        aria-label='Valor de variable'
        onMouseDown={(event_) => event_.stopPropagation()}
      />
      <div className='message-node__variable-actions'>
        <button
          type='button'
          onClick={cancelEditing}
          className='message-node__variable-btn message-node__variable-btn--cancel'
          aria-label='Cancelar edición'
          title='Cancelar'
        >
          <X size={14} aria-hidden='true' />
        </button>
        <button
          type='button'
          onClick={saveEditing}
          onMouseDown={(event_) => event_.stopPropagation()}
          className='message-node__variable-btn message-node__variable-btn--save'
          aria-label='Guardar cambios'
          title='Guardar'
        >
          <Save size={14} aria-hidden='true' />
        </button>
      </div>
    </div>
  );
}

// Helper para renderizar modo visualización de variable
function _renderViewMode({
  variable,
  index,
  startEditing,
  handleDeleteVariable,
}) {
  return (
    <div className='message-node__variable-view'>
      <div
        className='message-node__variable-info'
        onClick={() => startEditing(index, variable)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            startEditing(index, variable);
          }
        }}
        role='button'
        tabIndex={0}
      >
        <span className='message-node__variable-name'>{variable.name}</span>
        <span className='message-node__variable-arrow'>
          <CornerDownRight size={12} aria-hidden='true' />
        </span>
        <span className='message-node__variable-value'>
          {variable.value || '(vacío)'}
        </span>
      </div>
      <button
        type='button'
        onClick={() => handleDeleteVariable(index)}
        className='message-node__variable-btn message-node__variable-btn--delete'
        aria-label={`Eliminar variable ${variable.name}`}
        title='Eliminar'
      >
        <X size={14} aria-hidden='true' />
      </button>
    </div>
  );
}

// Helper para renderizar lista de variables existentes
function _renderVariablesList({
  variables,
  editingIndex,
  editingName,
  setEditingName,
  editingValue,
  setEditingValue,
  handleKeyDown,
  cancelEditing,
  saveEditing,
  startEditing,
  handleDeleteVariable,
}) {
  if (!variables || variables.length === 0) {
    return (
      <div className='message-node__variables-empty'>
        <p>No hay variables definidas</p>
      </div>
    );
  }

  return (
    <div className='message-node__variables-list'>
      {variables.map((variable, index) => (
        <div key={variable.name} className='message-node__variable'>
          {editingIndex === index
            ? _renderEditingMode({
                editingName,
                setEditingName,
                editingValue,
                setEditingValue,
                handleKeyDown,
                cancelEditing,
                saveEditing,
              })
            : _renderViewMode({
                variable,
                index,
                startEditing,
                handleDeleteVariable,
              })}
        </div>
      ))}
    </div>
  );
}

// Helper para renderizar formulario de nueva variable
function _renderNewVariableForm({
  newVariableName,
  setNewVariableName,
  newVariableValue,
  setNewVariableValue,
  handleKeyDown,
  handleAddNewVariable,
}) {
  return (
    <div className='message-node__new-variable'>
      <h5 className='message-node__subsection-title'>Agregar Variable</h5>
      <div className='message-node__variable-form'>
        <input
          type='text'
          value={newVariableName}
          onChange={(event_) => setNewVariableName(event_.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='Nombre de variable'
          className='message-node__variable-input nodrag'
          aria-label='Nombre de nueva variable'
          onMouseDown={(event_) => event_.stopPropagation()}
        />
        <input
          type='text'
          value={newVariableValue}
          onChange={(event_) => setNewVariableValue(event_.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='Valor inicial'
          className='message-node__variable-input nodrag'
          aria-label='Valor inicial de nueva variable'
          onMouseDown={(event_) => event_.stopPropagation()}
        />
        <button
          type='button'
          onClick={handleAddNewVariable}
          disabled={!newVariableName.trim()}
          className='message-node__variable-btn message-node__variable-btn--add'
          title='Agregar variable'
          aria-label='Agregar nueva variable'
        >
          <Save size={14} />
          Agregar
        </button>
      </div>
    </div>
  );
}

// Helper para renderizar modo ultra rendimiento
function _renderUltraPerformanceMode(variables) {
  return (
    <div className='message-node__variables-ultra'>
      <div className='message-node__variables-count'>
        {variables.length} variable(s)
      </div>
    </div>
  );
}

/**
 * Componente para editar variables de un mensaje
 */
const VariableEditor = memo(
  ({
    nodeId,
    variables = [],
    onAddVariable,
    onUpdateVariable,
    onDeleteVariable,
    isUltraPerformanceMode = false,
  }) => {
    // Estados locales
    const [newVariableName, setNewVariableName] = useState('');
    const [newVariableValue, setNewVariableValue] = useState('');
    const [editingIndex, setEditingIndex] = useState(-1);
    const [editingName, setEditingName] = useState('');
    const [editingValue, setEditingValue] = useState('');

    /**
     * Maneja la adición de una nueva variable
     */
    const handleAddNewVariable = useCallback(() => {
      if (!newVariableName.trim()) return;

      onAddVariable({
        name: newVariableName.trim(),
        value: newVariableValue.trim(),
      });

      // Reiniciar campos
      setNewVariableName('');
      setNewVariableValue('');
    }, [newVariableName, newVariableValue, onAddVariable]);

    /**
     * Inicia la edición de una variable existente
     */
    const startEditing = useCallback((index, variable) => {
      setEditingIndex(index);
      setEditingName(variable.name);
      setEditingValue(variable.value || '');
    }, []);

    /**
     * Guarda los cambios a una variable existente
     */
    const saveEditing = useCallback(() => {
      if (editingIndex === -1) return;

      if (editingName.trim()) {
        // Actualizamos la variable
        onUpdateVariable(editingIndex, {
          name: editingName.trim(),
          value: editingValue.trim(),
        });
      } else {
        // Si el nombre está vacío, eliminamos la variable
        onDeleteVariable(editingIndex);
      }

      // Reiniciar estado de edición
      setEditingIndex(-1);
      setEditingName('');
      setEditingValue('');
    }, [
      editingIndex,
      editingName,
      editingValue,
      onUpdateVariable,
      onDeleteVariable,
    ]);

    /**
     * Cancela la edición actual
     */
    const cancelEditing = useCallback(() => {
      setEditingIndex(-1);
      setEditingName('');
      setEditingValue('');
    }, []);

    /**
     * Maneja la eliminación de una variable
     */
    const handleDeleteVariable = useCallback(
      (index) => {
        onDeleteVariable(index);
      },
      [onDeleteVariable],
    );

    /**
     * Maneja atajos de teclado en la edición de variables
     */
    const handleKeyDown = useCallback(
      (event_, isNew = false) => {
        if (event_.key === 'Enter' && !event_.shiftKey) {
          event_.preventDefault();
          if (isNew) {
            handleAddNewVariable();
          } else {
            saveEditing();
          }
        } else if (event_.key === 'Escape') {
          event_.preventDefault();
          if (isNew) {
            setNewVariableName('');
            setNewVariableValue('');
          } else {
            cancelEditing();
          }
        }
      },
      [handleAddNewVariable, saveEditing, cancelEditing],
    );

    // En modo ultra rendimiento, mostramos una interfaz simplificada
    if (isUltraPerformanceMode) {
      return _renderUltraPerformanceMode(variables);
    }

    return (
      <div
        className='message-node__variables-editor'
        role='region'
        aria-label='Editor de variables'
      >
        <h4 className='message-node__section-title'>Variables</h4>

        {/* Lista de variables existentes */}
        {_renderVariablesList({
          variables,
          editingIndex,
          editingName,
          setEditingName,
          editingValue,
          setEditingValue,
          handleKeyDown,
          cancelEditing,
          saveEditing,
          startEditing,
          handleDeleteVariable,
        })}

        {/* Formulario para agregar nueva variable */}
        {_renderNewVariableForm({
          newVariableName,
          setNewVariableName,
          newVariableValue,
          setNewVariableValue,
          handleKeyDown,
          handleAddNewVariable,
        })}
      </div>
    );
  },
);

VariableEditor.displayName = 'VariableEditor';

VariableEditor.propTypes = {
  nodeId: PropTypes.string.isRequired,
  variables: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      value: PropTypes.string,
    }),
  ),
  onAddVariable: PropTypes.func.isRequired,
  onUpdateVariable: PropTypes.func.isRequired,
  onDeleteVariable: PropTypes.func.isRequired,
  isUltraPerformanceMode: PropTypes.bool,
};

export default VariableEditor;
