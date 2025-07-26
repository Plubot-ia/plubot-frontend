import PropTypes from 'prop-types';
import { useState } from 'react';

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

// Helper function para obtener imagen de Byte según estado
const getByteImage = (byteState) => {
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

// Helper function para renderizar vista minimizada
const _renderMinimizedView = (byteState, handleImageClick, handleKeyDown) => (
  <div
    className='ts-byte-minimized'
    onClick={handleImageClick}
    onKeyDown={handleKeyDown}
    role='button'
    tabIndex={0}
  >
    <img
      src={getByteImage(byteState)}
      alt='Byte asistente'
      className='ts-byte-icon-minimized'
    />
  </div>
);

// Helper function para renderizar header/imagen del asistente
const _renderByteHeader = (byteState, handlers, modeProps) => (
  <div className='ts-byte-header'>
    <div className='ts-byte-hologram'>
      <div
        className='ts-byte-image-container'
        onClick={handlers.onClick}
        onKeyDown={handlers.onKeyDown}
        style={{ cursor: 'pointer' }}
        role='button'
        tabIndex={0}
      >
        <img
          src={getByteImage(byteState)}
          alt='Byte asistente'
          className={`ts-byte-image ${modeProps.isLoading && !modeProps.isUltraMode ? 'ts-byte-thinking' : ''} ${modeProps.isUltraMode ? 'ts-byte-static' : ''}`}
        />
        {modeProps.isUltraMode ? (
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
);

// Helper function para renderizar formulario de input
const _renderInputForm = (handleSendMessage, inputProps, isLoading) => (
  <form onSubmit={handleSendMessage} className='ts-byte-form'>
    <input
      type='text'
      value={inputProps.value}
      onChange={(event_) => inputProps.setValue(event_.target.value)}
      placeholder='Pregunta a Byte...'
      className='ts-byte-input'
      disabled={isLoading}
    />
    <button type='submit' className='ts-byte-submit' disabled={isLoading}>
      Enviar
    </button>
  </form>
);

// Helper function para renderizar burbujas de mensajes
const _renderMessageBubbles = (messages, typeColorFunction) =>
  messages.map((message, index) => (
    <div
      key={message.id || index}
      className={`ts-message-bubble ts-message-${message.sender}`}
      style={{ borderColor: typeColorFunction(message.type) }}
    >
      <p>{message.text}</p>
    </div>
  ));

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

  // Usar helper extraído para obtener imagen de Byte

  if (!isVisible) {
    return _renderMinimizedView(byteState, handleImageClick, handleKeyDown);
  }

  return (
    <div
      className={`ts-byte-assistant ${isAnimating && !isUltraMode ? 'ts-byte-animating' : ''} ${
        isExpanded ? 'ts-byte-expanded' : ''
      } ${simulationMode ? 'ts-byte-with-simulation' : ''} ${isUltraMode ? 'ts-byte-ultra-mode' : ''}`}
    >
      {_renderByteHeader(
        byteState,
        { onClick: handleImageClick, onKeyDown: handleKeyDown },
        { isLoading, isUltraMode },
      )}

      <div className='ts-byte-messages'>
        <div className='ts-message-container'>
          {_renderMessageBubbles(messages, getTypeColor)}
          {isLoading && (
            <div className='ts-message-bubble ts-message-byte'>
              <p>Escribiendo...</p>
            </div>
          )}
          <div ref={messagesEndReference} />
        </div>
      </div>

      {_renderInputForm(
        handleSendMessage,
        { value: userInput, setValue: setUserInput },
        isLoading,
      )}
    </div>
  );
};

ByteAssistant.propTypes = {
  simulationMode: PropTypes.bool,
};

export default ByteAssistant;
