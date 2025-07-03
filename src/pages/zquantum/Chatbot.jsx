import { useState } from 'react';

const Chatbot = () => {
  const [messages, setMessages] = useState([
    {
      id: `bot-${Date.now()}`,
      role: 'bot',
      text: '¡Hola! Soy Plubot, tu asistente virtual. ¿En qué puedo ayudarte hoy?',
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
  ]);
  const [input, setInput] = useState('');

  const handleSend = (event) => {
    event.preventDefault();
    if (!input.trim()) return;

    const newMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: input,
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setMessages([...messages, newMessage]);
    setInput('');
  };

  return (
    <section className='chatbot-section'>
      <div className='chatbot-container two-column'>
        <div className='chatbot-text-column'>
          <h1 className='chatbot-title' data-text='Prueba Plubot'>
            Prueba Plubot
          </h1>
          <p className='chatbot-subtitle'>
            Experimenta cómo nuestro chatbot puede transformar tu negocio con
            una integración perfecta en WhatsApp.
          </p>
        </div>
        <div className='chatbot-mobile-column'>
          <div className='large-mobile-frame'>
            <div className='mobile-device'>
              <div className='mobile-notch' />
              <div className='mobile-screen'>
                <div className='chatbot-widget active'>
                  <div className='chatbot-header whatsapp-header'>
                    <div className='whatsapp-contact'>
                      <div className='whatsapp-avatar'>
                        <i className='fab fa-whatsapp' />
                      </div>
                      <div className='whatsapp-info'>
                        <span className='whatsapp-name'>Plubot</span>
                        <span className='whatsapp-number'>
                          +54 9 11 1234-5678
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className='chatbot-body whatsapp-body'>
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`chatbot-message ${message.role}`}
                      >
                        <span className='message-text'>{message.text}</span>
                        <span className='message-meta'>
                          <span className='message-time'>{message.time}</span>
                          <span className='message-status'>
                            <i className='fas fa-check-double' />
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className='chatbot-input whatsapp-input'>
                    <div className='input-wrapper'>
                      <i
                        className='fas fa-smile input-icon'
                        aria-label='Añadir emoji'
                      />
                      <input
                        type='text'
                        placeholder='Escribe un mensaje'
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                        onKeyPress={(event) => {
                          if (event.key === 'Enter') {
                            handleSend(event);
                          }
                        }}
                      />
                    </div>
                    <button onClick={handleSend}>
                      <i className='fas fa-paper-plane' />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Chatbot;
