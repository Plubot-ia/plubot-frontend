import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './ConnectionEditor.css';

// Componente de previsualización de conexión extraído y optimizado
const ConnectionPreview = React.memo(({ properties }) => {
  const { stroke, strokeWidth, strokeDasharray } = properties.style;

  return (
    <div className="ts-connection-preview">
      <div className="ts-preview-label">Vista previa:</div>
      <div className="ts-preview-container">
        <div className="ts-preview-node ts-source" />
        <svg width="120" height="30">
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill={stroke} />
            </marker>
          </defs>
          <path
            d="M10,15 L110,15"
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            markerEnd="url(#arrowhead)"
          />
        </svg>
        <div className="ts-preview-node ts-target" />
      </div>
      {properties.animated && (
        <div className="ts-preview-animation-indicator">
          <span className="ts-animation-dot" /> Animación activa
        </div>
      )}
    </div>
  );
});

// Componente de tooltip reutilizable
const Tooltip = React.memo(({ text }) => (
  <div className="ts-tooltip-container">
    <span className="ts-tooltip-icon">ⓘ</span>
    <span className="ts-tooltip-text">{text}</span>
  </div>
));

// Componente de preset de estilo optimizado con memo
const StylePreset = React.memo(({ preset, onClick, isActive }) => (
  <button
    className={`ts-style-preset-button ${isActive ? 'ts-active-preset' : ''}`}
    style={{
      backgroundColor: preset.stroke,
      borderStyle: preset.strokeDasharray ? 'dashed' : 'solid',
      borderColor: isActive ? '#ffffff' : 'transparent',
      transform: isActive ? 'scale(1.2)' : 'scale(1)',
    }}
    onClick={() => onClick(preset)}
    title={preset.name}
    aria-label={`Estilo ${preset.name}`}
  />
));

// Componente de formulario para propiedades de la conexión
const ConnectionForm = ({
  connectionProperties,
  setConnectionProperties,
  connectionType,
  suggestLabel,
}) => {
  const handleStyleChange = useCallback((property, value) => {
    setConnectionProperties(prev => ({
      ...prev,
      style: {
        ...prev.style,
        [property]: value,
      },
    }));
  }, [setConnectionProperties]);

  const handlePropertyChange = useCallback((property, value) => {
    setConnectionProperties(prev => ({
      ...prev,
      [property]: value,
    }));
  }, [setConnectionProperties]);

  return (
    <div className="ts-editor-section">
      <div className="ts-form-group">
        <label htmlFor="connection-label">
          Etiqueta de conexión:
          <Tooltip text="Texto que aparecerá sobre la línea de conexión" />
        </label>
        <div className="ts-input-with-suggestion">
          <input
            id="connection-label"
            type="text"
            value={connectionProperties.label}
            onChange={(e) => handlePropertyChange('label', e.target.value)}
            placeholder={suggestLabel()}
          />
          {!connectionProperties.label && suggestLabel() && (
            <button
              className="ts-suggestion-button"
              onClick={() => handlePropertyChange('label', suggestLabel())}
              title="Usar sugerencia"
            >
              Usar sugerencia
            </button>
          )}
        </div>
      </div>

      <div className="ts-form-group">
        <label htmlFor="connection-color">
          Color:
          <Tooltip text="Color de la línea de conexión" />
        </label>
        <input
          id="connection-color"
          type="color"
          value={connectionProperties.style.stroke}
          onChange={(e) => handleStyleChange('stroke', e.target.value)}
          aria-label="Seleccionar color de línea"
        />
      </div>

      <div className="ts-form-group">
        <label htmlFor="connection-width">
          Grosor de línea:
          <Tooltip text="Grosor de la línea en píxeles" />
        </label>
        <div className="ts-range-with-value">
          <input
            id="connection-width"
            type="range"
            min="1"
            max="6"
            value={connectionProperties.style.strokeWidth}
            onChange={(e) => handleStyleChange('strokeWidth', parseInt(e.target.value))}
            aria-valuemin="1"
            aria-valuemax="6"
            aria-valuenow={connectionProperties.style.strokeWidth}
          />
          <span className="ts-range-value">{connectionProperties.style.strokeWidth}px</span>
        </div>
      </div>

      <div className="ts-form-group">
        <label htmlFor="line-style">
          Estilo de línea:
          <Tooltip text="Apariencia visual de la línea" />
        </label>
        <select
          id="line-style"
          value={connectionProperties.style.strokeDasharray || ''}
          onChange={(e) => handleStyleChange('strokeDasharray', e.target.value)}
          aria-label="Seleccionar estilo de línea"
        >
          <option value="">Sólida</option>
          <option value="5,5">Punteada</option>
          <option value="10,10">Discontinua</option>
          <option value="15,5,3,5">Puntos y rayas</option>
        </select>
      </div>

      <div className="ts-form-group ts-checkbox-group">
        <div className="ts-checkbox-with-label">
          <input
            id="animated-checkbox"
            type="checkbox"
            checked={connectionProperties.animated}
            onChange={(e) => handlePropertyChange('animated', e.target.checked)}
            aria-checked={connectionProperties.animated}
          />
          <label htmlFor="animated-checkbox">
            Animar línea
            <Tooltip text="La línea tendrá un efecto de animación de flujo" />
          </label>
        </div>
      </div>

      {connectionType === 'decision → option' && (
        <div className="ts-form-group">
          <label htmlFor="priority-input">
            Prioridad:
            <Tooltip text="Orden de preferencia para esta opción (menor número = mayor prioridad)" />
          </label>
          <input
            id="priority-input"
            type="number"
            min="1"
            max="100"
            value={connectionProperties.priority || 1}
            onChange={(e) => handlePropertyChange('priority', parseInt(e.target.value) || 1)}
            aria-label="Definir prioridad de la opción"
          />
        </div>
      )}
    </div>
  );
};

