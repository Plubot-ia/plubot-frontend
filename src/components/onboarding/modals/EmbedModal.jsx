import confetti from 'canvas-confetti';
import {
  X,
  Copy,
  Link,
  Code,
  ExternalLink,
  Settings,
  Globe,
  Download,
  Share2,
  Award,
  Zap,
  Star,
  Trophy,
  MessageCircle,
} from 'lucide-react';
import PropTypes from 'prop-types';
import React, { useState, useEffect, useRef } from 'react';

import useAPI from '@/hooks/useAPI';

import './EmbedModal.css';

// Importar el contexto global
import useByteMessageContext from '../../../hooks/useByteMessageContext';
import useModalContext from '../../../hooks/useModalContext';

import CustomizeSection from './CustomizeSection';
import WhatsappBusinessPanel from './WhatsappBusinessPanel';
import WhatsappIntegrationPanel from './WhatsappIntegrationPanel';
// Si no tienes canvas-confetti, puedes instalarlo con: npm install canvas-confetti

// Custom hook para manejar achievements y gamificación
const useAchievements = (showNotification) => {
  const [shareCount, setShareCount] = useState(0);
  const [achievements, setAchievements] = useState({
    firstShare: false,
    socialMedia: false,
    embedMaster: false,
    customizer: false,
  });

  const checkAndUpdateAchievements = (newCount) => {
    const newAchievements = { ...achievements };

    if (!newAchievements.firstShare) {
      newAchievements.firstShare = true;
      showNotification('¡Logro desbloqueado! Primera compartición', 'achievement');
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FFA500', '#FF4500'],
      });
    }

    if (newCount >= 5 && !newAchievements.embedMaster) {
      newAchievements.embedMaster = true;
      showNotification('¡Logro desbloqueado! Maestro del Embebido', 'achievement');
    }

    setAchievements(newAchievements);
  };

  return {
    shareCount,
    setShareCount,
    achievements,
    setAchievements,
    checkAndUpdateAchievements,
  };
};

// Función pura para generar el código de embebido. Se mueve fuera del scope del componente
// para evitar que se recree en cada render, ya que no depende de props o estado.
const generateEmbedCodeFromData = (publicId, options, baseUrl) =>
  `<!-- Plubot Widget -->
<div id="plubot-widget-container"></div>
<script src="${baseUrl}/embed/plubot.js" id="plubot-script"
  data-bot-id="${publicId}"
  data-theme="${options.theme}"
  data-position="${options.position}"
  data-width="${options.width}"
  data-height="${options.height}"
  data-primary-color="${options.primaryColor}"
  data-welcome="${options.welcomeMessage}">
</script>
<!-- End Plubot Widget -->`;

/* eslint-disable max-lines-per-function */
// DEUDA TÉCNICA: EmbedModal es el componente crítico de monetización y distribución.
// La función (460 líneas) maneja múltiples responsabilidades de alto valor: generación de
// códigos embebidos, customización visual, gamificación, integración API, efectos visuales,
// y exportación de flujos. Incluye lógica compleja de corrección de bucles infinitos.
// ARQUITECTURA: Parcialmente modularizada con subcomponentes y helpers especializados.
// RIESGO: Refactorización comprometería funcionalidad crítica de distribución de Plubots.
// FUTURE: Dividir en modal orquestador + componentes especializados en refactor mayor.
// Regla desactivada para preservar estabilidad del sistema de monetización crítico.

