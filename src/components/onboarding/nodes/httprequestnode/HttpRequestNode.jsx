import axios from 'axios';
import {
  Network,
  ChevronDown,
  ChevronUp,
  Trash2,
  Copy,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import PropTypes from 'prop-types';
import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Handle, Position } from 'reactflow';
import { v4 as uuidv4 } from 'uuid';

import useNode from '@/hooks/useNode';
import useFlowStore from '@/stores/use-flow-store';
import { NODE_TYPES } from '@/utils/node-config.js';

import ContextMenu from '../../ui/context-menu';
import Tooltip from '../../ui/ToolTip';

import './HttpRequestNode.css';

// Función auxiliar para obtener etiquetas de path o key
const getPathOrKeyLabel = (source) => {
  if (source === 'body_json_path') return 'JSON Path (ej: data.user.id)';
  if (source === 'header_key') return 'Nombre Cabecera (ej: X-Request-ID)';
  return '';
};

/**
 * Compara las propiedades básicas entre estados anterior y siguiente
 * @param {Object} previous - Propiedades anteriores
 * @param {Object} next - Propiedades siguientes
 * @returns {boolean} true si son iguales, false si son diferentes
 */
function _compareBasicProps(previous, next) {
  return previous.selected === next.selected && previous.isConnectable === next.isConnectable;
}

/**
 * Compara los datos primitivos entre estados anterior y siguiente
 * @param {Object} prevData - Datos anteriores
 * @param {Object} nextData - Datos siguientes
 * @returns {boolean} true si son iguales, false si son diferentes
 */
function _comparePrimitiveData(previousData, nextData) {
  return (
    previousData.label === nextData.label &&
    previousData.method === nextData.method &&
    previousData.url === nextData.url &&
    previousData.bodyType === nextData.bodyType &&
    previousData.bodyString === nextData.bodyString &&
    previousData.isCollapsed === nextData.isCollapsed
  );
}

/**
 * Compara los datos complejos usando JSON.stringify para comparación profunda
 * @param {Object} prevData - Datos anteriores
 * @param {Object} nextData - Datos siguientes
 * @returns {boolean} true si son iguales, false si son diferentes
 */
function _compareComplexData(previousData, nextData) {
  return (
    JSON.stringify(previousData.headers) === JSON.stringify(nextData.headers) &&
    JSON.stringify(previousData.bodyFormData) === JSON.stringify(nextData.bodyFormData) &&
    JSON.stringify(previousData.responseMapping) === JSON.stringify(nextData.responseMapping)
  );
}

const arePropertiesEqual = (previousProperties, nextProperties) => {
  // Comparar propiedades básicas
  if (!_compareBasicProps(previousProperties, nextProperties)) {
    return false;
  }

  // Deep comparison for the data object
  const previousData = previousProperties.data ?? {};
  const nextData = nextProperties.data ?? {};

  // Comparar datos primitivos
  if (!_comparePrimitiveData(previousData, nextData)) {
    return false;
  }

  // Comparar datos complejos
  return _compareComplexData(previousData, nextData);
};

// Subcomponente: Sección del cuerpo de la petición HTTP
const RequestBodySection = ({
  id,
  bodyType,
  bodyString,
  bodyFormData,
  canEdit,
  handleConfigurationChange,
  handleFormDataEntryChange,
  removeFormDataEntry,
  addFormDataEntry,
}) => (
  <>
    <div className='ts-node-section-title'>Cuerpo de la Petición</div>
    <div className='ts-node-setting'>
      <label htmlFor={`bodyType-${id}`}>Tipo de Cuerpo:</label>
      <select
        id={`bodyType-${id}`}
        value={bodyType}
        onChange={(event) => handleConfigurationChange('bodyType', event.target.value)}
        disabled={!canEdit}
      >
        <option value='none'>Ninguno (None)</option>
        <option value='json'>JSON</option>
        <option value='text'>Texto Plano (Text)</option>
        <option value='form-data'>Form Data</option>
      </select>
    </div>

    {(bodyType === 'json' || bodyType === 'text') && (
      <div className='ts-node-setting'>
        <label htmlFor={`bodyString-${id}`}>
          Cuerpo ({bodyType === 'json' ? 'JSON' : 'Texto Plano'}):
        </label>
        <textarea
          id={`bodyString-${id}`}
          value={bodyString}
          onChange={(event) => handleConfigurationChange('bodyString', event.target.value)}
          placeholder={bodyType === 'json' ? '{ "clave": "valor" }' : 'Contenido del cuerpo...'}
          rows={4}
          disabled={!canEdit}
          className='ts-body-textarea'
        />
      </div>
    )}

    {bodyType === 'form-data' && (
      <div className='ts-formdata-section'>
        {bodyFormData.map((entry, index) => (
          <div key={entry.id} className='ts-formdata-item ts-key-value-item'>
            <input
              type='text'
              placeholder='Clave'
              value={entry.key}
              onChange={(event) => handleFormDataEntryChange(index, 'key', event.target.value)}
              className='ts-formdata-input ts-key-value-input-key'
              disabled={!canEdit}
            />
            <input
              type='text'
              placeholder='Valor'
              value={entry.value}
              onChange={(event) => handleFormDataEntryChange(index, 'value', event.target.value)}
              className='ts-formdata-input ts-key-value-input-value'
              disabled={!canEdit}
            />
            {canEdit && (
              <Tooltip content='Eliminar Campo'>
                <button
                  onClick={() => removeFormDataEntry(index)}
                  className='ts-remove-formdata-button ts-icon-button'
                >
                  <Trash2 size={14} />
                </button>
              </Tooltip>
            )}
          </div>
        ))}
        {canEdit && (
          <button onClick={addFormDataEntry} className='ts-add-button'>
            Añadir Campo
          </button>
        )}
      </div>
    )}
  </>
);

