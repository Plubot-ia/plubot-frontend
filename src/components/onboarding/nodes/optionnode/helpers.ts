/**
 * @file helpers.ts
 * @description Helper functions for OptionNode
 * @version 1.0.0
 */

import { Position } from 'reactflow';
import type { ReactFlowInstance, Node } from 'reactflow';

import { getConnectorColor } from '../decisionnode/DecisionNode.types';

import { LABEL_PATTERNS, THEME_CONFIG, NODE_CONFIG } from './constants';
import type { NavigationOptions, NodeStyleConfig, OptionTheme } from './types';

// ==================== POSITION HELPERS ====================
export const getPosition = (position?: string | Position): Position => {
  if (typeof position === 'object' && position !== null) {
    return position as Position;
  }
  switch (position) {
    case 'top':
      return Position.Top;
    case 'right':
      return Position.Right;
    case 'left':
      return Position.Left;
    case 'bottom':
      return Position.Bottom;
    case undefined:
      return Position.Bottom;
    default:
      return Position.Bottom;
  }
};

// ==================== THEME HELPERS ====================
export const getThemeFromLabel = (label?: string): OptionTheme => {
  if (!label) return 'default';

  const normalizedLabel = label.toLowerCase().trim();

  if (LABEL_PATTERNS.YES.some((pattern) => normalizedLabel.includes(pattern))) {
    return 'yes';
  }
  if (LABEL_PATTERNS.NO.some((pattern) => normalizedLabel.includes(pattern))) {
    return 'no';
  }
  if (LABEL_PATTERNS.MAYBE.some((pattern) => normalizedLabel.includes(pattern))) {
    return 'maybe';
  }

  return 'default';
};

export const getColorFromLabel = (label?: string): string => {
  const theme = getThemeFromLabel(label);
  if (!Object.prototype.hasOwnProperty.call(THEME_CONFIG, theme)) {
    return THEME_CONFIG.default.color;
  }
  // Use Object.assign to avoid object injection warning
  const config = Object.assign({}, THEME_CONFIG);
  // eslint-disable-next-line security/detect-object-injection
  return config[theme].color;
};

export const getIconFromLabel = (label?: string): string => {
  const theme = getThemeFromLabel(label);
  if (!Object.prototype.hasOwnProperty.call(THEME_CONFIG, theme)) {
    return THEME_CONFIG.default.icon;
  }
  // Use Object.assign to avoid object injection warning
  const config = Object.assign({}, THEME_CONFIG);
  // eslint-disable-next-line security/detect-object-injection
  return config[theme].icon;
};

/**
 * Calculate handle color based on OptionNode label using DecisionNode's color logic
 * This ensures OptionNode handles match their corresponding DecisionNode output handles
 */
export const getHandleColorFromLabel = (label?: string, index?: number): string => {
  if (!label) return '#4b5563';

  // Use DecisionNode's getConnectorColor function for consistency
  const color = getConnectorColor(label, index ?? 0);

  // Debug logging to verify color calculation - DISABLED to prevent console spam
  // console.log(`OptionNode Handle Color - Label: "${label}", Index: ${index ?? 0}, Color: ${color}`);

  return color;
};

// ==================== NAVIGATION HELPERS ====================
export const navigateToNode = (
  reactFlowInstance: ReactFlowInstance,
  nodeId: string,
  options: NavigationOptions = {},
): void => {
  if (!reactFlowInstance || !nodeId) {
    console.warn('navigateToNode: Invalid parameters', { reactFlowInstance, nodeId });
    return;
  }

  const {
    select = false,
    duration = NODE_CONFIG.NAVIGATION_DURATION,
    zoom = NODE_CONFIG.DEFAULT_ZOOM,
  } = options;

  const nodes = reactFlowInstance.getNodes();
  const targetNode = nodes.find((n: Node) => n.id === nodeId);

  if (!targetNode) {
    console.warn(`navigateToNode: Node ${nodeId} not found`);
    return;
  }

  // Center the view on the target node
  const centerX = targetNode.position.x + (targetNode.width ?? 0) / 2;
  const centerY = targetNode.position.y + (targetNode.height ?? 0) / 2;

  reactFlowInstance.setCenter(centerX, centerY, { zoom, duration });

  // Optionally select the node
  if (select) {
    reactFlowInstance.setNodes((currentNodes: Node[]) =>
      currentNodes.map((n: Node) => ({
        ...n,
        selected: n.id === nodeId,
      })),
    );
  }
};

