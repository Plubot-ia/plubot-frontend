import Particles from '@tsparticles/react';
import { motion, AnimatePresence } from 'framer-motion';
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

// Move particlesInit to outer scope for better performance
const particlesInit = async (engine) => {
  const { loadSlim } = await import('@tsparticles/slim');
  await loadSlim(engine);
};

const PersonalizationForm = () => {
  // Estados de UI y animación
  const [progress, setProgress] = useState(25);
  const [showParticleEffect, setShowParticleEffect] = useState(false);
  const [energyLevel, setEnergyLevel] = useState(0);
  const [hologramRotation, setHologramRotation] = useState(0);
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [currentChar, setCurrentChar] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  // Referencias y hooks
  const containerReference = useRef(undefined);
  const previousPlubotIdReference = useRef(undefined);
  const {
    plubotData,
    updatePlubotData,
    activeSection,
    updateActiveSection,
    resetPlubotCreation,
  } = usePlubotCreation();
  const navigate = useNavigate();
  const { request, createBot } = useAPI();
  const { fetchUserProfile } = useAuthStore();

  // Derivar selectedPowers como un Set desde plubotData.powers (array)
  const selectedPowers = useMemo(
    () => new Set(plubotData.powers),
    [plubotData.powers],
  );

  // Obtener el ID del plubot y la fuente de navegación
  const { plubotId } = useParams();
  const isEditMode = Boolean(plubotId);

  // Nuevas personalidades (todas elegibles)
  const personalities = useMemo(
    () => [
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
    ],
    [],
  );

  const freePowers = useMemo(
    () =>
      new Set([
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
      ]),
    [],
  );

  const messages = useMemo(
    () => ({
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
    }),
    [plubotId],
  );

  const _normalizeAndExtractPlubotData = useCallback((response) => {
    const {
      name,
      tone,
      color,
      powers: plubotPowers,
      purpose,
      initial_message,
    } = response.plubot;

    // Normalizar datos para evitar valores nulos o indefinidos
    const normalizedTone = tone ? tone.toLowerCase() : 'neutral';
    let normalizedPowers = [];
    if (Array.isArray(plubotPowers)) {
      normalizedPowers = plubotPowers;
    } else if (typeof plubotPowers === 'string') {
      normalizedPowers = plubotPowers.split(',').filter(Boolean);
    }

    return {
      name: name || '',
      tone: normalizedTone,
      color: color || '#D1D5DB',
      powers: normalizedPowers,
      purpose: purpose || 'asistir a los clientes en chat web',
      initial_message: initial_message || '',
    };
  }, []);

  const _updateContextAndStates = useCallback(
    (id, normalizedData) => {
      // Actualizar el contexto con datos completos
      updatePlubotData({
        id,
        ...normalizedData,
      });

      // Actualizar estados locales
      setNameInput(normalizedData.name);
      setEnergyLevel(
        normalizedData.name
          ? Math.min(normalizedData.name.length * 10, 100)
          : 0,
      );
    },
    [updatePlubotData],
  );

  const _handleFetchErrors = useCallback(
    (error) => {
      // Manejar errores específicos
      if (error.message?.includes('404')) {
        setErrorMessage('Plubot no encontrado');
        setMessageText('Plubot no encontrado. Verifica el ID del Plubot.');
      } else {
        setErrorMessage(error.message || 'Error de conexión');
        setMessageText(
          `Error al cargar el Plubot: ${error.message || 'Error de conexión'}`,
        );
      }
    },
    [setMessageText],
  );

  // Función para cargar datos del Plubot
  const fetchPlubotData = useCallback(
    async (id) => {
      if (!id) return false;

      setIsLoading(true);
      setErrorMessage('');

      try {
        const response = await request('GET', `/plubots/${id}`);

        if (response?.status === 'success' && response?.plubot) {
          const normalizedData = _normalizeAndExtractPlubotData(response);
          _updateContextAndStates(id, normalizedData);
          return true;
        } else {
          const errorMessage_ =
            response?.message || 'Error desconocido al cargar datos';
          setMessageText(`Error al cargar el Plubot: ${errorMessage_}`);
          return false;
        }
      } catch (error) {
        _handleFetchErrors(error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [
      request,
      _normalizeAndExtractPlubotData,
      _updateContextAndStates,
      _handleFetchErrors,
      setMessageText,
    ],
  );

  // Efecto para cargar datos del Plubot en modo edición o reiniciar en modo creación
  useEffect(() => {
    // Evitar recargas innecesarias si el ID no ha cambiado
    if (previousPlubotIdReference.current === plubotId) return;
    previousPlubotIdReference.current = plubotId;

    if (plubotId) {
      // Modo edición: cargar datos del Plubot existente
      updateActiveSection('name');
      setProgress(25);
      fetchPlubotData(plubotId);
    } else {
      // Modo creación: reiniciar el contexto
      resetPlubotCreation();
      setNameInput('');
      setProgress(25);
    }
  }, [plubotId, fetchPlubotData, updateActiveSection, resetPlubotCreation]);

  // Sincronizar progress con activeSection
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

  // Actualizar mensaje basado en activeSection
  useEffect(() => {
    // eslint-disable-next-line security/detect-object-injection -- activeSection is controlled by context, limited to: name, personality, powers, preview
    setMessageText(messages[activeSection]);
    setIsTyping(true);
    setCurrentChar(0);
  }, [activeSection, messages]);

  useEffect(() => {
    const rotationInterval = setInterval(() => {
      setHologramRotation((previous) => (previous + 0.5) % 360);
    }, 100);
    return () => clearInterval(rotationInterval);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line security/detect-object-injection -- activeSection is controlled by context, limited to: name, personality, powers, preview
    const currentMessage = messages[activeSection] || '';
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

  const handleInputChange = useCallback(
    (event) => {
      const { name, value } = event.target;

      if (name === 'name') {
        setNameInput(value);
        setEnergyLevel(Math.min(value.length * 10, 100));
      } else {
        updatePlubotData({ [name]: value });
      }
    },
    [setNameInput, setEnergyLevel, updatePlubotData],
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
        updatePlubotData({ powers: [...newSelectedPowers] });
      }
    },
    [freePowers, selectedPowers, updatePlubotData],
  );

  // Helper function to validate current section
  const validateCurrentSection = useCallback(() => {
    if (
      activeSection === 'name' &&
      (!nameInput.trim() || nameInput.trim().length < 3)
    ) {
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
  }, [activeSection, nameInput, plubotData.tone, selectedPowers.size]);

  // Helper function to navigate between sections
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
      // No default
    }
  }, [activeSection, nameInput, updatePlubotData, updateActiveSection]);

  const _performCacheSynchronization = useCallback(() => {
    const flowCacheKey = `plubot-flow-storage-v5`;
    const cachedFlow = JSON.parse(localStorage.getItem(flowCacheKey));
    if (
      cachedFlow &&
      cachedFlow.state &&
      cachedFlow.state.plubotId === plubotId
    ) {
      localStorage.removeItem(flowCacheKey);
    }
  }, [plubotId]);

  const _handleEditModeOperation = useCallback(
    async (finalPayload) => {
      const response = await request(
        'PUT',
        `/plubots/update/${plubotId}`,
        finalPayload,
      );
      if (response?.status === 'success') {
        setMessageText('¡Plubot actualizado con éxito!');
        await fetchUserProfile(true);
        _performCacheSynchronization();
        setTimeout(() => navigate('/profile'), 1500);
      } else {
        throw new Error(response?.message || 'Error al actualizar el Plubot');
      }
    },
    [
      plubotId,
      request,
      fetchUserProfile,
      navigate,
      _performCacheSynchronization,
    ],
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
    [createBot, fetchUserProfile, setShowParticleEffect, navigate],
  );

  // Helper function to handle save/activation logic
  const handleSaveOrActivation = useCallback(async () => {
    setIsLoading(true);
    setMessageText(
      isEditMode ? 'Actualizando tu Plubot...' : 'Activando tu Plubot...',
    );

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
      setErrorMessage(error.message || 'Ocurrió un error inesperado.');
      setIsLoading(false);
    }
  }, [
    isEditMode,
    plubotData,
    nameInput,
    selectedPowers,
    _handleEditModeOperation,
    _handleCreationModeOperation,
  ]);

  // Función principal para avanzar a la siguiente sección
  const goToNextSection = async () => {
    // Validate current section
    if (!validateCurrentSection()) {
      return;
    }

    setErrorMessage(''); // Limpiar errores si la validación pasa

    // Navigate between sections (not preview)
    if (activeSection !== 'preview') {
      navigateToNextSection();
      return;
    }

    // Handle save/activation in preview section
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
      // No default
    }
  };

  const _renderNameSection = useCallback(
    () => (
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
            Estás {plubotId ? 'editando un' : 'creando un'}{' '}
            <strong>Plubot Despierto Gratuito</strong>:
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
    ),
    [nameInput, handleInputChange, errorMessage, plubotId],
  );

  const _renderPersonalitySection = useCallback(
    () => (
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
              <div
                className='personality-icon'
                style={{ backgroundColor: p.color }}
              >
                {p.icon}
              </div>
              <h3>{p.type}</h3>
              <p>{p.description}</p>
              {plubotData.tone === p.type.toLowerCase() && (
                <div className='checkmark-overlay'>✔</div>
              )}
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
    ),
    [plubotData.tone, handlePersonalitySelect, errorMessage, personalities],
  );

  const _renderPowersSection = useCallback(
    () => (
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
              <img
                src={power.image}
                alt={power.title}
                className='power-image'
              />
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
            ¿Quieres más poderes?{' '}
            <Link to='/marketplace'>Explora el Marketplace</Link> (requiere plan
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
    ),
    [selectedPowers, handlePowerToggle, errorMessage, freePowers],
  );

  const _renderPreviewSection = useCallback(
    () => (
      <motion.div
        className='creation-section preview-section'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className='section-title'>
          {plubotId ? 'Revisión de Cambios' : 'Activación Final'}
        </h2>
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
                ? [...selectedPowers]
                    .map((id) => powers.find((p) => p.id === id)?.title)
                    .join(', ')
                : 'Ninguno'}
            </span>
          </div>
          <div className='preview-stat'>
            <span className='stat-label'>Canal:</span>
            <span className='stat-value'>Chat Web</span>
          </div>
        </div>
        <div className='completion-message'>
          <h3>
            {plubotId
              ? '¡Tu Plubot está actualizado!'
              : '¡Tu Plubot Despierto está listo!'}
          </h3>
          <p>
            {plubotId
              ? 'Revisa los cambios y guarda para aplicarlos.'
              : 'Continúa para configurar su comportamiento en el editor de flujos.'}
          </p>
        </div>
      </motion.div>
    ),
    [plubotId, plubotData, nameInput, selectedPowers],
  );

  const renderContent = () => {
    if (isLoading && activeSection === 'name') {
      return (
        <motion.div
          className='creation-section loading-section'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className='loading-spinner'>Cargando datos del Plubot...</div>
        </motion.div>
      );
    }

    switch (activeSection) {
      case 'name': {
        return _renderNameSection();
      }
      case 'personality': {
        return _renderPersonalitySection();
      }
      case 'powers': {
        return _renderPowersSection();
      }
      case 'preview': {
        return _renderPreviewSection();
      }
      default:
    }
  };

  return (
    <div className='creation-lab' ref={containerReference}>
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
              // Sistema determinístico configurable: más predecible, testeable y mantenible
              const seedFactor = (index * 19 + 37) % 360; // 0-359 para ángulos

              return (
                <div
                  key={`particle-${seedFactor}-${index * 19 + 37}`}
                  className='absolute w-2 h-2 bg-cyan-400 rounded-full animate-ping'
                  style={{
                    // Ángulo determinístico con distribución uniforme
                    '--angle': `${seedFactor}deg`,
                    // Distancia determinística
                    '--distance': `${40 + (seedFactor % 40)}%`, // 40% a 79%
                    // Tamaño determinístico
                    '--size': `${5 + (seedFactor % 8)}px`, // 5px a 12px
                    backgroundColor: '#00e0ff',
                  }}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
      <div className='cosmic-grid'>
        {Array.from({ length: 10 }).map(() => (
          <div key={`grid-line-${crypto.randomUUID()}`} className='grid-line' />
        ))}
      </div>
      <div className='progress-tracker'>
        <div className='progress-nodes'>
          {['Identidad', 'Personalidad', 'Poderes', 'Revisión'].map(
            (step, index) => {
              const stepProgress = (index + 1) * 25;
              const isActive = progress >= stepProgress;
              return (
                <div className='progress-step' key={step}>
                  <div
                    className={`progress-node ${isActive ? 'active' : ''}`}
                    style={{ borderColor: isActive ? '#00e0ff' : undefined }}
                  >
                    {isActive && (
                      <div
                        className='node-fill'
                        style={{ backgroundColor: '#00e0ff' }}
                      />
                    )}
                  </div>
                  <span className='step-label'>{step}</span>
                </div>
              );
            },
          )}
        </div>
        <div className='progress-bar'>
          <div
            className='progress-fill'
            style={{ width: `${progress}%`, backgroundColor: '#00e0ff' }}
          />
        </div>
      </div>
      <div className='lab-content'>
        <div className='hologram-section'>
          <div className='hologram-container'>
            <div
              className='hologram-platform'
              style={{ boxShadow: `0 0 30px #00e0ff` }}
            >
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
            <div
              className='plubot-hologram'
              style={{ transform: `rotateY(${hologramRotation}deg)` }}
            >
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
              <img
                src={byteImage}
                alt='Byte Assistant'
                className='byte-avatar'
              />
              <div className='message-text'>
                <span>{messageText}</span>
                {isTyping && <span className='blink-cursor'>_</span>}
              </div>
            </div>
          </div>
        </div>
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
                  const loadingText = plubotId
                    ? 'Actualizando...'
                    : 'Activando...';
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
        </div>
      </div>
    </div>
  );
};

export default PersonalizationForm;
