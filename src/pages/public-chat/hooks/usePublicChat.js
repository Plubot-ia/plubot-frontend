import { useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';

import { postMessage } from '../services/chatService';

import { usePublicChatEffects } from './usePublicChatEffects';

// Helper functions for creating message objects
const createUserMessage = (text) => ({
  id: `user-${Date.now()}`,
  text,
  sender: 'user',
  timestamp: new Date().toISOString(),
});

const createBotResponse = (data) => ({
  id: `bot-${Date.now()}`,
  text: data.response,
  sender: 'bot',
  timestamp: new Date().toISOString(),
  options: data.options ?? [],
});

const createErrorResponse = (error) => ({
  id: `error-${Date.now()}`,
  text: error.message,
  sender: 'bot',
  isError: true,
  timestamp: new Date().toISOString(),
});

export const usePublicChat = () => {
  const { publicId } = useParams();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [botInfo, setBotInfo] = useState();
  const [error, setError] = useState();
  const [currentFlowId, setCurrentFlowId] = useState();
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(undefined);

  usePublicChatEffects({
    publicId,
    setBotInfo,
    setMessages,
    setError,
    setIsLoading,
    messagesEndRef,
    messages,
  });

  const handleSendMessage = useCallback(
    async (messageText) => {
      if (!messageText.trim()) return;

      const userMessage = createUserMessage(messageText);
      setMessages((previous) => [...previous, userMessage]);

      const newHistory = [...conversationHistory, { role: 'user', content: messageText }];
      setConversationHistory(newHistory);
      setIsTyping(true);

      try {
        const payload = {
          message: messageText,
          conversation_history: newHistory,
          flow_id: currentFlowId,
        };
        const data = await postMessage(publicId, payload);
        const botResponse = createBotResponse(data);

        setMessages((previous) => [...previous, botResponse]);
        setConversationHistory((previous) => [
          ...previous,
          { role: 'assistant', content: data.response },
        ]);
        if (data.flow_id) {
          setCurrentFlowId(data.flow_id);
        }
      } catch (error_) {
        const errorResponse = createErrorResponse(error_);
        setMessages((previous) => [...previous, errorResponse]);
      } finally {
        setIsTyping(false);
      }
    },
    [conversationHistory, currentFlowId, publicId],
  );

  return {
    messages,
    inputMessage,
    isLoading,
    botInfo,
    error,
    isTyping,
    messagesEndRef,
    setInputMessage,
    handleSendMessage,
  };
};