// PropTypes para RequestBodySection
RequestBodySection.propTypes = {
  id: PropTypes.string.isRequired,
  bodyType: PropTypes.string.isRequired,
  bodyString: PropTypes.string.isRequired,
  bodyFormData: PropTypes.array.isRequired,
  canEdit: PropTypes.bool.isRequired,
  handleConfigurationChange: PropTypes.func.isRequired,
  handleFormDataEntryChange: PropTypes.func.isRequired,
  removeFormDataEntry: PropTypes.func.isRequired,
  addFormDataEntry: PropTypes.func.isRequired,
};

// Subcomponente: Sección de mapeo de respuesta HTTP
const ResponseMappingSection = ({
  id,
  responseMapping,
  canEdit,
  handleResponseMapEntryChange,
  responseSourceOptions,
  pathKeyLabelFn,
  removeResponseMapEntry,
  addResponseMapEntry,
}) => (
  <>
    <div className='ts-node-section-title'>Mapeo de Respuesta</div>
    {responseMapping.map((entry, index) => (
      <div key={entry.id} className='ts-response-map-item'>
        <div className='ts-node-setting ts-response-map-row'>
          <label htmlFor={`map-source-${id}-${index}`}>Fuente:</label>
          <select
            id={`map-source-${id}-${index}`}
            value={entry.source}
            onChange={(event) => handleResponseMapEntryChange(index, 'source', event.target.value)}
            disabled={!canEdit}
            className='ts-response-map-select'
          >
            {responseSourceOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {entry.source !== 'status_code' && (
          <div className='ts-node-setting ts-response-map-row'>
            <label htmlFor={`map-path-${id}-${index}`}>{`${pathKeyLabelFn(entry.source)}:`}</label>
            <input
              type='text'
              id={`map-path-${id}-${index}`}
              value={entry.pathOrKey}
              placeholder={pathKeyLabelFn(entry.source)}
              onChange={(event) =>
                handleResponseMapEntryChange(index, 'pathOrKey', event.target.value)
              }
              disabled={!canEdit}
              className='ts-response-map-input'
            />
          </div>
        )}

        <div className='ts-node-setting ts-response-map-row'>
          <label htmlFor={`map-target-${id}-${index}`}>Variable:</label>
          <input
            type='text'
            id={`map-target-${id}-${index}`}
            value={entry.targetVariable}
            placeholder='nombreVariable'
            onChange={(event) =>
              handleResponseMapEntryChange(index, 'targetVariable', event.target.value)
            }
            disabled={!canEdit}
            className='ts-response-map-input'
          />
        </div>

        <div className='ts-node-setting ts-response-map-row'>
          <label htmlFor={`map-default-${id}-${index}`}>Valor por Defecto:</label>
          <input
            type='text'
            id={`map-default-${id}-${index}`}
            value={entry.defaultValue}
            placeholder='(Opcional)'
            onChange={(event) =>
              handleResponseMapEntryChange(index, 'defaultValue', event.target.value)
            }
            disabled={!canEdit}
            className='ts-response-map-input'
          />
        </div>

        {canEdit && (
          <Tooltip content='Eliminar Mapeo'>
            <button
              onClick={() => removeResponseMapEntry(index)}
              className='ts-remove-response-map-button ts-icon-button'
            >
              <Trash2 size={14} />
            </button>
          </Tooltip>
        )}
      </div>
    ))}
    {canEdit && (
      <button onClick={addResponseMapEntry} className='ts-add-button'>
        Añadir Mapeo
      </button>
    )}
  </>
);

// PropTypes para ResponseMappingSection
ResponseMappingSection.propTypes = {
  id: PropTypes.string.isRequired,
  responseMapping: PropTypes.array.isRequired,
  canEdit: PropTypes.bool.isRequired,
  handleResponseMapEntryChange: PropTypes.func.isRequired,
  responseSourceOptions: PropTypes.array.isRequired,
  pathKeyLabelFn: PropTypes.func.isRequired,
  removeResponseMapEntry: PropTypes.func.isRequired,
  addResponseMapEntry: PropTypes.func.isRequired,
};

// Subcomponente: Sección de prueba de solicitud HTTP
const TestSection = ({ handleTestRequest, isTesting, url, testResult }) => {
  // Helper para renderizar botón de prueba
  const renderTestButton = () => (
    <button
      onClick={handleTestRequest}
      disabled={isTesting || !url.trim()}
      className='ts-test-button ts-add-button'
    >
      {isTesting ? (
        <>
          <span className='ts-loading-spinner' />
          Probando...
        </>
      ) : (
        'Ejecutar Prueba'
      )}
    </button>
  );

  // Helper para renderizar estado del resultado
  const renderTestResultStatus = () => (
    <p>
      Estado: {testResult?.statusCode || 'N/A'}{' '}
      {testResult?.success ? (
        <CheckCircle size={14} className='ts-icon-success' />
      ) : (
        <XCircle size={14} className='ts-icon-error' />
      )}
    </p>
  );

  // Helper para renderizar detalles del resultado
  const renderTestResultDetails = () => (
    <>
      {testResult?.message && <p>Mensaje: {testResult.message}</p>}
      {testResult?.responseBodyPreview && (
        <div>
          <p>Preview Body Respuesta:</p>
          <pre className='ts-test-preview-area'>{testResult.responseBodyPreview}</pre>
        </div>
      )}
      {testResult?.headersPreview && (
        <div>
          <p>Preview Headers Respuesta:</p>
          <pre className='ts-test-preview-area'>
            {JSON.stringify(testResult.headersPreview, undefined, 2)}
          </pre>
        </div>
      )}
      {testResult?.errorDetails && (
        <p className='ts-test-error-details'>Detalles: {testResult.errorDetails}</p>
      )}
    </>
  );

  return (
    <div className='ts-node-section ts-test-section'>
      <div className='ts-node-section-title'>Probar Solicitud</div>
      {renderTestButton()}
      {testResult && (
        <div
          className={`ts-test-result ${testResult.success ? 'ts-test-success' : 'ts-test-error'}`}
        >
          <strong>Resultado de la Prueba:</strong>
          {renderTestResultStatus()}
          {renderTestResultDetails()}
        </div>
      )}
    </div>
  );
};

// PropTypes para TestSection
TestSection.propTypes = {
  handleTestRequest: PropTypes.func.isRequired,
  isTesting: PropTypes.bool.isRequired,
  url: PropTypes.string.isRequired,
  testResult: PropTypes.object,
};

// Helper: Crear elementos del menú contextual
const createContextMenuItems = (canEdit, canDelete, id, onNodesChange) => [
  {
    label: 'Duplicar Nodo',
    action: () => {
      // Funcionalidad de duplicación pendiente de implementar
    },
    icon: <Copy size={14} />,
    disabled: !canEdit,
  },
  {
    label: 'Eliminar Nodo',
    action: () => onNodesChange([{ type: 'remove', id }]),
    icon: <Trash2 size={14} />,
    danger: true,
    disabled: !canDelete,
  },
];

// Helper: Crear handlers de mouse optimizados
const createMouseHandlers = (isUltraPerformanceMode, setIsHovered) => ({
  handleMouseEnter: isUltraPerformanceMode ? undefined : () => setIsHovered(true),
  handleMouseLeave: isUltraPerformanceMode ? undefined : () => setIsHovered(false),
});

// Helper: Crear estilos del nodo optimizados
const createNodeStyles = (isUltraPerformanceMode) => ({
  transition: isUltraPerformanceMode ? 'none' : 'all 0.2s ease-in-out',
  boxShadow: isUltraPerformanceMode ? 'none' : '0 0 10px rgba(0, 0, 0, 0.1)',
});

// Helper: Crear className del nodo optimizado
const createNodeClassName = (selected, isCollapsed, isUltraPerformanceMode) => {
  let className = 'http-request-node';
  if (selected) className += ' selected';
  if (isCollapsed) className += ' collapsed';
  if (isUltraPerformanceMode) className += ' ultra-performance';
  return className;
};

// Subcomponente: Handles inferiores
const BottomHandles = ({ isConnectable }) => (
  <>
    <Handle
      type='source'
      position={Position.Bottom}
      id='onSuccess'
      isConnectable={isConnectable}
      className='ts-handle-source ts-handle-success'
    >
      <Tooltip content='En caso de éxito' placement='bottom'>
        <CheckCircle size={12} />
      </Tooltip>
    </Handle>
    <Handle
      type='source'
      position={Position.Bottom}
      id='onError'
      isConnectable={isConnectable}
      className='ts-handle-source ts-handle-error'
      style={{ left: 'auto', right: '15px' }}
    >
      <Tooltip content='En caso de error' placement='bottom'>
        <XCircle size={12} />
      </Tooltip>
    </Handle>
  </>
);

BottomHandles.propTypes = {
  isConnectable: PropTypes.bool,
};

// Subcomponente: Encabezado del nodo HTTP Request
const NodeHeader = ({ canEdit, toggleCollapse, data, defaultData, isCollapsed }) => (
  <div className='ts-node-header' onDoubleClick={canEdit ? toggleCollapse : undefined}>
    <Network size={16} className='ts-node-icon' />
    <span className='ts-node-title'>{data.label || defaultData.label}</span>
    <div className='ts-node-header-actions'>
      {canEdit && (
        <Tooltip content={isCollapsed ? 'Expandir' : 'Colapsar'}>
          <button onClick={toggleCollapse} className='ts-node-action-button'>
            {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </Tooltip>
      )}
    </div>
  </div>
);

// PropTypes para NodeHeader
NodeHeader.propTypes = {
  canEdit: PropTypes.bool.isRequired,
  toggleCollapse: PropTypes.func.isRequired,
  data: PropTypes.object.isRequired,
  defaultData: PropTypes.object.isRequired,
  isCollapsed: PropTypes.bool.isRequired,
};

// Subcomponente: Configuración básica del nodo HTTP Request (método y URL)
const BasicConfigSection = ({ id, method, url, handleConfigurationChange, canEdit }) => (
  <>
    <div className='ts-node-setting'>
      <label htmlFor={`method-${id}`}>Método:</label>
      <select
        id={`method-${id}`}
        value={method}
        onChange={(event) => handleConfigurationChange('method', event.target.value)}
        disabled={!canEdit}
      >
        <option value='GET'>GET</option>
        <option value='POST'>POST</option>
        <option value='PUT'>PUT</option>
        <option value='DELETE'>DELETE</option>
        <option value='PATCH'>PATCH</option>
      </select>
    </div>

    <div className='ts-node-setting'>
      <label htmlFor={`url-${id}`}>URL:</label>
      <input
        type='text'
        id={`url-${id}`}
        value={url}
        onChange={(event) => handleConfigurationChange('url', event.target.value)}
        placeholder='https://api.example.com/data'
        disabled={!canEdit}
      />
    </div>
  </>
);

// PropTypes para BasicConfigSection
BasicConfigSection.propTypes = {
  id: PropTypes.string.isRequired,
  method: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired,
  handleConfigurationChange: PropTypes.func.isRequired,
  canEdit: PropTypes.bool.isRequired,
};

// Subcomponente: Sección de cabeceras HTTP
const HeadersSection = ({ headers, canEdit, handleHeaderChange, removeHeader, addHeader }) => (
  <>
    {headers.map((header, index) => (
      <div key={header.id} className='ts-header-item ts-key-value-item'>
        <input
          type='text'
          placeholder='Clave'
          value={header.key}
          onChange={(event) => handleHeaderChange(index, 'key', event.target.value)}
          className='ts-header-input ts-key-value-input-key'
          disabled={!canEdit}
        />
        <input
          type='text'
          placeholder='Valor'
          value={header.value}
          onChange={(event) => handleHeaderChange(index, 'value', event.target.value)}
          className='ts-header-input ts-key-value-input-value'
          disabled={!canEdit}
        />
        {canEdit && (
          <Tooltip content='Eliminar Cabecera'>
            <button
              onClick={() => removeHeader(index)}
              className='ts-remove-header-button ts-icon-button'
            >
              <Trash2 size={14} />
            </button>
          </Tooltip>
        )}
      </div>
    ))}
    {canEdit && (
      <button onClick={addHeader} className='ts-add-button'>
        Añadir Cabecera
      </button>
    )}
  </>
);

// PropTypes para HeadersSection
HeadersSection.propTypes = {
  headers: PropTypes.array.isRequired,
  canEdit: PropTypes.bool.isRequired,
  handleHeaderChange: PropTypes.func.isRequired,
  removeHeader: PropTypes.func.isRequired,
  addHeader: PropTypes.func.isRequired,
};

// Helper: Crear datos por defecto del nodo HTTP Request
const createDefaultNodeData = () => ({
  label: 'Llamada API',
  type: NODE_TYPES.httpRequest,
  method: 'GET',
  url: 'https://api.example.com/data',
  headers: [],
  bodyType: 'none',
  bodyString: '',
  bodyFormData: [],
  responseMapping: [],
  status: '',
  isCollapsed: false,
  lastModified: new Date().toISOString(),
  modifiedBy: 'system',
  notes: '',
});

// Custom Hook: Manejo de form data
const useFormDataHandlers = (bodyFormData, handleConfigurationChange) => {
  return useMemo(
    () => ({
      change: (index, field, value) => {
        const newFormData = bodyFormData.map((entry, index_) => {
          if (index_ !== index) return entry;
          return { ...entry, [field]: value };
        });
        handleConfigurationChange('bodyFormData', newFormData);
      },
      add: () => {
        const newEntry = { id: uuidv4(), key: '', value: '' };
        const newFormData = [...bodyFormData, newEntry];
        handleConfigurationChange('bodyFormData', newFormData);
      },
      remove: (index) => {
        const newFormData = bodyFormData.filter((_, index_) => index_ !== index);
        handleConfigurationChange('bodyFormData', newFormData);
      },
    }),
    [bodyFormData, handleConfigurationChange],
  );
};

// Custom Hook: Manejo de headers
const useHeaderHandlers = (headers, handleConfigurationChange) => {
  return useMemo(
    () => ({
      change: (index, field, value) => {
        const newHeaders = headers.map((header, index_) => {
          if (index_ !== index) return header;
          return { ...header, [field]: value };
        });
        handleConfigurationChange('headers', newHeaders);
      },
      add: () => {
        const newHeader = { id: uuidv4(), key: '', value: '' };
        const newHeaders = [...headers, newHeader];
        handleConfigurationChange('headers', newHeaders);
      },
      remove: (index) => {
        const newHeaders = headers.filter((_, index_) => index_ !== index);
        handleConfigurationChange('headers', newHeaders);
      },
    }),
    [headers, handleConfigurationChange],
  );
};

// Custom Hook: Manejo de response mapping
const useResponseMappingHandlers = (responseMapping, handleConfigurationChange) => {
  const add = useCallback(() => {
    const newEntry = {
      id: uuidv4(),
      source: 'status_code',
      pathOrKey: '',
      targetVariable: '',
      defaultValue: '',
    };
    const newResponseMapping = [...responseMapping, newEntry];
    handleConfigurationChange('responseMapping', newResponseMapping);
  }, [responseMapping, handleConfigurationChange]);

  const remove = useCallback(
    (index) => {
      const newResponseMapping = responseMapping.filter((_, index_) => index_ !== index);
      handleConfigurationChange('responseMapping', newResponseMapping);
    },
    [responseMapping, handleConfigurationChange],
  );

  const change = useCallback(
    (index, field, value) => {
      const newResponseMapping = responseMapping.map((entry, index_) => {
        if (index_ !== index) return entry;
        const updatedEntry = { ...entry, [field]: value };
        if (field === 'source' && value === 'status_code') {
          updatedEntry.pathOrKey = '';
        }
        return updatedEntry;
      });
      handleConfigurationChange('responseMapping', newResponseMapping);
    },
    [responseMapping, handleConfigurationChange],
  );

  const sourceOptions = useMemo(
    () => [
      { value: 'status_code', label: 'Código de Estado' },
      { value: 'body_json_path', label: 'Body (JSON Path)' },
      { value: 'header_key', label: 'Cabecera (Header)' },
    ],
    [],
  );

  return { add, remove, change, sourceOptions };
};

// Custom Hook: Procesamiento de respuestas
const useResponseProcessors = () => {
  const processSuccess = useCallback((response) => {
    const responseBodyPreview =
      typeof response.data === 'object'
        ? JSON.stringify(response.data, undefined, 2)
        : String(response.data);

    return {
      success: true,
      statusCode: response.status,
      message: 'Solicitud exitosa.',
      responseBodyPreview: responseBodyPreview.slice(0, 500),
      headersPreview: response.headers,
    };
  }, []);

  const processError = useCallback((error) => {
    let errorDetails;
    if (error.response) {
      const responseData = JSON.stringify(error.response.data);
      errorDetails = `Servidor respondió con estado ${error.response.status}. Data: ${responseData}`;
    } else if (error.request) {
      errorDetails = 'No se recibió respuesta del servidor.';
    } else {
      errorDetails = `Error de configuración: ${error.message}`;
    }

    // Fallback por seguridad
    if (!errorDetails) {
      errorDetails = 'Error desconocido.';
    }

    return {
      success: false,
      message: 'Falló la solicitud de prueba.',
      errorDetails,
    };
  }, []);

  return { processSuccess, processError };
};

// Custom Hook: Testing de requests
const useRequestTesting = (requestConfig, processors, testState, testSetters) => {
  const { bodyType, bodyFormData, bodyString, method, url, headers } = requestConfig;
  const { processSuccess, processError } = processors;
  const { setIsTesting, setTestResult } = testSetters;

  const preparePayload = useCallback(() => {
    const formData = new FormData();
    if (bodyType === 'form-data') {
      for (const item of bodyFormData) {
        formData.append(item.key, item.value);
      }
    }

    const getBodyPayload = () => {
      if (bodyType === 'json') return JSON.parse(bodyString || '{}');
      if (bodyType === 'text') return bodyString;
      if (bodyType === 'form-data') return formData;
    };

    return {
      method,
      url,
      headers: Object.fromEntries(headers.map((h) => [h.key, h.value])),
      data: getBodyPayload(),
      timeout: 10_000,
    };
  }, [bodyType, bodyFormData, bodyString, method, url, headers]);

  const handleTest = useCallback(async () => {
    setIsTesting(true);
    setTestResult(undefined);

    try {
      const config = preparePayload();
      const response = await axios(config);
      const result = processSuccess(response);
      setTestResult(result);
    } catch (error) {
      const result = processError(error);
      setTestResult(result);
    } finally {
      setIsTesting(false);
    }
  }, [preparePayload, processSuccess, processError, setIsTesting, setTestResult]);

  return { preparePayload, handleTest };
};

// Custom Hook: Manejo de teclado
const useKeyboardHandlers = () => {
  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      // Focus management for accessibility
    } else if (event.key === 'Escape') {
      event.preventDefault();
      // Blur current element for accessibility
      event.target.blur();
    }
  }, []);

  return { handleKeyDown };
};

