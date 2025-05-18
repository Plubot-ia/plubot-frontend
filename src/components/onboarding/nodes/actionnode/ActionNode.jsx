import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Handle, Position } from 'reactflow';
import PropTypes from 'prop-types';
import { MoreHorizontal, Edit2, X, Plus, CornerDownRight, ChevronDown, ChevronUp } from 'lucide-react';
import ContextMenu from '../../ui/context-menu';
import { usePermissions } from '@/hooks/usePermissions';
import useNode from '@/hooks/useNode';
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
  const inputRefs = useRef({}); // Referencias para los campos de entrada

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

ParameterFields.propTypes = {
  actionType: PropTypes.string.isRequired,
  parameters: PropTypes.object.isRequired,
  onParameterChange: PropTypes.func.isRequired,
};

// Definimos el componente base
const ActionNodeComponent = ({
  data = { 
    actionType: 'sendEmail', 
    description: '', 
    parameters: { to: '', cc: '', subject: '', template: 'welcome', body: '' }
  },
  isConnectable = true,
  selected = false,
  id,
  onNodesChange,
}) => {
    const [actionType, setActionType] = useState(data.actionType || 'sendEmail');
    const [description, setDescription] = useState(data.description || '');
    const [parameters, setParameters] = useState(data.parameters || { to: '', cc: '', subject: '', template: 'welcome', body: '' });
    const textareaRef = useRef(null);
    const {
      isEditing,
      setIsEditing,
      isCollapsed,
      errorMessage,
      isHovered,
      setIsHovered,
      nodeRef,
      handleDoubleClick,
      toggleCollapse,
      handleMouseDown,
      saveChanges,
      initialWidth,
      initialHeight,
    } = useNode({ id, data, onNodesChange, minWidth: 180, minHeight: 100 });
    const { canEdit, canDelete } = usePermissions();

    const previousData = useRef({ description: '', actionType: 'sendEmail', parameters: {} });

    useEffect(() => {
      if (!isEditing) {
        const currentData = {
          description: data.description || '',
          actionType: data.actionType || 'sendEmail',
          parameters: data.parameters || { to: '', cc: '', subject: '', template: 'welcome', body: '' },
        };

        if (
          currentData.description !== previousData.current.description ||
          currentData.actionType !== previousData.current.actionType ||
          JSON.stringify(currentData.parameters) !== JSON.stringify(previousData.current.parameters)
        ) {
          setDescription(currentData.description);
          setActionType(currentData.actionType);
          setParameters(currentData.parameters);
          previousData.current = currentData;
        }
      }
    }, [data.description, data.actionType, data.parameters, isEditing]);

    useEffect(() => {
      if (isEditing && textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }, [isEditing, description]);

    const handleBlur = useCallback(() => {
      // No ejecutar handleBlur si estamos editando parámetros
      if (document.activeElement.closest('.parameter-container')) {
        return;
      }
      setIsEditing(false);
      const hasChanges =
        data.description !== description ||
        data.actionType !== actionType ||
        JSON.stringify(data.parameters) !== JSON.stringify(parameters);
      if (hasChanges) {
        const updateData = {
          description,
          actionType,
          parameters,
          lastModified: new Date().toISOString(),
          modifiedBy: data.currentUser || 'unknown',
        };
        saveChanges(updateData, { description: data.description, actionType: data.actionType, parameters: data.parameters }, 'action');
      }
    }, [description, actionType, parameters, data, saveChanges, setIsEditing]);

    const handleKeyDown = useCallback(
      (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleBlur();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setIsEditing(false);
          setDescription(data.description || '');
          setActionType(data.actionType || 'sendEmail');
          setParameters(data.parameters || { to: '', cc: '', subject: '', template: 'welcome', body: '' });
        }
      },
      [handleBlur, data]
    );

    const handleParameterChange = useCallback((key, value) => {
      setParameters((prev) => ({ ...prev, [key]: value }));
    }, []);

    const handleClick = useCallback((e) => {
      e.stopPropagation();
      data.onSelect?.();
    }, [data]);

    const [showContextMenu, setShowContextMenu] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });

    const handleContextMenu = useCallback((e) => {
      e.preventDefault();
      setContextMenuPosition({ x: e.clientX, y: e.clientY });
      setShowContextMenu(true);
    }, []);

    const contextMenuItems = [
      { label: 'Editar', icon: <Edit2 size={14} />, action: handleDoubleClick, disabled: !canEdit },
      { label: 'Ver historial', icon: <CornerDownRight size={14} />, action: () => data.onShowHistory?.(id) },
      { label: 'Duplicar', icon: <Plus size={14} />, action: () => data.onDuplicate?.(id), disabled: !canEdit },
      {
        label: 'Eliminar',
        icon: <X size={14} />,
        action: () => {
          if (window.confirm('¿Estás seguro de que deseas eliminar este nodo de acción?')) {
            data.onDelete?.(id);
          }
        },
        disabled: !canDelete,
      },
    ];

    const actionTypeInfo = ACTION_TYPES.find((at) => at.value === actionType) || ACTION_TYPES[0];

    const renderStatusBadge = () => {
      if (!data.status) return null;
      const statusIcons = {
        error: '❌',
        warning: '⚠️',
        success: '✅',
        pending: '⏳',
        running: '⚙️',
      };
      return (
        <div className={`action-node-status-badge status-${data.status}`}>
          {statusIcons[data.status] || '•'} {data.status}
        </div>
      );
    };

    return (
      <div
        ref={nodeRef}
        className={`action-node ${selected ? 'selected' : ''} ${isEditing ? 'editing' : ''} ${
          data.status || ''
        } ${isHovered ? 'hovered' : ''}`}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: isCollapsed ? 150 : (data.width || initialWidth),
          height: isCollapsed ? 40 : (data.height || initialHeight),
          transition: 'all 0.2s ease',
          minHeight: isEditing ? '300px' : 'auto', // Asegurar espacio suficiente en modo edición
        }}
        aria-label={`${actionTypeInfo.label} action: ${description || 'Sin descripción'}`}
        role="button"
        data-node-id={id}
      >
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={isConnectable && !isEditing}
          className="action-node-input"
          style={{ background: '#667eea' }}
        />

        <div className="action-node-header">
          <div className="action-node-icon" title={actionTypeInfo.label}>
            {actionTypeInfo.icon || data.icon || '⚙️'}
          </div>
          <div className="action-node-title" title={data.label}>
            {data.label || actionTypeInfo.label}
          </div>
          {renderStatusBadge()}
          {!isCollapsed && (
            <div className="action-node-controls">
              <button
                className="action-node-collapse-btn"
                onClick={toggleCollapse}
                aria-label={isCollapsed ? 'Expandir' : 'Colapsar'}
              >
                {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </button>
              <button
                className="action-node-menu-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setContextMenuPosition({ x: e.clientX, y: e.clientY });
                  setShowContextMenu(true);
                }}
                aria-label="Menú"
              >
                <MoreHorizontal size={16} />
              </button>
            </div>
          )}
        </div>

        {!isCollapsed && (
          <div className="action-node-content">
            {isEditing ? (
              <div className="action-node-editing-container">
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  className="action-node-input action-type-select"
                  aria-label="Tipo de acción"
                >
                  {ACTION_TYPES.map((action) => (
                    <option key={action.value} value={action.value}>
                      {action.icon} {action.label}
                    </option>
                  ))}
                </select>
                <textarea
                  ref={textareaRef}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  className="action-node-input"
                  placeholder="Describe la acción..."
                  aria-label="Descripción de la acción"
                  style={{ minHeight: '60px', maxHeight: '200px', overflowY: 'auto' }}
                />
                <ParameterFields
                  actionType={actionType}
                  parameters={parameters}
                  onParameterChange={handleParameterChange}
                />
                {errorMessage && <div className="action-node-error">{errorMessage}</div>}
                <div className="action-node-edit-actions">
                  <button className="action-node-save-btn" onClick={handleBlur}>
                    Guardar
                  </button>
                  <button
                    className="action-node-cancel-btn"
                    onClick={() => {
                      setIsEditing(false);
                      setDescription(data.description || '');
                      setActionType(data.actionType || 'sendEmail');
                      setParameters(data.parameters || { to: '', cc: '', subject: '', template: 'welcome', body: '' });
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="action-node-description">
                <strong>{actionTypeInfo.label}</strong>
                <p className="action-node-description-text">
                  {description || <em className="action-node-placeholder">Describe la acción aquí</em>}
                </p>
                {Object.keys(parameters).length > 0 && (
                  <div className="action-node-parameters">
                    {Object.entries(parameters).map(([key, value]) => (
                      <div key={key} className="action-node-parameter">
                        <span className="parameter-key">{key}:</span>
                        <span className="parameter-value">{value && value.toString ? value.toString() : '-'}</span>
                      </div>
                    ))}
                  </div>
                )}
                {canEdit && (
                  <button
                    className="action-node-edit-btn"
                    onClick={handleDoubleClick}
                    style={{ marginTop: '10px', padding: '5px 10px', fontSize: '12px' }}
                  >
                    <Edit2 size={14} /> Editar Parámetros
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {!isCollapsed && !isEditing && (
          <>
            <div className="action-node-footer">
              {canEdit && <small className="action-node-hint">Haz doble clic para editar</small>}
              {data.metadata && (
                <div className="action-node-metadata">
                  {data.metadata.date && <span className="action-node-date">{data.metadata.date}</span>}
                  {data.metadata.author && <span className="action-node-author">{data.metadata.author}</span>}
                  {data.metadata.version && <span className="action-node-version">v{data.metadata.version}</span>}
                </div>
              )}
            </div>
            <div
              className="resize-handle"
              onMouseDown={handleMouseDown}
              style={{ cursor: 'nwse-resize' }}
              aria-label="Redimensionar nodo"
            />
          </>
        )}

        <Handle
          type="source"
          position={Position.Bottom}
          isConnectable={isConnectable && !isEditing}
          className="action-node-output"
          style={{ background: '#667eea' }}
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

// Memoizamos el componente
const ActionNode = memo(ActionNodeComponent);

// Asignamos el displayName al componente
ActionNode.displayName = 'ActionNode';

// Definimos los propTypes
ActionNode.propTypes = {
  data: PropTypes.shape({
    label: PropTypes.string,
    description: PropTypes.string,
    actionType: PropTypes.string,
    parameters: PropTypes.object,
    icon: PropTypes.string,
    tags: PropTypes.array,
    status: PropTypes.string,
    width: PropTypes.number,
    height: PropTypes.number,
    metadata: PropTypes.shape({
      date: PropTypes.string,
      author: PropTypes.string,
      version: PropTypes.string,
    }),
    onChange: PropTypes.func,
    onSelect: PropTypes.func,
    onDelete: PropTypes.func,
  }).isRequired,
  isConnectable: PropTypes.bool,
  selected: PropTypes.bool,
  id: PropTypes.string.isRequired,
  onNodesChange: PropTypes.func.isRequired,
};

export default ActionNode;