import { MoreHorizontal, Edit2, X, ChevronDown, ChevronUp } from 'lucide-react';
import PropTypes from 'prop-types';
import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { Handle } from 'reactflow';

import { usePermissions } from '@/hooks/usePermissions';
import useFlowStore from '@/stores/use-flow-store';

import ContextMenu from '../../ui/context-menu';

import './ActionNode.css';

const areActionNodePropertiesEqual = (previousProperties, nextProperties) => {
  if (
    previousProperties.selected !== nextProperties.selected ||
    previousProperties.isConnectable !== nextProperties.isConnectable
  ) {
    return false;
  }

  return (
    JSON.stringify(previousProperties.data) ===
    JSON.stringify(nextProperties.data)
  );
};

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

const ParameterFields = memo(
  ({ actionType, parameters, onParameterChange }) => {
    const inputReferences = useRef({});

    const renderInputField = useCallback(
      (key, placeholder, type = 'text', options) => {
        const adjustHeight = (reference) => {
          if (reference.current) {
            reference.current.style.height = 'auto';
            reference.current.style.height = `${Math.min(reference.current.scrollHeight, 200)}px`;
          }
        };

        return (
          <div key={key} className='parameter-field'>
            <label htmlFor={`param-${key}`} className='parameter-label'>
              {placeholder}
            </label>
            {(() => {
              if (type === 'select' && options) {
                return (
                  <select
                    id={`param-${key}`}
                    value={parameters[key] || ''}
                    onChange={(event) =>
                      onParameterChange(key, event.target.value)
                    }
                    className='action-node-input parameter-select'
                  >
                    <option value=''>Selecciona una opción&hellip;</option>
                    {options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                );
              }
              if (type === 'textarea') {
                return (
                  <textarea
                    ref={(element) => {
                      inputReferences.current[key] = element;
                    }}
                    id={`param-${key}`}
                    value={parameters[key] || ''}
                    onChange={(event) => {
                      onParameterChange(key, event.target.value);
                      adjustHeight({ current: inputReferences.current[key] });
                    }}
                    onFocus={() =>
                      adjustHeight({ current: inputReferences.current[key] })
                    }
                    placeholder={placeholder}
                    className='action-node-input parameter-textarea'
                    rows={3}
                    style={{
                      minHeight: '60px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                    }}
                  />
                );
              }
              return (
                <input
                  id={`param-${key}`}
                  type={type}
                  value={parameters[key] || ''}
                  onChange={(event) =>
                    onParameterChange(
                      key,
                      type === 'number'
                        ? Number(event.target.value)
                        : event.target.value,
                    )
                  }
                  placeholder={placeholder}
                  className='action-node-input'
                  style={{ minHeight: '30px' }}
                />
              );
            })()}
          </div>
        );
      },
      [parameters, onParameterChange],
    );

    switch (actionType) {
      case 'sendEmail': {
        return (
          <div className='parameter-container'>
            {renderInputField('to', 'Destinatario')}
            {renderInputField('cc', 'CC')}
            {renderInputField('subject', 'Asunto')}
            {renderInputField('template', 'Plantilla', 'select', [
              { value: 'welcome', label: 'Bienvenida' },
              { value: 'notification', label: 'Notificación' },
              { value: 'reminder', label: 'Recordatorio' },
              { value: 'custom', label: 'Personalizada' },
            ])}
            {parameters.template === 'custom' &&
              renderInputField('body', 'Contenido', 'textarea')}
          </div>
        );
      }
      case 'saveData': {
        return (
          <div className='parameter-container'>
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
      }
      case 'sendNotification': {
        return (
          <div className='parameter-container'>
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
      }
      case 'apiCall': {
        return (
          <div className='parameter-container'>
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
      }
      case 'transformData': {
        return (
          <div className='parameter-container'>
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
      }
      case 'conditional': {
        return (
          <div className='parameter-container'>
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
      }
      case 'delay': {
        return (
          <div className='parameter-container'>
            {renderInputField('duration', 'Duración', 'number')}
            {renderInputField('unit', 'Unidad', 'select', [
              { value: 'milliseconds', label: 'Milisegundos' },
              { value: 'seconds', label: 'Segundos' },
              { value: 'minutes', label: 'Minutos' },
              { value: 'hours', label: 'Horas' },
            ])}
          </div>
        );
      }
      case 'webhook': {
        return (
          <div className='parameter-container'>
            {renderInputField('endpoint', 'Punto de conexión')}
            {renderInputField('event', 'Evento')}
            {renderInputField('secretKey', 'Clave secreta')}
          </div>
        );
      }
      default: {
        break;
      }
    }
  },
);

ParameterFields.propTypes = {
  actionType: PropTypes.string,
  parameters: PropTypes.object.isRequired,
  onParameterChange: PropTypes.func.isRequired,
};
ParameterFields.displayName = 'ParameterFields';

const ActionNode = ({ data, isConnectable = true, selected = false, id }) => {
  const { description, actionType, parameters, isCollapsed } = data;
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const deleteNode = useFlowStore((state) => state.deleteNode);
  const nodeReference = useRef(null);
  const textareaReference = useRef(null);
  const permissions = usePermissions();
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [editActionType, setEditActionType] = useState('');
  const [editParameters, setEditParameters] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });

  const handleSaveChanges = useCallback(() => {
    if (!permissions.canEdit) return;
    setIsSaving(true);
    updateNodeData(id, {
      description: editDescription,
      actionType: editActionType,
      parameters: editParameters,
    });
    setIsEditing(false);
  }, [
    permissions.canEdit,
    id,
    updateNodeData,
    editDescription,
    editActionType,
    editParameters,
  ]);

  const handleCancelEditing = useCallback(() => {
    setIsEditing(false);
  }, []);

  const startEditing = useCallback(() => {
    if (!permissions.canEdit || isEditing) return;
    setEditDescription(description);
    setEditActionType(actionType);
    setEditParameters(parameters || {});
    setIsEditing(true);
    setTimeout(() => {
      textareaReference.current?.focus();
      textareaReference.current?.select();
    }, 10);
  }, [permissions.canEdit, isEditing, description, actionType, parameters]);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSaveChanges();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        handleCancelEditing();
      }
    },
    [handleSaveChanges, handleCancelEditing],
  );

  const handleParameterChange = useCallback((key, value) => {
    setEditParameters((previous) => ({ ...previous, [key]: value }));
  }, []);

  const toggleCollapse = useCallback(
    (event) => {
      event.stopPropagation();
      updateNodeData(id, { isCollapsed: !isCollapsed });
    },
    [id, isCollapsed, updateNodeData],
  );

  const handleNodeKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter' && !isEditing) {
        event.preventDefault();
        startEditing();
      }
    },
    [isEditing, startEditing],
  );

  const handleContextMenu = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenuPosition({ x: event.clientX, y: event.clientY });
    setShowContextMenu(true);
  }, []);

  const handleHeaderKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleCollapse(event);
      }
    },
    [toggleCollapse],
  );

  const handleDescriptionKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        startEditing();
      }
    },
    [startEditing],
  );

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
        action: () => {
          /* Implementación futura */
        },
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
    [
      startEditing,
      permissions.canEdit,
      permissions.canDelete,
      id,
      deleteNode,
      isEditing,
    ],
  );

  const currentActionType = isEditing ? editActionType : actionType;
  const actionDetails = useMemo(
    () => ACTION_TYPES.find((at) => at.value === currentActionType),
    [currentActionType],
  );

  const nodeClassName = [
    'action-node',
    selected && 'selected',
    isEditing && 'editing',
    isHovered && 'hovered',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={nodeReference}
      role='button'
      className={nodeClassName}
      onDoubleClick={startEditing}
      onKeyDown={handleNodeKeyDown}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      tabIndex={0}
      style={{
        width: isCollapsed ? 180 : 300,
        transition: 'width 0.2s ease, height 0.2s ease',
        opacity: isSaving ? 0.7 : 1,
      }}
    >
      <Handle
        type='target'
        position='top'
        isConnectable={isConnectable && !isEditing}
        className='action-node-handle'
      />

      <div
        className='action-node-header'
        onClick={toggleCollapse}
        onKeyDown={handleHeaderKeyDown}
        role='button'
        tabIndex={0}
      >
        <span className='action-node-icon'>{actionDetails?.icon || '⚙️'}</span>
        <h5 className='action-node-title'>
          {actionDetails?.label || 'Acción'}
        </h5>
        <div className='action-node-controls'>
          <button
            type='button'
            onClick={toggleCollapse}
            className='action-node-control-button'
            aria-label={isCollapsed ? 'Expandir nodo' : 'Colapsar nodo'}
          >
            {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
          {isHovered && (
            <button
              type='button'
              className='action-node-context-button'
              onClick={handleContextMenu}
              aria-label='Opciones del nodo'
            >
              <MoreHorizontal size={16} />
            </button>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <div className='action-node-content'>
          {isEditing ? (
            <div
              role='presentation'
              className='action-node-edit-view'
              onKeyDown={handleKeyDown}
            >
              <textarea
                ref={textareaReference}
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
                placeholder='Añade una descripción clara&hellip;'
                className='action-node-textarea'
              />
              <select
                value={editActionType}
                onChange={(event) => setEditActionType(event.target.value)}
                className='action-node-select'
              >
                <option value=''>Selecciona un tipo de acción&hellip;</option>
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
              <div className='action-node-edit-buttons'>
                <button
                  type='button'
                  onClick={handleCancelEditing}
                  className='action-node-button-cancel'
                >
                  Cancelar
                </button>
                <button
                  type='button'
                  onClick={handleSaveChanges}
                  className='action-node-button-save'
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      handleSaveChanges(event);
                    }
                  }}
                >
                  Guardar
                </button>
              </div>
            </div>
          ) : (
            <div
              className='action-node-description'
              onDoubleClick={startEditing}
              onKeyDown={handleDescriptionKeyDown}
              role='button'
              tabIndex={0}
            >
              {description || 'Haz doble clic para editar&hellip;'}
            </div>
          )}
        </div>
      )}

      <Handle
        type='source'
        position='bottom'
        isConnectable={isConnectable && !isEditing}
        className='action-node-handle'
      />

      {showContextMenu && (
        <ContextMenu
          items={contextMenuItems}
          position={contextMenuPosition}
          onClose={() => setShowContextMenu(false)}
        />
      )}
    </div>
  );
};

ActionNode.propTypes = {
  data: PropTypes.shape({
    description: PropTypes.string,
    actionType: PropTypes.string,
    parameters: PropTypes.object,
    isCollapsed: PropTypes.bool,
  }).isRequired,
  id: PropTypes.string.isRequired,
  isConnectable: PropTypes.bool,
  selected: PropTypes.bool,
};

ActionNode.displayName = 'ActionNode';

export default memo(ActionNode, areActionNodePropertiesEqual);
