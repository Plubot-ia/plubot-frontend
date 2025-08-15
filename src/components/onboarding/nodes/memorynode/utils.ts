/**
 * @file utils.ts
 * @description Utilidades y helpers para MemoryNode
 */

import { VALIDATION_MESSAGES, CHAR_LIMITS, KEY_REGEX } from './constants';
import type { MemoryNodeData, ValidationResult, MemoryContext } from './types';

/**
 * Valida los datos del nodo de memoria
 */
export const validateMemoryNodeData = (data: MemoryNodeData): ValidationResult => {
  const errors: string[] = [];

  // Validar clave
  if (!data.key || data.key.trim() === '') {
    errors.push(VALIDATION_MESSAGES.keyRequired);
  } else {
    if (!KEY_REGEX.test(data.key)) {
      errors.push(VALIDATION_MESSAGES.invalidKey);
    }
    if (data.key.length > CHAR_LIMITS.key) {
      errors.push(VALIDATION_MESSAGES.keyTooLong);
    }
  }

  // Validar valor para acción "set"
  if (data.action === 'set') {
    if (!data.value || data.value.trim() === '') {
      errors.push(VALIDATION_MESSAGES.valueRequiredForSet);
    } else if (data.value.length > CHAR_LIMITS.value) {
      errors.push(VALIDATION_MESSAGES.valueTooLong);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Ejecuta una acción de memoria sobre el contexto
 */
export const executeMemoryAction = (
  action: string,
  key: string,
  value: string | undefined,
  context: MemoryContext,
): { success: boolean; result?: string | number | boolean | null | undefined; error?: string } => {
  try {
    switch (action) {
      case 'set':
        if (!value) {
          return {
            success: false,
            error: 'Valor requerido para la acción "set"',
          };
        }
        // eslint-disable-next-line security/detect-object-injection
        context[key] = value;
        return {
          success: true,
          result: value,
        };

      case 'get':
        // eslint-disable-next-line security/detect-object-injection
        const retrievedValue = context[key];
        return {
          success: true,
          result: retrievedValue !== undefined ? retrievedValue : null,
        };

      case 'delete':
        const existed = key in context;
        // Evitar delete dinámico usando Reflect.deleteProperty
        Reflect.deleteProperty(context, key);
        return {
          success: true,
          result: existed,
        };

      default:
        return {
          success: false,
          error: `Acción desconocida: ${action}`,
        };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
};

/**
 * Formatea el valor para mostrar en la vista previa
 */
export const formatPreviewValue = (value: string | undefined, maxLength = 30): string => {
  if (!value) return '';
  if (value.length <= maxLength) return value;
  return `${value.substring(0, maxLength)}...`;
};

/**
 * Genera un mensaje descriptivo para la acción
 */
export const getActionDescription = (action: string, key: string, value?: string): string => {
  switch (action) {
    case 'set':
      return `Guardar "${key}" = "${formatPreviewValue(value)}"`;
    case 'get':
      return `Obtener valor de "${key}"`;
    case 'delete':
      return `Eliminar "${key}"`;
    default:
      return `Acción: ${action} sobre "${key}"`;
  }
};

/**
 * Sanitiza una clave para que sea válida
 */
export const sanitizeKey = (key: string): string => {
  return key
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, CHAR_LIMITS.key);
};

/**
 * Verifica si una clave existe en el contexto
 */
export const keyExistsInContext = (key: string, context: MemoryContext): boolean => {
  return key in context;
};

/**
 * Obtiene todas las claves del contexto
 */
export const getContextKeys = (context: MemoryContext): string[] => {
  return Object.keys(context).sort();
};

/**
 * Limpia el contexto completo
 */
export const clearContext = (context: MemoryContext): void => {
  Object.keys(context).forEach((key) => {
    // Evitar delete dinámico usando Reflect.deleteProperty
    Reflect.deleteProperty(context, key);
  });
};

/**
 * Exporta el contexto como JSON
 */
export const exportContext = (context: MemoryContext): string => {
  return JSON.stringify(context, null, 2);
};

/**
 * Importa contexto desde JSON
 */
export const importContext = (jsonString: string): MemoryContext | null => {
  try {
    const parsed = JSON.parse(jsonString) as MemoryContext;
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
};