// Helper function: Process body type changes
const processBodyTypeChange = (value, newLocalStateUpdates, setters) => {
  const { setBodyString, setBodyFormData } = setters;
  switch (value) {
    case 'none': {
      setBodyString('');
      setBodyFormData([]);
      newLocalStateUpdates.bodyString = '';
      newLocalStateUpdates.bodyFormData = [];
      break;
    }
    case 'json':
    case 'text': {
      setBodyFormData([]);
      newLocalStateUpdates.bodyFormData = [];
      break;
    }
    case 'form-data': {
      setBodyString('');
      newLocalStateUpdates.bodyString = '';
      break;
    }
    default: {
      break;
    }
  }
};

// Custom Hook: Manejo de actualizaciones de campos
const useFieldUpdates = (setters, nodeConfig, utilities) => {
  const { id, data } = nodeConfig;
  const { trackChanges, updateNodeData } = utilities;
  const processFieldUpdate = useCallback(
    (field, value, newLocalStateUpdates) => {
      const {
        setMethod,
        setUrl,
        setHeaders,
        setBodyType,
        setBodyString,
        setBodyFormData,
        setResponseMapping,
      } = setters;

      switch (field) {
        case 'method': {
          setMethod(value);
          newLocalStateUpdates.method = value;
          break;
        }
        case 'url': {
          setUrl(value);
          newLocalStateUpdates.url = value;
          break;
        }
        case 'headers': {
          setHeaders(value);
          newLocalStateUpdates.headers = value;
          break;
        }
        case 'bodyType': {
          setBodyType(value);
          newLocalStateUpdates.bodyType = value;
          processBodyTypeChange(value, newLocalStateUpdates, setters);
          break;
        }
        case 'bodyString': {
          setBodyString(value);
          newLocalStateUpdates.bodyString = value;
          break;
        }
        case 'bodyFormData': {
          setBodyFormData(value);
          newLocalStateUpdates.bodyFormData = value;
          break;
        }
        case 'responseMapping': {
          setResponseMapping(value);
          newLocalStateUpdates.responseMapping = value;
          break;
        }
        default: {
          break;
        }
      }
    },
    [setters],
  );

  const handleConfigurationChange = useCallback(
    (field, value) => {
      const oldDataForLog = { ...data };
      const newLocalStateUpdates = {};

      processFieldUpdate(field, value, newLocalStateUpdates);

      const updatedNodeData = {
        ...data,
        ...newLocalStateUpdates,
        lastModified: new Date().toISOString(),
      };

      trackChanges('configuration', updatedNodeData, oldDataForLog, newLocalStateUpdates);
      updateNodeData(id, updatedNodeData);
    },
    [id, data, trackChanges, updateNodeData, processFieldUpdate],
  );

  return { processFieldUpdate, handleConfigurationChange };
};

