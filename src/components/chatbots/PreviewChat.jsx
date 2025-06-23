import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAPI from '@/hooks/useAPI';
import { usePlubotCreation } from '@/context/PlubotCreationContext.jsx';
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
      <div className="message-content">
        {message.content}
      </div>
      <span className="message-timestamp">
        {new Date(message.timestamp).toLocaleTimeString()}
      </span>
    </motion.div>
  );
});

// Componente de botón memoizado
const ChatButton = memo(({ button, onClick, color }) => {
  return (
    <motion.button
      className="chat-button"
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

const PreviewChat = ({ plubotId }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [buttons, setButtons] = useState([]);
  const { plubotData } = usePlubotCreation();
  const { request } = useAPI();
  const chatContainerRef = useRef(null);

  // Simulamos un user_phone para pruebas
  const userPhone = '1234567890';

  // Cargar mensaje inicial al montar el componente
  useEffect(() => {
    const fetchInitialMessage = async () => {
      try {
        const data = await request('post', `/api/conversations/${plubotId}/chat`, {
          message: '',
          user_phone: userPhone
        });
        setMessages([{ role: 'bot', content: data.response, timestamp: new Date() }]);
        setButtons(data.buttons || []);
      } catch (error) {
        // Error handled silently for preview purposes.
      }
    };

    if (plubotId) {
      fetchInitialMessage();
    }
  }, [plubotId, request]);

  // Enviar mensaje (memoizado para evitar recreaciones en cada renderizado)
  const sendMessage = useCallback(async (message) => {
    if (!message.trim()) return;

    const userMessage = { role: 'user', content: message, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    try {
      const data = await request('post', `/api/conversations/${plubotId}/chat`, {
        message,
        user_phone: userPhone
      });
      setMessages(prev => [...prev, { role: 'bot', content: data.response, timestamp: new Date() }]);
      setButtons(data.buttons || []);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', content: 'Error al procesar tu mensaje.', timestamp: new Date() }]);
    }
  }, [plubotId, request, userPhone]);

  // Manejar clic en botón (memoizado)
  const handleButtonClick = useCallback((label) => {
    sendMessage(label);
  }, [sendMessage]);

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Manejar tecla Enter (memoizado)
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      sendMessage(inputMessage);
    }
  }, [sendMessage, inputMessage]);

  // Memoizar el color para evitar cálculos repetidos
  const buttonColor = plubotData.color || '#00e0ff';

  return (
    <div className="preview-chat">
      <div className="chat-header">
        <h3>{plubotData.name || 'Plubot'}</h3>
      </div>
      <div className="chat-container" ref={chatContainerRef}>
        <AnimatePresence>
          {messages.map((msg, index) => (
            <ChatMessage key={index} message={msg} />
          ))}
        </AnimatePresence>
      </div>
      <div className="chat-buttons">
        <AnimatePresence>
          {buttons.map((button, index) => (
            <ChatButton 
              key={index} 
              button={button} 
              onClick={handleButtonClick} 
              color={buttonColor} 
            />
          ))}
        </AnimatePresence>
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Escribe un mensaje..."
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
export default memo(PreviewChat);