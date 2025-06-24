/**
 * @file DecisionNodeOptions.jsx
 * @description Componente para opciones avanzadas del nodo de decisión
 */

import {
  Settings,
  ChevronDown,
  ChevronUp,
  PenTool,
  Zap,
  Code,
  Layers,
} from 'lucide-react';
import PropTypes from 'prop-types';
import React, { memo, useState, useCallback } from 'react';

import Tooltip from '../../../ui/ToolTip';

/**
 * Componente para opciones avanzadas del nodo de decisión
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.isUltraPerformanceMode - Indica si está en modo ultra rendimiento
 * @param {Function} props.onToggleMarkdown - Función para alternar markdown
 * @param {boolean} props.enableMarkdown - Indica si el markdown está habilitado
 * @param {Function} props.onToggleVariables - Función para alternar variables
 * @param {boolean} props.enableVariables - Indica si las variables están habilitadas
 * @param {Function} props.onToggleLogic - Función para alternar lógica avanzada
 * @param {boolean} props.enableLogic - Indica si la lógica avanzada está habilitada
 * @param {Function} props.onToggleAnimation - Función para alternar animaciones
 * @param {boolean} props.enableAnimation - Indica si las animaciones están habilitadas
 * @returns {JSX.Element} - Componente de opciones avanzadas
 */
const DecisionNodeOptions = memo(({
  isUltraPerformanceMode,
  onToggleMarkdown,
  enableMarkdown = false,
  onToggleVariables,
  enableVariables = false,
  onToggleLogic,
  enableLogic = false,
  // onToggleAnimation y enableAnimation eliminados
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Alternar expansión del panel de opciones
  const toggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  // Si está en modo ultra rendimiento, mostrar opciones reducidas
  if (isUltraPerformanceMode) {
    return (
      <div className="decision-node__options decision-node__options--ultra">
        <Tooltip content="Opciones avanzadas deshabilitadas en modo ultra rendimiento" position="top">
          <button
            className="decision-node__options-button decision-node__options-button--disabled"
            aria-label="Opciones avanzadas (deshabilitadas en modo ultra rendimiento)"
            disabled
          >
            <Settings size={14} />
          </button>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className={`decision-node__options ${isExpanded ? 'decision-node__options--expanded' : ''}`}>
      <div className="decision-node__options-header">
        <Tooltip content={isExpanded ? 'Ocultar opciones' : 'Mostrar opciones avanzadas'} position="top">
          <button
            onClick={toggleExpand}
            className="decision-node__options-toggle"
            aria-label={isExpanded ? 'Ocultar opciones avanzadas' : 'Mostrar opciones avanzadas'}
            aria-expanded={isExpanded}
          >
            <Settings size={14} />
            <span className="decision-node__options-title">Opciones</span>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </Tooltip>
      </div>

      {isExpanded && (
        <div className="decision-node__options-content">
          <div className="decision-node__option-group">
            <Tooltip content={enableMarkdown ? 'Desactivar formato Markdown' : 'Activar formato Markdown. Usa `**negrita**`, `*cursiva*`, etc. (visible fuera de edición).'} position="right">
              <button
                onClick={onToggleMarkdown}
                className={`decision-node__option-button ${enableMarkdown ? 'decision-node__option-button--active' : ''}`}
                aria-label={enableMarkdown ? 'Desactivar Markdown' : 'Activar Markdown'}
                aria-pressed={enableMarkdown}
              >
                <PenTool size={14} />
                <span>Markdown</span>
              </button>
            </Tooltip>

            <Tooltip content={enableVariables ? 'Desactivar uso de variables' : 'Activar uso de variables (ej: `{{nombre_cliente}}`). Se reemplazan en ejecución.'} position="right">
              <button
                onClick={onToggleVariables}
                className={`decision-node__option-button ${enableVariables ? 'decision-node__option-button--active' : ''}`}
                aria-label={enableVariables ? 'Desactivar variables' : 'Activar variables'}
                aria-pressed={enableVariables}
              >
                <Code size={14} />
                <span>Variables</span>
              </button>
            </Tooltip>

            <Tooltip content={enableLogic ? 'Desactivar lógica de condiciones avanzada' : 'Activar lógica de condiciones avanzada (expresiones complejas, scripts). Funcionalidad futura o requiere config. adicional.'} position="right">
              <button
                onClick={onToggleLogic}
                className={`decision-node__option-button ${enableLogic ? 'decision-node__option-button--active' : ''}`}
                aria-label={enableLogic ? 'Desactivar lógica avanzada' : 'Activar lógica avanzada'}
                aria-pressed={enableLogic}
              >
                <Layers size={14} />
                <span>Lógica avanzada</span>
              </button>
            </Tooltip>

          </div>
        </div>
      )}
    </div>
  );
});

DecisionNodeOptions.displayName = 'DecisionNodeOptions';

DecisionNodeOptions.propTypes = {
  isUltraPerformanceMode: PropTypes.bool,
  onToggleMarkdown: PropTypes.func.isRequired,
  enableMarkdown: PropTypes.bool,
  onToggleVariables: PropTypes.func.isRequired,
  enableVariables: PropTypes.bool,
  onToggleLogic: PropTypes.func.isRequired,
  enableLogic: PropTypes.bool,
  // onToggleAnimation y enableAnimation eliminados de propTypes
};

export default DecisionNodeOptions;
