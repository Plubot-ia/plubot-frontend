/**
 * @file constants.ts
 * @description Constantes y configuración para MemoryNode
 */

import type { MemoryAction } from './types';

/**
 * Acciones disponibles con sus configuraciones
 */
export const MEMORY_ACTIONS: Record<
  MemoryAction,
  {
    label: string;
    icon: string;
    description: string;
    color: string;
  }
> = {
  set: {
    label: 'Guardar',
    icon: '➕',
    description: 'Guardar un valor en el contexto',
    color: '#28a745',
  },
  get: {
    label: 'Obtener',
    icon: '👁',
    description: 'Leer un valor del contexto',
    color: '#17a2b8',
  },
  delete: {
    label: 'Eliminar',
    icon: '🗑',
    description: 'Borrar un valor del contexto',
    color: '#dc3545',
  },
};

/**
 * Valores por defecto
 */
export const DEFAULT_MEMORY_DATA = {
  action: 'set' as MemoryAction,
  key: '',
  value: '',
  description: '',
  isEditing: false,
  outputVariable: 'memory_value',
};

/**
 * Estilos del nodo
 */
export const NODE_STYLES = {
  width: 280,
  height: 100,
  borderRadius: 12,
  padding: 16,
  backgroundColor: '#ffffff',
  borderColor: '#e0e0e0',
  selectedBorderColor: '#00ff00',
  shadowColor: 'rgba(0, 0, 0, 0.1)',
};

/**
 * Estilos de los handles
 */
export const HANDLE_STYLES = {
  width: 12,
  height: 12,
  borderWidth: 2,
  borderColor: '#ffffff',
  backgroundColor: '#00ff00',
  borderRadius: '50%',
};

/**
 * Mensajes de validación
 */
export const VALIDATION_MESSAGES = {
  keyRequired: 'La clave es requerida',
  valueRequiredForSet: 'El valor es requerido para la acción "Guardar"',
  invalidKey: 'La clave solo puede contener letras, números y guiones bajos',
  keyTooLong: 'La clave no puede tener más de 50 caracteres',
  valueTooLong: 'El valor no puede tener más de 500 caracteres',
};

/**
 * Límites de caracteres
 */
export const CHAR_LIMITS = {
  key: 50,
  value: 500,
  description: 200,
};

/**
 * Expresión regular para validar claves
 */
export const KEY_REGEX = /^[a-zA-Z0-9_]+$/;

/**
 * Placeholders para los campos
 */
export const PLACEHOLDERS = {
  key: 'ej: nombre_usuario',
  value: 'ej: Juan Pérez',
  description: 'Descripción opcional...',
  outputVariable: 'ej: resultado_memoria',
};
