import React, { useState, useEffect, useRef } from 'react';
import { X, Copy, Link, Code, ExternalLink, Settings, Globe, Download, Share2, Award, Zap, Gift, Heart, Star, Trophy } from 'lucide-react';
import useAPI from '@/hooks/useAPI';
import './EmbedModal.css';
import confetti from 'canvas-confetti';
// Importar el contexto global
import { useGlobalContext } from '../../../context/GlobalProvider';
// Si no tienes canvas-confetti, puedes instalarlo con: npm install canvas-confetti

const EmbedModal = ({ plubotId, plubotName, onClose, onExport, flowData }) => {
  // Usar el contexto global
  const { showNotification, closeModal } = useGlobalContext();
  
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
    welcomeMessage: '¡Hola! Soy tu asistente virtual.'
  });
  const { request } = useAPI();

  // Referencia para el elemento donde lanzar confetti
  const confettiRef = useRef(null);
  
  // Estado para gamificación
  const [shareCount, setShareCount] = useState(0);
  const [achievements, setAchievements] = useState({
    firstShare: false,
    socialMedia: false,
    embedMaster: false,
    customizer: false
  });
  
  useEffect(() => {
    if (plubotId) {
      setIsLoading(true);
      
      // Usar la URL completa para el chat
      const chatUrl = `${window.location.origin}/chat/${plubotId}`;
      setDirectLink(chatUrl);
      setEmbedCode(generateEmbedCodeFromData(plubotId, customization));
      setQrCode(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(chatUrl)}`);
      
      // Lanzar confetti cuando se genera el código
      setTimeout(() => {
        if (confettiRef.current) {
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      }, 500);
      
      // No mostrar notificación automática para evitar duplicados
      // La notificación ahora se maneja en EpicHeader al abrir el modal
      
      setIsLoading(false);
    }
  }, [plubotId, customization]);

  // La función showNotification ahora proviene del contexto global

  const generateEmbedResources = async () => {
    setIsLoading(true);
    try {
      // Intentar obtener datos del backend
      const response = await request('POST', `/api/plubots/${plubotId}/embed`, { customization });

      if (response && response.status === 'success' && response.data) {
        // Si el backend responde correctamente, usar esos datos
        const baseUrl = window.location.origin.replace('www.', '');
        setDirectLink(`${baseUrl}/chat/${response.data.publicId}`);
        setEmbedCode(generateEmbedCodeFromData(response.data.publicId, customization, baseUrl));
        setQrCode(response.data.qrCodeUrl);
        showNotification('Recursos de embebido generados correctamente', 'success');
      } else {
        // Si hay un error en la respuesta del backend, usar el ID real del plubot
        console.warn('Respuesta inesperada del backend:', response);
        useRealPlubotId();
      }
    } catch (error) {
      console.error('Error generando recursos de embebido:', error);
      useRealPlubotId();
    } finally {
      setIsLoading(false);
    }
  };

  // Función para usar el ID real del plubot cuando el backend falla
  const useRealPlubotId = () => {
    // Usamos directamente el plubotId real en lugar de generar uno temporal
    const baseUrl = window.location.origin.replace('www.', '');
    setDirectLink(`${baseUrl}/chat/${plubotId}`);
    setEmbedCode(generateEmbedCodeFromData(plubotId, customization, baseUrl));
    setQrCode(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(baseUrl)}/chat/${plubotId}`);
    
    // Mostrar notificación informativa
    showNotification('Usando ID real del Plubot para el embebido.', 'info');
  };

  const generateEmbedCodeFromData = (publicId, options, baseUrl = window.location.origin) => {
    return `<!-- Plubot Widget -->
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
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        // Incrementar contador de comparticiones
        setShareCount(prev => prev + 1);
        
        // Verificar logros
        const newAchievements = {...achievements};
        
        if (!newAchievements.firstShare) {
          newAchievements.firstShare = true;
          showNotification('¡Logro desbloqueado! Primera compartición', 'achievement');
          
          // Lanzar confetti para celebrar el logro
          confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.6 },
            colors: ['#FFD700', '#FFA500', '#FF4500']
          });
        }
        
        if (shareCount >= 5 && !newAchievements.embedMaster) {
          newAchievements.embedMaster = true;
          showNotification('¡Logro desbloqueado! Maestro del Embebido', 'achievement');
        }
        
        setAchievements(newAchievements);
        
        showNotification(`${type} copiado al portapapeles! ¡Comparte tu creación!`, 'success');
      })
      .catch(err => {
        console.error('Error al copiar:', err);
        showNotification(`Error al copiar ${type.toLowerCase()}`, 'error');
      });
  };

  const handleCustomizationChange = (key, value) => {
    setCustomization(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Componente de estrellas y nebulosas para el fondo de universo
  const UniverseBackground = () => {
    // Generar estrellas con diferentes tamaños, opacidades y velocidades de parpadeo
    const renderStars = () => {
      const stars = [];
      const starCount = 100; // Cantidad de estrellas
      
      for (let i = 0; i < starCount; i++) {
        // Tamaño aleatorio para las estrellas
        const size = Math.random() * 3 + 1;
        // Colores para las estrellas
        const colors = ['#fff', '#8df9ff', '#c8f4ff', '#e6fbff', '#d9e8ff'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        // Duración del parpadeo
        const twinkleDuration = 3 + Math.random() * 7 + 's';
        // Retraso del parpadeo
        const twinkleDelay = Math.random() * 10 + 's';
        // Opacidad base
        const opacity = 0.3 + Math.random() * 0.7;
        // Tamaño del brillo
        const glowSize = size * (1 + Math.random());
        
        stars.push(
          <div 
            key={`star-${i}`} 
            className="star"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              '--star-size': `${size}px`,
              '--star-opacity': opacity,
              '--twinkle-duration': twinkleDuration,
              '--twinkle-delay': twinkleDelay,
              '--glow-size': `${glowSize}px`,
              '--glow-color': color,
              backgroundColor: color
            }}
          />
        );
      }
      
      return stars;
    };
    
    return (
      <div className="stars-container">
        {renderStars()}
        <div className="nebula nebula-1"></div>
        <div className="nebula nebula-2"></div>
        <div className="nebula nebula-3"></div>
      </div>
    );
  };

  return (
    <div className="embed-modal-overlay" ref={confettiRef}>
      <UniverseBackground />
      <div className="embed-modal">
        <div className="embed-modal-header">
          <h2><Share2 size={24} className="share-icon" /> ¡Comparte tu Plubot!</h2>
          <button 
            className="embed-modal-close-button" 
            aria-label="Cerrar modal"
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
        <div className="achievements-panel">
          <h3><Trophy size={20} /> Tus Logros</h3>
          <div className="achievements-grid">
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

        <div className="embed-tabs">
          <button 
            className={`embed-tab-button ${activeTab === 'link' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('link');
              if (achievements.firstShare) {
                confetti({
                  particleCount: 30,
                  spread: 50,
                  origin: { y: 0.6 }
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
                  origin: { y: 0.6 }
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
                const newAchievements = {...achievements, customizer: true};
                setAchievements(newAchievements);
                confetti({
                  particleCount: 100,
                  spread: 70,
                  origin: { y: 0.6 },
                  colors: ['#4facfe', '#00f2fe', '#00c6fb']
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
        </div>

        <div className="embed-content">
          {isLoading ? (
            <div className="embed-loading">
              <div className="embed-spinner"></div>
              <p>Generando recursos...</p>
            </div>
          ) : (
            <>
              {activeTab === 'link' && (
                <div className="embed-section">
                  <h3>Enlace Directo</h3>
                  <div className="embed-warning" style={{
                    backgroundColor: '#fff3cd',
                    color: '#856404',
                    padding: '10px',
                    borderRadius: '5px',
                    marginBottom: '15px',
                    border: '1px solid #ffeeba'
                  }}>
                    <p><strong>⚠️ Aviso importante:</strong> Actualmente hay un problema técnico con el acceso directo al chat embebido. 
                    Estamos trabajando para solucionarlo. Mientras tanto, puedes acceder al chat de las siguientes maneras:</p>
                    <ul style={{ paddingLeft: '20px', marginTop: '5px' }}>
                      <li>Desde la página principal, navega a "Mis Plubots" y selecciona este Plubot</li>
                      <li>Comparte el código embebido para integrarlo en tu sitio web</li>
                    </ul>
                  </div>
                  <p>Comparte este enlace para que cualquier persona pueda acceder a tu Plubot:</p>
                  <div className="embed-code-container">
                    <input 
                      type="text" 
                      value={directLink} 
                      readOnly 
                      className="embed-code-input"
                    />
                    <button 
                      className="embed-copy-button"
                      onClick={() => copyToClipboard(directLink, 'Enlace')}
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                  <div className="embed-preview">
                    <h4>Vista previa</h4>
                    <div className="embed-link-preview">
                      <div className="embed-preview-header">
                        <div className="embed-preview-icon"></div>
                        <div className="embed-preview-title">{plubotName}</div>
                      </div>
                      <div className="embed-preview-body">
                        <p>Chatbot creado con Plubot</p>
                        <a 
                          onClick={(e) => {
                            e.preventDefault();
                            // Usar window.location.href para forzar una navegación completa
                            window.location.href = directLink;
                          }} 
                          style={{ cursor: 'pointer' }}
                          className="embed-preview-link"
                        >
                          <ExternalLink size={14} /> Abrir chat
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'embed' && (
                <div className="embed-section">
                  <h3>Código Embebido</h3>
                  <p>Copia este código HTML y pégalo en tu sitio web para integrar el Plubot:</p>
                  <div className="embed-code-container">
                    <textarea 
                      value={embedCode} 
                      readOnly 
                      className="embed-code-textarea"
                    />
                    <button 
                      className="embed-copy-button"
                      onClick={() => copyToClipboard(embedCode, 'Código')}
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                  <div className="embed-preview">
                    <h4>Vista previa</h4>
                    <div className="embed-widget-preview" style={{
                      width: customization.width,
                      height: customization.height,
                      maxWidth: '100%',
                      position: 'relative'
                    }}>
                      <div className="embed-widget-header" style={{ backgroundColor: customization.primaryColor }}>
                        <div className="embed-widget-title">{plubotName}</div>
                      </div>
                      <div className="embed-widget-body">
                        <div className="embed-widget-message bot">
                          {customization.welcomeMessage}
                        </div>
                      </div>
                      <div className="embed-widget-input">
                        <input type="text" placeholder="Escribe un mensaje..." disabled />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'qr' && (
                <div className="embed-section">
                  <h3>Código QR</h3>
                  <p>Escanea este código QR para acceder al Plubot desde cualquier dispositivo:</p>
                  <div className="embed-qr-container">
                    {qrCode ? (
                      <img src={qrCode} alt="QR Code" className="embed-qr-image" />
                    ) : (
                      <div className="embed-qr-placeholder">
                        <p>No se pudo generar el código QR</p>
                      </div>
                    )}
                    <button 
                      className="embed-download-button"
                      onClick={() => {
                        if (qrCode) {
                          const link = document.createElement('a');
                          link.href = qrCode;
                          link.download = `plubot-${plubotId}-qr.png`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        } else {
                          showNotification('No hay código QR para descargar', 'error');
                        }
                      }}
                    >
                      Descargar QR
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'export' && (
                <div className="embed-section">
                  <h3>Exportar Flujo</h3>
                  <p>Exporta tu flujo en formato JSON para respaldarlo o compartirlo con otros usuarios:</p>
                  <div className="embed-export-actions" style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
                    <button 
                      className="embed-action-button primary"
                      style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
                      onClick={onExport}
                    >
                      <Download size={18} />
                      Descargar JSON
                    </button>
                  </div>
                  <div style={{ marginTop: '20px', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px', border: '1px solid #e9ecef' }}>
                    <h4 style={{ marginTop: '0', color: '#495057' }}>¿Qué contiene el archivo exportado?</h4>
                    <ul style={{ paddingLeft: '20px', color: '#6c757d' }}>
                      <li>Todos los nodos de tu flujo con sus configuraciones</li>
                      <li>Todas las conexiones entre nodos</li>
                      <li>Posiciones de los elementos en el editor</li>
                      <li>Propiedades y datos específicos de cada nodo</li>
                    </ul>
                    <p style={{ marginBottom: '0', color: '#6c757d' }}>Este archivo puede ser importado posteriormente para restaurar tu flujo exactamente como lo dejaste.</p>
                  </div>
                </div>
              )}

              {activeTab === 'customize' && (
                <div className="embed-section">
                  <h3>Personalizar Apariencia</h3>
                  <div className="embed-customize-form">
                    <div className="embed-form-group">
                      <label>Tema:</label>
                      <select 
                        value={customization.theme}
                        onChange={(e) => handleCustomizationChange('theme', e.target.value)}
                      >
                        <option value="light">Claro</option>
                        <option value="dark">Oscuro</option>
                        <option value="auto">Automático</option>
                      </select>
                    </div>
                    <div className="embed-form-group">
                      <label>Posición:</label>
                      <select 
                        value={customization.position}
                        onChange={(e) => handleCustomizationChange('position', e.target.value)}
                      >
                        <option value="right">Derecha</option>
                        <option value="left">Izquierda</option>
                        <option value="center">Centro</option>
                      </select>
                    </div>
                    <div className="embed-form-group">
                      <label>Ancho:</label>
                      <input 
                        type="text" 
                        value={customization.width}
                        onChange={(e) => handleCustomizationChange('width', e.target.value)}
                      />
                    </div>
                    <div className="embed-form-group">
                      <label>Alto:</label>
                      <input 
                        type="text" 
                        value={customization.height}
                        onChange={(e) => handleCustomizationChange('height', e.target.value)}
                      />
                    </div>
                    <div className="embed-form-group">
                      <label>Color Primario:</label>
                      <input 
                        type="color" 
                        value={customization.primaryColor}
                        onChange={(e) => handleCustomizationChange('primaryColor', e.target.value)}
                      />
                    </div>
                    <div className="embed-form-group">
                      <label>Mensaje de Bienvenida:</label>
                      <textarea 
                        value={customization.welcomeMessage}
                        onChange={(e) => handleCustomizationChange('welcomeMessage', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="embed-modal-footer">
          <button className="embed-action-button secondary" onClick={onClose}>
            Cerrar
          </button>
          <button 
            className="embed-action-button primary"
            onClick={() => {
              if (activeTab === 'link') {
                copyToClipboard(directLink, 'Enlace');
              } else if (activeTab === 'embed') {
                copyToClipboard(embedCode, 'Código');
              } else if (activeTab === 'customize') {
                useRealPlubotId();
                showNotification('Cambios aplicados', 'success');
              }
            }}
          >
            {activeTab === 'customize' ? 'Aplicar Cambios' : activeTab === 'export' ? 'Exportar' : 'Copiar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmbedModal;
