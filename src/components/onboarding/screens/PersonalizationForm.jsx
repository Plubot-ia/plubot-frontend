import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link, useSearchParams, useLocation } from 'react-router-dom';
import { usePlubotCreation } from '@/context/PlubotCreationContext.jsx';
import Particles from '@tsparticles/react';
import plubotImage from '@/assets/img/plubot.svg';
import byteImage from '@/assets/img/byte.png';
import proLogo from '@/assets/img/plubotpro.svg';
import { powers } from '@/data/powers.js';
import './PersonalizationForm.css';
import useAuthStore from '@/stores/useAuthStore';
import useAPI from '@/hooks/useAPI';

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
  const containerRef = useRef(null);
  const previousPlubotIdRef = useRef(null);
  const { plubotData, updatePlubotData, nextStep, activeSection, updateActiveSection, resetPlubotCreation } = usePlubotCreation();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { request, createBot, loading, error } = useAPI();
  const { user, updateProfile, setUser } = useAuthStore();
  
  // Obtener el ID del plubot y la fuente de navegación
  const plubotId = searchParams.get('plubotId');
  const source = searchParams.get('source') || '';
  const isEditMode = Boolean(plubotId);

  // Nuevas personalidades (todas elegibles)
  const personalities = [
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

  // Mensajes contextuales para cada personalidad
  const personalityMessages = {
    audaz: {
      welcome: '¡Hey crack! ¿Listo para la acción?',
      bye: '¡Nos vemos, leyenda! No tardes en volver.',
      error: 'Oops… algo explotó, pero tranquilo, ya lo arreglo.',
      confirmation: '¡Hecho! Rapidísimo como siempre.',
      farewell: '¡Chau chau, campeón!',
    },
    sabio: {
      welcome: 'Saludos. Es un honor atenderte.',
      bye: 'Gracias por tu tiempo. Hasta pronto.',
      error: 'Lamento el inconveniente. Procedo a corregirlo.',
      confirmation: 'Confirmado. Todo está en orden.',
      farewell: 'Que tengas un excelente día.',
    },
    servicial: {
      welcome: '¡Hola! ¿En qué puedo ayudarte hoy?',
      bye: 'Me despido, pero recuerda que siempre estoy cerca.',
      error: '¡Oh no! Déjame arreglar eso para ti.',
      confirmation: 'Perfecto, ya está todo listo.',
      farewell: '¡Un gusto haberte asistido!',
    },
    creativo: {
      welcome: '¡Wiii! Llegaste. Vamos a crear magia.',
      bye: '¡Chau chau, nos vemos en la próxima locura!',
      error: 'Uy… algo salió raro. ¡Pero lo convertimos en arte!',
      confirmation: '¡Listo! Esto va a quedar épico.',
      farewell: '¡Nos vemos! Que las ideas no te falten.',
    },
    neutral: {
      welcome: 'Hola, ¿cómo puedo asistirte?',
      bye: 'Sesión finalizada. Hasta luego.',
      error: 'Hubo un error. Procedo a solucionarlo.',
      confirmation: 'Acción completada correctamente.',
      farewell: 'Gracias por usar Plubot.',
    },
    misterioso: {
      welcome: 'Te esperaba… dime, ¿qué buscas?',
      bye: 'Nos volveremos a cruzar. Lo sé.',
      error: 'Un contratiempo… déjame encargarme.',
      confirmation: 'Todo está en marcha. Como debía ser.',
      farewell: 'Desaparezco… por ahora.',
    },
  };

  const freePowers = [
    'notion', 'slack', 'trello', 'google-sheets', 'github', 'typeform', 'discord',
    'asana', 'monday', 'zoom', 'instagram', 'google-analytics', 'hubspot'
  ];

  const messages = {
    name: plubotId
      ? "Edita el nombre de tu Plubot para reflejar su nueva identidad."
      : "Dale un nombre único a tu Plubot Despierto. ¡Este será su identidad en el Pluniverse!",
    personality: plubotId
      ? "Ajusta la personalidad de tu Plubot para cambiar cómo interactúa."
      : "Elige una personalidad para tu Plubot. Define cómo interactuará con el mundo.",
    powers: plubotId
      ? "Modifica los poderes de tu Plubot para adaptarlo a nuevas tareas."
      : "Selecciona poderes gratuitos para tu Plubot. Los poderes Pro desbloquean integraciones avanzadas.",
    preview: plubotId
      ? "¡Tu Plubot está actualizado! Revisa los cambios antes de guardar."
      : "¡Tu Plubot Despierto está listo! Actívalo para configurar sus respuestas.",
  };

  // Función para cargar datos del Plubot
  const fetchPlubotData = useCallback(async (id) => {
    if (!id) return false;
    
    setIsLoading(true);
    setErrorMessage('');
    
    try {

      const response = await request('GET', `/api/plubots/${id}`);
      
      if (response?.status === 'success' && response?.plubot) {
        const { name, tone, color, powers, purpose, initial_message } = response.plubot;
        
        // Normalizar datos para evitar valores nulos o indefinidos
        const normalizedTone = tone ? tone.toLowerCase() : 'neutral';
        const normalizedPowers = Array.isArray(powers) 
          ? powers 
          : (typeof powers === 'string' ? powers.split(',').filter(p => p) : []);
        
        // Actualizar el contexto con datos completos
        updatePlubotData({
          id,
          name: name || '',
          tone: normalizedTone,
          color: color || '#D1D5DB',
          powers: normalizedPowers,
          purpose: purpose || 'asistir a los clientes en chat web',
          initial_message: initial_message || ''
        });
        
        // Actualizar estados locales
        setNameInput(name || '');
        setEnergyLevel(name ? Math.min(name.length * 10, 100) : 0);
        
        return true;
      } else {
        const errorMsg = response?.message || 'Error desconocido al cargar datos';

        setErrorMessage(errorMsg);
        setMessageText(`Error al cargar el Plubot: ${errorMsg}`);
        return false;
      }
    } catch (error) {

      
      // Manejar errores específicos
      if (error.message?.includes('404')) {
        setErrorMessage('Plubot no encontrado');
        setMessageText('Plubot no encontrado. Verifica el ID del Plubot.');
      } else {
        setErrorMessage(error.message || 'Error de conexión');
        setMessageText(`Error al cargar el Plubot: ${error.message || 'Error de conexión'}`);
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [request, updatePlubotData, setMessageText]);

  // Efecto para cargar datos del Plubot en modo edición o reiniciar en modo creación
  useEffect(() => {
    // Evitar recargas innecesarias si el ID no ha cambiado
    if (previousPlubotIdRef.current === plubotId) return;
    previousPlubotIdRef.current = plubotId;
    
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
    setProgress(sectionProgress[activeSection] || 25);
  }, [activeSection]);

  // Actualizar mensaje basado en activeSection
  useEffect(() => {
    setMessageText(messages[activeSection]);
    setIsTyping(true);
    setCurrentChar(0);
  }, [activeSection]);

  useEffect(() => {
    const rotationInterval = setInterval(() => {
      setHologramRotation(prev => (prev + 0.5) % 360);
    }, 100);
    return () => clearInterval(rotationInterval);
  }, []);

  useEffect(() => {
    const currentMessage = messages[activeSection] || '';
    if (isTyping && currentChar < currentMessage.length) {
      const typingTimeout = setTimeout(() => {
        setMessageText(currentMessage.substring(0, currentChar + 1));
        setCurrentChar(prev => prev + 1);
      }, 30);
      return () => clearTimeout(typingTimeout);
    } else if (currentChar >= currentMessage.length) {
      setIsTyping(false);
    }
  }, [isTyping, currentChar, activeSection]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'name') {
      setNameInput(value);
      setEnergyLevel(Math.min(value.length * 10, 100));
    } else {
      updatePlubotData({ [name]: value });
    }
  };

  const handlePersonalitySelect = (personality) => {
    updatePlubotData({
      tone: personality.type.toLowerCase(),
      color: personality.color,
    });
    setShowParticleEffect(true);
    setTimeout(() => setShowParticleEffect(false), 1500);
  };

  const handlePowerToggle = (powerId) => {
    if (freePowers.includes(powerId)) {
      const currentPowers = plubotData.powers || [];
      const newPowers = currentPowers.includes(powerId)
        ? currentPowers.filter(id => id !== powerId)
        : [...currentPowers, powerId];
      updatePlubotData({ powers: newPowers });
    }
  };

  // Validar datos del formulario según la sección actual
  const validateCurrentSection = useCallback(() => {
    switch (activeSection) {
      case 'name':
        if (!nameInput.trim()) {
          setErrorMessage('Nombre requerido');
          setMessageText('Por favor, dale un nombre a tu Plubot.');
          return false;
        }
        return true;
      case 'personality':
        if (!plubotData.tone) {
          setErrorMessage('Personalidad requerida');
          setMessageText('Por favor, selecciona una personalidad.');
          return false;
        }
        return true;
      case 'powers':
      case 'preview':
        return true;
      default:
        return false;
    }
  }, [activeSection, nameInput, plubotData.tone, setMessageText]);

  // Preparar payload para guardar o actualizar Plubot
  const preparePlubotPayload = useMemo(() => {
    return {
      name: plubotData.name || nameInput,
      tone: plubotData.tone || 'neutral',
      color: plubotData.color || '#D1D5DB',
      purpose: plubotData.purpose || 'asistir a los clientes en chat web',
      initial_message: personalityMessages[plubotData.tone?.toLowerCase()]?.welcome || '¡Hola! Soy tu Plubot Despierto, aquí para ayudarte.',
      powers: plubotData.powers || [],
      plan: 'free',
      limits: { responsesPerMonth: 100, channels: ['webchat'] }
    };
  }, [plubotData, nameInput, personalityMessages]);

  // Función para actualizar un Plubot existente
  const updateExistingPlubot = useCallback(async (id, payload) => {
    try {

      const response = await request('PUT', `/api/plubots/update/${id}`, payload);
      
      if (response?.status !== 'success') {
        throw new Error(response?.message || 'Error al actualizar el Plubot');
      }
      
      // Crear objeto actualizado con formato consistente
      const updatedPlubot = {
        id,
        name: payload.name,
        tone: payload.tone,
        color: payload.color,
        purpose: payload.purpose,
        initial_message: payload.initial_message,
        powers: Array.isArray(payload.powers) ? payload.powers.join(',') : payload.powers,
      };
      
      // Actualizar el perfil del usuario con el Plubot modificado
      const newPlubots = user?.plubots?.map(p => 
        p.id === id ? updatedPlubot : p
      ) || [];
      
      updateProfile({ plubots: newPlubots });
      
      // Forzar recarga de datos del perfil para asegurar consistencia
      const profileResponse = await request('GET', '/auth/profile');
      if (profileResponse?.status === 'success') {
        updateProfile({
          ...profileResponse.user,
          plubots: profileResponse.user.plubots || user?.plubots || []
        });
      }
      
      // Mostrar mensaje de éxito y redirigir
      setMessageText(personalityMessages[payload.tone]?.confirmation || '¡Plubot actualizado con éxito!');
      
      // Determinar destino de redirección basado en parámetro source
      const redirectTarget = source === 'profile' ? '/profile' : '/profile';
      setTimeout(() => navigate(`${redirectTarget}?t=${Date.now()}`), 1000);
      
      return true;
    } catch (error) {

      setErrorMessage(error.message || 'Error al actualizar');
      setMessageText(`Error al actualizar el Plubot: ${error.message || 'Error desconocido'}`);
      return false;
    }
  }, [request, user, updateProfile, personalityMessages, navigate, source, setMessageText]);

  // Función para crear un nuevo Plubot
  const createNewPlubot = useCallback(async (payload) => {
    try {
      // Crear respaldo local antes de enviar al servidor
      try {
        const localBackupKey = `plubot_backup_${Date.now()}`;
        localStorage.setItem(localBackupKey, JSON.stringify({
          data: payload,
          timestamp: new Date().toISOString(),
          status: 'pending'
        }));
      } catch (backupError) {

      }
      
      // Crear el Plubot usando el método robusto de createBot
      const response = await createBot(payload);
      
      if (response?.status !== 'success' || !response?.plubot?.id) {
        // Manejar caso de error recuperable
        if (response?._recoverable) {
          return handleRecoverableError(payload, response);
        }
        
        throw new Error(response?.message || 'Error al crear el Plubot');
      }
      
      // Procesar respuesta exitosa
      const newPlubotId = response.plubot.id;
      const isOfflineMode = response._offlineMode === true;
      
      // Crear objeto completo del nuevo Plubot
      const newPlubot = {
        id: newPlubotId,
        name: payload.name,
        tone: payload.tone,
        color: payload.color,
        purpose: payload.purpose,
        initial_message: payload.initial_message,
        powers: payload.powers, // Mantener como array si payload.powers es un array
        _offlineCreated: isOfflineMode
      };
      
      // Guardar el nombre en localStorage para que esté disponible en TrainingScreen
      try {
        localStorage.setItem(`plubot-name-${newPlubotId}`, payload.name);

      } catch (storageError) {

      }
      
      // Actualizar el contexto de creación con datos completos
      updatePlubotData({
        ...newPlubot,
        powers: payload.powers,
        flowData: { nodes: [], edges: [] },
        flowVersions: []
      });
      
      // Actualizar el perfil del usuario CON DATOS FRESCOS DEL BACKEND
      try {

        const profileResponse = await request('GET', '/auth/profile');
        if (profileResponse?.success === true && profileResponse?.user) {


          setUser(profileResponse.user); // Actualizar directamente el estado del usuario
        } else {

          if (profileResponse) {



          } else {

          }

          // Fallback a la lógica anterior si la recarga del perfil falla
          const authStore = useAuthStore.getState();
          // newPlubot debería estar definido en este scope desde la creación del Plubot
          const updatedPlubots = [...(authStore.user?.plubots || []), newPlubot]; 
          updateProfile({ plubots: updatedPlubots });
        }
      } catch (profileError) {

        // Fallback en caso de error en la petición de recarga
        const authStore = useAuthStore.getState();
        const updatedPlubots = [...(authStore.user?.plubots || []), newPlubot];
        updateProfile({ plubots: updatedPlubots });
      }
      
      // Mostrar mensaje apropiado
      setMessageText(isOfflineMode
        ? '¡Plubot creado localmente! Se sincronizará cuando haya conexión.'
        : personalityMessages[payload.tone]?.confirmation || '¡Plubot creado con éxito!');
      
      // Avanzar al siguiente paso y navegar a TrainingScreen
      nextStep();
      setTimeout(() => navigate(`/training?plubotId=${newPlubotId}`), 500);
      
      return true;
    } catch (error) {

      setErrorMessage(error.message || 'Error al crear');
      setMessageText(`Error al crear el Plubot: ${error.message || 'Error desconocido'}`);
      
      // Guardar datos para recuperación futura
      try {
        const failedPlubots = JSON.parse(localStorage.getItem('failed_plubots') || '[]');
        failedPlubots.push({
          data: payload,
          timestamp: new Date().toISOString(),
          error: error.message || 'Error desconocido'
        });
        localStorage.setItem('failed_plubots', JSON.stringify(failedPlubots));
      } catch (recoveryError) {

      }
      
      return false;
    }
  }, [createBot, updatePlubotData, nextStep, navigate, personalityMessages, setMessageText]);

  // Manejar errores recuperables durante la creación
  const handleRecoverableError = useCallback((payload, response) => {

    
    // Crear ID temporal y objeto recuperado
    const tempId = `local_${Date.now()}`;
    const recoveredPlubot = {
      id: tempId,
      name: payload.name,
      tone: payload.tone,
      color: payload.color,
      purpose: payload.purpose,
      initial_message: payload.initial_message,
      powers: Array.isArray(payload.powers) ? payload.powers.join(',') : payload.powers,
      _recoveryPending: true
    };
    
    // Actualizar contexto con datos recuperados
    updatePlubotData({
      ...recoveredPlubot,
      powers: payload.powers,
      flowData: { nodes: [], edges: [] },
      flowVersions: []
    });
    
    setMessageText('Se ha producido un error, pero tus datos están seguros. Continuando en modo de recuperación.');
    nextStep();
    
    // Navegar a TrainingScreen con modo de recuperación
    setTimeout(() => navigate(`/training?plubotId=${tempId}&recovery=true`), 500);
    return true;
  }, [updatePlubotData, nextStep, navigate, setMessageText]);

  // Función principal para avanzar a la siguiente sección
  const goToNextSection = async () => {
    // Validar la sección actual antes de avanzar
    if (!validateCurrentSection()) {
      return;
    }
    
    // Manejar la navegación entre secciones
    if (activeSection === 'name') {
      // Actualizar datos y avanzar a personalidad
      updatePlubotData({ name: nameInput });
      updateActiveSection('personality');
    } 
    else if (activeSection === 'personality') {
      // Avanzar a poderes
      updateActiveSection('powers');
    } 
    else if (activeSection === 'powers') {
      // Avanzar a vista previa
      updateActiveSection('preview');
    } 
    else if (activeSection === 'preview') {
      // Guardar o actualizar el Plubot
      setIsLoading(true);
      setErrorMessage('');
      
      try {
        // Preparar payload con datos actualizados
        const payload = preparePlubotPayload;
        
        // Ejecutar operación según modo (edición o creación)
        if (isEditMode) {
          await updateExistingPlubot(plubotId, payload);
        } else {
          await createNewPlubot(payload);
        }
      } catch (error) {

        setErrorMessage('Error inesperado');
        setMessageText(`Error inesperado: ${error.message || 'Desconocido'}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const goToPreviousSection = () => {

    if (activeSection === 'personality') {
      updateActiveSection('name');
    } else if (activeSection === 'powers') {
      updateActiveSection('personality');
    } else if (activeSection === 'preview') {
      updateActiveSection('powers');
    }
  };

  const renderContent = () => {
    if (isLoading && activeSection === 'name') {
      return (
        <motion.div
          className="creation-section loading-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="loading-spinner">Cargando datos del Plubot...</div>
        </motion.div>
      );
    }

    switch (activeSection) {
      case 'name':
        return (
          <motion.div
            className="creation-section name-section"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="section-title">Identidad Digital</h2>
            <div className="input-container">
              <input
                type="text"
                name="name"
                value={nameInput}
                onChange={handleInputChange}
                placeholder="Nombre de tu Plubot"
                className="plubot-input"
                maxLength={20}
              />
              <div className="input-underline"></div>
            </div>
            <div className="plan-info">
              <p>Estás {plubotId ? 'editando un' : 'creando un'} <strong>Plubot Despierto Gratuito</strong>:</p>
              <ul>
                <li>Respuestas automáticas en chat web</li>
                <li>Menú con hasta 3 botones</li>
                <li>Recolección de nombre, correo y motivo</li>
                <li>Límite de 100 respuestas/mes</li>
              </ul>
              <Link to="/pricing" className="plan-upgrade-link">
                ¡Explora el plan Pro para más poderes!
              </Link>
            </div>
          </motion.div>
        );
      case 'personality':
        return (
          <motion.div
            className="creation-section personality-section"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="section-title">Núcleo de Personalidad</h2>
            <div className="personality-grid">
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
                  <div className="personality-icon" style={{ backgroundColor: p.color }}>{p.icon}</div>
                  <h3>{p.type}</h3>
                  <p>{p.description}</p>
                  {plubotData.tone === p.type.toLowerCase() && (
                    <div className="checkmark-overlay">✔</div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        );
      case 'powers':
        return (
          <motion.div
            className="creation-section powers-section"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="section-title">Poderes del Plubot</h2>
            <div className="powers-grid">
              {powers.map((power) => (
                <motion.div
                  key={power.id}
                  className={`power-card ${!freePowers.includes(power.id) ? 'disabled' : ''} ${
                    plubotData.powers?.includes(power.id) ? 'selected' : ''
                  }`}
                  onClick={() => handlePowerToggle(power.id)}
                  whileHover={{ scale: 1.03 }}
                >
                  <img src={power.image} alt={power.title} className="power-image" />
                  <div className="text-overlay">
                    <h3>{power.title}</h3>
                    <p>{power.description}</p>
                  </div>
                  {!freePowers.includes(power.id) && (
                    <div className="pro-overlay">
                      <img src={proLogo} alt="Pro Feature" className="pro-logo" />
                      <span>Requiere Plan Pro</span>
                    </div>
                  )}
                  {plubotData.powers?.includes(power.id) && freePowers.includes(power.id) && (
                    <div className="power-active-indicator">
                      <div className="power-pulse"></div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
            <div className="marketplace-preview">
              <p>¿Quieres más poderes? <Link to="/marketplace">Explora el Marketplace</Link> (requiere plan Pro para algunos).</p>
            </div>
          </motion.div>
        );
      case 'preview':
        return (
          <motion.div
            className="creation-section preview-section"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="section-title">{plubotId ? 'Revisión de Cambios' : 'Activación Final'}</h2>
            <div className="preview-info">
              <div className="preview-stat">
                <span className="stat-label">Nombre:</span>
                <span className="stat-value">{plubotData.name || nameInput}</span>
              </div>
              <div className="preview-stat">
                <span className="stat-label">Personalidad:</span>
                <span className="stat-value">{plubotData.tone || 'Neutral'}</span>
              </div>
              <div className="preview-stat">
                <span className="stat-label">Color:</span>
                <span className="stat-value">{plubotData.color || '#D1D5DB'}</span>
              </div>
              <div className="preview-stat">
                <span className="stat-label">Poderes:</span>
                <span className="stat-value">
                  {plubotData.powers?.length > 0
                    ? plubotData.powers.map(id => powers.find(p => p.id === id)?.title).join(', ')
                    : 'Ninguno'}
                </span>
              </div>
              <div className="preview-stat">
                <span className="stat-label">Canal:</span>
                <span className="stat-value">Chat Web</span>
              </div>
            </div>
            <div className="completion-message">
              <h3>{plubotId ? '¡Tu Plubot está actualizado!' : '¡Tu Plubot Despierto está listo!'}</h3>
              <p>{plubotId ? 'Revisa los cambios y guarda para aplicarlos.' : 'Continúa para configurar su comportamiento en el editor de flujos.'}</p>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  const particlesInit = async (engine) => {
    const { loadSlim } = await import('@tsparticles/slim');
    await loadSlim(engine);

  };

  return (
    <div className="creation-lab" ref={containerRef}>
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={{
          fullScreen: { enable: true },
          particles: {
            number: { value: 50, density: { enable: true, value_area: 800 } },
            color: { value: "#00e0ff" },
            shape: { type: "circle" },
            opacity: { value: 0.3, random: true },
            size: { value: 2, random: true },
            move: {
              enable: true,
              speed: 1,
              direction: "none",
              random: true,
              outModes: "out",
              attract: { enable: false }
            },
            links: {
              enable: true,
              distance: 120,
              color: "#00e0ff",
              opacity: 0.1,
              width: 1,
            }
          }
        }}
      />
      <AnimatePresence>
        {showParticleEffect && (
          <motion.div
            className="personality-particles"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
          >
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="personality-particle"
                style={{
                  '--angle': `${Math.random() * 360}deg`,
                  '--distance': `${Math.random() * 40 + 40}%`,
                  '--size': `${Math.random() * 8 + 5}px`,
                  backgroundColor: '#00e0ff'
                }}
              ></div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="cosmic-grid">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="grid-line"></div>
        ))}
      </div>
      <div className="progress-tracker">
        <div className="progress-nodes">
          {['Identidad', 'Personalidad', 'Poderes', 'Revisión'].map((step, index) => {
            const stepProgress = (index + 1) * 25;
            const isActive = progress >= stepProgress;
            return (
              <div className="progress-step" key={step}>
                <div
                  className={`progress-node ${isActive ? 'active' : ''}`}
                  style={{ borderColor: isActive ? '#00e0ff' : undefined }}
                >
                  {isActive && <div className="node-fill" style={{ backgroundColor: '#00e0ff' }}></div>}
                </div>
                <span className="step-label">{step}</span>
              </div>
            );
          })}
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%`, backgroundColor: '#00e0ff' }}
          ></div>
        </div>
      </div>
      <div className="lab-content">
        <div className="hologram-section">
          <div className="hologram-container">
            <div className="hologram-platform" style={{ boxShadow: `0 0 30px #00e0ff` }}>
              <div className="platform-rings">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="platform-ring" style={{ borderColor: '#00e0ff' }}></div>
                ))}
              </div>
            </div>
            <div className="plubot-hologram" style={{ transform: `rotateY(${hologramRotation}deg)` }}>
              <div
                className="energy-meter"
                style={{ height: `${energyLevel}%`, backgroundColor: '#00e0ff' }}
              ></div>
              <img
                src={plubotImage}
                alt="Plubot"
                className="plubot-image"
                style={{ filter: `drop-shadow(0 0 10px #00e0ff)` }}
              />
              {(plubotData.name || nameInput) && (
                <motion.div
                  className="plubot-name-display"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {plubotData.name || nameInput}
                </motion.div>
              )}
            </div>
            <div className="hologram-circles">
              {[...Array(3)].map((_, i) => (
                <div key={i} className={`hologram-circle circle${i+1}`} style={{ borderColor: '#00e0ff' }}></div>
              ))}
            </div>
            <div className="energy-beams">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="energy-beam"
                  style={{
                    transform: `rotate(${i * 90}deg)`,
                    backgroundColor: '#00e0ff',
                    opacity: energyLevel / 200 + 0.1
                  }}
                ></div>
              ))}
            </div>
          </div>
          <div className="message-console">
            <div className="console-header">
              <div className="console-dots">
                <div className="console-dot"></div>
                <div className="console-dot"></div>
                <div className="console-dot"></div>
              </div>
              <span>LABORATORIO PLUBOT v2.5</span>
            </div>
            <div className="console-content">
              <img src={byteImage} alt="Byte Assistant" className="byte-avatar" />
              <div className="message-text">
                <span>{messageText}</span>
                {isTyping && <span className="blink-cursor">_</span>}
              </div>
            </div>
          </div>
        </div>
        <div className="creation-interface">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="creation-content"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
          <div className="nav-controls">
            {activeSection !== 'name' && (
              <motion.button
                className="nav-button back-button"
                onClick={goToPreviousSection}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
              >
                Atrás
              </motion.button>
            )}
            <motion.button
              className="nav-button next-button"
              onClick={goToNextSection}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              style={{ background: `linear-gradient(45deg, #00e0ff, #ff00ff)` }}
              disabled={isLoading}
            >
              {isLoading ? (
                <span><i className="fas fa-spinner fa-spin"></i> {plubotId ? 'Actualizando...' : 'Activando...'}</span>
              ) : (
                plubotId ? 'Guardar Cambios' : activeSection === 'preview' ? 'Activar Plubot' : 'Continuar'
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalizationForm;