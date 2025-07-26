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
  return (
    previous.selected === next.selected &&
    previous.isConnectable === next.isConnectable
  );
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
    JSON.stringify(previousData.bodyFormData) ===
      JSON.stringify(nextData.bodyFormData) &&
    JSON.stringify(previousData.responseMapping) ===
      JSON.stringify(nextData.responseMapping)
  );
}

const arePropertiesEqual = (previousProperties, nextProperties) => {
  // Comparar propiedades básicas
  if (!_compareBasicProps(previousProperties, nextProperties)) {
    return false;
  }

  // Deep comparison for the data object
  const previousData = previousProperties.data || {};
  const nextData = nextProperties.data || {};

  // Comparar datos primitivos
  if (!_comparePrimitiveData(previousData, nextData)) {
    return false;
  }

  // Comparar datos complejos
  return _compareComplexData(previousData, nextData);
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

    const defaultData = useMemo(
      () => ({
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
      }),
      [],
    );

    const [method, setMethod] = useState(data.method || defaultData.method);
    const [url, setUrl] = useState(data.url || defaultData.url);
    const [headers, setHeaders] = useState(data.headers || defaultData.headers);
    const [bodyType, setBodyType] = useState(
      data.bodyType || defaultData.bodyType,
    );
    const [bodyString, setBodyString] = useState(
      data.bodyString || defaultData.bodyString,
    );
    const [bodyFormData, setBodyFormData] = useState(
      data.bodyFormData || defaultData.bodyFormData,
    );
    const initialResponseMapping = (
      data.responseMapping || defaultData.responseMapping
    ).map((entry) => ({
      ...entry,
      defaultValue: entry.defaultValue === undefined ? '' : entry.defaultValue,
    }));
    const [responseMapping, setResponseMapping] = useState(
      initialResponseMapping,
    );
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState();

    // Node hook - moved early to fix no-use-before-define
    const {
      isCollapsed,
      showContextMenu,
      contextMenuPosition,
      errorMessage,
      nodeRef,
      toggleCollapse,
      handleContextMenu,
      setShowContextMenu,
      setIsHovered,
      trackChanges,
      canEdit,
      canDelete,
    } = useNode({
      id,
      data,
      onNodesChange,
      isConnectable,
      minWidth: 280,
      minHeight: 150,
    });

    // Helper function to process body type changes - moved early to fix no-use-before-define
    const processBodyTypeChange = useCallback((value, newLocalStateUpdates) => {
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
    }, []);

    // Helper function to process field updates based on field type - moved early to fix no-use-before-define
    const processFieldUpdate = useCallback(
      (field, value, newLocalStateUpdates) => {
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
            processBodyTypeChange(value, newLocalStateUpdates);
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
      [processBodyTypeChange],
    );

    // Configuration change handler - moved early to fix no-use-before-define
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

        trackChanges(
          'configuration',
          updatedNodeData,
          oldDataForLog,
          newLocalStateUpdates,
        );

        updateNodeData(id, updatedNodeData);
      },
      [id, data, trackChanges, updateNodeData, processFieldUpdate],
    );

    // Form data management handlers - moved early to fix no-use-before-define
    const formDataHandlers = useMemo(
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
          const newFormData = bodyFormData.filter(
            (_, index_) => index_ !== index,
          );
          handleConfigurationChange('bodyFormData', newFormData);
        },
      }),
      [bodyFormData, handleConfigurationChange],
    );

    // Extract form data handlers for early use in JSX
    const handleFormDataEntryChange = formDataHandlers.change;
    const addFormDataEntry = formDataHandlers.add;
    const removeFormDataEntry = formDataHandlers.remove;

    // Helper to sync simple properties
    const _syncSimpleProperties = useCallback(() => {
      if (data.method !== method) setMethod(data.method || defaultData.method);
      if (data.url !== url) setUrl(data.url || defaultData.url);
      if (data.bodyType !== bodyType)
        setBodyType(data.bodyType || defaultData.bodyType);
      if (data.bodyString !== bodyString)
        setBodyString(data.bodyString || defaultData.bodyString);
    }, [data, method, url, bodyType, bodyString, defaultData]);

    // Helper to sync complex objects
    const _syncComplexObjects = useCallback(() => {
      if (JSON.stringify(data.headers) !== JSON.stringify(headers)) {
        setHeaders(data.headers || defaultData.headers);
      }
      if (JSON.stringify(data.bodyFormData) !== JSON.stringify(bodyFormData)) {
        setBodyFormData(data.bodyFormData || defaultData.bodyFormData);
      }
    }, [data, headers, bodyFormData, defaultData]);

    // Helper to transform and sync response mapping
    const _syncResponseMapping = useCallback(() => {
      const newResponseMappingFromData = (data.responseMapping || []).map(
        (entry) => ({
          ...entry,
          defaultValue:
            entry.defaultValue === undefined ? '' : entry.defaultValue,
        }),
      );
      if (
        JSON.stringify(newResponseMappingFromData) !==
        JSON.stringify(responseMapping)
      ) {
        setResponseMapping(newResponseMappingFromData);
      }
    }, [data.responseMapping, responseMapping]);

    // Helper function to synchronize state with data prop
    const synchronizeStateWithData = useCallback(() => {
      _syncSimpleProperties();
      _syncComplexObjects();
      _syncResponseMapping();
    }, [_syncSimpleProperties, _syncComplexObjects, _syncResponseMapping]);

    // Helper function to handle body type changes
    // This effect synchronizes the component's internal state with the `data` prop.
    useEffect(() => {
      synchronizeStateWithData();
    }, [synchronizeStateWithData]);

    // Header management handlers
    const headerHandlers = useMemo(
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

    const handleHeaderChange = headerHandlers.change;
    const addHeader = headerHandlers.add;
    const removeHeader = headerHandlers.remove;

    // Helper function to render headers section JSX
    const renderHeadersSection = useCallback(
      () => (
        <>
          {headers.map((header, index) => (
            <div key={header.id} className='ts-header-item ts-key-value-item'>
              <input
                type='text'
                placeholder='Clave'
                value={header.key}
                onChange={(event) =>
                  handleHeaderChange(index, 'key', event.target.value)
                }
                className='ts-header-input ts-key-value-input-key'
                disabled={!canEdit}
              />
              <input
                type='text'
                placeholder='Valor'
                value={header.value}
                onChange={(event) =>
                  handleHeaderChange(index, 'value', event.target.value)
                }
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
      ),
      [headers, canEdit, handleHeaderChange, removeHeader, addHeader],
    );

    // Helper function to render body section JSX
    const renderBodySection = useCallback(
      () => (
        <>
          <div className='ts-node-section-title'>Cuerpo de la Petición</div>
          <div className='ts-node-setting'>
            <label htmlFor={`bodyType-${id}`}>Tipo de Cuerpo:</label>
            <select
              id={`bodyType-${id}`}
              value={bodyType}
              onChange={(event) =>
                handleConfigurationChange('bodyType', event.target.value)
              }
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
                onChange={(event) =>
                  handleConfigurationChange('bodyString', event.target.value)
                }
                placeholder={
                  bodyType === 'json'
                    ? '{ "clave": "valor" }'
                    : 'Contenido del cuerpo...'
                }
                rows={4}
                disabled={!canEdit}
                className='ts-body-textarea'
              />
            </div>
          )}

          {bodyType === 'form-data' && (
            <div className='ts-formdata-section'>
              {bodyFormData.map((entry, index) => (
                <div
                  key={entry.id}
                  className='ts-formdata-item ts-key-value-item'
                >
                  <input
                    type='text'
                    placeholder='Clave'
                    value={entry.key}
                    onChange={(event) =>
                      handleFormDataEntryChange(
                        index,
                        'key',
                        event.target.value,
                      )
                    }
                    className='ts-formdata-input ts-key-value-input-key'
                    disabled={!canEdit}
                  />
                  <input
                    type='text'
                    placeholder='Valor'
                    value={entry.value}
                    onChange={(event) =>
                      handleFormDataEntryChange(
                        index,
                        'value',
                        event.target.value,
                      )
                    }
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
      ),
      [
        id,
        bodyType,
        bodyString,
        bodyFormData,
        canEdit,
        handleConfigurationChange,
        handleFormDataEntryChange,
        removeFormDataEntry,
        addFormDataEntry,
      ],
    );

    const addResponseMapEntry = useCallback(() => {
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

    const removeResponseMapEntry = useCallback(
      (index) => {
        const newResponseMapping = responseMapping.filter(
          (_, index_) => index_ !== index,
        );
        handleConfigurationChange('responseMapping', newResponseMapping);
      },
      [responseMapping, handleConfigurationChange],
    );

    const responseSourceOptions = useMemo(
      () => [
        { value: 'status_code', label: 'Código de Estado' },
        { value: 'body_json_path', label: 'Body (JSON Path)' },
        { value: 'header_key', label: 'Cabecera (Header)' },
      ],
      [],
    );

    const handleResponseMapEntryChange = useCallback(
      (index, field, value) => {
        const newResponseMapping = responseMapping.map((entry, index_) => {
          if (index_ !== index) return entry;
          // The 'field' variable is controlled and comes from a trusted source.

          return { ...entry, [field]: value };
        });
        if (field === 'source' && value === 'status_code') {
          // Acceso seguro a array con validación explícita
          const item = newResponseMapping.at(index);
          if (item && typeof item === 'object') {
            item.pathOrKey = '';
          }
        }
        handleConfigurationChange('responseMapping', newResponseMapping);
      },
      [responseMapping, handleConfigurationChange],
    );

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

    // Helper function to render response mapping section JSX
    const renderResponseMappingSection = useCallback(
      () => (
        <>
          <div className='ts-node-section-title'>Mapeo de Respuesta</div>
          {responseMapping.map((entry, index) => (
            <div key={entry.id} className='ts-response-map-item'>
              <div className='ts-node-setting ts-response-map-row'>
                <label htmlFor={`map-source-${id}-${index}`}>Fuente:</label>
                <select
                  id={`map-source-${id}-${index}`}
                  value={entry.source}
                  onChange={(event) =>
                    handleResponseMapEntryChange(
                      index,
                      'source',
                      event.target.value,
                    )
                  }
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
                  <label htmlFor={`map-path-${id}-${index}`}>
                    {`${getPathOrKeyLabel(entry.source)}:`}
                  </label>
                  <input
                    type='text'
                    id={`map-path-${id}-${index}`}
                    value={entry.pathOrKey}
                    placeholder={getPathOrKeyLabel(entry.source)}
                    onChange={(event) =>
                      handleResponseMapEntryChange(
                        index,
                        'pathOrKey',
                        event.target.value,
                      )
                    }
                    disabled={!canEdit}
                    className='ts-response-map-input'
                  />
                </div>
              )}

              <div className='ts-node-setting ts-response-map-row'>
                <label htmlFor={`map-targetVar-${id}-${index}`}>
                  Guardar en Variable:
                </label>
                <input
                  type='text'
                  id={`map-targetVar-${id}-${index}`}
                  value={entry.targetVariable}
                  placeholder='nombreDeVariable'
                  onChange={(event) =>
                    handleResponseMapEntryChange(
                      index,
                      'targetVariable',
                      event.target.value,
                    )
                  }
                  disabled={!canEdit}
                  className='ts-response-map-input'
                />
              </div>
              <div className='ts-node-setting ts-response-map-row'>
                <label htmlFor={`map-defaultValue-${id}-${index}`}>
                  Valor por Defecto:
                </label>
                <input
                  type='text'
                  id={`map-defaultValue-${id}-${index}`}
                  value={entry.defaultValue}
                  placeholder='Valor por defecto'
                  onChange={(event) =>
                    handleResponseMapEntryChange(
                      index,
                      'defaultValue',
                      event.target.value,
                    )
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
      ),
      [
        id,
        responseMapping,
        canEdit,
        handleResponseMapEntryChange,
        responseSourceOptions,
        removeResponseMapEntry,
        addResponseMapEntry,
      ],
    );

    // Helper function to process successful response
    const processSuccessResponse = useCallback((response) => {
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

    // Helper function to process error response
    const processErrorResponse = useCallback((error) => {
      let errorDetails;
      if (error.response) {
        const responseData = JSON.stringify(error.response.data);
        errorDetails =
          `Servidor respondió con estado ${error.response.status}. ` +
          `Data: ${responseData}`;
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

    // Helper function to prepare request payload
    const prepareRequestPayload = useCallback(() => {
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

    // Handler for test request functionality
    const handleTestRequest = useCallback(async () => {
      setIsTesting(true);
      setTestResult(undefined);

      try {
        const requestConfig = prepareRequestPayload();
        const response = await axios(requestConfig);
        const result = processSuccessResponse(response);
        setTestResult(result);
      } catch (error) {
        const result = processErrorResponse(error);
        setTestResult(result);
      } finally {
        setIsTesting(false);
      }
    }, [prepareRequestPayload, processSuccessResponse, processErrorResponse]);

    // Helper to render test button
    const _renderTestButton = useCallback(
      () => (
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
      ),
      [handleTestRequest, isTesting, url],
    );

    // Helper to render test result status
    const _renderTestResultStatus = useCallback(
      () => (
        <p>
          Estado: {testResult?.statusCode || 'N/A'}{' '}
          {testResult?.success ? (
            <CheckCircle size={14} className='ts-icon-success' />
          ) : (
            <XCircle size={14} className='ts-icon-error' />
          )}
        </p>
      ),
      [testResult],
    );

    // Helper to render test result details
    const _renderTestResultDetails = useCallback(
      () => (
        <>
          {testResult?.message && <p>Mensaje: {testResult.message}</p>}
          {testResult?.responseBodyPreview && (
            <div>
              <p>Preview Body Respuesta:</p>
              <pre className='ts-test-preview-area'>
                {testResult.responseBodyPreview}
              </pre>
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
            <p className='ts-test-error-details'>
              Detalles: {testResult.errorDetails}
            </p>
          )}
        </>
      ),
      [testResult],
    );

    // Helper function to render test section JSX
    const renderTestSection = useCallback(
      () => (
        <div className='ts-node-section ts-test-section'>
          <div className='ts-node-section-title'>Probar Solicitud</div>
          {_renderTestButton()}
          {testResult && (
            <div
              className={`ts-test-result ${testResult.success ? 'ts-test-success' : 'ts-test-error'}`}
            >
              <strong>Resultado de la Prueba:</strong>
              {_renderTestResultStatus()}
              {_renderTestResultDetails()}
            </div>
          )}
        </div>
      ),
      [
        _renderTestButton,
        _renderTestResultStatus,
        _renderTestResultDetails,
        testResult,
      ],
    );

    const contextMenuItems = [
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

    // Optimized mouse handlers to reduce cognitive complexity
    const handleMouseEnter = useMemo(
      () => (isUltraPerformanceMode ? undefined : () => setIsHovered(true)),
      [isUltraPerformanceMode, setIsHovered],
    );

    const handleMouseLeave = useMemo(
      () => (isUltraPerformanceMode ? undefined : () => setIsHovered(false)),
      [isUltraPerformanceMode, setIsHovered],
    );

    // Optimized styles to reduce cognitive complexity
    const nodeStyles = useMemo(
      () => ({
        transition: isUltraPerformanceMode ? 'none' : 'all 0.2s ease-in-out',
        boxShadow: isUltraPerformanceMode
          ? 'none'
          : '0 0 10px rgba(0, 0, 0, 0.1)',
      }),
      [isUltraPerformanceMode],
    );

    // Optimized className to reduce cognitive complexity
    const nodeClassName = useMemo(() => {
      let className = 'http-request-node';
      if (selected) className += ' selected';
      if (isCollapsed) className += ' collapsed';
      if (isUltraPerformanceMode) className += ' ultra-performance';
      return className;
    }, [selected, isCollapsed, isUltraPerformanceMode]);

    // Helper to render node header
    const _renderNodeHeader = useCallback(
      () => (
        <div
          className='ts-node-header'
          onDoubleClick={canEdit ? toggleCollapse : undefined}
        >
          <Network size={16} className='ts-node-icon' />
          <span className='ts-node-title'>
            {data.label || defaultData.label}
          </span>
          <div className='ts-node-header-actions'>
            {canEdit && (
              <Tooltip content={isCollapsed ? 'Expandir' : 'Colapsar'}>
                <button
                  onClick={toggleCollapse}
                  className='ts-node-action-button'
                >
                  {isCollapsed ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronUp size={14} />
                  )}
                </button>
              </Tooltip>
            )}
          </div>
        </div>
      ),
      [canEdit, toggleCollapse, data.label, defaultData.label, isCollapsed],
    );

    // Helper to render basic configuration (method and URL)
    const _renderBasicConfig = useCallback(
      () => (
        <>
          <div className='ts-node-setting'>
            <label htmlFor={`method-${id}`}>Método:</label>
            <select
              id={`method-${id}`}
              value={method}
              onChange={(event) =>
                handleConfigurationChange('method', event.target.value)
              }
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
              onChange={(event) =>
                handleConfigurationChange('url', event.target.value)
              }
              placeholder='https://api.example.com/data'
              disabled={!canEdit}
            />
          </div>
        </>
      ),
      [id, method, url, handleConfigurationChange, canEdit],
    );

    return (
      <div
        ref={nodeRef}
        className={nodeClassName}
        style={nodeStyles}
        role='button'
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onDoubleClick={canEdit ? toggleCollapse : undefined}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onContextMenu={handleContextMenu}
        aria-label={data.label || 'Nodo HTTP'}
      >
        <Handle
          type='target'
          position={Position.Top}
          isConnectable={isConnectable}
          className='ts-handle-target'
        />

        {_renderNodeHeader()}

        {!isCollapsed && (
          <div className='ts-node-content'>
            {errorMessage && (
              <div className='ts-node-error-message'>
                <AlertCircle size={14} /> {errorMessage}
              </div>
            )}

            {_renderBasicConfig()}

            <div className='ts-node-section-title'>Cabeceras</div>
            {renderHeadersSection()}

            {renderBodySection()}

            {renderResponseMappingSection()}

            {canEdit && renderTestSection()}

            {data.notes && (
              <div className='ts-node-notes'>Notas: {data.notes}</div>
            )}
          </div>
        )}

        {showContextMenu && (
          <ContextMenu
            x={contextMenuPosition.x}
            y={contextMenuPosition.y}
            items={contextMenuItems}
            onClose={() => setShowContextMenu(false)}
          />
        )}

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
      </div>
    );
  },
  arePropertiesEqual,
);

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
