import React, { useState, useEffect, useRef } from 'react';
import './ByteEmbajador.css';
import byteNormal from '@/assets/img/byte-normal.png';
import byteHappy from '@/assets/img/byte-happy.png';
import byteSad from '@/assets/img/byte-sad.png';
import byteThinking from '@/assets/img/byte-thinking.png';
import byteWarning from '@/assets/img/byte-warning.png';

const AboutChatByte = () => {
  const [messages, setMessages] = useState([
    { text: '¡Hola! Soy Byte, tu guía en Plubot. Pregúntame sobre qué es Plubot o cómo crear asistentes digitales.', sender: 'byte', type: 'info', id: Date.now() }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [byteState, setByteState] = useState('normal');
  const [showParticles, setShowParticles] = useState(false);
  const [byteActive, setByteActive] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const particlesRef = useRef(null);
  const canvasRef = useRef(null);

  // Auto scroll to the latest message within the chat container
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Animation entrance effect
  useEffect(() => {
    setTimeout(() => {
      setByteActive(true);
    }, 300);
  }, []);

  // Canvas animation for cyber particles
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const particles = [];
    
    // Set canvas to full container size
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    class Particle {
      constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 2 - 1;
        this.speedY = Math.random() * 2 - 1;
        this.color = color;
        this.ttl = 150 + Math.random() * 100; // time to live
        this.life = 0;
        this.opacity = 1;
      }
      
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life++;
        
        if (this.life > this.ttl * 0.7) {
          this.opacity = 1 - (this.life - this.ttl * 0.7) / (this.ttl * 0.3);
        }
        
        return this.life < this.ttl;
      }
      
      draw() {
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    
    const generateParticles = (x, y, color, count = 8) => {
      for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color));
      }
    };
    
    const lastMessageType = messages[messages.length - 1]?.type || 'info';
    const color = getTypeColor(lastMessageType);
    
    let animationId;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Generate particles around the byte image
      if (showParticles && particlesRef.current) {
        const rect = particlesRef.current.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        
        const centerX = rect.left + rect.width / 2 - canvasRect.left;
        const centerY = rect.top + rect.height / 2 - canvasRect.top;
        
        if (Math.random() > 0.7) {
          generateParticles(
            centerX + (Math.random() * 80 - 40),
            centerY + (Math.random() * 80 - 40),
            color
          );
        }
      }
      
      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        if (!particles[i].update()) {
          particles.splice(i, 1);
          i--;
          continue;
        }
        particles[i].draw();
      }
      
      animationId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [showParticles, messages]);

  // Determine Byte's image based on state
  const getByteImage = () => {
    switch (byteState) {
      case 'happy': return byteHappy;
      case 'sad': return byteSad;
      case 'warning': return byteWarning;
      case 'thinking': return byteThinking;
      default: return byteNormal;
    }
  };

  // Determine color based on message type
  const getTypeColor = (messageType) => {
    switch (messageType) {
      case 'error': return '#ff2e5b';
      case 'success': return '#00ff9d';
      case 'warning': return '#ffb700';
      default: return '#00e0ff';
    }
  };

  // Add a message to the conversation
  const addMessage = (text, sender, messageType = 'info') => {
    setMessages(prev => [...prev, { text, sender, type: messageType, id: Date.now() }]);
  };

  // Send message to Byte Embajador API
  const sendToByteEmbajador = async (userMessage) => {
    setIsLoading(true);
    setByteState('thinking');
    setShowParticles(true);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
      const response = await fetch(`${API_BASE_URL}/api/byte-embajador`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          context: 'Providing information about Plubot, its features, and how to create digital assistants.',
          history: messages.slice(-10)
        }),
      });

      if (!response.ok) {
        throw new Error(`Error communicating with Byte Embajador: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Create delay effect for more natural response
      setTimeout(() => {
        addMessage(data.message, 'byte', 'info');
        setByteState(data.sentiment || 'happy');
        
        // Keep particles for a moment after response
        setTimeout(() => {
          setShowParticles(false);
        }, 2000);
      }, 600);

    } catch (error) {
      console.error('Error:', error);
      addMessage(`¡Ups! ${error.message || 'Something went wrong. Please try again.'}`, 'byte', 'error');
      setByteState('sad');
      setShowParticles(false);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 600);
    }
  };

  // Handle user message submission
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    // Create ripple effect on send
    const btn = e.currentTarget.querySelector('button');
    if (btn) {
      const circle = document.createElement('span');
      const diameter = Math.max(btn.clientWidth, btn.clientHeight);
      
      circle.style.width = circle.style.height = `${diameter}px`;
      circle.style.left = `${e.clientX - btn.getBoundingClientRect().left - diameter / 2}px`;
      circle.style.top = `${e.clientY - btn.getBoundingClientRect().top - diameter / 2}px`;
      circle.classList.add('ripple');
      
      const ripple = btn.getElementsByClassName('ripple')[0];
      if (ripple) {
        ripple.remove();
      }
      
      btn.appendChild(circle);
    }

    addMessage(userInput, 'user');
    sendToByteEmbajador(userInput);
    setUserInput('');
  };

  return (
    <div className={`about-chat-byte-container ${byteActive ? 'active' : ''}`}>
      <canvas ref={canvasRef} className="particle-canvas"></canvas>
      <div className="byte-image-column">
        <div className="byte-image-wrapper" ref={particlesRef}>
          <div className="byte-hologram-effect"></div>
          <img
            src={getByteImage()}
            alt="Byte Assistant"
            className={`byte-image ${isLoading ? 'byte-thinking' : ''}`}
          />
          <div
            className={`byte-glow ${showParticles ? 'glow-active' : ''}`}
            style={{
              boxShadow: `0 0 15px ${getTypeColor(messages[messages.length - 1]?.type)}, 0 0 30px ${getTypeColor(messages[messages.length - 1]?.type)}`
            }}
          ></div>
        </div>
      </div>
      <div className="chat-column">
        <div className="digital-noise"></div>
        <div className="chat-header">
          <div className="header-decoration">
            <span></span><span></span><span></span>
          </div>
          <h2>Chatea con Byte</h2>
          <p>¡Pregunta sobre Plubot y cómo crear tus propios asistentes digitales!</p>
        </div>
        <div className="chat-messages" ref={messagesContainerRef}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`message-bubble message-${msg.sender} message-type-${msg.type}`}
              style={{
                borderColor: msg.sender === 'byte' ? getTypeColor(msg.type) : undefined,
                boxShadow: msg.sender === 'byte' ? `0 0 8px ${getTypeColor(msg.type)}` : undefined
              }}
            >
              <p>{msg.text}</p>
              <div className="message-glow"></div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSendMessage} className="chat-input-container">
          <input
            type="text"
            className="chat-input"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Pregunta a Byte sobre Plubot..."
            disabled={isLoading}
          />
          <button
            type="submit"
            className="chat-send-btn"
            disabled={isLoading || !userInput.trim()}
          >
            {isLoading ? (
              <span className="loader"></span>
            ) : (
              <>Enviar<span className="btn-glow"></span></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AboutChatByte;