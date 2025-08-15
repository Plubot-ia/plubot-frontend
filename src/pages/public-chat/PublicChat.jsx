import React from 'react';

import ChatError from './components/ChatError';
import ChatHeader from './components/ChatHeader';
import ChatLoader from './components/ChatLoader';
import MessageInput from './components/MessageInput';
import MessageList from './components/MessageList';
import PoweredBy from './components/PoweredBy';
import { usePublicChat } from './hooks/usePublicChat';
import './PublicChat.css';

const PublicChat = () => {
  const {
    messages,
    inputMessage,
    isLoading,
    botInfo,
    error,
    isTyping,
    messagesEndRef,
    setInputMessage,
    handleSendMessage,
  } = usePublicChat();

  const handleSend = () => {
    handleSendMessage(inputMessage);
    setInputMessage('');
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleOptionClick = (optionValue) => {
    handleSendMessage(optionValue);
  };

  if (isLoading) {
    return <ChatLoader />;
  }

  if (error) {
    return <ChatError message={error} />;
  }

  return (
    <div className='chat-container'>
      <ChatHeader botInfo={botInfo} />
      <MessageList
        messages={messages}
        messagesEndRef={messagesEndRef}
        botInfo={botInfo}
        onOptionClick={handleOptionClick}
      />
      <MessageInput
        value={inputMessage}
        onChange={setInputMessage}
        onSend={handleSend}
        onKeyPress={handleKeyPress}
        isTyping={isTyping}
        botInfo={botInfo}
      />
      <PoweredBy />
    </div>
  );
};

export default PublicChat;
