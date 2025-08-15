import { useState, useRef, useEffect } from 'react';

import { fetchByteResponse } from '../services/byte-api';
import { createRippleEffect } from '../utils/dom-helpers';

const useByteChat = () => {
  const [messages, setMessages] = useState([
    {
      text: '¡Hola! Soy Byte, tu guía en Plubot. Pregúntame sobre qué es Plubot o cómo crear asistentes digitales.',
      sender: 'byte',
      type: 'info',
      id: Date.now(),
    },
  ]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [byteState, setByteState] = useState('normal');
  const [showParticles, setShowParticles] = useState(false);
  const messagesContainerReference = useRef(undefined);

  useEffect(() => {
    if (messagesContainerReference.current) {
      const element = messagesContainerReference.current;
      element.scrollTop = element.scrollHeight;
    }
  }, [messages]);

  const addMessage = (text, sender, messageType = 'info') => {
    setMessages((previousMessages) => [
      ...previousMessages,
      { text, sender, type: messageType, id: Date.now() },
    ]);
  };

  const handleSuccessfulResponse = (data) => {
    addMessage(data.response, 'byte', data.type || 'info');
    setByteState(data.state || 'happy');
    setShowParticles(true);
  };

  const sendToByteEmbajador = async (userMessage) => {
    setIsLoading(true);
    setByteState('thinking');
    setShowParticles(false);

    try {
      const data = await fetchByteResponse(userMessage, messages);
      handleSuccessfulResponse(data);
    } catch (error) {
      addMessage(
        `¡Ups! ${error.message || 'Something went wrong. Please try again.'}`,
        'byte',
        'error',
      );
      setByteState('sad');
      setShowParticles(false);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 600);
    }
  };

  const handleSendMessage = (event) => {
    event.preventDefault();
    if (!userInput.trim()) return;

    createRippleEffect(event);

    addMessage(userInput, 'user');
    sendToByteEmbajador(userInput);
    setUserInput('');
  };

  return {
    messages,
    userInput,
    isLoading,
    byteState,
    showParticles,
    messagesContainerReference,
    setUserInput,
    handleSendMessage,
  };
};

export default useByteChat;
