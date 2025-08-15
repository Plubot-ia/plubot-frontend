/**
 * @file OptionNodeContent.tsx
 * @description Content component for OptionNode with editing capabilities
 * @version 1.0.0
 */

import React, { useMemo, useEffect } from 'react';

import { useRenderTracker } from '@/utils/renderTracker';

import { NODE_CONFIG } from '../constants';
import { validateInstruction } from '../helpers';
import type { OptionNodeContentProps } from '../types';

const OptionNodeContent: React.FC<OptionNodeContentProps> = ({
  isEditing,
  instruction,
  currentInstruction,
  onInstructionChange,
  onStartEditing,
  onFinishEditing,
  onCancelEditing,
  isUltraPerformanceMode = false,
  textareaRef,
}) => {
  useRenderTracker('OptionNodeContent');

  const displayInstruction = useMemo(() => validateInstruction(instruction), [instruction]);

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef?.current) {
      textareaRef.current.focus();
    }
  }, [isEditing, textareaRef]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onInstructionChange(e);
  };

  if (isEditing) {
    return (
      <div className='option-node__content option-node__content--editing'>
        <textarea
          ref={textareaRef}
          value={currentInstruction}
          onChange={handleTextareaChange}
          className='option-node__textarea'
          placeholder={NODE_CONFIG.DEFAULT_INSTRUCTION}
          aria-label='Instrucciones de la opción'
        />
        <div className='option-node__actions'>
          <button
            onClick={onCancelEditing}
            className='option-node__button option-node__button--cancel'
            aria-label='Cancelar edición'
          >
            Cancelar
          </button>
          <button
            onClick={onFinishEditing}
            className='option-node__button option-node__button--save'
            aria-label='Guardar cambios'
          >
            Guardar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className='option-node__content'
      onDoubleClick={!isUltraPerformanceMode ? onStartEditing : undefined}
    >
      <div className='option-node__instruction'>{displayInstruction}</div>
    </div>
  );
};

export default React.memo(OptionNodeContent);
