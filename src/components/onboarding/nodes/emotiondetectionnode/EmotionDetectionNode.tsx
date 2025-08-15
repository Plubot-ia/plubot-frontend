/**
 * EmotionDetectionNode.tsx
 *
 * Componente de React para el nodo de detección de emociones.
 * Renderiza la interfaz del nodo y conecta la lógica del hook `useEmotionDetectionNode`.
 */

import { clsx } from 'clsx';
import { Brain } from 'lucide-react';
import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

import type { EmotionDetectionNodeProperties } from './types';
import { useEmotionDetectionNode, EMOTIONS } from './useEmotionDetectionNode';
import './EmotionDetectionNode.css';

// Mapa de emojis para cada emoción
const EMOTION_EMOJIS: Record<string, string> = {
  happy: '😊',
  angry: '😠',
  sad: '😢',
  neutral: '😐',
  frustrated: '😤',
  surprised: '😲',
};

const EmotionDetectionNode: React.FC<EmotionDetectionNodeProperties> = ({ id, data, selected }) => {
  const { handleOutputVariableChange } = useEmotionDetectionNode(id, data);

  const nodeClasses = clsx('emotion-node', {
    'emotion-node--normal-mode': !data.ultraMode,
    'emotion-node--ultra-performance': data.ultraMode,
    selected: selected,
  });

  // Determina el color del nodo según la emoción detectada
  const getEmotionColor = () => {
    if (!data.detectedEmotion) return '';
    switch (data.detectedEmotion) {
      case 'happy': {
        return '#4ade80';
      }
      case 'angry': {
        return '#f87171';
      }
      case 'sad': {
        return '#60a5fa';
      }
      case 'neutral': {
        return '#9ca3af';
      }
      case 'frustrated': {
        return '#f59e0b';
      }
      case 'surprised': {
        return '#fbbf24';
      }
      default: {
        return '';
      }
    }
  };

  // Aplica un estilo dinámico al icono o borde según la emoción
  const emotionStyle = data.detectedEmotion
    ? {
        borderColor: getEmotionColor(),
        boxShadow: `0 10px 20px rgba(0, 0, 0, 0.3), 0 0 15px ${getEmotionColor()}50`,
      }
    : {};

  return (
    <div className='emotion-node-wrapper'>
      <Handle
        type='target'
        position={Position.Top}
        id='input-text'
        className='emotion-handle-target'
        isConnectable
      />

      <div className={nodeClasses} style={emotionStyle}>
        <div className='emotion-node__content'>
          <div className='emotion-node__header'>
            <h3>
              <Brain size={16} /> Detección de Emoción
            </h3>
          </div>

          <div className='emotion-node__body'>
            <div className='form-group'>
              <label htmlFor={`output-var-${id}`}>Guardar emoción en variable</label>
              <input
                id={`output-var-${id}`}
                type='text'
                value={data.outputVariable ?? ''}
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
                <span className='emotion-label'>
                  {data.detectedEmotion} {EMOTION_EMOJIS[data.detectedEmotion]}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {EMOTIONS.map((emotion, index) => (
        <Handle
          key={emotion}
          type='source'
          position={Position.Bottom}
          id={`emotion-${emotion}`}
          className='emotion-handle-source'
          style={{ left: `${(index + 1) * (100 / (EMOTIONS.length + 1))}%` }}
          isConnectable
        >
          {/* eslint-disable-next-line security/detect-object-injection */}
          <span className='emotion-handle-icon'>{EMOTION_EMOJIS[emotion]}</span>
        </Handle>
      ))}
    </div>
  );
};

const arePropertiesEqual = (
  previousProperties: EmotionDetectionNodeProperties,
  nextProperties: EmotionDetectionNodeProperties,
) => {
  // Re-render if selection changes
  if (previousProperties.selected !== nextProperties.selected) {
    return false;
  }

  // Compare relevant data properties
  const previousData = previousProperties.data;
  const nextData = nextProperties.data;

  return (
    previousData.ultraMode === nextData.ultraMode &&
    previousData.detectedEmotion === nextData.detectedEmotion &&
    previousData.outputVariable === nextData.outputVariable &&
    previousData.inputText === nextData.inputText
  );
};

export default memo(EmotionDetectionNode, arePropertiesEqual);