// Componente principal del editor de conexiones
const ConnectionEditor = ({
  nodes,
  selectedConnection,
  connectionProperties,
  setConnectionProperties,
  saveConnectionChanges,
  deleteConnection,
  setShowConnectionEditor,
}) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Usar useMemo para los presets de estilo
  const stylePresets = useMemo(() => [
    { name: 'Primario', stroke: '#00e0ff', strokeWidth: 2, strokeDasharray: '' },
    { name: 'Secundario', stroke: '#ff00ff', strokeWidth: 2, strokeDasharray: '' },
    { name: 'Advertencia', stroke: '#ffb700', strokeWidth: 2, strokeDasharray: '' },
    { name: 'Peligro', stroke: '#ff2e5b', strokeWidth: 3, strokeDasharray: '' },
    { name: 'Éxito', stroke: '#00ff9d', strokeWidth: 2, strokeDasharray: '' },
    { name: 'Alternativo', stroke: '#7700ff', strokeWidth: 2, strokeDasharray: '5,5' },
  ], []);

  // Determinar cuál preset está activo
  const activePresetIndex = useMemo(() => {
    return stylePresets.findIndex(preset =>
      preset.stroke === connectionProperties.style.stroke &&
      preset.strokeWidth === connectionProperties.style.strokeWidth &&
      preset.strokeDasharray === connectionProperties.style.strokeDasharray,
    );
  }, [connectionProperties.style, stylePresets]);

  // Encontrar los nodos de origen y destino
  const sourceNode = useMemo(() =>
    nodes.find(node => node.id === selectedConnection?.source),
  [nodes, selectedConnection],
  );

  const targetNode = useMemo(() =>
    nodes.find(node => node.id === selectedConnection?.target),
  [nodes, selectedConnection],
  );

  // Determinar el tipo de conexión
  const connectionType = useMemo(() =>
    sourceNode && targetNode ? `${sourceNode.type} → ${targetNode.type}` : 'desconocido',
  [sourceNode, targetNode],
  );

  // Detección de cambios
  useEffect(() => {
    setHasChanges(true);
  }, [connectionProperties]);

  // Manejar los atajos de teclado con useCallback
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowConnectionEditor(false);
      } else if ((e.key === 's' || e.key === 'S') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (hasChanges) saveConnectionChanges();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasChanges, saveConnectionChanges, setShowConnectionEditor]);

  // Función para aplicar un preset de estilo con useCallback
  const applyStylePreset = useCallback((preset) => {
    setConnectionProperties(prev => ({
      ...prev,
      style: {
        stroke: preset.stroke,
        strokeWidth: preset.strokeWidth,
        strokeDasharray: preset.strokeDasharray,
      },
    }));
  }, [setConnectionProperties]);

  // Obtener la descripción del tipo de conexión
  const getTypeDescription = useCallback((type) => {
    const descriptions = {
      'decision → option': 'Conexión de decisión - establece opciones de respuesta',
      'message → message': 'Secuencia de mensajes',
      'message → decision': 'Mensaje seguido de una decisión de usuario',
      'option → message': 'Opción que conduce a un mensaje',
      'option → action': 'Opción que desencadena una acción',
      'action → message': 'Acción seguida de un mensaje',
      'action → end': 'Acción que concluye el flujo',
      'message → end': 'Mensaje que concluye el flujo',
    };

    return descriptions[type] || 'Conexión entre nodos del flujo';
  }, []);

  // Sugerir etiqueta basada en el tipo de conexión
  const suggestLabel = useCallback(() => {
    const suggestions = {
      'decision → option': 'Si el usuario dice...',
      'option → action': 'Ejecutar acción',
      'message → decision': 'Preguntar al usuario',
      'action → message': 'Después de la acción',
    };

    return suggestions[connectionType] || '';
  }, [connectionType]);

  // Manejar la eliminación con confirmación
  const handleDelete = useCallback(() => {
    if (showConfirmDelete) {
      deleteConnection();
    } else {
      setShowConfirmDelete(true);
    }
  }, [showConfirmDelete, deleteConnection]);

  // Manejar el guardado con verificación de cambios
  const handleSave = useCallback(() => {
    if (hasChanges) {
      saveConnectionChanges();
    }
  }, [hasChanges, saveConnectionChanges]);

  return (
    <div className="ts-connection-editor-modal" role="dialog" aria-modal="true">
      <div className="ts-modal-content" aria-labelledby="connection-editor-title">
        <div className="ts-modal-header">
          <h3 id="connection-editor-title">Editor de Conexión</h3>
          <button
            onClick={() => setShowConnectionEditor(false)}
            className="ts-close-button"
            aria-label="Cerrar editor"
          >
            ✕
          </button>
        </div>

        <div className="ts-connection-details">
          <div
            className="ts-connection-type-badge"
            title={getTypeDescription(connectionType)}
            aria-label={getTypeDescription(connectionType)}
          >
            {connectionType}
          </div>

          <div className="ts-connection-nodes">
            <div className="ts-source-node">
              <strong>Origen:</strong>{' '}
              {sourceNode?.data?.label || selectedConnection?.source}
            </div>
            <div className="ts-connection-arrow" aria-hidden="true">➔</div>
            <div className="ts-target-node">
              <strong>Destino:</strong>{' '}
              {targetNode?.data?.label || selectedConnection?.target}
            </div>
          </div>

          <ConnectionPreview properties={connectionProperties} />

          <div className="ts-style-presets">
            <div className="ts-presets-label">Estilos predefinidos:</div>
            <div className="ts-presets-container">
              {stylePresets.map((preset, index) => (
                <StylePreset
                  key={index}
                  preset={preset}
                  onClick={applyStylePreset}
                  isActive={index === activePresetIndex}
                />
              ))}
            </div>
          </div>

          <ConnectionForm
            connectionProperties={connectionProperties}
            setConnectionProperties={setConnectionProperties}
            connectionType={connectionType}
            suggestLabel={suggestLabel}
          />

          <div className="ts-editor-actions">
            <button
              onClick={handleSave}
              className={`ts-primary-button ${hasChanges ? 'has-changes' : ''}`}
              disabled={!hasChanges}
              aria-label="Guardar cambios en la conexión"
            >
              Guardar Cambios
            </button>

            {showConfirmDelete ? (
              <div className="ts-delete-confirmation">
                <span>¿Eliminar conexión?</span>
                <button
                  onClick={deleteConnection}
                  className="ts-confirm-delete-button"
                  aria-label="Confirmar eliminación"
                >
                  Sí, eliminar
                </button>
                <button
                  onClick={() => setShowConfirmDelete(false)}
                  className="ts-cancel-button"
                  aria-label="Cancelar eliminación"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={handleDelete}
                className="ts-secondary-button"
                aria-label="Eliminar conexión"
              >
                Eliminar Conexión
              </button>
            )}
          </div>

          <div className="ts-keyboard-shortcuts" aria-label="Atajos de teclado">
            <div className="ts-shortcut"><kbd>Esc</kbd> Cerrar</div>
            <div className="ts-shortcut"><kbd>Ctrl</kbd>+<kbd>S</kbd> Guardar</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionEditor;