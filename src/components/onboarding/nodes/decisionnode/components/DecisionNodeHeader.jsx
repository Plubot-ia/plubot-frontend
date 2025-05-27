/**
 * @file DecisionNodeHeader.jsx
 * @description Componente de cabecera para el nodo de decisión
 */

import React, { memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import { 
  GitBranch, 
  HelpCircle,
  ArrowUpDown,
  ExternalLink
} from 'lucide-react';
import Tooltip from '../../../ui/ToolTip';
import { NODE_CONFIG } from '../DecisionNode.types';

/**
 * Componente para el ícono del nodo de decisión
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.isUltraPerformanceMode - Indica si está en modo ultra rendimiento
 * @param {string} props.type - Tipo de ícono a mostrar (opcional)
 * @returns {JSX.Element} - Ícono del nodo de decisión
 */
export const DecisionNodeIcon = memo(({ isUltraPerformanceMode = false, type = 'default' }) => {
  // Tamaño y grosor optimizados para legibilidad y rendimiento
  const iconProps = useMemo(() => ({ 
    size: isUltraPerformanceMode ? 16 : 18, 
    strokeWidth: isUltraPerformanceMode ? 2 : 1.75,
    className: isUltraPerformanceMode ? '' : 'decision-node__icon-svg'
  }), [isUltraPerformanceMode]);
  
  // Seleccionar el ícono adecuado según el tipo
  const renderIcon = () => {
    switch (type) {
      case 'question':
        return <HelpCircle {...iconProps} aria-hidden="true" />;
      case 'condition':
        return <ArrowUpDown {...iconProps} aria-hidden="true" />;
      case 'flow':
        return <ExternalLink {...iconProps} aria-hidden="true" />;
      case 'default':
      default:
        return <GitBranch {...iconProps} aria-hidden="true" />;
    }
  };
  
  return (
    <div 
      className={`decision-node__icon ${isUltraPerformanceMode ? 'decision-node__icon--ultra' : ''}`}
      role="img"
      aria-label={NODE_CONFIG.ARIA_LABELS.node}
    >
      {renderIcon()}
    </div>
  );
});

DecisionNodeIcon.displayName = 'DecisionNodeIcon';

DecisionNodeIcon.propTypes = {
  isUltraPerformanceMode: PropTypes.bool,
  type: PropTypes.oneOf(['default', 'question', 'condition', 'flow'])
};

// Eliminamos defaultProps y usamos parámetros por defecto en la definición de la función arriba

/**
 * Componente de cabecera para el nodo de decisión
 * @param {Object} props - Propiedades del componente
 * @param {string} props.title - Título del nodo
 * @param {string} props.iconType - Tipo de ícono
 * @param {boolean} props.isUltraPerformanceMode - Indica si está en modo ultra rendimiento
 * @param {boolean} props.isCollapsed - Indica si el nodo está colapsado
 * @param {Function} props.onToggleCollapse - Función para alternar el colapso
 * @param {Object} props.metadata - Metadatos adicionales
 * @returns {JSX.Element} - Cabecera del nodo de decisión
 */
const DecisionNodeHeader = memo(({ 
  title, 
  iconType = 'default', 
  isUltraPerformanceMode, 
  isCollapsed, 
  onToggleCollapse,
  metadata
}) => {
  return (
    <div 
      className="decision-node__header"
      role="heading"
      aria-level={3}
    >
      <div className="decision-node__title">
        <DecisionNodeIcon 
          type={iconType} 
          isUltraPerformanceMode={isUltraPerformanceMode} 
        />
        <span className="decision-node__title-text">{title}</span>
      </div>
      
      {!isUltraPerformanceMode && metadata && (
        <div className="decision-node__metadata">
          {metadata.date && (
            <Tooltip content={`Última actualización: ${metadata.date}`} position="top">
              <span className="decision-node__date">{metadata.date}</span>
            </Tooltip>
          )}
          {metadata.owner && (
            <Tooltip content={`Propietario: ${metadata.owner}`} position="top">
              <span className="decision-node__owner">
                {metadata.owner.substring(0, 2).toUpperCase()}
              </span>
            </Tooltip>
          )}
        </div>
      )}
    </div>
  );
});

DecisionNodeHeader.displayName = 'DecisionNodeHeader';

DecisionNodeHeader.propTypes = {
  title: PropTypes.string.isRequired,
  iconType: PropTypes.string,
  isUltraPerformanceMode: PropTypes.bool,
  isCollapsed: PropTypes.bool,
  onToggleCollapse: PropTypes.func,
  metadata: PropTypes.shape({
    date: PropTypes.string,
    owner: PropTypes.string
  })
};

export default DecisionNodeHeader;
