/**
 * @file DecisionNodeOptions.tsx
 * @description Componente para opciones avanzadas del nodo de decisión
 */

import { Settings, ChevronDown, ChevronUp, PenTool, Code, Layers } from 'lucide-react';
import React, { memo, useState, useCallback } from 'react';

import Tooltip from '../../../ui/ToolTip';

// Interfaces
interface DecisionNodeOptionsProps {
  isUltraPerformanceMode?: boolean;
  onToggleMarkdown: () => void;
  enableMarkdown?: boolean;
  onToggleVariables: () => void;
  enableVariables?: boolean;
  onToggleLogic: () => void;
  enableLogic?: boolean;
}

interface OptionsContentProps {
  enableMarkdown: boolean;
  onToggleMarkdown: () => void;
  enableVariables: boolean;
  onToggleVariables: () => void;
  enableLogic: boolean;
  onToggleLogic: () => void;
}

// Helper para renderizar modo ultra rendimiento
const renderUltraPerformanceMode = (): React.JSX.Element => (
  <div className='decision-node__options decision-node__options--ultra'>
    <Tooltip content='Opciones avanzadas deshabilitadas en modo ultra rendimiento' position='top'>
      <button
        className='decision-node__options-button decision-node__options-button--disabled'
        aria-label='Opciones avanzadas (deshabilitadas en modo ultra rendimiento)'
        disabled
      >
        <Settings size={14} />
      </button>
    </Tooltip>
  </div>
);

// Helper para renderizar header de opciones
const renderOptionsHeader = (isExpanded: boolean, toggleExpand: () => void): React.JSX.Element => (
  <div className='decision-node__options-header'>
    <Tooltip
      content={isExpanded ? 'Ocultar opciones' : 'Mostrar opciones avanzadas'}
      position='top'
    >
      <button
        onClick={toggleExpand}
        className='decision-node__options-toggle'
        aria-label={isExpanded ? 'Ocultar opciones avanzadas' : 'Mostrar opciones avanzadas'}
        aria-expanded={isExpanded}
      >
        <Settings size={14} />
        <span className='decision-node__options-title'>Opciones</span>
        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
    </Tooltip>
  </div>
);

// Helper para renderizar contenido de opciones
const renderOptionsContent = ({
  enableMarkdown,
  onToggleMarkdown,
  enableVariables,
  onToggleVariables,
  enableLogic,
  onToggleLogic,
}: OptionsContentProps): React.JSX.Element => (
  <div className='decision-node__options-content'>
    <div className='decision-node__option-group'>
      <Tooltip
        content={
          enableMarkdown
            ? 'Desactivar formato Markdown'
            : 'Activar formato Markdown. Usa `**negrita**`, `*cursiva*`, etc. (visible fuera de edición).'
        }
        position='right'
      >
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

      <Tooltip
        content={
          enableVariables
            ? 'Desactivar uso de variables'
            : 'Activar uso de variables (ej: `{{nombre_cliente}}`). Se reemplazan en ejecución.'
        }
        position='right'
      >
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

      <Tooltip
        content={
          enableLogic
            ? 'Desactivar lógica de condiciones avanzada'
            : 'Activar lógica de condiciones avanzada (expresiones complejas, scripts). Funcionalidad futura o requiere config. adicional.'
        }
        position='right'
      >
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
);

/**
 * Componente para opciones avanzadas del nodo de decisión
 */
const DecisionNodeOptions = memo<DecisionNodeOptionsProps>(
  ({
    isUltraPerformanceMode = false,
    onToggleMarkdown,
    enableMarkdown = false,
    onToggleVariables,
    enableVariables = false,
    onToggleLogic,
    enableLogic = false,
  }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Alternar expansión del panel de opciones
    const toggleExpand = useCallback(() => {
      setIsExpanded((previous) => !previous);
    }, []);

    // Si está en modo ultra rendimiento, mostrar opciones reducidas
    if (isUltraPerformanceMode) {
      return renderUltraPerformanceMode();
    }

    return (
      <div
        className={`decision-node__options ${isExpanded ? 'decision-node__options--expanded' : ''}`}
      >
        {renderOptionsHeader(isExpanded, toggleExpand)}
        {isExpanded &&
          renderOptionsContent({
            enableMarkdown,
            onToggleMarkdown,
            enableVariables,
            onToggleVariables,
            enableLogic,
            onToggleLogic,
          })}
      </div>
    );
  },
);

DecisionNodeOptions.displayName = 'DecisionNodeOptions';

export default DecisionNodeOptions;
