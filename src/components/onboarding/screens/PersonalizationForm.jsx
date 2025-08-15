import Particles from '@tsparticles/react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';

import byteImage from '@/assets/img/byte.png';
import plubotImage from '@/assets/img/plubot.svg';
import proLogo from '@/assets/img/plubotpro.svg';
import { powers } from '@/data/powers.js';
import './PersonalizationForm.css';
import useAPI from '@/hooks/useAPI';
import useAuthStore from '@/stores/use-auth-store';

import usePlubotCreation from '../../../hooks/usePlubotCreation';

// Static data moved to module level for better performance
const PERSONALITIES = [
  {
    type: 'Audaz',
    description: 'Divertido, irreverente y dinámico',
    icon: '⚡',
    color: '#FF6B00',
  },
  {
    type: 'Sabio',
    description: 'Formal, calmado y profesional',
    icon: '📘',
    color: '#1E3A8A',
  },
  {
    type: 'Servicial',
    description: 'Amable, directo y cordial',
    icon: '🤝',
    color: '#22C55E',
  },
  {
    type: 'Creativo',
    description: 'Expresivo, entusiasta y espontáneo',
    icon: '🎨',
    color: '#A855F7',
  },
  {
    type: 'Neutral',
    description: 'Sobrio, objetivo y neutro',
    icon: '⚖️',
    color: '#D1D5DB',
  },
  {
    type: 'Misterioso',
    description: 'Enigmático, elegante y curioso',
    icon: '🕵️',
    color: '#1F2937',
  },
];

const FREE_POWERS = new Set([
  'notion',
  'slack',
  'trello',
  'google-sheets',
  'github',
  'typeform',
  'discord',
  'asana',
  'monday',
  'zoom',
  'instagram',
  'google-analytics',
  'hubspot',
]);

const getMessages = (plubotId) => ({
  name: plubotId
    ? 'Edita el nombre de tu Plubot para reflejar su nueva identidad.'
    : 'Dale un nombre único a tu Plubot Despierto. ¡Este será su identidad en el Pluniverse!',
  personality: plubotId
    ? 'Ajusta la personalidad de tu Plubot para cambiar cómo interactúa.'
    : 'Elige una personalidad para tu Plubot. Define cómo interactuará con el mundo.',
  powers: plubotId
    ? 'Modifica los poderes de tu Plubot para adaptarlo a nuevas tareas.'
    : 'Selecciona poderes gratuitos para tu Plubot. Los poderes Pro desbloquean integraciones avanzadas.',
  preview: plubotId
    ? '¡Tu Plubot está actualizado! Revisa los cambios antes de guardar.'
    : '¡Tu Plubot Despierto está listo! Actívalo para configurar sus respuestas.',
});

// Move particlesInit to outer scope for better performance
const particlesInit = async (engine) => {
  const { loadSlim } = await import('@tsparticles/slim');
  await loadSlim(engine);
};

// Extracted components for better organization and performance
const NameSection = ({ nameInput, handleInputChange, errorMessage, plubotId }) => (
  <motion.div
    className='creation-section name-section'
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3 }}
  >
    <h2 className='section-title'>Identidad Digital</h2>
    <div className='input-container'>
      <input
        type='text'
        name='name'
        value={nameInput}
        onChange={handleInputChange}
        placeholder='Nombre de tu Plubot'
        className='plubot-input'
        maxLength={20}
      />
      <div className='input-underline' />
      {errorMessage && (
        <div
          className='error-message'
          style={{
            color: '#ff4444',
            fontSize: '14px',
            marginTop: '8px',
          }}
        >
          {errorMessage}
        </div>
      )}
    </div>
    <div className='plan-info'>
      <p>
        Estás {plubotId ? 'editando un' : 'creando un'} <strong>Plubot Despierto Gratuito</strong>:
      </p>
      <ul>
        <li>Respuestas automáticas en chat web</li>
        <li>Menú con hasta 3 botones</li>
        <li>Recolección de nombre, correo y motivo</li>
        <li>Límite de 100 respuestas/mes</li>
      </ul>
      <Link to='/pricing' className='plan-upgrade-link'>
        ¡Explora el plan Pro para más poderes!
      </Link>
    </div>
  </motion.div>
);

NameSection.propTypes = {
  nameInput: PropTypes.string.isRequired,
  handleInputChange: PropTypes.func.isRequired,
  errorMessage: PropTypes.string,
  plubotId: PropTypes.string,
};

