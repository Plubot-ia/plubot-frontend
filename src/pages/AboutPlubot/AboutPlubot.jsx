import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

import './AboutPlubot.css';
import epicImage from '@assets/img/plubot-core-full.webp';

const AboutPlubot = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const heroRef = useRef(null);
  const textRef = useRef(null);
  const isInView = useInView(textRef, { once: false, threshold: 0.2 });

  // Parallax effect
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const imageY = useTransform(scrollYProgress, [0, 1], [0, 100]);

  useEffect(() => {
    // Load optimization
    const img = new Image();
    img.src = epicImage;
    img.onload = () => setIsLoaded(true);

    // Add intersection observer for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsLoaded(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="about-plubot-container">
      <section ref={heroRef} className="about-hero">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 50 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ y: imageY }}
          className="image-container"
        >
          <img
            src={epicImage}
            alt="Plubot potencial"
            className="about-image"
            loading="lazy"
          />
          <div className="image-glow" />
        </motion.div>

        <motion.div
          ref={textRef}
          className="about-text"
          initial={{ opacity: 0, x: 20 }}
          animate={{
            opacity: isInView ? 1 : 0,
            x: isInView ? 0 : 20,
          }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : -20 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            ¿Qué es <span className="text-gradient">Plubot</span>?
          </motion.h1>

          {paragraphs.map((paragraph, index) => (
            <motion.p
              key={index}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 15 }}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
            >
              {paragraph}
            </motion.p>
          ))}

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: isInView ? 1 : 0, scale: isInView ? 1 : 0.9 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to="/byte-embajador" className="chat-byte-btn">
              <span className="btn-text">Chatea con Byte</span>
              <span className="btn-icon">→</span>
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
};

// Content moved to a constant for better maintainability
const paragraphs = [
  'En un mundo donde las tareas repetitivas nos consumen, PLUBOT nació para liberar. No es solo un chatbot: es tu asistente digital inteligente, creado por vos, a tu estilo. Automatiza tareas, responde en WhatsApp, conecta con tus clientes y evoluciona cada día.',
  'Desde su origen en el Pluniverse, PLUBOT crece con cada conversación. Es tu aliado 24/7, tu clon digital, tu compañero incansable.',
  'Crear uno es tan fácil como arrastrar y soltar. Tan poderoso como una mente enfocada. Y tan único como vos.',
  'PLUBOT. Tu asistente, tu estilo, tu universo.',
];

export default AboutPlubot;