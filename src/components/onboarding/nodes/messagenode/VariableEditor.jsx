/**
 * @file VariableEditor.jsx
 * @description Componente para editar variables de un mensaje en el editor de flujos.
 * @author PLUBOT Team
 * @version 3.0.0
 */

import React, { useState, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import { Plus, X, Save, CornerDownRight } from 'lucide-react';

/**
 * Componente para editar variables de un mensaje
 */
const VariableEditor = memo(({ 
  nodeId,
  variables = [], 
  onAddVariable,
  onUpdateVariable,
  onDeleteVariable,
  isUltraPerformanceMode = false 
}) => {
  // Estados locales
  const [newVarName, setNewVarName] = useState('');
  const [newVarValue, setNewVarValue] = useState('');
  const [editingIndex, setEditingIndex] = useState(-1);
  const [editingName, setEditingName] = useState('');
  const [editingValue, setEditingValue] = useState('');

  /**
   * Maneja la adición de una nueva variable
   */
  const handleAddNewVariable = useCallback(() => {
    if (!newVarName.trim()) return;
    
    onAddVariable({
      name: newVarName.trim(),
      value: newVarValue.trim()
    });
    
    // Reiniciar campos
    setNewVarName('');
    setNewVarValue('');
  }, [newVarName, newVarValue, onAddVariable]);

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
    
    if (!editingName.trim()) {
      // Si el nombre está vacío, eliminamos la variable
      onDeleteVariable(editingIndex);
    } else {
      // Actualizamos la variable
      onUpdateVariable(editingIndex, {
        name: editingName.trim(),
        value: editingValue.trim()
      });
    }
    
    // Reiniciar estado de edición
    setEditingIndex(-1);
    setEditingName('');
    setEditingValue('');
  }, [editingIndex, editingName, editingValue, onUpdateVariable, onDeleteVariable]);

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
  const handleDeleteVariable = useCallback((index) => {
    onDeleteVariable(index);
  }, [onDeleteVariable]);

  /**
   * Maneja atajos de teclado en la edición de variables
   */
  const handleKeyDown = useCallback((e, isNew = false) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isNew) {
        handleAddNewVariable();
      } else {
        saveEditing();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (isNew) {
        setNewVarName('');
        setNewVarValue('');
      } else {
        cancelEditing();
      }
    }
  }, [handleAddNewVariable, saveEditing, cancelEditing]);

  // En modo ultra rendimiento, mostramos una interfaz simplificada
  if (isUltraPerformanceMode) {
    return (
      <div className="message-node__variables-ultra">
        <div className="message-node__variables-count">
          {variables.length} variable(s)
        </div>
      </div>
    );
  }

  return (
    <div 
      className="message-node__variables-editor"
      role="region"
      aria-label="Editor de variables"
    >
      <h4 className="message-node__section-title">Variables</h4>
      
      {/* Lista de variables existentes */}
      {variables.length > 0 && (
        <div 
          className="message-node__variables-list"
          role="list"
        >
          {variables.map((variable, index) => (
            <div 
              key={`var-${index}`}
              className="message-node__variable-item"
              role="listitem"
            >
              {editingIndex === index ? (
                // Modo edición
                <div className="message-node__variable-edit">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Nombre"
                    className="message-node__variable-input nodrag"
                    aria-label="Nombre de variable"
                    autoFocus
                    onMouseDown={(e) => e.stopPropagation()}
                  />
                  <input
                    type="text"
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Valor"
                    className="message-node__variable-input nodrag"
                    aria-label="Valor de variable"
                    onMouseDown={(e) => e.stopPropagation()}
                  />
                  <div className="message-node__variable-actions">
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="message-node__variable-btn message-node__variable-btn--cancel"
                      aria-label="Cancelar edición"
                      title="Cancelar"
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={saveEditing} onMouseDown={(e) => e.stopPropagation()}
                      className="message-node__variable-btn message-node__variable-btn--save"
                      aria-label="Guardar cambios"
                      title="Guardar"
                    >
                      <Save size={14} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ) : (
                // Modo visualización
                <div className="message-node__variable-view">
                  <div 
                    className="message-node__variable-info"
                    onClick={() => startEditing(index, variable)}
                  >
                    <span className="message-node__variable-name">{variable.name}</span>
                    <span className="message-node__variable-arrow">
                      <CornerDownRight size={12} aria-hidden="true" />
                    </span>
                    <span className="message-node__variable-value">
                      {variable.value || '(vacío)'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteVariable(index)}
                    className="message-node__variable-btn message-node__variable-btn--delete"
                    aria-label={`Eliminar variable ${variable.name}`}
                    title="Eliminar"
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Formulario para agregar nueva variable */}
      <div className="message-node__add-variable">
        <div className="message-node__variable-inputs">
          <input
            type="text"
            value={newVarName}
            onChange={(e) => setNewVarName(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, true)}
            placeholder="Nombre"
            className="message-node__variable-input nodrag"
            aria-label="Nuevo nombre de variable"
            onMouseDown={(e) => e.stopPropagation()}
          />
          <input
            type="text"
            value={newVarValue}
            onChange={(e) => setNewVarValue(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, true)}
            placeholder="Valor"
            className="message-node__variable-input nodrag"
            aria-label="Nuevo valor de variable"
            onMouseDown={(e) => e.stopPropagation()}
          />
        </div>
        <button
          type="button"
          onClick={handleAddNewVariable} onMouseDown={(e) => e.stopPropagation()}
          disabled={!newVarName.trim()}
          className="message-node__add-btn"
          aria-label="Agregar variable"
          title="Agregar variable"
        >
          <Plus size={14} aria-hidden="true" />
          <span>Agregar</span>
        </button>
      </div>
    </div>
  );
});

VariableEditor.displayName = 'VariableEditor';

VariableEditor.propTypes = {
  nodeId: PropTypes.string.isRequired,
  variables: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      value: PropTypes.string
    })
  ),
  onAddVariable: PropTypes.func.isRequired,
  onUpdateVariable: PropTypes.func.isRequired,
  onDeleteVariable: PropTypes.func.isRequired,
  isUltraPerformanceMode: PropTypes.bool
};

export default VariableEditor;
