/**
 * @file utils.ts
 * @description Utilidades para WaitNode
 */

import { DURATION_LIMITS, VALIDATION_MESSAGES, TIME_UNIT_OPTIONS } from './constants';
import type { TimeUnit, WaitNodeData, ValidationResult, AnimationState } from './types';

/**
 * Convierte duración a milisegundos - Elite Precision
 */
export const toMilliseconds = (duration: number, unit: TimeUnit): number => {
  const unitConfig = TIME_UNIT_OPTIONS.find((u) => u.value === unit);
  if (!unitConfig) {
    console.warn(`Unknown time unit: ${unit}, defaulting to ms`);
    return duration;
  }
  return Math.round(duration * unitConfig.factor);
};

/**
 * Convierte milisegundos a la unidad especificada - Elite Precision
 */
export const fromMilliseconds = (ms: number, unit: TimeUnit): number => {
  const unitConfig = TIME_UNIT_OPTIONS.find((u) => u.value === unit);
  if (!unitConfig) {
    console.warn(`Unknown time unit: ${unit}, defaulting to ms`);
    return ms;
  }
  // Mantener precisión con 2 decimales
  return Math.round((ms / unitConfig.factor) * 100) / 100;
};

/**
 * Valida la duración según la unidad - Comprehensive Validation
 */
export const validateDuration = (duration: number, unit: TimeUnit): ValidationResult => {
  // Validación de tipo
  if (isNaN(duration) || duration === null || duration === undefined) {
    return { isValid: false, error: VALIDATION_MESSAGES.NON_NUMERIC };
  }

  // Validación de negativos
  if (duration < 0) {
    return { isValid: false, error: VALIDATION_MESSAGES.NEGATIVE_DURATION };
  }

  const ms = toMilliseconds(duration, unit);

  // Validación de límites
  if (ms < DURATION_LIMITS.MIN_MS) {
    return { isValid: false, error: VALIDATION_MESSAGES.DURATION_TOO_SHORT };
  }

  if (ms > DURATION_LIMITS.MAX_MS) {
    return { isValid: false, error: VALIDATION_MESSAGES.DURATION_TOO_LONG };
  }

  // Advertencias para duraciones extremas
  if (ms > 300000) {
    // Más de 5 minutos
    return {
      isValid: true,
      warning: 'Duración muy larga. ¿Estás seguro?',
    };
  }

  return { isValid: true };
};

/**
 * Formatea la duración para mostrar - Intelligent Formatting
 */
export const formatDuration = (duration: number, unit: TimeUnit): string => {
  const formatNumber = (num: number): string => {
    // Formatear con decimales solo si es necesario
    return num % 1 === 0 ? num.toString() : num.toFixed(2).replace(/\.?0+$/, '');
  };

  const formatted = formatNumber(duration);

  switch (unit) {
    case 'ms':
      return duration === 1 ? '1 milisegundo' : `${formatted} milisegundos`;
    case 's':
      return duration === 1 ? '1 segundo' : `${formatted} segundos`;
    case 'm':
      return duration === 1 ? '1 minuto' : `${formatted} minutos`;
    case 'h':
      return duration === 1 ? '1 hora' : `${formatted} horas`;
    default:
      return `${formatted} ${unit as string}`;
  }
};

/**
 * Formatea la duración de forma compacta - Smart Display
 */
export const formatDurationCompact = (duration: number, unit: TimeUnit): string => {
  const unitConfig = TIME_UNIT_OPTIONS.find((u) => u.value === unit);
  const symbol = unitConfig?.symbol ?? unit;

  // Formatear número inteligentemente
  const formatted =
    duration % 1 === 0 ? duration.toString() : duration.toFixed(1).replace(/\.0$/, '');

  return `${formatted}${symbol}`;
};

/**
 * Genera una descripción automática basada en la duración - Context-Aware
 */
