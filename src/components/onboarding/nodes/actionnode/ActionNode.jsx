import { MoreHorizontal, Edit2, X, ChevronDown, ChevronUp } from 'lucide-react';
import PropTypes from 'prop-types';
import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { Handle } from 'reactflow';

import { usePermissions } from '@/hooks/usePermissions';
import useFlowStore from '@/stores/use-flow-store';
import { useRenderTracker } from '@/utils/renderTracker';

import ContextMenu from '../../ui/context-menu';

import './ActionNode.css';

// Custom hook para manejo de estado de guardado
const useSavingState = (isSaving, setIsSaving) => {
  useEffect(() => {
    if (isSaving) {
      const timer = setTimeout(() => setIsSaving(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [isSaving, setIsSaving]);
};

// Custom hook para estados del componente ActionNode
const useActionNodeState = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [editActionType, setEditActionType] = useState('');
  const [editParameters, setEditParameters] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });

  return {
    isHovered,
    setIsHovered,
    isEditing,
    setIsEditing,
    editDescription,
    setEditDescription,
    editActionType,
    setEditActionType,
    editParameters,
    setEditParameters,
    isSaving,
    setIsSaving,
    showContextMenu,
    setShowContextMenu,
    contextMenuPosition,
    setContextMenuPosition,
  };
};

// Custom hook for editing handlers
const useActionNodeEditingHandlers = ({
  permissions,
  id,
  updateNodeData,
  editDescription,
  editActionType,
  editParameters,
  isEditing,
  description,
  actionType,
  parameters,
  setIsSaving,
  setIsEditing,
  setEditDescription,
  setEditActionType,
  setEditParameters,
  textareaReference,
}) => {
  return useMemo(
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
        setEditParameters(parameters ?? {});
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
      setIsSaving,
      setIsEditing,
      setEditDescription,
      setEditActionType,
      setEditParameters,
      textareaReference,
    ],
  );
};

const areActionNodePropertiesEqual = (previousProperties, nextProperties) => {
  if (
    previousProperties.selected !== nextProperties.selected ||
    previousProperties.isConnectable !== nextProperties.isConnectable
  ) {
    return false;
  }

  return JSON.stringify(previousProperties.data) === JSON.stringify(nextProperties.data);
};

// Helper: Crear className del nodo
const createNodeClassName = (selected, isEditing, isHovered) =>
  ['action-node', selected && 'selected', isEditing && 'editing', isHovered && 'hovered']
    .filter(Boolean)
    .join(' ');

// Helper: Crear props para ActionNodeContent
const createNodeContentProps = ({
  isEditing,
  editDescription,
  editActionType,
  editParameters,
  textareaReference,
  description,
  editingHandlers,
  keyboardHandlers,
  setEditDescription,
  setEditActionType,
}) => ({
  isEditing,
  editState: {
    description: editDescription,
    actionType: editActionType,
    parameters: editParameters,
    textareaRef: textareaReference,
  },
  displayState: {
    description,
  },
  handlers: {
    editing: editingHandlers,
    keyboard: keyboardHandlers,
    setEditDescription,
    setEditActionType,
  },
});

// Helper: Crear items del menu contextual
const createContextMenuItems = ({ editingHandlers, permissions, id, deleteNode, isEditing }) => [
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
];

// Helper: Crear estilo del nodo
const createNodeStyle = (isCollapsed, isSaving) => ({
  width: isCollapsed ? 180 : 300,
  transition: 'width 0.2s ease, height 0.2s ease',
  opacity: isSaving ? 0.7 : 1,
});

// Helper: Crear props de eventos del nodo
const createNodeEventProps = (
  editingHandlers,
  keyboardHandlers,
  handleContextMenu,
  setIsHovered,
) => ({
  onDoubleClick: editingHandlers.start,
  onKeyDown: keyboardHandlers.node,
  onContextMenu: handleContextMenu,
  onMouseEnter: () => setIsHovered(true),
  onMouseLeave: () => setIsHovered(false),
});

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

