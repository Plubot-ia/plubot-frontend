import PropTypes from 'prop-types';
import React, { useState, useCallback, useMemo } from 'react';

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
    <img src={getByteImage(byteState)} alt='Byte asistente' className='ts-byte-icon-minimized' />
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

const ByteAssistant = React.memo(
  ({ simulationMode = false }) => {
    // 🔄 RENDER TRACKING - Track only on mount to avoid render loops
    React.useEffect(() => {
      if (globalThis.window !== undefined && globalThis.enhancedRenderTracker) {
        globalThis.enhancedRenderTracker.track('ByteAssistant', 'mount');
      }
    }, []); // Empty deps = only on mount

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

    // OPTIMIZED: Memoize event handlers
    const handleImageClick = useCallback(() => {
      if (isVisible) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
        setIsExpanded((previous) => !previous);
      }
    }, [isVisible]);

    const handleKeyDown = useCallback(
      (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleImageClick();
        }
      },
      [handleImageClick],
    );

    // CRITICAL: All hooks must be called before any early returns to follow Rules of Hooks
    // OPTIMIZED: Memoize className computation
    const assistantClassName = useMemo(
      () =>
        [
          'ts-byte-assistant',
          isAnimating && !isUltraMode ? 'ts-byte-animating' : '',
          isExpanded ? 'ts-byte-expanded' : '',
          simulationMode ? 'ts-byte-with-simulation' : '',
          isUltraMode ? 'ts-byte-ultra-mode' : '',
        ]
          .filter(Boolean)
          .join(' '),
      [isAnimating, isUltraMode, isExpanded, simulationMode],
    );

    // OPTIMIZED: Memoize header handlers
    const headerHandlers = useMemo(
      () => ({ onClick: handleImageClick, onKeyDown: handleKeyDown }),
      [handleImageClick, handleKeyDown],
    );

    // OPTIMIZED: Memoize mode props
    const modeProps = useMemo(() => ({ isLoading, isUltraMode }), [isLoading, isUltraMode]);

    // OPTIMIZED: Memoize input props
    const inputProps = useMemo(
      () => ({ value: userInput, setValue: setUserInput }),
      [userInput, setUserInput],
    );

    // Early return after all hooks are called
    if (!isVisible) {
      return _renderMinimizedView(byteState, handleImageClick, handleKeyDown);
    }

    return (
      <div className={assistantClassName}>
        {_renderByteHeader(byteState, headerHandlers, modeProps)}

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

        {_renderInputForm(handleSendMessage, inputProps, isLoading)}
      </div>
    );
  },
  (previousProps, nextProps) => {
    // OPTIMIZED: Custom comparison for ByteAssistant
    // Only re-render if simulationMode changes
    return previousProps.simulationMode === nextProps.simulationMode;
  },
);

ByteAssistant.propTypes = {
  simulationMode: PropTypes.bool,
};

ByteAssistant.displayName = 'ByteAssistant';

export default ByteAssistant;
