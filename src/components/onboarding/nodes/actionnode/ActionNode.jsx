import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { Handle, Position } from 'reactflow';
import PropTypes from 'prop-types';
import { MoreHorizontal, Edit2, X, Plus, CornerDownRight, ChevronDown, ChevronUp } from 'lucide-react';
import ContextMenu from '../../ui/context-menu';
import { usePermissions } from '@/hooks/usePermissions';
import useNode from '@/hooks/useNode';
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
  isConnectable = true,
  selected = false,
  id,
  data, // <--- AÑADIR data a las props
}) => {
    // Hooks: Referencias, Estado Local, Permisos
    const textareaRef = useRef(null);
    const nodeRef = useRef(null);
    const menuRef = useRef(null);
    const dataRef = useRef({}); 
    
    const [isEditing, setIsEditing] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [showContextMenu, setShowContextMenu] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
    const [errorMessage, setErrorMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    const { canEdit, canDelete } = usePermissions();

    // Acceso al store Zustand (también un hook)
    const { updateNodeData } = useFlowStore(
        useCallback(
            state => ({
                updateNodeData: state.updateNodeData,
                // getNode ya no es necesario aquí para inicialización
            }),
            []
        )
    );

    // Estados locales inicializados directamente desde props.data
    const [actionType, setActionType] = useState(data?.actionType || ''); // Default to empty string
    const [description, setDescription] = useState(data?.description || '');
    const [parameters, setParameters] = useState(data?.parameters || {});
    const [isCollapsed, setIsCollapsed] = useState(data?.isCollapsed || false);
    
    // Dimensiones y edición
    // Usar data?.width y data?.height para inicializar, con valores por defecto
    const [currentWidth, setCurrentWidth] = useState(data?.width || 250);
    const [currentHeight, setCurrentHeight] = useState(data?.height || (data?.actionType === 'webhook' ? 200 : 100));

    // Guardar los cambios en el store
    const saveChanges = useCallback(() => {
      if (!data || !data.id) {
        console.warn('saveChanges: Nodo o datos del nodo no disponibles. No se guardarán cambios.');
        return;
      }
      const tempDescription = dataRef.current.description;
      const tempActionType = dataRef.current.actionType;
      const tempParameters = dataRef.current.parameters;
      setIsSaving(true);
      try {
        if (tempDescription !== undefined && tempDescription !== (data.description || '')) {
          updateNodeData(data.id, { description: tempDescription });
        }
        if (tempActionType !== undefined && tempActionType !== (data.actionType || '')) {
          updateNodeData(data.id, { actionType: tempActionType });
        }
        if (tempParameters !== undefined && JSON.stringify(tempParameters) !== JSON.stringify(data.parameters || {})) {
          updateNodeData(data.id, { parameters: tempParameters });
        }
        dataRef.current = {};
      } catch (error) {
        console.error('Error al guardar cambios en ActionNode:', error);
        setErrorMessage('Error al guardar los cambios');
        setTimeout(() => setErrorMessage(''), 3000);
      } finally {
        setIsSaving(false);
      }
    }, [data, updateNodeData]);
    
    // Manejar el doble clic para editar
    const handleDoubleClick = useCallback((e) => {
      if (e) e.stopPropagation();
      if (!canEdit || !data || !data.id) return;
      setIsEditing(true);
      dataRef.current = {
        description: data.description,
        actionType: data.actionType,
        parameters: { ...data.parameters }
      };
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.select();
        }
      }, 10);
    }, [canEdit, data]);
    
    // Manejar la tecla Enter y Escape durante la edición
    const handleKeyDown = useCallback((e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        saveChanges();
        setIsEditing(false);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        dataRef.current = {};
        setIsEditing(false);
      }
    }, [saveChanges]);

    // Manejar el cambio de descripción
    const handleDescriptionChange = useCallback((e) => {
      const value = e.target.value;
      dataRef.current = { ...dataRef.current, description: value };
    }, []);
    
    // Manejar el cambio de tipo de acción
    const handleActionTypeChange = useCallback((value) => {
      dataRef.current = { ...dataRef.current, actionType: value };
    }, []);
    
    // Manejar el cambio de parámetros
    const handleParameterChange = useCallback((key, value) => {
      if (!data || !data.id) {
        console.warn('handleParameterChange: Nodo o datos del nodo no disponibles.');
        return;
      }
      const currentParams = dataRef.current.parameters || { ...data.parameters };
      dataRef.current = { 
        ...dataRef.current, 
        parameters: { ...currentParams, [key]: value }
      };
    }, [data]);
    
    // Alternar el estado colapsado
    const toggleCollapse = useCallback(() => {
      if (!data || !data.id) return;
      setIsCollapsed(!isCollapsed);
      updateNodeData(data.id, { isCollapsed: !isCollapsed });
    }, [data, isCollapsed, updateNodeData]);
    
    // Manejar el clic para seleccionar
    const handleClick = useCallback((e) => {
      e.stopPropagation();
    }, []);

    const handleContextMenu = useCallback((e) => {
      e.preventDefault();
      setContextMenuPosition({ x: e.clientX, y: e.clientY });
      setShowContextMenu(true);
    }, []);

    // Definición de contextMenuItems (después de la guarda y después de definir todos los hooks)
    const contextMenuItems = [
      { label: 'Editar', icon: <Edit2 size={14} />, action: handleDoubleClick, disabled: !canEdit || !data || !data.id },
      { label: 'Ver historial', icon: <CornerDownRight size={14} />, action: () => {} }, // Implementar si es necesario
      { label: 'Duplicar', icon: <Plus size={14} />, action: () => { /* Implementar duplicación */ }, disabled: !canEdit || !data || !data.id },
      {
        label: 'Eliminar',
        icon: <X size={14} />,
        action: () => {
          if (data && data.id) { // Asegurarse que data y data.id existen
            updateNodeData(data.id, { deleted: true });
          } else {
            console.warn('Intento de eliminar un nodo sin ID o nodo no definido.');
          }
        },
        disabled: !canDelete || !data || !data.id,
        isDestructive: true,
      },
    ];

    // Renderizado del componente
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
          width: isCollapsed ? 150 : currentWidth,
          height: isCollapsed ? 40 : currentHeight,
          transition: 'all 0.2s ease',
          minHeight: isEditing ? '300px' : 'auto', // Asegurar espacio suficiente en modo edición
          opacity: isSaving ? 0.7 : 1, // Indicador visual de guardado
        }}
        aria-label={`${ACTION_TYPES.find(at => at.value === actionType)?.label || 'Acción desconocida'} action: ${description || 'Sin descripción'}`}
        role="button"
        data-testid="action-node"
        data-node-id={id}
      >
        {/* Handle de entrada */}
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={isConnectable && !isEditing}
          className="action-node-input"
          style={{ background: '#667eea' }}
        />

        {/* Cabecera del nodo */}
        <div className="action-node-header">
          <div className="action-node-icon" title={ACTION_TYPES.find(at => at.value === actionType)?.label}>
            {ACTION_TYPES.find(at => at.value === actionType)?.icon || '⚙️'}
          </div>
          <div className="action-node-title" title={ACTION_TYPES.find(at => at.value === actionType)?.label}>
            {ACTION_TYPES.find(at => at.value === actionType)?.label}
          </div>
          {data.status && (
            <div className={`action-node-status-badge status-${data.status}`}>
              {data.status === 'error' ? '❌' : data.status === 'warning' ? '⚠️' : data.status === 'success' ? '✅' : data.status === 'pending' ? '⏳' : data.status === 'running' ? '⚙️' : '•'} {data.status}
            </div>
          )}
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
                aria-label="Mostrar menú"
              >
                <MoreHorizontal size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Contenido principal del nodo */}
        {!isCollapsed && (
          <>
            {isEditing ? (
              <div className="action-node-content-editing">
                {/* Campo de descripción */}
                <div className="edit-field">
                  <label htmlFor="action-description">Descripción:</label>
                  <textarea
                    id="action-description"
                    ref={textareaRef}
                    value={dataRef.current.description !== undefined ? dataRef.current.description : description}
                    onChange={handleDescriptionChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Describe esta acción..."
                    className="action-description-input"
                  />
                </div>

                {/* Selector de tipo de acción */}
                <div className="edit-field">
                  <label htmlFor="action-type">Tipo de acción:</label>
                  <select
                    id="action-type"
                    value={dataRef.current.actionType !== undefined ? dataRef.current.actionType : actionType}
                    onChange={(e) => handleActionTypeChange(e.target.value)}
                    className="action-type-select"
                  >
                    {ACTION_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Parámetros específicos del tipo de acción */}
                <div className="parameters-section">
                  <h4>Parámetros:</h4>
                  <ParameterFields
                    actionType={dataRef.current.actionType !== undefined ? dataRef.current.actionType : actionType}
                    parameters={dataRef.current.parameters !== undefined ? dataRef.current.parameters : parameters}
                    onParameterChange={handleParameterChange}
                  />
                </div>

                {/* Mensaje de error si existe */}
                {errorMessage && (
                  <div className="error-message" role="alert">
                    {errorMessage}
                  </div>
                )}

                {/* Botones de acción */}
                <div className="action-buttons">
                  <button
                    className="save-button"
                    onClick={() => {
                      saveChanges();
                      setIsEditing(false);
                    }}
                    aria-label="Guardar cambios"
                    disabled={isSaving}
                  >
                    {isSaving ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    className="cancel-button"
                    onClick={() => {
                      dataRef.current = {};
                      setIsEditing(false);
                    }}
                    aria-label="Cancelar"
                    disabled={isSaving}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="action-node-content">
                {/* Vista de descripción */}
                <div className="action-description">{description || <em>Sin descripción</em>}</div>
                
                {/* Vista de parámetros */}
                <div className="action-parameters">
                  <ParameterFields
                    actionType={actionType}
                    parameters={parameters}
                    onParameterChange={() => {}}
                    readonly
                  />
                </div>
                
                {/* Información adicional */}
                {data.lastExecuted && (
                  <div className="action-last-executed">
                    Última ejecución: {new Date(data.lastExecuted).toLocaleString()}
                  </div>
                )}
              </div>
            )}
          </>
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
            {/* Removido temporalmente el manejo de resize hasta implementar handleMouseDown */}
            <div
              className="resize-handle"
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
        
        {isSaving && (
          <div className="action-node-saving-indicator">
            Guardando...
          </div>
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