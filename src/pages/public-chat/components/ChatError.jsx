import { ArrowLeft } from 'lucide-react';
import PropTypes from 'prop-types';
import React from 'react';

const ChatError = ({ message }) => (
  <div className='chat-error'>
    <p>{message}</p>
    <a href='/' className='back-link'>
      <ArrowLeft size={16} />
      Volver al inicio
    </a>
  </div>
);

ChatError.propTypes = {
  message: PropTypes.string.isRequired,
};

export default ChatError;