const PersonalitySection = ({
  personalities,
  plubotData,
  handlePersonalitySelect,
  errorMessage,
}) => (
  <motion.div
    className='creation-section personality-section'
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3 }}
  >
    <h2 className='section-title'>Núcleo de Personalidad</h2>
    <div className='personality-grid'>
      {personalities.map((p) => (
        <motion.div
          key={p.type}
          className={`personality-card ${
            plubotData.tone === p.type.toLowerCase() ? 'selected' : ''
          }`}
          onClick={() => handlePersonalitySelect(p)}
          whileHover={{ scale: 1.03 }}
          style={{ borderColor: p.color }}
        >
          <div className='personality-icon' style={{ backgroundColor: p.color }}>
            {p.icon}
          </div>
          <h3>{p.type}</h3>
          <p>{p.description}</p>
          {plubotData.tone === p.type.toLowerCase() && <div className='checkmark-overlay'>✔</div>}
        </motion.div>
      ))}
    </div>
    {errorMessage && (
      <div
        className='error-message'
        style={{
          color: '#ff4444',
          fontSize: '14px',
          marginTop: '16px',
          textAlign: 'center',
        }}
      >
        {errorMessage}
      </div>
    )}
  </motion.div>
);

PersonalitySection.propTypes = {
  personalities: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      icon: PropTypes.string.isRequired,
      color: PropTypes.string.isRequired,
    }),
  ).isRequired,
  plubotData: PropTypes.shape({
    tone: PropTypes.string,
  }).isRequired,
  handlePersonalitySelect: PropTypes.func.isRequired,
  errorMessage: PropTypes.string,
};

const PowersSection = ({ selectedPowers, handlePowerToggle, errorMessage, freePowers }) => (
  <motion.div
    className='creation-section powers-section'
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3 }}
  >
    <h2 className='section-title'>Poderes del Plubot</h2>
    <div className='powers-grid'>
      {powers.map((power) => (
        <motion.div
          key={power.id}
          className={`power-card ${freePowers.has(power.id) ? '' : 'disabled'} ${
            selectedPowers.has(power.id) ? 'selected' : ''
          }`}
          onClick={() => handlePowerToggle(power.id)}
          whileHover={{ scale: 1.03 }}
        >
          <img src={power.image} alt={power.title} className='power-image' />
          <div className='text-overlay'>
            <h3>{power.title}</h3>
            <p>{power.description}</p>
          </div>
          {!freePowers.has(power.id) && (
            <div className='pro-overlay'>
              <img src={proLogo} alt='Pro Feature' className='pro-logo' />
              <span>Requiere Plan Pro</span>
            </div>
          )}
          {selectedPowers.has(power.id) && freePowers.has(power.id) && (
            <div className='power-active-indicator'>
              <div className='power-pulse' />
            </div>
          )}
        </motion.div>
      ))}
    </div>
    <div className='marketplace-preview'>
      <p>
        ¿Quieres más poderes? <Link to='/marketplace'>Explora el Marketplace</Link> (requiere plan
        Pro para algunos).
      </p>
    </div>
    {errorMessage && (
      <div
        className='error-message'
        style={{
          color: '#ff4444',
          fontSize: '14px',
          marginTop: '16px',
          textAlign: 'center',
        }}
      >
        {errorMessage}
      </div>
    )}
  </motion.div>
);

PowersSection.propTypes = {
  selectedPowers: PropTypes.instanceOf(Set).isRequired,
  handlePowerToggle: PropTypes.func.isRequired,
  errorMessage: PropTypes.string,
  freePowers: PropTypes.instanceOf(Set).isRequired,
};

const PreviewSection = ({ plubotId, plubotData, nameInput, selectedPowers }) => (
  <motion.div
    className='creation-section preview-section'
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3 }}
  >
    <h2 className='section-title'>{plubotId ? 'Revisión de Cambios' : 'Activación Final'}</h2>
    <div className='preview-info'>
      <div className='preview-stat'>
        <span className='stat-label'>Nombre:</span>
        <span className='stat-value'>{plubotData.name || nameInput}</span>
      </div>
      <div className='preview-stat'>
        <span className='stat-label'>Personalidad:</span>
        <span className='stat-value'>{plubotData.tone || 'Neutral'}</span>
      </div>
      <div className='preview-stat'>
        <span className='stat-label'>Color:</span>
        <span className='stat-value'>{plubotData.color || '#D1D5DB'}</span>
      </div>
      <div className='preview-stat'>
        <span className='stat-label'>Poderes:</span>
        <span className='stat-value'>
          {selectedPowers.size > 0
            ? [...selectedPowers].map((id) => powers.find((p) => p.id === id)?.title).join(', ')
            : 'Ninguno'}
        </span>
      </div>
      <div className='preview-stat'>
        <span className='stat-label'>Canal:</span>
        <span className='stat-value'>Chat Web</span>
      </div>
    </div>
    <div className='completion-message'>
      <h3>{plubotId ? '¡Tu Plubot está actualizado!' : '¡Tu Plubot Despierto está listo!'}</h3>
      <p>
        {plubotId
          ? 'Revisa los cambios y guarda para aplicarlos.'
          : 'Continúa para configurar su comportamiento en el editor de flujos.'}
      </p>
    </div>
  </motion.div>
);

