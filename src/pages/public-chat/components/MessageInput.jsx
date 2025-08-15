import { Send } from 'lucide-react';
import PropTypes from 'prop-types';
import React from 'react';

import { adjustColor } from '../utils/adjustColor';

const MessageInput = ({ value, onChange, onSend, onKeyPress, isTyping, botInfo }) => (
  <div className='chat-input'>
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onKeyPress={onKeyPress}
      placeholder='Escribe un mensaje...'
      rows={1}
    />
    <button
      type='button'
      onClick={onSend}
      disabled={!value.trim() || isTyping}
      className='send-button'
      style={{
        background: botInfo?.color
          ? `linear-gradient(135deg, ${botInfo.color} 0%, ${adjustColor(botInfo.color, 30)} 100%)`
          : 'var(--primary-gradient)',
      }}
    >
      <Send size={20} />
    </button>
  </div>
);

MessageInput.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onSend: PropTypes.func.isRequired,
  onKeyPress: PropTypes.func.isRequired,
  isTyping: PropTypes.bool.isRequired,
  botInfo: PropTypes.object,
};

MessageInput.defaultProps = {
  botInfo: undefined,
};

export default MessageInput;
