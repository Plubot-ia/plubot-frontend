/**
 * @file types.ts
 * @description Type definitions for OptionNode component
 * @version 1.0.0
 */

import type { HandleProps, ReactFlowInstance, Position } from 'reactflow';

// ==================== DATA TYPES ====================
export interface OptionNodeData {
  label?: string;
  instruction?: string;
  sourceNode?: string;
  lastUpdated?: string;
  color?: string;
  position?: string | Position;
  isUltraPerformanceMode?: boolean;
  isEditing?: boolean;
  index?: number; // Index of this option in the parent DecisionNode
}

// ==================== COMPONENT PROPS ====================
export interface OptionNodeProps {
  id: string;
  data?: OptionNodeData;
  selected?: boolean;
  isConnectable?: boolean;
  type?: string;
  xPos?: number;
  yPos?: number;
}

export interface OptionNodeHandleProps extends Omit<HandleProps, 'type' | 'position'> {
  type: 'source' | 'target';
  position: Position;
  isEditing?: boolean;
  isUltraPerformanceMode?: boolean;
  color?: string;
  label?: string;
}

export interface OptionNodeIconProps {
  label?: string;
  isUltraPerformanceMode?: boolean;
  size?: number;
  className?: string;
}

export interface OptionNodeContentProps {
  isEditing: boolean;
  instruction?: string;
  currentInstruction: string;
  onInstructionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onStartEditing: () => void;
  onFinishEditing: () => void;
  onCancelEditing: () => void;
  isUltraPerformanceMode?: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

// ==================== HOOK PROPS ====================
export interface NodeEffectsProps {
  isEditing: boolean;
  instruction?: string;
  setCurrentInstruction: (value: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  nodeRef: React.RefObject<HTMLDivElement | null>;
  id: string;
  updateNodeInternals: (nodeId: string) => void;
}

export interface NodeCallbacksProps {
  currentInstruction: string;
  setCurrentInstruction: (value: string) => void;
  updateNodeData: (id: string, data: Partial<OptionNodeData>) => void;
  id: string;
  instruction?: string;
  sourceNode?: string;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  setNodeEditing: (id: string, editing: boolean) => void;
  isUltraPerformanceMode: boolean;
  reactFlowInstance?: ReactFlowInstance; // OPTIMIZED: Made optional - not used anymore
  label?: string;
  index?: number;
}

export interface KeyboardHandlersProps {
  isEditing: boolean;
  startEditing: () => void;
  finishEditing: () => void;
  cancelEditing: () => void;
  navigateToParent: () => void;
  sourceNode?: string;
}

// ==================== STYLE TYPES ====================
export interface NodeStyleConfig {
  selected: boolean;
  sourceNode?: string;
  isConnectable: boolean;
  isEditing?: boolean;
  isUltraPerformanceMode?: boolean;
  color?: string;
  label?: string;
}

// ==================== NAVIGATION TYPES ====================
export interface NavigationOptions {
  select?: boolean;
  duration?: number;
  zoom?: number;
}

// ==================== STATE TYPES ====================
export interface OptionNodeState {
  currentInstruction: string;
  isHovered: boolean;
  isFocused: boolean;
}

// ==================== THEME TYPES ====================
export type OptionTheme = 'yes' | 'no' | 'maybe' | 'default';

export interface ThemeConfig {
  color: string;
  icon: 'check' | 'x' | 'help' | 'circle';
  label: string;
}
