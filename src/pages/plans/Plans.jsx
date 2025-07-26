import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import React, { useRef, useEffect, useState, useMemo } from 'react';

import logo from '@assets/img/logo.svg';

import useWindowSize from '../../hooks/useWindowSize';

// Helper: Calcular posición relativa de partícula
const calculateRelativePosition = (x, y, containerRef) => {
  const rect = containerRef.current.getBoundingClientRect();
  return {
    x: x - (rect.left || 0),
    y: y - (rect.top || 0),
  };
};

// Helpers extraídos para configuración y animación de partículas
const configureParticleStyle = (particle, position, seedFactor, width) => {
  particle.style.left = `${position.x}px`;
  particle.style.top = `${position.y}px`;

  // Color determinístico
  const hue = 180 + (seedFactor % 40);
  particle.style.backgroundColor = `hsl(${hue}, 100%, 70%)`;

  // Tamaño determinístico
  const baseSize = (width || 0) < 768 ? 2 : 3;
  const sizeVariation = (width || 0) < 768 ? 3 : 4;
  const size = baseSize + (seedFactor % sizeVariation);
  particle.style.width = `${size}px`;
  particle.style.height = `${size}px`;
};

const animateParticle = (particle, seedFactor, particlesContainerReference) => {
  requestAnimationFrame(() => {
    const angle = (seedFactor * 0.006_28) % (Math.PI * 2);
    const distance = 15 + (seedFactor % 30);
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
};

// Función para crear y manejar partículas
const createParticles = (event, particlesContainerReference, width) => {
  if (!particlesContainerReference.current) return;

  const position = calculateRelativePosition(
    event.clientX,
    event.clientY,
    particlesContainerReference,
  );

  const particleCount = (width || 0) < 768 ? 3 : 5;
  const timestamp = Date.now();

  for (let index = 0; index < particleCount; index++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    const seedFactor = timestamp + index * 123;

    configureParticleStyle(particle, position, seedFactor, width);
    particlesContainerReference.current.append(particle);
    animateParticle(particle, seedFactor, particlesContainerReference);
  }
};

import './Plans.css';

// Componentes extraídos para reducir el tamaño de la función principal
const CosmicLights = React.memo(() => (
  <div className='cosmic-lights'>
    <div className='light-beam light-beam-1' />
    <div className='light-beam light-beam-2' />
    <div className='light-beam light-beam-3' />
  </div>
));

CosmicLights.displayName = 'CosmicLights';

const ParticlesContainer = React.memo(
  ({ particlesContainerReference, isVisible, particles }) => (
    <div className='particles' ref={particlesContainerReference}>
      {isVisible &&
        particles.map((particle) => (
          <div
            key={particle.id}
            className={`particle particle-${particle.id + 1}`}
          />
        ))}
    </div>
  ),
);

ParticlesContainer.displayName = 'ParticlesContainer';

ParticlesContainer.propTypes = {
  particlesContainerReference: PropTypes.object.isRequired,
  isVisible: PropTypes.bool.isRequired,
  particles: PropTypes.array.isRequired,
};

const PlansHeader = React.memo(() => (
  <motion.div
    className='plans-header'
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: 'easeOut' }}
  >
    <motion.h1
      className='plans-title'
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
    >
      Planes de <span className='highlight'>Plubot</span>
    </motion.h1>
    <motion.p
      className='plans-subtitle'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      Elige el plan perfecto para tu proyecto y desbloquea el poder de la IA
    </motion.p>
  </motion.div>
));

PlansHeader.displayName = 'PlansHeader';

