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

    const adjustHeight = useCallback((reference) => {
      if (reference.current) {
        reference.current.style.height = 'auto';
        reference.current.style.height = `${Math.min(reference.current.scrollHeight, 200)}px`;
      }
    }, []);

    const _renderSelectField = useCallback(
      ({ key, placeholder, options }) => (
        <select
          id={`param-${key}`}
          // eslint-disable-next-line security/detect-object-injection -- key controlled by parameters iteration
          value={parameters[key] || ''}
          onChange={(event) => onParameterChange(key, event.target.value)}
          className='action-node-input parameter-select'
        >
          <option value=''>Selecciona una opción&hellip;</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ),
      [parameters, onParameterChange],
    );

    const _renderTextareaField = useCallback(
      ({ key, placeholder }) => (
        <textarea
          ref={(element) => {
            // eslint-disable-next-line security/detect-object-injection -- key controlled by parameters iteration
            inputReferences.current[key] = element;
          }}
          id={`param-${key}`}
          // eslint-disable-next-line security/detect-object-injection -- key controlled by parameters iteration
          value={parameters[key] || ''}
          onChange={(event) => {
            onParameterChange(key, event.target.value);
            // eslint-disable-next-line security/detect-object-injection -- key controlled by parameters iteration
            adjustHeight({ current: inputReferences.current[key] });
          }}
          onFocus={() =>
            // eslint-disable-next-line security/detect-object-injection -- key controlled by parameters iteration
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
      ),
      [parameters, onParameterChange, adjustHeight],
    );

    const _renderRegularInput = useCallback(
      ({ key, placeholder, type }) => (
        <input
          id={`param-${key}`}
          type={type}
          // eslint-disable-next-line security/detect-object-injection -- key controlled by parameters iteration
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
      ),
      [parameters, onParameterChange],
    );

    const renderInputField = useCallback(
      ({ key, placeholder, type = 'text', options }) => {
        const getInputElement = () => {
          if (type === 'select' && options) {
            return _renderSelectField({ key, placeholder, options });
          }
          if (type === 'textarea') {
            return _renderTextareaField({ key, placeholder });
          }
          return _renderRegularInput({ key, placeholder, type });
        };

        return (
          <div key={key} className='parameter-field'>
            <label htmlFor={`param-${key}`} className='parameter-label'>
              {placeholder}
            </label>
            {getInputElement()}
          </div>
        );
      },
      [_renderSelectField, _renderTextareaField, _renderRegularInput],
    );

    switch (actionType) {
      case 'sendEmail': {
        return (
          <div className='parameter-container'>
            {renderInputField({ key: 'to', placeholder: 'Destinatario' })}
            {renderInputField({ key: 'cc', placeholder: 'CC' })}
            {renderInputField({ key: 'subject', placeholder: 'Asunto' })}
            {renderInputField({
              key: 'template',
              placeholder: 'Plantilla',
              type: 'select',
              options: [
                { value: 'welcome', label: 'Bienvenida' },
                { value: 'notification', label: 'Notificación' },
                { value: 'reminder', label: 'Recordatorio' },
                { value: 'custom', label: 'Personalizada' },
              ],
            })}
            {parameters.template === 'custom' &&
              renderInputField({
                key: 'body',
                placeholder: 'Contenido',
                type: 'textarea',
              })}
          </div>
        );
      }
      case 'saveData': {
        return (
          <div className='parameter-container'>
            {renderInputField({ key: 'key', placeholder: 'Clave de datos' })}
            {renderInputField({ key: 'value', placeholder: 'Valor' })}
            {renderInputField({
              key: 'dataType',
              placeholder: 'Tipo de dato',
              type: 'select',
              options: [
                { value: 'string', label: 'Texto' },
                { value: 'number', label: 'Número' },
                { value: 'boolean', label: 'Booleano' },
                { value: 'object', label: 'Objeto' },
              ],
            })}
            {renderInputField({
              key: 'storage',
              placeholder: 'Almacenamiento',
              type: 'select',
              options: [
                { value: 'session', label: 'Sesión' },
                { value: 'local', label: 'Local' },
                { value: 'database', label: 'Base de datos' },
              ],
            })}
          </div>
        );
      }
      case 'sendNotification': {
        return (
          <div className='parameter-container'>
            {renderInputField({ key: 'message', placeholder: 'Mensaje' })}
            {renderInputField({
              key: 'type',
              placeholder: 'Tipo',
              type: 'select',
              options: [
                { value: 'info', label: 'Información' },
                { value: 'success', label: 'Éxito' },
                { value: 'warning', label: 'Advertencia' },
                { value: 'error', label: 'Error' },
              ],
            })}
            {renderInputField({
              key: 'duration',
              placeholder: 'Duración (seg)',
              type: 'number',
            })}
          </div>
        );
      }
      case 'apiCall': {
        return (
          <div className='parameter-container'>
            {renderInputField({ key: 'url', placeholder: 'URL' })}
            {renderInputField({
              key: 'method',
              placeholder: 'Método',
              type: 'select',
              options: [
                { value: 'GET', label: 'GET' },
                { value: 'POST', label: 'POST' },
                { value: 'PUT', label: 'PUT' },
                { value: 'DELETE', label: 'DELETE' },
              ],
            })}
            {renderInputField({
              key: 'headers',
              placeholder: 'Encabezados',
              type: 'textarea',
            })}
            {renderInputField({
              key: 'body',
              placeholder: 'Cuerpo',
              type: 'textarea',
            })}
          </div>
        );
      }
      case 'transformData': {
        return (
          <div className='parameter-container'>
            {renderInputField({
              key: 'inputVariable',
              placeholder: 'Variable de entrada',
            })}
            {renderInputField({
              key: 'transformation',
              placeholder: 'Transformación',
              type: 'select',
              options: [
                { value: 'uppercase', label: 'Convertir a mayúsculas' },
                { value: 'lowercase', label: 'Convertir a minúsculas' },
                { value: 'number', label: 'Convertir a número' },
                { value: 'json', label: 'Formato JSON' },
                { value: 'custom', label: 'Personalizada' },
              ],
            })}
            {parameters.transformation === 'custom' &&
              renderInputField({
                key: 'formula',
                placeholder: 'Fórmula personalizada',
                type: 'textarea',
              })}
            {renderInputField({
              key: 'outputVariable',
              placeholder: 'Variable de salida',
            })}
          </div>
        );
      }
      case 'conditional': {
        return (
          <div className='parameter-container'>
            {renderInputField({
              key: 'variable',
              placeholder: 'Variable a evaluar',
            })}
            {renderInputField({
              key: 'operator',
              placeholder: 'Operador',
              type: 'select',
              options: [
                { value: 'equal', label: 'Es igual a' },
                { value: 'notEqual', label: 'No es igual a' },
                { value: 'contains', label: 'Contiene' },
                { value: 'greater', label: 'Mayor que' },
                { value: 'less', label: 'Menor que' },
              ],
            })}
            {renderInputField({
              key: 'value',
              placeholder: 'Valor de comparación',
            })}
          </div>
        );
      }
      case 'delay': {
        return (
          <div className='parameter-container'>
            {renderInputField({
              key: 'duration',
              placeholder: 'Duración',
              type: 'number',
            })}
            {renderInputField({
              key: 'unit',
              placeholder: 'Unidad',
              type: 'select',
              options: [
                { value: 'milliseconds', label: 'Milisegundos' },
                { value: 'seconds', label: 'Segundos' },
                { value: 'minutes', label: 'Minutos' },
                { value: 'hours', label: 'Horas' },
              ],
            })}
          </div>
        );
      }
      case 'webhook': {
        return (
          <div className='parameter-container'>
            {renderInputField({
              key: 'endpoint',
              placeholder: 'Punto de conexión',
            })}
            {renderInputField({ key: 'event', placeholder: 'Evento' })}
            {renderInputField({
              key: 'secretKey',
              placeholder: 'Clave secreta',
            })}
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
  parameters: PropTypes.object,
  onParameterChange: PropTypes.func.isRequired,
};

ParameterFields.displayName = 'ParameterFields';

// Componente para renderizado condicional - reduce complejidad de ActionNode
const ActionNodeContent = memo(
  ({ isEditing, editState, displayState, handlers }) => {
    const { description, actionType, parameters, textareaRef } = editState;
    const { editing, keyboard, setEditDescription, setEditActionType } =
      handlers;

    if (isEditing) {
      return (
        <div className='action-node-content'>
          <div
            role='presentation'
            className='action-node-edit-view'
            onKeyDown={keyboard.edit}
          >
            <textarea
              ref={textareaRef}
              value={description}
              onChange={(event) => setEditDescription(event.target.value)}
              placeholder='Añade una descripción clara…'
              className='action-node-textarea'
            />
            <select
              value={actionType}
              onChange={(event) => setEditActionType(event.target.value)}
              className='action-node-select'
            >
              <option value=''>Selecciona un tipo de acción…</option>
              {ACTION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
            <ParameterFields
              actionType={actionType}
              parameters={parameters}
              onParameterChange={editing.parameterChange}
            />
            <div className='action-node-edit-buttons'>
              <button
                type='button'
                onClick={editing.cancel}
                className='action-node-button-cancel'
              >
                Cancelar
              </button>
              <button
                type='button'
                onClick={editing.save}
                className='action-node-button-save'
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    editing.save(event);
                  }
                }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className='action-node-content'>
        <div
          className='action-node-description'
          onDoubleClick={editing.start}
          onKeyDown={keyboard.description}
          role='button'
          tabIndex={0}
        >
          {displayState.description || 'Haz doble clic para editar…'}
        </div>
      </div>
    );
  },
);

ActionNodeContent.propTypes = {
  isEditing: PropTypes.bool.isRequired,
  editState: PropTypes.shape({
    description: PropTypes.string,
    actionType: PropTypes.string,
    parameters: PropTypes.object,
    textareaRef: PropTypes.object,
  }).isRequired,
  displayState: PropTypes.shape({
    description: PropTypes.string,
  }).isRequired,
  handlers: PropTypes.shape({
    editing: PropTypes.object.isRequired,
    keyboard: PropTypes.object.isRequired,
    setEditDescription: PropTypes.func.isRequired,
    setEditActionType: PropTypes.func.isRequired,
  }).isRequired,
};

ActionNodeContent.displayName = 'ActionNodeContent';

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

  const toggleCollapse = useCallback(
    (event) => {
      event.stopPropagation();
      updateNodeData(id, { isCollapsed: !isCollapsed });
    },
    [id, isCollapsed, updateNodeData],
  );

  // Agrupación de handlers para reducir complejidad
  const editingHandlers = useMemo(
    () => ({
      save: () => {
        if (!permissions.canEdit) return;
        setIsSaving(true);
        updateNodeData(id, {
          description: editDescription,
          actionType: editActionType,
          parameters: editParameters,
        });
        setIsEditing(false);
      },
      cancel: () => setIsEditing(false),
      start: () => {
        if (!permissions.canEdit || isEditing) return;
        setEditDescription(description);
        setEditActionType(actionType);
        setEditParameters(parameters || {});
        setIsEditing(true);
        setTimeout(() => {
          textareaReference.current?.focus();
          textareaReference.current?.select();
        }, 10);
      },
      parameterChange: (key, value) => {
        setEditParameters((previous) => ({ ...previous, [key]: value }));
      },
    }),
    [
      permissions.canEdit,
      id,
      updateNodeData,
      editDescription,
      editActionType,
      editParameters,
      isEditing,
      description,
      actionType,
      parameters,
    ],
  );

  const keyboardHandlers = useMemo(
    () => ({
      edit: (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          editingHandlers.save();
        } else if (event.key === 'Escape') {
          event.preventDefault();
          editingHandlers.cancel();
        }
      },
      node: (event) => {
        if (event.key === 'Enter' && !isEditing) {
          event.preventDefault();
          editingHandlers.start();
        }
      },
      header: (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggleCollapse(event);
        }
      },
      description: (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          editingHandlers.start();
        }
      },
    }),
    [editingHandlers, isEditing, toggleCollapse],
  );

  const handleContextMenu = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenuPosition({ x: event.clientX, y: event.clientY });
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
        action: editingHandlers.start,
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
      editingHandlers.start,
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
      onDoubleClick={editingHandlers.start}
      onKeyDown={keyboardHandlers.node}
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
        onKeyDown={keyboardHandlers.header}
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
        <ActionNodeContent
          isEditing={isEditing}
          editState={{
            description: editDescription,
            actionType: editActionType,
            parameters: editParameters,
            textareaRef: textareaReference,
          }}
          displayState={{
            description,
          }}
          handlers={{
            editing: editingHandlers,
            keyboard: keyboardHandlers,
            setEditDescription,
            setEditActionType,
          }}
        />
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
