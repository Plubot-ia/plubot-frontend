import { useState, useRef, useCallback } from 'react';

import useFlowStore from '@/stores/use-flow-store';

import { useByteApi } from './useByteApi';
import { useMessageScroll } from './useMessageScroll';

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

  const { sendToAI } = useByteApi({
    addMessage,
    setIsLoading,
    setByteState,
    messages,
  });
  useMessageScroll(messagesEndReference, messages, isUltraMode);

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
