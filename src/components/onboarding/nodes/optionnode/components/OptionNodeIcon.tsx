/**
 * @file OptionNodeIcon.tsx
 * @description Icon component for OptionNode with dynamic theming
 * @version 1.0.0
 */

import { Check, X, HelpCircle, Circle } from 'lucide-react';
import React, { useMemo } from 'react';

import { useRenderTracker } from '@/utils/renderTracker';

import { ICON_SIZES } from '../constants';
import { getIconFromLabel } from '../helpers';
import type { OptionNodeIconProps } from '../types';

const OptionNodeIcon: React.FC<OptionNodeIconProps> = ({
  label,
  isUltraPerformanceMode = false,
  size,
  className = '',
}) => {
  useRenderTracker('OptionNodeIcon');

  const iconSize = useMemo(() => {
    if (size) return size;
    return isUltraPerformanceMode ? ICON_SIZES.ULTRA : ICON_SIZES.NORMAL;
  }, [size, isUltraPerformanceMode]);

  const iconProperties = useMemo(
    () => ({
      size: iconSize,
      strokeWidth: isUltraPerformanceMode ? 2 : 1.75,
      className: `option-node-icon ${className ?? ''}`.trim(),
    }),
    [iconSize, isUltraPerformanceMode, className],
  );

  const IconComponent = useMemo(() => {
    const iconType = getIconFromLabel(label);

    switch (iconType) {
      case 'check':
        return Check;
      case 'x':
        return X;
      case 'help':
        return HelpCircle;
      case 'circle':
      default:
        return Circle;
    }
  }, [label]);

  return (
    <div
      className={`option-node__icon ${isUltraPerformanceMode ? 'option-node__icon--ultra' : ''}`}
      role='img'
      aria-label={`Opción: ${label ?? 'Sin etiqueta'}`}
    >
      <IconComponent {...iconProperties} aria-hidden='true' />
    </div>
  );
};

export default React.memo(OptionNodeIcon);
