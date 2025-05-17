import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import plubotImage from '/src/assets/img/plubot.svg';
import './Home-hero.css';

const HomeHero = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false });
  const [isLoaded, setIsLoaded] = useState(false);
  const [startAnimations, setStartAnimations] = useState(false);

  // Preload plubot image
  useEffect(() => {
    const img = new Image();
    img.src = plubotImage;
    img.onload = () => {
      setIsLoaded(true);
    };
  }, []);

  // Start animations after critical content is loaded
  useEffect(() => {
    if (isLoaded) {
      // Small delay to prioritize LCP before starting animations
      const timer = setTimeout(() => {
        setStartAnimations(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoaded]);

  // Simplified animation variants - less CPU intensive initially
  const plubotVariants = {
    animate: {
      translateY: [0, -2, 0],
      scale: [1, 1.03, 1],
      transition: {
        translateY: {
          repeat: Infinity,
          duration: 3,
          ease: 'easeInOut',
          delay: 0.5, // Delay animation start
        },
        scale: {
          repeat: Infinity,
          duration: 3,
          ease: 'easeInOut',
          delay: 0.5, // Delay animation start
        },
      },
    },
    initial: { translateY: 0, scale: 1 },
  };

  // Delayed glitch animations
  const glitchCyanPlubotVariants = {
    animate: {
      translateY: [0, -2, 0],
      scale: [1, 1.02, 1],
      transition: {
        translateY: {
          repeat: Infinity,
          duration: 3,
          ease: 'easeInOut',
          delay: 0.6, // Increased delay
        },
        scale: {
          repeat: Infinity,
          duration: 3,
          ease: 'easeInOut',
          delay: 0.6, // Increased delay
        },
      },
    },
    initial: { translateY: 0, scale: 1 },
  };

  const glitchMagentaPlubotVariants = {
    animate: {
      translateY: [0, -2, 0],
      scale: [1, 1.01, 1],
      transition: {
        translateY: {
          repeat: Infinity,
          duration: 3,
          ease: 'easeInOut',
          delay: 0.7, // Increased delay
        },
        scale: {
          repeat: Infinity,
          duration: 3,
          ease: 'easeInOut',
          delay: 0.7, // Increased delay
        },
      },
    },
    initial: { translateY: 0, scale: 1 },
  };

  return (
    <section className="hero-section" ref={ref}>
      <div className="hero-content">
        {/* Preload critical text content for LCP */}
        <h1 className="hero-title">
          <span className="title-line">
            <motion.span
              className="title-part plubot-text plubot-animated"
              initial={{ opacity: 1 }} // Start fully visible for LCP
              variants={plubotVariants}
              animate={startAnimations && isInView ? 'animate' : 'initial'}
            >
              PLUBOT
              {startAnimations && (
                <>
                  <motion.span
                    className="glitch-layer glitch-layer-cyan plubot-glitch plubot-text"
                    aria-hidden="true"
                    variants={glitchCyanPlubotVariants}
                    animate={isInView ? 'animate' : 'initial'}
                    style={{ opacity: 0.5 }} // Reduced opacity
                  >
                    PLUBOT
                  </motion.span>
                  <motion.span
                    className="glitch-layer glitch-layer-magenta plubot-glitch plubot-text"
                    aria-hidden="true"
                    variants={glitchMagentaPlubotVariants}
                    animate={isInView ? 'animate' : 'initial'}
                    style={{ opacity: 0.4 }} // Reduced opacity
                  >
                    PLUBOT
                  </motion.span>
                  <span
                    className="glitch-layer plubot-glow plubot-text"
                    aria-hidden="true"
                  >
                    PLUBOT
                  </span>
                </>
              )}
            </motion.span>
          </span>
          <span className="title-line">
            <span className="title-part assistant-text">TU ASISTENTE DIGITAL</span>
          </span>
          <span className="title-line">
            <span className="title-part intelligent-text radiant">
              INTELIGENTE
            </span>
          </span>
          {startAnimations && (
            <>
              <span className="glitch-layer glitch-layer-cyan" aria-hidden="true">
                <span className="title-line glitch-plubot-line">
                  <motion.span
                    className="title-part plubot-text"
                    variants={glitchCyanPlubotVariants}
                    animate={isInView ? 'animate' : 'initial'}
                    style={{ opacity: 0.4 }} // Reduced opacity
                  >
                    PLUBOT
                  </motion.span>
                </span>
                <span className="title-line">
                  <span className="title-part assistant-text">TU ASISTENTE DIGITAL</span>
                </span>
                <span className="title-line">
                  <span className="title-part intelligent-text">INTELIGENTE</span>
                </span>
              </span>
              <span className="glitch-layer glitch-layer-magenta" aria-hidden="true">
                <span className="title-line glitch-plubot-line">
                  <motion.span
                    className="title-part plubot-text"
                    variants={glitchMagentaPlubotVariants}
                    animate={isInView ? 'animate' : 'initial'}
                    style={{ opacity: 0.3 }} // Reduced opacity
                  >
                    PLUBOT
                  </motion.span>
                </span>
                <span className="title-line">
                  <span className="title-part assistant-text">TU ASISTENTE DIGITAL</span>
                </span>
                <span className="title-line">
                  <span className="title-part intelligent-text">INTELIGENTE</span>
                </span>
              </span>
            </>
          )}
        </h1>
        <div className={`hero-subtitle-wrapper ${startAnimations ? 'animate' : ''}`}>
          <p className="hero-subtitle">
            <span className="subtitle-main">
              <span className="typing-main" key="typing-main">
                Automatiza tareas aburridas, responde por WhatsApp 24/7 y recupera tu tiempo.
              </span>
            </span>
          </p>
          <p className="hero-subtitle no-margin">
            <span className="subtitle-secondary">
              <span className="typing-secondary" key="typing-secondary">
                Sin código. En minutos.
              </span>
            </span>
          </p>
        </div>
        <Link to="/welcome" className="hero-button">
          Empieza gratis
        </Link>
      </div>
      <div className="hero-image-container">
        <img 
          src={plubotImage} 
          alt="Plubot" 
          className="hero-plubot" 
          loading="eager" 
          fetchpriority="high" 
        />
      </div>
    </section>
  );
};

export default HomeHero;