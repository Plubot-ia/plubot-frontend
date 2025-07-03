/**
 * EmotionDetectionNode.tsx
 *
 * Componente de React para el nodo de detección de emociones.
 * Renderiza la interfaz del nodo y conecta la lógica del hook `useEmotionDetectionNode`.
 */

import clsx from 'clsx';
import { Brain } from 'lucide-react';
import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

import type { EmotionDetectionNodeProps as EmotionDetectionNodeProperties } from './types';
import { useEmotionDetectionNode, EMOTIONS } from './useEmotionDetectionNode';
import './EmotionDetectionNode.css';

const EmotionDetectionNode: React.FC<EmotionDetectionNodeProperties> = ({
  id,
  data,
  selected,
}) => {
  const { handleOutputVariableChange } = useEmotionDetectionNode(id, data);

  const nodeClasses = clsx('emotion-node', {
    'emotion-node--normal-mode': !data.ultraMode,
    'emotion-node--ultra-performance': data.ultraMode,
    selected: selected,
  });

  return (
    <div className={nodeClasses}>
      <div className='emotion-node__content'>
        <Handle
          type='target'
          position={Position.Left}
          id='input-text'
          isConnectable
        />

        <div className='emotion-node__header'>
          <h3>
            <Brain size={16} /> Detección de Emoción
          </h3>
        </div>

        <div className='emotion-node__body'>
          <div className='form-group'>
            <label htmlFor={`output-var-${id}`}>
              Guardar emoción en variable
            </label>
            <input
              id={`output-var-${id}`}
              type='text'
              value={data.outputVariable || ''}
              onChange={handleOutputVariableChange}
              placeholder='Ej: emocion_detectada'
            />
          </div>

          {data.inputText && (
            <div className='emotion-node__preview'>
              Texto a analizar: <strong>{data.inputText}</strong>
            </div>
          )}

          {data.detectedEmotion && (
            <div className='emotion-node__preview'>
              Emoción detectada:{' '}
              <span className='emotion-label'>{data.detectedEmotion}</span>
            </div>
          )}
        </div>

        {EMOTIONS.map((emotion, index) => (
          <Handle
            key={emotion}
            type='source'
            position={Position.Right}
            id={`emotion-${emotion}`}
            style={{ top: `${(index + 1) * (100 / (EMOTIONS.length + 1))}%` }}
            isConnectable
          />
        ))}
      </div>
    </div>
  );
};

export default memo(EmotionDetectionNode);
