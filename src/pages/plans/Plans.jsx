import { motion } from 'framer-motion';
import React, { useRef, useEffect, useState, useMemo } from 'react';

import logo from '@assets/img/logo.svg';

import useWindowSize from '../../hooks/useWindowSize';

import './Plans.css';

export default function Plans() {
  const { width } = useWindowSize();
  const [isVisible, setIsVisible] = useState(false);
  const [activePlan, setActivePlan] = useState(null);
  const particlesContainerReference = useRef(null);
  const plansSectionReference = useRef(null);

  useEffect(() => {
    const element = plansSectionReference.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.2, rootMargin: '50px' },
    );

    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, []);

  const createParticlesBurst = (x, y) => {
    if (!particlesContainerReference.current || !isVisible) return;

    const particleCount = (width || 0) < 768 ? 2 : 3;

    for (let index = 0; index < particleCount; index++) {
      const particle = document.createElement('div');
      particle.classList.add('interactive-particle');

      const rect = particlesContainerReference.current.getBoundingClientRect();
      const relX = Math.max(0, Math.min(x - rect.left, rect.width));
      const relY = Math.max(0, Math.min(y - rect.top, rect.height));

      particle.style.left = `${relX}px`;
      particle.style.top = `${relY}px`;

      const hue = Math.floor(Math.random() * 40) + 180;
      particle.style.backgroundColor = `hsl(${hue}, 100%, 70%)`;

      const size =
        (width || 0) < 768 ? Math.random() * 3 + 2 : Math.random() * 4 + 3;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;

      particlesContainerReference.current.append(particle);

      requestAnimationFrame(() => {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 30 + 15;
        const xEnd = Math.cos(angle) * distance;
        const yEnd = Math.sin(angle) * distance;

        particle.style.transform = `translate(${xEnd}px, ${yEnd}px)`;
        particle.style.opacity = '0';
      });

      setTimeout(() => {
        if (particlesContainerReference.current && particle.parentNode) {
          particle.remove();
        }
      }, 600);
    }
  };

  const handleClick = (e) => {
    if (!isVisible) return;
    createParticlesBurst(e.clientX, e.clientY);
  };

  const handlePlanHover = (index) => {
    setActivePlan(index);
  };

  const plans = [
    {
      name: 'Plan Despierto',
      tagline: 'Free',
      price: 'Gratis',
      icon: '🚀',
      idealFor: 'Ideal para probar y familiarizarse',
      features: [
        '1 Plubot Despierto activo',
        'Respuestas ilimitadas en chat web',
        'Flujos básicos (10 nodos)',
        'Personalidades básicas',
        'Editor visual de flujos',
        'Estadísticas simples',
        'Acceso básico al Pluniverse',
      ],
    },
    {
      name: 'Plan Poder Inicial',
      tagline: 'Popular',
      price: 'USD 14 / mes',
      icon: '⚡️',
      idealFor: 'Ideal para emprendedores y startups',
      features: [
        '3 Plubots activos',
        'Chat web + WhatsApp Business',
        'Flujos de hasta 50 nodos',
        'Personalidades avanzadas',
        '3 Integraciones (WhatsApp, Notion, Calendly)',
        'Estadísticas avanzadas',
        'Pluniverse completo hasta nivel 5',
      ],
    },
    {
      name: 'Plan Maestro',
      tagline: 'Pro',
      price: 'USD 29 / mes',
      icon: '✨',
      idealFor: 'Ideal para agencias y marcas',
      features: [
        '10 Plubots activos',
        'Multi-canal: Web, WhatsApp, Instagram, Telegram',
        'Flujos ilimitados',
        'Personalidades premium',
        'Todas las integraciones (Stripe, Shopify, Trello, Gmail)',
        'Reportes avanzados exportables',
        'Zonas exclusivas del Pluniverse',
      ],
    },
    {
      name: 'Plan Legendario',
      tagline: 'Enterprise',
      price: 'USD 59 / mes',
      icon: '👑',
      idealFor: 'Ideal para empresas y proyectos escalables',
      features: [
        'Plubots ilimitados',
        'Integraciones ilimitadas',
        'Funciones beta exclusivas',
        'Personalización de marca completa',
        'Funcionalidad white-label',
        'API de reportes',
        'Soporte VIP y consultoría mensual',
      ],
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.07,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100, damping: 12 },
    },
  };

  const isLowPerfDevice = useMemo(() => {
    const mobileUserAgent =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    return (
      (width || 0) < 768 ||
      mobileUserAgent.test(navigator.userAgent) ||
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4)
    );
  }, [width]);

  const particles = useMemo(
    () =>
      Array.from({ length: isLowPerfDevice ? 3 : 6 }).map((_, index) => ({
        id: index,
      })),
    [isLowPerfDevice],
  );

  return (
    <div className='plans-wrapper' ref={plansSectionReference}>
      <motion.div
        className='plans-page'
        onClick={handleClick}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        {!isLowPerfDevice && (
          <div className='cosmic-lights'>
            <div className='light-beam light-beam-1' />
            <div className='light-beam light-beam-2' />
            <div className='light-beam light-beam-3' />
          </div>
        )}

        <div className='particles' ref={particlesContainerReference}>
          {isVisible &&
            particles.map((particle) => (
              <div
                key={particle.id}
                className={`particle particle-${particle.id + 1}`}
              />
            ))}
        </div>

        <motion.div
          className='plans-container'
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <motion.div
            className='plans-header'
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h1 className='plans-title'>
              Planes de Plubot
              <img src={logo} alt='Plubot Logo' className='faq-title-logo' />
            </h1>
            <div className='plans-subtitle-container'>
              <p className='plans-subtitle'>
                Elige el plan que mejor se adapte a tus necesidades
              </p>
              <div className='plans-subtitle-line' />
            </div>
          </motion.div>

          <motion.div
            className='plans-grid'
            variants={containerVariants}
            initial='hidden'
            animate={isVisible ? 'visible' : 'hidden'}
          >
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                className={`plan-card ${activePlan === index ? 'plan-card-active' : ''}`}
                variants={itemVariants}
                onMouseEnter={() => handlePlanHover(index)}
                onMouseLeave={() => handlePlanHover(null)}
                whileHover={{
                  scale: isLowPerfDevice ? 1.01 : 1.03,
                  y: isLowPerfDevice ? -2 : -5,
                  transition: { type: 'spring', stiffness: 400, damping: 17 },
                }}
                whileTap={{ scale: 0.98 }}
              >
                {plan.tagline && <div className='plan-tag'>{plan.tagline}</div>}
                <div className='plan-header'>
                  <div className='plan-icon-container'>
                    <span className='plan-icon'>{plan.icon}</span>
                  </div>
                  <h2 className='plan-name'>{plan.name}</h2>
                  <p className='plan-price'>{plan.price}</p>
                </div>

                <ul className='plan-features'>
                  {plan.features.map((feature) => (
                    <li
                      key={`${plan.name}-${feature}`}
                      className='plan-feature'
                    >
                      {feature}
                    </li>
                  ))}
                </ul>

                {plan.idealFor && (
                  <p className='plan-ideal-for'>{plan.idealFor}</p>
                )}

                <motion.button
                  className='plan-button'
                  whileHover={{
                    scale: 1.05,
                    boxShadow: '0 0 15px rgba(0, 224, 255, 0.8)',
                  }}
                  whileTap={{ scale: 0.97 }}
                >
                  Seleccionar Plan
                </motion.button>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className='plans-cta'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <h3 className='plans-cta-title'>
              ¿No estás seguro? Prueba gratis por 14 días
            </h3>
            <p className='plans-cta-text'>
              Actualiza, cambia o cancela en cualquier momento. Sin compromisos.
            </p>
            <motion.button
              className='plans-cta-button'
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
            >
              Iniciar prueba gratuita
            </motion.button>
          </motion.div>

          <motion.div
            className='plans-notes'
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 10 }}
            transition={{ duration: 0.4, delay: 0.8 }}
          >
            <h3>Notas:</h3>
            <ul>
              <li>
                Se cobrará por uso de API externas como WhatsApp Business API
                (Twilio o 360Dialog) al costo que ellas indiquen.
              </li>
              <li>Planes anuales disponibles con 20% de descuento.</li>
              <li>
                Plucoins y marketplace funcionan aparte con sus propias compras.
              </li>
            </ul>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
