import type { Node } from 'reactflow';

/**
 * Configuración global del nodo de decisión
 * @constant
 */
export const NODE_CONFIG = {
  // Dimensiones
  MIN_WIDTH: 180,
  MIN_HEIGHT: 110,
  MAX_TEXTAREA_HEIGHT: 200,

  // Valores por defecto
  DEFAULT_QUESTION: '¿Cuál es tu pregunta?',
  DEFAULT_CONDITION: 'Nueva condición',
  DEFAULT_OUTPUTS: ['Sí', 'No'],
  DEBOUNCE_DELAY: 300,
  MAX_CONDITIONS: 5,
  ANIMATION_DURATION: 200,
  KEY_SHORTCUTS: {
    save: { key: 'Enter', description: 'Guardar cambios' },
    cancel: { key: 'Escape', description: 'Cancelar edición' },
    addCondition: { key: 'Ctrl+A', description: 'Añadir condición' },
    deleteCondition: { key: 'Delete', description: 'Eliminar condición' },
    moveUp: { key: 'Ctrl+ArrowUp', description: 'Mover condición arriba' },
    moveDown: { key: 'Ctrl+ArrowDown', description: 'Mover condición abajo' },
  },
  ARIA_LABELS: {
    node: 'Nodo de decisión',
    question: 'Pregunta del nodo de decisión',
    editQuestion: 'Editar pregunta',
    saveChanges: 'Guardar cambios',
    cancelEditing: 'Cancelar edición',
    addCondition: 'Añadir nueva condición',
    editCondition: 'Editar condición',
    deleteCondition: 'Eliminar condición',
    moveCondition: 'Mover condición',
  },
} as const;

// Dimension constants
export const DECISION_NODE_DIMENSIONS = {
  MIN_WIDTH: 320,
  MAX_WIDTH: 500,
  MIN_HEIGHT: 200,
  MAX_HEIGHT: 600,
  HEADER_HEIGHT: 40,
  QUESTION_MIN_HEIGHT: 60,
  CONDITIONS_MIN_HEIGHT: 100,
  PADDING: 16,
  BORDER_RADIUS: 12,
} as const;

// Key shortcuts
export const DECISION_NODE_SHORTCUTS = {
  SAVE: 'Enter',
  CANCEL: 'Escape',
  ADD_CONDITION: 'Ctrl+Enter',
  DELETE_CONDITION: 'Delete',
  FOCUS_QUESTION: 'F2',
} as const;

// ARIA labels for accessibility
export const DECISION_NODE_ARIA = {
  MAIN_CONTAINER: 'Decision node container',
  QUESTION_INPUT: 'Decision question input',
  CONDITIONS_LIST: 'Decision conditions list',
  ADD_CONDITION_BUTTON: 'Add new condition',
  DELETE_CONDITION_BUTTON: 'Delete condition',
  CONDITION_INPUT: 'Condition text input',
  NODE_HEADER: 'Decision node header',
  RESIZE_HANDLE: 'Resize node handle',
} as const;

// Node status types
export type NodeStatus = 'idle' | 'editing' | 'validating' | 'error' | 'success';

// Condition type definition
export interface DecisionCondition {
  id: string;
  text: string;
  isValid: boolean;
  targetNodeId?: string;
  order: number;
  color: string;
  createdAt: string;
  updatedAt: string;
}

// Decision node data interface
export interface DecisionNodeData {
  question: string;
  conditions: DecisionCondition[];
  isEditing?: boolean;
  isSaving?: boolean;
  enableMarkdown?: boolean;
  enableVariables?: boolean;
  enableLogic?: boolean;
  isUltraPerformanceMode?: boolean;
  status?: 'idle' | 'processing' | 'success' | 'error';
  validationErrors?: string[];
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    version: string;
  };
  ui: {
    isExpanded: boolean;
    showConditions: boolean;
    performanceMode: boolean;
    collapsed?: boolean;
  };
}

// Decision node type
export type DecisionNodeType = Node<DecisionNodeData>;

// Validation helpers
export const isValidQuestion = (question: string): boolean => {
  return question.trim().length >= 3 && question.trim().length <= 200;
};

export const isValidCondition = (condition: string): boolean => {
  return condition.trim().length >= 1 && condition.trim().length <= 100;
};

// Tipos de condición
export const CONDITION_TYPES = {
  TRUE: 'true',
  FALSE: 'false',
  DEFAULT: 'default',
} as const;

// Colores para los conectores según el tipo de condición
export const CONNECTOR_COLORS = {
  [CONDITION_TYPES.TRUE]: '#22c55e', // Verde para "Sí"
  [CONDITION_TYPES.FALSE]: '#ef4444', // Rojo para "No"
} as const;

