import React, { useState, useEffect } from 'react';
import './StatusBubble.css';

const StatusBubble = ({ message }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');

  useEffect(() => {
    if (message && message.trim() !== '') {
      setCurrentMessage(message);
      setIsVisible(true);

      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 5000); // El mensaje desaparece después de 5 segundos

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [message]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="status-bubble">
      <div className="status-bubble-content">
        {currentMessage}
      </div>
      <div className="status-bubble-arrow"></div>
    </div>
  );
};

export default StatusBubble;