// Custom Hook: Manejo de estado del nodo HTTP
const useHttpRequestState = (data, defaultData) => {
  const [method, setMethod] = useState(data.method || defaultData.method);
  const [url, setUrl] = useState(data.url || defaultData.url);
  const [headers, setHeaders] = useState(data.headers || defaultData.headers);
  const [bodyType, setBodyType] = useState(data.bodyType || defaultData.bodyType);
  const [bodyString, setBodyString] = useState(data.bodyString || defaultData.bodyString);
  const [bodyFormData, setBodyFormData] = useState(data.bodyFormData || defaultData.bodyFormData);
  const initialResponseMapping = (data.responseMapping || defaultData.responseMapping).map(
    (entry) => ({
      ...entry,
      defaultValue: entry.defaultValue === undefined ? '' : entry.defaultValue,
    }),
  );
  const [responseMapping, setResponseMapping] = useState(initialResponseMapping);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState();

  return {
    // State values
    method,
    url,
    headers,
    bodyType,
    bodyString,
    bodyFormData,
    responseMapping,
    isTesting,
    testResult,
    // State setters
    setMethod,
    setUrl,
    setHeaders,
    setBodyType,
    setBodyString,
    setBodyFormData,
    setResponseMapping,
    setIsTesting,
    setTestResult,
  };
};

