import {
  X,
  Copy,
  Link,
  Code,
  MessageCircle,
  Globe,
  Sparkles,
  Check,
  Loader2,
  Share2,
  Key,
  ExternalLink,
  ChevronRight,
  Shield,
  Bot,
} from 'lucide-react';
import PropTypes from 'prop-types';
import QRCode from 'qrcode';
import React, { useState, useEffect, useRef, useCallback } from 'react';

// useAPI hook removed - not needed
import useByteMessageContext from '@/hooks/useByteMessageContext';
import useModalContext from '@/hooks/useModalContext';

import WhatsAppQRPanel from './WhatsAppQRPanel';

import './ShareModal.css';

// Componente de Tab personalizado
const TabButton = ({ icon: Icon, label, isActive, onClick, badge }) => (
  <button className={`share-tab ${isActive ? 'active' : ''}`} onClick={onClick} type='button'>
    <Icon size={18} />
    <span>{label}</span>
    {badge && <span className='tab-badge'>{badge}</span>}
  </button>
);

TabButton.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  badge: PropTypes.string,
};

// Componente de Estado de Carga
const LoadingState = () => (
  <div className='share-loading'>
    <Loader2 className='share-loading-spinner' size={48} />
    <p>Preparando tu Plubot...</p>
  </div>
);

// Componente de Estado de Error
const ErrorState = ({ message, onRetry }) => (
  <div className='share-error'>
    <div className='share-error-icon'>⚠️</div>
    <h3>Algo salió mal</h3>
    <p>{message}</p>
    <button className='share-button primary' onClick={onRetry}>
      Reintentar
    </button>
  </div>
);

ErrorState.propTypes = {
  message: PropTypes.string.isRequired,
  onRetry: PropTypes.func.isRequired,
};

// Componente de Campo Copiable
const CopyField = ({ label, value, icon: Icon }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [value]);

  return (
    <div className='share-field'>
      <label className='share-field-label'>
        {Icon && <Icon size={14} />}
        {label}
      </label>
      <div className='share-field-input-group'>
        <input type='text' value={value} readOnly className='share-field-input' />
        <button
          className={`share-field-copy ${copied ? 'copied' : ''}`}
          onClick={handleCopy}
          type='button'
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>
    </div>
  );
};

CopyField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  icon: PropTypes.elementType,
};

// Panel de API
const APIPanel = ({ plubotId, apiKey }) => {
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');

  const codeExamples = {
    javascript: `// JavaScript/Node.js
const response = await fetch('https://api.plubot.com/v1/chat', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${apiKey}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    bot_id: '${plubotId}',
    message: 'Hola, necesito ayuda',
    user_id: 'user123'
  })
});

const data = await response.json();
// Response: data.response`,
    python: `# Python
import requests

response = requests.post(
    'https://api.plubot.com/v1/chat',
    headers={
        'Authorization': f'Bearer ${apiKey}',
        'Content-Type': 'application/json'
    },
    json={
        'bot_id': '${plubotId}',
        'message': 'Hola, necesito ayuda',
        'user_id': 'user123'
    }
)

data = response.json()
print(data['response'])`,
    curl: `# cURL
curl -X POST https://api.plubot.com/v1/chat \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "bot_id": "${plubotId}",
    "message": "Hola, necesito ayuda",
    "user_id": "user123"
  }'`,
  };

  return (
    <div className='share-panel api-panel'>
      <div className='share-panel-header'>
        <div className='share-panel-icon api'>
          <Key size={24} />
        </div>
        <div>
          <h3>API REST</h3>
          <p>Integra tu Plubot en cualquier aplicación con nuestra API</p>
        </div>
      </div>

      <div className='share-api-content'>
        <CopyField
          label='API Key'
          value={apiKey || `pk_live_${Date.now().toString(36).slice(-9)}`}
          icon={Key}
        />

        <CopyField label='Bot ID' value={plubotId} icon={Bot} />

        <div className='share-code-section'>
          <div className='share-code-header'>
            <div className='share-code-label'>Ejemplo de Integración</div>
            <div className='share-language-selector'>
              {Object.keys(codeExamples).map((lang) => (
                <button
                  key={lang}
                  className={`share-lang-btn ${selectedLanguage === lang ? 'active' : ''}`}
                  onClick={() => setSelectedLanguage(lang)}
                >
                  {(() => {
                    if (lang === 'javascript') return 'JS';
                    if (lang === 'python') return 'Python';
                    return 'cURL';
                  })()}
                </button>
              ))}
            </div>
          </div>
          <pre className='share-code-block'>
            <code>
              {(() => {
                if (selectedLanguage === 'javascript') return codeExamples.javascript;
                if (selectedLanguage === 'python') return codeExamples.python;
                return codeExamples.curl;
              })()}
            </code>
          </pre>
        </div>

        <div className='share-api-docs'>
          <a href='/docs/api' className='share-docs-link'>
            <span>Ver documentación completa</span>
            <ExternalLink size={16} />
          </a>
        </div>
      </div>
    </div>
  );
};