PreviewSection.propTypes = {
  plubotId: PropTypes.string,
  plubotData: PropTypes.shape({
    name: PropTypes.string,
    tone: PropTypes.string,
    color: PropTypes.string,
  }).isRequired,
  nameInput: PropTypes.string.isRequired,
  selectedPowers: PropTypes.instanceOf(Set).isRequired,
};

// Data processing helper functions extracted from main component
const normalizeAndExtractPlubotData = (response) => {
  const { name, tone, color, powers: plubotPowers, purpose, initial_message } = response.plubot;

  // Normalizar datos para evitar valores nulos o indefinidos
  const normalizedTone = tone ? tone.toLowerCase() : 'neutral';
  let normalizedPowers = [];
  if (Array.isArray(plubotPowers)) {
    normalizedPowers = plubotPowers;
  } else if (typeof plubotPowers === 'string') {
    normalizedPowers = plubotPowers.split(',').filter(Boolean);
  }

  return {
    name: name ?? '',
    tone: normalizedTone,
    color: color || '#D1D5DB',
    powers: normalizedPowers,
    purpose: purpose || 'asistir a los clientes en chat web',
    initial_message: initial_message ?? '',
  };
};

const updateContextAndStates = (id, normalizedData, handlers) => {
  const { updatePlubotData, setNameInput, setEnergyLevel } = handlers;

  // Actualizar el contexto con datos completos
  updatePlubotData({
    id,
    ...normalizedData,
    selectedPowers: new Set(normalizedData.powers ?? []),
  });

  // Actualizar estados locales
  setNameInput(normalizedData.name);
  setEnergyLevel(normalizedData.name ? Math.min(normalizedData.name.length * 10, 100) : 0);
};

const handleFetchErrors = (error, setErrorMessage, setMessageText) => {
  // Manejar errores específicos
  if (error.message?.includes('404')) {
    setErrorMessage('Plubot no encontrado');
    setMessageText('Plubot no encontrado. Verifica el ID del Plubot.');
  } else {
    setErrorMessage(error.message || 'Error de conexión');
    setMessageText(`Error al cargar el Plubot: ${error.message || 'Error de conexión'}`);
  }
};

// Visual components extracted for better organization
const ProgressTracker = ({ progress }) => (
  <div className='progress-tracker'>
    <div className='progress-nodes'>
      {['Identidad', 'Personalidad', 'Poderes', 'Revisión'].map((step, index) => {
        const stepProgress = (index + 1) * 25;
        const isActive = progress >= stepProgress;
        return (
          <div className='progress-step' key={step}>
            <div
              className={`progress-node ${isActive ? 'active' : ''}`}
              style={{ borderColor: isActive ? '#00e0ff' : undefined }}
            >
              {isActive && <div className='node-fill' style={{ backgroundColor: '#00e0ff' }} />}
            </div>
            <span className='step-label'>{step}</span>
          </div>
        );
      })}
    </div>
    <div className='progress-bar'>
      <div
        className='progress-fill'
        style={{ width: `${progress}%`, backgroundColor: '#00e0ff' }}
      />
    </div>
  </div>
);

ProgressTracker.propTypes = {
  progress: PropTypes.number.isRequired,
};

const CosmicGrid = () => (
  <div className='cosmic-grid'>
    {Array.from({ length: 10 }).map(() => (
      <div key={`grid-line-${crypto.randomUUID()}`} className='grid-line' />
    ))}
  </div>
);

const HologramDisplay = ({
  hologramRotation,
  energyLevel,
  plubotData,
  nameInput,
  messageText,
  isTyping,
}) => (
  <div className='hologram-section'>
    <div className='hologram-container'>
      <div className='hologram-platform' style={{ boxShadow: `0 0 30px #00e0ff` }}>
        <div className='platform-rings'>
          {Array.from({ length: 3 }).map(() => (
            <div
              key={`platform-ring-${crypto.randomUUID()}`}
              className='platform-ring'
              style={{ borderColor: '#00e0ff' }}
            />
          ))}
        </div>
      </div>
      <div className='plubot-hologram' style={{ transform: `rotateY(${hologramRotation}deg)` }}>
        <div
          className='energy-meter'
          style={{
            height: `${energyLevel}%`,
            backgroundColor: '#00e0ff',
          }}
        />
        <img
          src={plubotImage}
          alt='Plubot'
          className='plubot-image'
          style={{ filter: `drop-shadow(0 0 10px #00e0ff)` }}
        />
        {(plubotData.name || nameInput) && (
          <motion.div
            className='plubot-name-display'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {plubotData.name || nameInput}
          </motion.div>
        )}
      </div>
      <div className='hologram-circles'>
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={`hologram-circle-${crypto.randomUUID()}`}
            className={`hologram-circle circle${index + 1}`}
            style={{ borderColor: '#00e0ff' }}
          />
        ))}
      </div>
      <div className='energy-beams'>
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`energy-beam-${crypto.randomUUID()}`}
            className='energy-beam'
            style={{
              transform: `rotate(${index * 90}deg)`,
              backgroundColor: '#00e0ff',
              opacity: energyLevel / 200 + 0.1,
            }}
          />
        ))}
      </div>
    </div>
    <div className='message-console'>
      <div className='console-header'>
        <div className='console-dots'>
          <div className='console-dot' />
          <div className='console-dot' />
          <div className='console-dot' />
        </div>
        <span>LABORATORIO PLUBOT v2.5</span>
      </div>
      <div className='console-content'>
        <img src={byteImage} alt='Byte Assistant' className='byte-avatar' />
        <div className='message-text'>
          <span>{messageText}</span>
          {isTyping && <span className='blink-cursor'>_</span>}
        </div>
      </div>
    </div>
  </div>
);