// Custom Hook: Manejo de todos los handlers del nodo
const useNodeHandlers = (config) => {
  const {
    handleConfigurationChange,
    bodyFormData,
    headers,
    responseMapping,
    bodyType,
    bodyString,
    method,
    url,
    setIsTesting,
    setTestResult,
    canEdit,
    canDelete,
    id,
    onNodesChange,
    isUltraPerformanceMode,
    setIsHovered,
    selected,
    isCollapsed,
  } = config;

  // Form data management handlers using custom hook
  const formDataHandlers = useFormDataHandlers(bodyFormData, handleConfigurationChange);
  const handleFormDataEntryChange = formDataHandlers.change;
  const addFormDataEntry = formDataHandlers.add;
  const removeFormDataEntry = formDataHandlers.remove;

  // Header management using custom hook
  const headerHandlers = useHeaderHandlers(headers, handleConfigurationChange);
  const handleHeaderChange = headerHandlers.change;
  const addHeader = headerHandlers.add;
  const removeHeader = headerHandlers.remove;

  // Response mapping management using custom hook
  const responseMappingHandlers = useResponseMappingHandlers(
    responseMapping,
    handleConfigurationChange,
  );
  const addResponseMapEntry = responseMappingHandlers.add;
  const removeResponseMapEntry = responseMappingHandlers.remove;
  const handleResponseMapEntryChange = responseMappingHandlers.change;
  const responseSourceOptions = responseMappingHandlers.sourceOptions;

  // Keyboard handling using custom hook
  const keyboardHandlers = useKeyboardHandlers();
  const { handleKeyDown } = keyboardHandlers;

  // Response processing using custom hook
  const responseProcessors = useResponseProcessors();
  const processSuccessResponse = responseProcessors.processSuccess;
  const processErrorResponse = responseProcessors.processError;

  // Request testing using custom hook
  const requestConfig = {
    bodyType,
    bodyFormData,
    bodyString,
    method,
    url,
    headers,
  };
  const processors = {
    processSuccess: processSuccessResponse,
    processError: processErrorResponse,
  };
  const testSetters = { setIsTesting, setTestResult };
  const requestTesting = useRequestTesting(requestConfig, processors, {}, testSetters);
  const handleTestRequest = requestTesting.handleTest;

  const contextMenuItems = createContextMenuItems(canEdit, canDelete, id, onNodesChange);

  // Optimized handlers and styles using extracted helpers
  const { handleMouseEnter, handleMouseLeave } = useMemo(
    () => createMouseHandlers(isUltraPerformanceMode, setIsHovered),
    [isUltraPerformanceMode, setIsHovered],
  );

  const nodeStyles = useMemo(
    () => createNodeStyles(isUltraPerformanceMode),
    [isUltraPerformanceMode],
  );

  const nodeClassName = useMemo(
    () => createNodeClassName(selected, isCollapsed, isUltraPerformanceMode),
    [selected, isCollapsed, isUltraPerformanceMode],
  );

  return {
    // Form data handlers
    handleFormDataEntryChange,
    addFormDataEntry,
    removeFormDataEntry,
    // Header handlers
    handleHeaderChange,
    addHeader,
    removeHeader,
    // Response mapping handlers
    addResponseMapEntry,
    removeResponseMapEntry,
    handleResponseMapEntryChange,
    responseSourceOptions,
    // Other handlers
    handleKeyDown,
    handleTestRequest,
    contextMenuItems,
    handleMouseEnter,
    handleMouseLeave,
    nodeStyles,
    nodeClassName,
  };
};