const EmbedModal = ({ plubotId, plubotName, onClose, onExport, _flowData }) => {
  // Usar el contexto global
  const { showNotification } = useByteMessageContext();
  const { closeModal } = useModalContext();

  const [embedCode, setEmbedCode] = useState('');
  const [directLink, setDirectLink] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('link');
  const [customization, setCustomization] = useState({
    theme: 'light',
    position: 'right',
    width: '350px',
    height: '500px',
    primaryColor: '#4facfe',
    welcomeMessage: '¡Hola! Soy tu asistente virtual.',
  });
  const { request } = useAPI();

  // Referencia para el elemento donde lanzar confetti
  const confettiReference = useRef();

  // Estado para gamificación usando custom hook
  const { shareCount, setShareCount, achievements, setAchievements, checkAndUpdateAchievements } =
    useAchievements(showNotification);

  // Extraer generación de recursos de respaldo para reducir complejidad
  const generateFallbackResources = () => {
    const baseUrl = globalThis.location.origin.replace('www.', '');
    setDirectLink(`${baseUrl}/chat/${plubotId}`);
    setEmbedCode(generateEmbedCodeFromData(plubotId, customization, baseUrl));
    const chatUrl = `${baseUrl}/chat/${plubotId}`;
    setQrCode(
      `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(chatUrl)}`,
    );
    showNotification('Recursos de respaldo generados (usando ID directo).', 'info');
  };

  // Extraer lógica de celebración confetti para reducir complejidad
  const triggerSuccessCelebration = () => {
    setTimeout(() => {
      if (confettiReference.current) {
        confetti({
          particleCount: 200,
          spread: 90,
          origin: { y: 0.6 },
          colors: ['#00e0ff', '#ff00ff', '#00ff9d', '#ffffff'],
        });
      }
    }, 500);
  };

  // Extraer sección QR en subcomponente para reducir complejidad
  const QRSection = () => (
    <div className='embed-section'>
      <h3>Código QR</h3>
      <p>Escanea este código QR para acceder al Plubot desde cualquier dispositivo:</p>
      <div className='embed-qr-container'>
        {qrCode ? (
          <img src={qrCode} alt='QR Code' className='embed-qr-image' />
        ) : (
          <div className='embed-qr-placeholder'>
            <p>No se pudo generar el código QR</p>
          </div>
        )}
        <button
          className='embed-download-button'
          onClick={() => {
            if (qrCode) {
              const link = document.createElement('a');
              link.href = qrCode;
              link.download = `plubot-${plubotId}-qr.png`;
              document.body.append(link);
              link.click();
              link.remove();
            } else {
              showNotification('No hay código QR para descargar', 'error');
            }
          }}
        >
          <Download size={18} />
          Descargar QR
        </button>
      </div>
    </div>
  );

  // Extraer sección Export en subcomponente para reducir complejidad
  const ExportSection = () => (
    <div className='embed-section'>
      <h3>Exportar Flujo</h3>
      <p>Exporta tu flujo en formato JSON para respaldarlo o compartirlo con otros usuarios:</p>
      <div
        className='embed-export-actions'
        style={{
          marginTop: '20px',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <button
          className='embed-action-button primary'
          style={{
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
          onClick={onExport}
        >
          <Download size={18} />
          Descargar JSON
        </button>
      </div>
      <div
        style={{
          marginTop: '20px',
          backgroundColor: '#f8f9fa',
          padding: '15px',
          borderRadius: '5px',
          border: '1px solid #e9ecef',
        }}
      >
        <h4 style={{ marginTop: '0', color: '#495057' }}>¿Qué contiene el archivo exportado?</h4>
        <ul style={{ paddingLeft: '20px', color: '#6c757d' }}>
          <li>Todos los nodos de tu flujo con sus configuraciones</li>
          <li>Todas las conexiones entre nodos</li>
          <li>Posiciones de los elementos en el editor</li>
          <li>Propiedades y datos específicos de cada nodo</li>
        </ul>
        <p style={{ marginBottom: '0', color: '#6c757d' }}>
          Este archivo puede ser importado posteriormente para restaurar tu flujo exactamente como
          lo dejaste.
        </p>
      </div>
    </div>
  );

  // Mover handleCustomizationChange antes del subcomponente para evitar no-use-before-define
  const handleCustomizationChange = (key, value) => {
    setCustomization((previous) => ({ ...previous, [key]: value }));
  };

  // Extraer panel de achievements en subcomponente para reducir complejidad
  const AchievementsPanel = () => (
    <div className='achievements-panel'>
      <h3>
        <Trophy size={20} /> Tus Logros
      </h3>
      <div className='achievements-grid'>
        <div className={`achievement ${achievements.firstShare ? 'unlocked' : 'locked'}`}>
          <Award size={24} />
          <span>Primera Compartición</span>
        </div>
        <div className={`achievement ${achievements.embedMaster ? 'unlocked' : 'locked'}`}>
          <Star size={24} />
          <span>Maestro del Embebido</span>
        </div>
        <div className={`achievement ${achievements.socialMedia ? 'unlocked' : 'locked'}`}>
          <Zap size={24} />
          <span>Influencer Social</span>
        </div>
        <div className={`achievement ${achievements.customizer ? 'unlocked' : 'locked'}`}>
          <Settings size={24} />
          <span>Personalizador</span>
        </div>
      </div>
    </div>
  );

  // --- INICIO DE LA CORRECCIÓN DEL BUCLE INFINITO ---
  // Se ha refactorizado la lógica de generación de recursos para eliminar el bucle infinito.
  // El problema original era que las funciones `request` y `showNotification` de los hooks
  // personalizados no estaban memoizadas, lo que causaba que se recrearan en cada render
  // y dispararan el `useEffect` continuamente.
  //
  // La solución consiste en:
  // 1. Unificar toda la lógica en un solo `useEffect`.
  // 2. Hacer que el `useEffect` dependa EXCLUSIVAMENTE de los datos que deben
  //    disparar una nueva generación de recursos: `plubotId` y `customization`.
  // 3. Omitir intencionadamente las funciones inestables (`request`, `showNotification`)
  //    de la lista de dependencias, aceptando la advertencia del linter para lograr
  //    estabilidad funcional. Esto es una decisión de diseño consciente y necesaria.

  useEffect(() => {
    const generateResources = async () => {
      if (!plubotId) {
        setIsLoading(false);
        showNotification('Error: ID del Plubot no proporcionado.', 'error');
        return;
      }

      setIsLoading(true);

      try {
        const response = await request('POST', `/plubots/${plubotId}/embed`, {
          customization,
        });

        if (response && response.status === 'success' && response.data) {
          const baseUrl = globalThis.location.origin.replace('www.', '');
          setDirectLink(`${baseUrl}/chat/${response.data.publicId}`);
          setEmbedCode(generateEmbedCodeFromData(response.data.publicId, customization, baseUrl));
          setQrCode(response.data.qrCodeUrl);
          showNotification('Recursos de embebido generados correctamente.', 'success');
          triggerSuccessCelebration();
        } else {
          generateFallbackResources();
        }
      } catch {
        generateFallbackResources();
      } finally {
        setIsLoading(false);
      }
    };

    generateResources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plubotId, customization]);
  // --- FIN DE LA CORRECCIÓN ---

  const copyToClipboard = (text, type) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        // Incrementar contador de comparticiones y usar el valor actualizado para logros
        const newCount = shareCount + 1;
        setShareCount(newCount);
        checkAndUpdateAchievements(newCount);

        showNotification(`${type} copiado al portapapeles! ¡Comparte tu creación!`, 'success');
      })
      .catch((_error) => {
        showNotification(`Error al copiar ${type.toLowerCase()}`, 'error');
      });
  };

  // Extraer handler de botón principal para reducir complejidad
  const handlePrimaryButtonClick = () => {
    switch (activeTab) {
      case 'link': {
        copyToClipboard(directLink, 'Enlace');
        break;
      }
      case 'embed': {
        copyToClipboard(embedCode, 'Código');
        break;
      }
      case 'customize': {
        showNotification('Cambios aplicados', 'success');
        break;
      }
      // No default
    }
  };

  // Extraer lógica de texto del botón para reducir complejidad
  const getPrimaryButtonText = () => {
    if (activeTab === 'customize') return 'Aplicar Cambios';
    if (activeTab === 'export') return 'Exportar';
    return 'Copiar';
  };

  const UniverseBackground = () => {
    // Generar estrellas con diferentes tamaños, opacidades y velocidades de parpadeo
    const renderStars = () => {
      const stars = [];
      const starCount = 100; // Cantidad de estrellas

      for (let index = 0; index < starCount; index++) {
        // Sistema determinístico configurable basado en índice: más predecible y testeable
        const seedFactor = (index * 7 + 13) % 100; // Generador pseudo-aleatorio determinístico

        // Tamaño determinístico para las estrellas
        const size = 1 + (seedFactor % 3);

        // Colores para las estrellas con selección determinística
        const colors = ['#fff', '#8df9ff', '#c8f4ff', '#e6fbff', '#d9e8ff'];
        const color = colors[index % colors.length];

        // Duración del parpadeo determinística
        const twinkleDuration = `${3 + (seedFactor % 7)}s`;

        // Retraso del parpadeo determinístico
        const twinkleDelay = `${(seedFactor * 3) % 10}s`;

        // Opacidad base determinística
        const opacity = 0.3 + (seedFactor % 70) / 100;

        // Tamaño del brillo determinístico
        const glowSize = size * (1 + (seedFactor % 100) / 100);

        stars.push(
          <div
            key={`star-${index}`}
            className='star'
            style={{
              // Posicionamiento determinístico: más predecible y testeable
              left: `${(seedFactor * 2 + index * 3) % 100}%`,
              top: `${(seedFactor * 5 + index * 7) % 100}%`,
              '--star-size': `${size}px`,
              '--star-opacity': opacity,
              '--twinkle-duration': twinkleDuration,
              '--twinkle-delay': twinkleDelay,
              '--glow-size': `${glowSize}px`,
              '--glow-color': color,
              backgroundColor: color,
            }}
          />,
        );
      }

      return stars;
    };

    return (
      <div className='stars-container'>
        {renderStars()}
        <div className='nebula nebula-1' />
        <div className='nebula nebula-2' />
        <div className='nebula nebula-3' />
      </div>
    );
  };

  return (
    <div className='embed-modal-overlay' ref={confettiReference}>
      <UniverseBackground />
      <div className='embed-modal'>
        <div className='embed-modal-header'>
          <h2>
            <Share2 size={24} className='share-icon' /> ¡Comparte tu Plubot!
          </h2>
          <button
            className='embed-modal-close-button'
            aria-label='Cerrar modal'
            onClick={() => {
              if (closeModal) {
                closeModal('embedModal');
              } else if (typeof onClose === 'function') {
                onClose();
              }
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Panel de logros */}
        <AchievementsPanel />

        <div className='embed-tabs'>
          <button
            className={`embed-tab-button ${activeTab === 'link' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('link');
              if (achievements.firstShare) {
                confetti({
                  particleCount: 30,
                  spread: 50,
                  origin: { y: 0.6 },
                });
              }
            }}
          >
            <Link size={18} />
            Enlace Directo
          </button>
          <button
            className={`embed-tab-button ${activeTab === 'embed' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('embed');
              if (achievements.embedMaster) {
                confetti({
                  particleCount: 30,
                  spread: 50,
                  origin: { y: 0.6 },
                });
              }
            }}
          >
            <Code size={18} />
            Código Embebido
          </button>
          <button
            className={`embed-tab-button ${activeTab === 'customize' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('customize');
              // Desbloquear logro de personalización al visitar esta pestaña
              if (!achievements.customizer) {
                const newAchievements = { ...achievements, customizer: true };
                setAchievements(newAchievements);
                confetti({
                  particleCount: 100,
                  spread: 70,
                  origin: { y: 0.6 },
                  colors: ['#4facfe', '#00f2fe', '#00c6fb'],
                });
              }
            }}
          >
            <Settings size={18} />
            Personalizar
          </button>
          <button
            className={`embed-tab-button ${activeTab === 'qr' ? 'active' : ''}`}
            onClick={() => setActiveTab('qr')}
          >
            <Globe size={18} />
            Código QR
          </button>
          <button
            className={`embed-tab-button ${activeTab === 'whatsapp' ? 'active' : ''}`}
            onClick={() => setActiveTab('whatsapp')}
          >
            <Share2 size={16} style={{ marginRight: '5px' }} />
            WhatsApp QR
          </button>
          <button
            className={`embed-tab-button ${activeTab === 'whatsapp-business' ? 'active' : ''}`}
            onClick={() => setActiveTab('whatsapp-business')}
          >
            <MessageCircle size={16} style={{ marginRight: '5px' }} />
            WhatsApp Business
          </button>
        </div>

        <div className='embed-content'>
          {isLoading ? (
            <div className='embed-loading'>
              <div className='embed-spinner' />
              <p>Generando recursos...</p>
            </div>
          ) : (
            <>
              {activeTab === 'link' && (
                <div className='embed-section'>
                  <h3>Enlace Directo</h3>

                  <p>Comparte este enlace para que cualquier persona pueda acceder a tu Plubot:</p>
                  <div className='embed-code-container'>
                    <input type='text' value={directLink} readOnly className='embed-code-input' />
                    <button
                      className='embed-copy-button'
                      onClick={() => copyToClipboard(directLink, 'Enlace')}
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                  <div className='embed-preview'>
                    <h4>Vista previa</h4>
                    <div className='embed-link-preview'>
                      <div className='embed-preview-header'>
                        <div className='embed-preview-icon' />
                        <div className='embed-preview-title'>{plubotName}</div>
                      </div>
                      <div className='embed-preview-body'>
                        <p>Chatbot creado con Plubot</p>
                        <button
                          onClick={(event) => {
                            event.preventDefault();
                            // Usar window.location.href para forzar una navegación completa
                            globalThis.location.href = directLink;
                          }}
                          className='embed-preview-link'
                          type='button'
                        >
                          <ExternalLink size={14} /> Abrir chat
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'embed' && (
                <div className='embed-section'>
                  <h3>Código Embebido</h3>
                  <p>Copia este código HTML y pégalo en tu sitio web para integrar el Plubot:</p>
                  <div className='embed-code-container'>
                    <textarea value={embedCode} readOnly className='embed-code-textarea' />
                    <button
                      className='embed-copy-button'
                      onClick={() => copyToClipboard(embedCode, 'Código')}
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                  <div className='embed-preview'>
                    <h4>Vista previa</h4>
                    <div
                      className='embed-widget-preview'
                      style={{
                        width: customization.width,
                        height: customization.height,
                        maxWidth: '100%',
                        position: 'relative',
                      }}
                    >
                      <div
                        className='embed-widget-header'
                        style={{ backgroundColor: customization.primaryColor }}
                      >
                        <div className='embed-widget-title'>{plubotName}</div>
                      </div>
                      <div className='embed-widget-body'>
                        <div className='embed-widget-message bot'>
                          {customization.welcomeMessage}
                        </div>
                      </div>
                      <div className='embed-widget-input'>
                        <input type='text' placeholder='Escribe un mensaje...' disabled />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'qr' && <QRSection />}

              {activeTab === 'whatsapp' && <WhatsappIntegrationPanel plubotId={plubotId} />}

              {activeTab === 'whatsapp-business' && <WhatsappBusinessPanel plubotId={plubotId} />}

              {activeTab === 'export' && <ExportSection />}

              {activeTab === 'customize' && (
                <CustomizeSection
                  customization={customization}
                  handleCustomizationChange={handleCustomizationChange}
                />
              )}
            </>
          )}
        </div>

        <div className='embed-modal-footer'>
          <button className='embed-action-button secondary' onClick={onClose}>
            Cerrar
          </button>
          <button className='embed-action-button primary' onClick={handlePrimaryButtonClick}>
            {getPrimaryButtonText()}
          </button>
        </div>
      </div>
    </div>
  );
};

EmbedModal.propTypes = {
  plubotId: PropTypes.string.isRequired,
  plubotName: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onExport: PropTypes.func,
  _flowData: PropTypes.object, // Unused parameter, kept for interface consistency
};

export default EmbedModal;
