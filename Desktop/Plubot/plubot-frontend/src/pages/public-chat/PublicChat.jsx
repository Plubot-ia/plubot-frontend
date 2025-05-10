import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Send, Loader, MessageCircle, ArrowLeft, Zap } from 'lucide-react';
import './PublicChat.css';

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

  // Función para añadir logs en la consola
  const logDebug = (message, data) => {
    console.log(`[PublicChat] ${message}`, data || '');
  };

  // Cargar información del bot al montar el componente
  useEffect(() => {
    const fetchBotInfo = async () => {
      try {
        setIsLoading(true);
        logDebug(`Cargando chatbot con ID: ${publicId}`);
        
        // Usar la ruta correcta del backend
        const response = await fetch(`/api/plubots/chat/${publicId}`);
        const data = await response.json();
        
        logDebug('Respuesta del backend:', data);
        
        if (data.status === 'success') {
          setBotInfo(data.data);
          // Añadir mensaje inicial del bot
          const welcomeMessage = {
            id: 'welcome',
            text: data.data.initialMessage,
            sender: 'bot',
            timestamp: new Date().toISOString()
          };
          
          setMessages([welcomeMessage]);
          logDebug('Mensaje de bienvenida establecido:', welcomeMessage);
        } else {
          setError(data.message || 'No se pudo cargar el chatbot');
          logDebug('Error cargando el chatbot:', data.message);
        }
      } catch (error) {
        console.error('Error cargando el chatbot:', error);
        setError('Error de conexión. Por favor, intenta más tarde.');
        logDebug('Error de conexión:', error);
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
    
    // Añadir mensaje del usuario
    const userMessage = {
      id: `user-${Date.now()}`,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date().toISOString()
    };
    
    logDebug('Enviando mensaje del usuario:', userMessage);
    setMessages(prev => [...prev, userMessage]);
    
    const currentInputMessage = inputMessage;
    setInputMessage('');
    
    // Mostrar indicador de "escribiendo..."
    setIsTyping(true);
    const typingIndicator = {
      id: 'typing',
      text: '',
      sender: 'bot',
      isTyping: true,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, typingIndicator]);
    
    try {
      // Preparar los datos para enviar al backend
      const requestData = {
        message: currentInputMessage
      };
      
      // Solo incluir current_flow_id si existe
      if (currentFlowId) {
        requestData.current_flow_id = currentFlowId;
      }
      
      // Solo incluir conversation_history si tiene elementos
      if (conversationHistory.length > 0) {
        requestData.conversation_history = conversationHistory;
      }
      
      logDebug('Datos a enviar al backend:', requestData);
      
      // Usar la ruta correcta del backend
      const response = await fetch(`/api/plubots/chat/${publicId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      const data = await response.json();
      logDebug('Respuesta del backend:', data);
      
      // Eliminar indicador de escritura
      setIsTyping(false);
      setMessages(prev => prev.filter(msg => msg.id !== 'typing'));
      
      if (data.status === 'success') {
        // Actualizar el estado con los datos del backend
        if (data.current_flow_id) {
          logDebug('Actualizando current_flow_id:', data.current_flow_id);
          setCurrentFlowId(data.current_flow_id);
        }
        
        if (data.conversation_history) {
          logDebug('Actualizando conversation_history:', data.conversation_history);
          setConversationHistory(data.conversation_history);
        }
        
        // Añadir respuesta del bot
        const botMessage = {
          id: `bot-${Date.now()}`,
          text: data.response,
          sender: 'bot',
          timestamp: new Date().toISOString(),
          options: data.options || []
        };
        
        logDebug('Añadiendo respuesta del bot:', botMessage);
        setMessages(prev => [...prev, botMessage]);
      } else {
        // Mostrar mensaje de error
        setError(data.message || 'Error en la respuesta del servidor');
        logDebug('Error en la respuesta:', data.message);
        
        // Añadir mensaje de error como mensaje del bot
        const errorMessage = {
          id: `error-${Date.now()}`,
          text: 'Lo siento, ha ocurrido un error al procesar tu mensaje. Por favor, intenta de nuevo más tarde.',
          sender: 'bot',
          isError: true,
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      logDebug('Error de conexión:', error);
      
      // Eliminar indicador de escritura
      setIsTyping(false);
      setMessages(prev => prev.filter(msg => msg.id !== 'typing'));
      
      // Mostrar error
      setError('Error de conexión. Por favor, intenta más tarde.');
      
      // Añadir mensaje de error como mensaje del bot
      const errorMessage = {
        id: `error-${Date.now()}`,
        text: 'Lo siento, ha ocurrido un error de conexión. Por favor, verifica tu conexión a internet e intenta de nuevo.',
        sender: 'bot',
        isError: true,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleOptionClick = (option) => {
    logDebug('Opción seleccionada:', option);
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