HologramDisplay.propTypes = {
  hologramRotation: PropTypes.number.isRequired,
  energyLevel: PropTypes.number.isRequired,
  plubotData: PropTypes.shape({
    name: PropTypes.string,
  }).isRequired,
  nameInput: PropTypes.string.isRequired,
  messageText: PropTypes.string.isRequired,
  isTyping: PropTypes.bool.isRequired,
};

const NavigationControls = ({
  activeSection,
  goToPreviousSection,
  goToNextSection,
  isLoading,
  plubotId,
}) => (
  <div className='nav-controls'>
    {activeSection !== 'name' && (
      <motion.button
        className='nav-button back-button'
        onClick={goToPreviousSection}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.95 }}
      >
        Atrás
      </motion.button>
    )}
    <motion.button
      className='nav-button next-button'
      onClick={goToNextSection}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.95 }}
      style={{ background: `linear-gradient(45deg, #00e0ff, #ff00ff)` }}
      disabled={isLoading}
    >
      {(() => {
        if (isLoading) {
          const loadingText = plubotId ? 'Actualizando...' : 'Activando...';
          return (
            <span>
              <i className='fas fa-spinner fa-spin' /> {loadingText}
            </span>
          );
        }
        if (plubotId) {
          return 'Guardar Cambios';
        }
        if (activeSection === 'preview') {
          return 'Activar Plubot';
        }
        return 'Continuar';
      })()}
    </motion.button>
  </div>
);

NavigationControls.propTypes = {
  activeSection: PropTypes.string.isRequired,
  goToPreviousSection: PropTypes.func.isRequired,
  goToNextSection: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
  plubotId: PropTypes.string,
};