// Paleta de colores para condiciones "default" (no Sí/No)
export const DEFAULT_CONDITION_PALETTE = [
  '#3b82f6', // Azul (original por defecto, puede ser el primero)
  '#FF69B4', // HotPink
  '#FFA500', // Orange
  '#ADFF2F', // GreenYellow
  '#00CED1', // DarkTurquoise
  '#DA70D6', // Orchid
  '#FFD700', // Gold
  '#8A2BE2', // BlueViolet
] as const;

/**
 * Determina el tipo de condición basado en su texto
 * @param condition - Texto de la condición
 * @returns Tipo de condición (true, false, default)
 */
export const getConditionType = (condition: string): string => {
  const text = (condition ?? '').toLowerCase();
  if (text.includes('sí') || text.includes('si') || text.includes('yes') || text.includes('true')) {
    return CONDITION_TYPES.TRUE;
  }
  if (text.includes('no') || text.includes('not') || text.includes('false')) {
    return CONDITION_TYPES.FALSE;
  }
  return CONDITION_TYPES.DEFAULT;
};

/**
 * Obtiene el color del conector según el tipo de condición
 * @param conditionText - Texto de la condición
 * @param index - Índice para seleccionar color de la paleta (opcional)
 * @returns Color CSS para el conector
 */
export const getConnectorColor = (conditionText: string, index: number = 0): string => {
  const type = getConditionType(conditionText);
  if (type === CONDITION_TYPES.DEFAULT) {
    return DEFAULT_CONDITION_PALETTE[index % DEFAULT_CONDITION_PALETTE.length];
  }
  // Para TRUE y FALSE
  return CONNECTOR_COLORS[type as keyof typeof CONNECTOR_COLORS];
};

export const hasMinimumConditions = (conditions: DecisionCondition[]): boolean => {
  return conditions.filter((c) => c.isValid).length >= 2;
};

export const validateDecisionNode = (data: DecisionNodeData): string[] => {
  const errors: string[] = [];

  if (!isValidQuestion(data.question)) {
    errors.push('Question must be between 3 and 200 characters');
  }

  if (!hasMinimumConditions(data.conditions)) {
    errors.push('At least 2 valid conditions are required');
  }

  data.conditions.forEach((condition, index) => {
    if (!isValidCondition(condition.text)) {
      errors.push(`Condition ${index + 1} must be between 1 and 100 characters`);
    }
  });

  return errors;
};

// Helper functions for conditions
export const createNewCondition = (text: string = '', order: number = 0): DecisionCondition => ({
  id: `condition-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  text,
  isValid: isValidCondition(text),
  order,
  color: getConnectorColor(text),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const updateCondition = (
  condition: DecisionCondition,
  updates: Partial<DecisionCondition>,
): DecisionCondition => ({
  ...condition,
  ...updates,
  updatedAt: new Date().toISOString(),
  isValid: updates.text !== undefined ? isValidCondition(updates.text) : condition.isValid,
});

// Default node data
export const createDefaultDecisionNodeData = (): DecisionNodeData => ({
  question: '',
  conditions: [],
  isEditing: false,
  status: 'idle',
  validationErrors: [],
  metadata: {
    createdAt: new Date(),
    updatedAt: new Date(),
    version: '1.0.0',
  },
  ui: {
    isExpanded: true,
    showConditions: true,
    performanceMode: false,
  },
});

// Event handler types
export interface DecisionNodeHandlers {
  onQuestionChange: (question: string) => void;
  onConditionAdd: () => void;
  onConditionUpdate: (id: string, text: string) => void;
  onConditionDelete: (id: string) => void;
  onConditionReorder: (fromIndex: number, toIndex: number) => void;
  onEditModeToggle: () => void;
  onValidate: () => void;
  onSave: () => void;
  onCancel: () => void;
}

// Component props interfaces
export interface DecisionNodeHeaderProps {
  nodeId: string;
  isEditing: boolean;
  status: NodeStatus;
  performanceMode: boolean;
  onEditToggle: () => void;
}

export interface DecisionNodeQuestionProps {
  question: string;
  isEditing: boolean;
  validationErrors: string[];
  onChange: (question: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export interface DecisionNodeConditionsProps {
  conditions: DecisionCondition[];
  isEditing: boolean;
  onAdd: () => void;
  onUpdate: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}

export interface DecisionNodeHandlesProps {
  nodeId: string;
  conditions: DecisionCondition[];
  performanceMode: boolean;
}

export interface DecisionNodeOptionsProps {
  nodeId: string;
  data: DecisionNodeData;
  onDataChange: (data: Partial<DecisionNodeData>) => void;
}
