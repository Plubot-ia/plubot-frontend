import PropTypes from 'prop-types';
import React from 'react';

const VerificationMessage = ({ message }) => {
  if (!message.text) {
    // eslint-disable-next-line unicorn/no-null
    return null;
  }

  return <div className={`notice-message notice-message-${message.type}`}>{message.text}</div>;
};

VerificationMessage.propTypes = {
  message: PropTypes.shape({
    text: PropTypes.string,
    type: PropTypes.string,
  }).isRequired,
};

export default VerificationMessage;
