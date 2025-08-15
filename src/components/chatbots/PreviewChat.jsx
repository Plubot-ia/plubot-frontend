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
      <span className='message-timestamp'>{new Date(message.timestamp).toLocaleTimeString()}</span>
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

const useChatLogic = (plubotId) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [buttons, setButtons] = useState([]);
  const { request } = useAPI();
  const chatContainerReference = useRef(null);
  const userPhone = '1234567890'; // Simulated for testing

  const sendMessage = useCallback(
    async (message) => {
      if (!message.trim()) return;

      const userMessage = {
        role: 'user',
        content: message,
        timestamp: new Date(),
      };
      setMessages((previous) => [...previous, userMessage]);
      if (message === inputMessage) setInputMessage('');

      try {
        const data = await request('post', `/api/conversations/${plubotId}/chat`, {
          message,
          user_phone: userPhone,
        });
        setMessages((previous) => [
          ...previous,
          { role: 'bot', content: data.response, timestamp: new Date() },
        ]);
        setButtons(data.buttons ?? []);
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
    [plubotId, request, userPhone, inputMessage],
  );

  useEffect(() => {
    const fetchInitialMessage = async () => {
      try {
        const data = await request('post', `/api/conversations/${plubotId}/chat`, {
          message: '',
          user_phone: userPhone,
        });
        setMessages([{ role: 'bot', content: data.response, timestamp: new Date() }]);
        setButtons(data.buttons ?? []);
      } catch {
        /* Silent error handling for preview */
      }
    };
    if (plubotId) fetchInitialMessage();
  }, [plubotId, request, userPhone]);

  useEffect(() => {
    if (chatContainerReference.current) {
      chatContainerReference.current.scrollTop = chatContainerReference.current.scrollHeight;
    }
  }, [messages]);

  return {
    messages,
    inputMessage,
    setInputMessage,
    buttons,
    sendMessage,
    chatContainerReference,
  };
};

const ChatWindow = memo(({ messages, containerRef }) => (
  <div className='chat-container' ref={containerRef}>
    <AnimatePresence>
      {messages.map((message, index) => (
        <ChatMessage
          key={message.id || `${message.timestamp.toISOString()}-${index}`}
          message={message}
        />
      ))}
    </AnimatePresence>
  </div>
));
ChatWindow.propTypes = {
  messages: PropTypes.arrayOf(PropTypes.object).isRequired,
  containerRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
};
ChatWindow.displayName = 'ChatWindow';

const ChatButtonList = memo(({ buttons, onClick, color }) => (
  <div className='chat-buttons'>
    <AnimatePresence>
      {buttons.map((button) => (
        <ChatButton
          key={button.label}
          button={button}
          onClick={() => onClick(button.label)}
          color={color}
        />
      ))}
    </AnimatePresence>
  </div>
));
ChatButtonList.propTypes = {
  buttons: PropTypes.arrayOf(PropTypes.object).isRequired,
  onClick: PropTypes.func.isRequired,
  color: PropTypes.string,
};
ChatButtonList.defaultProps = {
  color: '#00e0ff',
};
ChatButtonList.displayName = 'ChatButtonList';

const ChatInput = memo(({ value, onChange, onSend, onKeyPress, color }) => (
  <div className='chat-input'>
    <input
      type='text'
      value={value}
      onChange={onChange}
      onKeyPress={onKeyPress}
      placeholder='Escribe un mensaje...'
    />
    <motion.button
      onClick={onSend}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={{ backgroundColor: color }}
    >
      Enviar
    </motion.button>
  </div>
));
ChatInput.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onSend: PropTypes.func.isRequired,
  onKeyPress: PropTypes.func.isRequired,
  color: PropTypes.string,
};
ChatInput.defaultProps = {
  color: '#00e0ff',
};
ChatInput.displayName = 'ChatInput';

const PreviewChat = ({ plubotId }) => {
  const { plubotData } = usePlubotCreation();
  const { messages, inputMessage, setInputMessage, buttons, sendMessage, chatContainerReference } =
    useChatLogic(plubotId);

  const handleKeyPress = useCallback(
    (event) => {
      if (event.key === 'Enter') sendMessage(inputMessage);
    },
    [sendMessage, inputMessage],
  );

  const buttonColor = plubotData.color || '#00e0ff';

  return (
    <div className='preview-chat'>
      <div className='chat-header'>
        <h3>{plubotData.name || 'Plubot'}</h3>
      </div>
      <ChatWindow messages={messages} containerRef={chatContainerReference} />
      <ChatButtonList buttons={buttons} onClick={sendMessage} color={buttonColor} />
      <ChatInput
        value={inputMessage}
        onChange={(event) => setInputMessage(event.target.value)}
        onSend={() => sendMessage(inputMessage)}
        onKeyPress={handleKeyPress}
        color={buttonColor}
      />
    </div>
  );
};

// Memoizar el componente completo para evitar re-renderizados cuando las props no cambian
PreviewChat.propTypes = {
  plubotId: PropTypes.string.isRequired,
};

export default memo(PreviewChat);
