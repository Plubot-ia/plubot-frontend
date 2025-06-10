/**
 * useEmotionDetectionNode.ts
 * 
 * Hook personalizado para encapsular la lógica del EmotionDetectionNode.
 * Maneja las llamadas a la API, la actualización de datos y el estado interno.
 */

import { useCallback, useState } from 'react';
import useFlowStore from '@/stores/useFlowStore';

import { EmotionDetectionNodeData } from './types';

// Lista de emociones que el nodo puede detectar y para las que creará salidas
export const EMOTIONS = ['happy', 'angry', 'sad', 'neutral', 'frustrated', 'surprised'];

// Tipo para la emoción detectada
export type Emotion = typeof EMOTIONS[number];

// Interfaz para el resultado del análisis de emociones
export interface EmotionAnalysis {
  emotion: Emotion;
  scores: Record<Emotion, number>;
}

// Simulación de una API de detección de emociones
const fakeEmotionAPI = (text: string): Promise<EmotionAnalysis> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const emotions = EMOTIONS as Emotion[];
      let detectedEmotion: Emotion = 'neutral';

      // Lógica de detección simple basada en palabras clave para la simulación
      if (text.toLowerCase().includes('feliz') || text.toLowerCase().includes('bien') || text.toLowerCase().includes('genial')) detectedEmotion = 'happy';
      else if (text.toLowerCase().includes('mal') || text.toLowerCase().includes('triste') || text.toLowerCase().includes('deprimido')) detectedEmotion = 'sad';
      else if (text.toLowerCase().includes('enojo') || text.toLowerCase().includes('rabia') || text.toLowerCase().includes('molesto')) detectedEmotion = 'angry';
      else if (text.toLowerCase().includes('sorpresa') || text.toLowerCase().includes('increíble') || text.toLowerCase().includes('asombro')) detectedEmotion = 'surprised';
      else if (text.toLowerCase().includes('frustrado') || text.toLowerCase().includes('harto') || text.toLowerCase().includes('cansado')) detectedEmotion = 'frustrated';

      // Generamos scores aleatorios, dando un puntaje más alto a la emoción detectada
      const scores = emotions.reduce((acc, emotion) => {
        acc[emotion] = Math.random() * 0.4;
        return acc;
      }, {} as Record<Emotion, number>);

      scores[detectedEmotion] = 0.8 + Math.random() * 0.2; // Puntaje más alto para la emoción detectada

      resolve({ emotion: detectedEmotion, scores });
    }, 1000); // Simulamos una demora de red
  });
};

export const useEmotionDetectionNode = (id: string, data: EmotionDetectionNodeData) => {
  const { updateNodeData } = useFlowStore(state => ({ updateNodeData: state.updateNodeData }));
  const [isLoading, setIsLoading] = useState(false);

  // Función para manejar cambios en el campo de la variable de salida
  const handleOutputVariableChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    updateNodeData(id, { outputVariable: event.target.value });
  }, [id, updateNodeData]);

  // Función para ejecutar la detección de emociones
  const runEmotionDetection = useCallback(async (text: string) => {
    setIsLoading(true);
    try {
      const result = await fakeEmotionAPI(text);
      // Actualizamos los datos del nodo con la emoción detectada
      updateNodeData(id, {
        detectedEmotion: result.emotion,
        inputText: text
      });
      console.log('Emoción detectada:', result.emotion, 'Scores:', result.scores);
      return result.emotion; // Retornamos la emoción para que el sistema de flujo pueda ramificar
    } catch (e) {
      console.error('Error al detectar emoción:', e);
      updateNodeData(id, { detectedEmotion: 'neutral' });
      return 'neutral';
    } finally {
      setIsLoading(false);
    }
  }, [id, updateNodeData]);

  return {
    handleOutputVariableChange,
    runEmotionDetection,
    isLoading
  };
};
