/**
 * @file types.ts
 * @description Tipos TypeScript para WaitNode
 */

import type { NodeProps } from 'reactflow';

/**
 * Unidades de tiempo soportadas - Extendido para soporte completo
 */
export type TimeUnit = 'ms' | 's' | 'm' | 'h';

/**
 * Datos del nodo WaitNode - Elite Version
 */
export interface WaitNodeData {
  /** Duración del delay */
  duration: number;
  /** Unidad de tiempo (ms, s, m, h) */
  unit: TimeUnit;
  /** Descripción opcional del delay */
  description?: string;
  /** Si está en modo edición */
  isEditing?: boolean;
  /** Si el delay está activo en simulación */
  isActive?: boolean;
  /** Timestamp cuando inició la espera */
  startTimestamp?: number;
  /** Duración total en ms para cálculos precisos */
  totalDurationMs?: number;
  /** Modo de visualización */
  displayMode?: 'compact' | 'detailed';
  /** Si debe mostrar tiempo restante en simulación */
  showRemainingTime?: boolean;
  /** Variable del flujo para tiempo dinámico */
  variableTime?: string;
  /** Si el tiempo es relativo a una variable */
  useVariableTime?: boolean;
}

/**
 * Props del componente WaitNode
 */
export interface WaitNodeProps extends NodeProps<WaitNodeData> {
  id: string;
  data: WaitNodeData;
  selected: boolean;
  isConnectable: boolean;
}

/**
 * Props del componente de configuración
 */
export interface WaitNodeConfigProps {
  data: WaitNodeData;
  onSave: (data: WaitNodeData) => void;
  onCancel: () => void;
}

/**
 * Configuración de validación
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
}

/**
 * Preset de duración
 */
export interface DurationPreset {
  label: string;
  duration: number;
  unit: TimeUnit;
  icon?: string;
  category?: 'instant' | 'quick' | 'normal' | 'long' | 'extended';
}

/**
 * Estado de animación
 */
export interface AnimationState {
  progress: number;
  elapsed: number;
  remaining: number;
  isRunning: boolean;
}
export interface ValidationConfig {
  minDuration: number;
  maxDuration: number;
  unit: TimeUnit;
}
