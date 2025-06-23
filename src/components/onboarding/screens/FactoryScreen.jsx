import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { usePlubotCreation } from '@/context/PlubotCreationContext.jsx';
import Particles from '@tsparticles/react';
import plubotImage from '@/assets/img/plubot.svg';
import './FactoryScreen.css';

const FactoryScreen = () => {
  const [currentMessage, setCurrentMessage] = useState('');
  const messages = [
    "¡Hola, Creador!",
    "Bienvenido a la Fábrica de Bots",
    "Es hora de crear tu asistente personal"
  ];
  const [messageIndex, setMessageIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const navigate = useNavigate();
  const { nextStep } = usePlubotCreation();

  // Efecto de typewriter para mensajes de Plubot
  useEffect(() => {
    if (isTyping) {
      if (currentMessage.length < messages[messageIndex].length) {
        const timeout = setTimeout(() => {
          setCurrentMessage(messages[messageIndex].substring(0, currentMessage.length + 1));
        }, 50);
        return () => clearTimeout(timeout);
      } else {
        setIsTyping(false);
        const timeout = setTimeout(() => {
          if (messageIndex < messages.length - 1) {
            setMessageIndex(messageIndex + 1);
            setCurrentMessage('');
            setIsTyping(true);
          }
        }, 2000);
        return () => clearTimeout(timeout);
      }
    }
  }, [currentMessage, messageIndex, isTyping, messages]);

  const handleNext = () => {
    nextStep();
    navigate('/personalization');
  };

  const particlesInit = async (engine) => {
    const { loadSlim } = await import('@tsparticles/slim');
    await loadSlim(engine);

  };

  return (
    <div className="factory-screen">
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={{
          fullScreen: { enable: true },
          background: {
            color: {
              value: "#000"
            }
          },
          particles: {
            number: { value: 80 },
            color: { value: ["#00e0ff", "#ff00ff"] },
            shape: { type: "circle" },
            opacity: { value: 0.4, random: true },
            size: { value: { min: 1, max: 5 }, random: true },
            move: { 
              enable: true, 
              speed: 1, 
              direction: "none",
              outModes: "out"
            },
            links: {
              enable: true,
              distance: { min: 100, max: 200 },
              color: "#00e0ff",
              opacity: 0.2,
              width: 1,
            }
          },
          responsive: [
            {
              breakpoint: 768,
              options: {
                particles: {
                  number: { value: 40 },
                  size: { value: { min: 0.5, max: 3 } },
                  links: { distance: { min: 50, max: 100 } }
                }
              }
            }
          ]
        }}
      />

      <div className="cosmic-grid">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="grid-line" style={{ top: `${5 * (i + 1)}%` }}></div>
        ))}
      </div>

      <motion.div 
        className="factory-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      >
        <motion.div 
          className="plubot-section"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <motion.div 
            className="plubot-hologram"
            animate={{ 
              y: [0, -10, 0],
              rotateY: [0, 5, 0, -5, 0]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 4,
              ease: "easeInOut"
            }}
          >
            <div className="hologram-circles">
              <div className="hologram-circle circle1"></div>
              <div className="hologram-circle circle2"></div>
              <div className="hologram-circle circle3"></div>
            </div>
            <motion.img 
              src={plubotImage} 
              alt="Plubot"
              className="plubot-image"
              style={{ width: '100%', height: '100%' }}
            />
          </motion.div>
          
          <motion.div className="message-box">
            <div className="message-header">
              <div className="message-dots">
                <div className="message-dot"></div>
                <div className="message-dot"></div>
                <div className="message-dot"></div>
              </div>
              <div className="message-title">PLUBOT v1.0</div>
            </div>
            <div className="message-content">
              <span className="cursor">&gt;</span> {currentMessage}
              <span className="blink">_</span>
            </div>
          </motion.div>
        </motion.div>

        <motion.div 
          className="creation-panel"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
        >
          <h1 className="panel-title">Fábrica de Bots</h1>
          <div className="panel-description">
            Diseña y crea tu asistente digital personalizado que trabajará contigo y para ti.
          </div>
          
          <div className="feature-cards">
            <motion.div 
              className="feature-card"
              whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(0, 224, 255, 0.8)" }}
            >
              <div className="feature-icon personality"></div>
              <div className="feature-name">Personalidad</div>
            </motion.div>
            
            <motion.div 
              className="feature-card"
              whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(0, 224, 255, 0.8)" }}
            >
              <div className="feature-icon skills"></div>
              <div className="feature-name">Habilidades</div>
            </motion.div>
            
            <motion.div 
              className="feature-card"
              whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(0, 224, 255, 0.8)" }}
            >
              <div className="feature-icon appearance"></div>
              <div className="feature-name">Apariencia</div>
            </motion.div>
          </div>
          
          <motion.button 
            className="create-button"
            onClick={handleNext}
            whileHover={{ scale: 1.05, boxShadow: "0 0 20px #00e0ff, 0 0 40px rgba(255, 0, 255, 0.5)" }}
            whileTap={{ scale: 0.95 }}
          >
            Iniciar Creación
            <div className="button-glow"></div>
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default FactoryScreen;