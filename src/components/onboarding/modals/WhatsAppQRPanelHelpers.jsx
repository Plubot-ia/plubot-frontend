import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

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
  Smartphone,
  UserX,
  Wifi,
  WifiOff,
} from 'lucide-react';
import QRCode from 'qrcode';

// Status indicator component
export const StatusIndicator = ({ status }) => {
  const statusConfig = {
    initializing: { icon: Loader2, text: 'Inicializando...', color: 'blue', spin: true },
    waiting_qr: { icon: Loader2, text: 'Esperando escaneo...', color: 'blue', spin: true },
    scanning: { icon: Loader2, text: 'Escaneando...', color: 'blue', spin: true },
    authenticated: { icon: CheckCircle, text: 'Autenticado', color: 'green' },
    ready: { icon: Wifi, text: 'Conectado', color: 'green' },
    disconnected: { icon: WifiOff, text: 'Desconectado', color: 'gray' },
    error: { icon: AlertCircle, text: 'Error de conexión', color: 'red' },
  };

  const config = status in statusConfig ? statusConfig[status] : statusConfig.error;
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
export const QRCodeDisplay = ({ qrCode, status }) => {
  const [qrDataUrl, setQrDataUrl] = useState(null);

  useEffect(() => {
    if (qrCode && !qrCode.startsWith('data:image')) {
      // Convert text QR to image
      QRCode.toDataURL(qrCode, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error('Error generating QR:', err));
    } else if (qrCode && qrCode.startsWith('data:image')) {
      setQrDataUrl(qrCode);
    }
  }, [qrCode]);

  if (qrDataUrl) {
    return <img src={qrDataUrl} alt='WhatsApp QR Code' className='share-qr-image' />;
  }

  if (status === 'disconnected') {
    return (
      <div className='share-qr-placeholder'>
        <Loader2 className='share-loading-spinner' size={48} />
        <p>Esperando código QR...</p>
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

QRCodeDisplay.propTypes = {
  qrCode: PropTypes.string,
  status: PropTypes.string.isRequired,
};

// Connected view component
export const ConnectedView = ({
  phoneNumber,
  handleDisconnect,
  handleCreateNewSession,
  isLoading,
}) => (
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
        {phoneNumber && phoneNumber !== '+1234567890' && (
          <div className='connection-info'>
            <div className='phone-number'>
              <Phone size={16} />
              <span>{phoneNumber}</span>
            </div>
          </div>
        )}
      </div>

      <div className='connected-features'>
        <div className='feature-item'>
          <Bot size={20} />
          <div>
            <strong>Bot Activo</strong>
            <span>Respondiendo mensajes automáticamente</span>
          </div>
        </div>
        <div className='feature-item'>
          <Activity size={20} />
          <div>
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
export const QRInstructions = ({
  qrCode,
  handleRefreshQR,
  handleRetry,
  error,
  retryCount,
  isLoading,
}) => (
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
            className='share-button refresh-btn'
            onClick={handleRefreshQR}
            disabled={isLoading}
            type='button'
          >
            <RefreshCw size={16} />
            <span>Actualizar QR</span>
          </button>
        </div>
      )}
      {/* Error message removed from here - shown only in parent component */}
    </div>
  </div>
);

QRInstructions.propTypes = {
  qrCode: PropTypes.string,
  handleRefreshQR: PropTypes.func.isRequired,
  handleRetry: PropTypes.func.isRequired,
  error: PropTypes.string,
  retryCount: PropTypes.number.isRequired,
  isLoading: PropTypes.bool.isRequired,
};
