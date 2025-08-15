/**
 * @file MemoryNodeConfig.tsx
 * @description Componente de configuración para MemoryNode
 */

import React, { useState, useCallback, useEffect } from 'react';

import { MEMORY_ACTIONS, DEFAULT_MEMORY_DATA, PLACEHOLDERS, CHAR_LIMITS } from './constants';
import type { MemoryNodeConfigProps, MemoryAction } from './types';
import { validateMemoryNodeData, sanitizeKey } from './utils';

/**
 * Componente de configuración del nodo de memoria
 */
const MemoryNodeConfig: React.FC<MemoryNodeConfigProps> = ({ data, onSave, onCancel }) => {
  // Estado local del formulario
  const [formData, setFormData] = useState({
    action: data.action ?? DEFAULT_MEMORY_DATA.action,
    key: data.key ?? '',
    value: data.value ?? '',
    description: data.description ?? '',
    outputVariable: data.outputVariable ?? DEFAULT_MEMORY_DATA.outputVariable,
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [touched, setTouched] = useState({
    key: false,
    value: false,
  });

  // Validar datos cuando cambian
  useEffect(() => {
    if (touched.key || touched.value) {
      const validation = validateMemoryNodeData(formData);
      setErrors(validation.errors);
    }
  }, [formData, touched]);

  // Manejadores de cambio
  const handleActionChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newAction = e.target.value as MemoryAction;
    setFormData((prev) => ({
      ...prev,
      action: newAction,
      // Limpiar valor si no es necesario
      value: newAction !== 'set' ? '' : prev.value,
    }));
  }, []);

  const handleKeyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const rawKey = e.target.value;
    const sanitized = sanitizeKey(rawKey);
    setFormData((prev) => ({ ...prev, key: sanitized }));
    setTouched((prev) => ({ ...prev, key: true }));
  }, []);

  const handleValueChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, value: e.target.value }));
    setTouched((prev) => ({ ...prev, value: true }));
  }, []);

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, description: e.target.value }));
  }, []);

  const handleOutputVariableChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeKey(e.target.value);
    setFormData((prev) => ({ ...prev, outputVariable: sanitized }));
  }, []);

  // Guardar configuración
  const handleSave = useCallback(() => {
    const validation = validateMemoryNodeData(formData);
    if (validation.isValid) {
      onSave({
        ...formData,
        isEditing: false,
      });
    } else {
      setErrors(validation.errors);
      setTouched({ key: true, value: true });
    }
  }, [formData, onSave]);

  const actionConfig = MEMORY_ACTIONS[formData.action];

  return (
    <div
      style={{
        padding: '16px',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        minWidth: '320px',
      }}
    >
      <h3
        style={{
          margin: '0 0 16px 0',
          fontSize: '16px',
          fontWeight: 600,
          color: '#212529',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span>🧠</span>
        Configurar Nodo de Memoria
      </h3>

      {/* Selector de acción */}
      <div style={{ marginBottom: '12px' }}>
        <label
          htmlFor='memory-action-select'
          style={{
            display: 'block',
            marginBottom: '4px',
            fontSize: '13px',
            fontWeight: 500,
            color: '#495057',
          }}
        >
          Acción
        </label>
        <select
          id='memory-action-select'
          value={formData.action}
          onChange={handleActionChange}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ced4da',
            borderRadius: '4px',
            fontSize: '14px',
            backgroundColor: '#fff',
            cursor: 'pointer',
          }}
        >
          {Object.entries(MEMORY_ACTIONS).map(([key, config]) => (
            <option key={key} value={key}>
              {config.icon} {config.label} - {config.description}
            </option>
          ))}
        </select>
      </div>

      {/* Campo de clave */}
      <div style={{ marginBottom: '12px' }}>
        <label
          htmlFor='memory-key-input'
          style={{
            display: 'block',
            marginBottom: '4px',
            fontSize: '13px',
            fontWeight: 500,
            color: '#495057',
          }}
        >
          Clave <span style={{ color: '#dc3545' }}>*</span>
        </label>
        <input
          id='memory-key-input'
          type='text'
          value={formData.key}
          onChange={handleKeyChange}
          placeholder={PLACEHOLDERS.key}
          maxLength={CHAR_LIMITS.key}
          style={{
            width: '100%',
            padding: '8px',
            border: `1px solid ${touched.key && errors.length > 0 ? '#dc3545' : '#ced4da'}`,
            borderRadius: '4px',
            fontSize: '14px',
            fontFamily: 'monospace',
          }}
        />
        <div
          style={{
            marginTop: '2px',
            fontSize: '11px',
            color: '#6c757d',
          }}
        >
          {formData.key.length}/{CHAR_LIMITS.key} caracteres
        </div>
      </div>

      {/* Campo de valor (solo para set) */}
      {formData.action === 'set' && (
        <div style={{ marginBottom: '12px' }}>
          <label
            htmlFor='memory-value-textarea'
            style={{
              display: 'block',
              marginBottom: '4px',
              fontSize: '13px',
              fontWeight: 500,
              color: '#495057',
            }}
          >
            Valor <span style={{ color: '#dc3545' }}>*</span>
          </label>
          <textarea
            id='memory-value-textarea'
            value={formData.value}
            onChange={handleValueChange}
            placeholder={PLACEHOLDERS.value}
            maxLength={CHAR_LIMITS.value}
            rows={3}
            style={{
              width: '100%',
              padding: '8px',
              border: `1px solid ${touched.value && errors.length > 0 ? '#dc3545' : '#ced4da'}`,
              borderRadius: '4px',
              fontSize: '14px',
              resize: 'vertical',
            }}
          />
          <div
            style={{
              marginTop: '2px',
              fontSize: '11px',
              color: '#6c757d',
            }}
          >
            {formData.value.length}/{CHAR_LIMITS.value} caracteres
          </div>
        </div>
      )}

      {/* Variable de salida (solo para get) */}
      {formData.action === 'get' && (
        <div style={{ marginBottom: '12px' }}>
          <label
            htmlFor='memory-output-variable'
            style={{
              display: 'block',
              marginBottom: '4px',
              fontSize: '13px',
              fontWeight: 500,
              color: '#495057',
            }}
          >
            Variable de salida
          </label>
          <input
            id='memory-output-variable'
            type='text'
            value={formData.outputVariable}
            onChange={handleOutputVariableChange}
            placeholder={PLACEHOLDERS.outputVariable}
            maxLength={CHAR_LIMITS.key}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '14px',
              fontFamily: 'monospace',
            }}
          />
          <div
            style={{
              marginTop: '2px',
              fontSize: '11px',
              color: '#6c757d',
            }}
          >
            Donde se guardará el valor obtenido
          </div>
        </div>
      )}

      {/* Campo de descripción */}
      <div style={{ marginBottom: '16px' }}>
        <label
          htmlFor='memory-description'
          style={{
            display: 'block',
            marginBottom: '4px',
            fontSize: '13px',
            fontWeight: 500,
            color: '#495057',
          }}
        >
          Descripción (opcional)
        </label>
        <input
          id='memory-description'
          type='text'
          value={formData.description}
          onChange={handleDescriptionChange}
          placeholder={PLACEHOLDERS.description}
          maxLength={CHAR_LIMITS.description}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ced4da',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        />
      </div>

      {/* Mensajes de error */}
      {errors.length > 0 && (
        <div
          style={{
            marginBottom: '12px',
            padding: '8px',
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '4px',
            color: '#721c24',
            fontSize: '13px',
          }}
        >
          {errors.map((error) => (
            <div key={error}>• {error}</div>
          ))}
        </div>
      )}

      {/* Información de la acción */}
      <div
        style={{
          marginBottom: '16px',
          padding: '12px',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px',
          fontSize: '13px',
          color: '#495057',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '4px',
            fontWeight: 500,
            color: actionConfig.color,
          }}
        >
          <span style={{ fontSize: '16px' }}>{actionConfig.icon}</span>
          <span>{actionConfig.label}</span>
        </div>
        <div>{actionConfig.description}</div>
      </div>

      {/* Botones de acción */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'flex-end',
        }}
      >
        <button
          onClick={onCancel}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#5a6268')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#6c757d')}
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={errors.length > 0}
          style={{
            padding: '8px 16px',
            backgroundColor: errors.length > 0 ? '#e9ecef' : '#28a745',
            color: errors.length > 0 ? '#6c757d' : '#ffffff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: errors.length > 0 ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            if (errors.length === 0) {
              e.currentTarget.style.backgroundColor = '#218838';
            }
          }}
          onMouseLeave={(e) => {
            if (errors.length === 0) {
              e.currentTarget.style.backgroundColor = '#28a745';
            }
          }}
        >
          Guardar
        </button>
      </div>
    </div>
  );
};

export default React.memo(MemoryNodeConfig);