// Custom Hook: Sincronización de datos
const useDataSynchronization = (data, defaultData, state, setters) => {
  return useCallback(() => {
    const { method, url, bodyType, bodyString, headers, bodyFormData, responseMapping } = state;
    const {
      setMethod,
      setUrl,
      setBodyType,
      setBodyString,
      setHeaders,
      setBodyFormData,
      setResponseMapping,
    } = setters;

    // Sync simple properties
    if (data.method !== method) setMethod(data.method || defaultData.method);
    if (data.url !== url) setUrl(data.url || defaultData.url);
    if (data.bodyType !== bodyType) setBodyType(data.bodyType || defaultData.bodyType);
    if (data.bodyString !== bodyString) setBodyString(data.bodyString || defaultData.bodyString);

    // Sync complex objects
    if (JSON.stringify(data.headers) !== JSON.stringify(headers)) {
      setHeaders(data.headers || defaultData.headers);
    }
    if (JSON.stringify(data.bodyFormData) !== JSON.stringify(bodyFormData)) {
      setBodyFormData(data.bodyFormData || defaultData.bodyFormData);
    }

    // Sync response mapping
    const newResponseMappingFromData = (data.responseMapping ?? []).map((entry) => ({
      ...entry,
      defaultValue: entry.defaultValue === undefined ? '' : entry.defaultValue,
    }));
    if (JSON.stringify(newResponseMappingFromData) !== JSON.stringify(responseMapping)) {
      setResponseMapping(newResponseMappingFromData);
    }
  }, [data, defaultData, state, setters]);
};

