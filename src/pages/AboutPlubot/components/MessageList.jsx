import PropTypes from 'prop-types';
import { forwardRef } from 'react';

import { getTypeColor } from '../utils/byte-helpers';

const MessageList = forwardRef(({ messages }, ref) => (
  <div className='chat-messages' ref={ref}>
    {messages.map((message) => (
      <div
        key={message.id}
        className={`message-bubble message-${message.sender} message-type-${message.type}`}
        style={{
          borderColor: message.sender === 'byte' ? getTypeColor(message.type) : undefined,
          boxShadow:
            message.sender === 'byte' ? `0 0 8px ${getTypeColor(message.type)}` : undefined,
        }}
      >
        <p>{message.text}</p>
        <div className='message-glow' />
      </div>
    ))}
  </div>
));

MessageList.displayName = 'MessageList';

MessageList.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      sender: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      text: PropTypes.string.isRequired,
    }),
  ).isRequired,
};

export default MessageList;
