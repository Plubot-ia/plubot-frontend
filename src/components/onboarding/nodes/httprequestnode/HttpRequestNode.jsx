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
import { useState, useEffect, useCallback, memo } from 'react';
import { Handle, Position } from 'reactflow';
import { v4 as uuidv4 } from 'uuid';

import useNode from '@/hooks/useNode';
import useFlowStore from '@/stores/use-flow-store';
import { NODE_TYPES } from '@/utils/node-config.js';

import ContextMenu from '../../ui/context-menu';
import Tooltip from '../../ui/ToolTip';

import './HttpRequestNode.css';

const arePropertiesEqual = (previousProperties, nextProperties) => {
  if (
    previousProperties.selected !== nextProperties.selected ||
    previousProperties.isConnectable !== nextProperties.isConnectable
  ) {
    return false;
  }

  // Deep comparison for the data object
  const previousData = previousProperties.data || {};
  const nextData = nextProperties.data || {};

  // Compare primitive and easily comparable fields first
  if (
    previousData.label !== nextData.label ||
    previousData.method !== nextData.method ||
    previousData.url !== nextData.url ||
    previousData.bodyType !== nextData.bodyType ||
    previousData.bodyString !== nextData.bodyString ||
    previousData.isCollapsed !== nextData.isCollapsed
  ) {
    return false;
  }

  // Use JSON.stringify for deep comparison of arrays of objects
  // This is a pragmatic approach for complex but serializable data.
  if (
    JSON.stringify(previousData.headers) !== JSON.stringify(nextData.headers) ||
    JSON.stringify(previousData.bodyFormData) !==
      JSON.stringify(nextData.bodyFormData) ||
    JSON.stringify(previousData.responseMapping) !==
      JSON.stringify(nextData.responseMapping)
  ) {
    return false;
  }

  return true; // Props are equal
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

    useEffect(() => {}, [id, data.lodLevel]);

    const defaultData = {
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
    };

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
    const [testResult, setTestResult] = useState(null);

    // This effect synchronizes the component's internal state with the `data` prop.
    // It's designed to run only when the `data` prop object itself changes,
    // preventing infinite loops that would occur if state variables updated within
    // the effect were added to the dependency array.
    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(() => {
      if (data.method !== method) setMethod(data.method || defaultData.method);
      if (data.url !== url) setUrl(data.url || defaultData.url);
      if (JSON.stringify(data.headers) !== JSON.stringify(headers)) {
        setHeaders(data.headers || defaultData.headers);
      }
      if (data.bodyType !== bodyType)
        setBodyType(data.bodyType || defaultData.bodyType);
      if (data.bodyString !== bodyString)
        setBodyString(data.bodyString || defaultData.bodyString);
      if (JSON.stringify(data.bodyFormData) !== JSON.stringify(bodyFormData)) {
        setBodyFormData(data.bodyFormData || defaultData.bodyFormData);
      }
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
    }, [data]);
    /* eslint-enable react-hooks/exhaustive-deps */

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

    const handleConfigurationChange = useCallback(
      (field, value) => {
        const oldDataForLog = { ...data };
        const newLocalStateUpdates = {};

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
      [id, data, trackChanges, updateNodeData],
    );

    const handleHeaderChange = (index, field, value) => {
      const newHeaders = headers.map((header, index_) => {
        if (index_ !== index) return header;
        // The 'field' variable is controlled and can only be 'key' or 'value', so this is safe.

        return { ...header, [field]: value };
      });
      handleConfigurationChange('headers', newHeaders);
    };

    const addHeader = () => {
      const newHeader = { id: uuidv4(), key: '', value: '' };
      const newHeaders = [...headers, newHeader];
      handleConfigurationChange('headers', newHeaders);
    };

    const removeHeader = (index) => {
      const newHeaders = headers.filter((_, index_) => index_ !== index);
      handleConfigurationChange('headers', newHeaders);
    };

    const handleFormDataEntryChange = (index, field, value) => {
      const newFormData = bodyFormData.map((entry, index_) => {
        if (index_ !== index) return entry;
        // The 'field' variable is controlled and can only be 'key' or 'value', so this is safe.

        return { ...entry, [field]: value };
      });
      handleConfigurationChange('bodyFormData', newFormData);
    };

    const addFormDataEntry = () => {
      const newEntry = { id: uuidv4(), key: '', value: '' };
      const newFormData = [...bodyFormData, newEntry];
      handleConfigurationChange('bodyFormData', newFormData);
    };

    const removeFormDataEntry = (index) => {
      const newFormData = bodyFormData.filter((_, index_) => index_ !== index);
      handleConfigurationChange('bodyFormData', newFormData);
    };

    const handleResponseMapEntryChange = (index, field, value) => {
      const newResponseMapping = responseMapping.map((entry, index_) => {
        if (index_ !== index) return entry;
        // The 'field' variable is controlled and comes from a trusted source.

        return { ...entry, [field]: value };
      });
      if (field === 'source' && value === 'status_code') {
        // The linter incorrectly flags the line below as a security risk.
        // It's a false positive, as we are assigning a static empty string, not user input.
        // eslint-disable-next-line security/detect-object-injection
        newResponseMapping[index].pathOrKey = '';
      }
      handleConfigurationChange('responseMapping', newResponseMapping);
    };

    const addResponseMapEntry = () => {
      const newEntry = {
        id: uuidv4(),
        source: 'status_code',
        pathOrKey: '',
        targetVariable: '',
        defaultValue: '',
      };
      const newResponseMapping = [...responseMapping, newEntry];
      handleConfigurationChange('responseMapping', newResponseMapping);
    };

    const removeResponseMapEntry = (index) => {
      const newResponseMapping = responseMapping.filter(
        (_, index_) => index_ !== index,
      );
      handleConfigurationChange('responseMapping', newResponseMapping);
    };

    const responseSourceOptions = [
      { value: 'status_code', label: 'Código de Estado' },
      { value: 'body_json_path', label: 'Body (JSON Path)' },
      { value: 'header_key', label: 'Cabecera (Header)' },
    ];

    const getPathOrKeyLabel = (source) => {
      if (source === 'body_json_path') return 'JSON Path (ej: data.user.id)';
      if (source === 'header_key') return 'Nombre Cabecera (ej: X-Request-ID)';
      return '';
    };

    const contextMenuItems = [
      {
        label: 'Duplicar Nodo',
        action: () => {
          // TODO: Implementar la lógica de duplicación de nodos.
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

    const handleTestRequest = useCallback(async () => {
      setIsTesting(true);
      setTestResult(null);

      try {
        const formData = new FormData();
        if (bodyType === 'form-data') {
          for (const item of bodyFormData)
            formData.append(item.key, item.value);
        }

        const getBodyPayload = () => {
          if (bodyType === 'json') return JSON.parse(bodyString || '{}');
          if (bodyType === 'text') return bodyString;
          if (bodyType === 'form-data') return formData;
          return null;
        };

        const response = await axios({
          method,
          url,
          headers: Object.fromEntries(headers.map((h) => [h.key, h.value])),
          data: getBodyPayload(),
          timeout: 10_000, // 10 segundos de timeout
        });

        const responseBodyPreview =
          typeof response.data === 'object'
            ? JSON.stringify(response.data, null, 2)
            : String(response.data);

        setTestResult({
          success: true,
          statusCode: response.status,
          message: 'Solicitud exitosa.',
          responseBodyPreview: responseBodyPreview.slice(0, 500), // Limitar preview
          headersPreview: response.headers,
        });
      } catch (error) {
        let errorDetails = 'Error desconocido.';
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

        setTestResult({
          success: false,
          message: 'Falló la solicitud de prueba.',
          errorDetails,
        });
      } finally {
        setIsTesting(false);
      }
    }, [method, url, headers, bodyType, bodyString, bodyFormData]);

    return (
      <div
        ref={nodeRef}
        className={`http-request-node${selected ? ' selected' : ''}${isCollapsed ? ' collapsed' : ''}${isUltraPerformanceMode ? ' ultra-performance' : ''}`}
        style={{
          transition: isUltraPerformanceMode ? 'none' : 'all 0.2s ease-in-out',
          boxShadow: isUltraPerformanceMode
            ? 'none'
            : '0 0 10px rgba(0, 0, 0, 0.1)',
        }}
        role='button'
        tabIndex={0}
        onKeyDown={(e) => {
          if (canEdit && (e.key === 'Enter' || e.key === ' ')) {
            toggleCollapse();
            e.preventDefault(); // Evita el scroll en la página al presionar espacio
          }
        }}
        onDoubleClick={canEdit ? toggleCollapse : undefined}
        onMouseEnter={
          isUltraPerformanceMode ? undefined : () => setIsHovered(true)
        }
        onMouseLeave={
          isUltraPerformanceMode ? undefined : () => setIsHovered(false)
        }
        onContextMenu={handleContextMenu}
        aria-label={data.label || 'Nodo HTTP'}
      >
        <Handle
          type='target'
          position={Position.Top}
          isConnectable={isConnectable}
          className='ts-handle-target'
        />

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

        {!isCollapsed && (
          <div className='ts-node-content'>
            {errorMessage && (
              <div className='ts-node-error-message'>
                <AlertCircle size={14} /> {errorMessage}
              </div>
            )}

            <div className='ts-node-setting'>
              <label htmlFor={`method-${id}`}>Método:</label>
              <select
                id={`method-${id}`}
                value={method}
                onChange={(e) =>
                  handleConfigurationChange('method', e.target.value)
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
                onChange={(e) =>
                  handleConfigurationChange('url', e.target.value)
                }
                placeholder='https://api.example.com/data'
                disabled={!canEdit}
              />
            </div>

            <div className='ts-node-section-title'>Cabeceras</div>
            {headers.map((header, index) => (
              <div key={header.id} className='ts-header-item ts-key-value-item'>
                <input
                  type='text'
                  placeholder='Clave'
                  value={header.key}
                  onChange={(e) =>
                    handleHeaderChange(index, 'key', e.target.value)
                  }
                  className='ts-header-input ts-key-value-input-key'
                  disabled={!canEdit}
                />
                <input
                  type='text'
                  placeholder='Valor'
                  value={header.value}
                  onChange={(e) =>
                    handleHeaderChange(index, 'value', e.target.value)
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

            <div className='ts-node-section-title'>Cuerpo de la Petición</div>
            <div className='ts-node-setting'>
              <label htmlFor={`bodyType-${id}`}>Tipo de Cuerpo:</label>
              <select
                id={`bodyType-${id}`}
                value={bodyType}
                onChange={(e) =>
                  handleConfigurationChange('bodyType', e.target.value)
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
                  onChange={(e) =>
                    handleConfigurationChange('bodyString', e.target.value)
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
                      onChange={(e) =>
                        handleFormDataEntryChange(index, 'key', e.target.value)
                      }
                      className='ts-formdata-input ts-key-value-input-key'
                      disabled={!canEdit}
                    />
                    <input
                      type='text'
                      placeholder='Valor'
                      value={entry.value}
                      onChange={(e) =>
                        handleFormDataEntryChange(
                          index,
                          'value',
                          e.target.value,
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
                    Añadir Campo Form Data
                  </button>
                )}
              </div>
            )}

            <div className='ts-node-section-title'>Mapeo de Respuesta</div>
            {responseMapping.map((entry, index) => (
              <div key={entry.id} className='ts-response-map-item'>
                <div className='ts-node-setting ts-response-map-row'>
                  <label htmlFor={`map-source-${id}-${index}`}>Fuente:</label>
                  <select
                    id={`map-source-${id}-${index}`}
                    value={entry.source}
                    onChange={(e) =>
                      handleResponseMapEntryChange(
                        index,
                        'source',
                        e.target.value,
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
                      onChange={(e) =>
                        handleResponseMapEntryChange(
                          index,
                          'pathOrKey',
                          e.target.value,
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
                    onChange={(e) =>
                      handleResponseMapEntryChange(
                        index,
                        'targetVariable',
                        e.target.value,
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
                    onChange={(e) =>
                      handleResponseMapEntryChange(
                        index,
                        'defaultValue',
                        e.target.value,
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
                      className='ts-remove-map-entry-button ts-icon-button'
                    >
                      <Trash2 size={14} />
                    </button>
                  </Tooltip>
                )}
              </div>
            ))}
            {canEdit && (
              <button onClick={addResponseMapEntry} className='ts-add-button'>
                Añadir Mapeo de Respuesta
              </button>
            )}

            {canEdit && (
              <div className='ts-node-section ts-test-section'>
                <div className='ts-node-section-title'>Probar Solicitud</div>
                <button
                  onClick={handleTestRequest}
                  disabled={isTesting || !url.trim()} // Deshabilitar si no hay URL o está probando
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
                {testResult && (
                  <div
                    className={`ts-test-result ${testResult.success ? 'ts-test-success' : 'ts-test-error'}`}
                  >
                    <strong>Resultado de la Prueba:</strong>
                    <p>
                      Estado: {testResult.statusCode || 'N/A'}{' '}
                      {testResult.success ? (
                        <CheckCircle size={14} className='ts-icon-success' />
                      ) : (
                        <XCircle size={14} className='ts-icon-error' />
                      )}
                    </p>
                    {testResult.message && <p>Mensaje: {testResult.message}</p>}

                    {testResult.responseBodyPreview && (
                      <div>
                        <p>Preview Body Respuesta:</p>
                        <pre className='ts-test-preview-area'>
                          {testResult.responseBodyPreview}
                        </pre>
                      </div>
                    )}
                    {testResult.headersPreview && (
                      <div>
                        <p>Preview Headers Respuesta:</p>
                        <pre className='ts-test-preview-area'>
                          {JSON.stringify(testResult.headersPreview, null, 2)}
                        </pre>
                      </div>
                    )}
                    {testResult.errorDetails && (
                      <p className='ts-test-error-details'>
                        Detalles: {testResult.errorDetails}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

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
