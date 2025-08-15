/**
 * @file hooks.ts
 * @description Custom React hooks for OptionNode
 * @version 1.0.0
 */

import { debounce } from 'lodash';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Node } from 'reactflow';

import useFlowStore from '../../../../stores/use-flow-store';
import type { DecisionNodeData } from '../decisionnode/DecisionNode.types';

import { NODE_CONFIG } from './constants';
import { adjustTextareaHeight, hasInstructionChanged, navigateToNode } from './helpers';
import type {
  NodeEffectsProps,
  NodeCallbacksProps,
  KeyboardHandlersProps,
  OptionNodeState,
} from './types';

// ==================== STATE HOOKS ====================
export const useOptionNodeState = (initialInstruction?: string): OptionNodeState => {
  const [currentInstruction, _setCurrentInstruction] = useState(
    initialInstruction ?? NODE_CONFIG.DEFAULT_INSTRUCTION,
  );
  const [isHovered, _setIsHovered] = useState(false);
  const [isFocused, _setIsFocused] = useState(false);

  return {
    currentInstruction,
    isHovered,
    isFocused,
  };
};

// ==================== EFFECT HOOKS ====================
export const useNodeEffects = ({
  isEditing,
  instruction,
  setCurrentInstruction,
  textareaRef,
  nodeRef,
  id,
  updateNodeInternals,
}: NodeEffectsProps): void => {
  // Sync local editing buffer when not editing
  useEffect(() => {
    if (!isEditing) {
      setCurrentInstruction(instruction ?? NODE_CONFIG.DEFAULT_INSTRUCTION);
    }
  }, [instruction, isEditing, setCurrentInstruction]);

  // Handle textarea focus and resize when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const textarea = textareaRef.current;
      adjustTextareaHeight(textarea);
      textarea.focus();
      textarea.select();
    }
  }, [isEditing, textareaRef]);

  // Update React Flow internals on resize to keep edges connected correctly
  useEffect(() => {
    const debouncedUpdate = debounce(() => updateNodeInternals(id), NODE_CONFIG.RESIZE_DEBOUNCE_MS);

    const observer = new ResizeObserver(() => {
      debouncedUpdate();
    });

    const currentRef = nodeRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      debouncedUpdate.cancel();
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [id, updateNodeInternals, nodeRef]);
};

// ==================== CALLBACK HOOKS ====================
export const useNodeCallbacks = ({
  currentInstruction,
  setCurrentInstruction,
  updateNodeData,
  id,
  instruction,
  sourceNode,
  textareaRef,
  setNodeEditing,
  isUltraPerformanceMode,
  reactFlowInstance, // Optional - not used anymore
  label: _label,
  index,
}: NodeCallbacksProps) => {
  const handleInstructionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setCurrentInstruction(value);
      adjustTextareaHeight(textareaRef.current);
    },
    [setCurrentInstruction, textareaRef],
  );

  const startEditing = useCallback(() => {
    if (!isUltraPerformanceMode) {
      setNodeEditing(id, true);
    }
  }, [id, isUltraPerformanceMode, setNodeEditing]);

  // Function to update parent DecisionNode when OptionNode label changes
  const updateParentDecisionNode = useCallback(
    (newLabel: string) => {
      // OptionNode updating parent DecisionNode with new label

      if (!sourceNode || !newLabel || index === undefined) {
        console.warn('⚠️ Missing required data for parent update:', {
          sourceNode,
          newLabel,
          index,
        });
        return;
      }

      try {
        const store = useFlowStore.getState() as {
          nodes: Node[];
          updateNodeData: (nodeId: string, data: Partial<DecisionNodeData>) => void;
        };
        const parentNode = store.nodes.find((n: Node) => n.id === sourceNode) as
          | Node<DecisionNodeData>
          | undefined;

        if (!parentNode) {
          console.error('❌ Parent DecisionNode not found:', sourceNode);
          return;
        }

        const conditions = parentNode.data?.conditions ?? [];

        if (conditions.length > 0) {
          // Updating parent DecisionNode condition

          // Update the condition at the specific index
          // eslint-disable-next-line security/detect-object-injection
          if (Object.prototype.hasOwnProperty.call(conditions, index) && conditions[index]) {
            // eslint-disable-next-line security/detect-object-injection
            const _oldText = conditions[index].text;
            Object.assign(conditions, {
              [index]: {
                // eslint-disable-next-line security/detect-object-injection
                ...conditions[index],
                text: newLabel,
                updatedAt: new Date().toISOString(),
              },
            });

            // Updating condition at index

            // Use the store's updateNodeData method directly
            store.updateNodeData(sourceNode, {
              conditions: conditions,
            });

            // Parent DecisionNode update completed
          } else {
            // Condition at index not found
          }
        } else {
          console.error('❌ Parent node has no conditions:', parentNode?.data);
        }
      } catch (error) {
        console.error('❌ Error updating parent DecisionNode:', error);
      }
    },
    [sourceNode, index],
  );

  const finishEditing = useCallback(() => {
    if (hasInstructionChanged(currentInstruction, instruction)) {
      updateNodeData(id, {
        instruction: currentInstruction.trim(),
        lastUpdated: new Date().toISOString(),
      });
    }
    setNodeEditing(id, false);
  }, [id, currentInstruction, instruction, updateNodeData, setNodeEditing]);

  const cancelEditing = useCallback(() => {
    setCurrentInstruction(instruction ?? NODE_CONFIG.DEFAULT_INSTRUCTION);
    setNodeEditing(id, false);
  }, [instruction, id, setNodeEditing, setCurrentInstruction]);

  const navigateToParent = useCallback(() => {
    if (sourceNode && reactFlowInstance) {
      navigateToNode(reactFlowInstance, sourceNode, { select: true });
    }
  }, [sourceNode, reactFlowInstance]);

  return {
    handleInstructionChange,
    startEditing,
    finishEditing,
    cancelEditing,
    navigateToParent,
    updateParentDecisionNode,
  };
};

