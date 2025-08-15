/**
 * @file types.ts
 * @description Tipos y definiciones para MemoryNode
 */

import type { NodeProps } from 'reactflow';

/**
 * Acciones disponibles para manipular el contexto
 */
export type MemoryAction = 'set' | 'get' | 'delete';

/**
 * Datos del nodo de memoria
 */
export interface MemoryNodeData {
  /** Acción a realizar sobre el contexto */
  action: MemoryAction;

  /** Clave de la variable de contexto */
  key: string;

  /** Valor a guardar (solo requerido para action="set") */
  value?: string;

  /** Descripción opcional para documentación */
  description?: string;

  /** Si el nodo está en modo edición */
  isEditing?: boolean;

  /** Variable donde guardar el resultado (para action="get") */
  outputVariable?: string;
}

/**
 * Props del componente MemoryNode
 */
export interface MemoryNodeProps extends NodeProps<MemoryNodeData> {
  id: string;
  data: MemoryNodeData;
  selected: boolean;
}

/**
 * Props del componente MemoryNodeConfig
 */
export interface MemoryNodeConfigProps {
  data: MemoryNodeData;
  onSave: (data: MemoryNodeData) => void;
  onCancel: () => void;
}

/**
 * Props del componente MemoryPreview
 */
export interface MemoryPreviewProps {
  action: MemoryAction;
  key: string;
  value?: string;
  description?: string;
}

/**
 * Resultado de validación
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Contexto de memoria para simulación
 */
export interface MemoryContext {
  [key: string]: string | number | boolean | null | undefined;
}