const PlanCard = React.memo(
  ({ plan, index, activePlan, setActivePlan, itemVariants }) => (
    <motion.div
      key={plan.id}
      className={`plan-card ${plan.isPopular ? 'popular' : ''} ${
        activePlan === plan.id ? 'active' : ''
      }`}
      variants={itemVariants}
      whileHover={{
        scale: 1.02,
        boxShadow: '0 10px 30px rgba(0, 255, 255, 0.2)',
      }}
      onMouseEnter={() => setActivePlan(plan.id)}
      onMouseLeave={() => setActivePlan()}
    >
      {plan.isPopular && (
        <div className='popular-badge'>
          <span>Más Popular</span>
        </div>
      )}

      <div className='plan-header'>
        <div className='plan-icon'>
          <img src={logo} alt={`${plan.name} icon`} />
        </div>
        <h3 className='plan-name'>{plan.name}</h3>
        <div className='plan-price'>
          <span className='currency'>$</span>
          <span className='amount'>{plan.price}</span>
          <span className='period'>/{plan.period}</span>
        </div>
        <p className='plan-description'>{plan.description}</p>
      </div>

      <div className='plan-features'>
        <h4>Características incluidas:</h4>
        <ul>
          {plan.features.map((feature, featureIndex) => (
            <motion.li
              key={`${plan.name}-feature-${feature}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.3,
                delay: 0.6 + featureIndex * 0.1,
              }}
            >
              <span className='feature-icon'>✓</span>
              {feature}
            </motion.li>
          ))}
        </ul>
      </div>

      <motion.button
        className='plan-button'
        whileHover={{
          scale: 1.05,
          backgroundColor: '#00ffff',
          color: '#000',
        }}
        whileTap={{ scale: 0.95 }}
      >
        {plan.isPopular ? 'Comenzar Ahora' : 'Seleccionar Plan'}
      </motion.button>
    </motion.div>
  ),
);

PlanCard.displayName = 'PlanCard';

PlanCard.propTypes = {
  plan: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    period: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    features: PropTypes.array.isRequired,
    isPopular: PropTypes.bool,
  }).isRequired,
  index: PropTypes.number,
  activePlan: PropTypes.string,
  setActivePlan: PropTypes.func.isRequired,
  itemVariants: PropTypes.object.isRequired,
};

// Componente de la grilla de planes extraído
const PlansGrid = React.memo(
  ({
    plans,
    containerVariants,
    itemVariants,
    isVisible,
    activePlan,
    setActivePlan,
    isLowPerfDevice,
  }) => (
    <motion.div
      className='plans-grid'
      variants={containerVariants}
      initial='hidden'
      animate={isVisible ? 'visible' : 'hidden'}
    >
      {plans.map((plan, index) => (
        <motion.div
          key={plan.name}
          className={`plan-card ${
            activePlan === index ? 'plan-card-active' : ''
          }`}
          variants={itemVariants}
          onMouseEnter={() => setActivePlan(index)}
          onMouseLeave={() => setActivePlan()}
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
              <li key={`${plan.name}-${feature}`} className='plan-feature'>
                {feature}
              </li>
            ))}
          </ul>

          {plan.idealFor && <p className='plan-ideal-for'>{plan.idealFor}</p>}

          <motion.button
            className='plan-button'
            whileHover={{
              scale: 1.05,
              boxShadow: '0 0 15px rgba(0, 224, 255, 0.8)',
            }}
            whileTap={{ scale: 0.95 }}
          >
            Seleccionar Plan
          </motion.button>
        </motion.div>
      ))}
    </motion.div>
  ),
);

PlansGrid.displayName = 'PlansGrid';

// Hook personalizado para detectar dispositivos de bajo rendimiento
const useIsLowPerfDevice = (width) => {
  return useMemo(() => {
    const mobileUserAgent =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    return (
      (width || 0) < 768 ||
      mobileUserAgent.test(navigator.userAgent) ||
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4)
    );
  }, [width]);
};

// Hook personalizado para generar partículas
const useParticles = (isLowPerfDevice) => {
  return useMemo(
    () =>
      Array.from({ length: isLowPerfDevice ? 3 : 6 }).map((unused, index) => ({
        id: index,
      })),
    [isLowPerfDevice],
  );
};

// Hook personalizado para intersection observer
const useIntersectionObserver = (threshold = 0.2, rootMargin = '50px') => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef();

  useEffect(() => {
    const element = elementRef.current;
    const observer = new IntersectionObserver(
      ([intersectionEntry]) => {
        setIsVisible(intersectionEntry.isIntersecting);
      },
      { threshold, rootMargin },
    );

    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [threshold, rootMargin]);

  return [isVisible, elementRef];
};

PlansGrid.propTypes = {
  plans: PropTypes.array.isRequired,
  containerVariants: PropTypes.object.isRequired,
  itemVariants: PropTypes.object.isRequired,
  isVisible: PropTypes.bool.isRequired,
  activePlan: PropTypes.number,
  setActivePlan: PropTypes.func.isRequired,
  isLowPerfDevice: PropTypes.bool.isRequired,
};

// Variantes de animación extraídas como constantes
const CONTAINER_VARIANTS = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.2,
    },
  },
};

const ITEM_VARIANTS = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 100, damping: 12 },
  },
};

// Datos de planes extraídos como constante
const PLANS_DATA = [
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

export default function Plans() {
  const { width } = useWindowSize();
  const [activePlan, setActivePlan] = useState();
  const particlesContainerReference = useRef();
  const [isVisible, plansSectionReference] = useIntersectionObserver();

  // Sistema determinístico para partículas: más predecible, testeable y configurable
  const createParticlesBurst = (x, y) => {
    if (!particlesContainerReference.current || !isVisible) return;

    const particleCount = (width || 0) < 768 ? 2 : 3;
    const position = calculateRelativePosition(
      x,
      y,
      particlesContainerReference,
    );

    for (let index = 0; index < particleCount; index++) {
      const particle = document.createElement('div');
      particle.className = 'absolute rounded-full pointer-events-none z-10';

      const seedFactor = (Math.floor(x) + Math.floor(y) + index * 73) % 1000;

      configureParticleStyle(particle, position, seedFactor);
      particlesContainerReference.current.append(particle);
      animateParticle(particle, seedFactor);
    }
  };

  const handleClick = (event) => {
    if (!isVisible) return;
    createParticlesBurst(event.clientX, event.clientY);
  };

  const plans = PLANS_DATA;
  const containerVariants = CONTAINER_VARIANTS;
  const itemVariants = ITEM_VARIANTS;
  const isLowPerfDevice = useIsLowPerfDevice(width);
  const particles = useParticles(isLowPerfDevice);

  return (
    <div className='plans-wrapper' ref={plansSectionReference}>
      <motion.div
        className='plans-page'
        onClick={handleClick}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        {!isLowPerfDevice && <CosmicLights />}

        <ParticlesContainer
          particlesContainerReference={particlesContainerReference}
          isVisible={isVisible}
          particles={particles}
        />

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

          <PlansGrid
            plans={plans}
            containerVariants={containerVariants}
            itemVariants={itemVariants}
            isVisible={isVisible}
            activePlan={activePlan}
            setActivePlan={setActivePlan}
            isLowPerfDevice={isLowPerfDevice}
          />

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
