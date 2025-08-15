import { Info as InfoIcon } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  ChevronDown,
  ChevronUp,
  Play,
  Zap,
  Loader,
  AlertTriangle,
  FileText,
  MessageSquare,
} from 'lucide-react';
import React, { memo, useEffect, useRef, useState, lazy, Suspense } from 'react';
import type { NodeProps } from 'reactflow';
import { Handle, Position } from 'reactflow';

import type { AiNodeProData } from './types';
import { useAiNodePro } from './useAiNodePro';
import './AiNodePro.css';

const Tooltip = lazy(async () => import('../../ui/ToolTip'));

interface OptimizedSliderProperties {
  id: string;
  label: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange?: (value: number) => void;
  onCommit: (value: number) => void;
  className?: string;
  ariaLabel: string;
}

// Componente de slider optimizado para evitar el bug de "atasco"
const OptimizedSlider: React.FC<OptimizedSliderProperties> = ({
  id,
  label,
  value,
  min,
  max,
  step,
  onChange,
  onCommit,
  className,
  ariaLabel,
}) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number.parseFloat(e.target.value);
    setLocalValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  const handleMouseUp = () => {
    if (onCommit) {
      onCommit(localValue);
    }
  };

  return (
    <div className='ainodepro-slider-container nodrag'>
      <label htmlFor={id} className='ainodepro-label'>
        {label}
      </label>
      <input
        id={id}
        type='range'
        min={min}
        max={max}
        step={step}
        value={localValue}
        onChange={handleChange}
        onMouseUp={handleMouseUp}
        onTouchEnd={handleMouseUp}
        className={`ainodepro-slider ${className}`}
        aria-label={ariaLabel}
      />
    </div>
  );
};

