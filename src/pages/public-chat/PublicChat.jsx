import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Send, Loader, MessageCircle, ArrowLeft, Zap } from 'lucide-react';
import './PublicChat.css';
import instance from '../../utils/axiosConfig';

const PublicChat = () => {
  const { publicId } = useParams();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [botInfo, setBotInfo] = useState(null);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const [currentFlowId, setCurrentFlowId] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  // La URL base del backend ya está configurada en la instancia central de Axios.
  // Cargar información del bot al montar el componente
  useEffect(() => {
    const fetchBotInfo = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!publicId || publicId === 'undefined' || publicId === 'null') {
          throw new Error('ID de chatbot inválido');
        }
        if (isNaN(parseInt(publicId))) {
          throw new Error('El ID del chatbot debe ser un número');
        }

        // Usar la instancia de Axios centralizada. La URL se resuelve automáticamente.
        const response = await instance.get(`/plubots/chat/${publicId}`);
        const data = response.data;

        if (data.status === 'success') {
          setBotInfo(data.data);
          const welcomeMessage = {
            id: 'welcome',
            text: data.data.initialMessage,
            sender: 'bot',
            timestamp: new Date().toISOString()
          };
          setMessages([welcomeMessage]);
        } else {
          throw new Error(data.message || 'No se pudo cargar la información del chatbot');
        }

      } catch (error) {
        let errorMessage = 'Error de conexión. Por favor, intenta más tarde.';
        if (error.response) {
          if (error.response.status === 404) {
            errorMessage = 'El chatbot que buscas no existe o ha sido movido.';
          } else if (error.response.status >= 500) {
            errorMessage = 'Estamos experimentando problemas en el servidor. Intenta de nuevo en unos minutos.';
          } else {
            errorMessage = error.response.data?.message || 'Error al contactar al servidor.';
          }
        } else if (error.request) {
          errorMessage = 'No se pudo conectar con el servidor. Revisa tu conexión a internet.';
        } else {
          errorMessage = error.message || 'Ocurrió un error inesperado.';
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
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    const newConversationHistory = [...conversationHistory, { role: 'user', content: inputMessage }];
    setConversationHistory(newConversationHistory);
    setInputMessage('');
    setIsTyping(true);

    try {
      const payload = {
        message: inputMessage,
        conversation_history: newConversationHistory,
        flow_id: currentFlowId
      };

      // Usar la instancia de Axios centralizada. La URL se resuelve automáticamente.
      const response = await instance.post(`/plubots/chat/${publicId}/message`, payload);
      const data = response.data;

      if (data.status === 'success') {
        const botResponse = {
          id: `bot-${Date.now()}`,
          text: data.data.response,
          sender: 'bot',
          timestamp: new Date().toISOString(),
          options: data.data.options || []
        };
        setMessages(prev => [...prev, botResponse]);
        setConversationHistory(prev => [...prev, { role: 'assistant', content: data.data.response }]);
        setCurrentFlowId(data.data.next_flow_id);
      } else {
        throw new Error(data.message || 'Error en la respuesta del bot');
      }
    } catch (error) {
      const errorMessageText = error.response?.data?.message || 'No se pudo obtener una respuesta. Inténtalo de nuevo.';

      // Eliminar indicador de escritura
      setIsTyping(false);
      setMessages(prev => prev.filter(msg => msg.id !== 'typing'));

      // Añadir mensaje de error
      const errorMessage = {
        id: `error-${Date.now()}`,
        text: 'Lo siento, ha ocurrido un error al procesar tu mensaje. Por favor, intenta de nuevo más tarde.',
        sender: 'bot',
        isError: true,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleOptionClick = (option) => {
    // Establecer el mensaje de la opción seleccionada como mensaje de entrada
    setInputMessage(option.message);
    // Enviar el mensaje automáticamente
    handleSendMessage();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Función para obtener la inicial del nombre del bot
  const getBotInitial = () => {
    if (!botInfo || !botInfo.name) return 'P';
    return botInfo.name.charAt(0).toUpperCase();
  };

  // Función para formatear la hora
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (isLoading) {
    return (
      <div className="public-chat-container loading">
        <div className="loading-spinner">
          <Loader size={40} className="spinner" />
          <p>Cargando chatbot...</p>
        </div>
      </div>
    );
  }

  if (error && !botInfo) {
    return (
      <div className="public-chat-container error">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            <ArrowLeft size={16} />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`public-chat-container ${botInfo?.embedConfig?.theme || 'light'}`}>
      <div className="chat-header" style={{ 
        background: botInfo?.color 
          ? `linear-gradient(135deg, ${botInfo.color} 0%, ${adjustColor(botInfo.color, 30)} 100%)` 
          : 'var(--primary-gradient)' 
      }}>
        <div className="chat-header-avatar">
          {botInfo?.avatar ? (
            <img src={botInfo.avatar} alt={botInfo.name} />
          ) : (
            getBotInitial()
          )}
        </div>
        <h2>{botInfo?.name || 'Chat'}</h2>
        <div className="chat-header-status">
          <span className="status-dot"></span>
          <span>En línea</span>
        </div>
      </div>
      
      <div className="chat-messages">
        {messages.map(message => (
          <div 
            key={message.id} 
            className={`message ${message.sender} ${message.isTyping ? 'typing' : ''} ${message.isError ? 'error' : ''}`}
          >
            {message.sender === 'bot' && !message.isTyping && (
              <div className="message-avatar">
                {getBotInitial()}
              </div>
            )}
            <div className="message-bubble">
              <div className="message-content">
                {message.isTyping ? (
                  <>
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                  </>
                ) : (
                  message.text
                )}
              </div>
              <div className="message-timestamp">
                {formatTime(message.timestamp)}
              </div>
            </div>
            
            {/* Mostrar opciones si el mensaje es del bot y tiene opciones */}
            {message.sender === 'bot' && message.options && message.options.length > 0 && (
              <div className="message-options">
                {message.options.map(option => (
                  <button 
                    key={option.id} 
                    className="option-button"
                    onClick={() => handleOptionClick(option)}
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
      
      <div className="chat-input">
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Escribe un mensaje..."
          rows={1}
        />
        <button 
          onClick={handleSendMessage}
          disabled={!inputMessage.trim() || isTyping}
          className="send-button"
          style={{ 
            background: botInfo?.color 
              ? `linear-gradient(135deg, ${botInfo.color} 0%, ${adjustColor(botInfo.color, 30)} 100%)` 
              : 'var(--primary-gradient)' 
          }}
        >
          <Send size={20} />
        </button>
      </div>
      
      <div className="chat-powered-by">
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
  let r = parseInt(color.substring(0, 2), 16);
  let g = parseInt(color.substring(2, 4), 16);
  let b = parseInt(color.substring(4, 6), 16);
  
  // Ajustar los valores
  r = Math.min(255, Math.max(0, r + amount));
  g = Math.min(255, Math.max(0, g + amount));
  b = Math.min(255, Math.max(0, b + amount));
  
  // Convertir de nuevo a hexadecimal
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export default PublicChat;
