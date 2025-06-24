/**
 * @file DecisionNode.types.js
 * @description Tipos y constantes para el componente DecisionNode
 */

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
  DEFAULT_OUTPUTS: ['Sí', 'No'],
  DEBOUNCE_DELAY: 300,
  MAX_TEXTAREA_HEIGHT: 200,
  MAX_CONDITIONS: 8,
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
  COLORS: {
    background: {
      normal: '#1e40af', // Azul oscuro
      ultra: '#1e3a8a', // Azul oscuro para ultra rendimiento
    },
    border: {
      normal: '#1e3a8a', // Borde azul oscuro
      ultra: '#1e3a8a', // Mismo azul para ultra rendimiento
    },
    text: {
      normal: '#713f12', // Marrón oscuro
      ultra: '#78350f', // Marrón más oscuro para ultra rendimiento
    },
  },
};

// Tipos de condiciones
export const CONDITION_TYPES = {
  TRUE: 'true',
  FALSE: 'false',
  DEFAULT: 'default',
};

// Modos de visualización
export const DISPLAY_MODES = {
  NORMAL: 'normal',
  ULTRA_PERFORMANCE: 'ultra-performance',
};

// Colores para los conectores según el tipo de condición
export const CONNECTOR_COLORS = {
  [CONDITION_TYPES.TRUE]: '#22c55e', // Verde para "Sí"
  [CONDITION_TYPES.FALSE]: '#ef4444', // Rojo para "No"
  // El color por defecto ahora se manejará con la paleta
};

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
];

/**
 * Determina el tipo de condición basado en su texto
 * @param {string} condition - Texto de la condición
 * @returns {string} - Tipo de condición (true, false, default)
 */
export const getConditionType = (condition) => {
  const text = (condition || '').toLowerCase();
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
 * @param {string} condition - Texto de la condición
 * @returns {string} - Color CSS para el conector
 */
export const getConnectorColor = (conditionText, index = 0) => {
  const type = getConditionType(conditionText);
  if (type === CONDITION_TYPES.DEFAULT) {
    return DEFAULT_CONDITION_PALETTE[index % DEFAULT_CONDITION_PALETTE.length];
  }
  return CONNECTOR_COLORS[type]; // Para TRUE y FALSE
};

/**
 * Genera un ID único para un nodo
 * @param {string} prefix - Prefijo para el ID
 * @returns {string} - ID único
 */
export const generateNodeId = (prefix = 'decision') => {
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Valida si una pregunta es válida
 * @param {string} question - Texto de la pregunta
 * @returns {boolean} - True si es válida
 */
export const isValidQuestion = (question) => {
  return question && question.trim().length > 0 && question !== NODE_CONFIG.DEFAULT_QUESTION;
};

/**
 * Valida si una condición es válida
 * @param {string} condition - Texto de la condición
 * @returns {boolean} - True si es válida
 */
export const isValidCondition = (condition) => {
  return condition && condition.trim().length > 0;
};