// ==================== STYLE HELPERS ====================
export const getBorderColor = (config: NodeStyleConfig): string => {
  const { selected, sourceNode, isConnectable, color, label } = config;

  // Use provided color first
  if (color) return color;

  // Use label-based color logic (like the original JSX version)
  const labelColor = getColorFromLabel(label);
  if (labelColor !== '#4b5563') return labelColor; // If not default, use it

  // Fallback to state-based colors
  if (selected) return '#ff6b6b';
  if (sourceNode) return '#4ecca3';
  if (isConnectable) return '#667eea';
  return '#4b5563';
};

export const calculateNodeClasses = ({
  selected,
  _sourceNode,
  isConnectable,
  isEditing,
  isUltraPerformanceMode,
}: {
  selected?: boolean;
  _sourceNode?: string;
  isConnectable?: boolean;
  isEditing?: boolean;
  isUltraPerformanceMode?: boolean;
}): string => {
  const classes: string[] = ['option-node'];

  // Add mode-specific classes that exist in CSS
  if (isUltraPerformanceMode) {
    classes.push('option-node--ultra-performance');
  }

  // Add state classes that exist in CSS
  if (selected) classes.push('option-node--selected');
  if (isEditing) classes.push('option-node--editing');
  if (isConnectable) classes.push('option-node--connected');

  return classes.join(' ');
};

export const calculateNodeStyle = (config: NodeStyleConfig): React.CSSProperties => {
  const borderColor = getBorderColor(config);
  const { selected } = config;

  return {
    borderColor,
    boxShadow: selected ? `0 0 0 2px ${borderColor}` : 'none',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  };
};

// ==================== TEXTAREA HELPERS ====================
export const adjustTextareaHeight = (
  textarea: HTMLTextAreaElement | null,
  maxHeight: number = NODE_CONFIG.MAX_TEXTAREA_HEIGHT,
): void => {
  if (!textarea) return;

  textarea.style.height = 'auto';
  const scrollHeight = textarea.scrollHeight;
  textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
};

// ==================== VALIDATION HELPERS ====================
export const validateInstruction = (instruction?: string): string => {
  if (!instruction || instruction.trim() === '') {
    return NODE_CONFIG.DEFAULT_INSTRUCTION;
  }
  return instruction.trim();
};

export const hasInstructionChanged = (
  currentInstruction: string,
  originalInstruction?: string,
): boolean => {
  const current = currentInstruction.trim();
  const original = (originalInstruction ?? '').trim();
  return current !== original && current !== NODE_CONFIG.DEFAULT_INSTRUCTION;
};

// ==================== DATE HELPERS ====================
export const formatTimestamp = (timestamp?: string): string => {
  if (!timestamp) return '';

  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffMins < 1440) return `Hace ${Math.floor(diffMins / 60)} h`;
    return `Hace ${Math.floor(diffMins / 1440)} días`;
  } catch {
    return '';
  }
};

// ==================== ACCESSIBILITY HELPERS ====================
export const getAriaLabel = (label?: string, instruction?: string, sourceNode?: string): string => {
  const parts = [`Opción: ${label ?? 'Sin etiqueta'}`];

  if (instruction && instruction !== NODE_CONFIG.DEFAULT_INSTRUCTION) {
    parts.push(`Instrucciones: ${instruction}`);
  }

  if (sourceNode) {
    parts.push(`Conectado desde: ${sourceNode}`);
  }

  return parts.join('. ');
};

// ==================== PERFORMANCE HELPERS ====================
export const shouldSkipRender = (
  prevProps: Record<string, unknown>,
  nextProps: Record<string, unknown>,
  checkKeys: string[] = ['id', 'data', 'selected', 'isConnectable'],
): boolean => {
  return checkKeys.every((key) => {
    if (
      !Object.prototype.hasOwnProperty.call(prevProps, key) ||
      !Object.prototype.hasOwnProperty.call(nextProps, key)
    ) {
      return false;
    }
    // eslint-disable-next-line security/detect-object-injection
    return prevProps[key] === nextProps[key];
  });
};