APIPanel.propTypes = {
  plubotId: PropTypes.string.isRequired,
  apiKey: PropTypes.string,
};

// Panel de Embed
const EmbedPanel = ({ plubotId, customization, onCustomizationChange }) => {
  const embedCode = `<!-- Plubot Widget -->
<script src="https://cdn.plubot.com/widget.js"></script>
<script>
  Plubot.init({
    botId: '${plubotId}',
    position: '${customization.position}',
    theme: '${customization.theme}',
    primaryColor: '${customization.primaryColor}',
    size: '${customization.size}'
  });
</script>`;

  return (
    <div className='share-panel embed-panel'>
      <div className='share-panel-header'>
        <div className='share-panel-icon embed'>
          <Code size={24} />
        </div>
        <div>
          <h3>Embed en tu Sitio Web</h3>
          <p>Añade el widget de chat a tu página web con una línea de código</p>
        </div>
      </div>

      <div className='share-embed-content'>
        <div className='share-customization'>
          <h4>Personalización</h4>

          <div className='share-custom-group'>
            <div className='share-custom-label'>Posición</div>
            <div className='share-button-group'>
              {['right', 'left'].map((pos) => (
                <button
                  key={pos}
                  className={`share-option-btn ${customization.position === pos ? 'active' : ''}`}
                  onClick={() => onCustomizationChange('position', pos)}
                >
                  {pos === 'right' ? 'Derecha' : 'Izquierda'}
                </button>
              ))}
            </div>
          </div>

          <div className='share-custom-group'>
            <div className='share-custom-label'>Tema</div>
            <div className='share-button-group'>
              {['light', 'dark', 'auto'].map((theme) => (
                <button
                  key={theme}
                  className={`share-option-btn ${customization.theme === theme ? 'active' : ''}`}
                  onClick={() => onCustomizationChange('theme', theme)}
                >
                  {(() => {
                    if (theme === 'light') return '☀️ Claro';
                    if (theme === 'dark') return '🌙 Oscuro';
                    return '🎨 Auto';
                  })()}
                </button>
              ))}
            </div>
          </div>

          <div className='share-custom-group'>
            <div className='share-custom-label'>Color Principal</div>
            <div className='share-color-picker'>
              <input
                type='color'
                value={customization.primaryColor}
                onChange={(event) => onCustomizationChange('primaryColor', event.target.value)}
              />
              <span>{customization.primaryColor}</span>
            </div>
          </div>

          <div className='share-custom-group'>
            <div className='share-custom-label'>Tamaño</div>
            <div className='share-button-group'>
              {['small', 'medium', 'large'].map((size) => (
                <button
                  key={size}
                  className={`share-option-btn ${customization.size === size ? 'active' : ''}`}
                  onClick={() => onCustomizationChange('size', size)}
                >
                  {(() => {
                    if (size === 'small') return 'Pequeño';
                    if (size === 'medium') return 'Mediano';
                    return 'Grande';
                  })()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className='share-preview'>
          <h4>Vista Previa</h4>
          <div className='share-preview-container'>
            <div className='share-preview-website'>
              <div className='share-preview-header'>
                <div className='share-preview-dots'>
                  <span />
                  <span />
                  <span />
                </div>
              </div>
              <div className='share-preview-content'>
                <div
                  className={`share-preview-widget ${customization.position} ${customization.size}`}
                  style={{ backgroundColor: customization.primaryColor }}
                >
                  <MessageCircle size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='share-code-section'>
          <div className='share-code-label'>Código de Integración</div>
          <pre className='share-code-block'>
            <code>{embedCode}</code>
          </pre>
          <button className='share-button secondary'>
            <Copy size={16} />
            Copiar Código
          </button>
        </div>
      </div>
    </div>
  );
};

EmbedPanel.propTypes = {
  plubotId: PropTypes.string.isRequired,
  customization: PropTypes.object.isRequired,
  onCustomizationChange: PropTypes.func.isRequired,
};

// Panel de Link Directo
const LinkPanel = ({ plubotId }) => {
  const baseUrl = globalThis.location.origin;
  const chatUrl = `${baseUrl}/chat/${plubotId}`;
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    const generateQR = async () => {
      try {
        const qr = await QRCode.toDataURL(chatUrl, {
          width: 200,
          margin: 2,
          color: {
            dark: '#1a1a2e',
            light: '#ffffff',
          },
        });
        setQrCodeUrl(qr);
      } catch {
        // Error generating QR
      }
    };

    generateQR();
  }, [chatUrl]);

  return (
    <div className='share-panel link-panel'>
      <div className='share-panel-header'>
        <div className='share-panel-icon link'>
          <Link size={24} />
        </div>
        <div>
          <h3>Link Directo</h3>
          <p>Comparte tu Plubot con un enlace único</p>
        </div>
      </div>

      <div className='share-link-content'>
        <CopyField label='URL del Chat' value={chatUrl} icon={Globe} />

        <div className='share-link-preview'>
          <a href={chatUrl} target='_blank' rel='noopener noreferrer' className='share-link-card'>
            <div className='share-link-card-icon'>
              <ExternalLink size={20} />
            </div>
            <div className='share-link-card-content'>
              <strong>Abrir Chat</strong>
              <span>{chatUrl}</span>
            </div>
            <ChevronRight size={20} />
          </a>
        </div>

        <div className='share-qr-mini'>
          <h4>Código QR</h4>
          <div className='share-qr-mini-container'>
            {qrCodeUrl && <img src={qrCodeUrl} alt='QR Code' />}
          </div>
        </div>

        <div className='share-social'>
          <h4>Compartir en Redes</h4>
          <div className='share-social-buttons'>
            <button className='share-social-btn twitter'>
              <Share2 size={18} />
              Twitter
            </button>
            <button className='share-social-btn linkedin'>
              <Share2 size={18} />
              LinkedIn
            </button>
            <button className='share-social-btn facebook'>
              <Share2 size={18} />
              Facebook
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

LinkPanel.propTypes = {
  plubotId: PropTypes.string.isRequired,
};

// Modal Principal
const ShareModal = ({ plubotId, plubotName, onClose, nodes, edges }) => {
  const { showNotification } = useByteMessageContext();
  const _showNotification = showNotification; // Reference to avoid unused var
  const { closeModal } = useModalContext();
  const [activeTab, setActiveTab] = useState('whatsapp');
  const [isLoading, setIsLoading] = useState(false);
  const _setIsLoading = setIsLoading; // Reference to avoid unused var
  const [error, setError] = useState();
  const [customization, setCustomization] = useState({
    theme: 'light',
    position: 'right',
    primaryColor: '#4facfe',
    size: 'medium',
  });

  const modalRef = useRef(null);

  // Animación de entrada
  useEffect(() => {
    if (modalRef.current) {
      modalRef.current.classList.add('share-modal-enter');
    }
  }, []);

  const handleClose = () => {
    if (modalRef.current) {
      modalRef.current.classList.add('share-modal-exit');
      setTimeout(() => {
        if (closeModal) {
          closeModal('embedModal');
        } else if (onClose) {
          onClose();
        }
      }, 300);
    }
  };

  const handleCustomizationChange = (key, value) => {
    setCustomization((previous) => ({ ...previous, [key]: value }));
  };

  const tabs = [
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, badge: 'Popular' },
    { id: 'api', label: 'API', icon: Key },
    { id: 'embed', label: 'Embed', icon: Code },
    { id: 'link', label: 'Link', icon: Link },
  ];

  const renderActivePanel = () => {
    if (isLoading) return <LoadingState />;
    if (error) return <ErrorState message={error} onRetry={() => setError()} />;

    switch (activeTab) {
      case 'whatsapp': {
        return (
          activeTab === 'whatsapp' && (
            <WhatsAppQRPanel plubotId={plubotId} nodes={nodes} edges={edges} />
          )
        );
      }
      case 'api': {
        return <APIPanel plubotId={plubotId} apiKey='pk_live_example123' />;
      }
      case 'embed': {
        return (
          <EmbedPanel
            plubotId={plubotId}
            customization={customization}
            onCustomizationChange={handleCustomizationChange}
          />
        );
      }
      case 'link': {
        return <LinkPanel plubotId={plubotId} />;
      }
      default:
    }
  };

  return (
    <div
      className='share-modal-overlay'
      onClick={handleClose}
      onKeyDown={(event) => {
        if (event.key === 'Escape') handleClose();
      }}
      role='button'
      tabIndex={0}
    >
      <div
        ref={modalRef}
        className='share-modal'
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
        role='presentation'
      >
        <div className='share-modal-header'>
          <div className='share-modal-title'>
            <Sparkles className='share-title-icon' size={24} />
            <div>
              <h2>Vincula tu Plubot</h2>
              <p>Conecta &ldquo;{plubotName || 'Mi Plubot'}&rdquo; con el mundo</p>
            </div>
          </div>
          <button className='share-modal-close' onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <div className='share-modal-tabs'>
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              icon={tab.icon}
              label={tab.label}
              isActive={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              badge={tab.badge}
            />
          ))}
        </div>

        <div className='share-modal-content'>{renderActivePanel()}</div>

        <div className='share-modal-footer'>
          <div className='share-footer-info'>
            <Shield size={16} />
            <span>Todas las integraciones son seguras y encriptadas</span>
          </div>
          <button className='share-button primary' onClick={handleClose}>
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};

ShareModal.propTypes = {
  plubotId: PropTypes.string.isRequired,
  plubotName: PropTypes.string,
  onClose: PropTypes.func,
  nodes: PropTypes.array,
  edges: PropTypes.array,
};

export default ShareModal;