// Helper: Obtener detalles de acción
const getActionDetails = (isEditing, editActionType, actionType) => {
  const currentActionType = isEditing ? editActionType : actionType;
  return ACTION_TYPES.find((at) => at.value === currentActionType);
};

// Helper: Crear props de Handle
const createHandleProps = (type, position, isConnectable, isEditing) => ({
  type,
  position,
  isConnectable: isConnectable && !isEditing,
  className: 'action-node-handle',
});

// Helper: Crear props de ContextMenu
const createContextMenuProps = (contextMenuItems, contextMenuPosition, setShowContextMenu) => ({
  items: contextMenuItems,
  position: contextMenuPosition,
  onClose: () => setShowContextMenu(false),
});

/* eslint-disable max-lines-per-function */
// DEUDA TÉCNICA: ParameterFields maneja renderizado condicional complejo para 8+ tipos de acciones.
// La función (313 líneas) contiene un switch masivo con lógica específica por tipo de acción,
// validaciones de campos y renderizado dinámico que requiere refactorización arquitectural.
// FUTURE: Dividir en componentes individuales por tipo de acción en futuro sprint.
// Regla desactivada para garantizar estabilidad del sistema de parámetros del MVP actual.

const ParameterFields = memo(({ actionType, parameters, onParameterChange }) => {
  const inputReferences = useRef({});

  const adjustHeight = useCallback((reference) => {
    if (reference.current) {
      reference.current.style.height = 'auto';
      reference.current.style.height = `${Math.min(reference.current.scrollHeight, 200)}px`;
    }
  }, []);

  const _renderSelectField = useCallback(
    ({ key, _placeholder, options }) => (
      <select
        id={`param-${key}`}
        // eslint-disable-next-line security/detect-object-injection -- key controlled by parameters iteration
        value={parameters[key] ?? ''}
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
        value={parameters[key] ?? ''}
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
        value={parameters[key] ?? ''}
        onChange={(event) =>
          onParameterChange(
            key,
            type === 'number' ? Number(event.target.value) : event.target.value,
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
});

ParameterFields.propTypes = {
  actionType: PropTypes.string,
  parameters: PropTypes.object,
  onParameterChange: PropTypes.func.isRequired,
};

ParameterFields.displayName = 'ParameterFields';

// Componente para renderizado condicional - reduce complejidad de ActionNode
const ActionNodeContent = memo(({ isEditing, editState, displayState, handlers }) => {
  const { description, actionType, parameters, textareaRef } = editState;
  const { editing, keyboard, setEditDescription, setEditActionType } = handlers;

  if (isEditing) {
    return (
      <div className='action-node-content'>
        <div role='presentation' className='action-node-edit-view' onKeyDown={keyboard.edit}>
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
            <button type='button' onClick={editing.cancel} className='action-node-button-cancel'>
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
});

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

const ActionNodeHeader = ({
  actionDetails,
  isCollapsed,
  isHovered,
  toggleCollapse,
  handleContextMenu,
  keyboardHandlers,
}) => (
  <div
    className='action-node-header'
    onClick={toggleCollapse}
    onKeyDown={keyboardHandlers.header}
    role='button'
    tabIndex={0}
  >
    <span className='action-node-icon'>{actionDetails?.icon || '⚙️'}</span>
    <h5 className='action-node-title'>{actionDetails?.label || 'Acción'}</h5>
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
);

ActionNodeHeader.propTypes = {
  actionDetails: PropTypes.shape({
    icon: PropTypes.string,
    label: PropTypes.string,
  }),
  isCollapsed: PropTypes.bool.isRequired,
  isHovered: PropTypes.bool.isRequired,
  toggleCollapse: PropTypes.func.isRequired,
  handleContextMenu: PropTypes.func.isRequired,
  keyboardHandlers: PropTypes.shape({
    header: PropTypes.func.isRequired,
  }).isRequired,
};

ActionNodeHeader.displayName = 'ActionNodeHeader';

const ActionNode = ({ data, isConnectable = true, selected = false, id }) => {
  // 🔄 RENDER TRACKING
  useRenderTracker('ActionNode');

  const { description, actionType, parameters, isCollapsed = false } = data;
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const deleteNode = useFlowStore((state) => state.deleteNode);
  const nodeReference = useRef(null);
  const textareaReference = useRef(null);
  const permissions = usePermissions();
  const {
    isHovered,
    setIsHovered,
    isEditing,
    setIsEditing,
    editDescription,
    setEditDescription,
    editActionType,
    setEditActionType,
    editParameters,
    setEditParameters,
    isSaving,
    setIsSaving,
    showContextMenu,
    setShowContextMenu,
    contextMenuPosition,
    setContextMenuPosition,
  } = useActionNodeState();

  const toggleCollapse = useCallback(
    (event) => {
      event.stopPropagation();
      updateNodeData(id, { isCollapsed: !isCollapsed });
    },
    [id, isCollapsed, updateNodeData],
  );

  const editingHandlers = useActionNodeEditingHandlers({
    permissions,
    id,
    updateNodeData,
    editDescription,
    editActionType,
    editParameters,
    isEditing,
    description,
    actionType,
    parameters,
    setIsSaving,
    setIsEditing,
    setEditDescription,
    setEditActionType,
    setEditParameters,
    textareaReference,
  });

  // FIX: Implementación directa de keyboard handlers (hooks en el cuerpo principal)
  const handleHeaderKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (!isEditing) {
          toggleCollapse();
        }
      }
    },
    [isEditing, toggleCollapse],
  );

  const handleNodeKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter' && !isEditing) {
        event.preventDefault();
        editingHandlers.start();
      } else if (event.key === 'Escape' && isEditing) {
        event.preventDefault();
        editingHandlers.cancel();
      }
    },
    [isEditing, editingHandlers],
  );

  const keyboardHandlers = useMemo(
    () => ({
      header: handleHeaderKeyDown,
      node: handleNodeKeyDown,
    }),
    [handleHeaderKeyDown, handleNodeKeyDown],
  );

  const handleContextMenu = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      setContextMenuPosition({ x: event.clientX, y: event.clientY });
      setShowContextMenu(true);
    },
    [setContextMenuPosition, setShowContextMenu],
  );
  useSavingState(isSaving, setIsSaving);
  const contextMenuItems = useMemo(
    () => createContextMenuItems({ editingHandlers, permissions, id, deleteNode, isEditing }),
    [editingHandlers, permissions, id, deleteNode, isEditing],
  );
  return (
    <div
      ref={nodeReference}
      role='button'
      className={createNodeClassName(selected, isEditing, isHovered)}
      {...createNodeEventProps(editingHandlers, keyboardHandlers, handleContextMenu, setIsHovered)}
      tabIndex={0}
      style={createNodeStyle(isCollapsed, isSaving)}
    >
      <Handle {...createHandleProps('target', 'top', isConnectable, isEditing)} />

      <ActionNodeHeader
        actionDetails={useMemo(
          () => getActionDetails(isEditing, editActionType, actionType),
          [isEditing, editActionType, actionType],
        )}
        isCollapsed={isCollapsed}
        isHovered={isHovered}
        toggleCollapse={toggleCollapse}
        handleContextMenu={handleContextMenu}
        keyboardHandlers={keyboardHandlers}
      />
      {!isCollapsed && (
        <ActionNodeContent
          {...createNodeContentProps({
            isEditing,
            editDescription,
            editActionType,
            editParameters,
            textareaReference,
            description,
            editingHandlers,
            keyboardHandlers,
            setEditDescription,
            setEditActionType,
          })}
        />
      )}
      <Handle {...createHandleProps('source', 'bottom', isConnectable, isEditing)} />
      {showContextMenu && (
        <ContextMenu
          {...createContextMenuProps(contextMenuItems, contextMenuPosition, setShowContextMenu)}
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