// Custom Hook: HTTP Request Synchronization
const useHttpRequestSynchronization = ({ data, defaultData, state, dataSetters }) => {
  const synchronizeStateWithData = useDataSynchronization(data, defaultData, state, dataSetters);

  useEffect(() => {
    synchronizeStateWithData();
  }, [synchronizeStateWithData]);
};

// Custom Hook: HTTP Request Node Configuration
const useHttpRequestNodeConfig = ({
  httpState,
  id,
  data,
  onNodesChange,
  isConnectable,
  handleConfigurationChange,
  isUltraPerformanceMode,
  selected,
}) => {
  // Extract all state variables
  const {
    method,
    url,
    headers,
    bodyType,
    bodyString,
    bodyFormData,
    responseMapping,
    isTesting,
    testResult,
    setMethod,
    setUrl,
    setHeaders,
    setBodyType,
    setBodyString,
    setBodyFormData,
    setResponseMapping,
    setIsTesting,
    setTestResult,
  } = httpState;

  // Node hook configuration
  const nodeConfig = useNode({
    id,
    data,
    onNodesChange,
    isConnectable,
    minWidth: 280,
    minHeight: 150,
  });

  // Setters configuration
  const setters = {
    setMethod,
    setUrl,
    setHeaders,
    setBodyType,
    setBodyString,
    setBodyFormData,
    setResponseMapping,
  };

  // Handlers configuration
  const handlersConfig = {
    handleConfigurationChange,
    bodyFormData,
    headers,
    responseMapping,
    bodyType,
    bodyString,
    method,
    url,
    setIsTesting,
    setTestResult,
    canEdit: nodeConfig.canEdit,
    canDelete: nodeConfig.canDelete,
    id,
    onNodesChange,
    isUltraPerformanceMode,
    setIsHovered: nodeConfig.setIsHovered,
    selected,
    isCollapsed: nodeConfig.isCollapsed,
  };

  // State for synchronization
  const state = {
    method,
    url,
    bodyType,
    bodyString,
    headers,
    bodyFormData,
    responseMapping,
  };

  const dataSetters = {
    setMethod,
    setUrl,
    setBodyType,
    setBodyString,
    setHeaders,
    setBodyFormData,
    setResponseMapping,
  };

  return {
    // State variables
    method,
    url,
    headers,
    bodyType,
    bodyString,
    bodyFormData,
    responseMapping,
    isTesting,
    testResult,
    // Node configuration
    ...nodeConfig,
    // Configurations
    setters,
    handlersConfig,
    state,
    dataSetters,
  };
};

const HttpRequestNode = memo(
  ({
    data = {},
    isConnectable = true,
    selected = false,
    id,
    onNodesChange,
    isUltraPerformanceMode = false,
  }) => {
    const { updateNodeData } = useFlowStore();

    const defaultData = useMemo(() => createDefaultNodeData(), []);

    // All state using custom hook
    const httpState = useHttpRequestState(data, defaultData);

    // Using helper function processBodyTypeChange

    // Field updates using custom hook
    const nodeConfig = { id, data };
    const utilities = { trackChanges: undefined, updateNodeData }; // Will be filled by config hook
    const { handleConfigurationChange } = useFieldUpdates(
      undefined, // Will be filled by config hook
      nodeConfig,
      utilities,
    );

    // All configuration using custom hook
    const config = useHttpRequestNodeConfig({
      httpState,
      id,
      data,
      onNodesChange,
      isConnectable,
      handleConfigurationChange,
      isUltraPerformanceMode,
      selected,
    });

    // Extract configuration
    const {
      method,
      url,
      headers,
      bodyType,
      bodyString,
      bodyFormData,
      responseMapping,
      isTesting,
      testResult,
      isCollapsed,
      showContextMenu,
      contextMenuPosition,
      errorMessage,
      nodeRef,
      toggleCollapse,
      handleContextMenu,
      setShowContextMenu,
      trackChanges,
      canEdit,
      handlersConfig,
      state,
      dataSetters,
    } = config;

    // Update utilities with extracted trackChanges
    utilities.trackChanges = trackChanges;

    // All handlers using single custom hook
    const handlers = useNodeHandlers(handlersConfig);

    // Data synchronization using custom hook with effect
    useHttpRequestSynchronization({
      data,
      defaultData,
      state,
      dataSetters,
    });

    return (
      <div
        ref={nodeRef}
        className={handlers.nodeClassName}
        style={handlers.nodeStyles}
        role='button'
        tabIndex={0}
        onKeyDown={handlers.handleKeyDown}
        onDoubleClick={canEdit ? toggleCollapse : undefined}
        onMouseEnter={handlers.handleMouseEnter}
        onMouseLeave={handlers.handleMouseLeave}
        onContextMenu={handleContextMenu}
        aria-label={data.label || 'Nodo HTTP'}
      >
        <Handle
          type='target'
          position={Position.Top}
          isConnectable={isConnectable}
          className='ts-handle-target'
        />

        <NodeHeader
          canEdit={canEdit}
          toggleCollapse={toggleCollapse}
          data={data}
          defaultData={defaultData}
          isCollapsed={isCollapsed}
        />

        <HttpRequestNodeContent
          isCollapsed={isCollapsed}
          errorMessage={errorMessage}
          id={id}
          method={method}
          url={url}
          headers={headers}
          bodyType={bodyType}
          bodyString={bodyString}
          bodyFormData={bodyFormData}
          responseMapping={responseMapping}
          isTesting={isTesting}
          testResult={testResult}
          data={data}
          canEdit={canEdit}
          handleConfigurationChange={handleConfigurationChange}
          handlers={handlers}
        />

        {showContextMenu && (
          <ContextMenu
            x={contextMenuPosition.x}
            y={contextMenuPosition.y}
            items={handlers.contextMenuItems}
            onClose={() => setShowContextMenu(false)}
          />
        )}

        <BottomHandles isConnectable={isConnectable} />
      </div>
    );
  },
  arePropertiesEqual,
);

