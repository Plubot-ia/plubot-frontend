import { Send, Loader, ArrowLeft, Zap } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';

import './PublicChat.css';
import logger from '../../services/loggerService';
import instance from '../../utils/axios-config';

// Función para formatear la hora
const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const PublicChat = () => {
  const { publicId } = useParams();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [botInfo, setBotInfo] = useState();
  const [error, setError] = useState();
  const messagesEndReference = useRef();
  const [currentFlowId, setCurrentFlowId] = useState();
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  // La URL base del backend ya está configurada en la instancia central de Axios.
  // Cargar información del bot al montar el componente
  useEffect(() => {
    const fetchBotInfo = async () => {
      try {
        setIsLoading(true);
        setError(undefined);

        if (!publicId || publicId === 'undefined') {
          throw new Error('ID de chatbot inválido');
        }
        if (Number.isNaN(Number.parseInt(publicId, 10))) {
          throw new TypeError('El ID del chatbot debe ser un número');
        }

        const response = await instance.get(`/plubots/chat/${publicId}`);
        const { data } = response;

        if (data.status === 'success') {
          setBotInfo(data.data);
          const welcomeMessage = {
            id: 'welcome',
            text: data.data.initialMessage,
            sender: 'bot',
            timestamp: new Date().toISOString(),
          };
          setMessages([welcomeMessage]);
        } else {
          throw new Error(
            data.message || 'No se pudo cargar la información del chatbot',
          );
        }
      } catch (error_) {
        let errorMessage;
        if (error_.response) {
          if (error_.response.status === 404) {
            errorMessage = 'El chatbot que buscas no existe o ha sido movido.';
          } else if (error_.response.status >= 500) {
            errorMessage =
              'Estamos experimentando problemas en el servidor. Intenta de nuevo en unos minutos.';
          } else {
            errorMessage =
              error_.response.data?.message ||
              'Error al contactar al servidor.';
          }
        } else if (error_.request) {
          errorMessage =
            'No se pudo conectar con el servidor. Revisa tu conexión a internet.';
        } else {
          errorMessage = error_.message || 'Ocurrió un error inesperado.';
        }
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBotInfo();
  }, [publicId]);

  // Desplazarse al último mensaje cuando se añaden nuevos mensajes
  useEffect(() => {
    if (messagesEndReference.current) {
      messagesEndReference.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    setMessages((previous) => [...previous, userMessage]);
    const newConversationHistory = [
      ...conversationHistory,
      { role: 'user', content: inputMessage },
    ];
    setConversationHistory(newConversationHistory);
    setInputMessage('');
    setIsTyping(true);

    try {
      const payload = {
        message: inputMessage,
        conversation_history: newConversationHistory,
        flow_id: currentFlowId,
      };

      const response = await instance.post(
        `/plubots/chat/${publicId}/message`,
        payload,
      );
      const { data } = response;

      if (data.status === 'success') {
        const botResponse = {
          id: `bot-${Date.now()}`,
          text: data.data.response,
          sender: 'bot',
          timestamp: new Date().toISOString(),
          options: data.data.options || [],
        };
        setMessages((previous) => [...previous, botResponse]);
        setConversationHistory((previous) => [
          ...previous,
          { role: 'assistant', content: data.data.response },
        ]);
        setCurrentFlowId(data.data.next_flow_id);
      } else {
        throw new Error(data.message || 'Error en la respuesta del bot');
      }
    } catch (error_) {
      logger.error('Error al enviar mensaje:', error_);
      setIsTyping(false);
      setMessages((previous) =>
        previous.filter((message) => message.id !== 'typing'),
      );

      const errorMessage = {
        id: `error-${Date.now()}`,
        text: 'Lo siento, ha ocurrido un error al procesar tu mensaje. Por favor, intenta de nuevo más tarde.',
        sender: 'bot',
        isError: true,
        timestamp: new Date().toISOString(),
      };

      setMessages((previous) => [...previous, errorMessage]);
    }
  };

  const handleOptionClick = (option) => {
    setInputMessage(option.message);
    handleSendMessage();
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // Función para obtener la inicial del nombre del bot
  const getBotInitial = () => {
    if (!botInfo || !botInfo.name) return 'P';
    return botInfo.name.charAt(0).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className='public-chat-container loading'>
        <div className='loading-spinner'>
          <Loader size={40} className='spinner' />
          <p>Cargando chatbot...</p>
        </div>
      </div>
    );
  }

  if (error && !botInfo) {
    return (
      <div className='public-chat-container error'>
        <div className='error-message'>
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => globalThis.location.reload()}>
            <ArrowLeft size={16} />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`public-chat-container ${botInfo?.embedConfig?.theme || 'light'}`}
    >
      <div
        className='chat-header'
        style={{
          background: botInfo?.color
            ? `linear-gradient(135deg, ${botInfo.color} 0%, ${adjustColor(botInfo.color, 30)} 100%)`
            : 'var(--primary-gradient)',
        }}
      >
        <div className='chat-header-avatar'>
          {botInfo?.avatar ? (
            <img src={botInfo.avatar} alt={botInfo.name} />
          ) : (
            getBotInitial()
          )}
        </div>
        <h2>{botInfo?.name || 'Chat'}</h2>
        <div className='chat-header-status'>
          <span className='status-dot' />
          <span>En línea</span>
        </div>
      </div>

      <div className='chat-messages'>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.sender} ${message.isTyping ? 'typing' : ''} ${message.isError ? 'error' : ''}`}
          >
            {message.sender === 'bot' && !message.isTyping && (
              <div className='message-avatar'>{getBotInitial()}</div>
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
              <div className='message-timestamp'>
                {formatTime(message.timestamp)}
              </div>
            </div>

            {/* Mostrar opciones si el mensaje es del bot y tiene opciones */}
            {message.sender === 'bot' &&
              message.options &&
              message.options.length > 0 && (
                <div className='message-options'>
                  {message.options.map((option) => (
                    <button
                      key={option.id}
                      className='option-button'
                      onClick={() => handleOptionClick(option)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
          </div>
        ))}
        <div ref={messagesEndReference} />
      </div>

      <div className='chat-input'>
        <textarea
          value={inputMessage}
          onChange={(event) => setInputMessage(event.target.value)}
          onKeyPress={handleKeyPress}
          placeholder='Escribe un mensaje...'
          rows={1}
        />
        <button
          onClick={handleSendMessage}
          disabled={!inputMessage.trim() || isTyping}
          className='send-button'
          style={{
            background: botInfo?.color
              ? `linear-gradient(135deg, ${botInfo.color} 0%, ${adjustColor(
                  botInfo.color,
                  30,
                )} 100%)`
              : 'var(--primary-gradient)',
          }}
        >
          <Send size={20} />
        </button>
      </div>

      <div className='chat-powered-by'>
        <span>Powered by</span>
        <strong>Plubot</strong>
        <Zap size={14} />
      </div>
    </div>
  );
};

// Función para ajustar el color (aclarar u oscurecer)
function adjustColor(color, amount) {
  // Si no hay color, devolver el color por defecto
  if (!color) return '#00f2fe';

  // Eliminar el # si existe
  color = color.replace('#', '');

  // Convertir a valores RGB
  let r = Number.parseInt(color.slice(0, 2), 16);
  let g = Number.parseInt(color.slice(2, 4), 16);
  let b = Number.parseInt(color.slice(4, 6), 16);

  // Ajustar los valores
  r = Math.min(255, Math.max(0, r + amount));
  g = Math.min(255, Math.max(0, g + amount));
  b = Math.min(255, Math.max(0, b + amount));

  // Convertir de nuevo a hexadecimal
  const rHex = r.toString(16).padStart(2, '0');
  const gHex = g.toString(16).padStart(2, '0');
  const bHex = b.toString(16).padStart(2, '0');
  return `#${rHex}${gHex}${bHex}`;
}

export default PublicChat;