const ParticleEffects = ({ showParticleEffect }) => (
  <>
    <Particles
      id='tsparticles'
      init={particlesInit}
      options={{
        fullScreen: { enable: true },
        particles: {
          number: { value: 50, density: { enable: true, value_area: 800 } },
          color: { value: '#00e0ff' },
          shape: { type: 'circle' },
          opacity: { value: 0.3, random: true },
          size: { value: 2, random: true },
          move: {
            enable: true,
            speed: 1,
            direction: 'none',
            random: true,
            outModes: 'out',
            attract: { enable: false },
          },
          links: {
            enable: true,
            distance: 120,
            color: '#00e0ff',
            opacity: 0.1,
            width: 1,
          },
        },
      }}
    />
    <AnimatePresence>
      {showParticleEffect && (
        <motion.div
          className='personality-particles'
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1.2, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
        >
          {Array.from({ length: 10 }).map((_, index) => {
            const seedFactor = (index * 19 + 37) % 360;
            return (
              <div
                key={`particle-${seedFactor}-${index * 19 + 37}`}
                className='absolute w-2 h-2 bg-cyan-400 rounded-full animate-ping'
                style={{
                  '--angle': `${seedFactor}deg`,
                  '--distance': `${40 + (seedFactor % 40)}%`,
                  '--size': `${5 + (seedFactor % 8)}px`,
                  backgroundColor: '#00e0ff',
                }}
              />
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  </>
);

ParticleEffects.propTypes = {
  showParticleEffect: PropTypes.bool.isRequired,
};

// Custom hooks extracted for better organization
const usePersonalizationEffects = (plubotId, activeSection, messages) => {
  const [progress, setProgress] = useState(25);
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentChar, setCurrentChar] = useState(0);
  const [hologramRotation, setHologramRotation] = useState(0);
  const [nameInput, setNameInput] = useState('');

  // Sync progress with activeSection
  useEffect(() => {
    const sectionProgress = {
      name: 25,
      personality: 50,
      powers: 75,
      preview: 100,
    };
    // eslint-disable-next-line security/detect-object-injection -- activeSection is controlled by context, limited to: name, personality, powers, preview
    setProgress(sectionProgress[activeSection] || 25);
  }, [activeSection]);

  // Update message based on activeSection
  useEffect(() => {
    // eslint-disable-next-line security/detect-object-injection -- activeSection is controlled by context, limited to: name, personality, powers, preview
    setMessageText(messages[activeSection]);
    setIsTyping(true);
    setCurrentChar(0);
  }, [activeSection, messages]);

  // Hologram rotation animation
  useEffect(() => {
    const rotationInterval = setInterval(() => {
      setHologramRotation((previous) => (previous + 0.5) % 360);
    }, 100);
    return () => clearInterval(rotationInterval);
  }, []);

  // Typing animation effect
  useEffect(() => {
    // eslint-disable-next-line security/detect-object-injection -- activeSection is controlled by context, limited to: name, personality, powers, preview
    const currentMessage = messages[activeSection] ?? '';
    if (isTyping && currentChar < currentMessage.length) {
      const typingTimeout = setTimeout(() => {
        setMessageText(currentMessage.slice(0, Math.max(0, currentChar + 1)));
        setCurrentChar((previous) => previous + 1);
      }, 30);
      return () => clearTimeout(typingTimeout);
    } else if (currentChar >= currentMessage.length) {
      setIsTyping(false);
    }
  }, [isTyping, currentChar, activeSection, messages]);

  return {
    progress,
    setProgress,
    messageText,
    setMessageText,
    isTyping,
    setIsTyping,
    currentChar,
    setCurrentChar,
    hologramRotation,
    nameInput,
    setNameInput,
  };
};

// Business logic custom hook extracted from main component
const useBusinessLogicHandlers = ({
  setNameInput,
  setEnergyLevel,
  updatePlubotData,
  setShowParticleEffect,
  freePowers,
  selectedPowers,
  setErrorMessage,
  activeSection,
  nameInput,
  plubotData,
  updateActiveSection,
}) => {
  const handleInputChange = useCallback(
    (event) => {
      const { name, value } = event.target;
      setErrorMessage('');

      if (name === 'name') {
        setNameInput(value);
        setEnergyLevel(Math.min(value.length * 10, 100));
      } else {
        updatePlubotData({ [name]: value });
      }
    },
    [setNameInput, setEnergyLevel, updatePlubotData, setErrorMessage],
  );

  const handlePersonalitySelect = useCallback(
    (personality) => {
      updatePlubotData({
        tone: personality.type.toLowerCase(),
        color: personality.color,
      });
      setShowParticleEffect(true);
      setTimeout(() => setShowParticleEffect(false), 1500);
    },
    [updatePlubotData, setShowParticleEffect],
  );

  const handlePowerToggle = useCallback(
    (powerId) => {
      if (freePowers.has(powerId)) {
        const newSelectedPowers = new Set(selectedPowers);
        if (newSelectedPowers.has(powerId)) {
          newSelectedPowers.delete(powerId);
        } else {
          newSelectedPowers.add(powerId);
        }
        updatePlubotData({
          selectedPowers: newSelectedPowers,
          powers: [...newSelectedPowers],
        });
      }
    },
    [freePowers, selectedPowers, updatePlubotData],
  );

  const validateCurrentSection = useCallback(() => {
    if (activeSection === 'name' && (!nameInput.trim() || nameInput.trim().length < 3)) {
      setErrorMessage('El nombre debe tener al menos 3 caracteres.');
      return false;
    }
    if (activeSection === 'personality' && !plubotData.tone) {
      setErrorMessage('Por favor, elige una personalidad.');
      return false;
    }
    if (activeSection === 'powers' && selectedPowers.size === 0) {
      setErrorMessage('¡Dale poderes a tu Plubot para que sea útil!');
      return false;
    }
    return true;
  }, [activeSection, nameInput, plubotData.tone, selectedPowers.size, setErrorMessage]);

  const navigateToNextSection = useCallback(() => {
    switch (activeSection) {
      case 'name': {
        updatePlubotData({ name: nameInput });
        updateActiveSection('personality');
        break;
      }
      case 'personality': {
        updateActiveSection('powers');
        break;
      }
      case 'powers': {
        updateActiveSection('preview');
        break;
      }
      default: {
        break;
      }
    }
  }, [activeSection, nameInput, updatePlubotData, updateActiveSection]);

  return {
    handleInputChange,
    handlePersonalitySelect,
    handlePowerToggle,
    validateCurrentSection,
    navigateToNextSection,
  };
};

// Navigation helper functions extracted from main component
const createNavigationHandlers = ({
  activeSection,
  updateActiveSection,
  validateCurrentSection,
  navigateToNextSection,
  handleSaveOrActivation,
  setErrorMessage,
}) => {
  const goToNextSection = async () => {
    if (!validateCurrentSection()) {
      return;
    }

    setErrorMessage('');

    if (activeSection !== 'preview') {
      navigateToNextSection();
      return;
    }

    await handleSaveOrActivation();
  };

  const goToPreviousSection = () => {
    switch (activeSection) {
      case 'personality': {
        updateActiveSection('name');
        break;
      }
      case 'powers': {
        updateActiveSection('personality');
        break;
      }
      case 'preview': {
        updateActiveSection('powers');
        break;
      }
      default: {
        break;
      }
    }
  };

  return {
    goToNextSection,
    goToPreviousSection,
  };
};

// Render functions custom hook extracted from main component
const useRenderFunctions = ({
  nameInput,
  handleInputChange,
  errorMessage,
  plubotId,
  personalities,
  plubotData,
  handlePersonalitySelect,
  selectedPowers,
  handlePowerToggle,
  freePowers,
  activeSection,
}) => {
  const renderNameSection = useCallback(
    () => (
      <NameSection
        nameInput={nameInput}
        handleInputChange={handleInputChange}
        errorMessage={errorMessage}
        plubotId={plubotId}
      />
    ),
    [nameInput, handleInputChange, errorMessage, plubotId],
  );

  const renderPersonalitySection = useCallback(
    () => (
      <PersonalitySection
        personalities={personalities}
        plubotData={plubotData}
        handlePersonalitySelect={handlePersonalitySelect}
        errorMessage={errorMessage}
      />
    ),
    [plubotData, handlePersonalitySelect, errorMessage, personalities],
  );

  const renderPowersSection = useCallback(
    () => (
      <PowersSection
        selectedPowers={selectedPowers}
        handlePowerToggle={handlePowerToggle}
        errorMessage={errorMessage}
        freePowers={freePowers}
      />
    ),
    [selectedPowers, handlePowerToggle, errorMessage, freePowers],
  );

  const renderPreviewSection = useCallback(
    () => (
      <PreviewSection
        plubotId={plubotId}
        plubotData={plubotData}
        nameInput={nameInput}
        selectedPowers={selectedPowers}
      />
    ),
    [plubotId, plubotData, nameInput, selectedPowers],
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'name': {
        return renderNameSection();
      }
      case 'personality': {
        return renderPersonalitySection();
      }
      case 'powers': {
        return renderPowersSection();
      }
      case 'preview': {
        return renderPreviewSection();
      }
      default:
    }
  };

  return {
    renderContent,
  };
};

// Data processing callbacks sub-hook
const useDataProcessingCallbacks = ({
  updatePlubotData,
  setNameInput,
  setEnergyLevel,
  setErrorMessage,
  setMessageText,
}) => {
  const _normalizeAndExtractPlubotData = useCallback(
    (response) => normalizeAndExtractPlubotData(response),
    [],
  );
  const _updateContextAndStates = useCallback(
    (id, normalizedData) =>
      updateContextAndStates(id, normalizedData, {
        updatePlubotData,
        setNameInput,
        setEnergyLevel,
      }),
    [updatePlubotData, setNameInput, setEnergyLevel],
  );
  const _handleFetchErrors = useCallback(
    (error) => handleFetchErrors(error, setErrorMessage, setMessageText),
    [setMessageText, setErrorMessage],
  );
  return { _normalizeAndExtractPlubotData, _updateContextAndStates, _handleFetchErrors };
};

// Data fetching and operations custom hook
const usePersonalizationOperations = ({
  plubotId,
  request,
  setErrorMessage,
  setMessageText,
  updatePlubotData,
  setNameInput,
  setEnergyLevel,
  setSelectedPowers,
  fetchUserProfile,
  navigate,
  createBot,
  setShowParticleEffect,
  isEditMode,
  setIsLoading,
  plubotData,
  nameInput,
  selectedPowers,
}) => {
  const { _normalizeAndExtractPlubotData, _updateContextAndStates, _handleFetchErrors } =
    useDataProcessingCallbacks({
      updatePlubotData,
      setNameInput,
      setEnergyLevel,
      setErrorMessage,
      setMessageText,
    });
  const fetchPlubotData = useCallback(
    async (id) => {
      try {
        setErrorMessage('');
        setMessageText('Cargando datos del Plubot...');
        const response = await request('GET', `/plubots/${id}`);
        if (response?.status === 'success') {
          const normalizedData = _normalizeAndExtractPlubotData(response);
          _updateContextAndStates(id, normalizedData);
          setSelectedPowers(new Set(normalizedData.powers));
        } else {
          throw new Error(response?.message || 'Error al obtener el Plubot');
        }
      } catch (error) {
        _handleFetchErrors(error);
      }
    },
    [
      request,
      _normalizeAndExtractPlubotData,
      _updateContextAndStates,
      _handleFetchErrors,
      setMessageText,
      setErrorMessage,
      setSelectedPowers,
    ],
  );
  const _performCacheSynchronization = useCallback(() => {
    const flowCacheKey = `plubot-flow-storage-v5`;
    const cachedFlow = JSON.parse(localStorage.getItem(flowCacheKey));
    if (cachedFlow && cachedFlow.state && cachedFlow.state.plubotId === plubotId) {
      localStorage.removeItem(flowCacheKey);
    }
  }, [plubotId]);
  const _handleEditModeOperation = useCallback(
    async (finalPayload) => {
      const response = await request('PUT', `/plubots/update/${plubotId}`, finalPayload);
      if (response?.status === 'success') {
        setMessageText('¡Plubot actualizado con éxito!');
        await fetchUserProfile(true);
        _performCacheSynchronization();
        setTimeout(() => navigate('/profile'), 1500);
      } else {
        throw new Error(response?.message || 'Error al actualizar el Plubot');
      }
    },
    [plubotId, request, fetchUserProfile, navigate, _performCacheSynchronization, setMessageText],
  );

  const _handleCreationModeOperation = useCallback(
    async (finalPayload) => {
      const response = await createBot(finalPayload);
      if (response?.plubot) {
        setMessageText('¡Plubot activado! Redirigiendo...');
        await fetchUserProfile(true);
        setShowParticleEffect(true);
        setTimeout(() => {
          const flowId = response.plubot.id;
          navigate(`/plubot/edit/flow/${flowId}`);
        }, 1200);
      } else {
        throw new Error(response?.message || 'Error al crear el Plubot');
      }
    },
    [createBot, fetchUserProfile, setShowParticleEffect, navigate, setMessageText],
  );
  const handleSaveOrActivation = useCallback(async () => {
    setIsLoading(true);
    setMessageText(isEditMode ? 'Actualizando tu Plubot...' : 'Activando tu Plubot...');
    const finalPayload = {
      ...plubotData,
      name: nameInput || plubotData.name,
      powers: [...selectedPowers],
    };
    try {
      await (isEditMode
        ? _handleEditModeOperation(finalPayload)
        : _handleCreationModeOperation(finalPayload));
    } catch (error) {
      setMessageText(error.message || 'Error inesperado');
      setIsLoading(false);
    }
  }, [
    isEditMode,
    plubotData,
    nameInput,
    selectedPowers,
    _handleEditModeOperation,
    _handleCreationModeOperation,
    setMessageText,
    setIsLoading,
  ]);
  return {
    fetchPlubotData,
    handleSaveOrActivation,
  };
};

// State and setup sub-hook
const usePersonalizationSetup = () => {
  // Estados de UI y animación
  const [showParticleEffect, setShowParticleEffect] = useState(false);
  const [energyLevel, setEnergyLevel] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // Referencias y hooks principales
  const containerReference = useRef(null);
  const { plubotData, updatePlubotData, activeSection, updateActiveSection, resetPlubotCreation } =
    usePlubotCreation();
  // Usar selectedPowers del contexto en lugar de estado local
  const selectedPowers = plubotData.selectedPowers || new Set();
  const setSelectedPowers = (newSelectedPowers) => {
    updatePlubotData({ selectedPowers: newSelectedPowers });
  };
  const navigate = useNavigate();
  const { request, createBot } = useAPI();
  const { fetchUserProfile } = useAuthStore();
  const { plubotId } = useParams();
  const isEditMode = Boolean(plubotId);
  // Configuración estática memorizada
  const messages = useMemo(() => getMessages(plubotId), [plubotId]);
  const personalities = PERSONALITIES;
  const freePowers = FREE_POWERS;
  return {
    showParticleEffect,
    setShowParticleEffect,
    energyLevel,
    setEnergyLevel,
    errorMessage,
    setErrorMessage,
    isLoading,
    setIsLoading,
    selectedPowers,
    setSelectedPowers,
    containerReference,
    plubotData,
    updatePlubotData,
    activeSection,
    updateActiveSection,
    resetPlubotCreation,
    navigate,
    request,
    createBot,
    fetchUserProfile,
    plubotId,
    isEditMode,
    messages,
    personalities,
    freePowers,
  };
};

// Initialization sub-hook
const usePersonalizationInitialization = ({
  plubotId,
  fetchPlubotData,
  updateActiveSection,
  resetPlubotCreation,
  setProgress,
  setNameInput,
}) => {
  const previousPlubotIdReference = useRef(null);
  useEffect(() => {
    if (previousPlubotIdReference.current === plubotId) return;
    previousPlubotIdReference.current = plubotId;
    if (plubotId) {
      updateActiveSection('name');
      setProgress(25);
      fetchPlubotData(plubotId);
    } else {
      resetPlubotCreation();
      setNameInput('');
      setProgress(25);
    }
  }, [
    plubotId,
    fetchPlubotData,
    updateActiveSection,
    resetPlubotCreation,
    setProgress,
    setNameInput,
  ]);
};

// Render sub-component
/* eslint-disable react/prop-types */
const PersonalizationFormRender = ({
  containerReference,
  showParticleEffect,
  progress,
  hologramRotation,
  energyLevel,
  plubotData,
  nameInput,
  messageText,
  isTyping,
  activeSection,
  renderContent,
  goToPreviousSection,
  goToNextSection,
  isLoading,
  plubotId,
}) => (
  <div className='creation-lab' ref={containerReference}>
    <ParticleEffects showParticleEffect={showParticleEffect} />
    <CosmicGrid />
    <ProgressTracker progress={progress} />
    <div className='lab-content'>
      <HologramDisplay
        hologramRotation={hologramRotation}
        energyLevel={energyLevel}
        plubotData={plubotData}
        nameInput={nameInput}
        messageText={messageText}
        isTyping={isTyping}
      />
      <div className='creation-interface'>
        <AnimatePresence mode='wait'>
          <motion.div
            key={activeSection}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className='creation-content'
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
        <NavigationControls
          activeSection={activeSection}
          goToPreviousSection={goToPreviousSection}
          goToNextSection={goToNextSection}
          isLoading={isLoading}
          plubotId={plubotId}
        />
      </div>
    </div>
  </div>
);

const PersonalizationForm = () => {
  const {
    showParticleEffect,
    setShowParticleEffect,
    energyLevel,
    setEnergyLevel,
    errorMessage,
    setErrorMessage,
    isLoading,
    setIsLoading,
    selectedPowers,
    setSelectedPowers,
    containerReference,
    plubotData,
    updatePlubotData,
    activeSection,
    updateActiveSection,
    resetPlubotCreation,
    navigate,
    request,
    createBot,
    fetchUserProfile,
    plubotId,
    isEditMode,
    messages,
    personalities,
    freePowers,
  } = usePersonalizationSetup();
  // Use custom hook for effects and state management
  const {
    progress,
    setProgress,
    messageText,
    setMessageText,
    isTyping,
    hologramRotation,
    nameInput,
    setNameInput,
  } = usePersonalizationEffects(plubotId, activeSection, messages);
  // Create business logic handlers
  const {
    handleInputChange,
    handlePersonalitySelect,
    handlePowerToggle,
    validateCurrentSection,
    navigateToNextSection,
  } = useBusinessLogicHandlers({
    setNameInput,
    setEnergyLevel,
    updatePlubotData,
    setShowParticleEffect,
    freePowers,
    selectedPowers,
    setErrorMessage,
    activeSection,
    nameInput,
    plubotData,
    updateActiveSection,
  });
  // Use custom hook for data fetching and operations
  const { fetchPlubotData, handleSaveOrActivation } = usePersonalizationOperations({
    plubotId,
    request,
    setErrorMessage,
    setMessageText,
    updatePlubotData,
    setNameInput,
    setEnergyLevel,
    setSelectedPowers,
    fetchUserProfile,
    navigate,
    createBot,
    setShowParticleEffect,
    isEditMode,
    setIsLoading,
    plubotData,
    nameInput,
    selectedPowers,
  });
  // Initialize data with smart sub-hook
  usePersonalizationInitialization({
    plubotId,
    fetchPlubotData,
    updateActiveSection,
    resetPlubotCreation,
    setProgress,
    setNameInput,
  });
  // Create navigation handlers
  const { goToNextSection, goToPreviousSection } = createNavigationHandlers({
    activeSection,
    updateActiveSection,
    validateCurrentSection,
    navigateToNextSection,
    handleSaveOrActivation,
    setErrorMessage,
  });
  // Create render functions
  const { renderContent } = useRenderFunctions({
    nameInput,
    handleInputChange,
    errorMessage,
    plubotId,
    personalities,
    plubotData,
    handlePersonalitySelect,
    selectedPowers,
    handlePowerToggle,
    freePowers,
    activeSection,
  });
  return (
    <PersonalizationFormRender
      containerReference={containerReference}
      showParticleEffect={showParticleEffect}
      progress={progress}
      hologramRotation={hologramRotation}
      energyLevel={energyLevel}
      plubotData={plubotData}
      nameInput={nameInput}
      messageText={messageText}
      isTyping={isTyping}
      activeSection={activeSection}
      renderContent={renderContent}
      goToPreviousSection={goToPreviousSection}
      goToNextSection={goToNextSection}
      isLoading={isLoading}
      plubotId={plubotId}
    />
  );
};

export default PersonalizationForm;
