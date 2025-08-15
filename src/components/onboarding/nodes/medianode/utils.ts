/**
 * @file utils.ts
 * @description Utilidades para MediaNode
 */

import { VALIDATION_MESSAGES, LIMITS, MEDIA_TYPES } from './constants';
import type { MediaNodeData, MediaType } from './types';

/**
 * Valida la URL del media
 */
export const validateUrl = (url: string): boolean => {
  if (!url) return false;

  try {
    // Acepta URLs absolutas y relativas
    if (url.startsWith('http://') || url.startsWith('https://')) {
      new URL(url);
      return true;
    }
    // URLs relativas
    if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
      return true;
    }
    // Data URLs
    if (url.startsWith('data:')) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

/**
 * Valida los datos del nodo
 */
export const validateNodeData = (
  data: MediaNodeData,
): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  // Validar tipo
  if (!data.type) {
    errors.push(VALIDATION_MESSAGES.TYPE_REQUIRED);
  }

  // Validar URL
  if (!data.url) {
    errors.push(VALIDATION_MESSAGES.URL_REQUIRED);
  } else if (!validateUrl(data.url)) {
    errors.push(VALIDATION_MESSAGES.URL_INVALID);
  } else if (data.url.length > LIMITS.MAX_URL_LENGTH) {
    errors.push(`URL demasiado larga (máx ${LIMITS.MAX_URL_LENGTH} caracteres)`);
  }

  // Validar caption
  if (data.caption && data.caption.length > LIMITS.MAX_CAPTION_LENGTH) {
    errors.push(VALIDATION_MESSAGES.CAPTION_TOO_LONG);
  }

  // Validar alt text
  if (data.altText && data.altText.length > LIMITS.MAX_ALT_TEXT_LENGTH) {
    errors.push(VALIDATION_MESSAGES.ALT_TEXT_TOO_LONG);
  }

  // Validar descripción
  if (data.description && data.description.length > LIMITS.MAX_DESCRIPTION_LENGTH) {
    errors.push(`Descripción demasiado larga (máx ${LIMITS.MAX_DESCRIPTION_LENGTH} caracteres)`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Obtiene el resumen del nodo para mostrar en modo contraído
 */
export const getNodeSummary = (data: MediaNodeData): string => {
  if (!data.type || !data.url) {
    return 'Sin configurar';
  }

  const typeInfo = MEDIA_TYPES.find((t) => t.value === data.type);
  const typeName = typeInfo?.label ?? data.type;

  if (data.caption) {
    return `${typeName}: ${data.caption.substring(0, 50)}${data.caption.length > 50 ? '...' : ''}`;
  }

  return `${typeName} configurado`;
};

/**
 * Obtiene el ícono según el tipo de media
 */
export const getMediaIcon = (type: MediaType): string => {
  const typeInfo = MEDIA_TYPES.find((t) => t.value === type);
  return typeInfo?.icon ?? '📄';
};

/**
 * Obtiene el nombre del archivo desde la URL
 */
export const getFileNameFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const fileName = pathname.split('/').pop() ?? 'archivo';
    return decodeURIComponent(fileName);
  } catch {
    // Para URLs relativas
    const parts = url.split('/');
    return parts[parts.length - 1] ?? 'archivo';
  }
};

/**
 * Obtiene la extensión del archivo
 */
export const getFileExtension = (url: string): string => {
  const fileName = getFileNameFromUrl(url);
  const parts = fileName.split('.');
  return parts.length > 1 ? `.${parts.pop()}` : '';
};

/**
 * Verifica si la extensión es válida para el tipo
 */
export const isValidExtensionForType = (url: string, type: MediaType): boolean => {
  const typeInfo = MEDIA_TYPES.find((t) => t.value === type);
  if (!typeInfo) return false;

  // Si acepta todos los formatos
  if (typeInfo.acceptedFormats.includes('*')) return true;

  const extension = getFileExtension(url).toLowerCase();
  return typeInfo.acceptedFormats.includes(extension);
};

/**
 * Formatea el tamaño del archivo
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  // eslint-disable-next-line security/detect-object-injection
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Obtiene el tipo MIME desde la extensión
 */
export const getMimeType = (extension: string): string => {
  const mimeTypes: Record<string, string> = {
    // Imágenes
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    // Videos
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.ogg': 'video/ogg',
    '.mov': 'video/quicktime',
    // Audio
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.m4a': 'audio/mp4',
    // Documentos
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed',
  };

  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
};

/**
 * Genera una descripción automática basada en el tipo y URL
 */
export const generateAutoDescription = (type: MediaType, url: string): string => {
  const _typeInfo = MEDIA_TYPES.find((t) => t.value === type);
  const fileName = getFileNameFromUrl(url);

  switch (type) {
    case 'image':
      return `Imagen: ${fileName}`;
    case 'video':
      return `Video: ${fileName}`;
    case 'audio':
      return `Audio: ${fileName}`;
    case 'file':
      return `Archivo descargable: ${fileName}`;
    default:
      return `Media: ${fileName}`;
  }
};
