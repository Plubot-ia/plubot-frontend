// src/components/onboarding/nodes/ainode/AiNode.tsx
import React, { useState, useCallback, useEffect, useRef, memo, lazy, Suspense } from 'react';
import { Handle, Position, NodeProps, useUpdateNodeInternals } from 'reactflow';
import { Cog, Brain, Terminal, Zap, ChevronDown, ChevronUp, Eye, Play } from 'lucide-react';
import { Info as InfoIcon } from '@mui/icons-material';
import { AiNodeData } from './types';
import './AiNode.css';

const Tooltip = lazy(() => import('../../ui/ToolTip'));
import { useAINode } from './useAINode';

const AiNodeComponent: React.FC<NodeProps<AiNodeData>> = ({ id, data, selected, isConnectable }) => {

  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);
  const {
    promptTemplate,
    temperature,
    maxTokens,
    systemMessage,
    responseVariable,
    // streaming, // Descomentar si se usa
    ultraMode,
    isLoading,
    error,
    lastResponse,
    interpolatedPromptPreview,
    handlePromptChange,
    handleSettingChange,
    handleExecute,
    isCollapsed,
    handleToggleCollapse: hookHandleToggleCollapse, // Renombrar para evitar conflicto con la función local si existiera
  } = useAINode({ id, data });

  // Auto-resize for prompt textarea
  useEffect(() => {
    if (promptTextareaRef.current) {
      promptTextareaRef.current.style.height = 'auto';
      promptTextareaRef.current.style.height = `${promptTextareaRef.current.scrollHeight}px`;
    }
  }, [promptTemplate]);

  const [isSettingsExpanded, setIsSettingsExpanded] = useState(true);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);

  const updateNodeInternals = useUpdateNodeInternals();

  useEffect(() => {
    updateNodeInternals(id);
  }, [ultraMode, id, updateNodeInternals]);

  

  // Helper para manejar cambios de input y pasarlos a handleSettingChange
  const onSettingChange = (field: keyof AiNodeData, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target;
    let value: string | number | boolean;
    if (target.type === 'number') {
      value = parseFloat(target.value); 
    } else if (target.type === 'checkbox') {
      value = (target as HTMLInputElement).checked;
    } else { // Incluye text, textarea, select
      value = target.value;
    }
    handleSettingChange(field, value);
  };
  
  const currentLabel = data.label || 'Nodo IA';

  return (
    <div className={`ai-node ${isCollapsed ? 'collapsed' : ''} ${ultraMode ? 'ai-node--ultra-performance' : 'ai-node--normal-mode'} ${selected ? 'selected' : ''}`}>
      <div className="ai-node-header" onClick={hookHandleToggleCollapse}>
        <h3>{data.label || 'Nodo IA'}</h3>
        <button className="collapse-toggle">
          {isCollapsed ? 'Expandir' : 'Contraer'}
        </button>
      </div>
      {!isCollapsed && (
        <Suspense fallback={null}>
        <div className="ai-node-content">
          <div className="ainode-section">
            <h3 className="ainode-section-title"><Terminal size={16} /> Prompt Principal
              <Tooltip content="Escribe la instrucción principal para la IA. Puedes incluir datos de nodos anteriores usando {{nombre_variable}} o el último mensaje del usuario con {{mensaje_usuario_anterior}}. Ejemplo: El usuario dijo: {{mensaje_usuario_anterior}}. Resume su pedido." position="top" delay={300}>
                <InfoIcon style={{ fontSize: '16px', marginLeft: '8px', cursor: 'help', verticalAlign: 'middle' }} />
              </Tooltip>
            </h3>
            <textarea
              className="ainode-textarea"
              ref={promptTextareaRef}
              value={promptTemplate}
              onChange={(e) => handlePromptChange(e.target.value)}
              placeholder="Escribe tu prompt aquí. Usa {{variable}} para variables dinámicas."
              rows={4}
            />
          </div>

          {isSettingsExpanded && (
            <div className="ainode-section">
              <h3 className="ainode-section-title"><Cog size={16} /> Parámetros del Modelo</h3>
              <div className="ainode-parameter-grid">
                <div className="ainode-parameter-item">
                  <label htmlFor={`temp-${id}`}>Temperatura
                    <Tooltip content="Controla la creatividad de la IA. Valores más altos (ej: 0.8) generan respuestas más variadas e inesperadas. Valores bajos (ej: 0.2) producen respuestas más enfocadas y predecibles." position="top" delay={300}>
                      <InfoIcon style={{ fontSize: '14px', marginLeft: '4px', cursor: 'help', verticalAlign: 'middle' }} />
                    </Tooltip>
                  </label>
                  <input
                    id={`temp-${id}`}
                    type="number"
                    className="ainode-input"
                    value={temperature}
                    onChange={(e) => onSettingChange('temperature', e)}
                    min="0" max="2" step="0.1"
                  />
                </div>
                <div className="ainode-parameter-item">
                  <label htmlFor={`tokens-${id}`}>Max Tokens
                    <Tooltip content="Define la longitud máxima de la respuesta de la IA. Un 'token' es aproximadamente una palabra o parte de una palabra." position="top" delay={300}>
                      <InfoIcon style={{ fontSize: '14px', marginLeft: '4px', cursor: 'help', verticalAlign: 'middle' }} />
                    </Tooltip>
                  </label>
                  <input
                    id={`tokens-${id}`}
                    type="number"
                    className="ainode-input"
                    value={maxTokens}
                    onChange={(e) => onSettingChange('maxTokens', e)}
                    min="1" step="1"
                  />
                </div>
              </div>
              <div className="ainode-parameter-item" style={{ marginTop: '10px' }}>
                <label htmlFor={`system-${id}`}>Mensaje de Sistema (Opcional)
                  <Tooltip content="Instrucción general o rol para la IA (ej: 'Actúa como un experto en historia'). La IA considerará este mensaje junto con el prompt principal. Es opcional." position="top" delay={300}>
                    <InfoIcon style={{ fontSize: '14px', marginLeft: '4px', cursor: 'help', verticalAlign: 'middle' }} />
                  </Tooltip>
                </label>
                <textarea
                  id={`system-${id}`}
                  className="ainode-textarea"
                  value={systemMessage || ''}
                  onChange={(e) => onSettingChange('systemMessage', e)}
                  placeholder="Ej: Eres un asistente experto en marketing..."
                  rows={2}
                />
              </div>
            </div>
          )}
          
          <div className="ainode-section">
            <h3 className="ainode-section-title"><Zap size={16} /> Variable de Salida
              <Tooltip content="Aquí se guardará la respuesta de la IA. Podrás usar esta respuesta en nodos posteriores escribiendo {{nombre_de_esta_variable}} (ej: {{ai_response}}) en sus prompts o campos." position="top" delay={300}>
                <InfoIcon style={{ fontSize: '16px', marginLeft: '8px', cursor: 'help', verticalAlign: 'middle' }} />
              </Tooltip>
            </h3>
            <input
              type="text"
              className="ainode-input"
              value={responseVariable}
              onChange={(e) => onSettingChange('responseVariable', e)}
              placeholder="Ej: respuestaIA, contenidoGenerado"
            />
          </div>

          <div className="ainode-section">
            <h3 className="ainode-section-title" style={{ cursor: 'pointer' }} onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}>
              <Eye size={16} /> Vista Previa del Prompt Interpolado {isPreviewExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
            </h3>
            {isPreviewExpanded && (
              <div className="ainode-response-preview">
                {interpolatedPromptPreview || 'La vista previa aparecerá aquí cuando se interpelen las variables.'}
              </div>
            )}
          </div>
          
          <button className="ainode-button" onClick={handleExecute} disabled={isLoading}>
            <Play size={16} style={{ marginRight: '8px' }} />
            {isLoading ? 'Procesando...' : 'Probar Ahora'}
          </button>

          {isLoading && <div className="ainode-status-indicator ainode-status-loading">Procesando IA...</div>}
          {error && <div className="ainode-status-indicator ainode-status-error">{error}</div>}
          {lastResponse && !isLoading && !error && (
            <div className="ainode-status-indicator ainode-status-success">
              Respuesta recibida:
              <div className="ainode-response-preview" style={{ maxHeight: '60px', marginTop: '5px', background: 'rgba(255,255,255,0.05)' }}>
                {lastResponse}
              </div>
            </div>
          )}
        </div>
        </Suspense>
      )}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="node-handle ai-node__handle"
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="node-handle ai-node__handle"
        isConnectable={isConnectable}
      />
    </div>
  );
};

const arePropsEqual = (prevProps: NodeProps<AiNodeData>, nextProps: NodeProps<AiNodeData>) => {
  // Comparación superficial de las propiedades de 'data' que afectan la UI.
  const dataChanged = Object.keys(prevProps.data).length !== Object.keys(nextProps.data).length ||
    Object.keys(prevProps.data).some(key => 
      prevProps.data[key as keyof AiNodeData] !== nextProps.data[key as keyof AiNodeData]
    );

  // Re-renderizar solo si 'selected' o los datos relevantes han cambiado.
  return prevProps.selected === nextProps.selected && !dataChanged;
};

const AiNode = memo(AiNodeComponent, arePropsEqual);

AiNode.displayName = 'AiNode';

export default AiNode;
