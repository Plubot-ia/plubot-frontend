import PropTypes from 'prop-types';
import React from 'react';

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const getBotInitial = (name) => {
  return name ? name.charAt(0).toUpperCase() : 'P';
};

const MessageList = ({ messages, messagesEndRef, botInfo, onOptionClick }) => (
  <div className='chat-messages'>
    {messages.map((message) => (
      <div
        key={message.id}
        className={`message ${message.sender} ${
          message.isTyping ? 'typing' : ''
        } ${message.isError ? 'error' : ''}`}
      >
        {message.sender === 'bot' && !message.isTyping && (
          <div className='message-avatar'>{getBotInitial(botInfo?.name)}</div>
        )}
        <div className='message-bubble'>
          <div className='message-content'>
            {message.isTyping ? (
              <>
                <div className='dot' />
                <div className='dot' />
                <div className='dot' />
              </>
            ) : (
              message.text
            )}
          </div>
          <div className='message-timestamp'>{formatTime(message.timestamp)}</div>
        </div>

        {message.sender === 'bot' && message.options && message.options.length > 0 && (
          <div className='message-options'>
            {message.options.map((option) => (
              <button
                key={option.id}
                className='option-button'
                onClick={() => onOptionClick(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    ))}
    <div ref={messagesEndRef} />
  </div>
);

MessageList.propTypes = {
  messages: PropTypes.array.isRequired,
  messagesEndRef: PropTypes.object.isRequired,
  botInfo: PropTypes.object,
  onOptionClick: PropTypes.func.isRequired,
};

MessageList.defaultProps = {
  botInfo: undefined,
};

export default MessageList;
