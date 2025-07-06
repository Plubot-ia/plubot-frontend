import { useState, useEffect, useRef, useCallback } from 'react';

import useFlowStore from '@/stores/use-flow-store';

const POSITIVE_KEYWORDS = [
  'bien',
  'genial',
  'gracias',
  'perfecto',
  'excelente',
  'feliz',
  'listo',
  'bueno',
  'sí',
  'claro',
];
const NEGATIVE_KEYWORDS = [
  'mal',
  'error',
  'problema',
  'no',
  'falla',
  'duda',
  'difícil',
  'complicado',
];

const analyzeSentiment = (text) => {
  const lowerText = text.toLowerCase();
  let positiveScore = 0;
  let negativeScore = 0;

  for (const keyword of POSITIVE_KEYWORDS) {
    if (lowerText.includes(keyword)) positiveScore++;
  }
  for (const keyword of NEGATIVE_KEYWORDS) {
    if (lowerText.includes(keyword)) negativeScore++;
  }

  if (positiveScore > negativeScore) return 'positive';
  if (negativeScore > positiveScore) return 'negative';
  return 'neutral';
};

/**
 * @description Custom hook for managing the state and logic of the ByteAssistant component.
 * @returns {object} The state and methods for the ByteAssistant component.
 */
export const useByteAssistant = () => {
  const isUltraMode = useFlowStore((state) => state.isUltraMode);
  const [messages, setMessages] = useState([
    {
      text: '¡Hola! Soy Byte, tu experto en nodos y flujos. Pregúntame lo que necesites.',
      sender: 'byte',
      type: 'info',
      id: 'initial-byte-message',
    },
  ]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [byteState, setByteState] = useState('normal');
  const messagesEndReference = useRef(null);

  useEffect(() => {
    if (messagesEndReference.current) {
      const container = messagesEndReference.current.parentElement;
      setTimeout(
        () => {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: isUltraMode ? 'auto' : 'smooth',
          });
        },
        isUltraMode ? 10 : 100,
      );
    }
  }, [messages, isUltraMode]);

  const addMessage = useCallback((text, sender, messageType = 'info') => {
    setMessages((previous) => [
      ...previous,
      {
        text,
        sender,
        type: messageType,
        id: Date.now(),
      },
    ]);
  }, []);

  const sendToAI = useCallback(
    async (userMessage) => {
      setIsLoading(true);
      setByteState('thinking');

      try {
        const API_BASE_URL =
          import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';
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
          throw new Error(
            `Error al comunicarse con Byte: ${response.statusText}`,
          );
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        addMessage(data.message, 'byte', 'success');

        const userSentiment = analyzeSentiment(userMessage);
        const byteSentiment = analyzeSentiment(data.message);
        const apiSentiment = data.sentiment || 'neutral';

        if (userSentiment === 'positive' || byteSentiment === 'positive') {
          setByteState('happy');
        } else if (
          userSentiment === 'negative' &&
          byteSentiment === 'negative'
        ) {
          setByteState('sad');
        } else if (apiSentiment === 'warning') {
          setByteState('warning');
        } else {
          setByteState('normal');
        }
      } catch (error) {
        addMessage(
          `¡Ups! ${error.message || 'Parece que hay un cortocircuito en mi sistema. Intenta de nuevo.'}`,
          'byte',
          'error',
        );
        setByteState('sad');
      } finally {
        setIsLoading(false);
      }
    },
    [addMessage, messages],
  );

  const handleSendMessage = useCallback(
    (event) => {
      event.preventDefault();
      if (!userInput.trim()) return;

      addMessage(userInput, 'user', 'info');
      sendToAI(userInput);
      setUserInput('');
    },
    [addMessage, sendToAI, userInput],
  );

  return {
    isUltraMode,
    messages,
    userInput,
    setUserInput,
    isLoading,
    byteState,
    messagesEndReference,
    handleSendMessage,
  };
};