export const generateDescription = (duration: number, unit: TimeUnit): string => {
  const ms = toMilliseconds(duration, unit);

  // Descripciones más detalladas y contextuales
  if (ms < 100) {
    return '⚡ Flash instantáneo';
  } else if (ms < 500) {
    return '✨ Pausa instantánea';
  } else if (ms < 1000) {
    return '🚀 Transición rápida';
  } else if (ms < 2000) {
    return '⏱ Pausa breve';
  } else if (ms < 3000) {
    return '⏰ Tiempo estándar';
  } else if (ms < 5000) {
    return '⏳ Pausa reflexiva';
  } else if (ms < 10000) {
    return '🤔 Momento de reflexión';
  } else if (ms < 30000) {
    return '⏲ Pausa extendida';
  } else if (ms < 60000) {
    return '📅 Espera prolongada';
  } else if (ms < 300000) {
    return '🕐 Intervalo largo';
  } else {
    return '🌅 Pausa épica';
  }
};

/**
 * Valida los datos completos del nodo
 */
export const validateNodeData = (data: WaitNodeData): boolean => {
  if (!data) return false;

  const { duration, unit } = data;
  const validation = validateDuration(duration, unit);

  return validation.isValid;
};

/**
 * Crea datos por defecto para el nodo - Smart Defaults
 */
export const createDefaultNodeData = (): WaitNodeData => {
  const defaultDuration = DURATION_LIMITS.DEFAULT_S;
  const defaultUnit: TimeUnit = 's';

  return {
    duration: defaultDuration,
    unit: defaultUnit,
    description: generateDescription(defaultDuration, defaultUnit),
    isEditing: false,
    isActive: false,
    totalDurationMs: toMilliseconds(defaultDuration, defaultUnit),
    displayMode: 'compact',
    showRemainingTime: true,
    useVariableTime: false,
  };
};

/**
 * Función de delay para simulación
 */
export const delay = async (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Calcula el progreso de la animación (0-100) - Smooth Animation
 */
export const calculateProgress = (elapsed: number, total: number): number => {
  if (total <= 0) return 100;
  const progress = (elapsed / total) * 100;
  return Math.min(Math.max(progress, 0), 100);
};

/**
 * Crea el estado de animación - Performance Optimized
 */
export const createAnimationState = (
  startTime: number | undefined,
  totalMs: number,
  isActive: boolean,
): AnimationState => {
  if (!isActive || !startTime) {
    return {
      progress: 0,
      elapsed: 0,
      remaining: totalMs,
      isRunning: false,
    };
  }

  const now = Date.now();
  const elapsed = now - startTime;
  const remaining = Math.max(0, totalMs - elapsed);
  const progress = calculateProgress(elapsed, totalMs);

  return {
    progress,
    elapsed,
    remaining,
    isRunning: progress < 100,
  };
};

/**
 * Formatea el tiempo restante - Human Readable
 */
export const formatRemainingTime = (ms: number): string => {
  if (ms <= 0) return 'Completado';

  if (ms < 1000) {
    return `${Math.ceil(ms)}ms`;
  } else if (ms < 60000) {
    const seconds = Math.ceil(ms / 1000);
    return `${seconds}s`;
  } else if (ms < 3600000) {
    const minutes = Math.ceil(ms / 60000);
    return `${minutes}min`;
  } else {
    const hours = Math.ceil(ms / 3600000);
    return `${hours}h`;
  }
};

/**
 * Obtiene la mejor unidad para una duración en ms
 */
export const getBestUnit = (ms: number): TimeUnit => {
  if (ms < 1000) return 'ms';
  if (ms < 60000) return 's';
  if (ms < 3600000) return 'm';
  return 'h';
};

/**
 * Convierte automáticamente a la mejor unidad
 */
export const convertToBestUnit = (
  duration: number,
  currentUnit: TimeUnit,
): { duration: number; unit: TimeUnit } => {
  const ms = toMilliseconds(duration, currentUnit);
  const bestUnit = getBestUnit(ms);
  const convertedDuration = fromMilliseconds(ms, bestUnit);

  return {
    duration: convertedDuration,
    unit: bestUnit,
  };
};
