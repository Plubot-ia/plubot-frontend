import { useState, useEffect } from 'react';

import ByteImage from './components/ByteImage';
import ChatHeader from './components/ChatHeader';
import ChatInput from './components/ChatInput';
import MessageList from './components/MessageList';
import useByteChat from './hooks/useByteChat';
import useParticleAnimation from './hooks/useParticleAnimation';

import './ByteEmbajador.css';

const AboutChatByte = () => {
  const {
    messages,
    userInput,
    isLoading,
    byteState,
    showParticles,
    messagesContainerReference,
    setUserInput,
    handleSendMessage,
  } = useByteChat();

  const canvasReference = useParticleAnimation(messages, showParticles);
  const [byteActive, setByteActive] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setByteActive(true);
    }, 300);
  }, []);

  return (
    <div className={`about-chat-byte-container ${byteActive ? 'active' : ''}`}>
      <canvas ref={canvasReference} className='particle-canvas' />
      <ByteImage
        byteState={byteState}
        isLoading={isLoading}
        showParticles={showParticles}
        lastMessage={messages.at(-1)}
      />
      <div className='chat-column'>
        <div className='digital-noise' />
        <ChatHeader />
        <MessageList ref={messagesContainerReference} messages={messages} />
        <ChatInput
          userInput={userInput}
          onUserInput={(event) => setUserInput(event.target.value)}
          isLoading={isLoading}
          handleSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
};

export default AboutChatByte;