const AiNodeProComponent: React.FC<NodeProps<AiNodeProData>> = ({ id, data, selected }) => {
  const {
    prompt,
    temperature,
    maxTokens,
    isCollapsed,
    isLoading,
    error,
    lastResponse,
    lastPrompt,
    ultraMode,
    handlePromptChange,
    handleSettingChange,
    handleToggleCollapse,
    handleExecute,
  } = useAiNodePro({ id, data });

  const promptTextareaReference = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height based on content
  useEffect(() => {
    if (promptTextareaReference.current) {
      const textarea = promptTextareaReference.current;
      textarea.style.height = 'auto'; // Reset height to allow shrinking
      textarea.style.height = `${textarea.scrollHeight}px`; // Set to full content height
    }
  }, [prompt]); // Re-run whenever the prompt text changes

  const getTemperatureLabel = (value: number) => {
    if (value <= 0.4) return '🔬 Racional';
    if (value <= 0.8) return '🎯 Equilibrado';
    return '🎨 Creativo';
  };

  const getSizeLabel = (value: number) => {
    if (value <= 150) return '📝 Breve';
    if (value <= 400) return '📄 Medio';
    return '📚 Largo';
  };

  const nodeClasses = `
    ai-node-pro
    ${selected ? 'selected' : ''}
    ${isCollapsed ? 'collapsed' : 'expanded'}
    ${ultraMode ? 'ultra-mode' : 'normal-mode'}
  `;

  return (
    <div className={nodeClasses}>
      <Handle
        type='target'
        position={Position.Left}
        id='input'
        className='node-handle ainodepro-handle'
      />

      <div
        className='ainodepro-header'
        onClick={handleToggleCollapse}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleToggleCollapse();
          }
        }}
        role='button'
        tabIndex={0}
      >
        <div className='ainodepro-header-title'>
          <Brain className='ainodepro-icon' size={16} />
          <h3>{data.label || 'AI Pro'}</h3>
        </div>
        <div className='ainodepro-header-controls'>
          {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </div>
      </div>

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            className='ainodepro-content'
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: ultraMode ? 0 : 0.2, ease: 'easeInOut' }}
          >
            <Suspense fallback={null}>
              <div className='ainodepro-section'>
                <label htmlFor={`prompt-${id}`} className='ainodepro-label'>
                  <MessageSquare size={14} />
                  <span>Prompt Principal</span>
                  <Tooltip
                    content='Escribe la instrucción para la IA. Puedes usar variables como {{variable}}.'
                    position='top'
                  >
                    <InfoIcon
                      style={{
                        fontSize: '16px',
                        marginLeft: '4px',
                        cursor: 'help',
                      }}
                    />
                  </Tooltip>
                </label>
                <div className='nodrag'>
                  <textarea
                    ref={promptTextareaReference}
                    className='ainodepro-textarea'
                    value={prompt}
                    onChange={(e) => handlePromptChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        void handleExecute();
                      }
                    }}
                    placeholder='Escribe la instrucción para la IA...'
                    rows={1}
                    aria-label='Prompt principal para la IA'
                  />
                </div>
              </div>

              <div className='ainodepro-section ainodepro-sliders'>
                <OptimizedSlider
                  id={`temp-${id}`}
                  label={
                    <>
                      <span>{getTemperatureLabel(temperature)}</span>
                      <Tooltip
                        content="Controla la creatividad. 'Racional' para respuestas predecibles, 'Creativo' para resultados inesperados."
                        position='top'
                      >
                        <InfoIcon
                          style={{
                            fontSize: '14px',
                            marginLeft: '4px',
                            cursor: 'help',
                          }}
                        />
                      </Tooltip>
                    </>
                  }
                  value={temperature}
                  min={0.2}
                  max={1}
                  step={0.01}
                  onCommit={(value) => {
                    // eslint-disable-next-line @typescript-eslint/no-meaningless-void-operator
                    void handleSettingChange('temperature', value);
                  }}
                  className='creativity'
                  ariaLabel={`Control de creatividad: ${getTemperatureLabel(temperature)}`}
                />
                <OptimizedSlider
                  id={`size-${id}`}
                  label={
                    <>
                      <span>{getSizeLabel(maxTokens)}</span>
                      <Tooltip
                        content='Define el tamaño máximo de la respuesta generada por la IA.'
                        position='top'
                      >
                        <InfoIcon
                          style={{
                            fontSize: '14px',
                            marginLeft: '4px',
                            cursor: 'help',
                          }}
                        />
                      </Tooltip>
                    </>
                  }
                  value={maxTokens}
                  min={50}
                  max={500}
                  step={10}
                  onCommit={(value) => {
                    handleSettingChange('maxTokens', value);
                  }}
                  className='size'
                  ariaLabel={`Control de tamaño de respuesta: ${getSizeLabel(maxTokens)}`}
                />
              </div>
            </Suspense>

            <div className='ainodepro-footer'>
              <button
                onClick={() => {
                  void handleExecute();
                }}
                className='ainodepro-execute-btn'
                disabled={isLoading}
              >
                {isLoading ? <Loader size={16} className='spin' /> : <Play size={16} />}
                <span>{isLoading ? 'Generando...' : 'Ejecutar'}</span>
              </button>
            </div>

            {error && (
              <div className='ainodepro-status error'>
                <AlertTriangle size={14} />
                <span>{error}</span>
              </div>
            )}

            {lastResponse && !isLoading && (
              <div className='ainodepro-status success'>
                <Zap size={14} />
                <p>
                  Última respuesta: <span>{lastResponse}</span>
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {isCollapsed && lastPrompt && (
        <div className='ainodepro-collapsed-summary'>
          <FileText size={12} />
          <p>{lastPrompt}</p>
        </div>
      )}

      <Handle
        type='source'
        position={Position.Right}
        id='output'
        className='node-handle ainodepro-handle'
      />
    </div>
  );
};

const arePropertiesEqual = (
  previousProperties: NodeProps<AiNodeProData>,
  nextProperties: NodeProps<AiNodeProData>,
) => {
  const prevData = previousProperties.data;
  const nextData = nextProperties.data;

  const dataIsEqual =
    Object.keys(prevData).length === Object.keys(nextData).length &&
    (Object.keys(prevData) as (keyof AiNodeProData)[]).every(
      // eslint-disable-next-line security/detect-object-injection
      (key) => prevData[key] === nextData[key],
    );

  return previousProperties.selected === nextProperties.selected && dataIsEqual;
};

export default memo(AiNodeProComponent, arePropertiesEqual);
