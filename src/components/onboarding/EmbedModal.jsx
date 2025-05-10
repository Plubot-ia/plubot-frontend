import React, { useState, useEffect } from 'react';
import { X, Copy, Link, Code, ExternalLink, Settings, Globe } from 'lucide-react';
import useAPI from '@/hooks/useAPI';
import './EmbedModal.css';

const EmbedModal = ({ plubotId, plubotName, onClose }) => {
  const [embedCode, setEmbedCode] = useState('');
  const [directLink, setDirectLink] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('link');
  const [notification, setNotification] = useState(null);
  const [customization, setCustomization] = useState({
    theme: 'light',
    position: 'right',
    width: '350px',
    height: '500px',
    primaryColor: '#4facfe',
    welcomeMessage: '¡Hola! Soy tu asistente virtual.'
  });
  const { request } = useAPI();

  useEffect(() => {
    if (plubotId) {
      setIsLoading(true);
      
      setDirectLink(`${window.location.origin}/chat/${plubotId}`);
      setEmbedCode(generateEmbedCodeFromData(plubotId, customization));
      setQrCode(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin)}/chat/${plubotId}`);
      
      showNotification('Recursos de embebido generados correctamente', 'success');
      
      setIsLoading(false);
    }
  }, [plubotId, customization]);

  // Función para mostrar notificaciones temporales
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const generateEmbedResources = async () => {
    setIsLoading(true);
    try {
      // Intentar obtener datos del backend
      const response = await request('POST', `/api/plubots/${plubotId}/embed`, { customization });

      if (response && response.status === 'success' && response.data) {
        // Si el backend responde correctamente, usar esos datos
        setDirectLink(`${window.location.origin}/chat/${response.data.publicId}`);
        setEmbedCode(generateEmbedCodeFromData(response.data.publicId, customization));
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
    setDirectLink(`${window.location.origin}/chat/${plubotId}`);
    setEmbedCode(generateEmbedCodeFromData(plubotId, customization));
    setQrCode(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin)}/chat/${plubotId}`);
    
    // Mostrar notificación informativa
    showNotification('Usando ID real del Plubot para el embebido.', 'info');
  };

  const generateEmbedCodeFromData = (publicId, options) => {
    return `<!-- Plubot Widget -->
<div id="plubot-widget-container"></div>
<script src="${window.location.origin}/embed/plubot.js" id="plubot-script"
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
        showNotification(`${type} copiado al portapapeles`, 'success');
      })
      .catch(() => {
        showNotification('Error al copiar', 'error');
      });
  };

  const handleCustomizationChange = (key, value) => {
    setCustomization(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="embed-modal-overlay">
      <div className="embed-modal">
        <div className="embed-modal-header">
          <h2>Compartir y Embeber {plubotName}</h2>
          <button className="embed-close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {notification && (
          <div className={`embed-notification embed-notification-${notification.type}`}>
            {notification.message}
          </div>
        )}

        <div className="embed-tabs">
          <button 
            className={`embed-tab ${activeTab === 'link' ? 'active' : ''}`}
            onClick={() => setActiveTab('link')}
          >
            <Link size={16} />
            Enlace Directo
          </button>
          <button 
            className={`embed-tab ${activeTab === 'embed' ? 'active' : ''}`}
            onClick={() => setActiveTab('embed')}
          >
            <Code size={16} />
            Código Embebido
          </button>
          <button 
            className={`embed-tab ${activeTab === 'qr' ? 'active' : ''}`}
            onClick={() => setActiveTab('qr')}
          >
            <Globe size={16} />
            Código QR
          </button>
          <button 
            className={`embed-tab ${activeTab === 'customize' ? 'active' : ''}`}
            onClick={() => setActiveTab('customize')}
          >
            <Settings size={16} />
            Personalizar
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
                        <a href={directLink} target="_blank" rel="noopener noreferrer" className="embed-preview-link">
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
                          showNotification('Código QR descargado', 'success');
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
            {activeTab === 'customize' ? 'Aplicar Cambios' : 'Copiar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmbedModal;
