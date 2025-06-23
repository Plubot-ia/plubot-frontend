import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { Handle, Position } from 'reactflow';
import PropTypes from 'prop-types';
import { MoreHorizontal, Edit2, X, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { shallow } from 'zustand/shallow';

import { usePermissions } from '@/hooks/usePermissions';

import useFlowStore from '@/stores/useFlowStore';
import './ActionNode.css';

const ACTION_TYPES = [
  { value: 'sendEmail', label: 'Enviar Correo', icon: '📧' },
  { value: 'saveData', label: 'Guardar Datos', icon: '💾' },
  { value: 'sendNotification', label: 'Enviar Notificación', icon: '🔔' },
  { value: 'apiCall', label: 'Llamada a API', icon: '🌐' },
  { value: 'transformData', label: 'Transformar Datos', icon: '🔄' },
  { value: 'conditional', label: 'Ejecutar Condicional', icon: '⚙️' },
  { value: 'delay', label: 'Aplicar Retraso', icon: '⏱️' },
  { value: 'webhook', label: 'Webhook', icon: '🔗' },
];

const ParameterFields = memo(({ actionType, parameters, onParameterChange }) => {
  const inputRefs = useRef({});

  const renderInputField = useCallback(
    (key, placeholder, type = 'text', options = null) => {
      const adjustHeight = (ref) => {
        if (ref.current) {
          ref.current.style.height = 'auto';
          ref.current.style.height = `${Math.min(ref.current.scrollHeight, 200)}px`;
        }
      };

      return (
        <div key={key} className="parameter-field">
          <label htmlFor={`param-${key}`} className="parameter-label">
            {placeholder}
          </label>
          {type === 'select' && options ? (
            <select
              id={`param-${key}`}
              value={parameters[key] || ''}
              onChange={(e) => onParameterChange(key, e.target.value)}
              className="action-node-input parameter-select"
            >
              <option value="">Selecciona una opción...</option>
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : type === 'textarea' ? (
            <textarea
              ref={(el) => (inputRefs.current[key] = el)}
              id={`param-${key}`}
              value={parameters[key] || ''}
              onChange={(e) => {
                onParameterChange(key, e.target.value);
                adjustHeight({ current: inputRefs.current[key] });
              }}
              onFocus={() => adjustHeight({ current: inputRefs.current[key] })}
              placeholder={placeholder}
              className="action-node-input parameter-textarea"
              rows={3}
              style={{ minHeight: '60px', maxHeight: '200px', overflowY: 'auto' }}
            />
          ) : (
            <input
              id={`param-${key}`}
              type={type}
              value={parameters[key] || ''}
              onChange={(e) =>
                onParameterChange(key, type === 'number' ? Number(e.target.value) : e.target.value)
              }
              placeholder={placeholder}
              className="action-node-input"
              style={{ minHeight: '30px' }}
            />
          )}
        </div>
      );
    },
    [parameters, onParameterChange]
  );

  switch (actionType) {
    case 'sendEmail':
      return (
        <div className="parameter-container">
          {renderInputField('to', 'Destinatario')}
          {renderInputField('cc', 'CC')}
          {renderInputField('subject', 'Asunto')}
          {renderInputField('template', 'Plantilla', 'select', [
            { value: 'welcome', label: 'Bienvenida' },
            { value: 'notification', label: 'Notificación' },
            { value: 'reminder', label: 'Recordatorio' },
            { value: 'custom', label: 'Personalizada' },
          ])}
          {parameters.template === 'custom' && renderInputField('body', 'Contenido', 'textarea')}
        </div>
      );
    case 'saveData':
      return (
        <div className="parameter-container">
          {renderInputField('key', 'Clave de datos')}
          {renderInputField('value', 'Valor')}
          {renderInputField('dataType', 'Tipo de dato', 'select', [
            { value: 'string', label: 'Texto' },
            { value: 'number', label: 'Número' },
            { value: 'boolean', label: 'Booleano' },
            { value: 'object', label: 'Objeto' },
          ])}
          {renderInputField('storage', 'Almacenamiento', 'select', [
            { value: 'session', label: 'Sesión' },
            { value: 'local', label: 'Local' },
            { value: 'database', label: 'Base de datos' },
          ])}
        </div>
      );
    case 'sendNotification':
      return (
        <div className="parameter-container">
          {renderInputField('message', 'Mensaje')}
          {renderInputField('type', 'Tipo', 'select', [
            { value: 'info', label: 'Información' },
            { value: 'success', label: 'Éxito' },
            { value: 'warning', label: 'Advertencia' },
            { value: 'error', label: 'Error' },
          ])}
          {renderInputField('duration', 'Duración (seg)', 'number')}
        </div>
      );
    case 'apiCall':
      return (
        <div className="parameter-container">
          {renderInputField('url', 'URL')}
          {renderInputField('method', 'Método', 'select', [
            { value: 'GET', label: 'GET' },
            { value: 'POST', label: 'POST' },
            { value: 'PUT', label: 'PUT' },
            { value: 'DELETE', label: 'DELETE' },
          ])}
          {renderInputField('headers', 'Encabezados', 'textarea')}
          {renderInputField('body', 'Cuerpo', 'textarea')}
        </div>
      );
    case 'transformData':
      return (
        <div className="parameter-container">
          {renderInputField('inputVariable', 'Variable de entrada')}
          {renderInputField('transformation', 'Transformación', 'select', [
            { value: 'uppercase', label: 'Convertir a mayúsculas' },
            { value: 'lowercase', label: 'Convertir a minúsculas' },
            { value: 'number', label: 'Convertir a número' },
            { value: 'json', label: 'Formato JSON' },
            { value: 'custom', label: 'Personalizada' },
          ])}
          {parameters.transformation === 'custom' &&
            renderInputField('formula', 'Fórmula personalizada', 'textarea')}
          {renderInputField('outputVariable', 'Variable de salida')}
        </div>
      );
    case 'conditional':
      return (
        <div className="parameter-container">
          {renderInputField('variable', 'Variable a evaluar')}
          {renderInputField('operator', 'Operador', 'select', [
            { value: 'equal', label: 'Es igual a' },
            { value: 'notEqual', label: 'No es igual a' },
            { value: 'contains', label: 'Contiene' },
            { value: 'greater', label: 'Mayor que' },
            { value: 'less', label: 'Menor que' },
          ])}
          {renderInputField('value', 'Valor de comparación')}
        </div>
      );
    case 'delay':
      return (
        <div className="parameter-container">
          {renderInputField('duration', 'Duración', 'number')}
          {renderInputField('unit', 'Unidad', 'select', [
            { value: 'milliseconds', label: 'Milisegundos' },
            { value: 'seconds', label: 'Segundos' },
            { value: 'minutes', label: 'Minutos' },
            { value: 'hours', label: 'Horas' },
          ])}
        </div>
      );
    case 'webhook':
      return (
        <div className="parameter-container">
          {renderInputField('endpoint', 'Punto de conexión')}
          {renderInputField('event', 'Evento')}
          {renderInputField('secretKey', 'Clave secreta')}
        </div>
      );
    default:
      return null;
  }
});

ParameterFields.displayName = 'ParameterFields';

ParameterFields.propTypes = {
  actionType: PropTypes.string.isRequired,
  parameters: PropTypes.object.isRequired,
  onParameterChange: PropTypes.func.isRequired,
};



const ActionNodeRoot = ({ isConnectable = true, selected = false, id }) => {
  const nodeRef = useRef(null);
  const textareaRef = useRef(null);
  const menuRef = useRef(null);
  const { permissions = {} } = usePermissions() || {};

  // Selector granular para optimizar renders y evitar ciclos infinitos.
  const selector = useCallback(
    (state) => {
      const node = state.nodes.find((n) => n.id === id);
      return {
        description: node?.data?.description || '',
        actionType: node?.data?.actionType || '',
        parameters: node?.data?.parameters || {},
        isCollapsed: node?.data?.isCollapsed || false,
        lodLevel: node?.data?.lodLevel,
      };
    },
    [id]
  );

  const { description, actionType, parameters, isCollapsed, lodLevel } = useFlowStore(selector, shallow);
  const updateNode = useFlowStore((state) => state.updateNode);
  const deleteNode = useFlowStore((state) => state.deleteNode);

  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [editActionType, setEditActionType] = useState('');
  const [editParameters, setEditParameters] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [currentWidth, setCurrentWidth] = useState(300);
  const [currentHeight, setCurrentHeight] = useState('auto');

  // INSTRUMENTATION:  // Log de renderizado para depuración de rendimiento
  useMemo(() => {
    const memoStatus = nodeRef.current ? 're-render' : 'initial render';
    // Log de render eliminado
  }, [id, lodLevel, description, actionType, isSaving, isCollapsed]);

  const handleSaveChanges = useCallback(() => {
    if (!permissions.canEdit) return;
    setIsSaving(true);
    updateNode(id, {
      description: editDescription,
      actionType: editActionType,
      parameters: editParameters,
    });
    setIsEditing(false);
  }, [permissions.canEdit, id, updateNode, editDescription, editActionType, editParameters]);

  const handleCancelEditing = useCallback(() => {
    setIsEditing(false);
  }, []);

  const startEditing = useCallback(() => {
    if (!permissions.canEdit || isEditing) return;
    setEditDescription(description);
    setEditActionType(actionType);
    setEditParameters(parameters);
    setIsEditing(true);
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    }, 10);
  }, [permissions.canEdit, isEditing, description, actionType, parameters]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSaveChanges();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancelEditing();
      }
    },
    [handleSaveChanges, handleCancelEditing]
  );

  const handleParameterChange = useCallback((key, value) => {
    setEditParameters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleCollapse = useCallback(
    (e) => {
      e.stopPropagation();
      updateNode(id, { isCollapsed: !isCollapsed });
    },
    [id, isCollapsed, updateNode]
  );

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  }, []);

  useEffect(() => {
    if (isSaving) {
      const timer = setTimeout(() => setIsSaving(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [isSaving]);

  const contextMenuItems = useMemo(
    () => [
      {
        label: 'Editar',
        icon: <Edit2 size={14} />,
        action: startEditing,
        disabled: !permissions.canEdit || isEditing,
      },
      {
        label: 'Duplicar',
        icon: 'copy',
        action: () => {},
        disabled: !permissions.canEdit,
      },
      {
        label: 'Eliminar',
        icon: <X size={14} />,
        action: () => deleteNode(id),
        disabled: !permissions.canDelete,
        isDestructive: true,
      },
    ],
    [startEditing, permissions.canEdit, permissions.canDelete, id, deleteNode, isEditing]
  );

  return (
    <div
      ref={nodeRef}
      className={`action-node ${selected ? 'selected' : ''} ${isEditing ? 'editing' : ''} ${isHovered ? 'hovered' : ''}`}
      onDoubleClick={startEditing}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: isCollapsed ? 180 : currentWidth,
        height: currentHeight,
        transition: 'width 0.2s ease, height 0.2s ease',
        opacity: isSaving ? 0.7 : 1,
      }}
      role="button"
      tabIndex={0}
      aria-label={`${ACTION_TYPES.find((at) => at.value === actionType)?.label || 'Acción'}: ${
        description || 'Sin descripción'
      }`}
    >
      <Handle type="target" position={Position.Top} isConnectable={isConnectable && !isEditing} className="action-node-handle" />

      <div className="action-node-header">
        <span className="action-node-icon">
          {ACTION_TYPES.find((at) => at.value === (isEditing ? editActionType : actionType))?.icon || '⚙️'}
        </span>
        <h5 className="action-node-title">
          {ACTION_TYPES.find((at) => at.value === (isEditing ? editActionType : actionType))?.label || 'Acción'}
        </h5>
        <div className="action-node-controls">
          <button
            onClick={toggleCollapse}
            className="action-node-control-button"
            aria-label={isCollapsed ? 'Expandir' : 'Colapsar'}
          >
            {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
          <button onClick={handleContextMenu} className="action-node-control-button" aria-label="Más opciones">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="action-node-content">
          {isEditing ? (
            <div className="action-node-edit-view" onKeyDown={handleKeyDown}>
              <textarea
                ref={textareaRef}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Añade una descripción clara..."
                className="action-node-textarea"
              />
              <select
                value={editActionType}
                onChange={(e) => setEditActionType(e.target.value)}
                className="action-node-select"
              >
                <option value="">Selecciona un tipo de acción...</option>
                {ACTION_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
              <ParameterFields
                actionType={editActionType}
                parameters={editParameters}
                onParameterChange={handleParameterChange}
              />
              <div className="action-node-edit-buttons">
                <button onClick={handleCancelEditing} className="action-node-button-cancel">
                  Cancelar
                </button>
                <button onClick={handleSaveChanges} className="action-node-button-save">
                  Guardar
                </button>
              </div>
            </div>
          ) : (
            <p className="action-node-description" onDoubleClick={startEditing}>
              {description || 'Haz doble clic para editar...'}
            </p>
          )}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable && !isEditing} className="action-node-handle" />

      {showContextMenu && (
        <ContextMenu
          ref={menuRef}
          items={contextMenuItems}
          position={contextMenuPosition}
          onClose={() => setShowContextMenu(false)}
        />
      )}
    </div>
  );
};

ActionNodeRoot.displayName = 'ActionNode';

ActionNodeRoot.propTypes = {
  isConnectable: PropTypes.bool,
  selected: PropTypes.bool,
  id: PropTypes.string.isRequired,
};

const arePropsEqual = (prevProps, nextProps) => {
  return (
    prevProps.selected === nextProps.selected &&
    prevProps.isConnectable === nextProps.isConnectable
  );
};

const ActionNode = memo(ActionNodeRoot, arePropsEqual);

export default ActionNode;