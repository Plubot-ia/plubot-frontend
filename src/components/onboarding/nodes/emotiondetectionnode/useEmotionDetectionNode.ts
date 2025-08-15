/**
 * useEmotionDetectionNode.ts
 *
 * Hook personalizado para encapsular la lógica del EmotionDetectionNode.
 * Maneja las llamadas a la API, la actualización de datos y el estado interno.
 */

import { useState, useCallback } from 'react';

import useFlowStore from '@/stores/use-flow-store';

// Lista de emociones que el nodo puede detectar y para las que creará salidas
export const EMOTIONS = ['happy', 'angry', 'sad', 'neutral', 'frustrated', 'surprised'];

// Tipo para la emoción detectada
export type Emotion = (typeof EMOTIONS)[number];

// Interfaz para el resultado del análisis de emociones
export interface EmotionAnalysis {
  emotion: Emotion;
  scores: Record<Emotion, number>;
}

// Simulación de una API de detección de emociones
const fakeEmotionAPI = async (text: string): Promise<EmotionAnalysis> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const emotions = EMOTIONS;
      let detectedEmotion: Emotion = 'neutral';

      // Lógica de detección simple basada en palabras clave para la simulación
      if (
        text.toLowerCase().includes('feliz') ||
        text.toLowerCase().includes('bien') ||
        text.toLowerCase().includes('genial')
      )
        detectedEmotion = 'happy';
      else if (
        text.toLowerCase().includes('mal') ||
        text.toLowerCase().includes('triste') ||
        text.toLowerCase().includes('deprimido')
      )
        detectedEmotion = 'sad';
      else if (
        text.toLowerCase().includes('enojo') ||
        text.toLowerCase().includes('rabia') ||
        text.toLowerCase().includes('molesto')
      )
        detectedEmotion = 'angry';
      else if (
        text.toLowerCase().includes('sorpresa') ||
        text.toLowerCase().includes('increíble') ||
        text.toLowerCase().includes('asombro')
      )
        detectedEmotion = 'surprised';
      else if (
        text.toLowerCase().includes('frustrado') ||
        text.toLowerCase().includes('harto') ||
        text.toLowerCase().includes('cansado')
      )
        detectedEmotion = 'frustrated';

      // Sistema determinístico para scores de emociones: más predecible, testeable y reproducible
      const scores = emotions.reduce(
        (accumulator, emotion, index) => {
          // Score determinístico basado en índice de emoción y hash del texto
          const seedFactor = (text.length + index * 17 + emotion.length * 7) % 40; // 0-39 para 0.0-0.39
          // eslint-disable-next-line security/detect-object-injection -- emotion is from predefined enum, safe for object access
          accumulator[emotion] = seedFactor / 100; // 0.0 a 0.39
          return accumulator;
        },
        {} as Record<Emotion, number>,
      );

      // Score determinístico más alto para la emoción detectada
      const detectedSeedFactor = (text.length + detectedEmotion.length * 11) % 20; // 0-19 para 0.0-0.19
      // eslint-disable-next-line security/detect-object-injection -- detectedEmotion is from predefined enum, safe for object access
      scores[detectedEmotion] = 0.8 + detectedSeedFactor / 100; // 0.8 a 0.99

      resolve({ emotion: detectedEmotion, scores });
    }, 1000); // Simulamos una demora de red
  });
};

export interface UseEmotionDetectionNodeReturn {
  isLoading: boolean;
  handleOutputVariableChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  runEmotionDetection: (text: string) => Promise<Emotion>;
}

export const useEmotionDetectionNode = (id: string) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { updateNodeData } = useFlowStore((state) => ({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    updateNodeData: state.updateNodeData,
  }));
  const [isLoading, setIsLoading] = useState(false);

  // Función para manejar cambios en el campo de la variable de salida
  const handleOutputVariableChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      updateNodeData(id, { outputVariable: event.target.value });
    },
    [id, updateNodeData],
  );

  // Función para ejecutar la detección de emociones
  const runEmotionDetection = useCallback(
    async (text: string) => {
      setIsLoading(true);
      try {
        const result = await fakeEmotionAPI(text);
        // Actualizamos los datos del nodo con la emoción detectada
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        updateNodeData(id, {
          detectedEmotion: result.emotion,
          inputText: text,
        });

        return result.emotion; // Retornamos la emoción para que el sistema de flujo pueda ramificar
      } catch {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        updateNodeData(id, { detectedEmotion: 'neutral' });
        return 'neutral';
      } finally {
        setIsLoading(false);
      }
    },
    [id, updateNodeData],
  );

  return {
    handleOutputVariableChange,
    runEmotionDetection,
    isLoading,
  };
};
