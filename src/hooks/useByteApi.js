import { useCallback } from 'react';

import { analyzeSentiment } from '@/utils/sentiment-analyzer';

const determineByteState = (userSentiment, byteSentiment, apiSentiment) => {
  if (userSentiment === 'positive' || byteSentiment === 'positive') {
    return 'happy';
  }
  if (userSentiment === 'negative' && byteSentiment === 'negative') {
    return 'sad';
  }
  if (apiSentiment === 'warning') {
    return 'warning';
  }
  return 'normal';
};

export const useByteApi = ({ addMessage, setIsLoading, setByteState, messages }) => {
  const sendToAI = useCallback(
    async (userMessage) => {
      setIsLoading(true);
      setByteState('thinking');

      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:5000/api';
        const response = await fetch(`${API_BASE_URL}/byte-assistant`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage,
            history: messages.slice(-10),
          }),
        });

        if (!response.ok) {
          throw new Error(`Error al comunicarse con Byte: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        addMessage(data.message, 'byte', 'success');

        const userSentiment = analyzeSentiment(userMessage);
        const byteSentiment = analyzeSentiment(data.message);
        const apiSentiment = data.sentiment ?? 'neutral';

        const newByteState = determineByteState(userSentiment, byteSentiment, apiSentiment);
        setByteState(newByteState);
      } catch (error) {
        addMessage(
          `¡Ups! ${
            error.message ?? 'Parece que hay un cortocircuito en mi sistema. Intenta de nuevo.'
          }`,
          'byte',
          'error',
        );
        setByteState('sad');
      } finally {
        setIsLoading(false);
      }
    },
    [addMessage, messages, setIsLoading, setByteState],
  );

  return { sendToAI };
};
