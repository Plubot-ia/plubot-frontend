/**
 * @file OptionNodeHandle.tsx
 * @description Handle component for OptionNode with dynamic styling
 * @version 1.0.0
 */

import React, { useMemo } from 'react';
import { Handle } from 'reactflow';

import { useRenderTracker } from '@/utils/renderTracker';

import { HANDLE_CONFIG } from '../constants';
import { getHandleColorFromLabel } from '../helpers';
import type { OptionNodeHandleProps } from '../types';

const OptionNodeHandle: React.FC<OptionNodeHandleProps> = ({
  type,
  position,
  isEditing = false,
  isUltraPerformanceMode = false,
  color,
  label,
  ...props
}) => {
  useRenderTracker('OptionNodeHandle');

  const handleClasses = useMemo(() => {
    const classes = ['option-node__handle', `option-node__handle--${type}`];

    if (isEditing) classes.push('option-node__handle--editing');
    if (isUltraPerformanceMode) classes.push('option-node__handle--ultra');

    return classes.join(' ');
  }, [type, isEditing, isUltraPerformanceMode]);

  // PERFORMANCE: Ultra-specific memoization to prevent unnecessary recalculations
  const computedColor = useMemo(() => {
    return color ?? getHandleColorFromLabel(label ?? 'default');
  }, [color, label]);

  const handleSize = useMemo(() => {
    return isUltraPerformanceMode ? HANDLE_CONFIG.SIZE.ULTRA : HANDLE_CONFIG.SIZE.NORMAL;
  }, [isUltraPerformanceMode]);

  const handleStyle = useMemo(() => {
    return {
      backgroundColor: computedColor,
      borderColor: computedColor,
      borderWidth: `${HANDLE_CONFIG.BORDER_WIDTH}px`,
      borderStyle: HANDLE_CONFIG.BORDER_STYLE,
      width: `${handleSize}px`,
      height: `${handleSize}px`,
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    };
  }, [computedColor, handleSize]);

  return (
    <Handle
      type={type}
      position={position}
      className={handleClasses}
      style={handleStyle}
      {...props}
    />
  );
};

// ULTRA-OPTIMIZED memo comparison for OptionNodeHandle
export default React.memo(OptionNodeHandle, (prevProps, nextProps) => {
  // PERFORMANCE: Fast identity checks for most common changes
  if (prevProps.isEditing !== nextProps.isEditing) return false;
  if (prevProps.color !== nextProps.color) return false;
  if (prevProps.label !== nextProps.label) return false;

  // PERFORMANCE: Less frequent changes checked last
  return (
    prevProps.type === nextProps.type &&
    prevProps.position === nextProps.position &&
    prevProps.isConnectable === nextProps.isConnectable &&
    prevProps.isUltraPerformanceMode === nextProps.isUltraPerformanceMode
  );
});
