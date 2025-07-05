import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import { useState, useEffect, useRef, useCallback, memo } from 'react';

import useAPI from '@/hooks/useAPI';

import usePlubotCreation from '../../hooks/usePlubotCreation';

import './PreviewChat.css';

// Componente de mensaje memoizado para evitar re-renderizados innecesarios
const ChatMessage = memo(({ message }) => {
  return (
    <motion.div
      className={`chat-message ${message.role}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className='message-content'>{message.content}</div>
      <span className='message-timestamp'>
        {new Date(message.timestamp).toLocaleTimeString()}
      </span>
    </motion.div>
  );
});

ChatMessage.propTypes = {
  message: PropTypes.shape({
    role: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    timestamp: PropTypes.instanceOf(Date).isRequired,
  }).isRequired,
};

ChatMessage.displayName = 'ChatMessage';

// Componente de botón memoizado
const ChatButton = memo(({ button, onClick, color }) => {
  return (
    <motion.button
      className='chat-button'
      onClick={() => onClick(button.label)}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={{ backgroundColor: color || '#00e0ff' }}
    >
      {button.label}
    </motion.button>
  );
});

ChatButton.propTypes = {
  button: PropTypes.shape({ label: PropTypes.string.isRequired }).isRequired,
  onClick: PropTypes.func.isRequired,
  color: PropTypes.string,
};

ChatButton.defaultProps = {
  color: '#00e0ff',
};

ChatButton.displayName = 'ChatButton';

const PreviewChat = ({ plubotId }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [buttons, setButtons] = useState([]);
  const { plubotData } = usePlubotCreation();
  const { request } = useAPI();
  const chatContainerReference = useRef(null);

  // Simulamos un user_phone para pruebas
  const userPhone = '1234567890';

  // Cargar mensaje inicial al montar el componente
  useEffect(() => {
    const fetchInitialMessage = async () => {
      try {
        const data = await request(
          'post',
          `/api/conversations/${plubotId}/chat`,
          {
            message: '',
            user_phone: userPhone,
          },
        );
        setMessages([
          { role: 'bot', content: data.response, timestamp: new Date() },
        ]);
        setButtons(data.buttons || []);
      } catch {
        // Error handled silently for preview purposes.
      }
    };

    if (plubotId) {
      fetchInitialMessage();
    }
  }, [plubotId, request]);

  // Enviar mensaje (memoizado para evitar recreaciones en cada renderizado)
  const sendMessage = useCallback(
    async (message) => {
      if (!message.trim()) return;

      const userMessage = {
        role: 'user',
        content: message,
        timestamp: new Date(),
      };
      setMessages((previous) => [...previous, userMessage]);
      setInputMessage('');

      try {
        const data = await request(
          'post',
          `/api/conversations/${plubotId}/chat`,
          {
            message,
            user_phone: userPhone,
          },
        );
        setMessages((previous) => [
          ...previous,
          { role: 'bot', content: data.response, timestamp: new Date() },
        ]);
        setButtons(data.buttons || []);
      } catch {
        setMessages((previous) => [
          ...previous,
          {
            role: 'bot',
            content: 'Error al procesar tu mensaje.',
            timestamp: new Date(),
          },
        ]);
      }
    },
    [plubotId, request, userPhone],
  );

  // Manejar clic en botón (memoizado)
  const handleButtonClick = useCallback(
    (label) => {
      sendMessage(label);
    },
    [sendMessage],
  );

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (chatContainerReference.current) {
      chatContainerReference.current.scrollTop =
        chatContainerReference.current.scrollHeight;
    }
  }, [messages]);

  // Manejar tecla Enter (memoizado)
  const handleKeyPress = useCallback(
    (event) => {
      if (event.key === 'Enter') {
        sendMessage(inputMessage);
      }
    },
    [sendMessage, inputMessage],
  );

  // Memoizar el color para evitar cálculos repetidos
  const buttonColor = plubotData.color || '#00e0ff';

  return (
    <div className='preview-chat'>
      <div className='chat-header'>
        <h3>{plubotData.name || 'Plubot'}</h3>
      </div>
      <div className='chat-container' ref={chatContainerReference}>
        <AnimatePresence>
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
        </AnimatePresence>
      </div>
      <div className='chat-buttons'>
        <AnimatePresence>
          {buttons.map((button) => (
            <ChatButton
              key={button.label}
              button={button}
              onClick={handleButtonClick}
              color={buttonColor}
            />
          ))}
        </AnimatePresence>
      </div>
      <div className='chat-input'>
        <input
          type='text'
          value={inputMessage}
          onChange={(event) => setInputMessage(event.target.value)}
          onKeyPress={handleKeyPress}
          placeholder='Escribe un mensaje...'
        />
        <motion.button
          onClick={() => sendMessage(inputMessage)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{ backgroundColor: buttonColor }}
        >
          Enviar
        </motion.button>
      </div>
    </div>
  );
};

// Memoizar el componente completo para evitar re-renderizados cuando las props no cambian
PreviewChat.propTypes = {
  plubotId: PropTypes.string.isRequired,
};

export default memo(PreviewChat);
