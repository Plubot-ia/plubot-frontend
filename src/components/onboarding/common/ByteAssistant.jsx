import React, { useState, useEffect, useRef } from 'react';
import './ByteAssistant.css';
import './fix-bubble.css'; // Fix para eliminar botones detrás de ByteAssistant
import byteNormal from '@/assets/img/byte-normal.png';
import byteHappy from '@/assets/img/byte-happy.png';
import byteSad from '@/assets/img/byte-sad.png';
import byteWarning from '@/assets/img/byte-warning.png';
import byteThinking from '@/assets/img/byte-thinking.png';

// Importar el store para acceder al modo Ultra Rendimiento
import useFlowStore from '@/stores/useFlowStore';

const ByteAssistant = ({ simulationMode }) => {
  // Obtener el estado de modo Ultra Rendimiento del store
  const isUltraMode = useFlowStore(state => state.isUltraMode);
  
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [messages, setMessages] = useState([
    {
      text: '¡Hola! Soy Byte, tu experto en nodos y flujos. Pregúntame lo que necesites.',
      sender: 'byte',
      type: 'info',
      id: 'initial-byte-message'
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [byteState, setByteState] = useState('normal');
  const messagesEndRef = useRef(null);

  // Auto scroll to the latest message - optimizado para modo Ultra Rendimiento
  useEffect(() => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement;
      setTimeout(() => {
        container.scrollTo({
          top: container.scrollHeight,
          // En modo Ultra Rendimiento, usar 'auto' en lugar de 'smooth' para evitar animaciones costosas
          behavior: isUltraMode ? 'auto' : 'smooth',
        });
      }, isUltraMode ? 10 : 100); // Reducir el retardo en modo Ultra Rendimiento
    }
  }, [messages, isUltraMode]);

  // Add a message to the conversation
  const addMessage = (text, sender, messageType = 'info') => {
    setMessages((prev) => [
      ...prev,
      {
        text,
        sender,
        type: messageType,
        id: Date.now(),
      },
    ]);
  };

  // Determine color based on message type
  const getTypeColor = (messageType) => {
    switch (messageType) {
      case 'error':
        return '#ff2e5b';
      case 'success':
        return '#00ff9d';
      case 'warning':
        return '#ffb700';
      default:
        return '#00e0ff';
    }
  };

  // Determine which Byte image to show based on state
  const getByteImage = () => {
    switch (byteState) {
      case 'happy':
        return byteHappy;
      case 'sad':
        return byteSad;
      case 'warning':
        return byteWarning;
      case 'thinking':
        return byteThinking;
      default:
        return byteNormal;
    }
  };

  // Simple sentiment analysis based on keywords
  const analyzeSentiment = (text) => {
    const lowerText = text.toLowerCase();
    const positiveKeywords = ['bien', 'genial', 'gracias', 'perfecto', 'excelente', 'feliz', 'listo', 'bueno', 'sí', 'claro'];
    const negativeKeywords = ['mal', 'error', 'problema', 'no', 'falla', 'duda', 'difícil', 'complicado'];

    let positiveScore = 0;
    let negativeScore = 0;

    positiveKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) positiveScore++;
    });
    negativeKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) negativeScore++;
    });

    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
  };

  // Send message to AI API
  const sendToAI = async (userMessage) => {
    setIsLoading(true);
    setByteState('thinking');

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
      const response = await fetch(`${API_BASE_URL}/api/byte-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          history: messages.slice(-10),
        }),
      });

      if (!response.ok) {
        throw new Error(`Error al comunicarse con Byte: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      addMessage(data.message, 'byte', 'success');

      // Analyze sentiment from user message and Byte's response
      const userSentiment = analyzeSentiment(userMessage);
      const byteSentiment = analyzeSentiment(data.message);
      const apiSentiment = data.sentiment || 'neutral';

      // Determine Byte's emotional state
      if (userSentiment === 'positive' || byteSentiment === 'positive') {
        setByteState('happy');
      } else if (userSentiment === 'negative' && byteSentiment === 'negative') {
        setByteState('sad');
      } else if (apiSentiment === 'warning') {
        setByteState('warning');
      } else {
        setByteState('normal');
      }
    } catch (error) {
      addMessage(
        `¡Ups! ${error.message || 'Parece que hay un cortocircuito en mi sistema. Intenta de nuevo.'}`,
        'byte',
        'error'
      );
      setByteState('sad');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle user message submission
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    addMessage(userInput, 'user', 'info');
    sendToAI(userInput);
    setUserInput('');
  };

  // Handle click on the image to toggle visibility or expansion
  const handleImageClick = () => {
    if (isVisible) {
      setIsVisible(false); // Minimize if currently visible
    } else {
      setIsVisible(true); // Expand if currently minimized
      setIsExpanded(!isExpanded); // Toggle expansion state
    }
  };

  if (!isVisible) {
    return (
      <div className="ts-byte-minimized" onClick={handleImageClick}>
        <img src={getByteImage()} alt="Byte asistente" className="ts-byte-icon-minimized" />
      </div>
    );
  }

  return (
    <div
      className={`ts-byte-assistant ${isAnimating && !isUltraMode ? 'ts-byte-animating' : ''} ${
        isExpanded ? 'ts-byte-expanded' : ''
      } ${simulationMode ? 'ts-byte-with-simulation' : ''} ${isUltraMode ? 'ts-byte-ultra-mode' : ''}`}
    >
      <div className="ts-byte-header">
        <div className="ts-byte-hologram">
          <div className="ts-byte-image-container" onClick={handleImageClick} style={{ cursor: 'pointer' }}>
            <img
              src={getByteImage()}
              alt="Byte asistente"
              className={`ts-byte-image ${isLoading && !isUltraMode ? 'ts-byte-thinking' : ''} ${isUltraMode ? 'ts-byte-static' : ''}`}
            />
            {/* Desactivar efecto de resplandor en modo Ultra Rendimiento o aplicar uno simple */}
            {!isUltraMode ? (
              <div
                className="ts-byte-glow"
                style={{
                  boxShadow: `0 0 10px ${getTypeColor('info')}, 0 0 20px ${getTypeColor('info')}`,
                }}
              ></div>
            ) : (
              <div 
                className="ts-byte-glow-simple"
                style={{
                  border: `1px solid ${getTypeColor('info')}`,
                }}
              ></div>
            )}
          </div>
        </div>
      </div>

      <div className="ts-byte-messages">
        <div className="ts-message-container">
          {messages.map((msg, index) => (
            <div
              key={msg.id || index}
              className={`ts-message-bubble ts-message-${msg.sender}`}
              style={{ borderColor: getTypeColor(msg.type) }}
            >
              <p>{msg.text}</p>
            </div>
          ))}
          {isLoading && (
            <div className="ts-message-bubble ts-message-byte">
              <p>Escribiendo...</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <form onSubmit={handleSendMessage} className="ts-byte-form">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Pregunta a Byte..."
          className="ts-byte-input"
          disabled={isLoading}
        />
        <button type="submit" className="ts-byte-submit" disabled={isLoading}>
          Enviar
        </button>
      </form>
    </div>
  );
};

export default ByteAssistant;