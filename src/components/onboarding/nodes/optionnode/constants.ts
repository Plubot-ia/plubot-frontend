/**
 * @file constants.ts
 * @description Constants and configuration for OptionNode
 * @version 1.0.0
 */

import type { ThemeConfig, OptionTheme } from './types';

// ==================== NODE CONFIGURATION ====================
export const NODE_CONFIG = {
  DEFAULT_INSTRUCTION: 'El usuario seleccionó esta opción',
  MAX_TEXTAREA_HEIGHT: 200,
  MIN_TEXTAREA_HEIGHT: 60,
  RESIZE_DEBOUNCE_MS: 50,
  NAVIGATION_DURATION: 800,
  DEFAULT_ZOOM: 1,
} as const;

// ==================== THEME CONFIGURATION ====================
export const THEME_CONFIG: Record<OptionTheme, ThemeConfig> = {
  yes: {
    color: '#10b981',
    icon: 'check',
    label: 'Sí',
  },
  no: {
    color: '#ef4444',
    icon: 'x',
    label: 'No',
  },
  maybe: {
    color: '#6b7280',
    icon: 'help',
    label: 'Tal vez',
  },
  default: {
    color: '#3b82f6',
    icon: 'circle',
    label: 'Opción',
  },
} as const;

// ==================== LABEL PATTERNS ====================
export const LABEL_PATTERNS = {
  YES: ['sí', 'si', 'yes', 'true', 'afirmativo', 'correcto', 'aceptar'],
  NO: ['no', 'false', 'negativo', 'incorrecto', 'rechazar', 'cancelar'],
  MAYBE: ['tal vez', 'quizás', 'quizas', 'maybe', 'posiblemente', 'perhaps'],
} as const;

// ==================== STYLE CLASSES ====================
export const STYLE_CLASSES = {
  BASE: 'option-node',
  SELECTED: 'option-node--selected',
  HAS_SOURCE: 'option-node--has-source',
  CONNECTABLE: 'option-node--connectable',
  EDITING: 'option-node--editing',
  ULTRA: 'option-node--ultra',
  HOVERED: 'option-node--hovered',
  FOCUSED: 'option-node--focused',
} as const;

// ==================== ANIMATION CONFIGURATION ====================
export const ANIMATION_CONFIG = {
  TRANSITION_DURATION: '0.2s',
  TRANSITION_EASING: 'cubic-bezier(0.4, 0, 0.2, 1)',
  HOVER_SCALE: 1.02,
  CLICK_SCALE: 0.98,
} as const;

// ==================== ICON SIZES ====================
export const ICON_SIZES = {
  NORMAL: 16,
  ULTRA: 14,
  LARGE: 20,
  SMALL: 12,
} as const;

// ==================== HANDLE CONFIGURATION ====================
export const HANDLE_CONFIG = {
  SIZE: {
    NORMAL: 10,
    ULTRA: 8,
    HOVER: 12,
  },
  BORDER_WIDTH: 2,
  BORDER_STYLE: 'solid',
} as const;

// ==================== KEYBOARD SHORTCUTS ====================
export const KEYBOARD_SHORTCUTS = {
  START_EDITING: 'Enter',
  FINISH_EDITING: ['Ctrl+Enter', 'Meta+Enter'],
  CANCEL_EDITING: 'Escape',
  NAVIGATE_TO_PARENT: 'Ctrl+P',
  DELETE_NODE: 'Delete',
  DUPLICATE_NODE: 'Ctrl+D',
} as const;

// ==================== Z-INDEX LAYERS ====================
export const Z_INDEX = {
  BASE: 1,
  HANDLE: 10,
  EDITING: 100,
  TOOLTIP: 1000,
} as const;
