import {
  Activity,
  AlertCircle,
  Bot,
  CheckCircle,
  Loader2,
  LogOut,
  MessageCircle,
  Phone,
  Plus,
  RefreshCw,
  Shield,
  Smartphone,
  Users,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';
import PropTypes from 'prop-types';
import QRCode from 'qrcode';
import React, { useEffect, useState } from 'react';

// Status indicator component
const StatusIndicator = ({ status }) => {
  const statusConfig = {
    initializing: { icon: Loader2, text: 'Inicializando...', color: 'blue', spin: true },
    waiting_qr: { icon: Loader2, text: 'Esperando escaneo...', color: 'blue', spin: true },
    scanning: { icon: Loader2, text: 'Escaneando...', color: 'blue', spin: true },
    authenticated: { icon: CheckCircle, text: 'Autenticado', color: 'green' },
    ready: { icon: Wifi, text: 'Conectado', color: 'green' },
    connected: { icon: Wifi, text: 'Conectado', color: 'green' },
    disconnected: { icon: WifiOff, text: 'Desconectado', color: 'gray' },
    error: { icon: AlertCircle, text: 'Error de conexión', color: 'red' },
  };

  const getConfig = () => {
    switch (status) {
      case 'initializing': {
        return statusConfig.initializing;
      }
      case 'waiting_qr': {
        return statusConfig.waiting_qr;
      }
      case 'scanning': {
        return statusConfig.scanning;
      }
      case 'authenticated': {
        return statusConfig.authenticated;
      }
      case 'ready': {
        return statusConfig.ready;
      }
      case 'connected': {
        return statusConfig.connected;
      }
      case 'disconnected': {
        return statusConfig.disconnected;
      }
      case 'error': {
        return statusConfig.error;
      }
      default: {
        return statusConfig.initializing;
      }
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <div className={`share-status-indicator ${config.color}`}>
      <Icon size={16} className={config.spin ? 'share-loading-spinner' : ''} />
      <span>{config.text}</span>
    </div>
  );
};

StatusIndicator.propTypes = {
  status: PropTypes.string.isRequired,
};

// QR Code display component
const QRDisplay = ({ qrCode, status }) => {
  const [qrDataUrl, setQrDataUrl] = useState();

  useEffect(() => {
    if (qrCode && !qrCode.startsWith('data:image')) {
      // Convert text QR to image
      QRCode.toDataURL(qrCode, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch(() => {
          // Error generating QR silently
        });
    } else if (qrCode && qrCode.startsWith('data:image')) {
      setQrDataUrl(qrCode);
    }
  }, [qrCode]);

  if (qrDataUrl) {
    return <img src={qrDataUrl} alt='WhatsApp QR Code' className='share-qr-image' />;
  }

  // Solo mostrar "Inicializando..." si el estado es 'initializing'
  if (status === 'initializing') {
    return (
      <div className='share-qr-placeholder'>
        <Loader2 className='share-loading-spinner' size={48} />
        <p>Inicializando...</p>
      </div>
    );
  }

  // Si estamos esperando QR pero aún no lo tenemos, mostrar "Generando QR..."
  if (status === 'waiting' || status === 'waiting_qr') {
    return (
      <div className='share-qr-placeholder'>
        <Loader2 className='share-loading-spinner' size={48} />
        <p>Generando código QR...</p>
      </div>
    );
  }

  if (status === 'disconnected') {
    return (
      <div className='share-qr-placeholder'>
        <Smartphone size={48} />
        <p>Desconectado</p>
      </div>
    );
  }

  return (
    <div className='share-qr-placeholder'>
      <Smartphone size={48} />
      <p>Preparando conexión...</p>
    </div>
  );
};

QRDisplay.propTypes = {
  qrCode: PropTypes.string,
  status: PropTypes.string.isRequired,
};

// Connected view component
const ConnectedView = ({ phoneNumber, handleDisconnect, handleCreateNewSession, isLoading }) => (
  <div className='whatsapp-connected-container'>
    <div className='whatsapp-connected'>
      <div className='connected-header'>
        <div className='connected-animation'>
          <div className='pulse-ring' />
          <div className='pulse-ring delay-1' />
          <div className='pulse-ring delay-2' />
          <div className='connected-icon-wrapper'>
            <Wifi size={40} className='bot-icon' />
          </div>
        </div>
        <h3 className='connected-title'>¡WhatsApp Conectado!</h3>
        <div className='connection-info'>
          <div className='phone-number'>
            <Phone size={16} />
            <span>{phoneNumber || 'Obteniendo número...'}</span>
          </div>
        </div>
      </div>

      <div className='connected-features'>
        <div className='feature-item active'>
          <div className='feature-icon-wrapper'>
            <Bot size={24} />
          </div>
          <div className='feature-content'>
            <strong>Bot Activo</strong>
            <span>Respondiendo mensajes automáticamente</span>
          </div>
        </div>
        <div className='feature-item active'>
          <div className='feature-icon-wrapper'>
            <Activity size={24} />
          </div>
          <div className='feature-content'>
            <strong>Flujo Sincronizado</strong>
            <span>Ejecutando el flujo configurado</span>
          </div>
        </div>
      </div>

      <div className='session-actions'>
        <button
          className='share-button disconnect-btn'
          onClick={handleDisconnect}
          disabled={isLoading}
          type='button'
        >
          <LogOut size={16} />
          <span>Desconectar sesión</span>
        </button>
        <button
          className='share-button new-session-btn'
          onClick={handleCreateNewSession}
          disabled={isLoading}
          type='button'
        >
          <Plus size={16} />
          <span>Nueva sesión</span>
        </button>
      </div>

      <div className='connected-info'>
        <div className='info-badge'>
          <Activity size={14} />
          <span>Tu Plubot está respondiendo mensajes según el flujo configurado</span>
        </div>
      </div>
    </div>
  </div>
);

ConnectedView.propTypes = {
  phoneNumber: PropTypes.string,
  handleDisconnect: PropTypes.func.isRequired,
  handleCreateNewSession: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
};

// QR Instructions component
const QRInstructions = ({ qrCode, handleRefreshQR, isLoading }) => {
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await handleRefreshQR();
    setIsRefreshing(false);
  };

  return (
    <div className='whatsapp-qr-right'>
      <div className='share-qr-instructions'>
        <h4>Cómo conectar:</h4>
        <ol>
          <li>Abre WhatsApp en tu teléfono</li>
          <li>
            Toca <strong>Menú</strong> o <strong>Configuración</strong>
          </li>
          <li>
            Selecciona <strong>Dispositivos vinculados</strong>
          </li>
          <li>
            Toca <strong>Vincular dispositivo</strong>
          </li>
          <li>Escanea este código QR con tu teléfono</li>
        </ol>
        {qrCode && (
          <div className='qr-actions'>
            <button
              className={`whatsapp-refresh-button ${isRefreshing ? 'refreshing' : ''}`}
              onClick={handleRefresh}
              disabled={isRefreshing}
              type='button'
            >
              <RefreshCw size={16} className={isRefreshing ? 'spin' : ''} />
              <span>{isRefreshing ? 'Actualizando...' : 'Actualizar QR'}</span>
            </button>
          </div>
        )}
        {/* Error message removed from here - shown only in parent component */}
      </div>
    </div>
  );
};

QRInstructions.propTypes = {
  qrCode: PropTypes.string,
  handleRefreshQR: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
};

// Error display component
const ErrorDisplay = ({ error, handleRetry }) => {
  if (!error) return;

  return (
    <div className='share-qr-error'>
      <AlertCircle size={32} />
      <p>{error}</p>
      <button className='share-button secondary' onClick={handleRetry} type='button'>
        <RefreshCw size={16} />
        <span>Reintentar</span>
      </button>
    </div>
  );
};

ErrorDisplay.propTypes = {
  error: PropTypes.string,
  handleRetry: PropTypes.func.isRequired,
};

// Features section component
const FeaturesSection = () => (
  <div className='share-features'>
    <div className='share-feature'>
      <Shield size={20} />
      <div>
        <strong>Seguro y Privado</strong>
        <span>Encriptación de extremo a extremo</span>
      </div>
    </div>
    <div className='share-feature'>
      <Users size={20} />
      <div>
        <strong>Multiagente</strong>
        <span>Atiende múltiples conversaciones</span>
      </div>
    </div>
    <div className='share-feature'>
      <Zap size={20} />
      <div>
        <strong>Respuestas Instantáneas</strong>
        <span>Disponible 24/7 sin interrupciones</span>
      </div>
    </div>
  </div>
);

// WhatsApp info component
const WhatsAppInfo = ({ status }) => {
  if (status !== 'ready') return;

  return (
    <div className='share-whatsapp-info'>
      <h4>✅ Tu Plubot está activo en WhatsApp</h4>
      <p>
        Los mensajes que recibas en WhatsApp serán procesados automáticamente por tu Plubot usando
        el flujo configurado.
      </p>
    </div>
  );
};

WhatsAppInfo.propTypes = {
  status: PropTypes.string.isRequired,
};

export {
  StatusIndicator,
  QRDisplay,
  QRInstructions,
  ConnectedView,
  ErrorDisplay,
  FeaturesSection,
  WhatsAppInfo,
};