// Subcomponente: Contenido principal del nodo HTTP
const HttpRequestNodeContent = ({
  isCollapsed,
  errorMessage,
  id,
  method,
  url,
  headers,
  bodyType,
  bodyString,
  bodyFormData,
  responseMapping,
  isTesting,
  testResult,
  data,
  canEdit,
  handleConfigurationChange,
  handlers,
}) => {
  if (isCollapsed) return;

  return (
    <div className='ts-node-content'>
      {errorMessage && (
        <div className='ts-node-error-message'>
          <AlertCircle size={14} /> {errorMessage}
        </div>
      )}

      <BasicConfigSection
        id={id}
        method={method}
        url={url}
        handleConfigurationChange={handleConfigurationChange}
        canEdit={canEdit}
      />

      <div className='ts-node-section-title'>Cabeceras</div>
      <HeadersSection
        headers={headers}
        canEdit={canEdit}
        handleHeaderChange={handlers.handleHeaderChange}
        removeHeader={handlers.removeHeader}
        addHeader={handlers.addHeader}
      />

      <RequestBodySection
        id={id}
        bodyType={bodyType}
        bodyString={bodyString}
        bodyFormData={bodyFormData}
        canEdit={canEdit}
        handleConfigurationChange={handleConfigurationChange}
        handleFormDataEntryChange={handlers.handleFormDataEntryChange}
        removeFormDataEntry={handlers.removeFormDataEntry}
        addFormDataEntry={handlers.addFormDataEntry}
      />

      <ResponseMappingSection
        id={id}
        responseMapping={responseMapping}
        canEdit={canEdit}
        handleResponseMapEntryChange={handlers.handleResponseMapEntryChange}
        responseSourceOptions={handlers.responseSourceOptions}
        pathKeyLabelFn={getPathOrKeyLabel}
        removeResponseMapEntry={handlers.removeResponseMapEntry}
        addResponseMapEntry={handlers.addResponseMapEntry}
      />

      {canEdit && (
        <TestSection
          handleTestRequest={handlers.handleTestRequest}
          isTesting={isTesting}
          url={url}
          testResult={testResult}
        />
      )}

      {data.notes && <div className='ts-node-notes'>Notas: {data.notes}</div>}
    </div>
  );
};

HttpRequestNodeContent.propTypes = {
  isCollapsed: PropTypes.bool.isRequired,
  errorMessage: PropTypes.string,
  id: PropTypes.string.isRequired,
  method: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired,
  headers: PropTypes.array.isRequired,
  bodyType: PropTypes.string.isRequired,
  bodyString: PropTypes.string.isRequired,
  bodyFormData: PropTypes.array.isRequired,
  responseMapping: PropTypes.array.isRequired,
  isTesting: PropTypes.bool.isRequired,
  testResult: PropTypes.object,
  data: PropTypes.object.isRequired,
  canEdit: PropTypes.bool.isRequired,
  handleConfigurationChange: PropTypes.func.isRequired,
  handlers: PropTypes.object.isRequired,
};

HttpRequestNode.propTypes = {
  data: PropTypes.shape({
    label: PropTypes.string,
    type: PropTypes.string,
    method: PropTypes.string,
    url: PropTypes.string,
    headers: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        key: PropTypes.string,
        value: PropTypes.string,
      }),
    ),
    bodyType: PropTypes.string,
    bodyString: PropTypes.string,
    bodyFormData: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        key: PropTypes.string,
        value: PropTypes.string,
      }),
    ),
    responseMapping: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        source: PropTypes.string,
        pathOrKey: PropTypes.string,
        targetVariable: PropTypes.string,
        defaultValue: PropTypes.string,
      }),
    ),
    status: PropTypes.string,
    isCollapsed: PropTypes.bool,
    lastModified: PropTypes.string,
    modifiedBy: PropTypes.string,
    notes: PropTypes.string,
    lodLevel: PropTypes.number,
  }).isRequired,
  isConnectable: PropTypes.bool,
  selected: PropTypes.bool,
  id: PropTypes.string.isRequired,
  onNodesChange: PropTypes.func.isRequired,
  isUltraPerformanceMode: PropTypes.bool,
};

HttpRequestNode.displayName = 'HttpRequestNode';

export default HttpRequestNode;
