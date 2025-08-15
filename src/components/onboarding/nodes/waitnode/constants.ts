/**
 * @file constants.ts
 * @description Constantes para WaitNode
 */

import type { TimeUnit, DurationPreset } from './types';

/**
 * Límites de duración - Elite Configuration
 */
export const DURATION_LIMITS = {
  MIN_MS: 10, // Mínimo 10ms para precisión ultra
  MAX_MS: 3600000, // Máximo 1 hora en ms
  MIN_S: 0.01, // Mínimo 0.01 segundos
  MAX_S: 3600, // Máximo 1 hora en segundos
  MIN_M: 0.01, // Mínimo 0.01 minutos
  MAX_M: 60, // Máximo 60 minutos
  MIN_H: 0.01, // Mínimo 0.01 horas
  MAX_H: 24, // Máximo 24 horas
  DEFAULT_MS: 2000, // Default 2 segundos
  DEFAULT_S: 2, // Default 2 segundos
  DEFAULT_M: 0.5, // Default 30 segundos
  DEFAULT_H: 0.25, // Default 15 minutos
};

/**
 * Opciones de unidades de tiempo - Extended
 */
export const TIME_UNIT_OPTIONS: {
  value: TimeUnit;
  label: string;
  symbol: string;
  factor: number;
}[] = [
  { value: 'ms', label: 'Milisegundos', symbol: 'ms', factor: 1 },
  { value: 's', label: 'Segundos', symbol: 's', factor: 1000 },
  { value: 'm', label: 'Minutos', symbol: 'min', factor: 60000 },
  { value: 'h', label: 'Horas', symbol: 'h', factor: 3600000 },
];

/**
 * Presets de duración comunes - Elite Collection
 */
export const DURATION_PRESETS: DurationPreset[] = [
  // Instant
  { label: 'Flash', duration: 100, unit: 'ms', icon: '⚡', category: 'instant' },
  { label: 'Instantáneo', duration: 500, unit: 'ms', icon: '✨', category: 'instant' },

  // Quick
  { label: 'Rápido', duration: 1, unit: 's', icon: '🚀', category: 'quick' },
  { label: 'Ágil', duration: 1.5, unit: 's', icon: '💨', category: 'quick' },

  // Normal
  { label: 'Normal', duration: 2, unit: 's', icon: '⏱', category: 'normal' },
  { label: 'Estándar', duration: 3, unit: 's', icon: '⏰', category: 'normal' },

  // Long
  { label: 'Pausado', duration: 5, unit: 's', icon: '⏳', category: 'long' },
  { label: 'Reflexivo', duration: 10, unit: 's', icon: '🤔', category: 'long' },

  // Extended
  { label: 'Extenso', duration: 30, unit: 's', icon: '⏲', category: 'extended' },
  { label: 'Largo', duration: 1, unit: 'm', icon: '📅', category: 'extended' },
  { label: 'Muy largo', duration: 5, unit: 'm', icon: '🕐', category: 'extended' },
  { label: 'Épico', duration: 1, unit: 'h', icon: '🌅', category: 'extended' },
];

/**
 * Configuración visual del nodo - Elite Design System
 */
export const NODE_CONFIG = {
  WIDTH: 320,
  HEIGHT: 110,
  MIN_HEIGHT: 90,
  MAX_HEIGHT: 420,
  BORDER_RADIUS: 16,
  BACKGROUND: 'linear-gradient(145deg, #667eea 0%, #764ba2 100%)',
  COLLAPSED_BACKGROUND: 'linear-gradient(145deg, #667eea 0%, #764ba2 100%)',
  EXPANDED_BACKGROUND: '#ffffff',
  BORDER_COLOR: '#ffffff',
  BORDER_WIDTH: 2,
  SHADOW: '0 8px 24px rgba(102, 126, 234, 0.25)',
  HOVER_SHADOW: '0 12px 32px rgba(102, 126, 234, 0.35)',
  ACTIVE_SHADOW: '0 16px 40px rgba(102, 126, 234, 0.45)',
  TRANSITION: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
};

/**
 * Colores del nodo - Elite Color Palette
 */
export const COLORS = {
  PRIMARY: '#667eea',
  PRIMARY_DARK: '#5a67d8',
  PRIMARY_LIGHT: '#7c8ff0',
  SECONDARY: '#764ba2',
  SECONDARY_DARK: '#663d8f',
  SECONDARY_LIGHT: '#8659b3',
  SUCCESS: '#10B981',
  SUCCESS_LIGHT: '#34D399',
  WARNING: '#F59E0B',
  WARNING_LIGHT: '#FCD34D',
  ERROR: '#EF4444',
  ERROR_LIGHT: '#F87171',
  INFO: '#3B82F6',
  TEXT_PRIMARY: '#FFFFFF',
  TEXT_SECONDARY: 'rgba(255, 255, 255, 0.9)',
  TEXT_MUTED: 'rgba(255, 255, 255, 0.7)',
  TEXT_DARK: '#1F2937',
  TEXT_DARK_SECONDARY: '#4B5563',
  HANDLE_BORDER: '#FFFFFF',
  HANDLE_FILL: '#10B981',
  HANDLE_ACTIVE: '#34D399',
  BACKGROUND_OVERLAY: 'rgba(0, 0, 0, 0.05)',
  GLASS_BACKGROUND: 'rgba(255, 255, 255, 0.1)',
  GLASS_BORDER: 'rgba(255, 255, 255, 0.2)',
};

/**
 * Mensajes de validación - Comprehensive
 */
export const VALIDATION_MESSAGES = {
  DURATION_TOO_SHORT: 'La duración es demasiado corta',
  DURATION_TOO_LONG: 'La duración es demasiado larga',
  INVALID_DURATION: 'Duración inválida',
  REQUIRED_DURATION: 'La duración es requerida',
  NEGATIVE_DURATION: 'La duración no puede ser negativa',
  NON_NUMERIC: 'El valor debe ser numérico',
  VARIABLE_NOT_FOUND: 'Variable no encontrada en el flujo',
  VARIABLE_INVALID: 'La variable no contiene un valor de tiempo válido',
};

/**
 * Configuración de animación
 */
export const ANIMATION_CONFIG = {
  FRAME_RATE: 60, // FPS objetivo
  UPDATE_INTERVAL: 16, // ~60 FPS en ms
  SMOOTH_FACTOR: 0.1, // Factor de suavizado para animaciones
  EASING: 'cubic-bezier(0.4, 0, 0.2, 1)', // Material Design easing
};

/**
 * Configuración de performance
 */
export const PERFORMANCE_CONFIG = {
  DEBOUNCE_DELAY: 300, // ms para debounce de inputs
  THROTTLE_DELAY: 100, // ms para throttle de animaciones
  MAX_ANIMATION_DURATION: 10000, // Máximo 10s de animación visual
  USE_RAF: true, // Usar requestAnimationFrame
  USE_WORKER: false, // Usar Web Worker para cálculos pesados
};
