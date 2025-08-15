/**
 * @file constants.ts
 * @description Constantes para MediaNode
 */

import type { MediaTypeInfo } from './types';

/**
 * Información de tipos de media
 */
export const MEDIA_TYPES: MediaTypeInfo[] = [
  {
    value: 'image',
    label: 'Imagen',
    icon: '🖼️',
    description: 'Muestra una imagen en la conversación',
    acceptedFormats: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
  },
  {
    value: 'video',
    label: 'Video',
    icon: '🎥',
    description: 'Reproduce un video con controles',
    acceptedFormats: ['.mp4', '.webm', '.ogg', '.mov'],
  },
  {
    value: 'audio',
    label: 'Audio',
    icon: '🎵',
    description: 'Reproduce un archivo de audio',
    acceptedFormats: ['.mp3', '.wav', '.ogg', '.m4a'],
  },
  {
    value: 'file',
    label: 'Archivo',
    icon: '📎',
    description: 'Permite descargar un archivo',
    acceptedFormats: ['*'],
  },
];

/**
 * Configuración visual del nodo
 */
export const NODE_CONFIG = {
  WIDTH: 320,
  HEIGHT: 120,
  MIN_HEIGHT: 100,
  MAX_HEIGHT: 400,
  BORDER_RADIUS: 12,
  BACKGROUND: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  COLLAPSED_BACKGROUND: '#ffffff',
  EXPANDED_BACKGROUND: '#ffffff',
  BORDER_COLOR: '#e5e7eb',
  BORDER_WIDTH: 2,
  SHADOW: '0 4px 12px rgba(0, 0, 0, 0.1)',
  HOVER_SHADOW: '0 6px 20px rgba(0, 0, 0, 0.15)',
};

/**
 * Colores del nodo
 */
export const COLORS = {
  PRIMARY: '#667eea',
  SECONDARY: '#764ba2',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  TEXT_PRIMARY: '#1F2937',
  TEXT_SECONDARY: '#6B7280',
  TEXT_LIGHT: '#9CA3AF',
  BACKGROUND: '#FFFFFF',
  BACKGROUND_SECONDARY: '#F9FAFB',
  BORDER: '#E5E7EB',
  HANDLE_BORDER: '#FFFFFF',
  HANDLE_FILL: '#10B981',
};

/**
 * Configuración por defecto para cada tipo
 */
export const DEFAULT_CONFIGS = {
  image: {
    imageSettings: {
      objectFit: 'contain' as const,
    },
  },
  video: {
    videoSettings: {
      controls: true,
      autoplay: false,
      loop: false,
      muted: false,
    },
  },
  audio: {
    audioSettings: {
      controls: true,
      autoplay: false,
      loop: false,
    },
  },
  file: {
    fileSettings: {
      fileName: 'archivo',
      fileType: 'application/octet-stream',
    },
  },
};

/**
 * Mensajes de validación
 */
export const VALIDATION_MESSAGES = {
  URL_REQUIRED: 'La URL es requerida',
  URL_INVALID: 'La URL no es válida',
  TYPE_REQUIRED: 'El tipo de media es requerido',
  CAPTION_TOO_LONG: 'El caption es demasiado largo (máx 200 caracteres)',
  ALT_TEXT_TOO_LONG: 'El texto alternativo es demasiado largo (máx 100 caracteres)',
};

/**
 * Límites de configuración
 */
export const LIMITS = {
  MAX_CAPTION_LENGTH: 200,
  MAX_ALT_TEXT_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_URL_LENGTH: 2000,
};

/**
 * Ejemplos de URLs por tipo
 */
export const URL_EXAMPLES = {
  image: 'https://ejemplo.com/imagen.jpg',
  video: 'https://ejemplo.com/video.mp4',
  audio: 'https://ejemplo.com/audio.mp3',
  file: 'https://ejemplo.com/documento.pdf',
};

/**
 * Iconos por estado
 */
export const STATUS_ICONS = {
  loading: '⏳',
  error: '❌',
  success: '✅',
  warning: '⚠️',
};
