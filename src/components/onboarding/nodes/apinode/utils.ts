/**
 * @file utils.ts
 * @description Utilidades para el ApiNode
 */

import type { ApiNodeData, HttpMethod } from './types';

/**
 * Valida una URL
 */
export const isValidUrl = (url: string): boolean => {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Valida el formato JSON
 */
export const isValidJson = (str: string): boolean => {
  if (!str || str.trim() === '') return true; // Empty is valid
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};

/**
 * Formatea headers desde string a objeto
 */
export const parseHeaders = (headersString: string): Record<string, string> => {
  const headers: Record<string, string> = {};
  if (!headersString) return headers;

  try {
    // Intenta parsear como JSON primero
    const parsed = JSON.parse(headersString) as Record<string, string>;
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed;
    }
  } catch {
    // Si no es JSON, intenta parsear como líneas key: value
    const lines = headersString.split('\n');
    for (const line of lines) {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        headers[key.trim()] = valueParts.join(':').trim();
      }
    }
  }
  return headers;
};

/**
 * Formatea headers desde objeto a string para mostrar
 */
export const stringifyHeaders = (headers: Record<string, string>): string => {
  if (!headers || Object.keys(headers).length === 0) return '';

  return Object.entries(headers)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');
};

/**
 * Genera un nombre de variable válido
 */
export const generateVariableName = (url: string, method: HttpMethod): string => {
  if (!url) return 'apiResponse';

  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1] || urlObj.hostname.split('.')[0];

    // Limpia el nombre para que sea un identificador válido
    const cleanName = lastPart
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/^[0-9]/, '_')
      .toLowerCase();

    return `${method.toLowerCase()}_${cleanName}_response`;
  } catch {
    return 'apiResponse';
  }
};

/**
 * Valida los datos del nodo
 */
export const validateNodeData = (data: ApiNodeData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.url) {
    errors.push('La URL es requerida');
  } else if (!isValidUrl(data.url)) {
    errors.push('La URL no es válida');
  }

  if (!data.method) {
    errors.push('El método HTTP es requerido');
  }

  if (data.body && !isValidJson(data.body)) {
    errors.push('El body debe ser un JSON válido');
  }

  if (!data.guardarEnVariable) {
    errors.push('El nombre de la variable es requerido');
  } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(data.guardarEnVariable)) {
    errors.push('El nombre de la variable no es válido');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Construye el payload para la petición
 */
export const buildRequestPayload = (data: ApiNodeData): RequestInit => {
  const headers: Record<string, string> = {};

  // Headers personalizados
  if (data.headers) {
    Object.assign(headers, data.headers);
  }

  // Autenticación
  if (data.authentication?.type && data.authentication.type !== 'none') {
    switch (data.authentication.type) {
      case 'bearer':
        headers['Authorization'] = `Bearer ${data.authentication.token}`;
        break;
      case 'basic':
        const credentials = btoa(`${data.authentication.username}:${data.authentication.password}`);
        headers['Authorization'] = `Basic ${credentials}`;
        break;
      case 'apikey':
        const headerName = data.authentication.apiKeyHeader ?? 'X-API-Key';
        // eslint-disable-next-line security/detect-object-injection
        headers[headerName] = data.authentication.apiKey ?? '';
        break;
      default:
        // No authentication or undefined type - do nothing
        break;
    }
  }

  const options: RequestInit = {
    method: data.method ?? 'GET',
    headers,
  };

  // Body para métodos que lo soportan
  if (data.body && ['POST', 'PUT', 'PATCH'].includes(data.method ?? '')) {
    options.body = data.body;
    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
  }

  return options;
};

/**
 * Obtiene un resumen de la configuración para mostrar en modo colapsado
 */
export const getNodeSummary = (data: ApiNodeData): string => {
  if (!data.url) return 'Sin configurar';

  try {
    const url = new URL(data.url);
    const method = data.method ?? 'GET';
    const variable = data.guardarEnVariable ?? 'respuesta';

    return `${method} ${url.hostname} → ${variable}`;
  } catch {
    return `${data.method ?? 'GET'} → ${data.guardarEnVariable ?? 'respuesta'}`;
  }
};
