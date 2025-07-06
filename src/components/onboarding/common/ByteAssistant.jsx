import PropTypes from 'prop-types';
import React, { useState } from 'react';

import './ByteAssistant.css';
import './fix-bubble.css';
import byteHappy from '@/assets/img/byte-happy.png';
import byteNormal from '@/assets/img/byte-normal.png';
import byteSad from '@/assets/img/byte-sad.png';
import byteThinking from '@/assets/img/byte-thinking.png';
import byteWarning from '@/assets/img/byte-warning.png';
import { useByteAssistant } from '@/hooks/useByteAssistant';

const getTypeColor = (messageType) => {
  switch (messageType) {
    case 'error': {
      return '#ff2e5b';
    }
    case 'success': {
      return '#00ff9d';
    }
    case 'warning': {
      return '#ffb700';
    }
    default: {
      return '#00e0ff';
    }
  }
};

const ByteAssistant = ({ simulationMode = false }) => {
  const {
    isUltraMode,
    messages,
    userInput,
    setUserInput,
    isLoading,
    byteState,
    messagesEndReference,
    handleSendMessage,
  } = useByteAssistant();

  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnimating] = useState(false); // UI-specific state

  const handleImageClick = () => {
    if (isVisible) {
      setIsVisible(false);
    } else {
      setIsVisible(true);
      setIsExpanded(!isExpanded);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleImageClick();
    }
  };

  const getByteImage = () => {
    switch (byteState) {
      case 'happy': {
        return byteHappy;
      }
      case 'sad': {
        return byteSad;
      }
      case 'warning': {
        return byteWarning;
      }
      case 'thinking': {
        return byteThinking;
      }
      default: {
        return byteNormal;
      }
    }
  };

  if (!isVisible) {
    return (
      <div
        className='ts-byte-minimized'
        onClick={handleImageClick}
        onKeyDown={handleKeyDown}
        role='button'
        tabIndex={0}
      >
        <img
          src={getByteImage()}
          alt='Byte asistente'
          className='ts-byte-icon-minimized'
        />
      </div>
    );
  }

  return (
    <div
      className={`ts-byte-assistant ${isAnimating && !isUltraMode ? 'ts-byte-animating' : ''} ${
        isExpanded ? 'ts-byte-expanded' : ''
      } ${simulationMode ? 'ts-byte-with-simulation' : ''} ${isUltraMode ? 'ts-byte-ultra-mode' : ''}`}
    >
      <div className='ts-byte-header'>
        <div className='ts-byte-hologram'>
          <div
            className='ts-byte-image-container'
            onClick={handleImageClick}
            onKeyDown={handleKeyDown}
            style={{ cursor: 'pointer' }}
            role='button'
            tabIndex={0}
          >
            <img
              src={getByteImage()}
              alt='Byte asistente'
              className={`ts-byte-image ${isLoading && !isUltraMode ? 'ts-byte-thinking' : ''} ${isUltraMode ? 'ts-byte-static' : ''}`}
            />
            {isUltraMode ? (
              <div
                className='ts-byte-glow-simple'
                style={{
                  border: `1px solid ${getTypeColor('info')}`,
                }}
              />
            ) : (
              <div
                className='ts-byte-glow'
                style={{
                  boxShadow: `0 0 10px ${getTypeColor('info')}, 0 0 20px ${getTypeColor('info')}`,
                }}
              />
            )}
          </div>
        </div>
      </div>

      <div className='ts-byte-messages'>
        <div className='ts-message-container'>
          {messages.map((message, index) => (
            <div
              key={message.id || index}
              className={`ts-message-bubble ts-message-${message.sender}`}
              style={{ borderColor: getTypeColor(message.type) }}
            >
              <p>{message.text}</p>
            </div>
          ))}
          {isLoading && (
            <div className='ts-message-bubble ts-message-byte'>
              <p>Escribiendo...</p>
            </div>
          )}
          <div ref={messagesEndReference} />
        </div>
      </div>

      <form onSubmit={handleSendMessage} className='ts-byte-form'>
        <input
          type='text'
          value={userInput}
          onChange={(event_) => setUserInput(event_.target.value)}
          placeholder='Pregunta a Byte...'
          className='ts-byte-input'
          disabled={isLoading}
        />
        <button type='submit' className='ts-byte-submit' disabled={isLoading}>
          Enviar
        </button>
      </form>
    </div>
  );
};

ByteAssistant.propTypes = {
  simulationMode: PropTypes.bool,
};

export default ByteAssistant;
