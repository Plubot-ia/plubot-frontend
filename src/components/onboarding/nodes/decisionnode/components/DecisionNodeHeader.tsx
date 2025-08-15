/**
 * @file DecisionNodeHeader.tsx
 * @description Componente de cabecera para el nodo de decisión
 */

import { GitBranch, HelpCircle, ArrowUpDown, ExternalLink } from 'lucide-react';
import React, { memo, useMemo } from 'react';

import Tooltip from '../../../ui/ToolTip';
import { DECISION_NODE_ARIA } from '../DecisionNode.types';

// Tipos para el componente de ícono
type IconType = 'default' | 'question' | 'condition' | 'flow';

interface DecisionNodeIconProps {
  isUltraPerformanceMode?: boolean;
  type?: IconType;
}

interface IconProperties {
  size: number;
  strokeWidth: number;
  className: string;
}

/**
 * Componente para el ícono del nodo de decisión
 */
export const DecisionNodeIcon = memo<DecisionNodeIconProps>(
  ({ isUltraPerformanceMode = false, type = 'default' }) => {
    // Tamaño y grosor optimizados para legibilidad y rendimiento
    const iconProperties = useMemo<IconProperties>(
      () => ({
        size: isUltraPerformanceMode ? 16 : 18,
        strokeWidth: isUltraPerformanceMode ? 2 : 1.75,
        className: isUltraPerformanceMode ? '' : 'decision-node__icon-svg',
      }),
      [isUltraPerformanceMode],
    );

    // Seleccionar el ícono adecuado según el tipo
    const renderIcon = (): React.JSX.Element => {
      switch (type) {
        case 'question': {
          return <HelpCircle {...iconProperties} aria-hidden='true' />;
        }
        case 'condition': {
          return <ArrowUpDown {...iconProperties} aria-hidden='true' />;
        }
        case 'flow': {
          return <ExternalLink {...iconProperties} aria-hidden='true' />;
        }
        case 'default':
        default: {
          return <GitBranch {...iconProperties} aria-hidden='true' />;
        }
      }
    };

    return (
      <div
        className={`decision-node__icon ${isUltraPerformanceMode ? 'decision-node__icon--ultra' : ''}`}
        role='img'
        aria-label={DECISION_NODE_ARIA.NODE_HEADER}
      >
        {renderIcon()}
      </div>
    );
  },
);

DecisionNodeIcon.displayName = 'DecisionNodeIcon';

// Interfaces para metadatos y props del header
interface NodeMetadata {
  date?: string;
  owner?: string;
}

interface DecisionNodeHeaderProps {
  title?: string;
  iconType?: IconType;
  isUltraPerformanceMode?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  metadata?: NodeMetadata;
}

/**
 * Componente de cabecera para el nodo de decisión
 */
const DecisionNodeHeader = memo<DecisionNodeHeaderProps>(
  ({
    title: _title,
    iconType = 'default',
    isUltraPerformanceMode = false,
    isCollapsed: _isCollapsed,
    onToggleCollapse: _onToggleCollapse,
    metadata,
  }) => {
    return (
      <div className='decision-node__header' role='heading' aria-level={3}>
        <div className='decision-node__title'>
          <DecisionNodeIcon type={iconType} isUltraPerformanceMode={isUltraPerformanceMode} />
          <span className='decision-node__title-text'>Nodo de Decisión</span>
        </div>

        {!isUltraPerformanceMode && metadata && (
          <div className='decision-node__metadata'>
            {metadata.date && (
              <Tooltip content={`Última actualización: ${metadata.date}`} position='top'>
                <span className='decision-node__date'>{metadata.date}</span>
              </Tooltip>
            )}
            {metadata.owner && (
              <Tooltip content={`Propietario: ${metadata.owner}`} position='top'>
                <span className='decision-node__owner'>
                  {metadata.owner.slice(0, 2).toUpperCase()}
                </span>
              </Tooltip>
            )}
          </div>
        )}
      </div>
    );
  },
);

DecisionNodeHeader.displayName = 'DecisionNodeHeader';

export default DecisionNodeHeader;
