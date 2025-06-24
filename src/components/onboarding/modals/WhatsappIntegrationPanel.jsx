import React, { useState, useEffect, useCallback, useRef } from 'react';

import './WhatsappIntegrationPanel.css';
import useAPI from '@/hooks/useAPI';

import { useGlobalContext } from '../../../context/GlobalProvider';


import { QrCode, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

const WhatsappIntegrationPanel = ({ plubotId }) => {
  const { showNotification } = useGlobalContext();
  const { request, isLoading: isApiLoading } = useAPI();

  const [connection, setConnection] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isPolling, setIsPolling] = useState(false);
  const prevConnectionStatus = useRef();

  const checkStatus = useCallback(async () => {
    try {
      const response = await request('GET', `whatsapp/status/${plubotId}`);
      if (response) {
        setConnection(response);
        if (response.status === 'connected') {
          setIsPolling(false);
          setQrCodeUrl('');
        }
      }
    } catch (error) {
      // Silently fail, the polling will continue
    }
  }, [plubotId, request]);

  useEffect(() => {
    checkStatus(); // Check status on initial load
  }, [checkStatus]);

  useEffect(() => {
    let intervalId;
    if (isPolling) {
      intervalId = setInterval(checkStatus, 5000); // Poll every 5 seconds
    }
    return () => clearInterval(intervalId);
  }, [isPolling, checkStatus]);

  useEffect(() => {
    if (connection?.status === 'connected' && prevConnectionStatus.current !== 'connected') {
      showNotification('¡Conexión con WhatsApp establecida!', 'success');
    }
    prevConnectionStatus.current = connection?.status;
  }, [connection, showNotification]);

  const handleInitiateConnection = async () => {
    try {
      const response = await request('POST', 'whatsapp/initiate', { plubotId });
      if (response && response.qrCodeUrl) {
        setQrCodeUrl(response.qrCodeUrl);
        setIsPolling(true);
        showNotification('Escanea el código QR con tu WhatsApp', 'info');
      } else {
        showNotification('No se pudo generar el código QR. Inténtalo de nuevo.', 'error');
      }
    } catch (error) {
      showNotification(error.message || 'Error al iniciar la conexión.', 'error');
    }
  };

  const handleDisconnect = async () => {
    try {
      await request('POST', 'whatsapp/disconnect', { plubotId });
      setConnection(null);
      setIsPolling(false);
      setQrCodeUrl('');
      showNotification('Se ha desconectado de WhatsApp.', 'success');
    } catch (error) {
      showNotification(error.message || 'Error al desconectar.', 'error');
    }
  };

  const renderContent = () => {
    if (isApiLoading && !connection) {
      return <div className="loading-spinner">Cargando estado...</div>;
    }

    if (connection && connection.status === 'connected') {
      return (
        <div className="connection-status connected">
          <CheckCircle size={40} color="#25D366" />
          <h4>¡Conectado!</h4>
          <p>Este flujo está activo en el número <strong>{connection.whatsappNumber || 'tu número'}</strong>.</p>
          <button className="whatsapp-button disconnect" onClick={handleDisconnect} disabled={isApiLoading}>
            <XCircle size={18} />
                        Desconectar
          </button>
        </div>
      );
    }

    if (qrCodeUrl) {
      return (
        <div className="qr-code-container">
          <h4>Escanea para Conectar</h4>
          <p>Abre WhatsApp en tu teléfono y escanea este código para vincular tu número.</p>
          <img src={qrCodeUrl} alt="WhatsApp QR Code" />
          {isPolling && (
            <div className="polling-indicator">
              <RefreshCw size={16} className="spin" />
              <span>Esperando confirmación...</span>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="initiate-connection">
        <QrCode size={40} color="#6c757d" />
        <h4>El flujo no está conectado</h4>
        <p>Genera un código QR para vincular este flujo a un número de WhatsApp.</p>
        <button className="whatsapp-button" onClick={handleInitiateConnection} disabled={isApiLoading}>
                    Generar QR de Conexión
        </button>
      </div>
    );
  };

  return (
    <div className="whatsapp-integration-panel">
      <h3>📲 Conectar a WhatsApp</h3>
      <p className="whatsapp-explanation">
                Conecta este flujo a tu cuenta de WhatsApp para que Plubot interactúe automáticamente con tus clientes. La conexión se realiza escaneando un código QR.
      </p>
      {renderContent()}
    </div>
  );
};

export default WhatsappIntegrationPanel;
