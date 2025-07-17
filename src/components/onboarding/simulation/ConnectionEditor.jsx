import PropTypes from 'prop-types';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './ConnectionEditor.css';

// --- HOOK DE LÓGICA --- //

const useConnectionEditorLogic = ({
  nodes,
  selectedConnection,
  connectionProperties,
  setConnectionProperties,
  saveConnectionChanges,
  deleteConnection,
  setShowConnectionEditor,
}) => {
  const connectionType = useMemo(() => {
    if (!selectedConnection) return 'default';
    const source = nodes.find((n) => n.id === selectedConnection.source);
    return source?.data?.connectionType || 'default';
  }, [selectedConnection, nodes]);

  const sourceNode = useMemo(
    () => nodes.find((n) => n.id === selectedConnection?.source),
    [nodes, selectedConnection],
  );
  const targetNode = useMemo(
    () => nodes.find((n) => n.id === selectedConnection?.target),
    [nodes, selectedConnection],
  );

  const stylePresets = useMemo(
    () => [
      {
        name: 'Normal',
        stroke: '#6c757d',
        strokeWidth: 2,
        strokeDasharray: null,
      },
      {
        name: 'Énfasis',
        stroke: '#007bff',
        strokeWidth: 3,
        strokeDasharray: null,
      },
      {
        name: 'Discreto',
        stroke: '#adb5bd',
        strokeWidth: 1,
        strokeDasharray: '4 4',
      },
      {
        name: 'Peligro',
        stroke: '#dc3545',
        strokeWidth: 2,
        strokeDasharray: null,
      },
    ],
    [],
  );

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [activePresetIndex, setActivePresetIndex] = useState(-1);

  const initialProperties = useMemo(
    () => ({
      label: selectedConnection?.label || '',
      animated: selectedConnection?.animated || false,
      style: {
        stroke: selectedConnection?.style?.stroke || '#6c757d',
        strokeWidth: selectedConnection?.style?.strokeWidth || 2,
        strokeDasharray: selectedConnection?.style?.strokeDasharray || null,
      },
    }),
    [selectedConnection],
  );

  const hasChanges = useMemo(
    () =>
      JSON.stringify(initialProperties) !==
      JSON.stringify(connectionProperties),
    [initialProperties, connectionProperties],
  );

  const suggestLabel = useCallback(() => {
    if (!sourceNode || !targetNode) return '';
    return `${sourceNode.data.label} → ${targetNode.data.label}`;
  }, [sourceNode, targetNode]);

  const applyStylePreset = useCallback(
    (preset) => {
      setConnectionProperties((previous) => ({
        ...previous,
        style: {
          ...previous.style,
          stroke: preset.stroke,
          strokeWidth: preset.strokeWidth,
          strokeDasharray: preset.strokeDasharray,
        },
      }));
      const presetIndex = stylePresets.findIndex((p) => p.name === preset.name);
      setActivePresetIndex(presetIndex);
    },
    [setConnectionProperties, stylePresets],
  );

  const getTypeDescription = useCallback((type) => {
    const descriptions = {
      default: 'Conexión estándar entre dos nodos.',
      option: 'Representa una opción de respuesta en un nodo de decisión.',
    };
    return descriptions[type] || 'Tipo de conexión no definido.';
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowConnectionEditor(false);
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (hasChanges) saveConnectionChanges();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setShowConnectionEditor, saveConnectionChanges, hasChanges]);

  const handleDelete = useCallback(() => {
    setShowConfirmDelete(true);
    setTimeout(
      () => document.querySelector('.ts-confirm-delete-button')?.focus(),
      100,
    );
  }, []);

  useEffect(() => {
    if (!showConfirmDelete) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowConfirmDelete(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showConfirmDelete]);

  const handleSave = useCallback(() => {
    if (hasChanges) saveConnectionChanges();
  }, [hasChanges, saveConnectionChanges]);

  return {
    connectionType,
    sourceNode,
    targetNode,
    stylePresets,
    showConfirmDelete,
    setShowConfirmDelete,
    activePresetIndex,
    hasChanges,
    suggestLabel,
    applyStylePreset,
    getTypeDescription,
    handleDelete,
    handleSave,
  };
};

// --- COMPONENTES DE UI --- //

const ConnectionPreview = React.memo(({ properties }) => {
  const { stroke, strokeWidth, strokeDasharray } = properties.style;
  return (
    <div className='ts-connection-preview'>
      <div className='ts-preview-label'>Vista previa:</div>
      <div className='ts-preview-container'>
        <div className='ts-preview-node ts-source' />
        <svg width='120' height='30'>
          <defs>
            <marker
              id='arrowhead'
              markerWidth='10'
              markerHeight='7'
              refX='9'
              refY='3.5'
              orient='auto'
            >
              <polygon points='0 0, 10 3.5, 0 7' fill={stroke} />
            </marker>
          </defs>
          <path
            d='M10,15 L110,15'
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            markerEnd='url(#arrowhead)'
          />
        </svg>
        <div className='ts-preview-node ts-target' />
      </div>
      {properties.animated && (
        <div className='ts-preview-animation-indicator'>
          <span className='ts-animation-dot' /> Animación activa
        </div>
      )}
    </div>
  );
});
ConnectionPreview.displayName = 'ConnectionPreview';
ConnectionPreview.propTypes = { properties: PropTypes.object.isRequired };

const Tooltip = React.memo(({ text }) => (
  <div className='ts-tooltip-container'>
    <span className='ts-tooltip-icon'>ⓘ</span>
    <span className='ts-tooltip-text'>{text}</span>
  </div>
));
Tooltip.displayName = 'Tooltip';
Tooltip.propTypes = { text: PropTypes.string.isRequired };

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
StylePreset.displayName = 'StylePreset';
StylePreset.propTypes = {
  preset: PropTypes.object.isRequired,
  onClick: PropTypes.func.isRequired,
  isActive: PropTypes.bool.isRequired,
};

const ConnectionForm = ({
  connectionProperties,
  setConnectionProperties,
  suggestLabel,
}) => {
  const handleStyleChange = useCallback(
    (property, value) =>
      setConnectionProperties((p) => ({
        ...p,
        style: { ...p.style, [property]: value },
      })),
    [setConnectionProperties],
  );
  const handlePropertyChange = useCallback(
    (property, value) =>
      setConnectionProperties((p) => ({ ...p, [property]: value })),
    [setConnectionProperties],
  );

  return (
    <div className='ts-editor-section'>
      <div className='ts-form-group'>
        <label htmlFor='connection-label'>
          Etiqueta de conexión:{' '}
          <Tooltip text='Texto que aparecerá sobre la línea de conexión' />
        </label>
        <div className='ts-input-with-suggestion'>
          <input
            id='connection-label'
            type='text'
            value={connectionProperties.label}
            onChange={(e) => handlePropertyChange('label', e.target.value)}
            placeholder={suggestLabel()}
          />
          {!connectionProperties.label && suggestLabel() && (
            <button
              className='ts-suggestion-button'
              onClick={() => handlePropertyChange('label', suggestLabel())}
              title='Usar sugerencia'
            >
              Usar sugerencia
            </button>
          )}
        </div>
      </div>
      <div className='ts-form-group'>
        <label htmlFor='connection-color'>
          Color: <Tooltip text='Color de la línea y la flecha' />
        </label>
        <input
          id='connection-color'
          type='color'
          value={connectionProperties.style.stroke}
          onChange={(e) => handleStyleChange('stroke', e.target.value)}
        />
      </div>
      <div className='ts-form-group'>
        <label htmlFor='connection-width'>
          Grosor: <Tooltip text='Grosor de la línea en píxeles' />
        </label>
        <input
          id='connection-width'
          type='range'
          min='1'
          max='10'
          value={connectionProperties.style.strokeWidth}
          onChange={(e) =>
            handleStyleChange('strokeWidth', Number(e.target.value))
          }
        />
        <span>{connectionProperties.style.strokeWidth}px</span>
      </div>
      <div className='ts-form-group'>
        <label>
          <input
            type='checkbox'
            checked={Boolean(connectionProperties.style.strokeDasharray)}
            onChange={(e) =>
              handleStyleChange(
                'strokeDasharray',
                e.target.checked ? '5 5' : null,
              )
            }
          />{' '}
          Línea discontinua <Tooltip text='Estilo de línea punteada o sólida' />
        </label>
      </div>
      <div className='ts-form-group'>
        <label>
          <input
            type='checkbox'
            checked={connectionProperties.animated}
            onChange={(e) => handlePropertyChange('animated', e.target.checked)}
          />{' '}
          Animación de flujo{' '}
          <Tooltip text='Añade una animación que simula el flujo de datos' />
        </label>
      </div>
    </div>
  );
};
ConnectionForm.propTypes = {
  connectionProperties: PropTypes.object.isRequired,
  setConnectionProperties: PropTypes.func.isRequired,
  suggestLabel: PropTypes.func.isRequired,
};

const ConnectionEditorHeader = ({ onClose }) => (
  <div className='ts-modal-header'>
    <h3 id='connection-editor-title'>Editor de Conexión</h3>
    <button
      onClick={onClose}
      className='ts-close-button'
      aria-label='Cerrar editor'
    >
      ✕
    </button>
  </div>
);
ConnectionEditorHeader.propTypes = { onClose: PropTypes.func.isRequired };

const ConnectionMetadata = ({
  connectionType,
  getTypeDescription,
  sourceNode,
  targetNode,
  selectedConnection,
}) => (
  <>
    <div
      className='ts-connection-type-badge'
      title={getTypeDescription(connectionType)}
      aria-label={getTypeDescription(connectionType)}
    >
      {connectionType}
    </div>
    <div className='ts-connection-nodes'>
      <div className='ts-source-node'>
        <strong>Origen:</strong>{' '}
        {sourceNode?.data?.label || selectedConnection?.source}
      </div>
      <div className='ts-connection-arrow' aria-hidden='true'>
        ➔
      </div>
      <div className='ts-target-node'>
        <strong>Destino:</strong>{' '}
        {targetNode?.data?.label || selectedConnection?.target}
      </div>
    </div>
  </>
);
ConnectionMetadata.propTypes = {
  connectionType: PropTypes.string.isRequired,
  getTypeDescription: PropTypes.func.isRequired,
  sourceNode: PropTypes.object,
  targetNode: PropTypes.object,
  selectedConnection: PropTypes.object.isRequired,
};

const StylePresets = ({ presets, onClick, activeIndex }) => (
  <div className='ts-style-presets'>
    <div className='ts-presets-label'>Estilos predefinidos:</div>
    <div className='ts-presets-container'>
      {presets.map((p, index) => (
        <StylePreset
          key={p.name}
          preset={p}
          onClick={onClick}
          isActive={index === activeIndex}
        />
      ))}
    </div>
  </div>
);
StylePresets.propTypes = {
  presets: PropTypes.array.isRequired,
  onClick: PropTypes.func.isRequired,
  activeIndex: PropTypes.number.isRequired,
};

const EditorActions = ({
  onSave,
  onDelete,
  hasChanges,
  showConfirmDelete,
  setShowConfirmDelete,
  deleteConnection,
}) => (
  <div className='ts-editor-actions'>
    <button
      onClick={onSave}
      className={`ts-primary-button ${hasChanges ? 'has-changes' : ''}`}
      disabled={!hasChanges}
      aria-label='Guardar cambios en la conexión'
    >
      Guardar Cambios
    </button>
    {showConfirmDelete ? (
      <div className='ts-delete-confirmation'>
        <span>¿Eliminar conexión?</span>
        <button
          onClick={deleteConnection}
          className='ts-confirm-delete-button'
          aria-label='Confirmar eliminación'
        >
          Sí, eliminar
        </button>
        <button
          onClick={() => setShowConfirmDelete(false)}
          className='ts-cancel-button'
          aria-label='Cancelar eliminación'
        >
          Cancelar
        </button>
      </div>
    ) : (
      <button
        onClick={onDelete}
        className='ts-secondary-button'
        aria-label='Eliminar conexión'
      >
        Eliminar Conexión
      </button>
    )}
  </div>
);
EditorActions.propTypes = {
  onSave: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  hasChanges: PropTypes.bool.isRequired,
  showConfirmDelete: PropTypes.bool.isRequired,
  setShowConfirmDelete: PropTypes.func.isRequired,
  deleteConnection: PropTypes.func.isRequired,
};

const KeyboardShortcutsInfo = () => (
  <div className='ts-keyboard-shortcuts' aria-label='Atajos de teclado'>
    <div className='ts-shortcut'>
      <kbd>Esc</kbd> Cerrar
    </div>
    <div className='ts-shortcut'>
      <kbd>Ctrl</kbd>+<kbd>S</kbd> Guardar
    </div>
  </div>
);

// --- COMPONENTE PRINCIPAL --- //

const ConnectionEditor = (props) => {
  const logic = useConnectionEditorLogic(props);

  return (
    <div className='ts-connection-editor-modal' role='dialog' aria-modal='true'>
      <div
        className='ts-modal-content'
        aria-labelledby='connection-editor-title'
      >
        <ConnectionEditorHeader
          onClose={() => props.setShowConnectionEditor(false)}
        />
        <div className='ts-connection-details'>
          <ConnectionMetadata
            {...logic}
            selectedConnection={props.selectedConnection}
          />
          <ConnectionPreview properties={props.connectionProperties} />
          <StylePresets
            presets={logic.stylePresets}
            onClick={logic.applyStylePreset}
            activeIndex={logic.activePresetIndex}
          />
          <ConnectionForm {...props} suggestLabel={logic.suggestLabel} />
          <EditorActions {...logic} deleteConnection={props.deleteConnection} />
          <KeyboardShortcutsInfo />
        </div>
      </div>
    </div>
  );
};

ConnectionEditor.propTypes = {
  nodes: PropTypes.array.isRequired,
  selectedConnection: PropTypes.object.isRequired,
  connectionProperties: PropTypes.object.isRequired,
  setConnectionProperties: PropTypes.func.isRequired,
  saveConnectionChanges: PropTypes.func.isRequired,
  deleteConnection: PropTypes.func.isRequired,
  setShowConnectionEditor: PropTypes.func.isRequired,
};

export default ConnectionEditor;