// ==================== KEYBOARD HOOKS ====================
export const useKeyboardHandlers = ({
  isEditing,
  startEditing,
  finishEditing,
  cancelEditing,
  navigateToParent,
  sourceNode,
}: KeyboardHandlersProps) => {
  const handleEditingModeKeys = useCallback(
    (e: React.KeyboardEvent): boolean => {
      // Finish editing with Ctrl/Cmd + Enter
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        finishEditing();
        return true;
      }

      // Cancel editing with Escape
      if (e.key === 'Escape') {
        e.preventDefault();
        cancelEditing();
        return true;
      }

      return false;
    },
    [finishEditing, cancelEditing],
  );

  const handleNormalModeKeys = useCallback(
    (e: React.KeyboardEvent): boolean => {
      // Start editing with Enter
      if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        startEditing();
        return true;
      }

      return false;
    },
    [startEditing],
  );

  const handleNavigationKeys = useCallback(
    (e: React.KeyboardEvent): boolean => {
      // Navigate to parent with Ctrl + P
      if (e.key === 'p' && e.ctrlKey && sourceNode) {
        e.preventDefault();
        navigateToParent();
        return true;
      }

      return false;
    },
    [navigateToParent, sourceNode],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Handle editing mode keys
      if (isEditing && handleEditingModeKeys(e)) {
        return;
      }

      // Handle normal mode keys
      if (!isEditing && handleNormalModeKeys(e)) {
        return;
      }

      // Handle navigation keys (works in both modes)
      handleNavigationKeys(e);
    },
    [isEditing, handleEditingModeKeys, handleNormalModeKeys, handleNavigationKeys],
  );

  return { handleKeyDown };
};

// ==================== ANIMATION HOOKS ====================
export const useNodeAnimation = () => {
  const [isAnimating, setIsAnimating] = useState(false);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerAnimation = useCallback((duration: number = 300) => {
    setIsAnimating(true);

    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }

    animationTimeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
    }, duration);
  }, []);

  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  return { isAnimating, triggerAnimation };
};

// ==================== HOVER HOOKS ====================
export const useHoverState = () => {
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 100);
  }, []);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return { isHovered, handleMouseEnter, handleMouseLeave };
};

// ==================== FOCUS HOOKS ====================
export const useFocusState = () => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  return { isFocused, handleFocus, handleBlur };
};
