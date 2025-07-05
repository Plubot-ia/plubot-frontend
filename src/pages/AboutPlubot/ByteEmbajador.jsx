import React, { useState, useEffect, useRef } from 'react';

import './ByteEmbajador.css';
import byteHappy from '@/assets/img/byte-happy.png';
import byteNormal from '@/assets/img/byte-normal.png';
import byteSad from '@/assets/img/byte-sad.png';
import byteThinking from '@/assets/img/byte-thinking.png';
import byteWarning from '@/assets/img/byte-warning.png';

// Función de ayuda para generar números aleatorios más seguros
const secureRandom = () => {
  return crypto.getRandomValues(new Uint32Array(1))[0] / (2 ** 32 - 1);
};

// Helper functions moved up to solve unicorn/consistent-function-scoping lint error
const getTypeColor = (messageType) => {
  switch (messageType) {
    case 'error': {
      return '#ff2e5b';
    }
    case 'success': {
      return '#00ff9d';
    }
    case 'warning': {
      return '#ffb700';
    }
    default: {
      return '#00e0ff';
    }
  }
};

const fetchByteResponse = async (userMessage, messages) => {
  const API_BASE_URL =
    import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';
  const response = await fetch(`${API_BASE_URL}/byte-embajador`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: userMessage,
      context:
        'Providing information about Plubot, its features, and how to create digital assistants.',
      history: messages.slice(-10),
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Error communicating with Byte Embajador: ${response.statusText}`,
    );
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

const getByteImage = (state) => {
  switch (state) {
    case 'happy': {
      return byteHappy;
    }
    case 'sad': {
      return byteSad;
    }
    case 'warning': {
      return byteWarning;
    }
    case 'thinking': {
      return byteThinking;
    }
    default: {
      return byteNormal;
    }
  }
};

// Particle class for canvas animation, moved outside the component to prevent re-creation on renders.
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.size = secureRandom() * 3 + 1;
    this.speedX = secureRandom() * 2 - 1;
    this.speedY = secureRandom() * 2 - 1;
    this.color = color;
    this.ttl = 150 + secureRandom() * 100; // time to live
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

  draw(context) {
    context.globalAlpha = this.opacity;
    context.fillStyle = this.color;
    context.beginPath();
    context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = 1;
  }
}

const AboutChatByte = () => {
  const [messages, setMessages] = useState([
    {
      text: '¡Hola! Soy Byte, tu guía en Plubot. Pregúntame sobre qué es Plubot o cómo crear asistentes digitales.',
      sender: 'byte',
      type: 'info',
      id: Date.now(),
    },
  ]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [byteState, setByteState] = useState('normal');
  const [showParticles, setShowParticles] = useState(false);
  const [byteActive, setByteActive] = useState(false);
  const messagesEndReference = useRef(undefined);
  const messagesContainerReference = useRef(undefined);
  const particlesReference = useRef(undefined);
  const canvasReference = useRef(undefined);

  // Auto scroll to the latest message within the chat container
  useEffect(() => {
    if (messagesContainerReference.current) {
      const element = messagesContainerReference.current;
      element.scrollTop = element.scrollHeight;
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
    if (!canvasReference.current) return;

    const canvas = canvasReference.current;
    const context = canvas.getContext('2d');
    const particles = [];

    // Set canvas to full container size
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const generateParticles = (x, y, color, count = 8) => {
      for (let index = 0; index < count; index++) {
        particles.push(new Particle(x, y, color));
      }
    };

    const generateParticlesInCanvas = () => {
      if (!showParticles || !particlesReference.current) return;

      const rect = particlesReference.current.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2 - canvasRect.left;
      const centerY = rect.top + rect.height / 2 - canvasRect.top;

      if (secureRandom() > 0.7) {
        generateParticles(
          centerX + (secureRandom() * 80 - 40),
          centerY + (secureRandom() * 80 - 40),
          getTypeColor(messages.at(-1)?.type),
        );
      }
    };

    const updateAndDrawParticles = () => {
      for (let index = particles.length - 1; index >= 0; index--) {
        // eslint-disable-next-line security/detect-object-injection
        const p = particles[index]; // False positive: 'i' is a controlled loop index, not user input.
        if (p.update()) {
          p.draw(context);
        } else {
          particles.splice(index, 1);
        }
      }
    };

    let animationId;
    const animate = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      generateParticlesInCanvas();
      updateAndDrawParticles();
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [showParticles, messages]);

  // Add a message to the conversation
  const addMessage = (text, sender, messageType = 'info') => {
    setMessages((previous) => [
      ...previous,
      { text, sender, type: messageType, id: Date.now() },
    ]);
  };

  // Handles the successful response from the API to reduce nesting
  const handleSuccessfulResponse = (data) => {
    addMessage(data.message, 'byte', 'info');
    setByteState(data.sentiment || 'happy');

    // Keep particles for a moment after response
    setTimeout(() => {
      setShowParticles(false);
    }, 2000);
  };

  // Send message to Byte Embajador API
  const sendToByteEmbajador = async (userMessage) => {
    setIsLoading(true);
    setByteState('thinking');
    setShowParticles(true);

    try {
      const data = await fetchByteResponse(userMessage, messages);
      setTimeout(() => handleSuccessfulResponse(data), 600);
    } catch (error) {
      addMessage(
        `¡Ups! ${error.message || 'Something went wrong. Please try again.'}`,
        'byte',
        'error',
      );
      setByteState('sad');
      setShowParticles(false);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 600);
    }
  };

  // Handle user message submission
  const handleSendMessage = (event) => {
    event.preventDefault();
    if (!userInput.trim()) return;

    // Create ripple effect on send
    const button = event.currentTarget.querySelector('button');
    if (button) {
      const circle = document.createElement('span');
      const diameter = Math.max(button.clientWidth, button.clientHeight);

      circle.style.width = circle.style.height = `${diameter}px`;
      circle.style.left = `${event.clientX - button.getBoundingClientRect().left - diameter / 2}px`;
      circle.style.top = `${event.clientY - button.getBoundingClientRect().top - diameter / 2}px`;
      circle.classList.add('ripple');

      const [ripple] = button.querySelectorAll('.ripple'); // prefer-destructuring
      if (ripple) {
        ripple.remove();
      }

      button.append(circle);
    }

    addMessage(userInput, 'user');
    sendToByteEmbajador(userInput);
    setUserInput('');
  };

  return (
    <div className={`about-chat-byte-container ${byteActive ? 'active' : ''}`}>
      <canvas ref={canvasReference} className='particle-canvas' />
      <div className='byte-image-column'>
        <div className='byte-image-wrapper' ref={particlesReference}>
          <div className='byte-hologram-effect' />
          <img
            src={getByteImage(byteState)}
            alt='Byte Assistant'
            className={`byte-image ${isLoading ? 'byte-thinking' : ''}`}
          />
          <div
            className={`byte-glow ${showParticles ? 'glow-active' : ''}`}
            style={{
              boxShadow: `0 0 15px ${getTypeColor(
                messages.at(-1)?.type,
              )}, 0 0 30px ${getTypeColor(messages.at(-1)?.type)}`,
            }}
          />
        </div>
      </div>
      <div className='chat-column'>
        <div className='digital-noise' />
        <div className='chat-header'>
          <div className='header-decoration'>
            <span />
            <span />
            <span />
          </div>
          <h2>Chatea con Byte</h2>
          <p>
            ¡Pregunta sobre Plubot y cómo crear tus propios asistentes
            digitales!
          </p>
        </div>
        <div className='chat-messages' ref={messagesContainerReference}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message-bubble message-${message.sender} message-type-${message.type}`}
              style={{
                borderColor:
                  message.sender === 'byte'
                    ? getTypeColor(message.type)
                    : undefined,
                boxShadow:
                  message.sender === 'byte'
                    ? `0 0 8px ${getTypeColor(message.type)}`
                    : undefined,
              }}
            >
              <p>{message.text}</p>
              <div className='message-glow' />
            </div>
          ))}
          <div ref={messagesEndReference} />
        </div>
        <form onSubmit={handleSendMessage} className='chat-input-container'>
          <input
            type='text'
            className='chat-input'
            value={userInput}
            onChange={(event) => setUserInput(event.target.value)}
            placeholder='Pregunta a Byte sobre Plubot...'
            disabled={isLoading}
          />
          <button
            type='submit'
            className='chat-send-btn'
            disabled={isLoading || !userInput.trim()}
          >
            {isLoading ? (
              <span className='loader' />
            ) : (
              <>
                Enviar
                <span className='btn-glow' />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AboutChatByte;
