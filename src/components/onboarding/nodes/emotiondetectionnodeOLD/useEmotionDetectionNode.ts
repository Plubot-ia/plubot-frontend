/**
 * useEmotionDetectionNode.ts
 *
 * Hook personalizado para encapsular la lógica del EmotionDetectionNode.
 * Maneja las llamadas a la API, la actualización de datos y el estado interno.
 */

import { useCallback } from 'react';

import type { EmotionDetectionNodeData } from './types';

import useFlowStore from '@/stores/useFlowStore';

// Lista de emociones que el nodo puede detectar y para las que creará salidas
export const EMOTIONS = [
  'happy',
  'angry',
  'sad',
  'neutral',
  'frustrated',
  'surprised',
];

export const useEmotionDetectionNode = (
  id: string,
  data: EmotionDetectionNodeData,
) => {
  const { updateNodeData } = useFlowStore((state) => ({
    updateNodeData: state.updateNodeData,
  }));

  // Función para manejar cambios en el campo de la variable de salida
  const handleOutputVariableChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      updateNodeData(id, { outputVariable: event.target.value });
    },
    [id, updateNodeData],
  );

  return {
    handleOutputVariableChange,
  };
};
