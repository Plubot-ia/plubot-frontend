import { useEffect } from 'react';

import { getBotInfo } from '../services/chatService';

export const usePublicChatEffects = ({
  publicId,
  setBotInfo,
  setMessages,
  setError,
  setIsLoading,
  messagesEndRef,
  messages,
}) => {
  // Effect for fetching initial bot info
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        setError(undefined);
        const info = await getBotInfo(publicId);
        setBotInfo(info);
        const welcomeMessage = {
          id: 'welcome',
          text: info.initialMessage,
          sender: 'bot',
          timestamp: new Date().toISOString(),
        };
        setMessages([welcomeMessage]);
      } catch (error_) {
        setError(error_.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [publicId, setBotInfo, setMessages, setError, setIsLoading]);

  // Effect for scrolling to the bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, messagesEndRef]);
};
