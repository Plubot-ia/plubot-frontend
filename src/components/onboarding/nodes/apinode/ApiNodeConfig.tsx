/**
 * @file ApiNodeConfig.tsx
 * @description Panel de configuración expandido para el ApiNode
 */

import { Globe, Key, Clock, RotateCw, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import React, { useState, useCallback, useMemo } from 'react';

import { HTTP_METHODS, COMMON_HEADERS, API_EXAMPLES } from './constants';
import type { ApiNodeConfigProps, HttpMethod } from './types';
import {
  isValidUrl,
  isValidJson,
  parseHeaders,
  stringifyHeaders,
  generateVariableName,
} from './utils';

const ApiNodeConfig: React.FC<ApiNodeConfigProps> = ({ data, onUpdate, onClose }) => {
  const [localUrl, setLocalUrl] = useState(data.url ?? '');
  const [localMethod, setLocalMethod] = useState<HttpMethod>(data.method ?? 'GET');
  const [localHeaders, setLocalHeaders] = useState(stringifyHeaders(data.headers ?? {}));
  const [localBody, setLocalBody] = useState(data.body ?? '');
  const [localVariable, setLocalVariable] = useState(data.guardarEnVariable ?? 'apiResponse');
  const [showAdvanced, setShowAdvanced] = useState(data.showAdvancedOptions ?? false);
  const [authType, setAuthType] = useState(data.authentication?.type ?? 'none');
  const [authToken, setAuthToken] = useState(data.authentication?.token ?? '');
  const [timeout, setTimeout] = useState(data.timeout ?? 30000);
  const [retryCount, setRetryCount] = useState(data.retryCount ?? 0);

  // Validaciones
  const urlError = useMemo(() => {
    if (!localUrl) return null;
    return isValidUrl(localUrl) ? null : 'URL no válida';
  }, [localUrl]);

  const bodyError = useMemo(() => {
    if (!localBody || !['POST', 'PUT', 'PATCH'].includes(localMethod)) return null;
    return isValidJson(localBody) ? null : 'JSON no válido';
  }, [localBody, localMethod]);

  const variableError = useMemo(() => {
    if (!localVariable) return 'Requerido';
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(localVariable) ? null : 'Nombre de variable no válido';
  }, [localVariable]);

  // Handlers
  const handleSave = useCallback(() => {
    if (urlError || bodyError || variableError) return;

    onUpdate({
      url: localUrl,
      method: localMethod,
      headers: parseHeaders(localHeaders),
      body: localBody,
      guardarEnVariable: localVariable,
      showAdvancedOptions: showAdvanced,
      authentication: {
        type: authType,
        token: authToken,
      },
      timeout,
      retryCount,
    });
    onClose();
  }, [
    localUrl,
    localMethod,
    localHeaders,
    localBody,
    localVariable,
    showAdvanced,
    authType,
    authToken,
    timeout,
    retryCount,
    urlError,
    bodyError,
    variableError,
    onUpdate,
    onClose,
  ]);

  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleExampleSelect = useCallback((example: (typeof API_EXAMPLES)[0]) => {
    setLocalUrl(example.url);
    setLocalMethod(example.method);
    setLocalVariable(generateVariableName(example.url, example.method));
  }, []);

  const handleHeaderPreset = useCallback(
    (header: (typeof COMMON_HEADERS)[0]) => {
      const currentHeaders = parseHeaders(localHeaders);
      currentHeaders[header.value] = header.content;
      setLocalHeaders(stringifyHeaders(currentHeaders));
    },
    [localHeaders],
  );

  const handleGenerateVariable = useCallback(() => {
    if (localUrl) {
      setLocalVariable(generateVariableName(localUrl, localMethod));
    }
  }, [localUrl, localMethod]);

  const _selectedMethod = useMemo(
    () => HTTP_METHODS.find((m) => m.value === localMethod),
    [localMethod],
  );

  const showBodyField = ['POST', 'PUT', 'PATCH'].includes(localMethod);

  return (
    <div className='api-node-config'>
      <div className='config-header'>
        <h3>
          <Globe size={20} />
          Configurar Petición HTTP
        </h3>
        <button className='close-btn' onClick={handleCancel}>
          ✕
        </button>
      </div>

      <div className='config-body'>
        {/* Ejemplos rápidos */}
        <div className='examples-section'>
          <div className='examples-label'>Ejemplos rápidos:</div>
          <div className='examples-grid'>
            {API_EXAMPLES.map((example) => (
              <button
                key={`${example.label}-${example.method}`}
                className='example-btn'
                onClick={() => handleExampleSelect(example)}
                title={example.description}
              >
                {example.label}
              </button>
            ))}
          </div>
        </div>

        {/* URL */}
        <div className='form-group'>
          <label htmlFor='api-url'>
            <Globe size={16} />
            URL del servicio
          </label>
          <input
            id='api-url'
            type='text'
            value={localUrl}
            onChange={(e) => setLocalUrl(e.target.value)}
            placeholder='https://api.ejemplo.com/datos'
            className={urlError ? 'error' : ''}
          />
          {urlError && <span className='error-text'>{urlError}</span>}
        </div>

        {/* Método */}
        <div className='form-group'>
          <div className='form-label' id='method-label'>
            Método HTTP
          </div>
          <div className='method-selector'>
            {HTTP_METHODS.map((method) => (
              <button
                key={method.value}
                className={`method-btn ${localMethod === method.value ? 'active' : ''}`}
                onClick={() => setLocalMethod(method.value)}
                style={{
                  backgroundColor: localMethod === method.value ? method.color : 'transparent',
                  borderColor: method.color,
                  color: localMethod === method.value ? 'white' : method.color,
                }}
              >
                <span className='method-icon'>{method.icon}</span>
                <span className='method-label'>{method.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Body (solo para POST, PUT, PATCH) */}
        {showBodyField && (
          <div className='form-group'>
            <label htmlFor='api-body'>Datos a enviar (JSON)</label>
            <textarea
              id='api-body'
              value={localBody}
              onChange={(e) => setLocalBody(e.target.value)}
              placeholder='{"nombre": "valor", "edad": 25}'
              rows={4}
              className={bodyError ? 'error' : ''}
            />
            {bodyError && <span className='error-text'>{bodyError}</span>}
          </div>
        )}

        {/* Variable */}
        <div className='form-group'>
          <label htmlFor='api-variable'>
            Guardar respuesta en variable
            <button
              className='generate-btn'
              onClick={handleGenerateVariable}
              title='Generar nombre automático'
            >
              <Sparkles size={14} />
            </button>
          </label>
          <input
            id='api-variable'
            type='text'
            value={localVariable}
            onChange={(e) => setLocalVariable(e.target.value)}
            placeholder='miRespuestaApi'
            className={variableError ? 'error' : ''}
          />
          {variableError && <span className='error-text'>{variableError}</span>}
          <span className='help-text'>Podrás usar {`{${localVariable}}`} en otros nodos</span>
        </div>

        {/* Opciones avanzadas */}
        <div className='advanced-section'>
          <button className='advanced-toggle' onClick={() => setShowAdvanced(!showAdvanced)}>
            {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            Opciones avanzadas
          </button>

          {showAdvanced && (
            <div className='advanced-content'>
              {/* Headers */}
              <div className='form-group'>
                <div className='form-label' id='headers-label'>
                  Headers personalizados
                </div>
                <div className='header-presets'>
                  {COMMON_HEADERS.map((header) => (
                    <button
                      key={header.label}
                      className='preset-btn'
                      onClick={() => handleHeaderPreset(header)}
                    >
                      {header.label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={localHeaders}
                  onChange={(e) => setLocalHeaders(e.target.value)}
                  placeholder='Content-Type: application/json&#10;Authorization: Bearer TOKEN'
                  rows={3}
                />
              </div>

              {/* Autenticación */}
              <div className='form-group'>
                <label htmlFor='auth-type'>
                  <Key size={16} />
                  Autenticación
                </label>
                <select
                  id='auth-type'
                  value={authType}
                  onChange={(e) =>
                    setAuthType(e.target.value as 'none' | 'basic' | 'bearer' | 'apikey')
                  }
                >
                  <option value='none'>Sin autenticación</option>
                  <option value='bearer'>Bearer Token</option>
                  <option value='basic'>Basic Auth</option>
                  <option value='apikey'>API Key</option>
                </select>
                {authType === 'bearer' && (
                  <input
                    type='text'
                    value={authToken}
                    onChange={(e) => setAuthToken(e.target.value)}
                    placeholder='Tu token de acceso'
                    className='auth-input'
                  />
                )}
              </div>

              {/* Timeout y reintentos */}
              <div className='form-row'>
                <div className='form-group half'>
                  <label htmlFor='timeout'>
                    <Clock size={16} />
                    Timeout (ms)
                  </label>
                  <input
                    id='timeout'
                    type='number'
                    value={timeout}
                    onChange={(e) => setTimeout(Number(e.target.value))}
                    min='1000'
                    max='60000'
                  />
                </div>
                <div className='form-group half'>
                  <label htmlFor='retry-count'>
                    <RotateCw size={16} />
                    Reintentos
                  </label>
                  <input
                    id='retry-count'
                    type='number'
                    value={retryCount}
                    onChange={(e) => setRetryCount(Number(e.target.value))}
                    min='0'
                    max='3'
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className='config-footer'>
        <button className='btn-cancel' onClick={handleCancel}>
          Cancelar
        </button>
        <button
          className='btn-save'
          onClick={handleSave}
          disabled={!!urlError || !!bodyError || !!variableError || !localUrl || !localVariable}
        >
          Guardar configuración
        </button>
      </div>
    </div>
  );
};

export default ApiNodeConfig;
