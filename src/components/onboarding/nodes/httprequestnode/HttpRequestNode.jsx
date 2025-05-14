import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Handle, Position } from 'reactflow';
import {
  Network, 
  ChevronDown,
  ChevronUp,
  Trash2,
  Copy,
  AlertCircle,
  CheckCircle, 
  XCircle 
} from 'lucide-react';
import PropTypes from 'prop-types';
import Tooltip from '../../ui/ToolTip'; 
import ContextMenu from '../../ui/context-menu'; 
import useNode from '@/hooks/useNode';
import { NODE_TYPES } from '@/utils/nodeConfig'; 
import { v4 as uuidv4 } from 'uuid'; 
import './HttpRequestNode.css';

const HttpRequestNode = React.memo(
  ({
    data = {}, 
    isConnectable = true,
    selected = false,
    id,
    setNodes,
    isUltraPerformanceMode = false,
  }) => {
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
    const [bodyType, setBodyType] = useState(data.bodyType || defaultData.bodyType);
    const [bodyString, setBodyString] = useState(data.bodyString || defaultData.bodyString); 
    const [bodyFormData, setBodyFormData] = useState(data.bodyFormData || defaultData.bodyFormData); 
    const initialResponseMapping = (data.responseMapping || defaultData.responseMapping).map(entry => ({
      ...entry,
      defaultValue: entry.defaultValue === undefined ? '' : entry.defaultValue
    }));
    const [responseMapping, setResponseMapping] = useState(initialResponseMapping); 
    const [isTesting, setIsTesting] = useState(false); // Nuevo estado para prueba
    const [testResult, setTestResult] = useState(null); // Nuevo estado para resultado de prueba

    useEffect(() => {
      if (data.method !== method) setMethod(data.method || defaultData.method);
      if (data.url !== url) setUrl(data.url || defaultData.url);
      if (JSON.stringify(data.headers) !== JSON.stringify(headers)) setHeaders(data.headers || defaultData.headers);
      if (data.bodyType !== bodyType) setBodyType(data.bodyType || defaultData.bodyType);
      if (data.bodyString !== bodyString) setBodyString(data.bodyString || defaultData.bodyString);
      if (JSON.stringify(data.bodyFormData) !== JSON.stringify(bodyFormData)) {
        setBodyFormData(data.bodyFormData || defaultData.bodyFormData);
      }
      const newResponseMappingFromData = (data.responseMapping || []).map(entry => ({
        ...entry,
        defaultValue: entry.defaultValue === undefined ? '' : entry.defaultValue
      }));
      if (JSON.stringify(newResponseMappingFromData) !== JSON.stringify(responseMapping)) { 
        setResponseMapping(newResponseMappingFromData);
      }
    }, [data]); 

    const {
      isCollapsed,
      showContextMenu,
      contextMenuPosition,
      errorMessage,
      isHovered,
      nodeRef, 
      toggleCollapse,
      handleContextMenu,
      handleClick,
      setShowContextMenu,
      setIsHovered,
      showError,
      getStatusClass,
      trackChanges,
      canEdit, 
      canDelete, 
    } = useNode({
      id,
      data, 
      setNodes,
      isConnectable,
      minWidth: 280, 
      minHeight: 150, 
    });

    const handleConfigurationChange = useCallback((field, value) => {
        const oldDataForLog = { ...data }; 
        let newLocalStateUpdates = {}; 
    
        if (field === 'method') {
            setMethod(value);
            newLocalStateUpdates.method = value;
        } else if (field === 'url') {
            setUrl(value);
            newLocalStateUpdates.url = value;
        } else if (field === 'headers') {
            setHeaders(value); 
            newLocalStateUpdates.headers = value;
        } else if (field === 'bodyType') {
            setBodyType(value);
            newLocalStateUpdates.bodyType = value;
            if (value === 'none') {
                setBodyString('');
                setBodyFormData([]);
                newLocalStateUpdates.bodyString = '';
                newLocalStateUpdates.bodyFormData = [];
            } else if (value === 'json' || value === 'text') {
                setBodyFormData([]); 
                newLocalStateUpdates.bodyFormData = [];
            } else if (value === 'form-data') {
                setBodyString(''); 
                newLocalStateUpdates.bodyString = '';
            }
        } else if (field === 'bodyString') { 
            setBodyString(value);
            newLocalStateUpdates.bodyString = value;
        } else if (field === 'bodyFormData') { 
            setBodyFormData(value); 
            newLocalStateUpdates.bodyFormData = value;
        } else if (field === 'responseMapping') {
            setResponseMapping(value);
            newLocalStateUpdates.responseMapping = value;
        }
    
        const updatedNodeData = {
            ...data, 
            ...newLocalStateUpdates, 
            lastModified: new Date().toISOString(),
        };
        
        trackChanges('configuration', updatedNodeData, oldDataForLog, newLocalStateUpdates);
    
        setNodes((nds) =>
            nds.map((n) =>
                n.id === id ? { ...n, data: updatedNodeData } : n
            )
        );
    }, [id, data, setNodes, trackChanges]); 

    const handleHeaderChange = (index, field, value) => {
      const newHeaders = headers.map((header, i) => 
        i === index ? { ...header, [field]: value } : header
      );
      handleConfigurationChange('headers', newHeaders);
    };

    const addHeader = () => {
      const newHeader = { id: uuidv4(), key: '', value: '' };
      const newHeaders = [...headers, newHeader];
      handleConfigurationChange('headers', newHeaders);
    };

    const removeHeader = (index) => {
      const newHeaders = headers.filter((_, i) => i !== index);
      handleConfigurationChange('headers', newHeaders);
    };

    const handleFormDataEntryChange = (index, field, value) => {
        const newFormData = bodyFormData.map((entry, i) =>
          i === index ? { ...entry, [field]: value } : entry
        );
        handleConfigurationChange('bodyFormData', newFormData);
    };
  
    const addFormDataEntry = () => {
        const newEntry = { id: uuidv4(), key: '', value: '' };
        const newFormData = [...bodyFormData, newEntry];
        handleConfigurationChange('bodyFormData', newFormData);
    };
  
    const removeFormDataEntry = (index) => {
        const newFormData = bodyFormData.filter((_, i) => i !== index);
        handleConfigurationChange('bodyFormData', newFormData);
    };

    const handleResponseMapEntryChange = (index, field, value) => {
      const newResponseMapping = responseMapping.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry
      );
      // Si cambia la fuente y es 'status_code', limpiar pathOrKey
      if (field === 'source' && value === 'status_code') {
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
        defaultValue: '' 
      };
      const newResponseMapping = [...responseMapping, newEntry];
      handleConfigurationChange('responseMapping', newResponseMapping);
    };

    const removeResponseMapEntry = (index) => {
      const newResponseMapping = responseMapping.filter((_, i) => i !== index);
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
      { label: 'Duplicar Nodo', action: () => console.log('Duplicar', id), icon: <Copy size={14} /> },
      { label: 'Eliminar Nodo', action: () => console.log('Eliminar', id), icon: <Trash2 size={14} />, danger: true, disabled: !canDelete },
    ];

    const handleTestRequest = async () => {
      setIsTesting(true);
      setTestResult(null); 

      const nodeConfig = {
        method,
        url,
        headers,
        bodyType,
        bodyString: bodyType === 'json' || bodyType === 'text' ? bodyString : undefined,
        bodyFormData: bodyType === 'form-data' ? bodyFormData : undefined,
      };

      try {
        console.log('Enviando para prueba:', nodeConfig);
        // TODO: Reemplazar con la llamada real al API del backend
        // const response = await fetch('/api/flows/test-http-request', { // Endpoint de ejemplo
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${YOUR_AUTH_TOKEN_IF_NEEDED}` },
        //   body: JSON.stringify(nodeConfig),
        // });
        // if (!response.ok) {
        //   const errorData = await response.json().catch(() => ({ message: response.statusText }));
        //   throw new Error(errorData.message || `Error HTTP ${response.status}`);
        // }
        // const result = await response.json();

        await new Promise(resolve => setTimeout(resolve, 1500)); 
        const mockResult = Math.random() > 0.3 
          ? { 
              success: true, 
              statusCode: 200, 
              responseBodyPreview: JSON.stringify({ message: 'Éxito desde el mock!', data: { id: 123, user: 'TestUser' } }, null, 2),
              headersPreview: { 'Content-Type': 'application/json', 'X-Test-Header': 'Plubot' },
            }
          : { 
              success: false, 
              statusCode: 404,
              message: 'Recurso no encontrado (mock).',
              errorDetails: 'La URL especificada no devolvió datos.'
            };
        
        setTestResult(mockResult);

        const statusUpdate = mockResult.success 
            ? `Prueba OK: ${mockResult.statusCode}` 
            : `Prueba Fallida: ${mockResult.statusCode || 'Error'}`;
        
        const oldDataForLog = { ...data };
        const newLocalStateUpdates = {
            status: statusUpdate,
            lastModified: new Date().toISOString(),
        };
        const updatedNodeData = { ...data, ...newLocalStateUpdates };
        trackChanges('test_result', updatedNodeData, oldDataForLog, newLocalStateUpdates);
        setNodes((nds) =>
            nds.map((n) =>
                n.id === id ? { ...n, data: updatedNodeData } : n
            )
        );

      } catch (error) {
        console.error('Error en la prueba de solicitud:', error);
        setTestResult({ success: false, message: 'Error al contactar el servicio de prueba.', errorDetails: error.message });
        
        const oldDataForLog = { ...data };
        const newLocalStateUpdates = {
            status: 'Prueba Error: Cliente',
            lastModified: new Date().toISOString(),
        };
        const updatedNodeData = { ...data, ...newLocalStateUpdates };
        trackChanges('test_result_error', updatedNodeData, oldDataForLog, newLocalStateUpdates);
        setNodes((nds) =>
            nds.map((n) =>
                n.id === id ? { ...n, data: updatedNodeData } : n
            )
        );
      } finally {
        setIsTesting(false);
      }
    };

    return (
      <div
        ref={nodeRef}
        className={`http-request-node${selected ? ' selected' : ''}${isCollapsed ? ' collapsed' : ''}${isUltraPerformanceMode ? ' ultra-performance' : ''}`}
        style={{
          transition: isUltraPerformanceMode ? 'none' : 'all 0.2s ease-in-out',
          boxShadow: isUltraPerformanceMode ? 'none' : '0 0 10px rgba(0, 0, 0, 0.1)',
        }}
        tabIndex={0}
        onDoubleClick={canEdit ? toggleCollapse : undefined}
        onMouseEnter={isUltraPerformanceMode ? undefined : () => setIsHovered(true)}
        onMouseLeave={isUltraPerformanceMode ? undefined : () => setIsHovered(false)}
        onContextMenu={handleContextMenu}
        aria-label={data.label || 'Nodo HTTP'}
      >
        <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="ts-handle-target" />
        
        <div className="ts-node-header" onDoubleClick={canEdit ? toggleCollapse : undefined}>
          <Network size={16} className="ts-node-icon" />
          <span className="ts-node-title">{data.label || defaultData.label}</span>
          <div className="ts-node-header-actions">
            {canEdit && (
                <Tooltip content={isCollapsed ? 'Expandir' : 'Colapsar'}>
                    <button onClick={toggleCollapse} className="ts-node-action-button">
                        {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                    </button>
                </Tooltip>
            )}
          </div>
        </div>

        {!isCollapsed && (
          <div className="ts-node-content">
            {errorMessage && <div className="ts-node-error-message"><AlertCircle size={14} /> {errorMessage}</div>}
            
            <div className="ts-node-setting">
              <label htmlFor={`method-${id}`}>Método:</label>
              <select 
                id={`method-${id}`} 
                value={method} 
                onChange={(e) => handleConfigurationChange('method', e.target.value)}
                disabled={!canEdit}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>

            <div className="ts-node-setting">
              <label htmlFor={`url-${id}`}>URL:</label>
              <input 
                type="text" 
                id={`url-${id}`} 
                value={url} 
                onChange={(e) => handleConfigurationChange('url', e.target.value)}
                placeholder="https://api.example.com/data"
                disabled={!canEdit}
              />
            </div>

            <div className="ts-node-section-title">Cabeceras</div>
            {headers.map((header, index) => (
              <div key={header.id} className="ts-header-item ts-key-value-item">
                <input
                  type="text"
                  placeholder="Clave"
                  value={header.key}
                  onChange={(e) => handleHeaderChange(index, 'key', e.target.value)}
                  className="ts-header-input ts-key-value-input-key"
                  disabled={!canEdit}
                />
                <input
                  type="text"
                  placeholder="Valor"
                  value={header.value}
                  onChange={(e) => handleHeaderChange(index, 'value', e.target.value)}
                  className="ts-header-input ts-key-value-input-value"
                  disabled={!canEdit}
                />
                {canEdit && (
                  <Tooltip content="Eliminar Cabecera">
                    <button onClick={() => removeHeader(index)} className="ts-remove-header-button ts-icon-button">
                      <Trash2 size={14} />
                    </button>
                  </Tooltip>
                )}
              </div>
            ))}
            {canEdit && (
              <button onClick={addHeader} className="ts-add-button">
                Añadir Cabecera
              </button>
            )}

            <div className="ts-node-section-title">Cuerpo de la Petición</div>
            <div className="ts-node-setting">
              <label htmlFor={`bodyType-${id}`}>Tipo de Cuerpo:</label>
              <select
                id={`bodyType-${id}`}
                value={bodyType}
                onChange={(e) => handleConfigurationChange('bodyType', e.target.value)}
                disabled={!canEdit}
              >
                <option value="none">Ninguno (None)</option>
                <option value="json">JSON</option>
                <option value="text">Texto Plano (Text)</option>
                <option value="form-data">Form Data</option>
              </select>
            </div>

            {(bodyType === 'json' || bodyType === 'text') && (
              <div className="ts-node-setting">
                <label htmlFor={`bodyString-${id}`}>Cuerpo ({bodyType === 'json' ? 'JSON' : 'Texto Plano'}):</label>
                <textarea
                  id={`bodyString-${id}`}
                  value={bodyString} 
                  onChange={(e) => handleConfigurationChange('bodyString', e.target.value)} 
                  placeholder={bodyType === 'json' ? '{ \"clave\": \"valor\" }' : 'Contenido del cuerpo...'}
                  rows={4} 
                  disabled={!canEdit}
                  className="ts-body-textarea"
                />
              </div>
            )}
            
            {bodyType === 'form-data' && (
              <div className="ts-formdata-section">
                {bodyFormData.map((entry, index) => (
                  <div key={entry.id} className="ts-formdata-item ts-key-value-item"> 
                    <input
                      type="text"
                      placeholder="Clave"
                      value={entry.key}
                      onChange={(e) => handleFormDataEntryChange(index, 'key', e.target.value)}
                      className="ts-formdata-input ts-key-value-input-key" 
                      disabled={!canEdit}
                    />
                    <input
                      type="text"
                      placeholder="Valor"
                      value={entry.value}
                      onChange={(e) => handleFormDataEntryChange(index, 'value', e.target.value)}
                      className="ts-formdata-input ts-key-value-input-value" 
                      disabled={!canEdit}
                    />
                    {canEdit && (
                      <Tooltip content="Eliminar Campo">
                        <button 
                          onClick={() => removeFormDataEntry(index)} 
                          className="ts-remove-formdata-button ts-icon-button" 
                        >
                          <Trash2 size={14} />
                        </button>
                      </Tooltip>
                    )}
                  </div>
                ))}
                {canEdit && (
                  <button onClick={addFormDataEntry} className="ts-add-button">
                    Añadir Campo Form Data
                  </button>
                )}
              </div>
            )}
            
            {/* Sección de Mapeo de Respuesta */}
            <div className="ts-node-section-title">Mapeo de Respuesta</div>
            {responseMapping.map((entry, index) => (
              <div key={entry.id} className="ts-response-map-item">
                <div className="ts-node-setting ts-response-map-row">
                  <label htmlFor={`map-source-${id}-${index}`}>Fuente:</label>
                  <select
                    id={`map-source-${id}-${index}`}
                    value={entry.source}
                    onChange={(e) => handleResponseMapEntryChange(index, 'source', e.target.value)}
                    disabled={!canEdit}
                    className="ts-response-map-select"
                  >
                    {responseSourceOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {entry.source !== 'status_code' && (
                  <div className="ts-node-setting ts-response-map-row">
                    <label htmlFor={`map-path-${id}-${index}`}>{getPathOrKeyLabel(entry.source)}:</label>
                    <input
                      type="text"
                      id={`map-path-${id}-${index}`}
                      value={entry.pathOrKey}
                      placeholder={getPathOrKeyLabel(entry.source)}
                      onChange={(e) => handleResponseMapEntryChange(index, 'pathOrKey', e.target.value)}
                      disabled={!canEdit}
                      className="ts-response-map-input"
                    />
                  </div>
                )}

                <div className="ts-node-setting ts-response-map-row">
                  <label htmlFor={`map-targetVar-${id}-${index}`}>Guardar en Variable:</label>
                  <input
                    type="text"
                    id={`map-targetVar-${id}-${index}`}
                    value={entry.targetVariable}
                    placeholder="nombreDeVariable"
                    onChange={(e) => handleResponseMapEntryChange(index, 'targetVariable', e.target.value)}
                    disabled={!canEdit}
                    className="ts-response-map-input"
                  />
                </div>
                <div className="ts-node-setting ts-response-map-row">
                  <label htmlFor={`map-defaultValue-${id}-${index}`}>Valor por Defecto:</label>
                  <input
                    type="text"
                    id={`map-defaultValue-${id}-${index}`}
                    value={entry.defaultValue}
                    placeholder="Valor por defecto"
                    onChange={(e) => handleResponseMapEntryChange(index, 'defaultValue', e.target.value)}
                    disabled={!canEdit}
                    className="ts-response-map-input"
                  />
                </div>
                {canEdit && (
                  <Tooltip content="Eliminar Mapeo">
                    <button 
                      onClick={() => removeResponseMapEntry(index)} 
                      className="ts-remove-map-entry-button ts-icon-button"
                    >
                      <Trash2 size={14} />
                    </button>
                  </Tooltip>
                )}
              </div>
            ))}
            {canEdit && (
              <button onClick={addResponseMapEntry} className="ts-add-button">
                Añadir Mapeo de Respuesta
              </button>
            )}

            {/* Sección de Prueba de Solicitud */}
            {canEdit && (
              <div className="ts-node-section ts-test-section">
                <div className="ts-node-section-title">Probar Solicitud</div>
                <button 
                  onClick={handleTestRequest} 
                  disabled={isTesting || !url.trim()} // Deshabilitar si no hay URL o está probando
                  className="ts-test-button ts-add-button" // Reutilizar estilo de ts-add-button o crear uno nuevo
                >
                  {isTesting ? (
                    <><span className="ts-loading-spinner"></span>Probando...</> 
                  ) : 'Ejecutar Prueba'}
                </button>
                {testResult && (
                  <div className={`ts-test-result ${testResult.success ? 'ts-test-success' : 'ts-test-error'}`}>
                    <strong>Resultado de la Prueba:</strong>
                    <p>Estado: {testResult.statusCode || 'N/A'} {testResult.success ? <CheckCircle size={14} className="ts-icon-success" /> : <XCircle size={14} className="ts-icon-error" />}</p>
                    {testResult.message && <p>Mensaje: {testResult.message}</p>}
                    
                    {testResult.responseBodyPreview && (
                      <div>
                        <p>Preview Body Respuesta:</p>
                        <pre className="ts-test-preview-area">{testResult.responseBodyPreview}</pre>
                      </div>
                    )}
                    {testResult.headersPreview && (
                      <div>
                        <p>Preview Headers Respuesta:</p>
                        <pre className="ts-test-preview-area">{JSON.stringify(testResult.headersPreview, null, 2)}</pre>
                      </div>
                    )}
                    {testResult.errorDetails && <p className="ts-test-error-details">Detalles: {testResult.errorDetails}</p>}
                  </div>
                )}
              </div>
            )}

            {data.notes && <div className="ts-node-notes">Notas: {data.notes}</div>}
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
          type="source" 
          position={Position.Bottom} 
          id="onSuccess" 
          isConnectable={isConnectable} 
          className="ts-handle-source ts-handle-success"
        >
           <Tooltip content="En caso de éxito" placement="bottom"><CheckCircle size={12} /></Tooltip>
        </Handle>
        <Handle 
          type="source" 
          position={Position.Bottom} 
          id="onError" 
          isConnectable={isConnectable} 
          className="ts-handle-source ts-handle-error"
          style={{ left: 'auto', right: '15px' }} 
        >
          <Tooltip content="En caso de error" placement="bottom"><XCircle size={12} /></Tooltip>
        </Handle>
      </div>
    );
  }
);

HttpRequestNode.propTypes = {
  isUltraPerformanceMode: PropTypes.bool,
  data: PropTypes.object.isRequired, 
  isConnectable: PropTypes.bool,
  selected: PropTypes.bool,
  id: PropTypes.string.isRequired,
  setNodes: PropTypes.func.isRequired,
};

HttpRequestNode.displayName = 'HttpRequestNode';

export default HttpRequestNode;
